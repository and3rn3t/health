# Archived Developer Components

This directory contains developer-focused components that were removed from the main VitalSense application on September 3, 2025.

## Reason for Archival

These components were removed as part of cleaning up developer progress tracking components from the main user interface. GitHub is now used for project management instead of in-app tracking.

## Archived Components

### 1. CloudInfrastructureStatus.tsx

- **Purpose**: Cloud infrastructure monitoring and status dashboard
- **Features**: Real-time service health, metrics tracking, architecture overview
- **Dependencies**: @github/spark/hooks (being migrated away from)
- **Notes**: Comprehensive infrastructure monitoring with simulated cloud services

### 2. ImplementationPhases.tsx

- **Purpose**: Project implementation phases and roadmap tracking
- **Features**: Phase details, timeline visualization, cost estimation
- **Dependencies**: Phase1Summary component, complex state management
- **Notes**: Detailed project planning with phase comparison features

### 3. XcodeDevelopmentSetup.tsx

- **Purpose**: iOS/Xcode development setup guide and tools
- **Features**: Development environment setup, iOS integration guide
- **Dependencies**: Standard UI components
- **Notes**: Developer onboarding and setup documentation

### 4. RealtimeStatusBar.tsx

- **Purpose**: Real-time system status indicator bar
- **Features**: Live connection status, system health indicators
- **Dependencies**: Real-time data connections, WebSocket status
- **Notes**: Bottom status bar for development monitoring

### 5. SystemStatusPanel.tsx

- **Purpose**: Comprehensive system status and monitoring panel
- **Features**: System health overview, performance metrics
- **Dependencies**: Monitoring services, health check APIs
- **Notes**: Developer dashboard for system monitoring

## Dependencies Note

Some of these components used @github/spark/hooks which is being migrated to custom Cloudflare KV implementation. If restoring these components, update the hooks accordingly.

## Restoration Process

If these components need to be restored:

1. Copy component from archived directory back to appropriate location
2. Update any @github/spark/hooks imports to use custom hooks
3. Add back to App.tsx navigation and routing
4. Test all functionality and dependencies
5. Update imports in other components if needed

## Related Files

These components may have had associated navigation items, icons, and menu entries that were also removed from:

- `src/App.tsx` (navigation items, component rendering)
- Icon imports (Apple, Code, Monitor, Roadmap icons)
- Route handling and menu structures

## Archive Date

September 3, 2025

## Contact

If these components need to be restored or if you have questions about their functionality, refer to the git history for implementation details.
