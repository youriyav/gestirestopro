import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrimaryButton } from '@app/components/ui/buttons/primary-button/primary-button.component';
import { ForgetPasswordComponent } from '@features/auth/forget-password/forget-password.component';
import { AuthService } from '@app/core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [PrimaryButton, ForgetPasswordComponent, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  showForgotPasswordModal = signal(false);
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  handleLogin(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.loginForm.invalid) {
      this.errorMessage.set('Veuillez remplir tous les champs correctement');
      return;
    }

    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        // Redirect to return URL or dashboard
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        if (error.status === 401) {
          this.errorMessage.set('Email ou mot de passe incorrect');
        } else if (error.status === 404) {
          this.errorMessage.set('Utilisateur non trouvé');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  openForgotPasswordModal() {
    this.showForgotPasswordModal.set(true);
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal.set(false);
  }
}
