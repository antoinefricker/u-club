import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('birthdate');
    table.dropColumn('first_name');
    table.dropColumn('last_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.date('birthdate');
    table.string('first_name').notNullable().defaultTo('');
    table.string('last_name').notNullable().defaultTo('');
  });
}
