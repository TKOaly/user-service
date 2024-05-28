import type Knex from "knex";

exports.seed = async (knex: Knex) => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }

  const starts = new Date();

  starts.setMonth(7);
  starts.setDate(1);

  if (starts.valueOf() >= Date.now()) {
    starts.setFullYear(starts.getFullYear() - 1);
  }

  const memberships = ["jasen", "ulkojasen", "kannatusjasen"];

  await knex("pricings").del();
  await knex("pricings").insert(
    memberships.flatMap(membership => [
      { starts, membership, seasons: 1, price: 5 },
      { starts, membership, seasons: 3, price: 10 },
      { starts, membership, seasons: 5, price: 15 },
    ]),
  );
};
