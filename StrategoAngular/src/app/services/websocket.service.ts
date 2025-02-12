import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<string> | null = null;
  private connectedUsers: Set<number> = new Set();

  // Observables para notificar cambios en la conexión
  public connected$ = new BehaviorSubject<boolean>(false);
  public onlineUsers$ = new BehaviorSubject<Set<number>>(new Set());

  constructor() {}

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
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket desconectado');
          this.connected$.next(false);
          this.connectedUsers.clear();
          this.onlineUsers$.next(new Set());
        }
      }
    });

    this.socket$.subscribe({
      next: (message: string) => this.handleMessage(message),
      error: err => console.error('Error en WebSocket:', err)
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

    if (message.startsWith('Conectado:')) {
      const userId = parseInt(message.split(' ')[1], 10);
      this.connectedUsers.add(userId);
    } 
    else if (message.startsWith('Desconectado:')) {
      const userId = parseInt(message.split(' ')[1], 10);
      this.connectedUsers.delete(userId);
    }

    this.onlineUsers$.next(new Set(this.connectedUsers)); // 🔥 Notificar cambios en usuarios conectados
  }

  getOnlineUsers(): Set<number> {
    return this.connectedUsers;
  }
}
