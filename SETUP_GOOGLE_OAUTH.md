# 🔐 Google OAuth Setup - Complete Guide

## 🎯 What This Does

Adds **"Continue with Google"** button to your login/register pages, allowing users to sign in with their Google account!

---

## ✅ Step 1: Get Google OAuth Credentials (10 minutes)

### **A. Go to Google Cloud Console**

1. Open: https://console.cloud.google.com/
2. Sign in with your Google account

### **B. Create a New Project**

1. Click the project dropdown (top left)
2. Click **"NEW PROJECT"**
3. Enter project name: `SkinSense`
4. Click **"CREATE"**
5. Wait for project to be created
6. Select your new project from dropdown

### **C. Configure OAuth Consent Screen**

1. In left sidebar, go to: **APIs & Services → OAuth consent screen**
2. Choose **"External"** (unless you have Google Workspace)
3. Click **"CREATE"**

4. **Fill in App Information:**
   - **App name:** `SkinSense`
   - **User support email:** Your email address
   - **App logo:** (Optional - upload your logo)
   - **Application home page:** `http://localhost:3001`
   - **Developer contact information:** Your email address

5. Click **"SAVE AND CONTINUE"**

6. **Scopes** (Step 2):
   - Click **"ADD OR REMOVE SCOPES"**
   - Select these scopes:
     - ✅ `.../auth/userinfo.email`
     - ✅ `.../auth/userinfo.profile`
     - ✅ `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

7. **Test Users** (Step 3):
   - Click **"ADD USERS"**
   - Add your email address (for testing)
   - Add any other test user emails
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

8. **Summary** (Step 4):
   - Review everything
   - Click **"BACK TO DASHBOARD"**

### **D. Create OAuth 2.0 Credentials**

1. In left sidebar, go to: **APIs & Services → Credentials**
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**

3. **Configure OAuth Client:**
   - **Application type:** `Web application`
   - **Name:** `SkinSense Web Client`
   
4. **Authorized JavaScript origins:**
   - Click **"ADD URI"**
   - Add: `http://localhost:3001`
   - (In production, add your domain: `https://yourdomain.com`)

5. **Authorized redirect URIs:**
   - Click **"ADD URI"**
   - Add: `http://localhost:3001/api/auth/google/callback`
   - (In production, add: `https://yourdomain.com/api/auth/google/callback`)

6. Click **"CREATE"**

7. **Copy Your Credentials:**
   - You'll see a popup with:
     - **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abc123xyz`)
   - **IMPORTANT:** Copy both! You'll need them in the next step.

---

## ✅ Step 2: Add Credentials to Your .env File

Open your `.env` file and update these lines:

```env
# ==========================================
# GOOGLE OAUTH CONFIGURATION
# ==========================================
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### **Example:**
```env
GOOGLE_CLIENT_ID=123456789012-abc123def456ghi789jkl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

**Save the file!**

---

## ✅ Step 3: Restart Your Application

```powershell
# Stop the current app (Ctrl+C if running)
# Then restart:
npm run dev
```

**You should see:**
```
✅ Google OAuth configured
🚀 SkinSense server running on port 3001
```

---

## ✅ Step 4: Test Google Login

1. **Open browser:** http://localhost:3001/login

2. **You should see:**
   - Regular login form
   - **"Continue with Google"** button (blue)

3. **Click "Continue with Google"**

4. **Select your Google account**

5. **Grant permissions** (first time only):
   - View your email address
   - View your basic profile info

6. **Success!** You should be:
   - Logged in automatically
   - Redirected to dashboard
   - See your name from Google profile

---

## 🎨 What Users Will See

### **Login Page:**
```
┌─────────────────────────────────────┐
│         Login to SkinSense          │
├─────────────────────────────────────┤
│ Email:    [___________________]     │
│ Password: [___________________]     │
│           [    Login    ]           │
├─────────────────────────────────────┤
│         -- OR --                    │
│                                     │
│  [🔵 Continue with Google]          │
│                                     │
│  Don't have an account? Register    │
└─────────────────────────────────────┘
```

### **Register Page:**
```
┌─────────────────────────────────────┐
│      Register for SkinSense         │
├─────────────────────────────────────┤
│ First Name: [_______________]       │
│ Last Name:  [_______________]       │
│ Email:      [_______________]       │
│ Password:   [_______________]       │
│           [ Register  ]             │
├─────────────────────────────────────┤
│         -- OR --                    │
│                                     │
│  [🔵 Sign up with Google]           │
│                                     │
│  Have an account? Login             │
└─────────────────────────────────────┘
```

---

## 📊 How It Works

### **For New Users:**
1. User clicks "Continue with Google"
2. Google authentication popup opens
3. User logs in with Google
4. **New account automatically created** with:
   - ✅ Name from Google profile
   - ✅ Email from Google profile
   - ✅ Avatar from Google profile
   - ✅ Email automatically verified
   - ✅ No password needed
5. User redirected to dashboard

### **For Existing Users:**
1. If user registered normally first, they can link Google account
2. Both login methods work
3. Single account with multiple login options

---

## 🔧 Troubleshooting

### **Error: "Unknown authentication strategy 'google'"**

✅ **FIXED!** This was because passport.js was using old MongoDB models.

**Solution:** Already updated to use PostgreSQL models. Restart app.

---

### **Error: "redirect_uri_mismatch"**

**Cause:** The callback URL doesn't match what you configured in Google Cloud Console.

**Fix:**
1. Check your `.env` file:
   ```env
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   ```

2. Go to Google Cloud Console → Credentials
3. Edit your OAuth 2.0 Client ID
4. Make sure redirect URI matches exactly:
   ```
   http://localhost:3001/api/auth/google/callback
   ```

---

### **Error: "invalid_client"**

**Cause:** Wrong Client ID or Secret

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client
3. Copy the Client ID and Secret again
4. Update `.env` file (no extra spaces!)
5. Restart app

---

### **Error: "access_denied"**

**Cause:** Your app is in testing mode and user isn't added as test user.

**Fix:**
1. Go to: OAuth consent screen → Test users
2. Click "ADD USERS"
3. Add the email address you're trying to login with
4. Try again

---

### **Button doesn't appear**

**Check console for:** `⚠️  Google OAuth not configured`

**Fix:**
1. Make sure `.env` has credentials
2. Restart app
3. Check logs for: `✅ Google OAuth configured`

---

## 🚀 For Production Deployment

### **Update these settings:**

1. **In Google Cloud Console:**
   - Add your domain: `https://yourdomain.com`
   - Add redirect URI: `https://yourdomain.com/api/auth/google/callback`

2. **In your `.env` file:**
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Publish your app:**
   - Go to: OAuth consent screen
   - Click "PUBLISH APP"
   - Submit for verification (if needed)

---

## 📝 Quick Setup Commands

```powershell
# 1. Add credentials to .env file (manually edit)

# 2. Restart application
npm run dev

# 3. Test login
start http://localhost:3001/login
```

---

## ✅ Success Checklist

- [ ] Created Google Cloud project
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 credentials
- [ ] Copied Client ID and Secret
- [ ] Added to `.env` file
- [ ] Restarted application
- [ ] Saw "✅ Google OAuth configured" in logs
- [ ] "Continue with Google" button appears
- [ ] Successfully logged in with Google

---

## 🎉 You're Done!

Users can now:
- ✅ Register with Google (1 click!)
- ✅ Login with Google
- ✅ No password needed
- ✅ Email auto-verified
- ✅ Profile auto-populated

---

## 💡 Pro Tips

1. **Test with multiple accounts** to verify it works
2. **Add error handling** for better user experience
3. **Enable both login methods** (email/password + Google)
4. **Monitor usage** in Google Cloud Console Analytics
5. **Keep credentials secure** - never commit `.env` to git

---

**Need help? The "Continue with Google" button should now work perfectly!** 🎯

