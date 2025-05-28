# Step 1: Build image dari dockerfile menggunakan podman
podman build -t guestbook-frontend:latest .

# Step 2: Save image ke file tar
podman save guestbook-frontend:latest -o guestbook-frontend.tar

# Step 3: Load image ke minikube
minikube image load guestbook-frontend.tar

# Step 4: Cleanup
rm guestbook-frontend.tar