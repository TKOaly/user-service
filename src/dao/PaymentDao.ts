import Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import { IPayment, IPaymentListing } from "../models/Payment";
import { knexInstance } from "../Db";

class PaymentDao implements IDao<IPayment> {
  public findOne(id: number): Promise<IPayment> {
    return Promise.resolve(
      knexInstance("payments")
        .select()
        .where({ id })
        .first(),
    );
  }

  public findByPayer(payer_id: number, validPayment?: boolean): Promise<IPayment> {
    let query: Knex.QueryInterface = knexInstance("payments")
      .select()
      .where({ payer_id });

    if (validPayment === true) {
      query = query.andWhere("valid_until", ">=", knexInstance.fn.now());
    }

    return Promise.resolve(query.first());
  }

  public findByConfirmer(confirmer_id: number): Promise<IPayment> {
    return Promise.resolve(
      knexInstance("payments")
        .select()
        .where({ confirmer_id })
        .first(),
    );
  }

  public findAll(): Promise<IPayment[]> {
    return Promise.resolve(knexInstance("payments").select());
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance("payments")
        .delete()
        .where({ id }),
    );
  }

  public update(entityId: number, entity: IPayment): Promise<number> {
    return Promise.resolve(
      knexInstance("payments")
        .where({ id: entityId })
        .update(entity),
    );
  }

  public save(entity: IPayment): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    return Promise.resolve(knexInstance("payments").insert(entity));
  }

  public findPaymentsByPaymentType(payment_type: string): Promise<IPaymentListing[]> {
    return Promise.resolve(
      knexInstance("payments")
        .select("payments.*", "pu.name as payer_name", "cu.name as confirmer_name")
        .leftJoin(knexInstance.raw("users as pu on (payments.payer_id = pu.id)"))
        .leftJoin(knexInstance.raw("users as cu on (payments.confirmer_id = cu.id)"))
        .where({ payment_type }),
    );
  }

  public findUnpaid(): Promise<IPaymentListing[]> {
    const query: Knex.QueryBuilder = knexInstance("payments")
      .select("payments.*", "users.name as payer_name")
      .leftJoin(knexInstance.raw("users on (users.id = payments.payer_id)"))
      .where({ paid: null });
    console.log(query.toString());
    return Promise.resolve(query);
  }

  public confirmPayment(payment_id: number, confirmer_id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance("payments")
        .update({
          paid: knexInstance.fn.now(),
          confirmer_id,
        })
        .where({ id: payment_id }),
    );
  }

  /**
   * Marks a payment paid by cash.
   */
  public makePaid(payment_id: number, confirmer_id: number, payment_type: string): Promise<boolean> {
    return Promise.resolve(
      knexInstance("payments")
        .update({
          payment_type,
          paid: knexInstance.fn.now(),
          confirmer_id,
        })
        .where({ id: payment_id }),
    );
  }

  public deletePayment(id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance("payments")
        .where({ id })
        .del(),
    );
  }
}

export default new PaymentDao();
