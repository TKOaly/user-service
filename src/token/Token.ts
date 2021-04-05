import JWT from "jsonwebtoken";
import ParsedTokenContents from "../interfaces/ParsedTokenContents";
import ServiceError from "../utils/ServiceError";

export default class ServiceToken {
  public userId: number;
  public authenticatedTo: string[];
  public createdAt: Date;
  constructor(userId: number, authenticatedTo: string[], createdAt: Date, private readonly secret: string) {
    this.userId = userId;
    this.authenticatedTo = authenticatedTo;
    this.createdAt = createdAt;
  }

  public toString() {
    try {
      const parsedTokenContents: ParsedTokenContents = {
        userId: this.userId,
        authenticatedTo: this.authenticatedTo.join(","),
        createdAt: this.createdAt,
      };
      return JWT.sign(parsedTokenContents, this.secret);
    } catch (e) {
      throw new ServiceError(500, "Failed to parse token");
    }
  }
}

export function stringToServiceToken(token: string, secret: string) {
  let parsedToken: string | object | null = null;
  try {
    parsedToken = JWT.verify(token, secret);
  } catch (e) {
    throw new ServiceError(500, "Failed to parse token");
  }
  const tokenContents = parsedToken as ParsedTokenContents;
  return new ServiceToken(
    tokenContents.userId,
    tokenContents.authenticatedTo.split(",").filter(id => id.length !== 0),
    tokenContents.createdAt,
    secret,
  );
}
