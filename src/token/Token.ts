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
      return JWT.sign(this, process.env.AUTHSERVICE_JWT_SECRET);
    } catch (e) {
      throw e;
    }
  }
}

export function stringToServiceToken(token: string): ServiceToken {
  let parsedToken;
  try {
    let parsedToken = JWT.verify(token, process.env.AUTHSERVICE_JWT_SECRET);
  } catch(e) {
    throw e;
  }
  return new ServiceToken(parsedToken.userid, parsedToken.authenticatedTo, parsedToken.userRole, parsedToken.createdAt);
}
