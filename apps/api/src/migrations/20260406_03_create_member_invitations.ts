import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('member_invitations', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('member_id').notNullable().references('id').inTable('members');
        table.uuid('invited_by').notNullable().references('id').inTable('users');
        table.string('email').notNullable();
        table.enum('type', ['self', 'relative']).notNullable();
        table.string('description');
        table.string('token', 64).notNullable().unique();
        table.timestamp('expires_at').notNullable();
        table.timestamp('accepted_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('member_invitations');
}
