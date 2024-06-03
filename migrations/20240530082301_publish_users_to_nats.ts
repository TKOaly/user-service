import * as Knex from "knex";
import NatsService from "../src/services/NatsService";

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("users", "last_seq")) {
    await knex("users").update({ last_seq: null });
  } else {
    await knex.schema.table("users", table => {
      table.integer("last_seq").nullable();
    });
  }

  await knex.schema.createTableIfNotExists("user_ids", table => {
    table.increments("id").unique().nullable().unsigned();
    table.string("email").unique().nullable();
    table.string("username").unique().nullable();
  });

  await knex("user_ids").truncate();

  const conn = await NatsService.get();

  const users = await knex("users").select();

  await Promise.all(
    users.map(async user => {
      const { id, ...fields } = user;

      delete fields.last_seq;

      await knex("user_ids").insert({ id, username: fields.username, email: fields.email });

      const res = await conn.publish(`members.${id}`, {
        type: "import",
        user: id,
        fields,
      });

      await knex("users").update({ last_seq: res.seq }).where({ id });
    }),
  );

  await knex.schema.table("users", table => {
    table.integer("last_seq").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("users", table => {
    table.dropColumn("last_seq");
  });

  await knex.schema.dropTable("user_ids");
}
