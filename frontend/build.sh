#!/bin/bash

set -e

IMAGE_NAME="guestbook-frontend"
TAG="latest"

echo "🔧 Building frontend image..."
docker build -t $IMAGE_NAME:$TAG .

echo "✅ Done building frontend image."

#!/bin/bash
docker build -t guestbook-frontend .
echo "✅ Done building frontend image."
