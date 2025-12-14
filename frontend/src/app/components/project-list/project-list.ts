import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // Best practice for cleanup
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { Project } from '../../interfaces/project.interface';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css',
})
export class ProjectList implements OnInit {
  // Signals
  projects = signal<Project[]>([]);
  newProjectTitle = signal('');
  newProjectDesc = signal('');

  private api = inject(ApiService);
  private socketService = inject(SocketService);
  private destroyRef = inject(DestroyRef); // Injection context cleanup

  ngOnInit() {
    this.loadProjects();
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners() {
    // Merge events or handle separately, simpler with takeUntilDestroyed
    this.socketService
      .onEvent<any>('project:created')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProjects());

    this.socketService
      .onEvent<any>('project:updated')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProjects());
  }

  loadProjects() {
    this.api.getProjects().subscribe({
      next: (data) => this.projects.set(data),
      error: (err) => {
        console.error('Error loading projects', err);
        this.projects.set([]);
      },
    });
  }

  createProject() {
    if (!this.newProjectTitle()) return;

    const project: Partial<Project> = {
      title: this.newProjectTitle(),
      description: this.newProjectDesc(),
      status: 'active',
    };

    // Don't manually update - let socket event reload the list to prevent duplicates
    this.api.createProject(project).subscribe(() => {
      this.newProjectTitle.set('');
      this.newProjectDesc.set('');
      // Socket event will reload the list automatically
    });
  }
}
