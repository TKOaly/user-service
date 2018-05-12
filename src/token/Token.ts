import * as JWT from "jsonwebtoken";

/**
 * ServiceToken class.
 *
 * @export
 * @class ServiceToken
 */
export class ServiceToken {
  /**
   * Creates an instance of ServiceToken.
   * @param {number} userId User id
   * @param {string[]} authenticatedTo Service list
   * @param {Date} createdAt Creation date
   * @memberof ServiceToken
   */
  constructor(
    public userId: number,
    public authenticatedTo: string[],
    public createdAt: Date
  ) {}

  /**
   * Converts the token to a string.
   *
   * @returns {string} Token as a string
   * @memberof ServiceToken
   */
  toString(): string {
    try {
      return JWT.sign(
        {
          userId: this.userId,
          authenticatedTo: this.authenticatedTo.join(","),
          createdAt: this.createdAt
        },
        process.env.AUTHSERVICE_JWT_SECRET
      );
    } catch (e) {
      throw e;
    }
  }
}

/**
 * Converts a token string to a ServiceToken.
 *
 * @export
 * @param {string} token Token as string
 * @returns {ServiceToken}
 */
export function stringToServiceToken(token: string): ServiceToken {
  let parsedToken = null;
  try {
    parsedToken = JWT.verify(token, process.env.AUTHSERVICE_JWT_SECRET);
  } catch (e) {
    throw e;
  }
  return new ServiceToken(
    parsedToken.userId,
    parsedToken.authenticatedTo.split(","),
    parsedToken.createdAt
  );
}
