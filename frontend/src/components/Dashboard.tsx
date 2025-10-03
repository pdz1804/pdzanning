import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { TableView } from '@/components/views/TableView';
import { GanttView } from '@/components/views/GanttView';
import { TaskForm } from '@/components/TaskForm';
import { Plus, ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';

export function Dashboard() {
  const { activeView, selectedPlanId, filters, setSelectedPlanId } = useAppStore();
  const navigate = useNavigate();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [userPlans, setUserPlans] = useState<Array<{ _id: string; name: string; role: string }>>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Load user's plans on mount
  useEffect(() => {
    const loadUserPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const response = await apiClient.getCurrentUser();
        setUserPlans(response.plans);
        
        // Auto-select first plan if none selected
        if (!selectedPlanId && response.plans.length > 0) {
          setSelectedPlanId(response.plans[0]._id);
        }
      } catch (error) {
        console.error('Failed to load user plans:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    loadUserPlans();
  }, []); // Only run once on mount

  const { data: tasksData, isLoading, error } = useTasks(selectedPlanId || '', filters, {
    enabled: !!selectedPlanId // Only fetch tasks when a plan is selected
  });

  const handleExportPlan = async () => {
    if (!selectedPlanId) return;
    
    try {
      const exportData = await apiClient.exportPlan(selectedPlanId);
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-${exportData.plan.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export plan:', error);
    }
  };


  const renderActiveView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading tasks</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </div>
      );
    }

    const tasks = tasksData?.data || [];

    switch (activeView) {
      case 'board':
        return <KanbanBoard tasks={tasks} planId={selectedPlanId || ''} />;
      case 'table':
        return <TableView tasks={tasks} planId={selectedPlanId || ''} />;
      case 'gantt':
        return <GanttView tasks={tasks} planId={selectedPlanId || ''} />;
      default:
        return <KanbanBoard tasks={tasks} planId={selectedPlanId || ''} />;
    }
  };

  // Show loading state while plans are being loaded
  if (isLoadingPlans) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your plans...</p>
        </div>
      </div>
    );
  }

  // Redirect to homepage if no plan selected
  if (!selectedPlanId) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Plan Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select a plan from the homepage to start managing tasks.
          </p>
          <Button
            onClick={() => {
              setSelectedPlanId(null);
              navigate('/');
            }}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Plans</span>
          </Button>
        </div>
      </div>
    );
  }

  const currentPlan = userPlans.find(plan => plan._id === selectedPlanId);

  // Don't render the main dashboard if no plan is selected
  if (!selectedPlanId) {
    return null; // This should not happen due to the condition above, but just in case
  }

      return (
        <div className="p-4 sm:p-6">
          {/* Plan Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentPlan?.name || 'Plan'}
            </h2>
            <p className="text-gray-600">
              {tasksData?.pagination.total || 0} tasks
              {currentPlan && (
                <span className="ml-2 text-sm text-gray-500 capitalize">
                  • Role: {currentPlan.role}
                </span>
              )}
            </p>
          </div>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                <Button
                  onClick={() => {
                    setSelectedPlanId(null);
                    navigate('/');
                  }}
                  variant="outline"
                  className="flex items-center space-x-1 sm:space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Plans</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <Button
                  onClick={handleExportPlan}
                  variant="outline"
                  className="flex items-center space-x-1 sm:space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center space-x-1 sm:space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Task</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
        </div>
      </div>

      {/* Active View */}
      <div className="space-y-4">
        {renderActiveView()}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TaskForm
              planId={selectedPlanId || ''}
              onClose={() => setShowTaskForm(false)}
              onSuccess={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

