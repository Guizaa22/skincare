# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your SkinSense application.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: SkinSense
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email` and `profile`
   - Add test users (if in testing mode)
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: SkinSense Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 2: Add Environment Variables

Add these variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

For production, update the callback URL:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

## Step 3: Test the Integration

1. Start your server: `npm start`
2. Navigate to `http://localhost:3000/login` or `http://localhost:3000/register`
3. Click the **"Continue with Google"** button
4. Sign in with your Google account
5. You should be redirected to your dashboard

## How It Works

- **New Users**: When a user signs in with Google for the first time, a new account is automatically created with their Google profile information (name, email, avatar)
- **Existing Users**: If a user already has an account with the same email, they can link their Google account or sign in directly
- **Email Verification**: Google accounts are automatically verified (no email verification needed)
- **Password**: Google OAuth users don't need a password

## Features

✅ Automatic account creation from Google profile  
✅ Email, name, and avatar automatically imported  
✅ Email automatically verified  
✅ Seamless login experience  
✅ Works for both registration and login  

## Troubleshooting

### "Error: redirect_uri_mismatch"
- Make sure the callback URL in your `.env` file matches exactly what you configured in Google Cloud Console
- Check that the URL includes the full path: `/api/auth/google/callback`

### "Error: invalid_client"
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces in your `.env` file

### "Error: access_denied"
- Check your OAuth consent screen configuration
- If in testing mode, make sure the user email is added as a test user

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- Use HTTPS in production
- Regularly rotate your OAuth credentials

