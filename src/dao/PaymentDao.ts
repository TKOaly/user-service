import Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import { IPayment, IPaymentListing } from "../models/Payment";

export default class PaymentDao implements IDao<IPayment> {
  constructor(private readonly knex: Knex) { }

  public findOne(id: number): Promise<IPayment> {
    return Promise.resolve(
      this.knex("payments")
        .select()
        .where({ id })
        .first()
    );
  }

  public findByPayer(
    payer_id: number,
    validPayment?: boolean
  ): Promise<IPayment> {
    let query: Knex.QueryInterface = this.knex("payments")
      .select()
      .where({ payer_id });

    if (validPayment === true) {
      query = query.andWhere("valid_until", ">=", this.knex.fn.now());
    }

    return Promise.resolve(query.first());
  }

  public findByConfirmer(confirmer_id: number): Promise<IPayment> {
    return Promise.resolve(
      this.knex("payments")
        .select()
        .where({ confirmer_id })
        .first()
    );
  }

  public findAll(): Promise<IPayment[]> {
    return Promise.resolve(this.knex("payments").select());
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      this.knex("payments")
        .delete()
        .where({ id })
    );
  }

  public update(entityId: number, entity: IPayment): Promise<number> {
    return Promise.resolve(
      this.knex("payments")
        .where({ id: entityId })
        .update(entity)
    );
  }

  public save(entity: IPayment): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    return Promise.resolve(this.knex("payments").insert(entity));
  }

  public findPaymentsByPaymentType(
    payment_type: string
  ): Promise<IPaymentListing[]> {
    return Promise.resolve(
      this.knex("payments")
        .select(
          "payments.*",
          "pu.name as payer_name",
          "cu.name as confirmer_name"
        )
        .leftJoin(this.knex.raw("users as pu on (payments.payer_id = pu.id)"))
        .leftJoin(
          this.knex.raw("users as cu on (payments.confirmer_id = cu.id)")
        )
        .where({ payment_type })
    );
  }

  public findUnpaid(): Promise<IPaymentListing[]> {
    const query: Knex.QueryBuilder = this.knex("payments")
      .select("payments.*", "users.name as payer_name")
      .leftJoin(this.knex.raw("users on (users.id = payments.payer_id)"))
      .where({ paid: null });
    console.log(query.toString());
    return Promise.resolve(query);
  }

  public confirmPayment(
    payment_id: number,
    confirmer_id: number
  ): Promise<boolean> {
    return Promise.resolve(
      this.knex("payments")
        .update({
          paid: this.knex.fn.now(),
          confirmer_id
        })
        .where({ id: payment_id })
    );
  }

  /**
   * Marks a payment paid by cash.
   */
  public makePaid(
    payment_id: number,
    confirmer_id: number,
    payment_type: string
  ): Promise<boolean> {
    return Promise.resolve(
      this.knex("payments")
        .update({
          payment_type,
          paid: this.knex.fn.now(),
          confirmer_id
        })
        .where({ id: payment_id })
    );
  }

  public deletePayment(id: number): Promise<boolean> {
    return Promise.resolve(
      this.knex("payments")
        .where({ id })
        .del()
    );
  }
}
