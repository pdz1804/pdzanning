import React, { useState } from 'react';
import { TaskFormData } from '@/types';
import { useCreateTask, useTasks } from '@/hooks/useTasks';
import { useTopAssignees, useTopTags } from '@/hooks/useTopItems';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { X, Plus, Calendar, Users, Tag, Clock } from 'lucide-react';

interface TaskFormProps {
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<TaskFormData>;
}

export function TaskForm({ planId, onClose, onSuccess, initialData }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    start_date: '',
    due_date: '',
    progress_pct: 0,
    tags: [],
    estimate_hours: undefined,
    goal: '',
    notes: '',
    deliverables: '',
    ...initialData,
  });
  
  const [newTag, setNewTag] = useState('');
  const createTaskMutation = useCreateTask();
  
  // Get existing tasks to show top assignees and tags
  const { data: tasksData } = useTasks(planId, {}, { enabled: false }); // Don't fetch if not needed
  const topAssignees = useTopAssignees(tasksData?.data || []);
  const topTags = useTopTags(tasksData?.data || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTaskMutation.mutateAsync({ planId, taskData: formData });
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
  ];

  return (
    <Card className="max-w-2xl mx-auto m-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create New Task</CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
            
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <Input
              label="Goal"
              value={formData.goal || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="What is the goal of this task?"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or context"
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <Input
              label="Deliverables"
              value={formData.deliverables || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
              placeholder="What should be delivered?"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label key={status.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <Badge variant="status" value={status.value}>
                      {status.label}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="space-y-2">
                {priorityOptions.map((priority) => (
                  <label key={priority.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <Badge variant="priority" value={priority.value}>
                      {priority.label}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Dates and Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress (%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_pct: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {formData.progress_pct}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Estimate (hours)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimate_hours || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimate_hours: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="0"
                  className="pl-10"
                />
              </div>
            </div>
          </div>


          {/* Assignees */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Assignees
            </label>
            <Dropdown
              items={topAssignees}
              selectedItems={formData.assignee_ids || []}
              onSelectionChange={(selectedIds) => 
                setFormData(prev => ({ ...prev, assignee_ids: selectedIds }))
              }
              placeholder="Select assignees"
              multiple={true}
              maxDisplay={3}
            />
          </div>

          {/* Tags with dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <Dropdown
              items={topTags}
              selectedItems={formData.tags || []}
              onSelectionChange={(selectedTags) => 
                setFormData(prev => ({ ...prev, tags: selectedTags }))
              }
              placeholder="Select tags"
              multiple={true}
              maxDisplay={3}
            />
            
            {/* Manual tag input */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a custom tag"
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-primary-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createTaskMutation.isPending}
              disabled={!formData.title.trim()}
            >
              Create Task
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

