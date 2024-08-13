export default class ServiceError extends Error {
  constructor(
    public httpErrorCode: number,
    message: string,
  ) {
    super(message);
  }
}
