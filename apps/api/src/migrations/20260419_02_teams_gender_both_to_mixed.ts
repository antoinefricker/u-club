import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE teams DROP CONSTRAINT teams_gender_check');
    await knex.raw("UPDATE teams SET gender = 'mixed' WHERE gender = 'both'");
    await knex.raw(
        "ALTER TABLE teams ADD CONSTRAINT teams_gender_check CHECK (gender IN ('male', 'female', 'mixed'))",
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE teams DROP CONSTRAINT teams_gender_check');
    await knex.raw("UPDATE teams SET gender = 'both' WHERE gender = 'mixed'");
    await knex.raw(
        "ALTER TABLE teams ADD CONSTRAINT teams_gender_check CHECK (gender IN ('male', 'female', 'both'))",
    );
}
