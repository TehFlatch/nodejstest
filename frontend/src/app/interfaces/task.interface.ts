export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'done';
    dueDate?: string;
    projectId: number;
    createdAt?: string;
    updatedAt?: string;
}
