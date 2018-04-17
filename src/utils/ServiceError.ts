export default class ServiceError extends Error {
  constructor(public httpErrorCode: number, message) {
    super(message);
  }
}