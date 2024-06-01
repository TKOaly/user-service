import { Knex } from "knex";
import { knexInstance as knex } from "../Db";
import { MembershipType, PUBLIC_MEMBERSIHP_TYPES } from "../enum/Membership";
import Dao from "../interfaces/Dao";
import { PricingDatabaseObject } from "../interfaces/PricingDatabaseObject";

const tableName = "pricings";

class PricingDao implements Dao<PricingDatabaseObject> {
  private knex() {
    return knex<PricingDatabaseObject>(tableName);
  }

  findActivePricings() {
    return this.knex()
      .select()
      .whereIn("membership", PUBLIC_MEMBERSIHP_TYPES)
      .andWhereRaw("DATEDIFF(NOW(), starts) BETWEEN 0 AND 365")
      .orderBy([
        { column: "seasons", order: "asc" },
        { column: "membership", order: "desc" },
      ]);
  }

  findPrices(
    membership: MembershipType | null,
    seasons: number | null,
    season: number,
  ): Promise<PricingDatabaseObject[]> {
    const conditionalFilter: Knex.QueryCallbackWithArgs = (builder, column, value) => {
      if (value !== null) {
        builder.andWhere(column, "=", value);
      }
    };

    return this.knex()
      .select()
      .andWhereRaw("YEAR(starts) = ?", [season])
      .modify(conditionalFilter, "membership", membership)
      .modify(conditionalFilter, "seasons", seasons)
      .orderBy([
        { column: "seasons", order: "asc" },
        { column: "membership", order: "desc" },
      ]);
  }

  findOne(id: number) {
    return this.knex().select().where({ id }).first();
  }

  findAll() {
    return this.knex().select();
  }

  remove(id: number) {
    return this.knex().delete().where({ id });
  }

  update(id: number, entity: Partial<Omit<PricingDatabaseObject, "id" | "created" | "modified">>): PromiseLike<number> {
    return this.knex().update(entity).where({ id });
  }

  save(entity: Required<Omit<PricingDatabaseObject, "id" | "created" | "modified">>): PromiseLike<number[]> {
    return this.knex().insert(entity);
  }

  async updatePrice(season: number, membership: MembershipType, seasons: number, price: number) {
    const existing = await this.knex()
      .select("id")
      .where({ membership, seasons })
      .andWhereRaw("YEAR(starts) = ?", [season])
      .first();

    if (existing) {
      await this.knex().update({ price }).where({ id: existing.id });
    } else {
      await this.knex().insert({
        starts: new Date(season, 7, 1, 0, 0),
        membership,
        price,
        seasons,
      });
    }
  }

  async deleteSeasonPrices(season: number) {
    return this.knex().delete().andWhereRaw("YEAR(starts) = ?", [season]);
  }
}

export default new PricingDao();
