import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email: string = ''; 
  password: string = ''; 
  nombre: string = '';
  selectedFile: File | null = null; // Para manejar la imagen seleccionada

  constructor(private authService: AuthService, private router: Router) {}

  // Método para capturar la imagen seleccionada
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async submit() {
    const formData = new FormData();
    formData.append('Nickname', this.nombre);
    formData.append('Email', this.email);
    formData.append('Password', this.password);
    if (this.selectedFile) {
      formData.append('Ruta', this.selectedFile); // Agrega la imagen
    }

    try {
      const result = await this.authService.register(formData).toPromise();
      if (result) {
        this.router.navigate(['/login']); 
      }
    } catch (error) {
      console.error('Error en el registro:', error);
    }
  }
}
