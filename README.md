# Smart Campus Portal

A comprehensive campus management system built with React, Node.js, Express, and MongoDB. This portal provides role-based access for students, faculty, and administrators to manage courses, events, placements, notifications, and more.

## 🚀 Features

### For Students
- **Dashboard**: Overview of courses, upcoming events, and notifications
- **Course Management**: View enrolled courses and materials
- **Attendance Tracking**: Monitor attendance records
- **Event Registration**: Browse and register for campus events
- **Placement Portal**: Access job opportunities and placement updates
- **Notifications**: Receive important announcements

### For Faculty
- **Course Management**: Create and manage courses
- **Attendance Management**: Mark and track student attendance
- **Event Creation**: Organize campus events
- **Student Insights**: View student performance analytics
- **Notification System**: Send announcements to students

### For Administrators
- **User Management**: Manage student and faculty accounts
- **System Analytics**: Monitor platform usage and performance
- **Content Moderation**: Oversee all platform activities
- **Placement Management**: Coordinate with companies for placements

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd SmartCampusPortalmain2
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend
npm install
\`\`\`

Create a \`.env\` file in the backend directory:

\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017/college-portal

# JWT Secret (use a strong, random string in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
\`\`\`

Start the backend server:

\`\`\`bash
npm start
\`\`\`

The backend will be available at \`http://localhost:5000\`

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

\`\`\`bash
cd frontend
npm install
\`\`\`

Start the frontend development server:

\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at \`http://localhost:5173\`

### 4. Create Admin User

To create an initial admin user, run:

\`\`\`bash
cd backend
node scripts/createAdmin.js
\`\`\`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

\`\`\`bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down
\`\`\`

### Manual Docker Build

\`\`\`bash
# Build the application
docker build -t smart-campus-portal .

# Run the container
docker run -p 3000:3000 smart-campus-portal
\`\`\`

## 📁 Project Structure

\`\`\`
SmartCampusPortalmain2/
├── backend/
│   ├── middleware/          # Authentication and other middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API route handlers
│   ├── scripts/            # Utility scripts
│   ├── utils/              # Helper functions
│   └── server.js           # Express server setup
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   └── utils/          # Frontend utilities
│   └── package.json
├── docker-compose.yaml     # Docker orchestration
├── Dockerfile             # Container configuration
├── Jenkinsfile           # CI/CD pipeline
└── README.md             # Project documentation
\`\`\`

## 🔧 Environment Variables

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`MONGODB_URI\` | MongoDB connection string | \`mongodb://localhost:27017/college-portal\` |
| \`JWT_SECRET\` | Secret key for JWT tokens | Required |
| \`PORT\` | Backend server port | \`5000\` |
| \`NODE_ENV\` | Environment mode | \`development\` |
| \`CLIENT_URL\` | Frontend URL for CORS | \`http://localhost:5173\` |

## 🚀 Deployment

### Production Environment

1. **Set Environment Variables**: Update your production environment with appropriate values
2. **Database**: Use MongoDB Atlas or a production MongoDB instance
3. **Security**: Use strong JWT secrets and enable HTTPS
4. **Monitoring**: Set up logging and monitoring solutions

### CI/CD with Jenkins

The project includes a Jenkinsfile for automated deployment. Configure your Jenkins pipeline with:

1. **Source Code Management**: Connect to your Git repository
2. **Build Triggers**: Set up webhooks or polling
3. **Environment Variables**: Configure production secrets
4. **Deployment Stages**: Customize deployment targets

## 🧪 Testing

\`\`\`bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
\`\`\`

## 📝 API Documentation

### Authentication Endpoints
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/logout\` - User logout

### User Management
- \`GET /api/admin/users\` - Get all users (Admin only)
- \`PUT /api/admin/users/:id\` - Update user (Admin only)
- \`DELETE /api/admin/users/:id\` - Delete user (Admin only)

### Courses
- \`GET /api/courses\` - Get all courses
- \`POST /api/courses\` - Create course (Faculty/Admin)
- \`PUT /api/courses/:id\` - Update course
- \`DELETE /api/courses/:id\` - Delete course

### Events
- \`GET /api/events\` - Get all events
- \`POST /api/events\` - Create event
- \`PUT /api/events/:id\` - Update event
- \`DELETE /api/events/:id\` - Delete event

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) section
2. Create a new issue with detailed information
3. Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release with core functionality
- User authentication and authorization
- Course and event management
- Placement portal
- Notification system

---

**Made with ❤️ by the Smart Campus Portal Team**
