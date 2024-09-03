import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable("users"))) {
    return;
  }

  if (await knex.schema.hasColumn("users", "registration_ban_bypass_until")) {
    return;
  }

  await knex.schema.table("users", t => {
    t.datetime("registration_ban_bypass_until").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database columns in production");
  }

  if (!(await knex.schema.hasTable("users"))) {
    return;
  }

  if (!(await knex.schema.hasColumn("users", "registration_ban_bypass_until"))) {
    return;
  }

  await knex.schema.table("users", t => {
    t.dropColumn("registration_ban_bypass_until");
  });
}
