import * as Knex from "knex";
import Dao from "../interfaces/Dao";
import { PaymentDatabaseObject, PaymentListingDatabaseObject } from "../models/Payment";
import { knexInstance } from "../Db";

const tableName = "payments";

class PaymentDao implements Dao<PaymentDatabaseObject> {
  public findOne(id: number): PromiseLike<PaymentDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .select()
        .where({ id })
        .first(),
    );
  }

  public findByPayer(payer_id: number, validPayment?: boolean): PromiseLike<PaymentDatabaseObject | undefined> {
    let query = knexInstance<PaymentDatabaseObject>(tableName)
      .select()
      .where({ payer_id });

    if (validPayment === true) {
      query = query.andWhere("valid_until", ">=", knexInstance.fn.now());
    }

    return Promise.resolve(query.first());
  }

  public findByConfirmer(confirmer_id: number): PromiseLike<PaymentDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .select()
        .where({ confirmer_id })
        .first(),
    );
  }

  public findAll(): PromiseLike<PaymentDatabaseObject[]> {
    return Promise.resolve(knexInstance<PaymentDatabaseObject>(tableName).select());
  }

  public remove(id: number): PromiseLike<number> {
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .delete()
        .where({ id }),
    );
  }

  public update(entityId: number, entity: Partial<PaymentDatabaseObject>): PromiseLike<number> {
    delete entity.created;
    // entity.modified = new Date();
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .where({ id: entityId })
        .update(entity),
    );
  }

  public save(entity: Omit<PaymentDatabaseObject, "created" | "modified">): PromiseLike<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    const savedObj: PaymentDatabaseObject = {
      ...entity,
      created: new Date(),
    };
    return Promise.resolve(knexInstance<PaymentDatabaseObject>(tableName).insert(savedObj));
  }

  public findPaymentsByPaymentType(payment_type: string): PromiseLike<PaymentListingDatabaseObject[]> {
    return Promise.resolve(
      knexInstance<PaymentListingDatabaseObject>(tableName)
        .select(`${tableName}.*`, "pu.name as payer_name", "cu.name as confirmer_name")
        .leftJoin(knexInstance.raw("users as pu on (" + tableName + ".payer_id = pu.id)"))
        .leftJoin(knexInstance.raw("users as cu on (" + tableName + ".confirmer_id = cu.id)"))
        .where({ payment_type }),
    );
  }

  public findUnpaid(): PromiseLike<PaymentListingDatabaseObject[]> {
    const query: Knex.QueryBuilder = knexInstance<PaymentListingDatabaseObject>(tableName)
      .select(`${tableName}.*`, "users.name as payer_name")
      .leftJoin(knexInstance.raw("users on (users.id = " + tableName + ".payer_id)"))
      .where({ paid: null });
    // console.log(query.toString());
    return Promise.resolve(query);
  }

  public confirmPayment(payment_id: number, confirmer_id: number): PromiseLike<number> {
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .update({
          paid: new Date(),
          confirmer_id,
        })
        .where({ id: payment_id }),
    );
  }

  /**
   * Marks a payment paid by cash.
   */
  public makePaid(payment_id: number, confirmer_id: number, payment_type: string): PromiseLike<number> {
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .update({
          payment_type,
          paid: new Date(),
          confirmer_id,
        })
        .where({ id: payment_id }),
    );
  }

  public deletePayment(id: number): PromiseLike<boolean> {
    return Promise.resolve(
      knexInstance<PaymentDatabaseObject>(tableName)
        .where({ id })
        .del(),
    );
  }
}

export default new PaymentDao();
