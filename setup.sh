#!/bin/bash

echo "🚀 Setting up ShopFlow Shopper Microservices..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build shared library
echo "🔨 Building shared library..."
cd libs/shared
npm install
npm run build
cd ../..

# Install dependencies for each service
echo "📦 Installing service dependencies..."

cd apps/frontend
npm install
cd ../..

cd apps/web-server
npm install
cd ../..

cd apps/invoice-service
npm install
cd ../..

cd apps/billing-service
npm install
cd ../..

cd apps/shipping-service
npm install
cd ../..

cd apps/email-service
npm install
cd ../..

echo "✅ Dependencies installed"

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
npm run docker:up

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Create SQS queue (if using LocalStack)
echo "📬 Setting up SQS queue..."
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name shopflow-events --region us-east-1 || echo "Queue might already exist"

echo "✅ Setup complete!"
echo ""
echo "🎉 ShopFlow Shopper is ready to run!"
echo ""
echo "To start all services:"
echo "  npm run dev"
echo ""
echo "To start individual services:"
echo "  npm run dev:frontend"
echo "  npm run dev:web-server"
echo "  npm run dev:invoice"
echo "  npm run dev:billing"
echo "  npm run dev:shipping"
echo "  npm run dev:email"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Web Server will be available at: http://localhost:3001"
echo ""
echo "Don't forget to set up your environment variables in .env files!"
