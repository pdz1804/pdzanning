import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  id: string;
  label: string;
  count?: number;
  avatar?: string;
  color?: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
  maxDisplay?: number;
}

export function Dropdown({
  items,
  selectedItems,
  onSelectionChange,
  placeholder = "Select items",
  multiple = true,
  className,
  maxDisplay = 3
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
  const topItems = items.slice(0, maxDisplay);

  const handleItemClick = (itemId: string) => {
    if (multiple) {
      const newSelection = selectedItems.includes(itemId)
        ? selectedItems.filter(id => id !== itemId)
        : [...selectedItems, itemId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([itemId]);
      setIsOpen(false);
    }
  };

  // const removeItem = (_itemId: string) => {
  //   onSelectionChange(selectedItems.filter(id => id !== _itemId));
  // };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
          selectedItems.length > 0 && "border-primary-300 bg-primary-50"
        )}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {selectedItems.length === 0 ? (
            <span className="text-gray-500 truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center space-x-1 min-w-0 flex-1">
              {selectedItemsData.slice(0, maxDisplay).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {item.avatar && (
                    <span className="mr-1 text-xs">{item.avatar}</span>
                  )}
                  {item.label}
                  {item.count && (
                    <span className="ml-1 text-xs opacity-75">({item.count})</span>
                  )}
                </span>
              ))}
              {selectedItems.length > maxDisplay && (
                <span className="text-xs text-gray-500">
                  +{selectedItems.length - maxDisplay} more
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {topItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                selectedItems.includes(item.id) && "bg-primary-50 text-primary-900"
              )}
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {item.avatar && (
                  <span className="text-sm font-medium text-gray-600">{item.avatar}</span>
                )}
                {item.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {item.count && (
                  <span className="text-xs text-gray-500">({item.count})</span>
                )}
                {selectedItems.includes(item.id) && (
                  <span className="text-primary-600 text-xs">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
