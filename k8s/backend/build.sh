# Step 1: Install dependencies
npm install

# Step 2: Build image dari dockerfile menggunakan docker
docker build -t guestbook-backend:latest .

# Step 3: Save image ke file tar
docker save guestbook-backend:latest -o guestbook-backend.tar

# Step 4: Load image ke minikube
minikube image load guestbook-backend.tar

# Step 5: Cleanup
rm guestbook-backend.tar 