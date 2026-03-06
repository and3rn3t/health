# 📦 Component Archive Index

This archive contains components that were moved during the VitalSense component cleanup.

## 📁 Archive Organization

### `experimental/`

**LiDAR Technology Components** (Future Features)

- `LiDAREnvironmentalHazardDetector.tsx` - Experimental environmental hazard detection
- `LiDARFallPredictionEngine.tsx` - LiDAR-based fall prediction system
- `LiDARTrainingAssistant.tsx` - LiDAR training and calibration assistant

_These components represent advanced LiDAR integration features that are planned for future implementation but not currently connected to the main application._

### `duplicates/`

**Superseded Component Implementations**

- `AdvancedAnalytics.tsx` - Superseded by `MLPredictionsDashboard.tsx`
- `AdvancedFamilyCaregiverDashboard.tsx` - Superseded by `FamilyDashboard.tsx`
- `EmergencyTriggerButton.tsx` - Superseded by `EmergencyTrigger.tsx`
- `EnhancedFallRiskMonitor.tsx` - Superseded by `FallRiskWalkingManager.tsx`
- `FallRiskMonitor.tsx` - Superseded by `FallRiskWalkingManager.tsx`
- `FallRiskWalkingDashboard.tsx` - Superseded by `FallRiskWalkingManager.tsx`
- `HealthDashboard.tsx` - Superseded by `LandingPage.tsx`
- `HealthInsightsDashboard.tsx` - Superseded by `EnhancedHealthInsightsDashboard.tsx`
- `MonitoringDashboard.tsx` - Superseded by `RealTimeMonitoringHub.tsx`

_These components were replaced by enhanced versions with better functionality, improved UI, or consolidated features._

### `infrastructure/`

**System Infrastructure Components**

- `CloudInfrastructureStatus.tsx` - Cloud infrastructure monitoring
- `HealthcareProviderAPI.tsx` - Healthcare provider API integration
- `UptimeMonitoringSystem.tsx` - System uptime monitoring

_These components handle backend infrastructure concerns and are not part of the user-facing application interface._

### `unused-health/`

**Unconnected Health Features**

- `AdvancedCaregiverAlerts.tsx` - Caregiver alerting system (not connected)
- `ChallengeCreator.tsx` - Gamification challenge creation (not implemented)
- `DataSync.tsx` - Data synchronization component (not connected)
- `DataVisualization.tsx` - Generic data visualization (superseded by specific charts)
- `FallRiskInterventions.tsx` - Fall risk intervention system (not connected)
- `LiveDataStream.tsx` - Real-time data streaming (not connected)
- `RealtimeStatusBar.tsx` - Real-time status indicator (not used)
- `RecentHealthData.tsx` - Recent health data display (not connected)
- `RecentHealthHistory.tsx` - Health history display (not connected)
- `WalkingPatternMonitor.tsx` - Walking pattern analysis (covered by MovementPatternAnalysis)

_These components represent health monitoring features that were developed but not integrated into the main application flow._

### `demos/`

**Demo and Test Components**

- `WsHistoricalDemo.tsx` - WebSocket historical data demonstration

_These components were created for testing, demonstration, or prototyping purposes._

## 🔄 Restoration Process

If any archived component needs to be restored:

1. **Move the component back** to the appropriate active folder
2. **Update imports** in any files that reference it
3. **Test the build** to ensure no breaking changes
4. **Update this index** to reflect the restoration

## 📊 Cleanup Results

**Before Cleanup:**

- Total Components: ~120
- Active Components: ~35 (29%)
- Unused Components: ~85 (71%)

**After Cleanup:**

- Active Components: ~35 (100% of visible components)
- Archived Components: ~85 (preserved but organized)

**Benefits Achieved:**

- ✅ Cleaner component navigation in IDE
- ✅ Faster TypeScript checking and builds
- ✅ Clear understanding of active vs. experimental features
- ✅ Reduced cognitive load for developers
- ✅ Organized preservation of all development work

---

_Last Updated: December 2024_
_Cleanup Date: Component cleanup performed as part of VitalSense codebase organization_
