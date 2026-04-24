import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Move existing user_id links to user_members
    const members = await knex('members').whereNotNull('user_id').select('id', 'user_id');
    for (const member of members) {
        await knex('user_members').insert({
            user_id: member.user_id,
            member_id: member.id,
            type: 'self',
        });
    }

    // Drop user_id column from members
    await knex.schema.alterTable('members', (table) => {
        table.dropColumn('user_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('members', (table) => {
        table.uuid('user_id').nullable().references('id').inTable('users');
    });

    // Move user_members back to members.user_id (only 'self' type)
    const links = await knex('user_members').where({ type: 'self' }).select('user_id', 'member_id');
    for (const link of links) {
        await knex('members').where({ id: link.member_id }).update({ user_id: link.user_id });
    }
}
