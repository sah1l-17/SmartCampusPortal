FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (optimization)
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install root and frontend dependencies
RUN npm install
RUN cd frontend && npm install

# Now copy ALL files (including backend)
COPY . .

# Install backend dependencies if package.json exists
RUN if [ -d "backend" ] && [ -f "backend/package.json" ]; then \
      cd backend && npm install; \
    fi

# Expose ports (backend + frontend)
EXPOSE 3000 5173

# Run in development mode
CMD ["npm", "run", "dev"]