/*

1. Configurations

- clubs
 - categories
    - teams [gender/index]

Store clubs, categories and teams


2. Members generation per team

- between 10 and 15 members per team
- add a coach
- random birthdate but  age according to category
- link to user account 
    - 90% are linked self account
    - 10% are pending relation (no account yet)

    
3. Create Personas





members
 - delete year column

 - 
*/

import type { TeamGender } from '../../types/index.js';

type ClubConfiguration = {
  code: string;
  name: string;
  categories: CategoryConfiguration[];
};
type CategoryConfiguration = {
  name: string;
  ageRange: [number, number];
  genders: TeamConfiguration[];
  competition?: boolean;
};
type TeamConfiguration = {
  type: TeamGender;
  teams: number;
  competition?: boolean;
};

const SEASON = 2026;
const CLUB_CONFIGURATION: ClubConfiguration[] = [
  {
    name: 'CSG Baskin',
    code: 'CSG-BASKIN',
    categories: [
      {
        name: 'Senior',
        ageRange: [16, 50],
        genders: [{ type: 'mixed', teams: 2 }],
        competition: true,
      },
    ],
  },
  {
    name: 'CSG Basketball',
    code: 'CSG-BASKETBALL',
    categories: [
      {
        name: 'U7',
        ageRange: [5, 7],
        genders: [{ type: 'mixed', teams: 1 }],
        competition: true,
      },
      {
        name: 'U9',
        ageRange: [8, 9],
        genders: [{ type: 'mixed', teams: 1 }],
        competition: true,
      },
      {
        name: 'U11',
        ageRange: [10, 11],
        genders: [
          { type: 'male', teams: 1 },
          { type: 'female', teams: 1 },
        ],
        competition: true,
      },
      {
        name: 'U13',
        ageRange: [12, 13],
        genders: [
          { type: 'male', teams: 1 },
          { type: 'female', teams: 1 },
        ],
        competition: true,
      },
      {
        name: 'U15',
        ageRange: [14, 15],
        genders: [
          { type: 'male', teams: 1 },
          { type: 'female', teams: 1 },
        ],
      },
      {
        name: 'U18',
        ageRange: [16, 18],
        genders: [{ type: 'male', teams: 2 }],
        competition: true,
      },
      {
        name: 'Senior',
        ageRange: [19, 50],
        genders: [
          { type: 'male', teams: 3 },
          { type: 'female', teams: 1 },
          {
            type: 'mixed',
            teams: 1,
            competition: false,
          },
        ],
      },
    ],
  },
];

export default {
  season: SEASON,
  seedPassword: 'password123',
  clubs: CLUB_CONFIGURATION,
  memberStatuses: ['active', 'pending', 'inactive'],
};
