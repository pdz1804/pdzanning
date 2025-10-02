import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskWithDetails } from '@/types';
import { useReorderTasks, useUpdateTask } from '@/hooks/useTasks';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDateShort, getDaysUntilDue, isOverdue } from '@/lib/utils';
import { Calendar, Users, MoreHorizontal, GripVertical, Target, FileText, CheckSquare } from 'lucide-react';
import { useState } from 'react';

interface KanbanBoardProps {
  tasks: TaskWithDetails[];
  planId: string;
}

interface TaskCardProps {
  task: TaskWithDetails;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  // Determine card background color based on task properties
  const getCardBackgroundColor = () => {
    if (task.status === 'done') return 'bg-green-50 border-green-200';
    if (task.status === 'in_progress') return 'bg-yellow-50 border-yellow-200';
    
    // For todo tasks
    if (task.priority === 'urgent') return 'bg-red-50 border-red-200';
    
    // Check if start date has passed
    if (task.start_date) {
      const startDate = new Date(task.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (today > startDate) return 'bg-orange-50 border-orange-200';
    }
    
    return 'bg-white border-gray-200'; // Default
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assigneeAvatars = task.assignee_ids?.slice(0, 3).map((assignee, index) => (
    <div
      key={assignee._id}
      className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-xs font-medium text-white border-2 border-white"
      style={{ marginLeft: index > 0 ? '-8px' : '0' }}
    >
      {assignee.name.charAt(0).toUpperCase()}
    </div>
  ));

  const isTaskOverdue = task.due_date && isOverdue(task.due_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'card p-4 cursor-pointer hover:shadow-md transition-shadow relative border-l-4',
        getCardBackgroundColor(),
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between pr-8">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
            {task.title}
          </h3>
          <div className="flex items-center space-x-1">
            {task.priority && (
              <Badge variant="priority" value={task.priority} />
            )}
            <Badge variant="status" value={task.status} />
          </div>
        </div>

        {/* Goal */}
        {task.goal && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <Target className="h-3 w-3" />
            <span className="line-clamp-1">{task.goal}</span>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <FileText className="h-3 w-3" />
            <span className="line-clamp-2">{task.description}</span>
          </div>
        )}

        {/* Deliverables */}
        {task.deliverables && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <CheckSquare className="h-3 w-3" />
            <span className="line-clamp-1">{task.deliverables}</span>
          </div>
        )}


        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress */}
        {task.progress_pct !== undefined && task.progress_pct > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{task.progress_pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${task.progress_pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.priority && (
              <Badge variant="priority" value={task.priority} />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {task.due_date && (
              <div className={cn(
                'flex items-center space-x-1 text-xs',
                isTaskOverdue ? 'text-red-600' : 'text-gray-500'
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDateShort(task.due_date)}</span>
              </div>
            )}
            
            {task.assignee_ids && task.assignee_ids.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3 text-gray-400" />
                <div className="flex">
                  {assigneeAvatars}
                  {task.assignee_ids.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                      +{task.assignee_ids.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  tasks: TaskWithDetails[];
  planId: string;
  onTaskClick: (task: TaskWithDetails, startEdit?: boolean) => void;
}

function Column({ id, title, tasks, planId, onTaskClick }: ColumnProps) {
  const taskIds = tasks.map(task => task._id);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setDroppableRef}
      data-column-id={id}
      className={cn(
        "rounded-lg p-4 min-h-[600px] transition-colors",
        isOver ? "bg-blue-50" : "bg-gray-50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard 
              key={task._id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              onDoubleClick={() => onTaskClick(task, true)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ tasks, planId }: KanbanBoardProps) {
  const reorderMutation = useReorderTasks();
  const updateTaskMutation = useUpdateTask();
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [openInEdit, setOpenInEdit] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    done: tasks.filter(task => task.status === 'done'),
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(task => task._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear the active task
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const activeTask = tasks.find(task => task._id === activeId);
    if (!activeTask) return;

    // Determine if dropped onto a column droppable (only then call API to change status)
    const isOverColumn = overId === 'todo-column' || overId === 'in_progress-column' || overId === 'done-column';
    let newStatus = activeTask.status;
    if (isOverColumn) {
      if (overId === 'todo-column') newStatus = 'todo';
      if (overId === 'in_progress-column') newStatus = 'in_progress';
      if (overId === 'done-column') newStatus = 'done';
    }

    // If status changed AND user dropped over a column, update the task
    if (isOverColumn && newStatus !== activeTask.status) {
      try {
        await updateTaskMutation.mutateAsync({
          taskId: activeId,
          planId,
          updates: { status: newStatus }
        });
        console.log(`Moved task ${activeId} to ${newStatus}`);
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }

    // If dropped over a task or anywhere but a column, treat as reorder ONLY within same column
    if (!isOverColumn) {
      // Find which list we're in based on current (unchanged) status
      const currentStatus = activeTask.status;
      const list = tasksByStatus[currentStatus as keyof typeof tasksByStatus];
      const activeIndex = list.findIndex(task => task._id === activeId);
      const overIndex = list.findIndex(task => task._id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newTasks = arrayMove(list, activeIndex, overIndex);
        const taskIds = newTasks.map(task => task._id);

        try {
          await reorderMutation.mutateAsync({ planId, taskIds });
        } catch (error) {
          console.error('Failed to reorder tasks:', error);
        }
      }
      return;
    }

    // If dropped over column but same status (no change), allow reorder within that column using over id placeholder
    if (isOverColumn && newStatus === activeTask.status) {
      const activeIndex = tasksByStatus[newStatus].findIndex(task => task._id === activeId);
      const overIndex = activeIndex; // keep order if no precise target; could enhance with mouse position later

      if (activeIndex !== overIndex) {
        const newTasks = arrayMove(tasksByStatus[newStatus], activeIndex, overIndex);
        const taskIds = newTasks.map(task => task._id);

        try {
          await reorderMutation.mutateAsync({ planId, taskIds });
        } catch (error) {
          console.error('Failed to reorder tasks:', error);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column
          id="todo-column"
          title="To Do"
          tasks={tasksByStatus.todo}
          planId={planId}
          onTaskClick={(task, startEdit) => { setSelectedTask(task); setOpenInEdit(!!startEdit); }}
        />
        <Column
          id="in_progress-column"
          title="In Progress"
          tasks={tasksByStatus.in_progress}
          planId={planId}
          onTaskClick={(task, startEdit) => { setSelectedTask(task); setOpenInEdit(!!startEdit); }}
        />
        <Column
          id="done-column"
          title="Done"
          tasks={tasksByStatus.done}
          planId={planId}
          onTaskClick={(task, startEdit) => { setSelectedTask(task); setOpenInEdit(!!startEdit); }}
        />
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          planId={planId}
          startInEdit={openInEdit}
          onClose={() => setSelectedTask(null)}
          onSave={() => {
            setSelectedTask(null);
            // The parent component will refetch tasks automatically
          }}
        />
      )}

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-3 transform">
            <TaskCard 
              task={activeTask} 
              onClick={() => {}} // No-op during drag
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

