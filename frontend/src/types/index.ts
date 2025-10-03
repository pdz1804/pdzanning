// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  _id: string;
  name: string;
  description?: string;
  owner_id: string;
  members: Array<{
    user_id: string;
    role: 'editor' | 'viewer';
    joined_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  _id: string;
  plan_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_ids?: string[];
  start_date?: string; // ISO date string (YYYY-MM-DD)
  due_date?: string;   // ISO date string (YYYY-MM-DD)
  progress_pct?: number; // 0-100
  parent_id?: string;  // subtask parent task id
  dependency_ids?: string[]; // other task _id strings
  tags?: string[];
  estimate_hours?: number;
  order_index?: number;
  goal?: string;
  notes?: string;
  deliverables?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

// Task with populated fields
export interface TaskWithDetails extends Omit<Task, 'assignee_ids' | 'created_by' | 'updated_by'> {
  assignee_ids?: User[];
  created_by: User;
  updated_by: User;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Task filter types
export interface TaskFilters {
  q?: string; // search query
  status?: string | string[];
  assignee?: string | string[];
  tag?: string | string[];
  priority?: string | string[];
  parent_id?: string | 'null';
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Export/Import types
export interface ExportPlan {
  plan: {
    name: string;
    description?: string;
    members: Array<{
      name: string;
      email: string;
      role: 'editor' | 'viewer';
    }>;
  };
  tasks: Array<{
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assignees: Array<{
      name: string;
      email: string;
    }>;
    start_date?: string;
    due_date?: string;
    progress_pct?: number;
    parent_id?: string;
    dependency_ids: string[];
    tags: string[];
    estimate_hours?: number;
    order_index?: number;
    goal?: string;
    notes?: string;
    deliverables?: string;
  }>;
  export_metadata: {
    exported_at: string;
    exported_by: {
      name: string;
      email: string;
    };
    version: string;
  };
}

// UI state types
export interface ViewState {
  activeView: 'board' | 'table' | 'gantt';
  selectedPlanId: string | null;
  filters: TaskFilters;
  selectedTasks: string[];
}

export interface GanttState {
  zoom: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  showDependencies: boolean;
  showCriticalPath: boolean;
}

// Form types
export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_ids?: string[];
  start_date?: string;
  due_date?: string;
  progress_pct?: number;
  parent_id?: string;
  dependency_ids?: string[];
  tags?: string[];
  estimate_hours?: number;
  goal?: string;
  notes?: string;
  deliverables?: string;
}

// Drag and drop types
export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: {
        droppableId: string;
        index: number;
      };
    };
  };
  over: {
    id: string;
    data: {
      current: {
        droppableId: string;
        index: number;
      };
    };
  } | null;
}

