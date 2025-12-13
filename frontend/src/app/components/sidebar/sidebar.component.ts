import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  protected messages = signal<Array<{ time: string; text: string }>>([]);

  private socketService = inject(SocketService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Helper to pipe destroy ref
    const listen = (event: string, prefix: string) => {
      this.socketService
        .onEvent<any>(event)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data) => {
          this.addMessage(`${prefix}: ${data?.title ?? JSON.stringify(data)}`);
        });
    };

    listen('project:created', 'Project created');
    listen('task:created', 'Task created');
    listen('notification', 'Notification');
  }

  private addMessage(text: string) {
    this.messages.update((list) => {
      const newList = [{ time: new Date().toLocaleTimeString(), text }, ...list];
      return newList.slice(0, 50);
    });
  }
}
