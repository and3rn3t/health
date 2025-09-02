import { Button } from '@/components/ui/button';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import { AlertTriangle, Phone } from 'lucide-react';
import { useMemo } from 'react';

type Props = { userId?: string; size?: 'sm' | 'lg' | 'default' };

export default function EmergencyTriggerButton({
  userId = 'default-user',
  size = 'sm',
}: Props) {
  const { triggerEmergency, pendingEmergency } = useLiveHealthData(userId);

  const remainingSec = useMemo(() => {
    if (!pendingEmergency) return 0;
    const ms = Math.max(0, pendingEmergency.expiresAt - Date.now());
    return Math.ceil(ms / 1000);
  }, [pendingEmergency]);

  const onTrigger = () => {
    // Minimal sanitized payload; do not include PII
    triggerEmergency({
      kind: 'manual',
      severity: 'high',
      message: 'User-triggered emergency',
    });
  };

  if (size === 'lg') {
    return (
      <Button
        variant={pendingEmergency ? 'destructive' : 'outline'}
        size="lg"
        onClick={onTrigger}
        disabled={!!pendingEmergency}
        className={pendingEmergency ? 'animate-pulse' : ''}
      >
        {pendingEmergency ? (
          <>
            <AlertTriangle className="mr-2 h-5 w-5" />
            Cancel window: {remainingSec}s
          </>
        ) : (
          <>
            <Phone className="mr-2 h-5 w-5" />
            Emergency
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={onTrigger}
      disabled={!!pendingEmergency}
      className={pendingEmergency ? 'text-destructive border-destructive' : ''}
      title={
        pendingEmergency ? `Sending in ${remainingSec}s` : 'Trigger emergency'
      }
    >
      <Phone className="mr-2 h-4 w-4" />
      {pendingEmergency ? `Sending in ${remainingSec}s` : 'Emergency'}
    </Button>
  );
}
