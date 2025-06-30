-- Dr X Database Schema Setup
-- PostgreSQL database tables for the Dr X AI Assistant platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create usage analytics table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    provider TEXT,
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_time INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_provider ON usage_analytics(provider);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured) WHERE featured = true;

-- Create a view for usage statistics
CREATE OR REPLACE VIEW usage_statistics AS
SELECT 
    DATE(created_at) as date,
    provider,
    COUNT(*) as total_requests,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
    AVG(processing_time_ms) as avg_processing_time,
    SUM(tokens_used) as total_tokens
FROM usage_analytics
GROUP BY DATE(created_at), provider
ORDER BY date DESC, provider;

-- Create function to get recent conversations
CREATE OR REPLACE FUNCTION get_recent_conversations(user_uuid UUID DEFAULT NULL, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    message_count BIGINT,
    last_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.title,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count,
        (
            SELECT m2.content 
            FROM messages m2 
            WHERE m2.conversation_id = c.id 
            ORDER BY m2.created_at DESC 
            LIMIT 1
        ) as last_message
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE (user_uuid IS NULL OR c.user_id = user_uuid)
    GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at
    ORDER BY c.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get usage statistics
CREATE OR REPLACE FUNCTION get_usage_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    total_requests BIGINT,
    successful_requests BIGINT,
    success_rate NUMERIC,
    avg_processing_time NUMERIC,
    total_tokens BIGINT,
    unique_sessions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ua.created_at) as date,
        COUNT(*) as total_requests,
        SUM(CASE WHEN ua.success THEN 1 ELSE 0 END) as successful_requests,
        ROUND(
            (SUM(CASE WHEN ua.success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2
        ) as success_rate,
        ROUND(AVG(ua.processing_time_ms), 2) as avg_processing_time,
        SUM(ua.tokens_used) as total_tokens,
        COUNT(DISTINCT ua.session_id) as unique_sessions
    FROM usage_analytics ua
    WHERE ua.created_at >= CURRENT_DATE - INTERVAL '%s days' % days_back
    GROUP BY DATE(ua.created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old system logs
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '%s days' % days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old usage analytics (keep more recent data)
    DELETE FROM usage_analytics 
    WHERE created_at < NOW() - INTERVAL '%s days' % (days_to_keep * 3);
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some initial system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('ai_default_provider', '"auto"', 'Default AI provider (auto, together, groq)')
    ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
    ('ai_default_temperature', '0.7', 'Default temperature for AI responses')
    ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
    ('ai_max_tokens', '2000', 'Maximum tokens for AI responses')
    ON CONFLICT (key) DO NOTHING;

-- Insert sample blog post
INSERT INTO blog_posts (
    slug, title, excerpt, content, author, read_time, tags, category, featured
) VALUES (
    'copilot-modes-guide',
    'Copilot ask, edit, and agent modes: What they do and when to use them',
    'An introduction to the three distinct modes of GitHub Copilot and a practical guide for integrating them effectively into your workflow.',
    'If you have opened Copilot Chat in VS Code lately and didn''t notice the tiny dropdown hiding at the bottom, you''re not alone...',
    'Dr X AI Team',
    10,
    ARRAY['GitHub Copilot', 'AI Tools', 'Development', 'VS Code'],
    'AI & ML',
    true
) ON CONFLICT (slug) DO NOTHING;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log the successful setup
INSERT INTO system_logs (level, component, message, metadata) VALUES
    ('info', 'database', 'Dr X database schema setup completed successfully', 
     jsonb_build_object('timestamp', NOW(), 'version', '1.0'));

COMMIT;
