export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  tenantId: string;
  tenantName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  tenantName: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

export interface ApiError {
  status: string;
  message: string;
  error?: unknown;
  stack?: string;
}

