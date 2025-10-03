import { useState, useMemo } from 'react';
import { TaskWithDetails } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar, FileImage, FileText, FileSpreadsheet } from 'lucide-react';

interface GanttViewProps {
  tasks: TaskWithDetails[];
  planId: string;
}

type GanttZoom = 'day' | 'week' | 'month';

interface GanttTask {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  status: string;
  priority?: string;
  dependencies: string[];
  level: number; // For hierarchical display
}

export function GanttView({ tasks }: GanttViewProps) {
  const [zoom, setZoom] = useState<GanttZoom>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert tasks to Gantt format
  const ganttTasks = useMemo(() => {
    return tasks.map((task) => ({
      id: task._id,
      title: task.title,
      startDate: task.start_date ? new Date(task.start_date) : null,
      endDate: task.due_date ? new Date(task.due_date) : null,
      progress: task.progress_pct || 0,
      status: task.status,
      priority: task.priority,
      dependencies: task.dependency_ids || [],
      level: 0, // TODO: Calculate hierarchy levels
    }));
  }, [tasks]);

  // Calculate date range for the timeline
  const { startDate, endDate, timeline } = useMemo(() => {
    const allDates = ganttTasks
      .flatMap(task => [task.startDate, task.endDate])
      .filter(Boolean) as Date[];
    
    if (allDates.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      
      return {
        startDate: start,
        endDate: end,
        timeline: generateTimeline(start, end, zoom),
      };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add some padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return {
      startDate: minDate,
      endDate: maxDate,
      timeline: generateTimeline(minDate, maxDate, zoom),
    };
  }, [ganttTasks, zoom]);

  // Generate timeline dates
  function generateTimeline(start: Date, end: Date, zoomLevel: GanttZoom) {
    const dates: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      
      switch (zoomLevel) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return dates;
  }

  // Calculate task position and width
  function getTaskDimensions(task: GanttTask, containerWidth: number = 800) {
    if (!task.startDate || !task.endDate) {
      return { left: 0, width: 0 };
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays === 0) return { left: 0, width: 0 };
    
    const taskStartDay = Math.max(0, Math.ceil((task.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const taskEndDay = Math.ceil((task.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskDuration = Math.max(1, taskEndDay - taskStartDay);
    
    return {
      left: (taskStartDay / totalDays) * containerWidth,
      width: Math.max((taskDuration / totalDays) * containerWidth, 20), // Minimum width of 20px
    };
  }

  const navigateTimeline = (direction: 'left' | 'right') => {
    const newDate = new Date(currentDate);
    const daysToMove = zoom === 'day' ? 7 : zoom === 'week' ? 14 : 30;
    
    if (direction === 'left') {
      newDate.setDate(newDate.getDate() - daysToMove);
    } else {
      newDate.setDate(newDate.getDate() + daysToMove);
    }
    
    setCurrentDate(newDate);
  };

  // Export functions
  const exportAsPNG = () => {
    const ganttElement = document.getElementById('gantt-chart');
    if (!ganttElement) return;

    // Use html2canvas to capture the chart
    import('html2canvas').then(html2canvas => {
      html2canvas.default(ganttElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    });
  };

  const exportAsPDF = () => {
    const ganttElement = document.getElementById('gantt-chart');
    if (!ganttElement) return;

    import('html2canvas').then(html2canvas => {
      html2canvas.default(ganttElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      }).then(canvas => {
        import('jspdf').then(jsPDFModule => {
          const { jsPDF } = jsPDFModule;
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('l', 'mm', 'a4');
          
          const imgWidth = 210;
          const pageHeight = 295;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          
          let position = 0;
          
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(`gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`);
        });
      });
    });
  };

  const exportAsExcel = () => {
    const csvData = ganttTasks.map(task => ({
      'Task Title': task.title,
      'Start Date': task.startDate ? task.startDate.toLocaleDateString() : '',
      'End Date': task.endDate ? task.endDate.toLocaleDateString() : '',
      'Progress (%)': task.progress,
      'Status': task.status,
      'Priority': task.priority || '',
      'Dependencies': task.dependencies.join(', '),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gantt-chart-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getZoomLabel = (date: Date) => {
    switch (zoom) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return '';
    }
  };

  return (
    <div id="gantt-chart" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Gantt Chart ({tasks.length} tasks)
            </h3>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom('day')}
                className={zoom === 'day' ? 'bg-primary-100 text-primary-700' : ''}
              >
                Day
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom('week')}
                className={zoom === 'week' ? 'bg-primary-100 text-primary-700' : ''}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom('month')}
                className={zoom === 'month' ? 'bg-primary-100 text-primary-700' : ''}
              >
                Month
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Export Buttons */}
            <div className="flex items-center space-x-1 mr-4">
              <Button
                size="sm"
                variant="outline"
                onClick={exportAsPNG}
                className="flex items-center space-x-1"
              >
                <FileImage className="h-4 w-4" />
                <span className="hidden sm:inline">PNG</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportAsPDF}
                className="flex items-center space-x-1"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportAsExcel}
                className="flex items-center space-x-1"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>

            {/* Navigation */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateTimeline('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateTimeline('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-full" style={{ minWidth: `${timeline.length * (zoom === 'day' ? 60 : zoom === 'week' ? 100 : 120) + 320}px` }}>
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200">
            <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-900">Task</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex">
                {timeline.map((date, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-2 text-center"
                    style={{ minWidth: zoom === 'day' ? '60px' : zoom === 'week' ? '100px' : '120px' }}
                  >
                    <div className="text-xs text-gray-600">
                      {getZoomLabel(date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-gray-200">
            {ganttTasks.map((task) => {
              const containerWidth = timeline.length * (zoom === 'day' ? 60 : zoom === 'week' ? 100 : 120);
              const dimensions = getTaskDimensions(task, containerWidth);
              
              return (
                <div key={task.id} className="flex min-h-12">
                  {/* Task Info */}
                  <div className="w-80 flex-shrink-0 border-r border-gray-200 px-4 py-3 bg-white">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="status" value={task.status} />
                          {task.priority && (
                            <Badge variant="priority" value={task.priority} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Task Bar */}
                  <div className="flex-1 min-w-0 relative bg-gray-50">
                    <div className="relative h-full">
                      {/* Today Line */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{
                          left: `${((new Date().getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100}%`
                        }}
                      />
                      
                      {/* Task Bar */}
                      {task.startDate && task.endDate && (
                        <div
                          className={cn(
                            'absolute top-2 bottom-2 rounded-sm border flex items-center justify-center text-xs font-medium text-white',
                            task.status === 'done' ? 'bg-green-500 border-green-600' :
                            task.status === 'in_progress' ? 'bg-blue-500 border-blue-600' :
                            'bg-gray-400 border-gray-500'
                          )}
                          style={{
                            left: `${dimensions.left}px`,
                            width: `${dimensions.width}px`,
                          }}
                        >
                          {/* Progress Bar */}
                          {task.progress > 0 && (
                            <div
                              className="absolute inset-0 bg-black bg-opacity-20 rounded-sm"
                              style={{ width: `${100 - task.progress}%`, right: 0 }}
                            />
                          )}
                          
                          {/* Task Label */}
                          {dimensions.width > 80 && (
                            <span className="relative z-10 truncate px-2">
                              {task.progress > 0 ? `${task.progress}%` : task.title}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No tasks to display</p>
          <p className="text-sm text-gray-400">Create some tasks with start and due dates to see them in the Gantt chart</p>
        </div>
      )}
    </div>
  );
}

