import IValidator from "../interfaces/IValidator";
import Payment from "../models/Payment";
import User from "../models/User";
import ServiceError from "../utils/ServiceError";

/**
 * Payment validator.
 *
 * @export
 * @class PaymentValidator
 * @implements {IValidator<Payment>}
 */
export default class PaymentValidator implements IValidator<Payment> {

  /**
   * Validates payment creation.
   *
   * @param {Payment} bodyData Payment data
   * @memberof PaymentValidator
   */
  public validateCreate(bodyData: Payment): void {
    if (
      !bodyData.payer_id ||
      !bodyData.amount ||
      !bodyData.valid_until ||
      !bodyData.payment_type
    ) {
      throw new ServiceError(400, "Invalid POST data");
    }

    if (bodyData.id) {
      delete bodyData.id;
    }

    bodyData.created = new Date();
  }

  /**
   * Validates payment update.
   *
   * @param {number} dataId Data ID
   * @param {Payment} newData Payment data
   * @param {User} validator User
   * @returns {void}
   * @memberof PaymentValidator
   */
  public validateUpdate(dataId: number, newData: Payment, validator: User): void {
    return;
  }
}
