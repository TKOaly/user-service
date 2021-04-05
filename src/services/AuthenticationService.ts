// @ts-expect-error
import compare from "secure-compare";
import sha1 from "sha1";
import ServiceDao from "../dao/ServiceDao";
import Service from "../models/Service";
import ServiceToken, { stringToServiceToken } from "../token/Token";
import ServiceError from "../utils/ServiceError";

class AuthenticationService {
  public async getService(serviceName: string): Promise<Service> {
    const service = await ServiceDao.findByName(serviceName);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  public async getServiceWithIdentifier(service_identifier: string): Promise<Service> {
    const service = await ServiceDao.findByIdentifier(service_identifier);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  public async getServices(): Promise<Service[]> {
    const services = await ServiceDao.findAll();

    return services.map(service => new Service(service));
  }

  /**
   * Appends a new service to the authentication token.
   */
  public appendNewServiceAuthenticationToToken(
    oldToken: string | ServiceToken,
    newServiceName: string,
    secret: string,
  ): string {
    let token: ServiceToken;
    if (typeof oldToken === "string") {
      token = stringToServiceToken(oldToken, secret);
    } else {
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.createdAt, secret);
    }
    if (token.authenticatedTo) {
      token.authenticatedTo.push(newServiceName);
    } else {
      token.authenticatedTo = [newServiceName];
    }
    return token.toString();
  }

  /**
   * Remove a service from the authentication token.
   */
  public removeServiceAuthenticationToToken(
    oldToken: string | ServiceToken,
    serviceToRemove: string,
    secret: string,
  ): string {
    let token: ServiceToken;
    if (typeof oldToken === "string") {
      token = stringToServiceToken(oldToken, secret);
    } else {
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.createdAt, secret);
    }
    const newServiceList: string[] = [];
    token.authenticatedTo.forEach((s: string) => {
      if (s !== serviceToRemove) {
        newServiceList.push(s);
      }
    });
    token.authenticatedTo = newServiceList;
    return token.toString();
  }

  public createToken(userId: number, authenticatedTo: string[], secret: string): string {
    return new ServiceToken(userId, authenticatedTo, new Date(), secret).toString();
  }
}

export async function validatePassword(password: string, salt: string, hashedPassword: string): Promise<boolean> {
  return await compare(sha1(`${salt}kekbUr${password}`), hashedPassword);
}

export default new AuthenticationService();
