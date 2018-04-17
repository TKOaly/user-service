export default class ServiceResponse {
  ok: boolean;
  message: string;
  payload: any;
  constructor(payload, message = 'Success', ok: boolean | null = null) {
    if (message == 'Success' && ok === null) {
      this.ok = true;
    } else if (message != 'Success' && ok === null) {
      this.ok = false;
    } else if (ok !== null) {
      this.ok = ok;
    }
    this.message = message;
    this.payload = payload;
  }  
}