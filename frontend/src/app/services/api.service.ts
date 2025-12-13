import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { Project } from '../interfaces/project.interface';
import { Task } from '../interfaces/task.interface';
import { LoadingService } from './loading.service';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = 'http://localhost:3000/api';
    private http = inject(HttpClient);
    private loadingService = inject(LoadingService);

    // Projects
    getProjects(): Observable<Project[]> {
        this.loadingService.show();
        return this.http.get<{ data: { projects: Project[] } }>(`${this.apiUrl}/projects`).pipe(
            map(res => res.data.projects),
            finalize(() => this.loadingService.hide())
        );
    }

    getProject(id: number): Observable<Project> {
        this.loadingService.show();
        return this.http.get<{ data: { project: Project } }>(`${this.apiUrl}/projects/${id}`).pipe(
            map(res => res.data.project),
            finalize(() => this.loadingService.hide())
        );
    }

    createProject(project: Partial<Project>): Observable<Project> {
        this.loadingService.show();
        return this.http.post<{ data: { project: Project } }>(`${this.apiUrl}/projects`, project).pipe(
            map(res => res.data.project),
            finalize(() => this.loadingService.hide())
        );
    }

    deleteProject(id: number): Observable<void> {
        this.loadingService.show();
        return this.http.delete<void>(`${this.apiUrl}/projects/${id}`).pipe(
            finalize(() => this.loadingService.hide())
        );
    }

    // Tasks
    getTasks(projectId: number): Observable<Task[]> {
        this.loadingService.show();
        return this.http.get<{ data: { tasks: Task[] } }>(`${this.apiUrl}/tasks/project/${projectId}`).pipe(
            map(res => res.data.tasks),
            finalize(() => this.loadingService.hide())
        );
    }

    createTask(task: Partial<Task>): Observable<Task> {
        this.loadingService.show();
        return this.http.post<{ data: { task: Task } }>(`${this.apiUrl}/tasks`, task).pipe(
            map(res => res.data.task),
            finalize(() => this.loadingService.hide())
        );
    }

    updateTask(id: number, task: Partial<Task>): Observable<Task> {
        this.loadingService.show();
        return this.http.put<{ data: { task: Task } }>(`${this.apiUrl}/tasks/${id}`, task).pipe(
            map(res => res.data.task),
            finalize(() => this.loadingService.hide())
        );
    }

    deleteTask(id: number): Observable<void> {
        this.loadingService.show();
        return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
            finalize(() => this.loadingService.hide())
        );
    }
}
