export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  color: string;
  todos_count?: number;
  user?: { id: number; name: string };
  created_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  todos_count?: number;
  user?: { id: number; name: string };
  created_at: string;
}

export interface Attachment {
  id: number;
  todo_id: number;
  user_id: number;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TodoStatus;
  image_url: string | null;
  tags: Tag[];
  project: Project | null;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  categories: Category[];
  content: string;
  image_url: string | null;
  reactions_count?: number;
  is_reacted?: boolean;
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  user: { id: number; name: string };
  post?: { id: number; title: string };
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  data: {
    post_id?: number;
    post_title?: string;
    commenter_name?: string;
    comment_id?: number;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  subject_type: string;
  subject_id: number;
  description: string;
  user?: { id: number; name: string };
  created_at: string;
}

export interface TodoFormData {
  title: string;
  description: string;
  status: TodoStatus;
  image?: File | null;
  removeImage?: boolean;
  tagIds: number[];
  projectId: number | null;
}
