/**
 * Optimized icon exports - barrel export for better organization
 * lucide-react v0.484+ supports tree-shaking, so unused icons are automatically removed
 * This barrel export provides:
 * 1. Consistent import paths across the codebase
 * 2. Easier migration if we switch icon libraries
 * 3. Better IDE autocomplete and organization
 *
 * Usage: import { Activity, AlertTriangle } from '@/lib/icons';
 *
 * Note: Modern bundlers (Vite/esbuild) will tree-shake unused icons automatically
 */

// Most commonly used icons - add more as needed
// Tree-shaking will remove unused icons from the bundle
export {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Bug,
  Calendar,
  CheckCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Footprints,
  Heart,
  Lightbulb,
  Minus,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Scan,
  Settings,
  Share,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Watch,
  Wifi,
  Wrench,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Alias for Settings to match existing usage
export { Settings as SettingsIcon } from 'lucide-react';
