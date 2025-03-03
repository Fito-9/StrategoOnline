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
      this.websocketService.connect();
    }

    // Suscribirse a los mensajes de matchmaking
    this.websocketService.matchmakingMessage$.subscribe(message => {
      if (message?.type === 'matchFound') {
        if (!this.matchFound) {
          this.matchFound = {};
        }
        this.matchFound.gameId = message.payload.gameId.toString();
        this.waitingMessage = '';
    
        const currentUserId = Number(localStorage.getItem('UserId'));
        console.log("Mi ID:", currentUserId);
        console.log("Player1 ID:", this.matchFound.player1Id);
        console.log("Player2 ID:", this.matchFound.player2Id);

        if (currentUserId === message.payload.player1Id) {
          localStorage.setItem('playerType', 'Player1');
          localStorage.setItem('playerName', 'Jugador'+currentUserId);;
        } else {
          localStorage.setItem('playerType', 'Player2');
          localStorage.setItem('playerName', 'Jugador'+currentUserId);
        }
    
        console.log(`Partida encontrada. Eres ${localStorage.getItem('playerType')}`);
      } else if (message?.type === 'waitingForMatch') {
        this.waitingMessage = message.payload;
      }
    });
    
  }

  buscarPartida(): void {
    // Verificar nuevamente si el WebSocket está conectado antes de empezar el matchmaking
    if (!this.websocketService.connected$.getValue()) {
      console.log('WebSocket no está conectado. Reconectando...');
      this.websocketService.connect();
    }

    // Empezar matchmaking
    this.websocketService.requestMatchmaking();
  }
}
