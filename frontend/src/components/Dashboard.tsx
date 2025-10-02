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
import { Plus, Search, FolderPlus, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';

export function Dashboard() {
  const { activeView, selectedPlanId, filters, setSelectedPlanId } = useAppStore();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
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

  const handleCreatePlan = async () => {
    if (newPlanName.trim()) {
      try {
        const newPlan = await apiClient.createPlan(newPlanName.trim(), newPlanDescription.trim() || undefined);
        
        // Add to user plans and select it
        setUserPlans(prev => [...prev, { _id: newPlan._id, name: newPlan.name, role: 'owner' }]);
        setSelectedPlanId(newPlan._id);
        
        // Reset form
        setNewPlanName('');
        setNewPlanDescription('');
        setShowCreatePlanForm(false);
        
        console.log('Created plan:', newPlan.name);
      } catch (error) {
        console.error('Failed to create plan:', error);
      }
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

  // Show plan selection if no plan selected
  if (!selectedPlanId) {
      return (
        <div className="p-4 sm:p-6">
          <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Select or Create a Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Plans */}
            {userPlans.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Your Plans</h3>
                <div className="grid gap-3">
                  {userPlans.map((plan) => (
                    <div
                      key={plan._id}
                      onClick={() => setSelectedPlanId(plan._id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlanId === plan._id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{plan.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">Role: {plan.role}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanId(plan._id);
                          }}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Plan */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Create New Plan</h3>
                <Button
                  onClick={() => setShowCreatePlanForm(!showCreatePlanForm)}
                  className="flex items-center space-x-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Plan</span>
                </Button>
              </div>

              {showCreatePlanForm && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <Input
                    label="Plan Name"
                    placeholder="Enter plan name"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                  />
                  <Input
                    label="Description (optional)"
                    placeholder="Enter plan description"
                    value={newPlanDescription}
                    onChange={(e) => setNewPlanDescription(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreatePlan}
                      disabled={!newPlanName.trim()}
                    >
                      Create Plan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreatePlanForm(false);
                        setNewPlanName('');
                        setNewPlanDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
                  onClick={() => setSelectedPlanId(null)}
                  variant="outline"
                  className="flex items-center space-x-1 sm:space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Plans</span>
                  <span className="sm:hidden">Back</span>
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

