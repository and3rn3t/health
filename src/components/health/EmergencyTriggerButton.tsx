import { Button } from '@/components/ui/button';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import { AlertTriangle, Phone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = { readonly userId?: string; readonly size?: 'sm' | 'lg' | 'default' };

interface PendingEmergency {
  expiresAt: number;
  timeoutId: number;
}

export default function EmergencyTriggerButton({ userId = 'default-user', size = 'sm' }: Props) {
  // Live metrics hook (for potential future enhancements / status display)
  useLiveHealthData(userId);

  // Local emergency trigger state (edge-safe, no PII)
  const [pendingEmergency, setPendingEmergency] = useState<PendingEmergency | null>(null);
  const sentRef = useRef(false);

  const remainingSec = useMemo(() => {
    if (!pendingEmergency) return 0;
    const ms = Math.max(0, pendingEmergency.expiresAt - Date.now());
    return Math.ceil(ms / 1000);
  }, [pendingEmergency]);

  const cancelEmergency = () => {
    if (pendingEmergency) {
      clearTimeout(pendingEmergency.timeoutId);
      setPendingEmergency(null);
      sentRef.current = false;
    }
  };

  const sendEmergency = () => {
    if (sentRef.current) return;
    sentRef.current = true;
    // Placeholder for real dispatch (e.g., POST /api/emergency or WS send)
    console.log('[EmergencyTrigger] Emergency dispatched', {
      userId,
      severity: 'high',
      kind: 'manual',
      ts: new Date().toISOString(),
    });
    setPendingEmergency(null);
  };

  const onTrigger = () => {
    if (pendingEmergency) {
      cancelEmergency();
      return;
    }
    const timeoutId = window.setTimeout(sendEmergency, 5000); // 5s cancel window
    setPendingEmergency({ expiresAt: Date.now() + 5000, timeoutId });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingEmergency) {
        clearTimeout(pendingEmergency.timeoutId);
      }
    };
  }, [pendingEmergency]);

  if (size === 'lg') {
    return (
      <Button
    variant={pendingEmergency ? 'destructive' : 'outline'}
        size="lg"
        onClick={onTrigger}
    className={pendingEmergency ? 'animate-pulse' : ''}
    title={pendingEmergency ? 'Click to cancel emergency' : 'Trigger emergency'}
      >
        {pendingEmergency ? (
          <>
            <AlertTriangle className="mr-2 h-5 w-5" />
      Sending in {remainingSec}s (click to cancel)
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
    className={pendingEmergency ? 'text-destructive border-destructive animate-pulse' : ''}
    title={pendingEmergency ? 'Click to cancel emergency' : 'Trigger emergency'}
    >
      <Phone className="mr-2 h-4 w-4" />
    {pendingEmergency ? `Sending in ${remainingSec}s (cancel)` : 'Emergency'}
    </Button>
  );
}
