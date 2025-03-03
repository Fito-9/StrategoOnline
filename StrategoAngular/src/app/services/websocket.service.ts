import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class WebsocketService {
  private socket$: WebSocketSubject<string> | null = null;
  private connectedUsers: Set<number> = new Set();
  public gameMessage$ = new Subject<any>();
  public connected$ = new BehaviorSubject<boolean>(false);
  public onlineUsers$ = new BehaviorSubject<Set<number>>(new Set());
  public matchmakingMessage$ = new BehaviorSubject<any>(null);
  public gameUpdate$ = new BehaviorSubject<any>(null); // Nuevo BehaviorSubject para actualizaciones del juego

  constructor(private http: HttpClient) {}

  connect(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No hay token disponible, no se puede conectar al WebSocket.');
      return;
    }

    const url = `${environment.socketUrl}?token=${token}`;
    console.log('Conectando a WebSocket:', url);
    
    this.socket$ = webSocket({
      url: url,
      serializer: msg => msg,
      deserializer: event => event.data,
      openObserver: {
        next: () => {
          console.log('WebSocket conectado');
          this.connected$.next(true);
          this.reconnectAttempts = 0; // Reiniciar intentos de reconexión
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket desconectado');
          this.connected$.next(false);
          this.connectedUsers.clear();
          this.onlineUsers$.next(new Set());
          this.reconnect(); // Intentar reconectar
        }
      }
    });

    this.socket$.subscribe({
      next: (message: string) => this.handleMessage(message),
      error: err => {
        console.error('Error en WebSocket:', err);
        this.reconnect(); // Intentar reconectar en caso de error
      }
    });
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
      this.connected$.next(false);
    }
  }
  private handleMessage(message: string): void {
    console.log('Mensaje recibido:', message);
    try {
      const parsed = JSON.parse(message);
      console.log('Tipo de mensaje:', parsed.type);
  
      switch (parsed.type) {
        case 'onlineUsers':
          const userIds: number[] = parsed.payload;
          this.connectedUsers = new Set(userIds);
          this.onlineUsers$.next(new Set(userIds));
          break;
        case 'matchFound':
          console.log('Match encontrado. Tu oponente es el usuario:', parsed.payload.opponentId);
          this.matchmakingMessage$.next(parsed);
          break;
        case 'waitingForMatch':
          console.log('Esperando oponente:', parsed.payload);
          this.matchmakingMessage$.next(parsed);
          break;
        case 'gameUpdate':
          console.log('Actualización del juego recibida:', parsed.payload);
          // Importante: usar next() para notificar a los suscriptores
          this.gameUpdate$.next(parsed.payload);
          break;
        default:
          console.log('Mensaje de tipo desconocido:', parsed);
          // Intentar detectar eventos de juego genéricos:
          if (parsed.gameId || (parsed.payload && parsed.payload.gameId)) {
            console.log('Posible evento de juego detectado:', parsed);
            this.gameMessage$.next(parsed);
          }
      }
    } catch (error) {
      console.error('Error parseando mensaje JSON:', error);
      console.error('Mensaje original:', message);
    }
  }

  requestMatchmaking(): void {
    if (this.socket$) {
      console.log('Enviando solicitud de matchmaking');
      const message = {
        type: 'matchmakingRequest',
        payload: {}
      };
      this.socket$.next(JSON.stringify(message));
    } else {
      console.warn('No se puede enviar solicitud: Socket no está conectado.');
    }
  }

  getOnlineUsers(): Set<number> {
    return this.connectedUsers;
  }

  fetchOnlineUsers(): void {
    this.http.get<number[]>(`${environment.apiUrl}WebSocket/online-users`).subscribe(onlineUsers => {
      this.connectedUsers = new Set(onlineUsers);
      this.onlineUsers$.next(this.connectedUsers);
    }, error => {
      console.error("Error obteniendo usuarios conectados:", error);
    });
  }
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 segundos
  
  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Número máximo de intentos de reconexión alcanzado.');
    }
  }
} 
