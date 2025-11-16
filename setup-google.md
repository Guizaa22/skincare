# 🔵 Google OAuth - Quick Setup

## ✅ FIXED: "Unknown authentication strategy 'google'" Error

The error was caused by `passport.js` using old MongoDB models. **This is now fixed!**

---

## 🚀 Quick Start (2 Options)

### **Option 1: Without Google OAuth (Works Now)**

Your app is running! You can:
- ✅ Register with email/password
- ✅ Login with email/password
- ✅ Use all features

**Just open:** <http://localhost:3001>

---

### **Option 2: Add Google OAuth (5 minutes)**

To enable "Continue with Google" button:

#### **Step 1: Get Google Credentials**

1. Go to: <https://console.cloud.google.com/>
2. Create a new project: "SkinSense"
3. Go to: **APIs & Services → Credentials**
4. Click: **CREATE CREDENTIALS → OAuth client ID**
5. Set up OAuth consent screen (if prompted):
   - External
   - App name: SkinSense
   - Add your email
6. Create OAuth Client:
   - Type: **Web application**
   - Authorized redirect URIs:
     ```
     http://localhost:3001/api/auth/google/callback
     ```
7. **Copy** Client ID and Client Secret

#### **Step 2: Update .env File**

Open your `.env` file and add:

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

#### **Step 3: Restart App**

```powershell
# The app will auto-restart or manually restart:
npm run dev
```

#### **Step 4: Test**

1. Go to: <http://localhost:3001/login>
2. Click **"Continue with Google"** button
3. Sign in with Google
4. Done! ✅

---

## 📊 What Changed

### **Fixed Files:**
- ✅ `config/passport.js` - Now uses PostgreSQL User model
- ✅ Updated `deserializeUser` to use Sequelize

### **Before (Broken):**
```javascript
const User = require('../models/User'); // MongoDB ❌
const user = await User.findById(id);   // Mongoose ❌
```

### **After (Fixed):**
```javascript
const { User } = require('../models-postgres'); // PostgreSQL ✅
const user = await User.findByPk(id);           // Sequelize ✅
```

---

## 🎯 Test Without Google (Works Now!)

Even without Google OAuth credentials, your app works perfectly:

<http://localhost:3001>

**You can:**
- ✅ View homepage
- ✅ Browse services
- ✅ Register with email/password
- ✅ Login
- ✅ Book appointments
- ✅ Use waiting list

**Google button will show:** "Google OAuth not configured" (harmless warning)

---

## 🔐 With Google OAuth (Optional)

After adding credentials, users get:

### **Login Page:**
```
┌────────────────────────────┐
│     Login to SkinSense     │
├────────────────────────────┤
│ Email:    [_____________]  │
│ Password: [_____________]  │
│           [   Login   ]    │
├────────────────────────────┤
│        -- OR --            │
│                            │
│ [🔵 Continue with Google]  │
└────────────────────────────┘
```

### **Benefits:**
- ✅ One-click registration
- ✅ One-click login
- ✅ No password needed
- ✅ Email auto-verified
- ✅ Profile auto-populated

---

## ✅ Current Status

**Your Application:**
- ✅ Running on: <http://localhost:3001>
- ✅ Google OAuth error: **FIXED**
- ✅ Registration: **Working** (email/password)
- ✅ Login: **Working** (email/password)
- ✅ Database: **PostgreSQL connected**
- ⚠️ Google OAuth: **Not configured** (optional)

---

## 📝 To Enable Google OAuth

**Read the complete guide:**
```
SETUP_GOOGLE_OAUTH.md
```

**Or quick steps:**
1. Get credentials from Google Cloud Console
2. Add to `.env` file
3. Restart app
4. Test login

---

## 🆘 If You See Warnings

### **Console shows:**
```
⚠️  Google OAuth not configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
   The "Continue with Google" button will not work until credentials are added.
```

**This is normal!** It means:
- ✅ App is working
- ✅ Regular login works
- ⚠️ Google button is disabled (until you add credentials)

**To fix:** Add Google credentials to `.env` (see above)

---

## 🎉 Summary

**✅ Fixed:** Google OAuth strategy error  
**✅ Working:** Your entire application  
**⚠️ Optional:** Add Google OAuth credentials  

**Open now:** <http://localhost:3001>

**Try:**
- Register a new user
- Login
- Browse services
- Book an appointment

---

**Everything is working! Google OAuth is optional but recommended for better UX.** 🚀

