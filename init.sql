-- Initialize database schema for ChargeFlow Shopper

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table (main order tracking)
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_price DECIMAL(10,2),
    charge_id VARCHAR(255),
    tracking_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Request items table
CREATE TABLE request_items (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES requests(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES requests(id),
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outbox table for transactional messaging
CREATE TABLE outbox (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES requests(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Insert sample data
INSERT INTO users (email, customer_id, address) VALUES
('john.doe@example.com', 'cus_123456789', '123 Main St, New York, NY 10001'),
('jane.smith@example.com', 'cus_987654321', '456 Oak Ave, Los Angeles, CA 90210');

INSERT INTO products (name, price) VALUES
('Laptop', 999.99),
('Mouse', 29.99),
('Keyboard', 89.99),
('Monitor', 299.99),
('Headphones', 149.99);

-- Create indexes
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_outbox_published ON outbox(published);
CREATE INDEX idx_outbox_request_id ON outbox(request_id);
