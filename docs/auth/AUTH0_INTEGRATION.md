# Auth0 Security Implementation Guide

## Overview

VitalSense has been enhanced with enterprise-grade Auth0 authentication to ensure complete security and HIPAA compliance for health data protection. This implementation provides:

- **HIPAA-compliant authentication** with audit logging
- **Role-based access control (RBAC)** for different user types
- **Multi-factor authentication (MFA)** enforcement
- **Session management** with automatic timeout
- **Zero-trust security architecture**
- **PII/PHI protection** in all logging and error handling

## Security Features

### 🔐 Authentication & Authorization

- **Auth0 Universal Login** with PKCE (Proof Key for Code Exchange)
- **Refresh token rotation** for maximum security
- **Custom claims** for roles and permissions
- **HIPAA consent enforcement**
- **MFA requirement** for healthcare providers and admins

### 🛡️ Data Protection

- **Automatic PII/PHI redaction** in logs
- **Encrypted token storage** with secure cache management
- **Session timeout protection**
- **Audit trails** for all health data access
- **Zero-knowledge architecture** - Auth0 never sees health data

### 👥 Role-Based Access Control

#### User Roles

- **Patient**: Basic health data access
- **Caregiver**: Extended monitoring permissions
- **Healthcare Provider**: Professional access with MFA requirement
- **Emergency Contact**: Limited emergency-related access
- **Admin**: Full system access with enhanced security

#### Permissions

- `read:health_data` - View health information
- `write:health_data` - Create/update health records
- `delete:health_data` - Remove health data
- `trigger:emergency` - Emergency alert capabilities
- `manage:emergency_contacts` - Emergency contact management
- `view:analytics` - Access to health analytics
- `export:data` - Data export capabilities
- `view:predictions` - ML prediction access
- `manage:users` - User management (admin only)
- `view:audit_logs` - Audit log access (admin only)

## Setup Instructions

### 1. Auth0 Configuration

#### Create Auth0 Application

1. Log in to your Auth0 Dashboard
2. Go to Applications → Create Application
3. Choose "Single Page Application" (SPA)
4. Configure the application:

```json
{
  "name": "VitalSense Health App",
  "description": "HIPAA-compliant health data management platform",
  "application_type": "spa",
  "allowed_callback_urls": [
    "http://127.0.0.1:8789/callback",
    "https://your-domain.com/callback"
  ],
  "allowed_logout_urls": [
    "http://127.0.0.1:8789/login",
    "https://your-domain.com/login"
  ],
  "allowed_web_origins": ["http://127.0.0.1:8789", "https://your-domain.com"],
  "allowed_origins": ["http://127.0.0.1:8789", "https://your-domain.com"]
}
```

#### Configure Advanced Settings

- **Grant Types**: Authorization Code, Refresh Token
- **PKCE**: Required
- **Refresh Token Rotation**: Enabled
- **Refresh Token Expiration**: 30 days
- **Absolute Expiration**: 90 days

### 2. API Configuration

#### Create Auth0 API

1. Go to APIs → Create API
2. Configure:
   - **Name**: VitalSense Health API
   - **Identifier**: `https://vitalsense-health-api`
   - **Signing Algorithm**: RS256

#### Add Permissions

Add all the permissions listed above in the "Permissions" section.

### 3. User Management

#### Custom Claims Setup

Create a Rule or Action to add custom claims:

```javascript
// Auth0 Rule/Action for custom claims
function addCustomClaims(user, context, callback) {
  const namespace = 'https://vitalsense.app/';

  // Default user setup
  const customClaims = {
    [`${namespace}roles`]: user.app_metadata?.roles || ['patient'],
    [`${namespace}permissions`]: user.app_metadata?.permissions || [
      'read:health_data',
    ],
    [`${namespace}hipaa_consent`]: user.app_metadata?.hipaa_consent || false,
    [`${namespace}mfa_enabled`]:
      user.multifactor && user.multifactor.length > 0,
    [`${namespace}emergency_contacts`]:
      user.app_metadata?.emergency_contacts || [],
  };

  // Add claims to tokens
  context.idToken = { ...context.idToken, ...customClaims };
  context.accessToken = { ...context.accessToken, ...customClaims };

  callback(null, user, context);
}
```

### 4. Environment Configuration

#### Development Setup

Create `.env.local`:

```bash
# Copy from .env.example and fill in your values
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://vitalsense-health-api
VITE_AUTH0_REDIRECT_URI=http://127.0.0.1:8789/callback
VITE_AUTH0_LOGOUT_URI=http://127.0.0.1:8789/login
VITE_ENVIRONMENT=development
```

#### Production Setup

Ensure environment variables are set:

- Use secure domains (HTTPS only)
- Configure proper CORS settings
- Enable security headers
- Set up monitoring and alerting

### 5. HIPAA Compliance Configuration

#### Required Auth0 Features

- **Log Streams**: Configure secure log forwarding
- **Security**: Enable attack protection
- **Compliance**: BAA (Business Associate Agreement) with Auth0
- **Data Residency**: Ensure data stays in required regions
- **Encryption**: Verify encryption at rest and in transit

#### User Consent Flow

1. User must accept HIPAA consent during registration
2. MFA setup required for privileged roles
3. Regular consent renewal (annually)
4. Audit trail for all consent changes

## Implementation Details

### Component Structure

```
src/
├── components/auth/
│   ├── LoginPage.tsx          # Secure login interface
│   ├── CallbackPage.tsx       # Auth0 callback handler
│   ├── ProtectedRoute.tsx     # Route protection
│   ├── UserProfile.tsx        # User settings & security
│   └── AuthenticatedApp.tsx   # Main app wrapper
├── contexts/
│   └── AuthProvider.tsx       # Auth context provider
├── hooks/
│   └── useAuth.ts            # Authentication hook
└── lib/
    ├── auth0Config.ts         # Auth0 configuration
    └── authTypes.ts          # Types and utilities
```

### Security Headers

Ensure your hosting platform includes these headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.auth0.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Testing & Validation

### Security Checklist

- [ ] Auth0 application configured correctly
- [ ] API permissions set up
- [ ] Custom claims working
- [ ] MFA enforcement enabled
- [ ] HIPAA consent flow working
- [ ] Audit logging operational
- [ ] Session timeout working
- [ ] Token refresh functioning
- [ ] Logout clearing all tokens
- [ ] Role-based access working

### Test Users

Create test users with different roles:

```javascript
// Patient user
{
  "email": "patient@test.com",
  "app_metadata": {
    "roles": ["patient"],
    "permissions": ["read:health_data", "write:health_data"],
    "hipaa_consent": true
  }
}

// Healthcare provider
{
  "email": "provider@test.com",
  "app_metadata": {
    "roles": ["healthcare_provider"],
    "permissions": ["read:health_data", "write:health_data", "view:analytics"],
    "hipaa_consent": true,
    "mfa_required": true
  }
}
```

## Monitoring & Compliance

### Auth0 Monitoring

- Set up log streams to your SIEM
- Monitor authentication patterns
- Alert on unusual activity
- Track MFA adoption

### Compliance Reporting

- User access reports
- Authentication audit trails
- Permission change logs
- Session activity monitoring

## Troubleshooting

### Common Issues

1. **Invalid configuration**: Check environment variables
2. **CORS errors**: Verify allowed origins in Auth0
3. **Token refresh failing**: Check refresh token settings
4. **MFA not enforcing**: Verify rules/actions
5. **Claims missing**: Check custom claims configuration

### Debug Mode

Enable debug logging in development:

```javascript
localStorage.setItem('auth0:debug', 'true');
```

This comprehensive Auth0 integration ensures that VitalSense meets the highest security standards while providing a seamless user experience for health data management.
