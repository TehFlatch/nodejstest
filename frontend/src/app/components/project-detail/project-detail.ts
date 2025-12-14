import { Component, OnInit, inject, input, signal, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { Project } from '../../interfaces/project.interface';
import { Task } from '../../interfaces/task.interface';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail {
  // Route param mapped to input (requires withComponentInputBinding in app.config)
  id = input<string>();

  // State Signals
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  newTaskTitle = signal<string>('');

  private api = inject(ApiService);
  private socketService = inject(SocketService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // React to ID changes automatically
    effect(() => {
      const projectId = this.id();
      if (projectId) {
        this.loadProject(+projectId);
        this.loadTasks(+projectId);
        this.setupRealtimeListeners(+projectId);
      }
    });
  }

  private setupRealtimeListeners(projectId: number) {
    // Listen for task events for this project
    this.socketService
      .onEvent<any>('task:created')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.task?.projectId === projectId) {
          this.tasks.update((tasks) => {
            // Check if task already exists to prevent duplicates
            const exists = tasks.some(t => t.id === data.task.id);
            if (exists) return tasks;
            return [...tasks, data.task];
          });
        }
      });

    this.socketService
      .onEvent<any>('task:updated')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.task?.projectId === projectId) {
          this.tasks.update((tasks) =>
            tasks.map((t) => (t.id === data.task.id ? data.task : t))
          );
        }
      });

    this.socketService
      .onEvent<any>('task:deleted')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.taskId) {
          this.tasks.update((tasks) => tasks.filter((t) => t.id !== data.taskId));
        }
      });
  }

  loadProject(id: number) {
    this.api.getProject(id).subscribe((data) => this.project.set(data));
  }

  loadTasks(projectId: number) {
    this.api.getTasks(projectId).subscribe((data) => this.tasks.set(data));
  }

  addTask() {
    const title = this.newTaskTitle();
    const currentProject = this.project();

    if (!title || !currentProject) return;

    const task: Partial<Task> = {
      title,
      status: 'todo',
      projectId: currentProject.id,
    };

    // Don't manually update - let socket event handle it to prevent duplicates
    this.api.createTask(task).subscribe(() => {
      this.newTaskTitle.set('');
      // Socket event will update the list automatically
    });
  }

  deleteTask(taskId: number) {
    // Don't manually update - let socket event handle it to prevent duplicates
    this.api.deleteTask(taskId).subscribe(() => {
      // Socket event will update the list automatically
    });
  }
}
