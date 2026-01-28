# Fair Share - Server

## 📋 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Running the Server](#running-the-server)
- [Development](#development)
- [Authors](#authors)

## Introduction

Fair Share is an expense management application built during the Ironhacks web development bootcamp. This server-side application provides a structured and scalable backend to handle expenses of any kind through groups, users, and expense management.

The backend is built on the Node.js and Express.js framework and connects to a MongoDB database. It implements JWT-based authentication, password encryption with bcrypt, and comprehensive error handling to ensure secure and reliable communication with the client.

## Features

- **User Management**: Create user accounts, authenticate users, and manage user profiles
- **Password Security**: Bcrypt-based password encryption with strong password requirements
- **JWT Authentication**: Secure token-based authentication for protected routes
- **Group Management**: Create and manage expense groups with multiple users
- **Expense Tracking**: Create, update, and delete expenses within groups
- **Data Relationships**: Well-structured MongoDB collections with proper references and relationships
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Cross-origin resource sharing enabled for frontend communication
- **Request Logging**: Morgan logger for tracking incoming requests

## Tech Stack

- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
- **[Express.js](https://expressjs.com/)** - Web application framework
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** - JWT authentication
- **[CORS](https://github.com/expressjs/cors)** - Cross-origin resource sharing
- **[Morgan](https://github.com/expressjs/morgan)** - HTTP request logger
- **[Dotenv](https://github.com/motdotla/dotenv)** - Environment variable management
- **[Nodemon](https://nodemon.io/)** - Development tool for auto-reloading

## Project Structure

```
fair-share-server/
├── app.js                   # Express application setup
├── server.js                # Server entry point
├── package.json             # Project dependencies
├── vercel.json              # Vercel deployment configuration
├── config/
│   └── index.js             # Middleware and CORS configuration
├── db/
│   └── index.js             # Database connection setup
├── models/
│   ├── User.model.js        # User schema and model
│   ├── Group.model.js       # Group schema and model
│   └── Expense.model.js     # Expense schema and model
├── routes/
│   ├── auth.routes.js       # Authentication endpoints
│   ├── user.routes.js       # User management endpoints
│   ├── group.routes.js      # Group management endpoints
│   └── expense.routes.js    # Expense management endpoints
├── middleware/
│   └── jwt.middleware.js    # JWT authentication middleware
├── errors/
│   └── index.js             # Error handling setup
├── utils/
│   └── generateDummyData.js # Dummy data generation utility
└── dummy_data/
    ├── dummy_users.json
    ├── dummy_groups.json
    └── dummy_expenses.json
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fair-share-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Update .env file** with your configuration:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5005
   ```

## Configuration

The server configuration is handled in the `config/index.js` file, which sets up:

- **CORS**: Configured to accept requests from the frontend deployment URL
- **Trust Proxy**: Enabled for hosting environments with proxy servers
- **Body Parser**: JSON request parsing middleware
- **Cookie Parser**: Cookie handling middleware
- **Morgan Logger**: Request logging in development environment

## API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Authenticate user and return JWT token |
| GET | `/auth/verify` | Verify user authentication status |

**Request Body - Signup:**
```json
{
  "name": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Request Body - Login:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### User Routes (`/user`) - *Requires Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/` | Get all users in the system |
| GET | `/user/:userId` | Get specific user details |
| PUT | `/user/:userId` | Update user information |

### Group Routes (`/groups`) - *Requires Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups/:userId` | Get all groups for a user |
| GET | `/groups/details/:groupId` | Get specific group details |
| POST | `/groups/` | Create a new group |
| PUT | `/groups/:groupId` | Update group information |
| DELETE | `/groups/:groupId` | Delete a group |

**Request Body - Create Group:**
```json
{
  "name": "Weekend Trip",
  "description": "Expenses for the beach trip",
  "groupUsers": ["userId1", "userId2"]
}
```

### Expense Routes (`/expenses`) - *Requires Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses/details/:expenseId` | Get specific expense details |
| POST | `/expenses/` | Create a new expense |
| PUT | `/expenses/:expenseId` | Update an expense |
| DELETE | `/expenses/:expenseId` | Delete an expense |

**Request Body - Create Expense:**
```json
{
  "name": "Dinner",
  "amount": 50.00,
  "description": "Group dinner",
  "groupId": "groupId",
  "expenseAuthor": "userId",
  "expenseUsers": ["userId1", "userId2"],
  "expenseDate": "2024-01-28"
}
```

## Database Models

### User Model

```javascript
{
  name: String (required),
  lastName: String (required),
  dateOfBirth: Date (required),
  phoneNumber: String (required),
  email: String (unique, required),
  password: String (required),
  profilePic: String (default profile picture),
  createdAt: Date,
  updatedAt: Date
}
```

### Group Model

```javascript
{
  name: String (required),
  description: String (required),
  groupAuthor: ObjectId (references User),
  groupUsers: [ObjectId] (references User),
  groupExpenses: [ObjectId] (references Expense),
  groupPic: String (default group picture),
  createdAt: Date,
  updatedAt: Date
}
```

### Expense Model

```javascript
{
  name: String (required),
  amount: Number (required),
  description: String,
  groupId: ObjectId (references Group),
  expenseAuthor: ObjectId (references User),
  expenseUsers: [ObjectId] (references User),
  expenseDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

The server uses JWT (JSON Web Tokens) for authentication:

1. **User Registration**: Users sign up with email and password
2. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
3. **Login**: Users receive a JWT token upon successful login
4. **Protected Routes**: Routes requiring authentication check for valid JWT tokens
5. **Token Verification**: The `isAuthenticated` middleware validates tokens on protected endpoints

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

## Running the Server

### Development Mode

Start the server with automatic reload on file changes:
```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 5005)

### Production Mode

Start the server:
```bash
npm start
```

## Development

### Scripts Available

- `npm run dev` - Run server with Nodemon (watches for changes)
- `npm start` - Start server in production mode

### Tips

- Use dummy data from `dummy_data/` folder for testing
- Check `generateDummyData.js` for populating the database with sample data
- Ensure MongoDB is running before starting the server
- Monitor Morgan logs in the terminal for incoming requests

## Authors

- **Lee Kiowa Roy Fiala**
  - [LinkedIn](https://www.linkedin.com/in/lee-kiowa-fiala/)
  - [GitHub](https://github.com/kiowafg/)

- **Alvaro Sarria Rico**
  - [LinkedIn](https://www.linkedin.com/in/alsarria-dev/)
  - [GitHub](https://github.com/alvsarria)

## Acknowledgements

- Marcel Bosch Espin
- Nisol Medina Perozo
- Tania Futakova
- Mikel Jimenez Calcedo
- Arnaldo Mera Rojas

---

**Deployed**: [Fair Share App](https://app-fair-share.vercel.app)  
**License**: MIT
