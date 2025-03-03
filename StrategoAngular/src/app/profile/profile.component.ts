import { Component, Input, OnInit } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class ProfileComponent implements OnInit {
  @Input() userId: number = 0;  // El userId debería ser pasado desde el componente padre
  profile: any = { nickname: '', email: '', password: '', avatarUrl: '' };  // Inicialización directa
  errorMessage: string = '';
  selectedFile: File | null = null;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    // Solo hacer la llamada si userId es válido
    if (this.userId > 0) {
      this.profileService.getProfile(this.userId).subscribe({
        next: (data) => {
          this.profile = data;  // Aquí se actualiza el perfil
        },
        error: (err) => {
          this.errorMessage = 'Error al obtener el perfil';
          console.error(err);
        }
      });
    } else {
      this.errorMessage = 'ID de usuario no válido';
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    this.selectedFile = file;
  }

  updateProfile(): void {
    if (this.selectedFile) {
      console.log('Archivo seleccionado: ', this.selectedFile.name);
      // Lógica para subir el archivo
    }
    console.log('Perfil actualizado:', this.profile);
  }
}
