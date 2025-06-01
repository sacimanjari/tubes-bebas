#!/bin/bash

# Step 0: Pastikan Minikube berjalan dan Ingress diaktifkan
echo "Checking Minikube status..."
if ! minikube status | grep -q "Running"; then
    echo "Starting Minikube..."
    minikube start
fi

echo "Enabling Ingress addon..."
minikube addons enable ingress

# Step 1: Build dan load image
echo "Building frontend image..."
cd k8s/frontend
docker build -t guestbook-frontend:latest .
docker save guestbook-frontend:latest -o guestbook-frontend.tar
minikube image load guestbook-frontend.tar
rm guestbook-frontend.tar

echo "Building backend image..."
cd ../backend
docker build -t guestbook-backend:latest .
docker save guestbook-backend:latest -o guestbook-backend.tar
minikube image load guestbook-backend.tar
rm guestbook-backend.tar

# Step 2: Apply manifest kubernetes
echo "Applying Kubernetes manifests..."
cd ../..

# Buat namespace if not exists
kubectl create namespace cloud-computing --dry-run=client -o yaml | kubectl apply -f -

# Deploy MySQL
echo "Deploying MySQL..."
cd k8s/database
kubectl apply -f mysql-pvc.yaml
kubectl apply -f mysql-deployment.yaml
kubectl apply -f mysql-service.yaml

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/mysql -n cloud-computing

# Deploy Redis
echo "Deploying Redis..."
kubectl apply -f redis-pvc.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f redis-service.yaml

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/redis -n cloud-computing

# Deploy backend
echo "Deploying backend..."
cd ../backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n cloud-computing

# Deploy frontend
echo "Deploying frontend..."
cd ../frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n cloud-computing

# Deploy monitoring stack
echo "Deploying monitoring stack..."
cd ../monitoring
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus-deployment.yaml
kubectl apply -f prometheus-service.yaml
kubectl apply -f grafana-dashboard-provisioning.yaml
kubectl apply -f grafana-datasource.yaml
kubectl apply -f grafana-deployment.yaml
kubectl apply -f grafana-service.yaml

# Wait for monitoring stack to be ready
echo "Waiting for monitoring stack to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n cloud-computing
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n cloud-computing

# Apply Prometheus RBAC
kubectl apply -f prometheus-rbac.yaml

# Deploy ingress
echo "Deploying ingress..."
cd ..
kubectl apply -f ingress.yaml

echo "Deployment completed!"
echo "Checking pod status..."
kubectl get pods -n cloud-computing

echo "
To access the application, run these commands in separate terminals:

1. For frontend:
   kubectl port-forward -n cloud-computing svc/frontend-service 8080:80

2. For backend:
   kubectl port-forward -n cloud-computing svc/backend-service 3002:3002

3. For Prometheus:
   kubectl port-forward -n cloud-computing svc/prometheus-service 9090:9090

4. For Grafana:
   kubectl port-forward -n cloud-computing svc/grafana-service 3003:3003

Then access the applications at:
- Frontend: http://localhost:8080
- Backend: http://localhost:3002
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3003 (default credentials: admin/admin)

To run load tests:
1. Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
2. Run: k6 run k8s/load-testing/load-test.js

Note: Keep the port-forward commands running while you use the applications.
" 