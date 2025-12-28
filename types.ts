
export interface Post {
  id: string;
  created_at: string;
  title: string;
  book_title: string;
  book_author: string;
  content: string;
  user_name: string;
  category: string;
  cover_url?: string;
  user_id?: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export enum PostCategory {
  FICTION = 'Fiction',
  NON_FICTION = 'Non-Fiction',
  POETRY = 'Poésie',
  PHILOSOPHY = 'Philosophie',
  SCIENCE = 'Sciences',
  HISTORY = 'Histoire'
}
