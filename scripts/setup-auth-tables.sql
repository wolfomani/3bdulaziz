-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    github_id VARCHAR(50) UNIQUE,
    github_username VARCHAR(100),
    name VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الجلسات
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- جدول التحقق من الهاتف
CREATE TABLE IF NOT EXISTS phone_verifications (
    phone VARCHAR(20) PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    INDEX idx_expires_at (expires_at)
);

-- جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64),
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    model_used VARCHAR(100),
    tokens_used JSON,
    confidence_score DECIMAL(3,2),
    message_analysis JSON,
    cost_estimate DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
);

-- جدول إحصائيات الاستخدام
CREATE TABLE IF NOT EXISTS usage_stats (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(32) REFERENCES users(id) ON DELETE CASCADE,
    model_used VARCHAR(100),
    tokens_consumed INTEGER,
    cost_incurred DECIMAL(10,6),
    request_type VARCHAR(50),
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_model_used (model_used),
    INDEX idx_created_at (created_at)
);

-- إنشاء فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);

-- إضافة قيود إضافية
ALTER TABLE users ADD CONSTRAINT chk_contact_method 
CHECK (email IS NOT NULL OR phone IS NOT NULL OR github_id IS NOT NULL);

-- دالة لتنظيف الجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- دالة لتنظيف رموز التحقق المنتهية الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM phone_verifications WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية (اختيارية)
INSERT INTO users (id, email, name, is_verified) 
VALUES ('demo_user_001', 'demo@example.com', 'Demo User', TRUE)
ON CONFLICT (id) DO NOTHING;

-- عرض إحصائيات المستخدمين
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.github_username,
    u.is_verified,
    u.created_at,
    u.last_login,
    COUNT(c.id) as total_conversations,
    COALESCE(SUM(c.cost_estimate), 0) as total_cost,
    AVG(c.confidence_score) as avg_confidence
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
GROUP BY u.id, u.name, u.email, u.phone, u.github_username, u.is_verified, u.created_at, u.last_login;

-- عرض إحصائيات النماذج
CREATE OR REPLACE VIEW model_stats AS
SELECT 
    model_used,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence,
    SUM(cost_estimate) as total_cost,
    AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_response_time
FROM conversations 
WHERE model_used IS NOT NULL
GROUP BY model_used
ORDER BY usage_count DESC;

COMMENT ON TABLE users IS 'جدول المستخدمين - يحتوي على معلومات المستخدمين المسجلين';
COMMENT ON TABLE sessions IS 'جدول الجلسات - يحتوي على جلسات المستخدمين النشطة';
COMMENT ON TABLE phone_verifications IS 'جدول التحقق من الهاتف - يحتوي على رموز التحقق المؤقتة';
COMMENT ON TABLE conversations IS 'جدول المحادثات - يحتوي على سجل المحادثات مع الذكاء الاصطناعي';
COMMENT ON TABLE usage_stats IS 'جدول إحصائيات الاستخدام - يحتوي على تفاصيل استخدام النماذج';
