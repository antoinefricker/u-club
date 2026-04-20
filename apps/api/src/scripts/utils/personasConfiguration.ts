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
  facts?: string[];
};

const PERSONAS: PersonaConfiguration[] = [
  {
    first_name: 'Sebastien',
    last_name: 'Doe',
    email: 'sebastien@eggplant.app',
    role: 'admin',
    gender: 'male',
    age: 43,
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
    facts: [
      'Sebastien is the club president',
      'He wants to be efficient in the numerous tasks he has to deal with.',
      'He does not want to switch apps according between apps or tasks.',
    ],
  },
  {
    first_name: 'Marine',
    last_name: 'Doe',
    email: 'nathalie@eggplant.app',
    role: 'user',
    gender: 'female',
    age: 52,
    clubCode: 'CSG-BASKETBALL',
    assignments: [],
    kids: [],
    facts: [
      'Marine is a former player but is still very interested in the club life.',
      'She follows assiduously the result of a few teams and attend to some matchs.',
      'She want a simple way to get in touch with her favorite teams.',
    ],
  },
  {
    first_name: 'Antoine',
    last_name: 'Doe',
    email: 'antoine@eggplant.app',
    role: 'manager',
    gender: 'male',
    age: 47,
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
    facts: [
      'He has many different roles (parent/player/coach) in the club and wants to be able to manage them all easily.',
      'He is tech savvy and wants to be able to avoid tedious tasks but also to lower notifications noise as much as possible ',
    ],
  },
  {
    first_name: 'Zoé',
    last_name: 'Doe',
    email: 'zoe@eggplant.app',
    role: 'user',
    gender: 'female',
    age: 34,
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
    facts: [
      'She is a very busy mother with a demanding job and three kids in the club',
      "She doesn't care about basketball but she wants to please her children.",
      'She will willingly participate in association tasks if informed in time of what has to be done.',
      'She uses the app occasionally, mostly to check schedules and receive notifications about team events.',
      'She appreciates clear and concise information without too many features.',
    ],
  },
  {
    first_name: 'François',
    last_name: 'Doe',
    email: 'francois@eggplant.app',
    role: 'manager',
    gender: 'male',
    age: 43,
    clubCode: 'CSG-BASKETBALL',
    assignments: [
      { categoryName: 'Senior', gender: 'male', index: 1, role: 'player' },
      { categoryName: 'U11', gender: 'male', index: 1, role: 'coach' },
    ],
    kids: [],
    facts: [
      "Francois is not tech-savvy and doesn't have much time to spend on the app.",
      'As a coach, he wants the app to ease the communication with the parents.',
      'As a player, he wants to easily access the schedule and essential team information without having to deal with the noise of current channels like WhatsApp groups.',
    ],
  },
  {
    first_name: 'Eline',
    last_name: 'Doe',
    email: 'eline@eggplant.app',
    role: 'user',
    gender: 'female',
    age: 14,
    clubCode: 'CSG-BASKETBALL',
    assignments: [
      { categoryName: 'U15', gender: 'female', index: 1, role: 'player' },
    ],
    kids: [],
    facts: [
      'Eline is a teenager who is passionate about basketball and is eager to improve her skills and compete at a high level.',
      'She is looking for an app that can help her stay connected with her team and coaches.',
      'She wants to be able to easily access her schedule, communicate with her teammates and coaches, and receive updates about team events and activities.',
    ],
  },
];

export default PERSONAS;
