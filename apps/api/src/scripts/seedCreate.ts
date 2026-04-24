import { faker } from '@faker-js/faker/locale/fr';

import { seedClear } from './seedClear.js';
import CONFIG from './utils/seedConfiguration.js';
import PERSONAS, {
    type PersonaTeamRef,
} from './utils/personasConfiguration.js';
import {
    insertClub,
    insertMember,
    insertMemberStatus,
    insertTeam,
    insertTeamAssignment,
    insertTeamCategory,
    insertUser,
    insertUserMemberLink,
} from './utils/seedUtils.js';
import { Logger } from './utils/logUtils.js';
import type {
    Club,
    Member,
    MemberGender,
    MemberStatus,
    Team,
    TeamAssignment,
    TeamCategory,
    TeamGender,
    TeamRole,
    User,
    UserMember,
} from '../types/index.js';
import { emojis } from './utils/emojis.js';

type Seeded = {
    clubs: Club[];
    teamCategories: TeamCategory[];
    teams: Team[];
    members: Member[];
    teamAssignments: TeamAssignment[];
    memberStatuses: MemberStatus[];
    users: User[];
    userMembers: UserMember[];
};

type TeamInfo = {
    team: Team;
    club: Club;
    ageRange: [number, number];
};

const ROLE_PRIORITY: Record<TeamRole, number> = {
    coach: 3,
    assistant: 2,
    player: 1,
    sparring: 0,
};

const teamRefKey = (
    clubCode: string,
    categoryName: string,
    gender: TeamGender,
    index: number,
): string => `${clubCode}:${categoryName}:${gender}:${index}`;

const toDateString = (date: Date): string => date.toISOString().split('T')[0];

async function seedCreate(force: boolean) {
    await seedClear(force);
    Logger.nl(2);

    const seeded: Seeded = {
        clubs: [],
        teamCategories: [],
        teams: [],
        members: [],
        teamAssignments: [],
        memberStatuses: [],
        users: [],
        userMembers: [],
    };

    // -------------------------- clubs
    Logger.title('CLUBS');
    Logger.nl();
    for (const club of CONFIG.clubs) {
        const createdClub = await insertClub({
            name: club.name,
            code: club.code,
            description: null,
        });
        Logger.info(`${createdClub.name} (${createdClub.code})`, ' ');
        seeded.clubs.push(createdClub);
    }
    Logger.nl();
    Logger.info(`Created ${seeded.clubs.length} clubs`);
    Logger.nl(2);

    // -------------------------- team categories
    Logger.title('TEAM CATEGORIES');
    Logger.nl();
    const categoriesByClub: TeamCategory[][] = [];
    for (let i = 0; i < CONFIG.clubs.length; i++) {
        const club = CONFIG.clubs[i];
        const createdClub = seeded.clubs[i];
        const createdCategories: TeamCategory[] = [];
        for (const category of club.categories) {
            const createdCategory = await insertTeamCategory({
                clubId: createdClub.id,
                label: category.name,
            });
            Logger.info([createdCategory.label, createdClub.name], ' ');
            seeded.teamCategories.push(createdCategory);
            createdCategories.push(createdCategory);
        }
        categoriesByClub.push(createdCategories);
    }
    Logger.nl();
    Logger.info(`Created ${seeded.teamCategories.length} team categories`);
    Logger.nl(2);

    // -------------------------- teams
    Logger.title('TEAMS');
    Logger.nl();

    const labelForGender: Record<TeamGender, string> = {
        male: 'M',
        female: 'F',
        mixed: '',
    };

    const teamInfos: TeamInfo[] = [];
    const teamByRef = new Map<string, TeamInfo>();
    for (let i = 0; i < CONFIG.clubs.length; i++) {
        const club = CONFIG.clubs[i];
        const linkedClub = seeded.clubs[i];
        for (let j = 0; j < club.categories.length; j++) {
            const category = club.categories[j];
            const createdCategory = categoriesByClub[i][j];
            for (const genderConfig of category.genders) {
                for (let n = 0; n < genderConfig.teams; n++) {
                    const label =
                        genderConfig.teams === 1
                            ? `${category.name} ${labelForGender[genderConfig.type]}`
                            : `${category.name} ${labelForGender[genderConfig.type]} ${n + 1}`;
                    const createdTeam = await insertTeam({
                        clubId: linkedClub.id,
                        categoryId: createdCategory.id,
                        label,
                        gender: genderConfig.type,
                    });
                    Logger.info([createdTeam.label, linkedClub.name], ' ');
                    seeded.teams.push(createdTeam);
                    const info: TeamInfo = {
                        team: createdTeam,
                        club: linkedClub,
                        ageRange: category.ageRange,
                    };
                    teamInfos.push(info);
                    teamByRef.set(
                        teamRefKey(
                            club.code,
                            category.name,
                            genderConfig.type,
                            n + 1,
                        ),
                        info,
                    );
                }
            }
        }
    }
    Logger.nl();
    Logger.info(`Created ${seeded.teams.length} teams`);
    Logger.nl(2);

    // -------------------------- member statuses
    Logger.title('MEMBER STATUSES');
    Logger.nl();
    for (const label of CONFIG.memberStatuses) {
        const createdMemberStatus = await insertMemberStatus(label);
        Logger.info(createdMemberStatus.label, ' ');
        seeded.memberStatuses.push(createdMemberStatus);
    }
    Logger.nl();
    Logger.info(`Created ${seeded.memberStatuses.length} statuses`);
    Logger.nl(2);

    // -------------------------- members & team assignments
    Logger.title('MEMBERS');
    Logger.nl();

    const activeStatus =
        seeded.memberStatuses.find((s) => s.label === 'active') ??
        seeded.memberStatuses[0];

    for (const { team, club, ageRange } of teamInfos) {
        const playerCount = faker.number.int({ min: 10, max: 15 });

        for (let p = 0; p < playerCount; p++) {
            const gender: MemberGender =
                team.gender === 'mixed'
                    ? faker.helpers.arrayElement<MemberGender>([
                          'male',
                          'female',
                      ])
                    : team.gender;
            const player = await insertMember({
                statusId: activeStatus.id,
                firstName: faker.person.firstName(gender),
                lastName: faker.person.lastName(),
                birthdate: toDateString(
                    faker.date.birthdate({
                        min: ageRange[0],
                        max: ageRange[1],
                        mode: 'age',
                    }),
                ),
                gender,
            });
            seeded.members.push(player);
            const assignment = await insertTeamAssignment({
                teamId: team.id,
                memberId: player.id,
                role: 'player',
            });
            seeded.teamAssignments.push(assignment);
        }

        const coachGender = faker.helpers.arrayElement<MemberGender>([
            'male',
            'female',
        ]);
        const coach = await insertMember({
            statusId: activeStatus.id,
            firstName: faker.person.firstName(coachGender),
            lastName: faker.person.lastName(),
            birthdate: toDateString(
                faker.date.birthdate({ min: 25, max: 55, mode: 'age' }),
            ),
            gender: coachGender,
        });
        seeded.members.push(coach);
        const coachAssignment = await insertTeamAssignment({
            teamId: team.id,
            memberId: coach.id,
            role: 'coach',
        });
        seeded.teamAssignments.push(coachAssignment);

        Logger.info(
            [team.label, club.name, `${playerCount} players + 1 coach`],
            ' ',
        );
    }

    Logger.nl();
    Logger.info(
        `Created ${seeded.members.length} members, ${seeded.teamAssignments.length} team assignments`,
    );
    Logger.nl(2);

    // -------------------------- personas
    Logger.title('PERSONAS');
    Logger.nl();

    const resolveTeam = (
        persona: (typeof PERSONAS)[number],
        ref: Pick<PersonaTeamRef, 'categoryName' | 'gender' | 'index'>,
    ): TeamInfo => {
        const info = teamByRef.get(
            teamRefKey(
                persona.clubCode,
                ref.categoryName,
                ref.gender,
                ref.index,
            ),
        );
        if (!info) {
            throw new Error(
                `Persona ${persona.email}: no team for ${persona.clubCode} ${ref.categoryName}/${ref.gender}/${ref.index}`,
            );
        }
        return info;
    };

    for (const persona of PERSONAS) {
        const personaBirthdate = toDateString(
            new Date(CONFIG.season - persona.age, 5, 15),
        );
        const personaMember = await insertMember({
            statusId: activeStatus.id,
            firstName: persona.firstName,
            lastName: persona.lastName,
            birthdate: personaBirthdate,
            gender: persona.gender,
        });
        seeded.members.push(personaMember);

        const personaUser = await insertUser({
            email: persona.email,
            displayName: `${persona.firstName} ${persona.lastName}`,
            role: persona.role,
        });
        seeded.users.push(personaUser);

        const selfLink = await insertUserMemberLink({
            userId: personaUser.id,
            memberId: personaMember.id,
            type: 'self',
            description: null,
        });
        seeded.userMembers.push(selfLink);

        const bestRoleByTeam = new Map<string, TeamRole>();
        for (const ref of persona.assignments) {
            const info = resolveTeam(persona, ref);
            const current = bestRoleByTeam.get(info.team.id);
            if (!current || ROLE_PRIORITY[ref.role] > ROLE_PRIORITY[current]) {
                bestRoleByTeam.set(info.team.id, ref.role);
            }
        }
        for (const [teamId, role] of bestRoleByTeam) {
            const assignment = await insertTeamAssignment({
                teamId,
                memberId: personaMember.id,
                role,
            });
            seeded.teamAssignments.push(assignment);
        }

        for (const kid of persona.kids) {
            const kidTeam = resolveTeam(persona, kid.team);
            const kidMember = await insertMember({
                statusId: activeStatus.id,
                firstName: kid.firstName,
                lastName: persona.lastName,
                birthdate: toDateString(
                    faker.date.birthdate({
                        min: kidTeam.ageRange[0],
                        max: kidTeam.ageRange[1],
                        mode: 'age',
                    }),
                ),
                gender: kid.gender,
            });
            seeded.members.push(kidMember);

            const kidAssignment = await insertTeamAssignment({
                teamId: kidTeam.team.id,
                memberId: kidMember.id,
                role: 'player',
            });
            seeded.teamAssignments.push(kidAssignment);

            const kidLink = await insertUserMemberLink({
                userId: personaUser.id,
                memberId: kidMember.id,
                type: 'relative',
                description: persona.gender === 'male' ? 'Father' : 'Mother',
            });
            seeded.userMembers.push(kidLink);
        }

        Logger.info(
            [`${persona.firstName} [${persona.role}]`, persona.email],
            ' ',
        );
        Logger.info(
            [
                '',
                `${bestRoleByTeam.size} assignments / ${persona.kids.length} relationships`,
            ],
            ' ',
        );
    }

    Logger.nl();
    Logger.info(
        `Created ${seeded.users.length} personas, ${seeded.userMembers.length} user-member links`,
    );
    Logger.nl(2);

    // -------------------------- conclusion
    Logger.nl(1);
    Logger.title(`${emojis.magic} Seeding complete`);
    process.exit(0);
}

// only self-execute when run directly vs imported
if (import.meta.url === `file://${process.argv[1]}`) {
    seedCreate(process.argv.includes('--force')).catch((err) => {
        console.error(String(err));
        process.exit(1);
    });
}
