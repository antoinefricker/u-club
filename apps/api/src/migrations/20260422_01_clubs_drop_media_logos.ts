import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('clubs', (table) => {
    table.dropColumn('media_logo_lg');
    table.dropColumn('media_logo_sm');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('clubs', (table) => {
    table.string('media_logo_lg');
    table.string('media_logo_sm');
  });
}
