# 🔧 Login Issue Fix Guide

## Problem Identified
MongoDB Atlas connection is failing due to IP whitelist restrictions. The login system cannot authenticate users without a database connection.

## Solution: Switch to Local MongoDB

### Step 1: Install MongoDB (if not already installed)

**Option A: MongoDB Community Server (Recommended)**
1. Download from: https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0.x or higher)
   - Platform: Windows x64
   - Package: MSI
3. Run the installer:
   - Choose "Complete" installation
   - ✅ Install MongoDB as a Windows Service
   - ✅ Install MongoDB Compass (GUI tool)
4. MongoDB will start automatically as a Windows service

**Option B: Quick Check**
```powershell
# Check if MongoDB is already installed
mongod --version
```

### Step 2: Setup Database with Test Users

**Automated Setup (Easy):**
```powershell
cd "d:\Web Project\RentEase-2.0\backend"
.\setup-database.bat
```

This script will:
- ✅ Check MongoDB installation
- ✅ Start MongoDB service
- ✅ Create test users in database

**Manual Setup (if needed):**
```powershell
cd "d:\Web Project\RentEase-2.0\backend"
node seed-users.js
```

### Step 3: Restart Backend Server

1. Stop the current backend server (Ctrl+C in terminal)
2. Start it again:
```powershell
cd "d:\Web Project\RentEase-2.0\backend"
node server.js
```

You should see:
```
✅ MongoDB Connected Successfully
🚀 RentEase 2.0 Server Running
📡 Port: 5000
```

### Step 4: Test Login

**Option A: Quick Login Page (Fastest)**
1. Open: `http://localhost:8080/pages/quick-login.html`
2. Click "Login as Owner" or "Login as Buyer"
3. You'll be redirected to the dashboard

**Option B: Regular Login**
1. Open: `http://localhost:8080/pages/login.html`
2. Use credentials:
   - **Owner:** john.owner@test.com / test123
   - **Buyer:** jane.buyer@test.com / test123

## Test Credentials

### Owner Account
- **Email:** john.owner@test.com
- **Password:** test123
- **Capabilities:**
  - Add/edit/delete properties
  - Chat with buyers
  - View dashboard

### Buyer Account
- **Email:** jane.buyer@test.com
- **Password:** test123
- **Capabilities:**
  - View all properties
  - Contact owners
  - Chat with owners

## Troubleshooting

### MongoDB not starting?
```powershell
# Start MongoDB service manually (Run as Administrator)
net start MongoDB
```

### Check MongoDB status:
```powershell
# See if MongoDB process is running
Get-Process mongod -ErrorAction SilentlyContinue
```

### Test MongoDB connection directly:
```powershell
# Connect to MongoDB shell
mongosh

# Should show: "Connected to: mongodb://localhost:27017/"
# Exit with: exit
```

### Backend still showing connection error?
1. Make sure `.env` file has: `MONGODB_URI=mongodb://localhost:27017/rentease`
2. Restart the backend server
3. Check for error messages in terminal

### Login still failing?
1. Check browser console (F12) for JavaScript errors
2. Verify backend is running on port 5000
3. Check Network tab in browser DevTools to see API response
4. Run seed script again: `node seed-users.js`

## Files Modified

✅ `backend/.env` - Changed to local MongoDB
✅ `backend/seed-users.js` - Script to create test users
✅ `backend/setup-database.bat` - Automated setup script
✅ `frontend/pages/quick-login.html` - Updated styling and test accounts

## Next Steps After Fix

1. ✅ Login should work with test credentials
2. Test adding a property as Owner
3. Test viewing properties as Buyer
4. Test chat functionality between Owner and Buyer
5. Verify dashboard data loads correctly

## Alternative: Fix MongoDB Atlas Connection

If you prefer to use MongoDB Atlas instead:

1. Go to: https://cloud.mongodb.com
2. Select your cluster
3. Click "Network Access" in left menu
4. Click "Add IP Address"
5. Click "Allow Access from Anywhere" (0.0.0.0/0)
6. Confirm and wait ~2 minutes
7. Change `.env` back to Atlas connection string
8. Run seed script: `node seed-users.js`
9. Restart backend server

---

**Need Help?** Check the backend terminal for error messages or open browser console (F12) to see what's failing.
