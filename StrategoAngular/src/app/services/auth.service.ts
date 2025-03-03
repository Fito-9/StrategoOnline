  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, BehaviorSubject } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { AuthRequest } from '../models/auth-request';
  import { AuthResponse } from '../models/auth-response';
  import { environment } from '../../environments/environment';
  import { Result } from '../models/result';
  import { ApiService } from './api.service';
  import { User } from '../models/User';
import { WebsocketService } from './websocket.service';

  @Injectable({
    providedIn: 'root'
  })
  export class AuthService {

    private URL = `${environment.apiUrl}`;
      //Behavior Subject es para que actualize el header nada más iniciar sesion para que salga el botón del usuario y el botón admin
    private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

    constructor(private http: HttpClient, private api: ApiService, private websocketService: WebsocketService) {}
  //mira si tiene token
    private hasToken(): boolean {
      return !!localStorage.getItem('accessToken');
    }

    get isLoggedIn() {
      return this.loggedIn.asObservable();
    }

    register(authData: FormData): Observable<any> {
      return this.http.post<any>(`${this.URL}user/register`, authData);
    }
    
    login(authData: AuthRequest): Observable<AuthResponse> {
      return this.http.post<AuthResponse>(`${this.URL}user/login`, authData).pipe(
        tap((response: AuthResponse) => {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('UserId', response.userId.toString());
          
          if (response.avatar) {
            localStorage.setItem('UserAvatar', response.avatar);
          }
    
          this.loggedIn.next(true);
          this.websocketService.connect();
        })
      );
    }

    async getUsers(): Promise<Result<User[]>> {
      return this.api.get<User[]>(`${this.URL}user`);
    }
    

    logout(): void {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('UserId');
      this.loggedIn.next(false);
      this.websocketService.disconnect();
    }
  //consigue los datos del token
    getUserDataFromToken(): any {
      const token = localStorage.getItem('accessToken');
    
      if (token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('El token no está bien estructurado.');
          return null;
        }
        const payloadBase64 = parts[1];
        const payloadJson = atob(payloadBase64);

        try {
          const payload = JSON.parse(payloadJson);
          return {
            id: payload.id || 'ID no disponible',
            name: payload.Nombre || 'Nombre no disponible',
            email: payload.Email || 'Correo no disponible',
            address: payload.Direccion || 'Dirección no disponible',
            esAdmin: payload.esAdmin || false
          };
        } catch (e) {
          console.error('Error al parsear el JSON del payload:', e);
          return null;
        }
      }
      return null;
    }
  //actualiza los datos de usuario
    updateUserData(user: any): Observable<any> {
      return this.http.post<any>(`${this.URL}ControladorUsuario/update`, user);
    }

    
  }
