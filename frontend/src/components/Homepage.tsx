import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImportPlanModal } from '@/components/ImportPlanModal';
import { FolderPlus, FolderOpen, LogOut, User, Upload, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useLogout } from '@/hooks/useAuth';

export function Homepage() {
  const { setSelectedPlanId } = useAppStore();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
      } catch (error) {
        console.error('Failed to load user plans:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    if (user) {
      loadUserPlans();
    }
  }, [user]);

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleImportSuccess = () => {
    // Reload plans after successful import
    const loadUserPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const response = await apiClient.getCurrentUser();
        setUserPlans(response.plans);
      } catch (error) {
        console.error('Failed to load user plans:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    loadUserPlans();
  };

  // Show loading state while plans are being loaded
  if (isLoadingPlans) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your plans...</p>
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
            <h1 className="text-xl font-bold text-gray-900">pdzanning</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  isLoading={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to pdzanning
            </h2>
            <p className="text-lg text-gray-600">
              Your lightweight planning and task management solution
            </p>
          </div>

          {/* Plans Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5" />
                  <span>Your Plans</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowImportModal(true)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import</span>
                  </Button>
                  <Button
                    onClick={() => setShowCreatePlanForm(!showCreatePlanForm)}
                    className="flex items-center space-x-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>New Plan</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Plans */}
              {userPlans.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {userPlans.map((plan) => (
                    <div
                      key={plan._id}
                      onClick={() => navigate(`/plans/${plan._id}`)}
                      className="p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-primary-300 hover:bg-primary-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{plan.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                          {plan.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Click to view plan details and manage tasks
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No plans yet. Create your first plan to get started!</p>
                </div>
              )}

              {/* Create New Plan Form */}
              {showCreatePlanForm && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Create New Plan</h3>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Import Modal */}
      <ImportPlanModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
