import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, finalize, catchError } from 'rxjs/operators';
import { Project } from '../interfaces/project.interface';
import { Task } from '../interfaces/task.interface';
import { LoadingService } from './loading.service';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = environment.apiUrl;
    private http = inject(HttpClient);
    private loadingService = inject(LoadingService);
    private errorService = inject(ErrorService);

    private handleError<T>(operation: string) {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = error.error?.message || error.message || `${operation} failed`;
            this.errorService.showError(errorMessage, 'error');
            return throwError(() => error) as Observable<T>;
        };
    }

    // Auth
    login(credentials: { email: string; password: string }): Observable<any> {
        this.loadingService.show();
        return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
            catchError(this.handleError<any>('Login')),
            finalize(() => this.loadingService.hide())
        );
    }

    register(data: { email: string; password: string; name: string; tenantName: string }): Observable<any> {
        this.loadingService.show();
        return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
            catchError(this.handleError<any>('Registration')),
            finalize(() => this.loadingService.hide())
        );
    }

    // Projects
    getProjects(): Observable<Project[]> {
        this.loadingService.show();
        return this.http.get<{ data: { projects: Project[] } }>(`${this.apiUrl}/projects`).pipe(
            map(res => res.data.projects),
            catchError(this.handleError<Project[]>('Get projects')),
            finalize(() => this.loadingService.hide())
        );
    }

    getProject(id: number): Observable<Project> {
        this.loadingService.show();
        return this.http.get<{ data: { project: Project } }>(`${this.apiUrl}/projects/${id}`).pipe(
            map(res => res.data.project),
            catchError(this.handleError<Project>('Get project')),
            finalize(() => this.loadingService.hide())
        );
    }

    createProject(project: Partial<Project>): Observable<Project> {
        this.loadingService.show();
        return this.http.post<{ data: { project: Project } }>(`${this.apiUrl}/projects`, project).pipe(
            map(res => res.data.project),
            catchError(this.handleError<Project>('Create project')),
            finalize(() => this.loadingService.hide())
        );
    }

    deleteProject(id: number): Observable<void> {
        this.loadingService.show();
        return this.http.delete<void>(`${this.apiUrl}/projects/${id}`).pipe(
            catchError(this.handleError<void>('Delete project')),
            finalize(() => this.loadingService.hide())
        );
    }

    // Tasks
    getTasks(projectId: number): Observable<Task[]> {
        this.loadingService.show();
        return this.http.get<{ data: { tasks: Task[] } }>(`${this.apiUrl}/tasks?projectId=${projectId}`).pipe(
            map(res => res.data.tasks),
            catchError(this.handleError<Task[]>('Get tasks')),
            finalize(() => this.loadingService.hide())
        );
    }

    createTask(task: Partial<Task>): Observable<Task> {
        this.loadingService.show();
        return this.http.post<{ data: { task: Task } }>(`${this.apiUrl}/tasks`, task).pipe(
            map(res => res.data.task),
            catchError(this.handleError<Task>('Create task')),
            finalize(() => this.loadingService.hide())
        );
    }

    updateTask(id: number, task: Partial<Task>): Observable<Task> {
        this.loadingService.show();
        return this.http.put<{ data: { task: Task } }>(`${this.apiUrl}/tasks/${id}`, task).pipe(
            map(res => res.data.task),
            catchError(this.handleError<Task>('Update task')),
            finalize(() => this.loadingService.hide())
        );
    }

    deleteTask(id: number): Observable<void> {
        this.loadingService.show();
        return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
            catchError(this.handleError<void>('Delete task')),
            finalize(() => this.loadingService.hide())
        );
    }
}
