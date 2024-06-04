import * as Knex from "knex";
import NatsService from "../src/services/NatsService";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE privacy_policy_consent_data
        DROP FOREIGN KEY privacy_policy_consent_data_user_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE privacy_policy_consent_data
        ADD CONSTRAINT privacy_policy_consent_data_user_id_foreign
            FOREIGN KEY (user_id) REFERENCES users (id)
                ON DELETE CASCADE
  `);

  if (await knex.schema.hasColumn("users", "last_seq")) {
    await knex("users").update({ last_seq: null });
  } else {
    await knex.schema.table("users", table => {
      table.integer("last_seq").nullable();
    });
  }

  if (await knex.schema.hasTable("user_ids")) {
    await knex("user_ids").truncate();
  } else {
    await knex.schema.createTable("user_ids", table => {
      table.increments("id").unique().nullable().unsigned();
      table.string("email").unique().nullable();
      table.string("username").unique().nullable();
    });
  }

  const conn = await NatsService.get();

  const users = await knex("users").orderBy("id", "asc").select();

  await Promise.all(
    users.map(async user => {
      const { id, ...fields } = user;

      delete fields.last_seq;

      try {
        await knex("user_ids").insert({ id, username: fields.username, email: fields.email });
      } catch (err) {
        if ("code" in err && err.code === "ER_DUP_ENTRY") {
          // HACK: Remove before production!
          await knex("users").delete().where({ id });
          return;
        }

        throw err;
      }

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
  if (await knex.schema.hasColumn("users", "last_seq")) {
    await knex.schema.table("users", table => {
      table.dropColumn("last_seq");
    });
  }

  if (await knex.schema.hasTable("user_ids")) {
    await knex.schema.dropTable("user_ids");
  }
}
