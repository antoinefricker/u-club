import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.timestamp('email_verified_at').nullable();
    });
    // Grandfather in existing users
    await knex('users').whereNull('email_verified_at').update({
        email_verified_at: knex.fn.now(),
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('email_verified_at');
    });
}
