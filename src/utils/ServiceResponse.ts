/**
 * Service response.
 *
 * @export
 * @class ServiceResponse
 */
export default class ServiceResponse {
  /**
   * Status of the response.
   *
   * @type {boolean}
   * @memberof ServiceResponse
   */
  public ok: boolean;
  /**
   * Message.
   *
   * @type {string} Message
   * @memberof ServiceResponse
   */
  public message: string;
  /**
   * Payload
   *
   * @type {*} Object, string etc.
   * @memberof ServiceResponse
   */
  public payload: any;
  /**
   * Creates an instance of ServiceResponse.
   * @param {any} payload
   * @param {string} [message="Success"]
   * @param {(boolean | null)} [ok=null]
   * @memberof ServiceResponse
   */
  constructor(
    payload: any,
    message: string = "Success",
    ok: boolean | null = null
  ) {
    if (message === "Success" && ok === null) {
      this.ok = true;
    } else if (message !== "Success" && ok === null) {
      this.ok = false;
    } else if (ok !== null) {
      this.ok = ok;
    }
    this.message = message;
    this.payload = payload;
  }
}
