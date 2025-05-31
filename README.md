# Digital Guestbook - Microservices on Kubernetes

This project implements a **Digital Guestbook application** using microservices architecture on Kubernetes (Minikube). Users can leave messages, view all entries, and manage the guestbook through a beautiful web interface.

## 🌟 Features

- **Add Entries**: Users can add their name and message to the guestbook
- **View All Entries**: Display all guestbook entries with timestamps
- **Real-time Status**: Monitor frontend, backend, and database connectivity
- **Admin Functions**: Clear all entries (with confirmation)
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Persistent Storage**: Messages are stored in Redis with data persistence

## 🏗️ Architecture

### Frontend Service
- Nginx-based web server
- Modern, responsive single-page application
- Real-time status monitoring
- Form validation and error handling

### Backend Service
- Node.js application with Express
- RESTful API endpoints for guestbook operations
- Input validation and error handling

### Database Service
- Redis for fast data storage
- List-based storage for guestbook entries
- Persistent volume for data persistence

## 📁 Project Structure
```
.
├── k8s/                    # Kubernetes manifests
│   ├── frontend/          # Frontend service configurations
│   ├── backend/           # Backend service configurations
│   └── database/          # Database service configurations
├── manifests/             # Common Kubernetes manifests
└── monitoring/            # Monitoring configurations
```

## 🛠️ Prerequisites
- Minikube
- kubectl
- docker
- Helm (for monitoring stack)

## 🚀 Getting Started

1. Start Minikube:
```bash
minikube start
```

2. Enable Ingress:
```bash
minikube addons enable ingress
```

3. Create the namespace:
```bash
kubectl create namespace cloud-computing
```

4. Apply Kubernetes manifests:
```bash
kubectl apply -f manifests/
```

5. Deploy all pods:
```bash
./deploy.sh
```

6. Check if all pods are running:
```bash
# Open a new terminal and run:
kubectl get pods -n cloud-computing
```

## 🔌 Local Development Access

### Frontend Service
```bash
# Open a new terminal and run:
kubectl port-forward -n cloud-computing svc/frontend-service 8080:80
# Access at: localhost:8080
```

### Backend Service
```bash
kubectl port-forward -n cloud-computing svc/backend-service 3000:3000
# Access at: localhost:3000
```

### Database Access
```bash
# Connect to MySQL
kubectl exec -it -n cloud-computing <mysql-pods-name> -- mysql -u guestbook -pguestbook guestbook

# Common MySQL Commands
SHOW DATABASES;
USE <database_name>;
SHOW TABLES;
SELECT * FROM <table_name>;
```

## 📡 API Endpoints

### Health Check
- **GET** `/api/health`
  - Returns service status and database connectivity

### Guestbook Operations
- **POST** `/api/guestbook`
  - Add new guestbook entry
  - Body: `{ "name": "string", "message": "string" }`
  
- **GET** `/api/guestbook`
  - Retrieve all guestbook entries
  - Returns entries with ID, name, message, and timestamp
  
- **DELETE** `/api/guestbook`
  - Clear all guestbook entries (admin function)

## 📱 Using the Guestbook

1. **Add Entry**: Fill in your name and message, then click "Add Entry"
2. **View Entries**: All entries are displayed below the form with timestamps
3. **Clear All**: Admin function to remove all entries (requires confirmation)
4. **Status Monitoring**: Real-time status indicators show service health

## 📊 Monitoring
- Prometheus for metrics collection
- Grafana for visualization
- k6 for load testing

## 🔒 Security Features
- Network Policies
- Secrets Management
- RBAC
- Container Vulnerability Scanning (Trivy) 