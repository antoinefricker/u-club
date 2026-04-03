export interface User {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  email: string;
  password: string;
  birthdate: string | null;
  created_at: string;
  updated_at: string;
}
