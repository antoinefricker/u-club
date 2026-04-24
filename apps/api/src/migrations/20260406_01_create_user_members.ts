import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('user_members', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('user_id').notNullable().references('id').inTable('users');
        table.uuid('member_id').notNullable().references('id').inTable('members');
        table.enum('type', ['self', 'relative']).notNullable();
        table.string('description');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['user_id', 'member_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('user_members');
}
