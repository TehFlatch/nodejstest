import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { ProjectList } from './components/project-list/project-list';
import { ProjectDetail } from './components/project-detail/project-detail';
import { TaskForm } from './components/task-form/task-form';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard },
    { path: 'projects', component: ProjectList },
    { path: 'projects/:id', component: ProjectDetail },
    // { path: 'tasks/new', component: TaskForm }, // Modal might be better but route is fine for now
];
