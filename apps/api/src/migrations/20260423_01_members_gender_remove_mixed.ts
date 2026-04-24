import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    const { rows } = await knex.raw<{ rows: { count: string }[] }>(
        "SELECT COUNT(*)::text AS count FROM members WHERE gender = 'mixed'",
    );
    const mixedCount = Number(rows[0]?.count ?? '0');
    if (mixedCount > 0) {
        throw new Error(
            `Refusing to migrate: ${mixedCount} member(s) have gender = 'mixed'. Resolve them before running this migration.`,
        );
    }

    await knex.raw('ALTER TABLE members DROP CONSTRAINT members_gender_check');
    await knex.raw("ALTER TABLE members ADD CONSTRAINT members_gender_check CHECK (gender IN ('male', 'female'))");
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE members DROP CONSTRAINT members_gender_check');
    await knex.raw(
        "ALTER TABLE members ADD CONSTRAINT members_gender_check CHECK (gender IN ('male', 'female', 'mixed'))",
    );
}
