# 🔧 Quick API Setup Guide

## 📱 Configure Google OAuth & Twilio SMS

Your website works perfectly without these, but they add extra features!

---

## 🔐 **Google OAuth (Optional)**

Allows users to login with their Google account.

### **Setup Steps:**

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/

2. **Create/Select Project:**
   - Click "Select a project" → "New Project"
   - Name: "SkinSense"
   - Click "Create"

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "SkinSense Web Client"

5. **Add Authorized Redirect URI:**
   ```
   http://localhost:3001/api/auth/google/callback
   ```

6. **Copy Credentials:**
   - Copy "Client ID"
   - Copy "Client Secret"

7. **Configure Your App:**
   ```powershell
   node configure-apis.js
   ```
   - Paste your Client ID
   - Paste your Client Secret

8. **Restart Server:**
   ```powershell
   taskkill /F /IM node.exe
   npm run dev
   ```

9. **Test:**
   - Go to: http://localhost:3001/login
   - Click "Continue with Google"
   - Should redirect to Google login!

---

## 📲 **Twilio SMS (Optional)**

Sends SMS notifications for appointments, reminders, etc.

### **Setup Steps:**

1. **Sign Up for Twilio:**
   https://www.twilio.com/try-twilio

2. **Get a Phone Number:**
   - After signup, get a free trial phone number
   - This will be your "From" number

3. **Get Credentials:**
   - Go to Console Dashboard
   - Copy "Account SID"
   - Copy "Auth Token"
   - Note your "Phone Number"

4. **Configure Your App:**
   ```powershell
   node configure-apis.js
   ```
   - Paste your Account SID
   - Paste your Auth Token
   - Enter your Phone Number (format: +1234567890)

5. **Restart Server:**
   ```powershell
   taskkill /F /IM node.exe
   npm run dev
   ```

6. **Test:**
   - Create a test appointment
   - SMS should be sent to user!

**Note:** Free trial has limitations:
- Can only send to verified numbers
- Limited number of SMS per month
- Add upgrade for unlimited

---

## 🚀 **Quick Configuration Script:**

Run this interactive setup:

```powershell
node configure-apis.js
```

It will guide you through:
1. Google OAuth setup
2. Twilio SMS setup
3. Auto-update your .env file

**You can skip any service by pressing Enter!**

---

## 📝 **Manual Configuration:**

If you prefer to edit `.env` manually:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Then restart server:
```powershell
taskkill /F /IM node.exe
npm run dev
```

---

## ✅ **Verify Configuration:**

### **Check Google OAuth:**
1. Visit: http://localhost:3001/login
2. Look for "Continue with Google" button
3. Click it - should redirect to Google
4. Login with Google account
5. Should redirect back to your dashboard!

### **Check Twilio SMS:**
1. Login as admin
2. Create a test booking
3. Check if SMS is sent
4. Or check server logs for "SMS sent successfully"

---

## ❌ **Troubleshooting:**

### **Google OAuth not working:**
- Check redirect URI is exact: `http://localhost:3001/api/auth/google/callback`
- Make sure Google+ API is enabled
- Check client ID and secret are correct
- Restart server after configuration

### **Twilio SMS not working:**
- Check phone number format: `+1234567890` (include +)
- For trial account, verify recipient number in Twilio dashboard
- Check Account SID and Auth Token are correct
- Check server logs for error messages

---

## 💡 **Tips:**

- **Development:** Use free tiers for testing
- **Production:** Upgrade for unlimited usage
- **Security:** Never commit .env file to Git
- **Testing:** Test with your own phone/email first

---

## 🔄 **After Configuration:**

Always restart your server:
```powershell
taskkill /F /IM node.exe
npm run dev
```

---

## 📊 **API Status:**

Check which APIs are configured:

- If Google OAuth is configured: "Continue with Google" button appears on login
- If Twilio is configured: SMS notifications sent for bookings
- Check server startup logs for confirmation:
  ```
  ✅ Google OAuth configured
  ✅ Twilio SMS service initialized
  ```

---

## 🎯 **Quick Commands:**

```powershell
# Configure APIs interactively
node configure-apis.js

# Stop server
taskkill /F /IM node.exe

# Start server
npm run dev

# Check server logs
# Look at the terminal where npm run dev is running
```

---

## 📞 **Need Help?**

- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **Twilio Docs:** https://www.twilio.com/docs/sms
- **Your logs:** Check terminal for error messages

---

**Remember:** Both APIs are **OPTIONAL**. Your website works great without them!

---

**Ready to configure? Run:**

```powershell
node configure-apis.js
```

**Or just start using your website as-is! 🎉**

