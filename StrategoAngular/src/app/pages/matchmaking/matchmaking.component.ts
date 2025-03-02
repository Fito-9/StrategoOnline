import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';
import { GameComponent } from "../game/game.component";

@Component({
  selector: 'matchmaking',
  standalone: true,
  imports: [RouterModule, CommonModule, GameComponent],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchMakingComponent implements OnInit {
  matchFound: any = null;
  waitingMessage: string = '';

  constructor(private websocketService: WebsocketService) { }

  ngOnInit(): void {
    // Verificar si el WebSocket está conectado
    if (!this.websocketService.connected$.getValue()) {
      console.log('WebSocket no está conectado. Reconectando...');
      this.websocketService.connect(); // Intentar reconectar
    }

    // Suscribirse a los mensajes de matchmaking
    this.websocketService.matchmakingMessage$.subscribe(message => {
      if (message?.type === 'matchFound') {
        this.matchFound = message.payload;
        this.waitingMessage = '';
      } else if (message?.type === 'waitingForMatch') {
        this.waitingMessage = message.payload;
      }
    });
  }

  buscarPartida(): void {
    // Verificar nuevamente si el WebSocket está conectado antes de solicitar matchmaking
    if (!this.websocketService.connected$.getValue()) {
      console.log('WebSocket no está conectado. Reconectando...');
      this.websocketService.connect();
    }

    // Solicitar matchmaking
    this.websocketService.requestMatchmaking();
  }
}