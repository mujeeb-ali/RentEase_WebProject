# 🏠 RentEase 2.0 - Smart Property Buy, Sell & Rent Web Application

A professional full-stack web application for property management, enabling users to buy, sell, and rent properties with real-time messaging capabilities.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Color Theme](#color-theme)
- [Socket.io Chat System](#socketio-chat-system)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Frontend Features
- ✅ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ✅ **Modern UI/UX** - Clean, professional design with smooth animations
- ✅ **Role-Based Access** - Separate interfaces for Property Owners and Tenants/Buyers
- ✅ **Property Search** - Filter by type, category, location, and price
- ✅ **Real-Time Chat** - Instant messaging between owners and buyers using Socket.io
- ✅ **Property Management** - Add, edit, delete, and view properties
- ✅ **User Authentication** - Secure login and registration system
- ✅ **Interactive Dashboard** - View stats, properties, and recent activity

### Backend Features
- ✅ **RESTful API** - Clean, organized API endpoints
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **MongoDB Database** - Scalable NoSQL database
- ✅ **Socket.io Integration** - Real-time bidirectional communication
- ✅ **Input Validation** - Express-validator for data validation
- ✅ **CORS Enabled** - Cross-origin resource sharing configured
- ✅ **Error Handling** - Comprehensive error handling middleware

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **JavaScript (ES6+)** - Modern JavaScript features
- **Socket.io Client** - Real-time chat functionality

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt.js** - Password hashing
- **Express-validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variable management

---

## 📁 Project Structure

```
RentEase-2.0/
│
├── frontend/
│   ├── index.html                 # Home page
│   ├── css/
│   │   ├── global.css             # Global styles & theme
│   │   ├── home.css               # Home page styles
│   │   ├── auth.css               # Authentication pages styles
│   │   ├── dashboard.css          # Dashboard styles
│   │   ├── property-form.css      # Property form styles
│   │   ├── property-detail.css    # Property detail styles
│   │   ├── chat.css               # Chat page styles
│   │   └── pages.css              # About & Contact styles
│   ├── js/
│   │   ├── main.js                # Global JavaScript
│   │   ├── auth.js                # Authentication logic
│   │   ├── dashboard.js           # Dashboard functionality
│   │   ├── property-form.js       # Property form handler
│   │   ├── property-detail.js     # Property detail logic
│   │   ├── chat.js                # Socket.io chat implementation
│   │   └── contact.js             # Contact form handler
│   ├── pages/
│   │   ├── login.html             # Login page
│   │   ├── signup.html            # Sign up page
│   │   ├── dashboard.html         # User dashboard
│   │   ├── add-property.html      # Add property form
│   │   ├── property-detail.html   # Property details
│   │   ├── chat.html              # Real-time chat
│   │   ├── about.html             # About us page
│   │   └── contact.html           # Contact page
│   └── assets/                    # Images and media files
│
├── backend/
│   ├── server.js                  # Main server file
│   ├── package.json               # Dependencies
│   ├── .env.example               # Environment variables template
│   ├── config/
│   │   └── database.js            # MongoDB connection
│   ├── models/
│   │   ├── User.js                # User model
│   │   ├── Property.js            # Property model
│   │   └── Message.js             # Message model
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── propertyController.js  # Property CRUD operations
│   │   └── messageController.js   # Message handling
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   ├── propertyRoutes.js      # Property endpoints
│   │   └── messageRoutes.js       # Message endpoints
│   └── middleware/
│       ├── auth.js                # Authentication middleware
│       └── validation.js          # Validation middleware
│
└── README.md                      # Project documentation
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd RentEase-2.0
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rentease
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

---

## 🎮 Running the Application

### Option 1: Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
The server will start on `http://localhost:5000`

#### Start Frontend
Open `frontend/index.html` in your browser, or use a local server:

**Using VS Code Live Server:**
1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Using Python:**
```bash
cd frontend
python -m http.server 3000
```

**Using Node.js http-server:**
```bash
cd frontend
npx http-server -p 3000
```

### Option 2: Production Mode
```bash
cd backend
npm start
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "owner"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Property Endpoints

#### Get All Properties
```http
GET /api/properties?type=house&category=rent&city=New York
```

#### Get Single Property
```http
GET /api/properties/:id
```

#### Create Property (Owner only)
```http
POST /api/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Modern Villa",
  "description": "Beautiful modern villa...",
  "type": "house",
  "category": "sale",
  "price": 450000,
  "area": 2500,
  "bedrooms": 4,
  "bathrooms": 3,
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipcode": "10001"
}
```

#### Update Property
```http
PUT /api/properties/:id
Authorization: Bearer <token>
```

#### Delete Property
```http
DELETE /api/properties/:id
Authorization: Bearer <token>
```

### Message Endpoints

#### Get Chat History
```http
GET /api/messages/:userId1/:userId2
Authorization: Bearer <token>
```

#### Save Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "senderId": "userId1",
  "receiverId": "userId2",
  "text": "Hello, I'm interested..."
}
```

#### Mark as Read
```http
PUT /api/messages/read/:userId
Authorization: Bearer <token>
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/rentease |
| `JWT_SECRET` | Secret key for JWT | (required) |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

---

## 🎨 Color Theme

The application uses a professional three-color palette:

```css
:root {
    /* Primary Colors */
    --primary-dark-blue: #020B16;    /* Main background */
    --secondary-deep-blue: #02203E;   /* Secondary background */
    --white: #FFFFFF;                 /* Text and UI elements */
}
```

---

## 💬 Socket.io Chat System

### Client-Side Events

#### Connect to Server
```javascript
const socket = io('http://localhost:5000', {
    auth: { token: userToken }
});
```

#### Join Room
```javascript
socket.emit('join', userId);
```

#### Send Message
```javascript
socket.emit('sendMessage', {
    senderId: currentUserId,
    receiverId: targetUserId,
    text: messageText,
    timestamp: new Date().toISOString()
});
```

#### Receive Message
```javascript
socket.on('receiveMessage', (message) => {
    // Handle incoming message
    console.log('New message:', message);
});
```

### Server-Side Implementation

The server handles:
- User connections and disconnections
- Message broadcasting
- Message persistence to MongoDB
- Online user tracking
- Typing indicators (optional)

---

## 📸 Screenshots

### Home Page
Clean, modern landing page with featured properties

### Dashboard
Role-based dashboard showing properties, stats, and activity

### Property Detail
Comprehensive property information with owner contact

### Real-Time Chat
Instant messaging between owners and buyers

### Add Property
Intuitive form for listing new properties

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Property CRUD operations
- [ ] Real-time chat functionality
- [ ] Responsive design on multiple devices
- [ ] Form validation
- [ ] Error handling

---

## 🔧 Troubleshooting

### Common Issues

**Issue: MongoDB connection failed**
```
Solution: Ensure MongoDB is running and MONGODB_URI is correct
```

**Issue: CORS errors**
```
Solution: Check CORS_ORIGIN in .env matches your frontend URL
```

**Issue: Socket.io not connecting**
```
Solution: Verify backend server is running and URL is correct
```

---

## 🤝 Contributing

This is a university/demonstration project. For educational purposes only.

---

## 📄 License

MIT License - Feel free to use this project for educational purposes.

---

## 👨‍💻 Author

**RentEase Development Team**
- Built as a full-stack demonstration project
- Technologies: HTML, CSS, JavaScript, Node.js, Express, MongoDB, Socket.io

---

## 📞 Support

For issues or questions:
- Email: info@rentease.com
- Create an issue in the repository

---

## 🎓 Educational Notes

This project demonstrates:
- ✅ Full-stack web development
- ✅ RESTful API design
- ✅ Real-time communication with Socket.io
- ✅ User authentication and authorization
- ✅ Database modeling and relationships
- ✅ Responsive web design
- ✅ Modern JavaScript (ES6+)
- ✅ Professional coding practices

---

**Built with ❤️ for learning and demonstration purposes**
