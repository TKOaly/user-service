import * as JWT from "jsonwebtoken";
import IParsedTokenContents from "../interfaces/IParsedTokenContents";

export default class ServiceToken {
  constructor(
    public userId: number,
    public authenticatedTo: string[],
    public createdAt: Date
  ) {}

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
