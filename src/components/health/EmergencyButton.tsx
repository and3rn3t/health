import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface EmergencyButtonProps {
  readonly onClick?: () => void;
  readonly className?: string;
}

export function EmergencyButton({
  onClick,
  className = '',
}: EmergencyButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 ${className}`}
      style={{ minWidth: '120px' }}
    >
      <AlertTriangle className="mr-1 h-4 w-4" />
      Emergency
    </Button>
  );
}

export default EmergencyButton;
