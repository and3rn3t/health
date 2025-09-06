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
import { useEffect, useState } from 'react';

interface FooterProps {
  readonly healthScore?: number;
  readonly lastSync?: Date;
  readonly connectionStatus?: 'connected' | 'disconnected' | 'syncing';
  readonly onNavigate: (tab: string) => void;
}

export default function Footer({
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
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'syncing':
        return <Activity className="h-3 w-3 animate-pulse text-blue-500" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-red-500" />;
      default:
        return <Wifi className="h-3 w-3 text-gray-500" />;
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
    <footer className="bg-card/50 mt-auto border-t">
      <div className="px-4 py-4 lg:px-6">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Section - Brand & Status */}
          <div className="flex items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-vitalsense-primary">
                <Heart className="h-3 w-3 text-vitalsense-primary-contrast" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-vitalsense-text-primary">
                  VitalSense
                </span>
                <span className="text-xs text-vitalsense-text-muted">
                  Health Monitor
                </span>
              </div>
            </div>

            {/* Health Score */}
            {healthScore !== undefined && (
              <>
                <div className="h-4 w-px bg-border" />
                <Badge
                  variant="outline"
                  className="border-vitalsense-primary px-3 py-1 text-vitalsense-primary"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {healthScore}/100
                </Badge>
              </>
            )}
          </div>

          {/* Right Section - Status & Time */}
          <div className="flex items-center gap-3 text-sm">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="hidden text-xs text-vitalsense-text-muted sm:inline">
                {getConnectionText()}
              </span>
            </div>

            {/* Last Sync */}
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-vitalsense-text-muted" />
              <span className="text-xs text-vitalsense-text-muted">
                {formatLastSync()}
              </span>
            </div>

            {/* Current Time */}
            <div className="text-xs text-vitalsense-text-muted">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* WS Token Settings Button */}
            <div className="hidden sm:block">
              <WSTokenSettings />
            </div>
          </div>
        </div>

        {/* Mobile Quick Links */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:hidden">
          {quickLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Button
                key={link.tab}
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(link.tab)}
                className="footer-button h-9 min-w-[90px] px-4 text-xs font-medium"
              >
                <IconComponent className="mr-2 h-3 w-3" />
                {link.label}
              </Button>
            );
          })}
          {/* Mobile WS Token Settings */}
          <div className="ml-2">
            <WSTokenSettings />
          </div>
        </div>
      </div>
    </footer>
  );
}
