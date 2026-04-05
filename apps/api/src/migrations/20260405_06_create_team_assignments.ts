import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('team_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('team_id').notNullable().references('id').inTable('teams');
    table.uuid('member_id').notNullable().references('id').inTable('members');
    table
      .enum('role', ['player', 'coach', 'assistant', 'sparring'])
      .notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['team_id', 'member_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('team_assignments');
}
