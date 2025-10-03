import { 
  User, 
  TaskWithDetails, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials,
  TaskFilters,
  PaginatedResponse,
  ExportPlan,
  TaskFormData,
  Plan
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://pdzanning-be-fag9g6fxakd6f3aw.canadacentral-01.azurewebsites.net/api'
    : '/api');

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.accessToken = localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const isIdempotent = method === 'GET';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Simple retry for transient 429/5xx on idempotent requests only
    const maxRetries = isIdempotent ? 2 : 0;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        return response.json();
      }

      // If 429 and Retry-After provided, wait
      if (attempt < maxRetries && (response.status === 429 || response.status >= 500)) {
        attempt++;
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 250 * attempt;
        await new Promise(res => setTimeout(res, retryAfterMs));
        continue;
      }

      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Auth methods
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setAccessToken(null);
  }

  async getCurrentUser(): Promise<{ user: User; plans: Array<{ _id: string; name: string; role: string }> }> {
    return this.request<{ user: User; plans: Array<{ _id: string; name: string; role: string }> }>('/auth/me');
  }

  // Plan methods
  async getPlans(): Promise<{ plans: Array<{ _id: string; name: string; description?: string; owner_id: string; members: any[]; task_count?: number }> }> {
    return this.request<{ plans: Array<{ _id: string; name: string; description?: string; owner_id: string; members: any[]; task_count?: number }> }>('/plans');
  }

  async createPlan(name: string, description?: string): Promise<{ _id: string; name: string; description?: string; owner_id: string; members: any[] }> {
    return this.request<{ _id: string; name: string; description?: string; owner_id: string; members: any[] }>('/plans', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getPlan(planId: string): Promise<{ _id: string; name: string; description?: string; owner_id: string; members: any[]; task_count: number }> {
    return this.request<{ _id: string; name: string; description?: string; owner_id: string; members: any[]; task_count: number }>(`/plans/${planId}`);
  }

  async updatePlan(planId: string, updates: { name?: string; description?: string }): Promise<Plan> {
    return this.request<Plan>(`/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePlan(planId: string): Promise<void> {
    return this.request<void>(`/plans/${planId}`, {
      method: 'DELETE',
    });
  }

  // Task methods
  async getTasks(planId: string, filters: TaskFilters = {}): Promise<PaginatedResponse<TaskWithDetails>> {
    const params = new URLSearchParams();
    params.append('plan_id', planId);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await this.request<{ tasks: TaskWithDetails[]; pagination: any }>(`/tasks?${params}`);
    return {
      data: response.tasks,
      pagination: response.pagination,
    };
  }

  async createTask(planId: string, taskData: TaskFormData): Promise<TaskWithDetails> {
    return this.request<TaskWithDetails>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...taskData,
        plan_id: planId,
      }),
    });
  }

  async updateTask(taskId: string, planId: string, updates: Partial<TaskFormData>): Promise<TaskWithDetails> {
    return this.request<TaskWithDetails>(`/tasks/${taskId}?plan_id=${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string, planId: string): Promise<void> {
    await this.request(`/tasks/${taskId}?plan_id=${planId}`, {
      method: 'DELETE',
    });
  }

  async reorderTasks(planId: string, taskIds: string[]): Promise<void> {
    await this.request('/tasks/reorder', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        task_ids: taskIds,
      }),
    });
  }

  async bulkCreateTasks(planId: string, tasks: TaskFormData[]): Promise<{ tasks: TaskWithDetails[] }> {
    return this.request<{ tasks: TaskWithDetails[] }>('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        tasks,
      }),
    });
  }

  // Export/Import methods
  async exportPlan(planId: string): Promise<ExportPlan> {
    return this.request<ExportPlan>(`/plans/${planId}/export`);
  }

  async importPlan(planData: ExportPlan): Promise<{ plan: any; tasks_created: number; message: string }> {
    return this.request<{ plan: any; tasks_created: number; message: string }>('/plans/import', {
      method: 'POST',
      body: JSON.stringify({ plan_data: planData }),
    });
  }
}

export const apiClient = new ApiClient();

