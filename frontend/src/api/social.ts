import { http, unwrap } from './http';
import type { ApiResponse, BuddyPost, PublicProfile, Trip, TripMember } from '../types';

export const socialApi = {
  myTrips: () => unwrap<Trip[]>(http.get<ApiResponse<Trip[]>>('/trips/mine')),
  createTrip: (input: Pick<Trip, 'title' | 'destination' | 'startDate' | 'endDate'>) =>
    unwrap<Trip>(http.post<ApiResponse<Trip>>('/trips', input)),
  publishTrip: (id: number, published: boolean) =>
    unwrap<Trip>(published
      ? http.put<ApiResponse<Trip>>(`/trips/${id}/publish`)
      : http.delete<ApiResponse<Trip>>(`/trips/${id}/publish`)),
  tripMembers: (id: number) =>
    unwrap<TripMember[]>(http.get<ApiResponse<TripMember[]>>(`/trips/${id}/members`)),
  inviteMember: (id: number, username: string) =>
    unwrap<Trip>(http.post<ApiResponse<Trip>>(`/trips/${id}/members`, { username })),
  removeMember: (id: number) =>
    unwrap<void>(http.delete<ApiResponse<void>>(`/trips/members/${id}`)),
  favorites: () => unwrap<Trip[]>(http.get<ApiResponse<Trip[]>>('/trips/favorites')),
  favorite: (id: number, favorited: boolean) =>
    unwrap<void>(favorited
      ? http.post<ApiResponse<void>>(`/trips/${id}/favorite`)
      : http.delete<ApiResponse<void>>(`/trips/${id}/favorite`)),
  buddyPosts: () => unwrap<BuddyPost[]>(http.get<ApiResponse<BuddyPost[]>>('/buddy/mine')),
  createBuddyPost: (input: Pick<BuddyPost, 'title' | 'destination' | 'travelDate' | 'description'>) =>
    unwrap<BuddyPost>(http.post<ApiResponse<BuddyPost>>('/buddy', input)),
  deleteBuddyPost: (id: number) => unwrap<void>(http.delete<ApiResponse<void>>(`/buddy/${id}`)),
  publicProfile: (id: number) => unwrap<PublicProfile>(http.get<ApiResponse<PublicProfile>>(`/users/${id}`)),
};
