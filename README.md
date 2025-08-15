# ChargeFlow Shopper - Microservices Architecture

A comprehensive e-commerce microservices platform built with NestJS, featuring event-driven architecture, transactional outbox pattern, and AWS SQS message broker.

## 🏗️ Architecture Overview

The system consists of 6 microservices:

1. **Frontend** (React + Vite) - User interface for product selection and checkout
2. **Web Server** (NestJS) - API gateway with Redis session management
3. **Invoice Service** (NestJS) - PDF invoice generation and price calculation
4. **Billing Service** (NestJS) - Stripe payment processing
5. **Shipping Service** (NestJS) - External shipping partner integration
6. **Email Service** (NestJS) - Email notifications with Handlebars templates

## 🔄 Event Flow

```
Frontend → Web Server → SQS → Invoice Service → SQS → Billing Service → SQS → Shipping Service
                                                                    ↓
                                                              Email Service
```

## 🛠️ Technology Stack

- **Backend**: NestJS, TypeScript, TypeORM
- **Frontend**: React, Vite, TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Broker**: AWS SQS (with LocalStack for development)
- **Payment**: Stripe
- **Email**: Nodemailer with Handlebars templates
- **PDF Generation**: PDFKit
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- AWS CLI (for production)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd chargeflow-shopper
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and LocalStack
npm run docker:up
```

### 3. Build Shared Library

```bash
cd libs/shared
npm install
npm run build
cd ../..
```

### 4. Start All Services

```bash
# Start all microservices in development mode
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Web Server: http://localhost:3001
- Invoice Service: http://localhost:3002
- Billing Service: http://localhost:3003
- Shipping Service: http://localhost:3004
- Email Service: http://localhost:3005

## 📁 Project Structure

```
chargeflow-shopper/
├── apps/
│   ├── frontend/                 # React frontend application
│   ├── web-server/              # API gateway with session management
│   ├── invoice-service/         # PDF generation and pricing
│   ├── billing-service/         # Stripe payment processing
│   ├── shipping-service/        # Shipping partner integration
│   └── email-service/           # Email notifications
├── libs/
│   └── shared/                  # Shared types and utilities
├── docker-compose.yml           # Infrastructure services
├── init.sql                     # Database schema
└── package.json                 # Root package.json
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=db_user
DB_PASSWORD=db_password
DB_NAME=db_name

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS (for LocalStack development)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566

# SQS
SQS_QUEUE_URL=http://localhost:4566/000000000000/chargeflow-events

# Stripe (for testing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
EMAIL_FROM=noreply@chargeflow.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Shipping
SHIPPING_API_KEY=test_key
SHIPPING_BASE_URL=https://api.shipping-partner.com
```

## 🏃‍♂️ Running Individual Services

```bash
# Frontend
cd apps/frontend && npm run dev

# Web Server
cd apps/web-server && npm run start:dev

# Invoice Service
cd apps/invoice-service && npm run start:dev

# Billing Service
cd apps/billing-service && npm run start:dev

# Shipping Service
cd apps/shipping-service && npm run start:dev

# Email Service
cd apps/email-service && npm run start:dev
```

## 🧪 Testing the Flow

1. **Access Frontend**: http://localhost:3000
2. **Select Products**: Choose products and quantities
3. **Checkout**: Click "Checkout" to create an order
4. **Monitor Logs**: Watch the console logs for event processing

### Expected Flow:

1. Frontend sends order to Web Server
2. Web Server creates request and publishes to SQS
3. Invoice Service processes the order, generates PDF, publishes event
4. Billing Service processes payment via Stripe, publishes event
5. Shipping Service creates shipping order, publishes event
6. Email Service sends notifications at each step

## 🏗️ Database Schema

The system uses PostgreSQL with the following main tables:

- `users` - Customer information
- `products` - Product catalog with prices
- `requests` - Order tracking
- `request_items` - Order line items
- `invoices` - Generated PDF invoices
- `outbox` - Transactional outbox for reliable messaging

## 🔄 Transactional Outbox Pattern

Each service implements the transactional outbox pattern:

1. **Database Transaction**: Updates business data and creates outbox message
2. **Message Publishing**: Publishes to SQS outside the transaction
3. **Reliability**: If publishing fails, message remains in outbox for retry

## 🚀 Deployment

### Lambda Deployment

Each service can be deployed to AWS Lambda:

```bash
# Build all services
npm run build

# Deploy to Lambda
npm run deploy:lambda
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

- **Database**: PostgreSQL logs
- **Redis**: Redis logs
- **SQS**: AWS SQS console (or LocalStack)
- **Services**: Console logs for each microservice

## 🔒 Security Considerations

- All external API calls use environment variables
- Database connections use connection pooling
- Redis sessions are properly configured
- Stripe integration follows security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Redis Connection**: Check Redis is running on port 6379
3. **SQS Issues**: Verify LocalStack is running and SQS queue exists
4. **Port Conflicts**: Ensure no other services are using the required ports

### Logs

Check service logs for detailed error information:

```bash
# View service logs
docker-compose logs <service-name>
```

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.
