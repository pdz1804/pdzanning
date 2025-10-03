import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { TableView } from '@/components/views/TableView';
import { GanttView } from '@/components/views/GanttView';
import { TaskForm } from '@/components/TaskForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { PlanSettingsModal } from '@/components/PlanSettingsModal';
import { ArrowLeft, Plus, Users, Calendar, FileText, Settings, Edit3 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTasks } from '@/hooks/useTasks';
import { Plan } from '@/types';

export function PlanDetails() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { activeView, filters, setActiveView } = useAppStore();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load plan details
  useEffect(() => {
    const loadPlan = async () => {
      if (!planId) return;
      
      try {
        setIsLoadingPlan(true);
        const planData = await apiClient.getPlan(planId);
        setPlan(planData);
      } catch (error) {
        console.error('Failed to load plan:', error);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadPlan();
  }, [planId]);

  // Load tasks for this plan
  const { data: tasksData, isLoading: isLoadingTasks, error } = useTasks(planId || '', filters);

  const handleBackToPlans = () => {
    navigate('/');
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleEdit = () => {
    setShowSettingsModal(true);
  };

  const handlePlanUpdated = (updatedPlan: Plan) => {
    setPlan(updatedPlan);
  };

  const renderActiveView = () => {
    if (isLoadingTasks) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="ml-3 text-gray-600">Loading tasks...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-500 text-center py-8">
          Error loading tasks: {error.message}
        </div>
      );
    }

    const tasks = tasksData?.data || [];

    switch (activeView) {
      case 'board':
        return <KanbanBoard tasks={tasks} planId={planId || ''} />;
      case 'table':
        return <TableView tasks={tasks} planId={planId || ''} />;
      case 'gantt':
        return <GanttView tasks={tasks} planId={planId || ''} />;
      default:
        return <KanbanBoard tasks={tasks} planId={planId || ''} />;
    }
  };

  if (isLoadingPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Plan Not Found</h2>
          <p className="text-gray-600 mb-4">The requested plan could not be found.</p>
          <Button onClick={handleBackToPlans} variant="outline">
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToPlans}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Plans</span>
            </Button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">{plan.name}</h1>
              {plan.description && (
                <p className="text-sm text-gray-600">{plan.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-1"
              onClick={handleSettings}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-1"
              onClick={handleEdit}
            >
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-0">
          <div className="p-4 sm:p-6">
            {/* Plan Header with Task Count */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h2>
                  <p className="text-gray-600">
                    {tasksData?.pagination.total || 0} tasks
                  </p>
                </div>
                <Button
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Task</span>
                </Button>
              </div>
            </div>

            {/* Active View */}
            <div className="space-y-4">
              {renderActiveView()}
            </div>
          </div>
        </main>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TaskForm
              planId={planId || ''}
              onClose={() => setShowTaskForm(false)}
              onSuccess={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}

      {/* Plan Settings Modal */}
      {plan && (
        <PlanSettingsModal
          plan={plan}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onPlanUpdated={handlePlanUpdated}
        />
      )}
    </div>
  );
}
