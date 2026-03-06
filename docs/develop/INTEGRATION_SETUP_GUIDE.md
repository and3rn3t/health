# GitHub Workflows Integration Setup Guide

## 🔧 **Required Secrets Configuration**

### Step 1: Configure Repository Secrets

Go to your repository → Settings → Secrets and variables → Actions, then add these secrets:

#### **Essential Secrets (Required)**

```text
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
```

#### **Optional Secrets (Enhanced Features)**

```text
SONAR_TOKEN=your_sonarcloud_token_here
SEMGREP_APP_TOKEN=your_semgrep_token_here
```

## 📋 **Setup Instructions**

### **1. Cloudflare Setup (Required)**

1. **Get API Token:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → My Profile → API Tokens
   - Click "Create Token" → Use "Cloudflare Workers:Edit" template
   - Include permissions: `Zone:Zone:Read, Zone:Zone Settings:Read, User:User Details:Read`
   - Copy the token → Add as `CLOUDFLARE_API_TOKEN` secret

2. **Get Account ID:**
   - Go to Cloudflare Dashboard → Right sidebar shows "Account ID"
   - Copy the Account ID → Add as `CLOUDFLARE_ACCOUNT_ID` secret

### **2. SonarCloud Setup (Optional - Code Quality)**

1. **Create SonarCloud Account:**
   - Go to [SonarCloud.io](https://sonarcloud.io)
   - Sign up/login with your GitHub account
   - Import your `and3rn3t/health` repository

2. **Get Token:**
   - Go to SonarCloud → My Account → Security → Generate Tokens
   - Name: "GitHub Actions"
   - Copy token → Add as `SONAR_TOKEN` secret

3. **Create sonar-project.properties:**
