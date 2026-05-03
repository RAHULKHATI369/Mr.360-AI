# Multi-stage Dockerfile for Mr. 360 AI Engine

# 1. Build the React Frontend
FROM node:20-alpine AS build-step
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Setup FastAPI Backend
FROM python:3.11-slim
WORKDIR /app/backend

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend assets
COPY --from=build-step /app/frontend/dist /app/frontend/dist

# Expose port for Cloud Run
EXPOSE 8080

# Ensure Python output is not buffered
ENV PYTHONUNBUFFERED=1

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
