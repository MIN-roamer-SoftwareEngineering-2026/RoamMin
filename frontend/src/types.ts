export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  language: 'zh' | 'en';
}

export interface UserSummary {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ProfileUpdate {
  nickname: string;
  avatarUrl: string;
  bio: string;
  language: 'zh' | 'en';
}

export interface Trip {
  id: number;
  ownerId: number;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface TripMember {
  id: number | null;
  userId: number;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: string | null;
}

export interface BuddyPost {
  id: number;
  authorId: number;
  title: string;
  destination: string;
  travelDate: string | null;
  description: string;
  createdAt: string;
}

export interface PublicProfile {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  publishedTrips: Trip[];
  buddyPosts: BuddyPost[];
}
