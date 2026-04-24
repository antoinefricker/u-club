import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('login_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('email').notNullable();
        table.string('token', 64).notNullable().unique();
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('login_tokens');
}
