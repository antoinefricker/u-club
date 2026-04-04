import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('login_tokens', (table) => {
    table.string('type').notNullable().defaultTo('login');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('login_tokens', (table) => {
    table.dropColumn('type');
  });
}
