import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('members', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').nullable().references('id').inTable('users');
    table
      .uuid('status_id')
      .nullable()
      .references('id')
      .inTable('member_statuses');
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.date('birth_date');
    table.string('license');
    table.enum('gender', ['male', 'female']).notNullable();
    table.integer('year').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('members');
}
