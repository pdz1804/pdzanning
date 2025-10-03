import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ExportPlan } from '@/types';
import { apiClient } from '@/lib/api';
import { Upload, FileText, Users, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ImportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportPlanModal({ isOpen, onClose, onSuccess }: ImportPlanModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [planData, setPlanData] = useState<ExportPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [editablePlan, setEditablePlan] = useState<{
    name: string;
    description: string;
    members: Array<{
      name: string;
      email: string;
      role: 'editor' | 'viewer';
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      setIsLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the structure
      if (!data.plan || !data.tasks || !data.export_metadata) {
        throw new Error('Invalid plan file format');
      }
      
      setPlanData(data);
      // Initialize editable plan data
      setEditablePlan({
        name: data.plan.name,
        description: data.plan.description || '',
        members: data.plan.members.map(member => ({ ...member }))
      });
    } catch (err) {
      setError('Invalid file format. Please select a valid plan export file.');
      setPlanData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!planData || !editablePlan) return;
    
    try {
      setImporting(true);
      // Create modified plan data with user edits and clean up null/undefined values
      const modifiedPlanData = {
        plan: {
          name: editablePlan.name,
          description: editablePlan.description || undefined,
          members: editablePlan.members
        },
        tasks: planData.tasks.map(task => ({
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          priority: task.priority || undefined,
          assignees: task.assignees || [],
          start_date: task.start_date || undefined,
          due_date: task.due_date || undefined,
          progress_pct: task.progress_pct || 0,
          parent_id: task.parent_id || undefined,
          dependency_ids: task.dependency_ids || [],
          tags: task.tags || [],
          estimate_hours: task.estimate_hours || undefined,
          order_index: task.order_index || 0,
          goal: task.goal || undefined,
          notes: task.notes || undefined,
          deliverables: task.deliverables || undefined
        }))
      };
      
      console.log('Sending import data:', modifiedPlanData);
      const result = await apiClient.importPlan(modifiedPlanData);
      console.log('Plan imported successfully:', result);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import plan. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPlanData(null);
    setEditablePlan(null);
    setError(null);
    setIsLoading(false);
    setImporting(false);
    onClose();
  };

  const updateMemberRole = (index: number, role: 'editor' | 'viewer') => {
    if (!editablePlan) return;
    const updatedMembers = [...editablePlan.members];
    updatedMembers[index].role = role;
    setEditablePlan({ ...editablePlan, members: updatedMembers });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Import Plan</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plan File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {file ? file.name : 'Click to select a plan export file (.json)'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {file ? 'Change File' : 'Select File'}
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600">Parsing file...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Plan Preview */}
          {planData && editablePlan && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Plan Settings</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                {/* Plan Info - Editable */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <Input
                      value={editablePlan.name}
                      onChange={(e) => setEditablePlan({ ...editablePlan, name: e.target.value })}
                      placeholder="Enter plan name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editablePlan.description}
                      onChange={(e) => setEditablePlan({ ...editablePlan, description: e.target.value })}
                      placeholder="Enter plan description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{editablePlan.members.length} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{planData.tasks.length} tasks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Exported {new Date(planData.export_metadata.exported_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Members - Editable Roles */}
                {editablePlan.members.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Members (will be invited by email)</h5>
                    <div className="space-y-2">
                      {editablePlan.members.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{member.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({member.email})</span>
                          </div>
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(index, e.target.value as 'editor' | 'viewer')}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Summary */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Task Summary</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">
                        {planData.tasks.filter(t => t.status === 'todo').length}
                      </div>
                      <div className="text-gray-500">To Do</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">
                        {planData.tasks.filter(t => t.status === 'in_progress').length}
                      </div>
                      <div className="text-gray-500">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">
                        {planData.tasks.filter(t => t.status === 'done').length}
                      </div>
                      <div className="text-gray-500">Done</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center space-x-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Import Plan</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
