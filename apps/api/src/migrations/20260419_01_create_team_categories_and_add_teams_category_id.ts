import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('team_categories', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('club_id').notNullable().references('id').inTable('clubs');
        table.string('label').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['club_id', 'label']);
    });

    await knex.schema.alterTable('teams', (table) => {
        table.uuid('category_id').nullable().references('id').inTable('team_categories').onDelete('SET NULL');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('teams', (table) => {
        table.dropColumn('category_id');
    });

    await knex.schema.dropTable('team_categories');
}
