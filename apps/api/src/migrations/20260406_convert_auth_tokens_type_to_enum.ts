import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('auth_tokens', (table) => {
        table.dropColumn('type');
    });
    await knex.schema.alterTable('auth_tokens', (table) => {
        table
            .enum('type', ['login', 'confirmation', 'password_reset'])
            .notNullable()
            .defaultTo('login');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('auth_tokens', (table) => {
        table.dropColumn('type');
    });
    await knex.schema.alterTable('auth_tokens', (table) => {
        table.string('type').notNullable().defaultTo('login');
    });
}
