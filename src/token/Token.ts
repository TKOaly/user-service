import * as JWT from "jsonwebtoken";
import IParsedTokenContents from "../interfaces/IParsedTokenContents";

/**
 * ServiceToken class.
 *
 * @export
 * @class ServiceToken
 */
export default class ServiceToken {
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
  public toString(): string {
    try {
      const parsedTokenContents: IParsedTokenContents = {
        userId: this.userId,
        authenticatedTo: this.authenticatedTo.join(","),
        createdAt: this.createdAt
      };
      return JWT.sign(parsedTokenContents, process.env.JWT_SECRET);
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
  let parsedToken: string | object = null;
  try {
    parsedToken = JWT.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    throw e;
  }
  const tokenContents: IParsedTokenContents = parsedToken as IParsedTokenContents;
  return new ServiceToken(
    tokenContents.userId,
    tokenContents.authenticatedTo
      .split(",")
      .filter((id: string) => id.length !== 0),
    tokenContents.createdAt
  );
}
