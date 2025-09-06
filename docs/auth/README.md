# 🔐 VitalSense Authentication Documentation

Complete authentication setup and integration guides for VitalSense.

## 📚 Available Documentation

### Primary Guides

- **[Auth0 Custom Branding Guide](AUTH0_CUSTOM_BRANDING_GUIDE.md)** - Complete setup for custom branded Auth0 login
- **[Auth0 Integration Guide](AUTH0_INTEGRATION.md)** - Technical integration documentation

### Quick Actions

```powershell
# Test Auth0 custom login page
.\scripts\test-auth0-login-page.ps1

# Deploy Auth0 branding (test mode)
.\scripts\quick-deploy-auth0.ps1 -TestMode

# Deploy Auth0 branding (production)
.\scripts\quick-deploy-auth0.ps1
```

### VS Code Tasks

Available via `Ctrl+Shift+P` → "Tasks: Run Task":

- **Auth0: Test Custom Login Page** - Validate login page HTML and styling
- **Auth0: Quick Deploy (Test Mode)** - Safe deployment testing
- **Auth0: Deploy Custom Login Page** - Production deployment

## 🎯 Quick Start

1. **Prerequisites**: Auth0 account with SPA application configured
2. **Setup**: Configure credentials in `auth0-custom-login/auth0-config.local.ps1`
3. **Test**: Run validation script to verify setup
4. **Deploy**: Use test mode first, then deploy to production

## 🔧 Configuration Files

- **`auth0-custom-login/login.html`** - Custom branded login page
- **`auth0-custom-login/auth0-config.local.ps1`** - Local configuration
- **`src/lib/auth0Config.ts`** - Application Auth0 configuration

## 🛡️ Security Features

- HIPAA compliance messaging
- SOC 2 Type II certification display
- ISO 27001 compliance indicators
- Multi-factor authentication support
- Secure token handling with refresh rotation

## 🆘 Troubleshooting

For authentication issues, see:

- **[VitalSense Branding Quick Reference](../troubleshooting/VITALSENSE_BRANDING_QUICK_REFERENCE.md)** - Quick fixes for branding issues
- **[Problem Solutions Database](../troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md)** - Comprehensive troubleshooting

---

**Total Setup Time**: 15-30 minutes  
**Support Level**: Complete documentation and automation
5. Add **Allowed Web Origins**: `https://health.andernet.dev`

### 2. Set Up Management API Access

1. Go to **Applications** → **Machine to Machine Applications**
2. Authorize your application for the **Auth0 Management API**
3. Grant the following scopes:
   - `read:branding`
   - `update:branding`
   - `read:prompts`
   - `update:prompts`

### 3. Environment Variables

Set these environment variables:

```powershell
$env:VITE_AUTH0_DOMAIN = "your-tenant.auth0.com"
$env:VITE_AUTH0_CLIENT_ID = "your-client-id"
$env:AUTH0_CLIENT_SECRET = "your-client-secret"
```

### 4. Deploy Custom Login Page

Run the deployment script:

```powershell
# Test mode first (recommended)
.\scripts\deploy-auth0-custom-login.ps1 `
  -Auth0Domain "your-tenant.auth0.com" `
  -Auth0ClientId "your-client-id" `
  -Auth0ClientSecret "your-client-secret" `
  -TestMode

# Deploy for real
.\scripts\deploy-auth0-custom-login.ps1 `
  -Auth0Domain "your-tenant.auth0.com" `
  -Auth0ClientId "your-client-id" `
  -Auth0ClientSecret "your-client-secret"
```

## Customization Options

### Colors and Branding

The login page uses these VitalSense brand colors:

- **Primary**: `#2563eb` (Blue)
- **Accent**: `#0891b2` (Cyan)
- **Success**: `#059669` (Green)
- **Warning**: `#d97706` (Amber)
- **Error**: `#dc2626` (Red)

### Fonts

The page uses **Inter** font family for consistency with your main application.

### Logo

The heart icon SVG is embedded in the page. To customize:

1. Edit the `brand-logo` section in `login.html`
2. Replace the Lucide heart icon with your custom logo
3. Update the base64 logo in the Auth0 Lock configuration

### Security Features Display

The login page prominently displays:

- HIPAA compliance
- End-to-end encryption
- Multi-factor authentication
- Role-based access control
- SOC 2 Type II compliance
- ISO 27001 certification

## Testing

### Local Testing

1. Open the HTML file in a browser
2. The Auth0 Lock widget will initialize (requires valid Auth0 config)
3. Test the responsive design and styling

### Production Testing

After deployment, test at:

```
https://your-tenant.auth0.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://health.andernet.dev/callback&scope=openid%20profile%20email
```

## Troubleshooting

### Common Issues

1. **Lock Widget Not Loading**
   - Check Auth0 domain and client ID
   - Verify CORS settings in Auth0 dashboard
   - Check browser console for errors

2. **Styling Issues**
   - Auth0 Lock CSS may override custom styles
   - Use `!important` for critical styles
   - Test in multiple browsers

3. **Authentication Errors**
   - Verify callback URLs in Auth0 dashboard
   - Check allowed origins
   - Ensure client secret is correct for Management API

### Debug Mode

Enable debug mode by adding to the Lock configuration:

```javascript
var config = {
  // ... other config
  auth: {
    // ... other auth config
    params: {
      // ... other params
      debug: true,
    },
  },
};
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS for production
2. **Secrets Management**: Store Auth0 secrets securely
3. **CORS Configuration**: Restrict origins to your domain
4. **Content Security Policy**: Configure CSP headers if needed

## Maintenance

### Regular Updates

1. **Auth0 Lock Version**: Keep Auth0 Lock library updated
2. **Security Patches**: Monitor Auth0 security bulletins
3. **Brand Updates**: Sync any brand changes with the login page

### Monitoring

1. **Login Analytics**: Monitor login success/failure rates in Auth0 dashboard
2. **Performance**: Track page load times
3. **User Feedback**: Collect feedback on login experience

## Advanced Customization

### Custom CSS Rules

Add custom CSS for specific Auth0 Lock elements:

```css
/* Example: Custom input styling */
.auth0-lock.auth0-lock .auth0-lock-input {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

/* Example: Custom button hover effects */
.auth0-lock.auth0-lock .auth0-lock-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.15);
}
```

### Custom JavaScript

Add custom behavior:

```javascript
// Example: Custom analytics tracking
lock.on('authenticated', function (authResult) {
  // Track successful login
  gtag('event', 'login', {
    method: 'auth0',
    app: 'vitalsense',
  });
});

// Example: Custom error handling
lock.on('authorization_error', function (error) {
  // Track login errors
  console.error('Login failed:', error);
});
```

### A/B Testing

To test different login page versions:

1. Create multiple HTML templates
2. Use Auth0 Rules to serve different templates based on criteria
3. Monitor conversion rates and user feedback

## Support

For issues with the custom login page:

1. Check Auth0 Dashboard logs
2. Review browser console errors
3. Test with Auth0 default login page to isolate issues
4. Contact Auth0 support for platform-specific issues

## File Structure

```
auth0-custom-login/
├── login.html              # Main custom login page
├── README.md               # This setup guide
└── assets/                 # Additional assets (optional)
    ├── logo.svg            # Custom logo files
    └── styles.css          # Additional stylesheets
```

---

**Next Steps**: After setting up the custom login page, configure your production Auth0 tenant and test the complete authentication flow with your VitalSense application.
