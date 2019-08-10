import * as JWT from "jsonwebtoken";

export const kjyrIdentifier: string = "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7";
export const calendarIdentifier: string = "65a0058d-f9da-4e76-a00a-6013300cab5f";
export const generateToken: (userId: number, authenticatedTo?: string[], createdAt?: Date) => string = (
  userId: number,
  authenticatedTo: string[] = [kjyrIdentifier, calendarIdentifier],
  createdAt: Date = new Date(),
): string =>
  JWT.sign(
    {
      userId,
      authenticatedTo: authenticatedTo.join(","),
      createdAt,
    },
    process.env.JWT_SECRET || "test",
  );
