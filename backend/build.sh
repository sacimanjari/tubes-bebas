#!/bin/bash

set -e

IMAGE_NAME="guestbook-backend"
TAG="latest"

echo "🔧 Building backend image..."
docker build -t $IMAGE_NAME:$TAG .

echo "✅ Done building backend image."

#!/bin/bash
docker build -t guestbook-backend-sqlite .
echo "✅ Done building backend image with SQLite."