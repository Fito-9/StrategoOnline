import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  Email: string = ''; 
  Password: string = ''; 
  jwt: string | null = null; 
  usuarioId: number | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Obtenemos el token desde el almacenamiento local en OnInit
    this.jwt = localStorage.getItem('accessToken'); 
  }

  async submit() {
    const authData = { Email: this.Email, Password: this.Password }; 

    try {
      const result = await this.authService.login(authData).toPromise();

      if (result) {
        console.log("Inicio de sesión exitoso.");
        this.router.navigate(['/']);
      } else {
        console.error("No se recibió un token de acceso.");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  }
}
