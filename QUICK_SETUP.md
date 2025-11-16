# ⚡ QUICK SETUP - 2 Minutes

## ✅ Step 1: Dependencies Installed!

All Node.js packages are ready ✅

---

## 🔐 Step 2: Run Setup (Copy & Paste This)

Open PowerShell in your project folder and run:

```powershell
node setup-postgresql.js
```

**When prompted, enter your PostgreSQL password** (the one you set during installation)

The script will automatically:
- ✅ Update `.env` file
- ✅ Create `skinsense` database
- ✅ Create all tables
- ✅ Test everything

**Takes 30 seconds!**

---

## 🚀 Step 3: Start Your App

After setup completes, run:

```powershell
npm run dev
```

Then open: http://localhost:3001

---

## 🎯 That's It!

Your skincare booking system is running! 🎉

---

## 📊 View Your Database

### **Option 1: pgAdmin 4 (Visual)**
1. Open pgAdmin 4 from Start Menu
2. Connect to PostgreSQL 16
3. Open: Databases → skinsense → Tables
4. Right-click any table → View Data

### **Option 2: Command Line**
```powershell
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql -U postgres -d skinsense

# Run SQL queries:
SELECT * FROM users;
SELECT * FROM bookings;
\q  # exit
```

### **Option 3: Node Script**
```powershell
node view-database.js
```

---

## 🆘 Forgot Your Password?

If you forgot your PostgreSQL password:

1. **Open pgAdmin 4**
2. Right-click "PostgreSQL 16"
3. Properties → Change Password
4. Set new password
5. Run setup again

---

## ✅ Complete Command Flow

```powershell
# 1. Setup (run once)
node setup-postgresql.js
# Enter your PostgreSQL password when asked

# 2. Start app (every time)
npm run dev

# 3. View data (anytime)
node view-database.js
```

---

**Ready? Run this now:**

```powershell
node setup-postgresql.js
```

