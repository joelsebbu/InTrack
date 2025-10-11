# Auth Service - Database Schema

## Overview

This document defines the complete database schema for the Authentication microservice. The schema supports user management, JWT-based authentication, password reset functionality, and soft deletion.

**Database:** PostgreSQL 15+
**ORM:** SQLAlchemy 2.0+ with asyncpg
**Migrations:** Alembic

---

## Design Decisions

- **Simple role-based access:** Single role field (not full RBAC)
- **No email verification:** Users can login immediately after signup
- **Password reset:** Supported via token-based flow
- **Soft delete:** Users marked as inactive rather than deleted
- **Minimal profile data:** Auth service stores only authentication-relevant data
- **UUID primary keys:** Better for distributed systems and security
- **Audit timestamps:** Track record creation and updates

---

## Tables

### 1. users

Stores core user authentication and profile information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT role_values CHECK (role IN ('employee', 'it_support', 'hr_support', 'admin'))
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Comments
COMMENT ON TABLE users IS 'Core user accounts for authentication and authorization';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique, used for login)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (never store plain text)';
COMMENT ON COLUMN users.full_name IS 'User full name for display purposes';
COMMENT ON COLUMN users.role IS 'User role: employee, it_support, hr_support, admin';
COMMENT ON COLUMN users.department IS 'User department (optional, e.g., Engineering, Sales, HR)';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag (false = deactivated account)';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last account update timestamp';
```

**Field Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `email` | VARCHAR(255) | NO | - | Unique email address |
| `password_hash` | VARCHAR(255) | NO | - | Bcrypt hash (cost factor 12) |
| `full_name` | VARCHAR(255) | NO | - | User's full name |
| `role` | VARCHAR(50) | NO | - | User role (constrained values) |
| `department` | VARCHAR(100) | YES | NULL | User department |
| `is_active` | BOOLEAN | NO | true | Account active status |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

**Role Values:**
- `employee` - Regular user who can submit tickets
- `it_support` - IT support team member
- `hr_support` - HR support team member
- `admin` - System administrator with full access

---

### 2. refresh_tokens

Stores refresh tokens for JWT authentication flow.

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    revoked BOOLEAN DEFAULT false NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT expires_at_future CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked) WHERE revoked = false;

-- Comments
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for extended authentication sessions';
COMMENT ON COLUMN refresh_tokens.id IS 'Unique token identifier';
COMMENT ON COLUMN refresh_tokens.user_id IS 'User who owns this refresh token';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hashed refresh token (never store plain token)';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp (7-30 days)';
COMMENT ON COLUMN refresh_tokens.created_at IS 'Token creation timestamp';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Token revocation status (true = invalidated)';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'When token was revoked (NULL if active)';
```

**Field Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to users table |
| `token_hash` | VARCHAR(255) | NO | - | Hashed refresh token |
| `expires_at` | TIMESTAMPTZ | NO | - | Token expiration time |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `revoked` | BOOLEAN | NO | false | Revocation status |
| `revoked_at` | TIMESTAMPTZ | YES | NULL | Revocation timestamp |

**Notes:**
- Tokens are hashed before storage (same as passwords)
- Cascade delete: When user deleted, all tokens deleted
- Expired tokens cleaned up via scheduled job
- Revoked tokens kept for audit purposes

---

### 3. password_reset_tokens

Stores one-time tokens for password reset flow.

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT expires_at_future CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE UNIQUE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_password_reset_used ON password_reset_tokens(used) WHERE used = false;

-- Comments
COMMENT ON TABLE password_reset_tokens IS 'One-time tokens for password reset functionality';
COMMENT ON COLUMN password_reset_tokens.id IS 'Unique token identifier';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'User requesting password reset';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'Hashed reset token (sent to user email)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration (typically 15-60 minutes)';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'Token creation timestamp';
COMMENT ON COLUMN password_reset_tokens.used IS 'Whether token has been used (one-time use)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When token was used (NULL if unused)';
```

**Field Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to users table |
| `token_hash` | VARCHAR(255) | NO | - | Hashed reset token (unique) |
| `expires_at` | TIMESTAMPTZ | NO | - | Token expiration time |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `used` | BOOLEAN | NO | false | Usage status |
| `used_at` | TIMESTAMPTZ | YES | NULL | Usage timestamp |

**Notes:**
- Tokens expire quickly (15-60 minutes)
- One-time use only
- Previous unused tokens invalidated when new one requested
- Token sent to user's email address

---

## Entity Relationships

```
users (1) ----< (many) refresh_tokens
users (1) ----< (many) password_reset_tokens
```

**Relationships:**
- One user can have multiple refresh tokens (different devices/sessions)
- One user can have multiple password reset tokens (only latest valid one used)
- Cascade delete: When user deleted, all related tokens deleted

---

## Sample Data

```sql
-- Sample users (passwords are 'Password123!')
INSERT INTO users (id, email, password_hash, full_name, role, department, is_active) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'john.doe@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSKWW5mi',
    'John Doe',
    'employee',
    'Engineering',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'jane.smith@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSKWW5mi',
    'Jane Smith',
    'it_support',
    'IT',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'bob.wilson@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSKWW5mi',
    'Bob Wilson',
    'hr_support',
    'Human Resources',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'admin@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSKWW5mi',
    'System Administrator',
    'admin',
    'IT',
    true
);
```

---

## Indexes Summary

### Performance Optimization Strategy

**users table:**
- `idx_users_email` (UNIQUE) - Fast login lookups
- `idx_users_role` - Filter users by role
- `idx_users_is_active` - Filter active users
- `idx_users_created_at` - Sort by registration date

**refresh_tokens table:**
- `idx_refresh_tokens_user_id` - Find user's tokens
- `idx_refresh_tokens_token_hash` - Token validation
- `idx_refresh_tokens_expires_at` - Cleanup expired tokens
- `idx_refresh_tokens_revoked` (partial) - Find active tokens only

**password_reset_tokens table:**
- `idx_password_reset_user_id` - Find user's reset tokens
- `idx_password_reset_token_hash` (UNIQUE) - Token validation
- `idx_password_reset_expires_at` - Cleanup expired tokens
- `idx_password_reset_used` (partial) - Find unused tokens only

---

## Database Constraints

### Data Integrity

**users table:**
- `email_format` - Email regex validation
- `role_values` - Restrict role to valid values
- Unique email constraint

**refresh_tokens table:**
- `expires_at_future` - Expiration must be after creation
- Foreign key cascade delete

**password_reset_tokens table:**
- `expires_at_future` - Expiration must be after creation
- Foreign key cascade delete
- Unique token_hash

---

## Maintenance Operations

### Cleanup Jobs

**1. Delete expired refresh tokens**
```sql
DELETE FROM refresh_tokens
WHERE expires_at < NOW()
AND revoked = true;
```
Run: Daily

**2. Delete expired password reset tokens**
```sql
DELETE FROM password_reset_tokens
WHERE expires_at < NOW();
```
Run: Hourly

**3. Delete old used password reset tokens**
```sql
DELETE FROM password_reset_tokens
WHERE used = true
AND used_at < NOW() - INTERVAL '7 days';
```
Run: Weekly

---

## Alembic Migration Strategy

### Initial Migration

```python
# alembic/versions/001_initial_schema.py

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.CheckConstraint("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'", name='email_format'),
        sa.CheckConstraint("role IN ('employee', 'it_support', 'hr_support', 'admin')", name='role_values')
    )

    # Create indexes for users
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_users_role', 'users', ['role'])
    op.create_index('idx_users_is_active', 'users', ['is_active'])
    op.create_index('idx_users_created_at', 'users', [sa.text('created_at DESC')])

    # Create refresh_tokens table
    # ... (similar pattern)

    # Create password_reset_tokens table
    # ... (similar pattern)

def downgrade():
    op.drop_table('password_reset_tokens')
    op.drop_table('refresh_tokens')
    op.drop_table('users')
```

---

## SQLAlchemy Models Preview

```python
# app/models/user.py

from sqlalchemy import Boolean, Column, String, TIMESTAMP, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'", name='email_format'),
        CheckConstraint("role IN ('employee', 'it_support', 'hr_support', 'admin')", name='role_values'),
    )
```

---

## Security Considerations

### Password Storage
- Use bcrypt with cost factor 12-14
- Never store plain text passwords
- Hash passwords before database insert

### Token Storage
- Hash refresh tokens before storage
- Hash password reset tokens before storage
- Use cryptographically secure random token generation

### SQL Injection Prevention
- Use SQLAlchemy ORM (parameterized queries)
- Validate input with Pydantic schemas
- Never concatenate user input into SQL

### Data Access Control
- JWT tokens contain user_id and role
- Services validate tokens independently
- No direct database access from other services

---

## Future Enhancements

When scaling or adding features, consider:

1. **Full RBAC:** Separate roles and permissions tables
2. **Audit logging:** Separate audit_log table for all user actions
3. **Email verification:** Add verification fields to users table
4. **Two-factor authentication:** Add 2fa_enabled, 2fa_secret fields
5. **Session management:** Add sessions table for device tracking
6. **Password history:** Add password_history table to prevent reuse
7. **Failed login tracking:** Add login_attempts table for security

---

## Performance Benchmarks

Expected performance with proper indexing:

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| User login (email lookup) | < 5ms | Indexed email column |
| Token validation | < 3ms | Indexed token_hash |
| User creation | < 10ms | Single insert with indexes |
| Refresh token cleanup | < 100ms | Bulk delete with index |

---

## Questions?

If you need to modify this schema (add fields, change constraints, etc.), update this document first before creating migrations. This serves as the source of truth for the auth database.
