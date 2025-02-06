// src/app/services/friendship.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/User';

export interface FriendRequestDto {
  senderId: number;
  receiverId: number;
  senderNickname?: string;
  senderAvatar?: string;
}

export interface FriendRequestResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FriendshipService {
  private apiUrl = `${environment.apiUrl}Friendship`;

  constructor(private http: HttpClient) {}

  sendFriendRequest(senderId: number, receiverId: number): Observable<FriendRequestResponse> {
    const body = { senderId, receiverId };
    return this.http.post<FriendRequestResponse>(`${this.apiUrl}/send-request`, body);
  }

  getPendingRequests(userId: number): Observable<FriendRequestDto[]> {
    return this.http.get<FriendRequestDto[]>(`${this.apiUrl}/pending-requests/${userId}`);
  }

  getFriends(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/friends/${userId}`);
  }

  acceptFriendRequest(senderId: number, receiverId: number): Observable<FriendRequestResponse> {
    const body = { senderId, receiverId };
    return this.http.post<FriendRequestResponse>(`${this.apiUrl}/accept-request`, body);
  }

  rejectFriendRequest(senderId: number, receiverId: number): Observable<FriendRequestResponse> {
    const body = { senderId, receiverId };
    return this.http.post<FriendRequestResponse>(`${this.apiUrl}/reject-request`, body);
  }
}
