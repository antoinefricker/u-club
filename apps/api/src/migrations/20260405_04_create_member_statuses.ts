import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('member_statuses', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('label').notNullable().unique();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('member_statuses');
}
