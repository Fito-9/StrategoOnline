import { Component, OnInit } from '@angular/core';
import { User } from '../../models/User';
import { UserService } from '../../services/user.service';
import { FriendRequestDto, FriendshipService } from '../../services/friendship.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-friendship',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './friendship.component.html',
  styleUrl: './friendship.component.css'
})
export class FriendshipComponent implements OnInit{
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  onlineUserIds: Set<number> = new Set();

  pendingRequests: FriendRequestDto[] = [];
  friendIds: number[] = []; // IDs de usuarios que ya son amigos

  currentUserId: number = 0;

  constructor(
    private userService: UserService,
    private friendshipService: FriendshipService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    const storedId = localStorage.getItem('UserId');
    if (storedId) {
      this.currentUserId = parseInt(storedId, 10);
    }
    if (!this.websocketService.connected$.getValue()) {
      console.log('No hay conexión activa, reconectando...');
      this.websocketService.connect();
    }
    this.loadUsers();
    this.loadPendingRequests();
    this.loadFriends();
  
  
    this.websocketService.onlineUsers$.subscribe(onlineUsers => {
      this.onlineUserIds = onlineUsers;
    });
  }
  
  

  loadUsers(): void {
    this.userService.getUsers().subscribe(users => {
      this.users = users.filter(user => user.userId !== this.currentUserId);
      this.filteredUsers = [...this.users];
    });
  } 

  loadPendingRequests(): void {
    this.friendshipService.getPendingRequests(this.currentUserId).subscribe(requests => {
      this.pendingRequests = requests;
    });
  }

  loadFriends(): void {
    this.friendshipService.getFriends(this.currentUserId).subscribe(friends => {
      this.friendIds = friends.map(friend => friend.userId);
      
      
      friends.forEach(friend => {
        friend.isOnline = this.websocketService.getOnlineUsers().has(friend.userId);
      });
  
      this.users = friends; 
    });
  }
  
  

  searchUsers(): void {
    this.filteredUsers = this.users.filter(user =>
      user.nickname.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  sendFriendRequest(receiverId: number): void {
    this.friendshipService.sendFriendRequest(this.currentUserId, receiverId)
      .subscribe(response => {
        alert(response.message);
        this.loadPendingRequests();
      }, error => {
        console.error("Error al enviar solicitud:", error);
      });
  }

  acceptRequest(senderId: number): void {
    this.friendshipService.acceptFriendRequest(senderId, this.currentUserId)
      .subscribe(response => {
        alert(response.message);
        this.loadPendingRequests();
        this.loadFriends();
      }, error => {
        console.error("Error al aceptar solicitud:", error);
      });
  }

  rejectRequest(senderId: number): void {
    this.friendshipService.rejectFriendRequest(senderId, this.currentUserId)
      .subscribe(response => {
        alert(response.message);
        this.loadPendingRequests();
      }, error => {
        console.error("Error al rechazar solicitud:", error);
      });
  }
}