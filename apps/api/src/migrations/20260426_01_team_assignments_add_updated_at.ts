import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('team_assignments', (table) => {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    await knex.raw('UPDATE team_assignments SET updated_at = created_at');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('team_assignments', (table) => {
        table.dropColumn('updated_at');
    });
}
