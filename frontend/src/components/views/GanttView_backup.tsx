import React, { useState, useMemo } from 'react';
import { TaskWithDetails } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDateShort, getDaysUntilDue } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, Download, FileImage, FileText, FileSpreadsheet } from 'lucide-react';

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
  hasOriginalDates: boolean; // Track if dates were originally set
}

export function GanttView({ tasks, planId }: GanttViewProps) {
  const [zoom, setZoom] = useState<GanttZoom>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskColumnWidth, setTaskColumnWidth] = useState(320);

  // Convert tasks to Gantt format
  const ganttTasks = useMemo(() => {
    const converted = tasks.map((task, index) => {
      // If no dates are provided, create default dates for Gantt display
      let startDate = task.start_date ? new Date(task.start_date) : null;
      let endDate = task.due_date ? new Date(task.due_date) : null;
      
      // If no dates, create a default timeline for the task
      if (!startDate && !endDate) {
        const today = new Date();
        startDate = new Date(today);
        startDate.setDate(today.getDate() + index * 2); // Stagger tasks by 2 days
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7); // Default 7-day duration
      } else if (!startDate && endDate) {
        // If only end date, set start date to 7 days before
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
      } else if (startDate && !endDate) {
        // If only start date, set end date to 7 days after
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      }
      
      return {
        id: task._id,
        title: task.title,
        startDate,
        endDate,
        progress: task.progress_pct || 0,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependency_ids || [],
        level: 0, // TODO: Calculate hierarchy levels
        hasOriginalDates: !!(task.start_date && task.due_date), // Track if dates were originally set
      };
    });
    return converted;
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

  // Helper function to ensure task data is properly rendered
  const ensureTaskDataRendered = () => {
    const taskBars = document.querySelectorAll('#gantt-chart [class*="absolute top-2 bottom-2"]');
    
    taskBars.forEach((bar, index) => {
      const task = ganttTasks[index];
      if (task) {
        const labelSpan = bar.querySelector('span');
        if (labelSpan) {
          const newText = task.progress > 0 ? `${task.progress}%` : task.title;
          labelSpan.textContent = newText;
        }
      }
    });
  };

  // Helper function to prepare element for export (handles sticky columns)
  const prepareElementForExport = (element: HTMLElement) => {
    const scrollableElement = element.querySelector('.overflow-x-auto') as HTMLElement;
    if (!scrollableElement) return null;

    // Store original styles
    const originalStyles = {
      overflow: scrollableElement.style.overflow,
      height: scrollableElement.style.height,
      width: scrollableElement.style.width,
      position: scrollableElement.style.position,
      zIndex: scrollableElement.style.zIndex,
    };

    // Modify scrollable element
    scrollableElement.style.overflow = 'visible';
    scrollableElement.style.height = 'auto';
    scrollableElement.style.width = 'auto';
    scrollableElement.style.position = 'static';
    scrollableElement.style.zIndex = 'auto';

    // Handle sticky columns
    const stickyColumns = element.querySelectorAll('.sticky');
    const stickyStyles: { element: HTMLElement; originalPosition: string; originalZIndex: string }[] = [];
    
    stickyColumns.forEach((col) => {
      const htmlCol = col as HTMLElement;
      stickyStyles.push({
        element: htmlCol,
        originalPosition: htmlCol.style.position,
        originalZIndex: htmlCol.style.zIndex,
      });
      htmlCol.style.position = 'static';
      htmlCol.style.zIndex = 'auto';
    });

    // Force reflow
    element.offsetHeight;
    scrollableElement.offsetHeight;

    return { originalStyles, stickyStyles };
  };

  // Helper function to restore element after export
  const restoreElementAfterExport = (
    element: HTMLElement, 
    originalStyles: any, 
    stickyStyles: any[]
  ) => {
    const scrollableElement = element.querySelector('.overflow-x-auto') as HTMLElement;
    if (!scrollableElement) return;

    // Restore scrollable element styles
    scrollableElement.style.overflow = originalStyles.overflow;
    scrollableElement.style.height = originalStyles.height;
    scrollableElement.style.width = originalStyles.width;
    scrollableElement.style.position = originalStyles.position;
    scrollableElement.style.zIndex = originalStyles.zIndex;

    // Restore sticky column styles
    stickyStyles.forEach(({ element, originalPosition, originalZIndex }) => {
      element.style.position = originalPosition;
      element.style.zIndex = originalZIndex;
    });
  };

  // Export functions
  const exportAsPNG = async () => {
    try {
    const ganttElement = document.getElementById('gantt-chart');
    const scrollableElement = ganttElement?.querySelector('.overflow-x-auto');
      
      if (!ganttElement || !scrollableElement) {
        alert('Gantt chart element not found. Please try again.');
        return;
      }

      // Show loading state
      const exportButton = document.querySelector('[data-export="png"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.textContent = 'Exporting...';
      }

    // Temporarily remove overflow restrictions and capture full content
    const originalOverflow = scrollableElement.style.overflow;
    const originalHeight = scrollableElement.style.height;
    const originalWidth = scrollableElement.style.width;
    
    scrollableElement.style.overflow = 'visible';
    scrollableElement.style.height = 'auto';
    scrollableElement.style.width = 'auto';

    // Force a reflow to ensure the element is fully expanded
    scrollableElement.offsetHeight;

      // Wait a bit for the DOM to settle
      await new Promise(resolve => setTimeout(resolve, 100));

    // Use html2canvas to capture the chart
      let html2canvas;
      try {
        html2canvas = await import('html2canvas');
      } catch (importError) {
        console.error('Failed to import html2canvas:', importError);
        throw new Error('Export library not available. Please refresh the page and try again.');
      }
      
      const canvas = await html2canvas.default(ganttElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Reduced scale for better performance
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        scrollX: 0,
        scrollY: 0,
        width: ganttElement.scrollWidth,
        height: ganttElement.scrollHeight,
        logging: false,
        imageTimeout: 10000,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in the cloned document
          const clonedElement = clonedDoc.getElementById('gantt-chart');
          if (clonedElement) {
            // Force font loading and ensure full width
            clonedElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            clonedElement.style.fontSmoothing = 'antialiased';
            clonedElement.style.webkitFontSmoothing = 'antialiased';
            clonedElement.style.textRendering = 'optimizeLegibility';
            
            // Ensure the cloned element shows full width
            const clonedScrollable = clonedElement.querySelector('.overflow-x-auto');
            if (clonedScrollable) {
              clonedScrollable.style.overflow = 'visible';
              clonedScrollable.style.width = 'auto';
              clonedScrollable.style.height = 'auto';
            }

            // Force re-render of task data in the cloned document
            const taskBars = clonedElement.querySelectorAll('[class*="absolute top-2 bottom-2"]');
            taskBars.forEach((bar, index) => {
              const task = ganttTasks[index];
              if (task) {
                // Update the task bar content
                const labelSpan = bar.querySelector('span');
                if (labelSpan && task.title) {
                  labelSpan.textContent = task.progress > 0 ? `${task.progress}%` : task.title;
                }
                
                // Update the progress bar
                const progressBar = bar.querySelector('[class*="bg-black bg-opacity-20"]');
                if (progressBar && task.progress > 0) {
                  progressBar.style.width = `${100 - task.progress}%`;
                }
              }
            });
          }
        }
      });

        // Restore original styles
        scrollableElement.style.overflow = originalOverflow;
        scrollableElement.style.height = originalHeight;
        scrollableElement.style.width = originalWidth;
        
        const link = document.createElement('a');
        link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();

      // Reset button state
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'PNG';
      }

    } catch (error) {
      console.error('PNG export failed:', error);
      alert('Failed to export PNG. Please try again.');
      
      // Reset button state
      const exportButton = document.querySelector('[data-export="png"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'PNG';
      }
    }
  };

  const exportAsPDF = async () => {
    try {
    const ganttElement = document.getElementById('gantt-chart');
    const scrollableElement = ganttElement?.querySelector('.overflow-x-auto');
      
      if (!ganttElement || !scrollableElement) {
        alert('Gantt chart element not found. Please try again.');
        return;
      }

      // Show loading state
      const exportButton = document.querySelector('[data-export="pdf"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.textContent = 'Exporting...';
      }

    // Temporarily remove overflow restrictions and capture full content
    const originalOverflow = scrollableElement.style.overflow;
    const originalHeight = scrollableElement.style.height;
    const originalWidth = scrollableElement.style.width;
    
    scrollableElement.style.overflow = 'visible';
    scrollableElement.style.height = 'auto';
    scrollableElement.style.width = 'auto';

    // Force a reflow to ensure the element is fully expanded
    scrollableElement.offsetHeight;

      // Wait a bit for the DOM to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure task data is properly rendered
      ensureTaskDataRendered();

      // Use html2canvas to capture the chart
      let html2canvas;
      try {
        html2canvas = await import('html2canvas');
      } catch (importError) {
        console.error('Failed to import html2canvas:', importError);
        throw new Error('Export library not available. Please refresh the page and try again.');
      }
      
      const canvas = await html2canvas.default(ganttElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Reduced scale for better performance
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        scrollX: 0,
        scrollY: 0,
        width: ganttElement.scrollWidth,
        height: ganttElement.scrollHeight,
        logging: false,
        imageTimeout: 10000,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in the cloned document
          const clonedElement = clonedDoc.getElementById('gantt-chart');
          if (clonedElement) {
            // Force font loading and ensure full width
            clonedElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            clonedElement.style.fontSmoothing = 'antialiased';
            clonedElement.style.webkitFontSmoothing = 'antialiased';
            clonedElement.style.textRendering = 'optimizeLegibility';
            
            // Ensure the cloned element shows full width
            const clonedScrollable = clonedElement.querySelector('.overflow-x-auto');
            if (clonedScrollable) {
              clonedScrollable.style.overflow = 'visible';
              clonedScrollable.style.width = 'auto';
              clonedScrollable.style.height = 'auto';
            }

            // Force re-render of task data in the cloned document
            const taskBars = clonedElement.querySelectorAll('[class*="absolute top-2 bottom-2"]');
            taskBars.forEach((bar, index) => {
              const task = ganttTasks[index];
              if (task) {
                // Update the task bar content
                const labelSpan = bar.querySelector('span');
                if (labelSpan && task.title) {
                  labelSpan.textContent = task.progress > 0 ? `${task.progress}%` : task.title;
                }
                
                // Update the progress bar
                const progressBar = bar.querySelector('[class*="bg-black bg-opacity-20"]');
                if (progressBar && task.progress > 0) {
                  progressBar.style.width = `${100 - task.progress}%`;
                }
              }
            });
          }
        }
      });

        // Restore original styles
        scrollableElement.style.overflow = originalOverflow;
        scrollableElement.style.height = originalHeight;
        scrollableElement.style.width = originalWidth;
        
      // Import jsPDF and create PDF
      let jsPDFModule;
      try {
        jsPDFModule = await import('jspdf');
      } catch (importError) {
        console.error('Failed to import jsPDF:', importError);
        throw new Error('PDF export library not available. Please refresh the page and try again.');
      }
          const { jsPDF } = jsPDFModule;
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate optimal PDF dimensions based on chart aspect ratio
          const chartAspectRatio = canvas.width / canvas.height;
          const maxPageWidth = 420; // A3 landscape width in mm for wide charts
          const maxPageHeight = 297; // A3 landscape height in mm
          const minPageWidth = 210; // A4 portrait width in mm
          const minPageHeight = 297; // A4 portrait height in mm
          
          let pdfWidth, pdfHeight;
          
          if (chartAspectRatio > maxPageWidth / maxPageHeight) {
            // Chart is very wide - use full width with A3 dimensions
            pdfWidth = maxPageWidth;
            pdfHeight = maxPageWidth / chartAspectRatio;
          } else if (chartAspectRatio > minPageWidth / minPageHeight) {
            // Chart is moderately wide - use A4 landscape
            pdfWidth = 297;
            pdfHeight = 210;
          } else {
            // Chart is taller than it is wide - use A4 portrait
            pdfWidth = 210;
            pdfHeight = 297;
          }
          
          // Use custom dimensions to fit the chart properly
          const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });
          
          // Add the image to fill the entire PDF page
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          pdf.save(`gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`);

      // Reset button state
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'PDF';
      }

    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
      
      // Reset button state
      const exportButton = document.querySelector('[data-export="pdf"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'PDF';
      }
    }
  };

  const exportAsExcel = async () => {
    try {
    if (ganttTasks.length === 0) {
      alert('No tasks to export');
      return;
    }

      // Show loading state
      const exportButton = document.querySelector('[data-export="excel"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.textContent = 'Exporting...';
      }

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
      ...csvData.map(row => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
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
      URL.revokeObjectURL(url);

      // Reset button state
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'Excel';
      }

    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export Excel file. Please try again.');
      
      // Reset button state
      const exportButton = document.querySelector('[data-export="excel"]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'Excel';
      }
    }
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
    <div 
      id="gantt-chart" 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        webkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility',
        imageRendering: 'crisp-edges',
        shapeRendering: 'geometricPrecision'
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Gantt Chart ({tasks.length} tasks)
            </h3>
            
            {/* Info about estimated timelines */}
            {ganttTasks.some(task => !task.hasOriginalDates) && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                <span className="font-medium">Note:</span> Some tasks show estimated timelines. Add start/due dates for accurate scheduling.
              </div>
            )}
            
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
                data-export="png"
              >
                <FileImage className="h-4 w-4" />
                <span className="hidden sm:inline">PNG</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportAsPDF}
                className="flex items-center space-x-1"
                data-export="pdf"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportAsExcel}
                className="flex items-center space-x-1"
                data-export="excel"
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
      <div className="relative overflow-x-auto">
        <div className="min-w-full" style={{ minWidth: `${timeline.length * (zoom === 'day' ? 60 : zoom === 'week' ? 100 : 120) + taskColumnWidth}px` }}>
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200">
            <div 
              className="flex-shrink-0 border-r border-gray-200 bg-gray-50 px-4 py-3 relative sticky left-0 z-10"
              style={{ width: `${taskColumnWidth}px` }}
            >
              <span className="text-sm font-medium text-gray-900">Task</span>
              <div 
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-300 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = taskColumnWidth;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = Math.max(200, Math.min(600, startWidth + e.clientX - startX));
                    setTaskColumnWidth(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
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
            {ganttTasks.map((task, index) => {
              const containerWidth = timeline.length * (zoom === 'day' ? 60 : zoom === 'week' ? 100 : 120);
              const dimensions = getTaskDimensions(task, containerWidth);
              
              return (
                <div key={task.id} className="flex min-h-12">
                  {/* Task Info */}
                  <div 
                    className="flex-shrink-0 border-r border-gray-200 px-4 py-3 bg-white sticky left-0 z-10"
                    style={{ width: `${taskColumnWidth}px` }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900" title={task.title}>
                            {task.title}
                          </div>
                          {!task.hasOriginalDates && (
                            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                              Estimated
                            </span>
                          )}
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
                            'absolute top-2 bottom-2 rounded-sm border flex items-center justify-center text-xs font-medium',
                            task.hasOriginalDates ? 'text-white' : 'text-gray-700',
                            task.status === 'done' ? (task.hasOriginalDates ? 'bg-green-500 border-green-600' : 'bg-green-200 border-green-300') :
                            task.status === 'in_progress' ? (task.hasOriginalDates ? 'bg-blue-500 border-blue-600' : 'bg-blue-200 border-blue-300') :
                            task.hasOriginalDates ? 'bg-gray-400 border-gray-500' : 'bg-gray-200 border-gray-300'
                          )}
                          style={{
                            left: `${dimensions.left}px`,
                            width: `${dimensions.width}px`,
                            textShadow: task.hasOriginalDates ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none',
                            fontSmoothing: 'antialiased',
                            webkitFontSmoothing: 'antialiased',
                            textRendering: 'optimizeLegibility'
                          }}
                          title={task.hasOriginalDates ? undefined : 'Estimated timeline - add start/due dates for accurate scheduling'}
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

