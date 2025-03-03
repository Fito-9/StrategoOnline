import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfileDto {
  userId: number;
  nickname: string;
  email: string;
  avatar?: string;
}

export interface ProfileUpdateDto {
  nickname?: string;
  email?: string;
  avatar?: File;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}User`;

  constructor(private http: HttpClient) {}

  // Obtener el perfil de un usuario por su ID
  getProfile(userId: number): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.apiUrl}/profile/${userId}`);
  }

  // Actualizar el perfil de un usuario
  updateProfile(userId: number, profile: ProfileUpdateDto): Observable<any> {
    const formData = new FormData();
    if (profile.nickname) formData.append('nickname', profile.nickname);
    if (profile.email) formData.append('email', profile.email);
    if (profile.avatar) formData.append('avatar', profile.avatar);

    return this.http.put(`${this.apiUrl}/profile/${userId}`, formData);
  }
}
