# Auth0 Production Setup Guide

## Prerequisites

Before deploying the custom login page, you need to set up Auth0 credentials:

### 1. Auth0 Account Configuration

1. **Go to Auth0 Dashboard** → [https://manage.auth0.com](https://manage.auth0.com)
2. **Create/Configure Application**:
   - Application Type: "Single Page Application"
   - Name: "VitalSense Health App"

### 2. Required Configuration

**Application Settings:**

- Allowed Callback URLs: `https://health.andernet.dev/callback`
- Allowed Logout URLs: `https://health.andernet.dev/login`
- Allowed Web Origins: `https://health.andernet.dev`
- Token Endpoint Authentication Method: `None` (for SPA)

**Management API Access:**
You need to authorize a Machine-to-Machine application for the Management API:

1. Go to **Applications** → **Machine to Machine Applications**
2. Create a new M2M application or use existing
3. Authorize for **Auth0 Management API**
4. Grant scopes:
   - `read:branding`
   - `update:branding`
   - `read:prompts`
   - `update:prompts`

### 3. Get Your Credentials

You'll need these values:

- **Domain**: `your-tenant.auth0.com`
- **Client ID**: From your SPA application
- **Client Secret**: From your M2M application (for Management API)

### 4. Set Environment Variables

Run these commands with your actual values:

```powershell
# Set Auth0 credentials as environment variables
$env:AUTH0_DOMAIN = "your-tenant.auth0.com"
$env:AUTH0_CLIENT_ID = "your-spa-client-id"
$env:AUTH0_CLIENT_SECRET = "your-m2m-client-secret"

# Or set them in your PowerShell profile for persistence
```

### 5. Deploy Custom Login Page

Once credentials are set, run:

```powershell
# Test mode first
.\scripts\deploy-auth0-custom-login.ps1 -Auth0Domain $env:AUTH0_DOMAIN -Auth0ClientId $env:AUTH0_CLIENT_ID -Auth0ClientSecret $env:AUTH0_CLIENT_SECRET -TestMode

# Then deploy for real
.\scripts\deploy-auth0-custom-login.ps1 -Auth0Domain $env:AUTH0_DOMAIN -Auth0ClientId $env:AUTH0_CLIENT_ID -Auth0ClientSecret $env:AUTH0_CLIENT_SECRET
```

## Next Steps

After the Auth0 custom login page is deployed, you can:

1. **Test the login page** using the URL provided by the deployment script
2. **Configure the main application** with Auth0 environment variables
3. **Deploy the main application** to Cloudflare Workers

Let me know when you have the Auth0 credentials ready!
