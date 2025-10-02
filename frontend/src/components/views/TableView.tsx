import React, { useState } from 'react';
import { TaskWithDetails } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDate, formatDateShort, getDaysUntilDue, isOverdue, getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { ChevronUp, ChevronDown, Calendar, Users, MoreHorizontal } from 'lucide-react';

interface TableViewProps {
  tasks: TaskWithDetails[];
  planId: string;
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'progress_pct' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function TableView({ tasks, planId }: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTasks(
      selectedTasks.length === tasks.length 
        ? [] 
        : tasks.map(task => task._id)
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle different data types
    if (sortField === 'due_date' || sortField === 'created_at') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Tasks ({tasks.length})
          </h3>
          {selectedTasks.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedTasks.length} selected
              </span>
              <Button size="sm" variant="outline">
                Bulk Actions
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="title">Task</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="status">Status</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="priority">Priority</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="due_date">Due Date</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="progress_pct">Progress</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="created_at">Created</SortButton>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTasks.map((task) => (
              <tr
                key={task._id}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  selectedTasks.includes(task._id) && 'bg-primary-50'
                )}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task._id)}
                    onChange={() => handleSelectTask(task._id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {task.description}
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="status" value={task.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.priority && (
                    <Badge variant="priority" value={task.priority} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.assignee_ids && task.assignee_ids.length > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {task.assignee_ids.slice(0, 3).map((assignee) => (
                          <div
                            key={assignee._id}
                            className={cn(
                              'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white',
                              getAvatarColor(assignee.name)
                            )}
                            title={assignee.name}
                          >
                            {getAvatarInitials(assignee.name)}
                          </div>
                        ))}
                        {task.assignee_ids.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                            +{task.assignee_ids.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.due_date ? (
                    <div className={cn(
                      'flex items-center space-x-1 text-sm',
                      isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-900'
                    )}>
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateShort(task.due_date)}</span>
                      {isOverdue(task.due_date) && (
                        <span className="text-xs text-red-500">
                          (Overdue)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No due date</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.progress_pct !== undefined ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${task.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {task.progress_pct}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(task.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}

