/**
 * Enhanced Footer Component
 * Status information, quick links, and branding
 */

import WSTokenSettings from '@/components/health/WSTokenSettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Clock,
  Heart,
  Shield,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';

interface FooterProps {
  readonly healthScore?: number;
  readonly lastSync?: Date;
  readonly connectionStatus?: 'connected' | 'disconnected' | 'syncing';
  readonly onNavigate: (tab: string) => void;
}

function Footer({
  healthScore,
  lastSync,
  connectionStatus = 'connected',
  onNavigate,
}: FooterProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-vitalsense-success" />;
      case 'syncing':
        return (
          <Activity className="h-3 w-3 animate-pulse text-vitalsense-primary" />
        );
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-vitalsense-error" />;
      default:
        return <Wifi className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'syncing':
        return 'Syncing...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const quickLinks = [
    { label: 'Status', tab: 'system-status', icon: Activity },
    { label: 'Setup', tab: 'healthkit-guide', icon: Smartphone },
    { label: 'Emergency', tab: 'emergency', icon: Shield },
  ];

  return (
    <footer className="vs-glass-thick border-border/50 mt-auto border-t">
      <div className="px-4 py-3 lg:px-8">
        {/* Grid-based Footer Layout */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-center">
          {/* Brand & Score */}
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vitalsense-primary">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-base font-semibold">
                VitalSense
              </span>
              <span className="text-xs text-muted-foreground">
                Health Monitor
              </span>
            </div>
            {healthScore !== undefined && (
              <Badge
                variant="outline"
                className="ml-3 px-3 py-1.5 border-vitalsense-primary font-medium text-vitalsense-primary"
              >
                <Shield className="mr-2 h-4 w-4" />
                {healthScore}/100
              </Badge>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-center">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Button
                  key={link.tab}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(link.tab)}
                  className="h-9 text-xs px-3 min-w-[90px] font-medium"
                >
                  <IconComponent className="h-3 w-3 mr-2" />
                  {link.label}
                </Button>
              );
            })}
          </div>

          {/* Status & Time & Settings */}
          <div className="gap-3 flex items-center justify-start text-sm lg:justify-end">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {getConnectionText()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatLastSync()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div>
              <WSTokenSettings />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
