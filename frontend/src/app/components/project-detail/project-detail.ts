import { Component, OnInit, inject, input, signal, effect, DestroyRef } from '@angular/core';
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

  constructor() {
    // React to ID changes automatically
    effect(() => {
      const projectId = this.id();
      if (projectId) {
        this.loadProject(+projectId);
        this.loadTasks(+projectId);
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

    this.api.createTask(task).subscribe((newTask) => {
      this.tasks.update((tasks) => [...tasks, newTask]);
      this.newTaskTitle.set('');
    });
  }

  deleteTask(taskId: number) {
    this.api.deleteTask(taskId).subscribe(() => {
      this.tasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
    });
  }
}
