import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';

export function Sidebar() {
  const { 
    sidebarOpen, 
    setSidebarOpen,
    filters, 
    setFilters, 
    clearFilters,
    activeView,
    setActiveView 
  } = useAppStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ q: e.target.value });
  };

  const handleStatusFilter = (status: string) => {
    const currentStatus = Array.isArray(filters.status) ? filters.status : 
      filters.status ? [filters.status] : [];
    
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    
    setFilters({ status: newStatus.length > 0 ? newStatus : undefined });
  };

  const handlePriorityFilter = (priority: string) => {
    const currentPriority = Array.isArray(filters.priority) ? filters.priority : 
      filters.priority ? [filters.priority] : [];
    
    const newPriority = currentPriority.includes(priority)
      ? currentPriority.filter(p => p !== priority)
      : [...currentPriority, priority];
    
    setFilters({ priority: newPriority.length > 0 ? newPriority : undefined });
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

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside className="w-full sm:w-64 bg-white border-r border-gray-200 h-full overflow-y-auto fixed sm:relative inset-y-0 left-0 z-40 sm:z-auto">
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* View Toggle */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">View</h3>
          <div className="space-y-1">
            {[
              { id: 'board', label: 'Board' },
              { id: 'table', label: 'Table' },
              { id: 'gantt', label: 'Gantt' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={filters.q || ''}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
          <div className="space-y-2">
            {statusOptions.map((status) => {
              const isSelected = Array.isArray(filters.status) 
                ? filters.status.includes(status.value)
                : filters.status === status.value;
              
              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusFilter(status.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${status.color.split(' ')[0]}`} />
                    <span>{status.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Priority</h3>
          <div className="space-y-2">
            {priorityOptions.map((priority) => {
              const isSelected = Array.isArray(filters.priority) 
                ? filters.priority.includes(priority.value)
                : filters.priority === priority.value;
              
              return (
                <button
                  key={priority.value}
                  onClick={() => handlePriorityFilter(priority.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${priority.color.split(' ')[0]}`} />
                    <span>{priority.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.q || filters.status || filters.priority) && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}

