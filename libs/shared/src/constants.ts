export const DATABASE_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'db_user',
  password: process.env.DB_PASSWORD || 'db_password',
  database: process.env.DB_NAME || 'db_name',
};

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566', // LocalStack for local development
};

export const SQS_CONFIG = {
  queueUrl: process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/shopflow-events',
  region: process.env.AWS_REGION || 'us-east-1',
};

export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
};

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@shopflow.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
};

export const SHIPPING_CONFIG = {
  apiKey: process.env.SHIPPING_API_KEY || 'test_key',
  baseUrl: process.env.SHIPPING_BASE_URL || 'https://api.shipping-partner.com',
};
