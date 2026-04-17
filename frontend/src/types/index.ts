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

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TodoStatus;
  image_url: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface TodoFormData {
  title: string;
  description: string;
  status: TodoStatus;
  image?: File | null;
  removeImage?: boolean;
}
