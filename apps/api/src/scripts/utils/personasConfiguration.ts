import type {
  MemberGender,
  TeamGender,
  TeamRole,
  UserRole,
} from '../../types/index.js';

export type PersonaTeamRef = {
  categoryName: string;
  gender: TeamGender;
  index: number;
  role: TeamRole;
};

export type PersonaKid = {
  first_name: string;
  gender: MemberGender;
  team: Omit<PersonaTeamRef, 'role'>;
};

export type PersonaConfiguration = {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  gender: MemberGender;
  age: number;
  clubCode: string;
  assignments: PersonaTeamRef[];
  kids: PersonaKid[];
};

const PERSONAS: PersonaConfiguration[] = [
  {
    first_name: 'Sebastien',
    last_name: 'DOE',
    email: 'sebastien@eggplant.app',
    role: 'admin',
    gender: 'male',
    age: 50,
    clubCode: 'CSG-BASKETBALL',
    assignments: [
      { categoryName: 'Senior', gender: 'male', index: 1, role: 'coach' },
      { categoryName: 'U18', gender: 'male', index: 2, role: 'coach' },
      { categoryName: 'Senior', gender: 'male', index: 1, role: 'player' },
    ],
    kids: [
      {
        first_name: 'Benjamin',
        gender: 'male',
        team: { categoryName: 'U18', gender: 'male', index: 2 },
      },
    ],
  },
  {
    first_name: 'Jean',
    last_name: 'DOE',
    email: 'jean@eggplant.app',
    role: 'admin',
    gender: 'male',
    age: 45,
    clubCode: 'CSG-BASKETBALL',
    assignments: [],
    kids: [
      {
        first_name: 'Adam',
        gender: 'male',
        team: { categoryName: 'U18', gender: 'male', index: 2 },
      },
    ],
  },
  {
    first_name: 'Marine',
    last_name: 'DOE',
    email: 'nathalie@eggplant.app',
    role: 'user',
    gender: 'female',
    age: 35,
    clubCode: 'CSG-BASKETBALL',
    assignments: [],
    kids: [],
  },
  {
    first_name: 'Antoine',
    last_name: 'DOE',
    email: 'antoine@eggplant.app',
    role: 'admin',
    gender: 'male',
    age: 40,
    clubCode: 'CSG-BASKETBALL',
    assignments: [
      { categoryName: 'U13', gender: 'male', index: 1, role: 'assistant' },
      { categoryName: 'Senior', gender: 'mixed', index: 1, role: 'coach' },
      { categoryName: 'Senior', gender: 'male', index: 3, role: 'player' },
    ],
    kids: [
      {
        first_name: 'Virgile',
        gender: 'male',
        team: { categoryName: 'U18', gender: 'male', index: 1 },
      },
      {
        first_name: 'Camille',
        gender: 'male',
        team: { categoryName: 'U13', gender: 'male', index: 1 },
      },
    ],
  },
  {
    first_name: 'Zoé',
    last_name: 'DOE',
    email: 'zoe@eggplant.app',
    role: 'user',
    gender: 'female',
    age: 42,
    clubCode: 'CSG-BASKETBALL',
    assignments: [],
    kids: [
      {
        first_name: 'Pierre',
        gender: 'male',
        team: { categoryName: 'U18', gender: 'male', index: 1 },
      },
      {
        first_name: 'Sacha',
        gender: 'male',
        team: { categoryName: 'U13', gender: 'male', index: 1 },
      },
      {
        first_name: 'Lucille',
        gender: 'female',
        team: { categoryName: 'U7', gender: 'mixed', index: 1 },
      },
    ],
  },
  {
    first_name: 'François',
    last_name: 'DOE',
    email: 'francois@eggplant.app',
    role: 'manager',
    gender: 'male',
    age: 45,
    clubCode: 'CSG-BASKETBALL',
    assignments: [
      { categoryName: 'Senior', gender: 'male', index: 1, role: 'player' },
      { categoryName: 'U11', gender: 'male', index: 1, role: 'coach' },
    ],
    kids: [],
  },
];

export default PERSONAS;
