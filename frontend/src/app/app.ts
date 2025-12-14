import { Component, signal, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from './components/loader/loader.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SocketService } from './services/socket.service';
import { AuthService } from './services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterModule, MatToolbarModule, MatButtonModule, LoaderComponent, MatSnackBarModule, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Project Management');
  protected readonly isAdmin = signal(false);

  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Set up event listeners once
    this.setupEventListeners();

    // Update admin status
    this.isAdmin.set(this.authService.isAdmin());

    // Connect socket if user is already logged in and is admin
    if (this.authService.isAdmin()) {
      const tenantId = this.authService.getTenantId();
      if (tenantId) {
        this.socketService.connect(tenantId);
      }
    }

    // Listen for auth state changes
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      const isAdminUser = this.authService.isAdmin();
      this.isAdmin.set(isAdminUser);

      if (user && isAdminUser) {
        const tenantId = this.authService.getTenantId();
        if (tenantId) {
          this.socketService.connect(tenantId);
        }
      } else {
        // Disconnect if user is not admin or logged out
        this.socketService.disconnect();
      }
    });
  }

  private setupEventListeners() {
    this.socketService.onEvent<any>('project:created').pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.snackBar.open('New project created!', 'Close', { duration: 3000 });
    });

    this.socketService.onEvent<any>('task:created').pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.snackBar.open('New task created!', 'Close', { duration: 3000 });
    });

    this.socketService.onEvent<any>('task:updated').pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.snackBar.open('Task updated!', 'Close', { duration: 3000 });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
