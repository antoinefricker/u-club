export type MemberGender = 'male' | 'female';

export interface Member {
    id: string;
    statusId: string | null;
    statusLabel: string | null;
    firstName: string;
    lastName: string;
    birthdate: string | null;
    gender: MemberGender;
    createdAt: string;
    updatedAt: string;
}

export const MEMBER_GENDER_LABELS: Record<MemberGender, string> = {
    male: 'Male',
    female: 'Female',
};

export const MEMBER_GENDER_OPTIONS: { value: MemberGender; label: string }[] = (
    Object.keys(MEMBER_GENDER_LABELS) as MemberGender[]
).map((value) => ({
    value,
    label: MEMBER_GENDER_LABELS[value],
}));
