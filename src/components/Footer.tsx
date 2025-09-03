/**
 * Enhanced Footer Component
 * Status information, quick links, and branding
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  healthScore?: number;
  lastSync?: Date;
  connectionStatus?: 'connected' | 'disconnected' | 'syncing';
  onNavigate: (tab: string) => void;
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
    <footer className="bg-card/95 supports-[backdrop-filter]:bg-card/60 border-border mt-auto border-t backdrop-blur">
      <div className="px-4 py-3 lg:px-6">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Section - Brand & Status */}
          <div className="flex items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-vitalsense-primary">
                <Heart className="h-3 w-3 text-vitalsense-primary-contrast" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-vitalsense-text-primary">
                  VitalSense
                </span>
                <span className="text-xs text-vitalsense-text-muted">
                  Health Monitor
                </span>
              </div>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Health Score */}
            {healthScore !== undefined && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-vitalsense-primary text-vitalsense-primary"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  Score: {healthScore}/100
                </Badge>
              </div>
            )}
          </div>

          {/* Center Section - Quick Links (Desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Button
                  key={link.tab}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(link.tab)}
                  className="h-8 text-xs"
                >
                  <IconComponent className="mr-1 h-3 w-3" />
                  {link.label}
                </Button>
              );
            })}
          </div>

          {/* Right Section - Connection Status & Time */}
          <div className="flex items-center gap-4 text-sm">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-muted-foreground hidden sm:inline">
                {getConnectionText()}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* Last Sync */}
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground text-xs">
                <span className="hidden sm:inline">Sync: </span>
                {formatLastSync()}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* Current Time */}
            <div className="text-muted-foreground text-xs">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Mobile Quick Links */}
        <div className="mt-3 flex items-center justify-center gap-2 lg:hidden">
          {quickLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Button
                key={link.tab}
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(link.tab)}
                className="h-8 flex-1 text-xs"
              >
                <IconComponent className="mr-1 h-3 w-3" />
                {link.label}
              </Button>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span>© 2025 VitalSense Health Monitor</span>
            <Badge
              variant="outline"
              className="border-vitalsense-teal text-vitalsense-teal"
            >
              <Smartphone className="mr-1 h-2 w-2" />
              iOS Ready
            </Badge>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>Powered by Apple HealthKit</span>
            <span>•</span>
            <span>AI Enhanced</span>
            <span>•</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => onNavigate('system-status')}
              className="h-auto p-0 text-xs text-vitalsense-primary underline-offset-4 hover:underline"
            >
              System Status
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
