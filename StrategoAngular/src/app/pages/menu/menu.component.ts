// menu.component.ts
import { Component, OnInit } from '@angular/core';
import { FriendshipService } from '../../services/friendship.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  friendships: any[] = [];
  userId = 1; // ID de usuario actual, debería obtenerse dinámicamente

  constructor(private friendshipService: FriendshipService) {}

  ngOnInit(): void {
    this.loadFriendships();
  }

  loadFriendships(): void {
    this.friendshipService.getFriendships(this.userId).subscribe(
      (data) => this.friendships = data,
      (error) => console.error('Error al cargar amistades', error)
    );
  }

  acceptFriendship(friendshipId: number): void {
    this.friendshipService.acceptFriendship(friendshipId).subscribe(
      () => this.loadFriendships()
    );
  }

  rejectFriendship(friendshipId: number): void {
    this.friendshipService.rejectFriendship(friendshipId).subscribe(
      () => this.loadFriendships()
    );
  }
}