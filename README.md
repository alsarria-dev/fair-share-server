# Fair Share - Server

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-880000?style=flat" alt="Mongoose" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/bcrypt-338?style=flat" alt="bcrypt" />
  <img src="https://img.shields.io/badge/CORS-4A90E2?style=flat" alt="CORS" />
  <img src="https://img.shields.io/badge/Morgan-000000?style=flat" alt="Morgan" />
  <img src="https://img.shields.io/badge/dotenv-ECD53F?style=flat" alt="dotenv" />
  <img src="https://img.shields.io/badge/Nodemon-76D04B?style=flat&logo=nodemon&logoColor=white" alt="Nodemon" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white" alt="Vercel" />
</p>

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
- [Error Handling](#error-handling)
- [Running the Server](#running-the-server)
- [Development](#development)
- [Authors](#authors)

## Introduction

Fair Share is an expense management application built during the Ironhacks web development bootcamp. This server-side application provides a structured and scalable backend to handle expenses of any kind through groups, users, and expense management.

The backend is built on the Node.js and Express.js framework and connects to a MongoDB database. It implements JWT-based authentication, password encryption with bcrypt, author-based authorization on destructive actions, and centralized error handling that returns standard HTTP status codes.

## Features

- **User Management**: Create user accounts, authenticate users, and manage user profiles
- **Password Security**: Bcrypt-based password hashing (10 salt rounds); password hashes are excluded from every API response by default and only re-selected internally to verify a login
- **JWT Authentication**: Secure token-based authentication for protected routes
- **Group Management**: Create and manage expense groups with multiple users; only a group's author can delete it
- **Expense Tracking**: Create, update, and delete expenses within groups; only an expense's author can delete it
- **Data Relationships**: Well-structured MongoDB collections with proper references and relationships
- **Centralized Error Handling**: Every route returns standard HTTP status codes (400/401/403/404/500) instead of always responding 200
- **CORS Support**: Cross-origin resource sharing enabled for frontend communication, configurable via an environment variable
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
├── .env.example             # Template for required environment variables
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

- Node.js (v18 or higher)
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

3. **Create your local environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Update `.env.local`** with your configuration:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5005
   # CORS_ORIGIN=http://localhost:3000   # optional, only needed for local frontend testing
   ```
   `.env.local` takes precedence over `.env` if both exist — both are gitignored.

## Configuration

The server configuration is handled in the `config/index.js` file, which sets up:

- **CORS**: Accepts requests from the frontend origin in `CORS_ORIGIN`, falling back to the deployed frontend URL if that variable isn't set
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

Password hashes are never included in these responses. If `password` is present in a `PUT` body, it's re-hashed before being stored.

### Group Routes (`/groups`) - *Requires Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups/:userId` | Get all groups for a user |
| GET | `/groups/details/:groupId` | Get specific group details |
| POST | `/groups/` | Create a new group |
| PUT | `/groups/:groupId` | Update group information |
| PUT | `/groups/:groupId/:expenseId` | Add an expense to a group's expense list |
| DELETE | `/groups/:groupId` | Delete a group |

Only the group's `groupAuthor` can delete it — anyone else gets `403`.

**Request Body - Create Group:**
```json
{
  "name": "Weekend Trip",
  "description": "Expenses for the beach trip",
  "groupAuthor": "userId",
  "groupUsers": ["userId1", "userId2"]
}
```

### Expense Routes (`/expenses`) - *Requires Authentication*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses/details/:expenseId` | Get specific expense details |
| POST | `/expenses/` | Create a new expense |
| PUT | `/expenses/:expenseId` | Update an expense |
| DELETE | `/expenses/:groupId/:userId/:expenseId` | Delete an expense and remove it from its group |

Only the expense's `expenseAuthor` can delete it — anyone else gets `403`.

**Request Body - Create Expense:**
```json
{
  "name": "Dinner",
  "description": "Group dinner",
  "concept": "Food",
  "amount": 50.00,
  "group": "groupId",
  "expenseAuthor": "userId",
  "expenseUsers": ["userId1", "userId2"]
}
```

`concept` must be one of: `Housing`, `Food`, `Transportation`, `Utilities`, `Insurance`, `Healthcare`, `Entertainment`, `Education`, `Personal Care`, `Savings`.

## Database Models

### User Model

```javascript
{
  name: String (required),
  lastName: String (required),
  dateOfBirth: Date (required),
  phoneNumber: String (required),
  email: String (unique, required),
  password: String (required, hidden from query results by default — select: false),
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
  groupAuthor: ObjectId (references User, required),
  groupUsers: [ObjectId] (references User, indexed),
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
  description: String (required),
  concept: String (required, one of a fixed set of categories),
  amount: Number (min 0),
  group: ObjectId (references Group),
  expenseAuthor: ObjectId (references User),
  expenseUsers: [ObjectId] (references User),
  expensePic: String (default expense picture),
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

Passwords are never exposed once stored: the `User` schema marks `password` as `select: false`, so it's excluded from every query — including populated `groupUsers`/`expenseUsers`/`expenseAuthor`/`groupAuthor` — everywhere except the login handler, which explicitly re-selects it to verify credentials.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

## Error Handling

All routes funnel unexpected errors through a centralized handler instead of returning a raw error object with a `200` status:

| Status | Meaning |
|--------|---------|
| `400` | Invalid input, empty required fields, or a malformed/invalid MongoDB id |
| `401` | Missing or incorrect login credentials |
| `403` | Authenticated, but not authorized for this action (e.g. deleting someone else's group/expense) |
| `404` | The requested resource doesn't exist |
| `500` | Unexpected server-side failure — check the server console |

Every error response has the shape `{ "message": "..." }`.

## Running the Server

### Development Mode

Start the server with automatic reload on file changes:
```bash
npm run dev
```

The server will start on the port specified in your `.env.local`/`.env` file (default: 5005)

### Production Mode

Start the server:
```bash
npm start
```

## Development

### Scripts Available

- `npm run dev` - Run server with Nodemon (watches for changes)
- `npm start` - Start server in production mode

There is currently no automated test suite or lint configuration in this repo — verify changes manually.

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
