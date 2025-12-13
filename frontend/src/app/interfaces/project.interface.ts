export interface Project {
    id: number;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    createdAt?: string;
    updatedAt?: string;
}
