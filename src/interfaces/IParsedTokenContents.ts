/**
 * Interface for parsed token contents.
 *
 * @interface ParsedTokenContents
 */
export default interface IParsedTokenContents {
  userId: number;
  authenticatedTo: string;
  createdAt: Date;
}
