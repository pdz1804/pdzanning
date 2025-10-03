import { useState } from 'react';
import { TaskWithDetails } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatDate, getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { X, Save, Calendar, Tag, Clock, FileText } from 'lucide-react';

interface TaskDetailModalProps {
  task: TaskWithDetails;
  planId: string;
  startInEdit?: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function TaskDetailModal({ task, planId, startInEdit, onClose, onSave }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(!!startInEdit);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority || 'medium',
    start_date: task.start_date || '',
    due_date: task.due_date || '',
    progress_pct: task.progress_pct || 0,
    estimate_hours: task.estimate_hours || 0,
    tags: task.tags || [],
    goal: task.goal || '',
    notes: task.notes || '',
    deliverables: task.deliverables || '',
  });
  const [newTag, setNewTag] = useState('');
  
  const updateTaskMutation = useUpdateTask();
  
  // Get existing tasks to show top assignees and tags
  // const { data: tasksData } = useTasks(planId, {}); // Don't fetch if not needed
  // const topAssignees = useTopAssignees(tasksData?.data || []);
  // const topTags = useTopTags(tasksData?.data || []);

  const handleSave = async () => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task._id,
        planId,
        updates: formData
      });
      setIsEditing(false);
      onSave(); // Refresh the parent component
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Task Details</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      isLoading={updateTaskMutation.isPending}
                      className="flex items-center space-x-1"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                  >
                    Edit
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              {isEditing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              ) : (
                <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description || 'No description provided'}
                </p>
              )}
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal
              </label>
              {isEditing ? (
                <Input
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="What is the goal of this task?"
                />
              ) : (
                <p className="text-gray-700">
                  {task.goal || 'No goal specified'}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or context"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.notes || 'No notes provided'}
                </p>
              )}
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deliverables
              </label>
              {isEditing ? (
                <Input
                  value={formData.deliverables}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                  placeholder="What should be delivered?"
                />
              ) : (
                <p className="text-gray-700">
                  {task.deliverables || 'No deliverables specified'}
                </p>
              )}
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {isEditing ? (
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
                ) : (
                  <Badge variant="status" value={task.status} />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                {isEditing ? (
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
                ) : (
                  task.priority && <Badge variant="priority" value={task.priority} />
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {task.start_date ? formatDate(task.start_date) : 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {task.due_date ? formatDate(task.due_date) : 'Not set'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress and Estimate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress ({formData.progress_pct}%)
                </label>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress_pct}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress_pct: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${task.progress_pct || 0}%` }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimate (hours)
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimate_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimate_hours: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {task.estimate_hours || 0} hours
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignees
              </label>
              {task.assignee_ids && task.assignee_ids.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignee_ids.map((assignee) => (
                    <div
                      key={assignee._id}
                      className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"
                    >
                      <div className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white',
                        getAvatarColor(assignee.name)
                      )}>
                        {getAvatarInitials(assignee.name)}
                      </div>
                      <span className="text-sm font-medium">{assignee.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No assignees</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Add a tag"
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
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
              ) : (
                <div className="flex flex-wrap gap-2">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No tags</p>
                  )}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(task.created_at)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {formatDate(task.updated_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
