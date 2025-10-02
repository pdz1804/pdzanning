import { useMemo } from 'react';
import { TaskWithDetails, User } from '@/types';

export function useTopAssignees(tasks: TaskWithDetails[], limit: number = 3) {
  return useMemo(() => {
    const assigneeCounts = new Map<string, { user: User; count: number }>();
    
    tasks.forEach(task => {
      if (task.assignee_ids) {
        task.assignee_ids.forEach(assignee => {
          const current = assigneeCounts.get(assignee._id) || { user: assignee, count: 0 };
          current.count += 1;
          assigneeCounts.set(assignee._id, current);
        });
      }
    });

    return Array.from(assigneeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ user, count }) => ({
        id: user._id,
        label: user.name,
        count,
        avatar: user.name ? user.name[0].toUpperCase() : '?'
      }));
  }, [tasks, limit]);
}

export function useTopTags(tasks: TaskWithDetails[], limit: number = 3) {
  return useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({
        id: tag,
        label: tag,
        count,
        color: getTagColor(tag)
      }));
  }, [tasks, limit]);
}

function getTagColor(tag: string): string {
  // Generate a consistent color based on the tag name
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
