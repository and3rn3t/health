import EnhancedFamilyDashboard from '@/components/family/EnhancedFamilyDashboard';
import type { ProcessedHealthData } from '@/types';

interface FamilyDashboardProps {
  healthData: ProcessedHealthData | null;
}

export default function FamilyDashboard({
  healthData,
}: Readonly<FamilyDashboardProps>) {
  return <EnhancedFamilyDashboard healthData={healthData} />;
}
