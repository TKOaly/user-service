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
      const parsedTokenContents: ParsedTokenContents = {
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
  const tokenContents: ParsedTokenContents = parsedToken as ParsedTokenContents;
  return new ServiceToken(
    tokenContents.userId,
    tokenContents.authenticatedTo.split(","),
    tokenContents.createdAt
  );
}

/**
 * Interface for parsed token contents.
 *
 * @interface ParsedTokenContents
 */
interface ParsedTokenContents {
  userId: number;
  authenticatedTo: string;
  createdAt: Date;
}
