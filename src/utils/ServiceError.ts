/**
 * ServiceError.
 *
 * @export
 * @class ServiceError
 * @extends {Error}
 */
export default class ServiceError extends Error {
  /**
   * Creates an instance of ServiceError.
   * @param {number} httpErrorCode HTTP error code
   * @param {any} message Message
   * @memberof ServiceError
   */
  constructor(public httpErrorCode: number, message: any) {
    super(message);
  }
}
