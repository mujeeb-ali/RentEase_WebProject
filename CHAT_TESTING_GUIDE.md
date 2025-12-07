# 💬 Chat Testing Guide - RentEase 2.0

## How Real-Time Chat Works

The chat system uses **Socket.io** for real-time bidirectional communication between users.

### Architecture:
1. **Backend** (Socket.io Server on port 5000)
   - Maintains a Map of connected users: `userId → socketId`
   - When user joins: stores their connection in the Map
   - When message sent: looks up receiver's socketId and emits to them
   - Saves all messages to MongoDB database

2. **Frontend** (Socket.io Client)
   - Connects to Socket.io server with user's authentication token
   - Joins a room with user's ID
   - Sends messages via `socket.emit('sendMessage', message)`
   - Receives messages via `socket.on('receiveMessage', message)`

---

## 🧪 Testing Chat Between Owner and Buyer

### Step 1: Open Two Browser Windows/Tabs

**Option A: Two Different Browsers**
- Tab 1: Chrome → http://localhost:3000
- Tab 2: Firefox → http://localhost:3000

**Option B: Chrome Incognito + Regular**
- Tab 1: Regular Chrome → http://localhost:3000
- Tab 2: Incognito Chrome → http://localhost:3000

### Step 2: Create Two Test Accounts

**Tab 1 - Register as Owner:**
1. Go to Signup page
2. Full Name: `John Owner`
3. Email: `owner@test.com`
4. Phone: `1234567890`
5. Password: `password123`
6. Role: Select **Owner**
7. Click Register

**Tab 2 - Register as Buyer:**
1. Go to Signup page
2. Full Name: `Jane Buyer`
3. Email: `buyer@test.com`
4. Phone: `0987654321`
5. Password: `password123`
6. Role: Select **Tenant/Buyer**
7. Click Register

### Step 3: Owner Creates a Property

**In Tab 1 (Owner):**
1. After login, you'll be on Owner Dashboard
2. Click **"Add Property"** button
3. Fill in property details:
   - Title: `Beautiful Villa`
   - Type: `Villa`
   - Category: `Sale`
   - Price: `500000`
   - Area: `2500`
   - Bedrooms: `4`
   - Bathrooms: `3`
   - Parking: `2`
   - Address: `123 Main St`
   - City: `Los Angeles`
   - State: `CA`
   - Zipcode: `90001`
   - Description: `Luxury villa with pool`
4. Click **"Add Property"**
5. You'll be redirected to dashboard with the property visible

### Step 4: Buyer Views Property and Contacts Owner

**In Tab 2 (Buyer):**
1. On Buyer Dashboard, you'll see the villa property
2. Click the **"👁️ View"** button OR **"💬 Contact Owner"** button
3. You'll be redirected to chat page with Owner's ID in URL

### Step 5: Start Real-Time Chat

**Tab 2 (Buyer):**
1. Type a message: `Hi, I'm interested in the villa`
2. Press Enter or click Send
3. Message appears on right side (blue bubble) ✅

**Tab 1 (Owner):**
1. Go to Chat page (click Chat in navigation)
2. You should see the buyer's conversation
3. Click on the conversation
4. **You'll immediately see the buyer's message** (received via Socket.io) ✅
5. Reply: `Hello! I'd be happy to schedule a tour`
6. Press Enter

**Tab 2 (Buyer):**
- **Owner's reply appears instantly** without refresh! 🎉

---

## 🔍 Debugging Chat Issues

### Open Browser Console (F12) to see logs:

**When chat loads:**
```
🔌 Initializing socket for user: 673a2b...
✅ Connected to chat server, Socket ID: abc123...
📥 Joined room for user: 673a2b...
```

**When sending message:**
```
📤 Sending message: {senderId: "673a2b...", receiverId: "673a2c...", text: "Hello"}
```

**When receiving message:**
```
📨 Received message: {senderId: "673a2c...", receiverId: "673a2b...", text: "Hi there"}
📬 Handling new message from: 673a2c... Current chat: 673a2c...
```

### Backend Logs (Terminal):
```
✅ User connected: xyz789
User 673a2b... joined room
Message sent from 673a2b... to 673a2c...
```

---

## 🎯 How to Navigate to Chat

### Method 1: From Dashboard Property Card
1. Owner/Buyer on dashboard
2. Click **"💬 Contact Owner"** button on any property
3. Opens chat with property owner directly

### Method 2: From Property Detail Page
1. Click **"View Details"** on any property
2. Click **"Message Owner"** button
3. Opens chat with owner

### Method 3: Direct Chat Page
1. Click **"Chat"** in navigation menu
2. See list of conversations
3. Click on any conversation to chat

---

## ❓ Common Issues

### Issue: "Messages don't appear on other tab"
**Solution:**
- Make sure both users are logged in with DIFFERENT accounts
- Check browser console for Socket.io connection logs
- Verify backend server is running (should show "Socket.io: Active")

### Issue: "Not connected to chat server"
**Solution:**
- Refresh the page
- Check if backend is running on port 5000
- Check browser console for connection errors

### Issue: "Can't see user to chat with"
**Solution:**
- The conversation list populates when messages exist
- Use the "Contact Owner" button from property cards
- OR use URL: `chat.html?userId=USER_ID&userName=Name`

---

## 💡 Technical Details

### Message Flow:
1. **User A** types message and clicks Send
2. **Frontend** → `socket.emit('sendMessage', {senderId, receiverId, text})`
3. **Backend** → Receives message, saves to MongoDB
4. **Backend** → Looks up User B's socketId from Map
5. **Backend** → `io.to(socketId).emit('receiveMessage', message)`
6. **User B** → `socket.on('receiveMessage')` fires instantly
7. **User B** → Message appears in chat window

### Data Stored in MongoDB:
- **Messages Collection**: All chat messages with senderId, receiverId, text, timestamp
- **Users Collection**: All user accounts with IDs used for messaging

### URL Parameters for Direct Chat:
```
chat.html?userId=673a2b4c5d6e7f8g&userName=John%20Owner
```
- `userId`: The ID of person to chat with
- `userName`: Display name for chat header

---

## ✅ Success Indicators

When chat is working properly:
1. ✅ Console shows socket connection established
2. ✅ Messages appear instantly on other tab
3. ✅ Messages saved to database (persist after refresh)
4. ✅ Conversations list shows recent chats
5. ✅ No errors in browser console or backend terminal

---

## 🚀 Quick Test Commands

**Check if Socket.io is running:**
- Open browser console on chat page
- Type: `socket.connected`
- Should return: `true`

**Check current user ID:**
- Console: `window.rentease.utils.getUser()`
- Shows: `{id: "...", name: "...", role: "..."}`

**Manual message test:**
```javascript
socket.emit('sendMessage', {
    senderId: 'USER_ID_1',
    receiverId: 'USER_ID_2', 
    text: 'Test message',
    timestamp: new Date().toISOString()
});
```

---

**Happy Testing! 🎉**
