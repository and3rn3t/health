# Cloudflare API Token Setup for Wrangler Deployment

## Required Permissions

For Wrangler to deploy Workers, your Cloudflare API token needs the following permissions:

### ⚠️ Critical: User-Level Permission (Fixes `/memberships` Error)

**User -> Memberships -> Read** - This is REQUIRED to fix the `/memberships` endpoint error (code: 10000/10001). This is a **user-level** permission, not an account-level permission.

### Account Permissions
1. **Workers Scripts: Edit** - Required to deploy and update Workers
2. **Account: Read** - Required to access account information
3. **Workers KV Storage: Edit** - Required if using KV namespaces
4. **Workers Routes: Edit** - Required if deploying to custom routes
5. **Durable Objects: Edit** - Required if using Durable Objects
6. **R2: Object Read & Write** - Required if using R2 buckets

### Zone Permissions (if deploying to custom domains)
1. **Zone Settings: Edit** - Required to configure routes
2. **Zone: Read** - Required to read zone information

## How to Update Your Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Find your existing token (the one associated with `and3rn3t@icloud.com`)
3. Click **Edit** on the token
4. Under **Permissions**, ensure you have:
   - **User** → **Memberships** → **Read** ⚠️ **REQUIRED** - This fixes the `/memberships` endpoint error
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **Account** → **Read**
   - **Account** → **Workers KV Storage** → **Edit** (if using KV)
   - **Account** → **Workers Routes** → **Edit** (if using routes)
   - **Account** → **Durable Objects** → **Edit** (if using Durable Objects)
   - **Account** → **R2** → **Object Read & Write** (if using R2)
   - **Zone** → **Zone Settings** → **Edit** (if deploying to custom domains)
   - **Zone** → **Zone** → **Read** (if deploying to custom domains)
5. Under **Account Resources**, select your account: **Matthew Anderson** (362c458c58efc6b65b7005148383403d)
6. Under **Zone Resources** (if needed), select: **andernet.dev**
7. Click **Continue to summary** and **Update Token**

## Quick Fix Template

If you want to create a new token with all required permissions:

1. Go to [Create API Token](https://dash.cloudflare.com/profile/api-tokens/create)
2. Use the **Edit Cloudflare Workers** template as a starting point
3. Add these additional permissions:
   - **User** → **Memberships** → **Read** ⚠️ **REQUIRED FIRST**
   - **Account** → **Account** → **Read**
   - **Account** → **Workers KV Storage** → **Edit**
   - **Account** → **Workers Routes** → **Edit**
   - **Account** → **Durable Objects** → **Edit**
   - **Account** → **R2** → **Object Read & Write**
4. Set **Account Resources** to: **Include** → **Matthew Anderson**
5. Set **Zone Resources** to: **Include** → **andernet.dev**
6. Create the token and update the `CLOUDFLARE_API_TOKEN` secret in GitHub

## Verify Token Permissions

After updating, you can verify the token works by running:

```bash
npx wrangler whoami
```

This should show your account information without errors.
