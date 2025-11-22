import WebSocketArchitectureGuide from '@/components/health/WebSocketArchitectureGuide';
import { WSTokenSettings } from '@/components/health/WSTokenSettings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Network, Wrench } from 'lucide-react';

export default function DeveloperTools() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Wrench className="h-6 w-6 text-primary" />
            Developer Tools
          </h2>
          <p className="text-muted-foreground">
            VitalSense developer utilities for local testing, tokens, and
            WebSocket architecture.
          </p>
        </div>
      </div>

      {/* WebSocket Tools */}
      <Card className="ios-26-surface-elevated border-white/10 text-foreground backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Network className="h-5 w-5" />
            WebSocket Tools & Architecture
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Token configuration and end-to-end WebSocket architecture guide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <div className="rounded border p-3 text-foreground">
            <div className="mb-2 text-sm font-medium text-foreground">
              Device Token & Connection
            </div>
            <WSTokenSettings />
          </div>
          <div className="rounded border p-3 text-foreground">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Wrench className="h-4 w-4" />
              Architecture Guide
            </div>
            <WebSocketArchitectureGuide />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
