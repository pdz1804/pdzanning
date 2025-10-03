import { useState, useEffect } from 'react';
import { Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeletePlanModal } from '@/components/DeletePlanModal';
import { X, UserPlus, UserMinus, Trash2, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PlanSettingsModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onPlanUpdated: (updatedPlan: Plan) => void;
}

export function PlanSettingsModal({ plan, isOpen, onClose, onPlanUpdated }: PlanSettingsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || '',
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
      });
      setIsEditing(false);
    }
  }, [isOpen, plan]);

  const handleSave = async () => {
    try {
      const updatedPlan = await apiClient.updatePlan(plan._id, formData);
      onPlanUpdated(updatedPlan);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    
    try {
      setIsAddingMember(true);
      // Note: This would need to be implemented in the API
      console.log('Adding member:', newMemberEmail);
      setNewMemberEmail('');
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      // Note: This would need to be implemented in the API
      console.log('Removing member:', memberId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleDeletePlan = async () => {
    try {
      setIsDeleting(true);
      await apiClient.deletePlan(plan._id);
      setShowDeleteModal(false);
      onClose();
      // Navigate back to homepage
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete plan:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plan Settings</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Plan Information */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Plan Information</h3>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="Plan Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter plan name"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter plan description"
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} size="sm">
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {plan.name}</p>
                  <p><strong>Description:</strong> {plan.description || 'No description'}</p>
                  <p><strong>Created:</strong> {new Date(plan.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Members */}
            <div>
              <h3 className="text-lg font-medium mb-4">Members</h3>
              
              {/* Add Member */}
              <div className="flex space-x-2 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter email address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                  />
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim() || isAddingMember}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">O</span>
                    </div>
                    <div>
                      <p className="font-medium">Owner</p>
                      <p className="text-sm text-gray-600">You</p>
                    </div>
                  </div>
                  <Badge variant="default">Owner</Badge>
                </div>

                {/* Other Members */}
                {plan.members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">M</span>
                      </div>
                      <div>
                        <p className="font-medium">Member</p>
                        <p className="text-sm text-gray-600">user@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">{member.role}</Badge>
                      <Button
                        onClick={() => handleRemoveMember(member.user_id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Plan
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This action cannot be undone. All tasks and data will be permanently deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <DeletePlanModal
        planName={plan.name}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePlan}
        isDeleting={isDeleting}
      />
    </div>
  );
}
