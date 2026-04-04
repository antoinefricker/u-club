export interface User {
  id: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  email: string;
  password: string;

  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}
