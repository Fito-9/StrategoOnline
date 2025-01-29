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
  direccion: string = ''; 
  jwt: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async submit() {
    //los datos que hacen falta para el registro
    const authData = { Nickname: this.nombre, Email: this.email , Password: this.password}; 
    const result = await this.authService.register(authData).toPromise();
//navega al login para iniciar sesión
    if (result) {
      this.jwt = result.stringToken; 
      this.router.navigate(['/login']); 
    }
  }
}
