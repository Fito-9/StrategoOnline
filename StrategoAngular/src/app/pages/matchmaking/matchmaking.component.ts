import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'matchmaking',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchMakingComponent implements OnInit {
    matchFound: any = null;
    waitingMessage: string = '';
  
    constructor(private websocketService: WebsocketService) { }
  
    ngOnInit(): void {
      if (!this.websocketService.connected$.getValue()) {
        console.log('No hay conexión activa, reconectando...');
        this.websocketService.connect();
      }
      this.websocketService.matchmakingMessage$.subscribe(message => {
        console.log('Mensaje de matchmaking recibido:', message);
        if (message) {
          if (message.type === 'matchFound') {
            this.matchFound = message.payload;
            this.waitingMessage = '';
          } else if (message.type === 'waitingForMatch') {
            this.waitingMessage = message.payload;
            this.matchFound = null;
          }
        }
      });
    }
  
    // Invoca el método requestMatchmaking del servicio
    buscarPartida(): void {
      this.websocketService.requestMatchmaking();
    }

}