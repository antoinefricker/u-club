import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('teams', (table) => {
        table.dropColumn('year');
        table.dropColumn('archived');
    });

    await knex.schema.alterTable('members', (table) => {
        table.dropColumn('license');
    });

    await knex.raw('ALTER TABLE members DROP CONSTRAINT members_gender_check');
    await knex.raw(
        "ALTER TABLE members ADD CONSTRAINT members_gender_check CHECK (gender IN ('male', 'female', 'mixed'))",
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('teams', (table) => {
        table.integer('year').notNullable().defaultTo(0);
        table.boolean('archived').notNullable().defaultTo(false);
    });

    await knex.schema.alterTable('members', (table) => {
        table.string('license');
    });

    await knex.raw('ALTER TABLE members DROP CONSTRAINT members_gender_check');
    await knex.raw(
        "ALTER TABLE members ADD CONSTRAINT members_gender_check CHECK (gender IN ('male', 'female'))",
    );
}
