// @ts-ignore
import compare from "secure-compare";
import sha1 from "sha1";
import ServiceDao from "../dao/ServiceDao";
import Service, { IServiceDatabaseObject } from "../models/Service";
import ServiceToken, { stringToServiceToken } from "../token/Token";
import ServiceError from "../utils/ServiceError";

export default class AuthenticationService {
  constructor(private readonly serviceDao: ServiceDao) {}

  public async getService(serviceName: string): Promise<Service> {
    const service: IServiceDatabaseObject = await this.serviceDao.findByName(serviceName);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  public async getServiceWithIdentifier(service_identifier: string): Promise<Service> {
    const service: IServiceDatabaseObject = await this.serviceDao.findByIdentifier(service_identifier);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  public async getServices(): Promise<Service[]> {
    const services: IServiceDatabaseObject[] = await this.serviceDao.findAll();

    return services.map((service: IServiceDatabaseObject) => new Service(service));
  }

  /**
   * Appends a new service to the authentication token.
   */
  public appendNewServiceAuthenticationToToken(oldToken: string | ServiceToken, newServiceName: string): string {
    let token: ServiceToken;
    if (typeof oldToken === "string") {
      token = stringToServiceToken(oldToken);
    } else {
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.createdAt);
    }
    if (token.authenticatedTo) {
      token.authenticatedTo.push(newServiceName);
    } else {
      token.authenticatedTo = [newServiceName];
    }
    try {
      return token.toString();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Remove a service from the authentication token.
   */
  public removeServiceAuthenticationToToken(oldToken: string | ServiceToken, serviceToRemove: string): string {
    let token: ServiceToken;
    if (typeof oldToken === "string") {
      token = stringToServiceToken(oldToken);
    } else {
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.createdAt);
    }
    const newServiceList: string[] = [];
    token.authenticatedTo.forEach((s: string) => {
      if (s !== serviceToRemove) {
        newServiceList.push(s);
      }
    });
    token.authenticatedTo = newServiceList;
    try {
      return token.toString();
    } catch (e) {
      throw e;
    }
  }

  public createToken(userId: number, authenticatedTo: string[]): string {
    return new ServiceToken(userId, authenticatedTo, new Date()).toString();
  }
}

export async function validatePassword(password: string, salt: string, hashedPassword: string): Promise<boolean> {
  return await compare(sha1(`${salt}kekbUr${password}`), hashedPassword);
}
