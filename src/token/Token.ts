import JWT from "jsonwebtoken";
import ParsedTokenContents from "../interfaces/ParsedTokenContents";

export default class ServiceToken {
  constructor(public userId: number, public authenticatedTo: string[], public createdAt: Date) {}

  public toString() {
    if (process.env.JWT_SECRET === undefined) {
      throw new Error("JWT_SECRET env variable is undefined.");
    }
    try {
      const parsedTokenContents: ParsedTokenContents = {
        userId: this.userId,
        authenticatedTo: this.authenticatedTo.join(","),
        createdAt: this.createdAt,
      };
      return JWT.sign(parsedTokenContents, process.env.JWT_SECRET);
    } catch (e) {
      throw e;
    }
  }
}

export function stringToServiceToken(token: string) {
  if (process.env.JWT_SECRET === undefined) {
    throw new Error("JWT_SECRET env variable is undefined.");
  }
  let parsedToken: string | object | null = null;
  try {
    parsedToken = JWT.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    throw e;
  }
  const tokenContents = parsedToken as ParsedTokenContents;
  return new ServiceToken(
    tokenContents.userId,
    tokenContents.authenticatedTo.split(",").filter(id => id.length !== 0),
    tokenContents.createdAt,
  );
}
