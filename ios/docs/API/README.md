# VitalSense API Documentation

## Overview

This document describes the API endpoints and data structures used in the VitalSense health monitoring application.

## Base URLs

- **Development**: `https://api-dev.vitalsense.com`
- **Staging**: `https://api-staging.vitalsense.com`
- **Production**: `https://api.vitalsense.com`

## Authentication

All API requests require authentication using JWT tokens:

```text
Authorization: Bearer <jwt_token>
```

## Health Data Endpoints

### GET /api/v1/health/gait

Retrieve gait analysis data for the authenticated user.

**Response:**

```json
{
  "gait_data": {
    "step_count": 1500,
    "cadence": 120,
    "stride_length": 0.75,
    "symmetry_score": 0.92,
    "timestamp": "2025-09-25T10:30:00Z"
  }
}
```

### POST /api/v1/health/sync

Synchronize local health data with the server.

**Request Body:**

```json
{
  "health_metrics": [
    {
      "type": "step_count",
      "value": 1500,
      "timestamp": "2025-09-25T10:30:00Z"
    }
  ]
}
```

## WebSocket Events

Real-time updates are delivered via WebSocket connection at `/ws/health`.

### Event Types

- `gait_update`: Real-time gait analysis results
- `health_alert`: Health threshold notifications
- `sync_status`: Data synchronization status updates
