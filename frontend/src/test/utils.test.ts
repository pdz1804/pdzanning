import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateShort,
  isOverdue,
  getDaysUntilDue,
  getPriorityColor,
  getStatusColor,
  getProgressColor,
  getAvatarInitials,
  getAvatarColor,
  truncateText,
  groupBy,
  sortBy,
  isValidEmail,
  isValidDate,
} from '@/lib/utils';

describe('Date utilities', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/Jan.*15.*2024/);
  });

  it('should format short date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDateShort(date);
    expect(formatted).toMatch(/Jan.*15/);
  });

  it('should detect overdue dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    expect(isOverdue(yesterdayStr)).toBe(true);
  });

  it('should calculate days until due', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    expect(getDaysUntilDue(tomorrowStr)).toBe(1);
  });
});

describe('Color utilities', () => {
  it('should return correct priority colors', () => {
    expect(getPriorityColor('urgent')).toContain('red');
    expect(getPriorityColor('high')).toContain('orange');
    expect(getPriorityColor('medium')).toContain('yellow');
    expect(getPriorityColor('low')).toContain('green');
  });

  it('should return correct status colors', () => {
    expect(getStatusColor('todo')).toContain('gray');
    expect(getStatusColor('in_progress')).toContain('blue');
    expect(getStatusColor('done')).toContain('green');
  });

  it('should return correct progress colors', () => {
    expect(getProgressColor(0)).toContain('gray');
    expect(getProgressColor(25)).toContain('red');
    expect(getProgressColor(75)).toContain('blue');
    expect(getProgressColor(100)).toContain('green');
  });
});

describe('Avatar utilities', () => {
  it('should generate initials correctly', () => {
    expect(getAvatarInitials('John Doe')).toBe('JD');
    expect(getAvatarInitials('Jane')).toBe('J');
    expect(getAvatarInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('should return consistent colors for same name', () => {
    const color1 = getAvatarColor('John Doe');
    const color2 = getAvatarColor('John Doe');
    expect(color1).toBe(color2);
  });
});

describe('Text utilities', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that should be truncated';
    const truncated = truncateText(longText, 20);
    expect(truncated).toBe('This is a very lo...');
    expect(truncated.length).toBe(20);
  });

  it('should not truncate short text', () => {
    const shortText = 'Short text';
    const truncated = truncateText(shortText, 20);
    expect(truncated).toBe('Short text');
  });
});

describe('Array utilities', () => {
  it('should group array by key', () => {
    const items = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 },
    ];
    
    const grouped = groupBy(items, 'category');
    expect(grouped['A']).toHaveLength(2);
    expect(grouped['B']).toHaveLength(1);
  });

  it('should sort array by key', () => {
    const items = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ];
    
    const sorted = sortBy(items, 'name', 'asc');
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Charlie');
  });
});

describe('Validation utilities', () => {
  it('should validate email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should validate dates', () => {
    expect(isValidDate('2024-01-15')).toBe(true);
    expect(isValidDate('invalid-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

