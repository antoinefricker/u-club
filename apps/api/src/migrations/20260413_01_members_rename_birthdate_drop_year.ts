import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('members', (table) => {
    table.renameColumn('birth_date', 'birthdate');
    table.dropColumn('year');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('members', (table) => {
    table.renameColumn('birthdate', 'birth_date');
    table.integer('year').notNullable().defaultTo(0);
  });
}
