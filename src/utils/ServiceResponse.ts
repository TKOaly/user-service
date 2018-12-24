export default class ServiceResponse<T> {
  public ok: boolean;
  public message: string;
  public payload: T;

  constructor(
    payload: T,
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
