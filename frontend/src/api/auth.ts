import { http, unwrap } from './http';
import type { ApiResponse, AuthResponse, ProfileUpdate, User, UserSummary } from '../types';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    unwrap<AuthResponse>(http.post<ApiResponse<AuthResponse>>('/auth/register', input)),
  login: (input: LoginInput) =>
    unwrap<AuthResponse>(http.post<ApiResponse<AuthResponse>>('/auth/login', input)),
  me: () => unwrap<User>(http.get<ApiResponse<User>>('/auth/me')),
  updateProfile: (input: ProfileUpdate) =>
    unwrap<User>(http.put<ApiResponse<User>>('/users/me', input)),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<User>(http.post<ApiResponse<User>>('/users/me/avatar', form, {
      headers: { 'Content-Type': undefined },
    }));
  },
  searchUsers: (query: string) =>
    unwrap<UserSummary[]>(http.get<ApiResponse<UserSummary[]>>('/users/search', { params: { q: query } })),
};
