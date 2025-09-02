# VitalSense Auth0 Setup Guide

This guide will help you complete the Auth0 integration for VitalSense Health App.

## 🎯 **What You Need to Do**

### Step 1: Create Auth0 Account & Tenant

1. **Go to [Auth0.com](https://auth0.com)** and sign up for a free account
2. **Create a new tenant** (if prompted) - name it something like `vitalsense-health`
3. **Note your Auth0 domain** - it will be something like `vitalsense-health.auth0.com`

### Step 2: Create Auth0 Application

1. **Go to Applications** in your Auth0 Dashboard
2. **Click "Create Application"**
3. **Name**: `VitalSense Health App`
4. **Type**: Select **"Single Page Application"**
5. **Click "Create"**

### Step 3: Configure Application Settings

In your new application settings:

#### **Application URIs**

- **Allowed Callback URLs**: `https://health.andernet.dev/callback`
- **Allowed Logout URLs**: `https://health.andernet.dev/login`
- **Allowed Web Origins**: `https://health.andernet.dev`
- **Allowed Origins (CORS)**: `https://health.andernet.dev`

#### **Advanced Settings** → **Grant Types**

Make sure these are enabled:

- ✅ Authorization Code
- ✅ Refresh Token
- ✅ Implicit (for fallback)

#### **Save Changes**

### Step 4: Get Your Auth0 Credentials

From your application's **Settings** tab, copy these values:

- **Domain**: `your-tenant.auth0.com`
- **Client ID**: `your-client-id` (long alphanumeric string)

### Step 5: Update Environment Variables

You have two options:

#### **Option A: Update wrangler.toml (Less Secure)**

Edit `wrangler.toml` and replace these values:

```toml
AUTH0_DOMAIN = "your-actual-tenant.auth0.com"
AUTH0_CLIENT_ID = "your-actual-client-id"
```

#### **Option B: Use Wrangler Secrets (More Secure - Recommended)**

Run these commands to set secrets:

```bash
wrangler secret put AUTH0_DOMAIN --env production
# Enter: your-tenant.auth0.com

wrangler secret put AUTH0_CLIENT_ID --env production
# Enter: your-client-id
```

### Step 6: Configure Auth0 Universal Login (Optional)

To use the VitalSense custom login page:

1. **Go to Branding** → **Universal Login** in Auth0 Dashboard
2. **Turn off "Classic Universal Login"** (use New Universal Login)
3. **Customize the login page** with VitalSense branding (our custom page will handle this)

### Step 7: Test the Integration

1. **Deploy the updated configuration**:

   ```bash
   npm run build:worker
   wrangler deploy --env production
   ```

2. **Test the login flow**:
   - Go to `https://health.andernet.dev`
   - Click "Sign In" or try to access protected features
   - You should see the VitalSense branded login page

## 🔧 **What We've Already Set Up**

✅ **Custom Login Page**: Deployed at `https://health.andernet.dev/auth/login`  
✅ **Dynamic Configuration**: Worker injects Auth0 config into login page  
✅ **VitalSense Branding**: Custom styled login page with VitalSense colors  
✅ **Environment Setup**: Auth0 variables ready in worker configuration

## 🚨 **Common Issues & Solutions**

### **"Invalid Callback URL" Error**

- Make sure `https://health.andernet.dev/callback` is in your Auth0 app's Allowed Callback URLs

### **CORS Errors**

- Add `https://health.andernet.dev` to Allowed Origins (CORS) in Auth0 app settings

### **"Client ID not found" Error**

- Double-check your `AUTH0_CLIENT_ID` is correctly set
- Make sure you're using the Client ID from the correct Auth0 application

### **Login Page Shows Placeholders**

- Verify Auth0 environment variables are set correctly
- Check browser developer tools for any JavaScript errors

## 📞 **Need Help?**

If you encounter any issues:

1. **Check the browser developer console** for error messages
2. **Verify Auth0 application settings** match the URLs above
3. **Test environment variables** by checking if they're properly injected into the login page
4. **Let me know what specific error you're seeing** and I can help debug it

## 🎉 **Once Working**

After Auth0 is configured, users will:

1. Visit `https://health.andernet.dev`
2. Click "Sign In" to access the beautiful VitalSense login page
3. Enter credentials and be redirected back to the app
4. Have access to all health monitoring features

Your VitalSense health app will then have:

- ✅ Secure HIPAA-compliant authentication
- ✅ Beautiful custom-branded login experience
- ✅ Production-ready Auth0 integration
- ✅ Seamless user experience

---

**Ready to proceed?** Start with Step 1 and let me know when you have your Auth0 credentials!
