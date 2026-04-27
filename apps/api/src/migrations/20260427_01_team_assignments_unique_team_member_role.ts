import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('team_assignments', (table) => {
        table.dropUnique(['team_id', 'member_id']);
        table.unique(['team_id', 'member_id', 'role']);
    });
}

// Reversal will fail if any member already holds multiple roles on the same team.
export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('team_assignments', (table) => {
        table.dropUnique(['team_id', 'member_id', 'role']);
        table.unique(['team_id', 'member_id']);
    });
}
