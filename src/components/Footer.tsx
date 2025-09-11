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
    <footer className="bg-card/50 mt-auto border-t border-gray-100">
      <div className="px-4 py-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Section - Brand & Status */}
          <div className="flex items-center gap-6">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vitalsense-primary">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-vitalsense-text-primary text-base font-semibold">
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
                <div className="w-px bg-border h-6" />
                <Badge
                  variant="outline"
                  className="border-vitalsense-primary px-4 py-2 font-medium text-vitalsense-primary"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {healthScore}/100
                </Badge>
              </>
            )}
          </div>

          {/* Right Section - Status & Time */}
          <div className="gap-3 flex items-center text-sm">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-xs text-vitalsense-text-muted hidden sm:inline">
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
                className="footer-button h-9 text-xs min-w-[90px] px-4 font-medium"
              >
                <IconComponent className="h-3 w-3 mr-2" />
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
