import * as JWT from 'jsonwebtoken';

export class ServiceToken {
  constructor(
    public userId: number,
    public authenticatedTo: string[],
    public userRole: string,
    public createdAt: Date
  ) { }

  toString(): string {
    try {
      return JWT.sign({
        userId: this.userId,
        authenticatedTo: this.authenticatedTo.join(','),
        userRole: this.userRole,
        createdAt: this.createdAt
      }, process.env.AUTHSERVICE_JWT_SECRET);
    } catch (e) {
      throw e;
    }
  }
}

export function stringToServiceToken(token: string): ServiceToken {
  let parsedToken = null;
  try {
    parsedToken = JWT.verify(token, process.env.AUTHSERVICE_JWT_SECRET);
  } catch(e) {
    throw e;
  }
  return new ServiceToken(parsedToken.userId, parsedToken.authenticatedTo.split(','), parsedToken.userRole, parsedToken.createdAt);
}
