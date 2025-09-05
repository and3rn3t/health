import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VitalSenseColors, getVitalSenseClasses } from '@/lib/vitalsense-colors';
import { Copy, CheckCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ColorSwatchProps {
  label: string;
  colors: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  cssClass: string;
  description?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ label, colors, cssClass, description }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(`${type}-${label}`);
    toast.success(`Copied ${type} to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const ColorBox = ({ color, variant, textColor }: { color: string; variant: string; textColor: string }) => (
    <div className="group relative">
      <div 
        className={`h-16 w-full rounded-lg border-2 border-border shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md cursor-pointer`}
        style={{ backgroundColor: color }}
        onClick={() => copyToClipboard(color, variant)}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {copied === `${variant}-${label}` ? (
            <CheckCircle className="h-5 w-5" style={{ color: textColor }} />
          ) : (
            <Copy className="h-5 w-5" style={{ color: textColor }} />
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs font-medium">{variant}</p>
        <p className="text-xs text-muted-foreground font-mono">{color}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-6 text-xs"
          onClick={() => copyToClipboard(`bg-vitalsense-${cssClass}${variant !== 'main' ? `-${variant}` : ''}`, 'CSS Class')}
        >
          Copy CSS
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div 
            className="h-4 w-4 rounded-full border-2 border-border"
            style={{ backgroundColor: colors.main }}
          />
          {label}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          <ColorBox color={colors.main} variant="main" textColor={colors.contrast} />
          <ColorBox color={colors.light} variant="light" textColor={colors.contrast} />
          <ColorBox color={colors.dark} variant="dark" textColor={colors.contrast} />
          <ColorBox 
            color={colors.contrast} 
            variant="contrast" 
            textColor={colors.contrast === '#ffffff' ? '#000000' : '#ffffff'} 
          />
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Usage Examples:</p>
          <div className="space-y-1 text-xs font-mono text-muted-foreground">
            <p>Background: <code className="bg-background px-1 rounded">bg-vitalsense-{cssClass}</code></p>
            <p>Text: <code className="bg-background px-1 rounded">text-vitalsense-{cssClass}</code></p>
            <p>Border: <code className="bg-background px-1 rounded">border-vitalsense-{cssClass}</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const VitalSenseBrandColors: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-vitalsense-primary rounded-lg">
          <Sparkles className="h-6 w-6 text-vitalsense-primary-contrast" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">VitalSense Brand Colors</h1>
          <p className="text-muted-foreground">
            Official color palette for the VitalSense health monitoring platform
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <ColorSwatch
          label="Primary Blue"
          colors={VitalSenseColors.primary}
          cssClass="primary"
          description="Main brand color used for primary actions and highlights"
        />

        <ColorSwatch
          label="Accent Teal"
          colors={VitalSenseColors.teal}
          cssClass="teal"
          description="Secondary accent color for supporting elements and highlights"
        />

        <ColorSwatch
          label="Success Green"
          colors={VitalSenseColors.success}
          cssClass="success"
          description="Positive health indicators and successful actions"
        />

        <ColorSwatch
          label="Warning Amber"
          colors={VitalSenseColors.warning}
          cssClass="warning"
          description="Caution states and attention-requiring elements"
        />

        <ColorSwatch
          label="Error Red"
          colors={VitalSenseColors.error}
          cssClass="error"
          description="Critical alerts and error states"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal rounded-full"></div>
            Color Usage Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-vitalsense-primary">Primary Applications</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Navigation and primary buttons</li>
                <li>• Active states and selections</li>
                <li>• Brand headers and logos</li>
                <li>• Call-to-action elements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2 text-vitalsense-teal">Secondary Applications</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Supporting information and badges</li>
                <li>• Secondary navigation elements</li>
                <li>• Accent colors for data visualization</li>
                <li>• Interactive hover states</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Health-Specific Color Coding</h4>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-vitalsense-success rounded-full"></div>
                <span>Excellent/Normal Health</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-vitalsense-warning rounded-full"></div>
                <span>Moderate Risk/Caution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-vitalsense-error rounded-full"></div>
                <span>High Risk/Critical</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Color Demo</CardTitle>
          <CardDescription>See how VitalSense colors work in practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button className="bg-vitalsense-primary hover:bg-vitalsense-primary-light text-vitalsense-primary-contrast">
                Primary Button
              </Button>
              <Button variant="outline" className="border-vitalsense-teal text-vitalsense-teal hover:bg-vitalsense-teal hover:text-vitalsense-teal-contrast">
                Teal Outline
              </Button>
              <Button className="bg-vitalsense-success hover:bg-vitalsense-success-light text-vitalsense-success-contrast">
                Success Action
              </Button>
              <Button variant="destructive" className="bg-vitalsense-error hover:bg-vitalsense-error-light text-vitalsense-error-contrast">
                Critical Alert
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-4 bg-vitalsense-primary rounded-lg text-vitalsense-primary-contrast">
                <h4 className="font-semibold">Health Score</h4>
                <p className="text-2xl font-bold">78/100</p>
                <p className="text-sm opacity-90">Excellent</p>
              </div>
              <div className="p-4 bg-vitalsense-warning rounded-lg text-vitalsense-warning-contrast">
                <h4 className="font-semibold">Fall Risk</h4>
                <p className="text-2xl font-bold">Moderate</p>
                <p className="text-sm opacity-90">Monitor closely</p>
              </div>
              <div className="p-4 bg-vitalsense-success rounded-lg text-vitalsense-success-contrast">
                <h4 className="font-semibold">Steps Today</h4>
                <p className="text-2xl font-bold">8,750</p>
                <p className="text-sm opacity-90">Great progress!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};