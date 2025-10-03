import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeletePlanModalProps {
  planName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeletePlanModal({ 
  planName, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting = false 
}: DeletePlanModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmed = confirmationText === planName;

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Plan</span>
            </CardTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isDeleting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  This action cannot be undone
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently delete the plan, all tasks, and all data associated with it.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Please type <strong className="font-mono bg-gray-100 px-1 rounded">{planName}</strong> to confirm:
            </p>
            
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${planName}" to confirm`}
              disabled={isDeleting}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
