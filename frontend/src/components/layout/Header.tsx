import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { useLogout } from '@/hooks/useAuth';
import { Download, Upload, Settings, LogOut, FolderOpen, Menu } from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();
  const { selectedPlanId, sidebarOpen, setSidebarOpen } = useAppStore();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const handleExport = async () => {
    if (!selectedPlanId) return;
    // TODO: Implement export functionality
    console.log('Export plan:', selectedPlanId);
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import plan');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-6 min-w-0 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sm:hidden p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">pdzanning</h1>
          
          {selectedPlanId && (
            <div className="hidden sm:flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">
                Plan Selected
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
          {selectedPlanId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          )}

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

