import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  Camera,
  FileText,
  Plus,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface FloatingActionButtonProps {
  onQuickAction: (action: string) => void;
  className?: string;
}

const quickActions = [
  {
    id: 'emergency',
    label: 'Emergency',
    icon: AlertTriangle,
    className:
      'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25',
  },
  {
    id: 'quick-vitals',
    label: 'Quick Vitals',
    icon: Activity,
    className:
      'bg-gradient-to-br from-vitalsense-teal to-vitalsense-teal/80 hover:from-vitalsense-teal/90 hover:to-vitalsense-teal/70 text-white shadow-lg shadow-vitalsense-teal/25',
  },
  {
    id: 'photo',
    label: 'Photo',
    icon: Camera,
    className:
      'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25',
  },
  {
    id: 'note',
    label: 'Note',
    icon: FileText,
    className: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
];

export function FloatingActionButton({
  onQuickAction,
  className,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(isExpanded ? 30 : 50);
    }
  };

  const handleAction = (actionId: string) => {
    onQuickAction(actionId);
    setIsExpanded(false);
    // Stronger haptic for action
    if ('vibrate' in navigator) {
      navigator.vibrate(75);
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3',
        'pb-safe-bottom',
        className
      )}
    >
      {/* Quick action buttons */}
      {isExpanded && (
        <div className="animate-in slide-in-from-bottom-4 fade-in flex flex-col gap-2 duration-200">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                size="icon"
                onClick={() => handleAction(action.id)}
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
                  'animate-in slide-in-from-bottom-2 fade-in',
                  action.className
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      )}

      {/* Main FAB - VitalSense themed */}
      <Button
        size="icon"
        onClick={toggleExpanded}
        className={cn(
          'h-14 w-14 rounded-full transition-all duration-300',
          'bg-gradient-to-br from-vitalsense-teal to-vitalsense-teal/80',
          'hover:from-vitalsense-teal/90 hover:to-vitalsense-teal/70',
          'shadow-lg shadow-vitalsense-teal/25 hover:shadow-xl hover:shadow-vitalsense-teal/30',
          'border border-vitalsense-teal/20',
          'text-white',
          'hover:scale-105 active:scale-95',
          isExpanded && 'rotate-45 bg-gradient-to-br from-red-500 to-red-600'
        )}
        aria-label={isExpanded ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-white drop-shadow-sm" />
        ) : (
          <Plus className="h-6 w-6 text-white drop-shadow-sm" />
        )}
      </Button>

      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="animate-in fade-in fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm duration-200"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
