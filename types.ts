
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

export interface Reply {
  id: string;
  created_at: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  quoted_text?: string;
  parent_reply_id?: string;
}

export interface Circle {
  id: string;
  created_at: string;
  name: string;
  description: string;
  theme: string;
  is_private: boolean;
  cover_url?: string;
  creator_id: string;
}

export interface CircleReading {
  id: string;
  circle_id: string;
  book_title: string;
  book_author: string;
  end_date: string;
  synthesis?: string;
}

export interface CircleJournalEntry {
  id: string;
  circle_id: string;
  user_id: string;
  title?: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface CircleHistoryEntry {
  id: string;
  circle_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface CirclePoll {
  id: string;
  circle_id: string;
  options: { title: string; author: string }[];
  is_closed: boolean;
  created_at: string;
}

export interface CirclePollVote {
  poll_id: string;
  user_id: string;
  option_index: number;
}

export interface CircleQuote {
  id: string;
  circle_id: string;
  user_id: string;
  content: string;
  page_number?: string;
  profiles?: Profile;
}

export interface CircleEvent {
  id: string;
  circle_id: string;
  title: string;
  event_date: string;
  meeting_link?: string;
}

export interface CircleThread {
  id: string;
  circle_id: string;
  title: string;
  created_at: string;
}

export interface CircleThreadMessage {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id?: string;
  profiles?: Profile;
}

export interface CircleReadingRole {
  id: string;
  circle_id: string;
  user_id: string;
  role_name: string;
  profiles?: Profile;
}

export enum PostCategory {
  FICTION = 'Fiction',
  NON_FICTION = 'Non-Fiction',
  POETRY = 'Poésie',
  PHILOSOPHY = 'Philosophie',
  SCIENCE = 'Sciences',
  HISTORY = 'Histoire'
}
