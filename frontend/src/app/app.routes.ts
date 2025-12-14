import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { ProjectList } from './components/project-list/project-list';
import { ProjectDetail } from './components/project-detail/project-detail';
import { TaskForm } from './components/task-form/task-form';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
    { path: 'projects', component: ProjectList, canActivate: [AuthGuard] },
    { path: 'projects/:id', component: ProjectDetail, canActivate: [AuthGuard] },
    // { path: 'tasks/new', component: TaskForm }, // Modal might be better but route is fine for now
];
