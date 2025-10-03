import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { TaskFilters, TaskFormData } from '@/types';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (planId: string, filters: TaskFilters) => [...taskKeys.lists(), planId, filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

// Get tasks
export function useTasks(planId: string, filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(planId, filters),
    queryFn: () => apiClient.getTasks(planId, filters),
    enabled: !!planId,
  });
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, taskData }: { planId: string; taskData: TaskFormData }) =>
      apiClient.createTask(planId, taskData),
    onSuccess: () => {
      // Invalidate and refetch tasks for this plan
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const inFlight = new Set<string>();
  
  return useMutation({
    mutationFn: ({ 
      taskId, 
      planId, 
      updates 
    }: { 
      taskId: string; 
      planId: string; 
      updates: Partial<TaskFormData> 
    }) => {
      const key = `${taskId}:${JSON.stringify(updates)}`;
      if (inFlight.has(key)) {
        // Drop duplicate rapid calls
        return Promise.resolve({} as any);
      }
      inFlight.add(key);
      return apiClient.updateTask(taskId, planId, updates)
        .finally(() => inFlight.delete(key));
    },
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      if ((updatedTask as any)?._id) {
        queryClient.setQueryData(
          taskKeys.detail((updatedTask as any)._id), 
          updatedTask
        );
      }
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Delete task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, planId }: { taskId: string; planId: string }) =>
      apiClient.deleteTask(taskId, planId),
    onSuccess: () => {
      // Invalidate and refetch tasks for this plan
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Reorder tasks
export function useReorderTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, taskIds }: { planId: string; taskIds: string[] }) =>
      apiClient.reorderTasks(planId, taskIds),
    onSuccess: () => {
      // Invalidate and refetch tasks for this plan
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Bulk create tasks
export function useBulkCreateTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, tasks }: { planId: string; tasks: TaskFormData[] }) =>
      apiClient.bulkCreateTasks(planId, tasks),
    onSuccess: () => {
      // Invalidate and refetch tasks for this plan
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

