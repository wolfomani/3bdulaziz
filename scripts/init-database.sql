-- Dr X Database Schema
-- Initialize PostgreSQL database for Dr X AI Assistant

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS drx_ai;

-- Use the database
\c drx_ai;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    model_used VARCHAR(100),
    provider_used VARCHAR(50),
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    version VARCHAR(50),
    capabilities JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    model_used VARCHAR(100),
    provider_used VARCHAR(50),
    tokens_consumed INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    request_type VARCHAR(50),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
    component VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- Insert default AI models
INSERT INTO ai_models (name, provider, version, capabilities, performance_metrics, is_active) VALUES
('meta-llama/Llama-2-70b-chat-hf', 'TogetherAI', '2.0', '{"text_generation": true, "chat": true, "arabic_support": true}', '{"avg_response_time": 250, "accuracy": 0.92}', true),
('meta-llama/Llama-2-13b-chat-hf', 'TogetherAI', '2.0', '{"text_generation": true, "chat": true, "arabic_support": true}', '{"avg_response_time": 180, "accuracy": 0.88}', true),
('mistralai/Mixtral-8x7B-Instruct-v0.1', 'TogetherAI', '0.1', '{"text_generation": true, "chat": true, "multilingual": true}', '{"avg_response_time": 200, "accuracy": 0.90}', true),
('llama3-70b-8192', 'Groq', '3.0', '{"text_generation": true, "chat": true, "fast_inference": true}', '{"avg_response_time": 100, "accuracy": 0.95}', true),
('llama3-8b-8192', 'Groq', '3.0', '{"text_generation": true, "chat": true, "fast_inference": true}', '{"avg_response_time": 80, "accuracy": 0.90}', true),
('mixtral-8x7b-32768', 'Groq', '1.0', '{"text_generation": true, "chat": true, "long_context": true}', '{"avg_response_time": 120, "accuracy": 0.93}', true)
ON CONFLICT (name, provider) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for conversation summaries
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
    c.id,
    c.user_id,
    c.title,
    c.model_used,
    c.provider_used,
    c.total_messages,
    c.total_tokens,
    c.created_at,
    c.updated_at,
    u.username,
    u.full_name,
    COALESCE(
        (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at LIMIT 1),
        'محادثة جديدة'
    ) as first_message,
    (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id;

-- Create a view for usage statistics
CREATE OR REPLACE VIEW usage_statistics AS
SELECT 
    DATE(created_at) as date,
    provider_used,
    model_used,
    COUNT(*) as total_requests,
    SUM(tokens_consumed) as total_tokens,
    AVG(processing_time) as avg_processing_time,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_requests
FROM usage_analytics
GROUP BY DATE(created_at), provider_used, model_used
ORDER BY date DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drx_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drx_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO drx_user;

-- Insert sample data for testing (optional)
-- INSERT INTO users (email, username, full_name) VALUES 
-- ('test@drx.ai', 'testuser', 'Test User'),
-- ('admin@drx.ai', 'admin', 'Admin User');

COMMIT;
