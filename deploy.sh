#!/bin/bash

set -e

echo "🔧 Building frontend & backend images..."
./frontend/build.sh
./backend/build.sh

echo "🚀 Deploying SQLite PVC..."
kubectl apply -f k8s/sqlite-pvc.yaml

echo "🚀 Deploying Backend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

echo "🚀 Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

echo "✅ All components deployed successfully!"
