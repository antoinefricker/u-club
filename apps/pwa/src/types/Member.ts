export interface Member {
  id: string;
  statusId: string | null;
  statusLabel: string | null;
  firstName: string;
  lastName: string;
  birthdate: string | null;
  gender: string;
  createdAt: string;
  updatedAt: string;
}
