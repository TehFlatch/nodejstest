import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from './components/loader/loader.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterModule, MatToolbarModule, MatButtonModule, LoaderComponent, MatSnackBarModule, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Project Management');

  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    // Connect to WebSocket
    this.socketService.connect();

    // Listen for global notifications
    this.socketService.onEvent<any>('project:created').subscribe(data => {
      this.snackBar.open('New project created!', 'Close', { duration: 3000 });
    });

    this.socketService.onEvent<any>('task:created').subscribe(data => {
      this.snackBar.open('New task created!', 'Close', { duration: 3000 });
    });
  }
}
