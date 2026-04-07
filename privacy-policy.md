# Privacy Policy — VitalSense

**Effective Date**: March 3, 2026
**Last Updated**: March 3, 2026

## Overview

VitalSense is a health monitoring platform that integrates with Apple Health (HealthKit) to provide health insights, fall risk detection, and caregiver dashboards. This privacy policy explains how health data is handled.

## Health Data Collection

### HealthKit Integration

With your explicit permission, the app may access:

- **Heart Rate Data**: For health trend visualization and anomaly detection
- **Step Count**: For activity tracking and gait analysis
- **Walking Data**: For gait analysis and fall risk scoring
- **Sleep Data**: For health pattern analysis

### Sensor Data

- **Motion Sensors**: Core Motion data for gait analysis and fall detection
- **Camera Data**: For posture detection features (when enabled)

## How Data Is Used

### Health Monitoring

- Visualize health metrics in the web dashboard
- Calculate fall risk scores from gait and balance data
- Detect anomalies and trends in health metrics
- Display real-time sensor data via WebSocket

### Dashboard Display

- Visualize health metrics in web interface
- Display charts, trends, and alerts
- Caregiver monitoring (with explicit consent)

## Data Storage

### Local Storage

- Health data is primarily stored locally on your device
- Uses iOS secure storage mechanisms
- No permanent server-side storage

### Temporary Storage

- Cloudflare KV stores health data with configurable retention TTLs
- Data retention follows the policy in `docs/security/RETENTION_POLICY.md`

## Security

### Encryption

- Uses iOS standard encryption for local storage
- HTTPS/WSS for network communication
- API authentication via JWT tokens

### Access

- Only you have access to your data
- No third-party integrations
- No data sharing or selling

## Your Rights

### Control Your Data

- Grant/revoke HealthKit permissions in iOS Settings
- Delete app to remove all local data
- Request deletion of any development server data

### Transparency

- All code is open source (see GitHub repository)
- You can inspect exactly what the app does
- No hidden data collection

## Limitations

### Not for Medical Use

- Not FDA approved or clinically validated
- Not a substitute for medical advice
- Fall risk scores are informational only

### No Warranty

- Provided "as is"
- No guarantees of accuracy or reliability

## Contact

This is a personal project by Matt (and3rn3t).

- **GitHub**: <https://github.com/and3rn3t/health>
- **Issues**: Report via GitHub Issues

## Changes to This Policy

This privacy policy may be updated as the project evolves. Check the repository for the latest version.

---

**By using VitalSense, you acknowledge that it is not a medical device and should not be relied upon for medical decisions.**
