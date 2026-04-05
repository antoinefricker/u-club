import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('teams', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('club_id').notNullable().references('id').inTable('clubs');
    table.string('label').notNullable();
    table.integer('year').notNullable();
    table.enum('gender', ['male', 'female', 'both']).notNullable();
    table.text('description');
    table.boolean('archived').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('teams');
}
