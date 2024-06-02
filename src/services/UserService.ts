import crypto from "crypto";
import sha1 from "sha1";
import UserDao from "../dao/UserDao";
import User from "../models/User";
import { UserPayment } from "../models/UserPayment";
import ServiceError from "../utils/ServiceError";
import { validateLegacyPassword } from "./AuthenticationService";
import UserDatabaseObject from "../interfaces/UserDatabaseObject";
import { hashPasswordAsync, validatePasswordHashAsync } from "../utils/UserHelpers";
import NatsService from "../services/NatsService";
import { JetStreamPublishOptions } from "nats";

class UserService {
  public async fetchUser(userId: number): Promise<User> {
    const result = await UserDao.findOne(userId);
    if (!result) {
      throw new ServiceError(404, "User not found");
    }

    return new User(result);
  }

  public async fetchAllUsers(): Promise<User[]> {
    const results = await UserDao.findAll();
    return results.map(dbObj => new User(dbObj));
  }

  public async fetchAllUnpaidUsers(): Promise<User[]> {
    const results = await UserDao.findAllByUnpaidPayment();
    return results.map(dbObj => new User(dbObj));
  }

  /**
   * Searches all users with the given SQL WHERE condition.
   */
  public async searchUsers(searchTerm: string): Promise<User[]> {
    const results = await UserDao.findWhere(searchTerm);
    if (!results.length) {
      return this.fetchAllUsers();
    }

    return results.map(res => new User(res));
  }

  /**
   * Fetches users with selected fields and those who match the conditions.
   */
  public async fetchAllWithSelectedFields(fields?: string[], conditions?: string[]): Promise<UserPayment[]> {
    let conditionQuery: string[] = [];
    if (conditions) {
      conditionQuery = [];
      conditions.forEach(condition => {
        switch (condition) {
          case "member":
            conditionQuery.push("(membership <> 'ei-jasen' and membership <> 'erotettu')");
            break;
          case "nonmember":
            conditionQuery.push("membership = 'ei-jasen'");
            break;
          case "paid":
            conditionQuery.push("paid is not null");
            break;
          case "nonpaid":
            conditionQuery.push("(paid is null)");
            break;
          case "revoked":
            conditionQuery.push("deleted = 1");
            break;
          default:
            break;
        }
      });
    }

    const results = await UserDao.findAll(fields, conditionQuery);
    if (!results.length) {
      throw new ServiceError(404, "No results returned");
    }

    // @ts-ignore
    // FIXME: Wrong typings
    return results.map(u => new UserPayment(u));
  }

  public async getUserWithUsernameAndPassword(username: string, password: string): Promise<User> {
    const dbUser = await UserDao.findByUsername(username);
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user = new User(dbUser);

    // if user has bcrypt hash instead of the legacy hash
    if (user.passwordHash) {
      if (await validatePasswordHashAsync(password, user.passwordHash)) {
        return user;
      }

      throw new ServiceError(401, "Invalid username or password");
    }

    const isPasswordCorrect = await validateLegacyPassword(password, user.salt, user.hashedPassword);
    if (isPasswordCorrect) {
      return user;
    }

    throw new ServiceError(401, "Invalid username or password");
  }

  public async tryReserveUsername(username: string): Promise<boolean> {
    try {
      await UserDao.reserveUsername(username);
      return true;
    } catch (err) {
      if ("code" in err && err.code === "ER_DUP_ENTRY") {
        return false;
      }

      throw err;
    }
  }

  public async tryReserveEmail(email: string): Promise<boolean> {
    try {
      await UserDao.reserveEmail(email);
      return true;
    } catch (err) {
      if ("code" in err && err.code === "ER_DUP_ENTRY") {
        return false;
      }

      throw err;
    }
  }

  public async createUser(userData: User, rawPassword: string): Promise<number> {
    let usernameCaptured = false;
    let emailCaptured = false;

    try {
      emailCaptured = await this.tryReserveEmail(userData.email);

      if (!emailCaptured) {
        throw new ServiceError(400, "Email address already in use!");
      }

      usernameCaptured = await this.tryReserveUsername(userData.username);

      if (!usernameCaptured) {
        throw new ServiceError(400, "Username already in use!");
      }

      userData.id = await UserDao.reserveId();

      const { password, salt } = await mkHashedPassword(rawPassword);
      userData.hashedPassword = password;
      userData.salt = salt;
      userData.passwordHash = await hashPasswordAsync(rawPassword);

      const nats = await NatsService.get();

      await nats.publish(
        `members.${userData.id}`,
        {
          type: "create",
          fields: userData.getDatabaseObject(),
        },
        undefined,
        true,
      );

      return userData.id;
    } catch (err) {
      if (emailCaptured) {
        await UserDao.releaseEmail(userData.email);
      }

      if (usernameCaptured) {
        await UserDao.releaseEmail(userData.username);
      }

      throw err;
    }
  }

  public async updateUser(
    userId: number,
    updatedUser: Partial<UserDatabaseObject>,
    rawPassword?: string,
    subject?: User,
  ): Promise<number> {
    let emailReserved = false;
    let usernameReserved = false;

    try {
      const fields = { ...updatedUser };

      const oldUser = await this.fetchUser(userId);

      if (updatedUser.email !== undefined && oldUser.email !== updatedUser.email) {
        emailReserved = await this.tryReserveEmail(updatedUser.email);

        if (!emailReserved) {
          throw new ServiceError(400, "Email already in use!");
        }
      }

      if (updatedUser.username !== undefined && oldUser.username !== updatedUser.username) {
        usernameReserved = await this.tryReserveUsername(updatedUser.username);

        if (!usernameReserved) {
          throw new ServiceError(400, "Username already in use!");
        }
      }

      if (rawPassword) {
        const { password, salt } = await mkHashedPassword(rawPassword);
        const passwordHash = await hashPasswordAsync(rawPassword);

        Object.assign(fields, {
          password_hash: passwordHash,
          hashed_password: password,
          salt,
        });
      }

      const nats = await NatsService.get();

      const user = await this.fetchUser(userId);

      // Kerrotaan NATS-palvelimelle, että tämä on viimeisin käsittelemämme
      // tätä käyttäjää koskevan viestin järjestysnumero. Jos NATS-vastaanottaa
      // tämän viestin, ja viimeisimmän käyttäjää koskevan viestin sarjanumero on jokin muu,
      // NATS kieltäytyy vastaanottamasta viestiä.
      //
      // Näin voimme varmistua siitä, että lähtötietomme on ajantasainen,
      // eikä joku muu ole kerennyt tässä välissä muokata käyttäjän tietoja.
      const opts: Partial<JetStreamPublishOptions> = {
        expect: {
          lastSubjectSequence: user.lastSeq,
        },
      };

      const changedFields = Object.entries(fields).filter(
        ([field, newValue]) => user.getDatabaseObject()[field as keyof UserDatabaseObject] !== newValue,
      );

      if (changedFields.length === 0) {
        return 0;
      }

      // Jukaistaan viesti, jossa kerrotaan, että asetamme käyttäjälle uudet pyynnön mukana saadut arvot.
      await nats.publish(
        `members.${userId}`,
        {
          type: "set",
          user: userId,
          fields: Object.fromEntries(changedFields),
          subject: subject?.id,
        },
        opts,
        true,
      );

      if (usernameReserved) {
        await UserDao.releaseUsername(oldUser.username);
      }

      if (emailReserved) {
        await UserDao.releaseEmail(oldUser.email);
      }

      return 1;
    } catch (err) {
      if (usernameReserved) {
        await UserDao.releaseUsername(updatedUser.username!);
      }

      if (emailReserved) {
        await UserDao.releaseEmail(updatedUser.email!);
      }

      throw err;
    }
  }

  public async deleteUser(userId: number): Promise<number> {
    return UserDao.remove(userId);
  }

  public async getUserWithUsername(username: string): Promise<User | null> {
    const dbUser = await UserDao.findByUsername(username);
    if (!dbUser) return null;
    const user = new User(dbUser);
    return user;
  }

  public async getUserWithEmail(email: string): Promise<User | null> {
    const dbUser = await UserDao.findByEmail(email);
    if (!dbUser) return null;
    const user = new User(dbUser);
    return user;
  }
}

async function mkHashedPassword(rawPassword: string): Promise<{ salt: string; password: string }> {
  const salt = crypto.randomBytes(16).toString("hex").substring(0, 20);
  // The passwords are first hashed according to the legacy format
  // to ensure backwards compability
  const password = sha1(`${salt}kekbUr${rawPassword}`) as string;
  return { salt, password };
}

const service = new UserService();

/**
 * Taustaprosessi, joka kuuntelee jäsentieto-streamiin julkaistuja viestejä
 * ja käsittelee ne.
 */
const start = async () => {
  const nats = await NatsService.get();

  nats.subscribe(async ({ type, fields }: any, msg) => {
    const userId = parseInt(msg.subject.split(".")[1], 10);

    if (type === "set" || type === "import") {
      // Parsitaan käyttäjän ID viestin subjektista, joka on muotoa `members.{id}`.

      if (fields.created) {
        // Tämä piti tehdä jostain syystä. Syyttäkää user-serviceä älkääkä NATSia.
        fields.created = new Date(fields.created);
      }

      // Päivitetään muokkausviestin mukaiset arvot tietokantaan.
      await UserDao.update(userId, fields);
    } else if (type === "create") {
      await UserDao.save({
        ...fields,
        id: userId,
        last_seq: msg.seq,
      });

      return;
    }

    // Tallennetaan tietokantaan tieto siitä, että olemme käsitelleet tämän viestin,
    // vaikka viesti ei olisikaan meille relevantti.
    await UserDao.update(userId, { last_seq: msg.seq });
  });
};

start();

export default service;
