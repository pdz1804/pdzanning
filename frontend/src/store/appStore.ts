import { create } from 'zustand';
import { TaskFilters, GanttState } from '@/types';

interface AppState {
  // View state
  activeView: 'board' | 'table' | 'gantt';
  selectedPlanId: string | null;
  
  // Filters
  filters: TaskFilters;
  
  // Selection
  selectedTasks: string[];
  
  // Gantt specific state
  ganttState: GanttState;
  
  // UI state
  sidebarOpen: boolean;
  isLoading: boolean;
}

interface AppActions {
  // View actions
  setActiveView: (view: 'board' | 'table' | 'gantt') => void;
  setSelectedPlanId: (planId: string | null) => void;
  
  // Filter actions
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  
  // Selection actions
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  
  // Gantt actions
  setGanttZoom: (zoom: 'day' | 'week' | 'month') => void;
  setGanttDateRange: (startDate: Date, endDate: Date) => void;
  toggleDependencies: () => void;
  toggleCriticalPath: () => void;
  
  // UI actions
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}

type AppStore = AppState & AppActions;

const defaultFilters: TaskFilters = {
  page: 1,
  limit: 50,
  sort: 'order_index',
  order: 'asc',
};

const defaultGanttState: GanttState = {
  zoom: 'week',
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  showDependencies: true,
  showCriticalPath: false,
};

export const useAppStore = create<AppStore>((set, get) => ({
  // State
  activeView: 'board',
  selectedPlanId: null,
  filters: defaultFilters,
  selectedTasks: [],
  ganttState: defaultGanttState,
  sidebarOpen: true,
  isLoading: false,

  // Actions
  setActiveView: (view) => set({ activeView: view }),
  
  setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  clearFilters: () => set({ filters: defaultFilters }),
  
  selectTask: (taskId) => set((state) => ({
    selectedTasks: [...state.selectedTasks, taskId]
  })),
  
  deselectTask: (taskId) => set((state) => ({
    selectedTasks: state.selectedTasks.filter(id => id !== taskId)
  })),
  
  selectAllTasks: (taskIds) => set({ selectedTasks: taskIds }),
  
  clearSelection: () => set({ selectedTasks: [] }),
  
  setGanttZoom: (zoom) => set((state) => ({
    ganttState: { ...state.ganttState, zoom }
  })),
  
  setGanttDateRange: (startDate, endDate) => set((state) => ({
    ganttState: { ...state.ganttState, startDate, endDate }
  })),
  
  toggleDependencies: () => set((state) => ({
    ganttState: { 
      ...state.ganttState, 
      showDependencies: !state.ganttState.showDependencies 
    }
  })),
  
  toggleCriticalPath: () => set((state) => ({
    ganttState: { 
      ...state.ganttState, 
      showCriticalPath: !state.ganttState.showCriticalPath 
    }
  })),
  
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));

