#!/bin/bash

echo "Starting cleanup process..."

# Delete all deployments
echo "Deleting deployments..."
kubectl delete deployment --all -n cloud-computing

# Delete all services
echo "Deleting services..."
kubectl delete service --all -n cloud-computing

# Delete all pods
echo "Deleting pods..."
kubectl delete pod --all -n cloud-computing

# Delete all persistent volume claims
echo "Deleting PVCs..."
kubectl delete pvc --all -n cloud-computing

# Delete all config maps
echo "Deleting ConfigMaps..."
kubectl delete configmap --all -n cloud-computing

# Delete ingress
echo "Deleting ingress..."
kubectl delete ingress --all -n cloud-computing

# Delete namespace
echo "Deleting namespace..."
kubectl delete namespace cloud-computing

echo "Cleanup completed!"
echo "You can now run deploy.sh to start fresh." 