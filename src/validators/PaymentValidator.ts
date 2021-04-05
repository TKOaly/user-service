import Validator from "../interfaces/Validator";
import Payment from "../models/Payment";
import User from "../models/User";
import ServiceError from "../utils/ServiceError";

export default class PaymentValidator implements Validator<Payment, any> {
  public validateCreate(bodyData: Partial<Payment>) {
    if (!bodyData.payer_id || !bodyData.amount || !bodyData.valid_until || !bodyData.payment_type) {
      throw new ServiceError(400, "Invalid POST data");
    }

    if (bodyData.id) {
      delete bodyData.id;
    }

    bodyData.created = new Date();
  }

  public validateUpdate(_dataId: number, _newData: Payment, _validator: User): void {}
}
