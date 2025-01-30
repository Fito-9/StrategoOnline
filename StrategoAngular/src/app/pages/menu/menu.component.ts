// menu.component.ts
import { Component, OnInit } from '@angular/core';
import { FriendshipService } from '../../services/friendship.service';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth.service';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  standalone: true,
  imports: [NgModel],
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  friendships: any[] = [];
  userId = 1;
  users: User[] = []; 
  filteredUsers: User[] = [];
  searchTerm: string = ''; 
  constructor(private friendshipService: FriendshipService, private authService : AuthService) {}

  async ngOnInit(): Promise<void> {
    (await this.authService.getUsers()).subscribe(users => {
      this.users = users;
      this.filteredUsers = users; // Inicialmente muestra todos los usuarios
    });
  }
  
  }

  
