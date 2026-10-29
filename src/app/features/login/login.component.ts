import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { initials } from '../../core/util';

/** Autentificare simulată (în varianta reală: Microsoft Entra ID / MSAL). */
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  auth = inject(AuthService);
  data = inject(DataService);
  step = signal(1);
  ini = initials;
}
