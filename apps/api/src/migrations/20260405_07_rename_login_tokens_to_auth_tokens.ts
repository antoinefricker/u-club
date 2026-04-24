import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.renameTable('login_tokens', 'auth_tokens');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.renameTable('auth_tokens', 'login_tokens');
}
