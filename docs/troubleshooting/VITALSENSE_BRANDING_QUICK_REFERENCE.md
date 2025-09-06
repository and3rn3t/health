# 🎨 VitalSense Branding Quick Reference

## 🚀 Quick Fix Commands

### Auth0 Login Page Issues

```powershell
# Test and validate login page
.\scripts\test-auth0-login-page.ps1

# Deploy in safe test mode first
.\scripts\quick-deploy-auth0.ps1 -TestMode

# Deploy to production
.\scripts\quick-deploy-auth0.ps1
```

### VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")

- `Auth0: Test Custom Login Page` - Validate HTML and styling
- `Auth0: Quick Deploy (Test Mode)` - Safe deployment test
- `Auth0: Deploy Custom Login Page` - Production deployment

## 🎯 Brand Standards

### Colors

- **Primary**: `#2563eb` (VitalSense Blue)
- **Secondary**: `#0891b2` (Teal)
- **Background**: `#f8fafc` (Light Gray)
- **Foreground**: `#0f172a` (Dark Gray)

### Typography

- **Font Family**: Inter (system-ui fallback)
- **Weights**: 400 (regular), 600 (semibold), 700 (bold)

### Logo & Branding

- **App Name**: VitalSense (never "Health App")
- **Icon**: Heart icon in brand colors
- **Tagline**: "Health Insights & Fall Risk Monitor"

## 📁 Key Files

### Auth0 Branding

- `auth0-custom-login/login.html` - Custom login page
- `auth0-custom-login/auth0-config.local.ps1` - Configuration
- `scripts/deploy-auth0-custom-login.ps1` - Deployment script

### Configuration

- `src/lib/auth0Config.ts` - Auth0 configuration with VitalSense branding
- `.vscode/tasks.json` - VS Code task definitions
- `src/main.css` - Global styles and brand colors

### Documentation

- `docs/auth/AUTH0_CUSTOM_BRANDING_GUIDE.md` - Complete setup guide
- `docs/troubleshooting/VITALSENSE_BRANDING_LESSONS_LEARNED.md` - Lessons learned
- `docs/troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md` - Problem database

## 🔧 Common Issues & Quick Fixes

### Issue: Generic "Health App" branding appears

**Fix**: Update component to use VitalSense branding

```typescript
// ❌ Wrong
<title>Health App</title>

// ✅ Correct
<title>VitalSense Health</title>
```

### Issue: Auth0 login page uses default styling

**Fix**: Deploy custom login page

```powershell
.\scripts\quick-deploy-auth0.ps1
```

### Issue: Inconsistent colors across components

**Fix**: Use CSS variables from brand system

```css
/* Use brand colors */
:root {
  --vs-primary: #2563eb;
  --vs-secondary: #0891b2;
}
```

### Issue: Missing Auth0 credentials

**Fix**: Configure local credentials

```powershell
# Copy and edit config
Copy-Item "auth0-custom-login\auth0-config.example.ps1" "auth0-custom-login\auth0-config.local.ps1"
```

## ✅ Verification Checklist

After any branding changes:

- [ ] Login page shows VitalSense branding
- [ ] Primary color is #2563eb throughout
- [ ] Inter font is used consistently
- [ ] No "Health App" references remain
- [ ] Mobile responsive design works
- [ ] Dark mode support functions
- [ ] HIPAA compliance badges visible
- [ ] Authentication flow works end-to-end

## 🆘 Emergency Fixes

### If Auth0 login is broken

1. Check Auth0 domain and client ID in configuration
2. Test login page with validation script
3. Deploy in test mode first
4. Check browser console for errors

### If branding is inconsistent

1. Review `docs/troubleshooting/VITALSENSE_BRANDING_LESSONS_LEARNED.md`
2. Use centralized configuration in `src/lib/auth0Config.ts`
3. Test across multiple components
4. Validate color variables are properly applied

---

_For complete details, see the full documentation in the `docs/` folder._
