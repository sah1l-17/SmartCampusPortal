# 🎓 Smart Campus Portal

> A comprehensive campus management system built with modern web technologies, providing seamless role-based access for students, faculty, and administrators.

![Smart Campus Portal](https://img.shields.io/badge/Smart-Campus%20Portal-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

## 🌟 Overview

Smart Campus Portal is a full-stack web application designed to streamline campus operations and enhance the educational experience. It provides an intuitive interface for managing courses, events, placements, notifications, and user interactions across different user roles.

## ✨ Key Features

### 👨‍🎓 For Students
- **📊 Dashboard**: Comprehensive overview of courses, events, and notifications
- **📚 Course Management**: Access enrolled courses, materials, and assignments
- **📅 Attendance Tracking**: Real-time attendance monitoring
- **🎉 Event Registration**: Browse and register for campus events with instant feedback
- **💼 Placement Portal**: Access job opportunities and placement updates
- **🔔 Smart Notifications**: Receive and manage important announcements
- **📱 Responsive Design**: Seamless experience across all devices

### 👨‍🏫 For Faculty
- **📖 Course Management**: Create, manage, and distribute course content
- **✅ Attendance Management**: Mark and track student attendance efficiently
- **🎪 Event Creation**: Organize and manage campus events
- **📈 Student Analytics**: View comprehensive student performance insights
- **📢 Communication**: Send targeted announcements to students
- **📊 Performance Tracking**: Monitor student progress and engagement

### 👨‍💼 For Administrators
- **👥 User Management**: Comprehensive user account management
- **📊 System Analytics**: Real-time platform usage and performance monitoring
- **🛡️ Content Moderation**: Oversee all platform activities and content
- **🏢 Placement Coordination**: Manage company partnerships and job placements
- **⚙️ System Configuration**: Configure platform settings and permissions
- **📋 Event Approval**: Review and approve faculty-created events

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | Component-based UI library |
| **Vite** | 4.x | Lightning-fast build tool |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **React Router** | 6.x | Client-side routing |
| **Axios** | 1.x | HTTP client for API calls |
| **React Toastify** | 9.x | Toast notifications |
| **Lucide React** | Latest | Modern icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime |
| **Express.js** | 4.x | Web application framework |
| **MongoDB** | 6.x | NoSQL database |
| **Mongoose** | 7.x | MongoDB object modeling |
| **JWT** | 9.x | Authentication tokens |
| **Helmet** | 6.x | Security middleware |
| **CORS** | 2.x | Cross-origin resource sharing |
| **Bcrypt** | 5.x | Password hashing |

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Jenkins** - CI/CD pipeline
- **PM2** - Production process manager

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js** v16.0.0 or higher
- **npm** v8.0.0 or higher (or **yarn** v1.22.0+)
- **MongoDB** v6.0+ (local installation or MongoDB Atlas)
- **Git** v2.0+
- **Docker** v20.0+ (optional, for containerized deployment)

## 🚀 Quick Start Guide

### 1. 📥 Clone the Repository

```bash
git clone https://github.com/your-username/SmartCampusPortal.git
cd SmartCampusPortal
```

### 2. 🗄️ Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
# Follow official MongoDB installation guide for your OS
mongod --dbpath /path/to/your/db
```

#### Option B: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string

### 3. ⚙️ Backend Configuration

```bash
cd backend
npm install
```

Create a `.env` file:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smart-campus-portal
# For Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/smart-campus-portal

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Client Configuration
CLIENT_URL=http://localhost:5173

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

Start the backend server:

```bash
npm run dev  # Development mode with auto-restart
# or
npm start    # Production mode
```

Backend will be available at `http://localhost:5000`

### 4. 🎨 Frontend Configuration

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env` file (optional):

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Smart Campus Portal
```

Start the frontend development server:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 5. 👤 Initial Setup

Create an admin user:

```bash
cd backend
node scripts/createAdmin.js
```

Default admin credentials:
- **Email**: admin@smartcampus.edu
- **Password**: admin123 (change immediately)

## 🐳 Docker Deployment

### Quick Docker Setup

```bash
# Clone and navigate to project
git clone <repository-url>
cd SmartCampusPortal

# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Docker Services
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`
- **MongoDB**: `localhost:27017`

## 📁 Project Architecture

```
SmartCampusPortal/
├── 📁 backend/
│   ├── 📁 config/              # Database and app configuration
│   ├── 📁 controllers/         # Request handlers
│   ├── 📁 middleware/          # Authentication & validation
│   ├── 📁 models/              # MongoDB schemas
│   │   ├── User.js             # User model with roles
│   │   ├── Course.js           # Course management
│   │   ├── Event.js            # Event system
│   │   ├── Notification.js     # Notification system
│   │   └── Placement.js        # Placement management
│   ├── 📁 routes/              # API endpoints
│   │   ├── auth.js             # Authentication routes
│   │   ├── admin.js            # Admin-only routes
│   │   ├── student.js          # Student routes
│   │   ├── faculty.js          # Faculty routes
│   │   ├── courses.js          # Course management
│   │   ├── events.js           # Event management
│   │   └── notifications.js    # Notification system
│   ├── 📁 scripts/             # Database seeding & utilities
│   ├── 📁 utils/               # Helper functions
│   ├── server.js               # Express app entry point
│   └── package.json
├── 📁 frontend/
│   ├── 📁 public/              # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/      # Reusable UI components
│   │   │   ├── Header.jsx      # Navigation header
│   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── EventCard.jsx   # Event display component
│   │   ├── 📁 contexts/        # React context providers
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── 📁 pages/           # Page components
│   │   │   ├── Dashboard.jsx   # User dashboard
│   │   │   ├── Events.jsx      # Event management
│   │   │   ├── Courses.jsx     # Course management
│   │   │   ├── Notifications.jsx
│   │   │   └── Placements.jsx
│   │   ├── 📁 utils/           # Frontend utilities
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # React entry point
│   └── package.json
├── 📄 docker-compose.yml       # Multi-container setup
├── 📄 Dockerfile              # Container configuration
├── 📄 Jenkinsfile             # CI/CD pipeline
├── 📄 .gitignore              # Git ignore rules
└── 📄 README.md               # Project documentation
```

## 🔧 Environment Configuration

### Backend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smart-campus` | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-super-secure-secret-key` | ✅ |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | ❌ |
| `PORT` | Backend server port | `5000` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` | ✅ |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` | ❌ |
| `EMAIL_PORT` | SMTP server port | `587` | ❌ |
| `EMAIL_USER` | Email username | `your-email@gmail.com` | ❌ |
| `EMAIL_PASS` | Email password/app password | `your-app-password` | ❌ |

### Frontend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` | ❌ |
| `VITE_APP_NAME` | Application name | `Smart Campus Portal` | ❌ |

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Run Frontend Tests
```bash
cd frontend
npm test                # Run all tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage
```

## 📊 API Documentation

### Authentication Endpoints
```http
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
POST   /api/auth/logout         # User logout
POST   /api/auth/refresh        # Refresh JWT token
POST   /api/auth/forgot-password # Password reset request
POST   /api/auth/reset-password  # Password reset
```

### User Management (Admin Only)
```http
GET    /api/admin/users         # Get all users
GET    /api/admin/users/:id     # Get user by ID
PUT    /api/admin/users/:id     # Update user
DELETE /api/admin/users/:id     # Delete user
POST   /api/admin/users         # Create new user
```

### Course Management
```http
GET    /api/courses             # Get all courses
POST   /api/courses             # Create course (Faculty/Admin)
GET    /api/courses/:id         # Get course details
PUT    /api/courses/:id         # Update course
DELETE /api/courses/:id         # Delete course
POST   /api/courses/:id/enroll  # Enroll in course (Student)
```

### Event Management
```http
GET    /api/events              # Get all events
POST   /api/events              # Create event (Faculty/Admin)
GET    /api/events/:id          # Get event details
PUT    /api/events/:id          # Update event
DELETE /api/events/:id          # Delete event
POST   /api/events/:id/register # Register for event (Student)
```

### Notification System
```http
GET    /api/notifications       # Get user notifications
POST   /api/notifications       # Create notification
PUT    /api/notifications/:id/read # Mark as read
POST   /api/notifications/mark-all-read # Mark all as read
```

## 🚀 Deployment Guide

### Production Deployment

#### 1. Environment Setup
```bash
# Set production environment variables
export NODE_ENV=production
export MONGODB_URI="your-production-mongodb-uri"
export JWT_SECRET="your-production-jwt-secret"
```

#### 2. Build Application
```bash
# Build frontend
cd frontend
npm run build

# The build files will be in frontend/dist/
```

#### 3. Deploy with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

#### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### CI/CD with Jenkins

The project includes a `Jenkinsfile` for automated deployment:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'docker-compose up -d --build'
            }
        }
    }
}
```

## 📈 Performance Monitoring

### Health Check Endpoints
```http
GET /api/health           # Application health status
GET /api/health/db        # Database connection status
GET /api/metrics          # Application metrics
```

### Monitoring Setup
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Set up log rotation
pm2 logrotate -u
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/SmartCampusPortal.git
cd SmartCampusPortal
```

### 2. Create Feature Branch
```bash
git checkout -b feature/amazing-new-feature
```

### 3. Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow commit message conventions

### 4. Commit & Push
```bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/amazing-new-feature
```

### 5. Create Pull Request
- Provide clear description
- Include screenshots if UI changes
- Ensure all tests pass
- Request review from maintainers

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt
- **Role-based Access Control** (RBAC)
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Rate Limiting** to prevent abuse
- **Helmet.js** for security headers
- **MongoDB Injection Protection**

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check MongoDB status
mongod --version
mongo --eval "db.runCommand({connectionStatus : 1})"

# For Atlas, verify connection string and network access
```

#### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm start
```

#### Build Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. **Check Issues**: Search [existing issues](../../issues)
2. **Create Issue**: Provide detailed error information
3. **Join Discussions**: Participate in project discussions
4. **Contact Team**: Reach out to maintainers

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Smart Campus Portal Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🏆 Acknowledgments

- **React Team** for the amazing frontend library
- **Express.js** for the robust backend framework
- **MongoDB** for the flexible database solution
- **Tailwind CSS** for the utility-first CSS framework
- **All Contributors** who helped build this project

## 📞 Support & Contact

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Email**: support@smartcampusportal.com
- **Documentation**: [Wiki](../../wiki)

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ User authentication and authorization
- ✅ Course and event management
- ✅ Notification system
- ✅ Basic placement portal

### Phase 2 (Q1 2024)
- 🔄 Mobile application
- 🔄 Advanced analytics dashboard
- 🔄 Integration with external LMS
- 🔄 Real-time chat system

### Phase 3 (Q2 2024)
- 📋 AI-powered recommendations
- 📋 Advanced reporting system
- 📋 API for third-party integrations
- 📋 Multi-language support

---

<div align="center">


[⭐ Star this repo](../../stargazers) | [🐛 Report Bug](../../issues) | [💡 Request Feature](../../issues) | [🤝 Contribute](../../pulls)

</div>
