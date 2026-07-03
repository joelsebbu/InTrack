# Authentication Microservice - Tech Stack & Setup Guide

## Overview

This document outlines the complete tech stack and setup requirements for the authentication microservice backend, which serves as the foundation for the Agentic Ticketing System.

---

## Core Backend Stack

### Python & Package Management

- **Python 3.11+**
  - Modern Python version with improved performance and type hints
  - Recommended: Python 3.11 or 3.12

- **uv**
  - Ultra-fast Python package installer and resolver
  - Alternative to pip with significantly better performance
  - Handles virtual environments and dependencies

- **FastAPI**
  - Modern, high-performance web framework
  - Built-in OpenAPI documentation
  - Native async support
  - Automatic data validation with Pydantic

### Web Server

- **Uvicorn**
  - Lightning-fast ASGI server
  - Runs FastAPI applications
  - Supports multiple workers for production deployments
  - Configuration: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`

---

## Database & ORM

### Option 1: PostgreSQL (Recommended for Auth)

- **PostgreSQL 15+**
  - Robust relational database
  - ACID compliance for user data integrity
  - Excellent for structured user/auth data

- **SQLAlchemy 2.0+**
  - Python ORM with async support
  - Type-safe database operations
  - Works with asyncpg driver

- **asyncpg**
  - High-performance PostgreSQL driver
  - Native async/await support

- **Alembic**
  - Database migration tool
  - Version control for database schema
  - Auto-generates migrations from SQLAlchemy models

### Option 2: MongoDB

- **MongoDB 6+**
  - NoSQL document database
  - Flexible schema

- **Motor**
  - Async MongoDB driver for Python
  - Native asyncio support

---

## Security & Authentication

### Core Security Libraries

- **python-jose[cryptography]**
  - JWT token creation and validation
  - Supports multiple algorithms (HS256, RS256)
  - Handles token encoding/decoding

- **passlib[bcrypt]**
  - Password hashing library
  - bcrypt algorithm (as specified in project specs)
  - Secure password verification
  - Alternative: argon2-cffi for Argon2

- **python-multipart**
  - Handles form data in FastAPI
  - Required for OAuth2 password flow

### JWT Token Strategy

**Access Token:**
- Short-lived: 15-30 minutes
- Contains: user_id, email, role, permissions
- Stored in memory/state on frontend

**Refresh Token:**
- Long-lived: 7-30 days
- Stored in database for validation
- httpOnly cookie on frontend (security best practice)

---

## Caching & Session Management

- **Redis 7+**
  - In-memory data store
  - Session management
  - Token blacklisting (logout)
  - Refresh token storage
  - Rate limiting

- **redis-py** or **aioredis**
  - Python client for Redis
  - Async support with aioredis
  - Connection pooling

---

## Environment & Configuration

- **pydantic-settings**
  - Built into FastAPI
  - Type-safe environment variable management
  - Automatic validation of configuration

- **python-dotenv**
  - Loads environment variables from .env files
  - Simplifies local development

### Example Environment Variables

```env
# Application
APP_NAME=auth-service
APP_ENV=development
DEBUG=True

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ticketing_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# API
API_V1_PREFIX=/api/v1
```

---

## Containerization & Orchestration

### Docker

- **Docker**
  - Container runtime
  - Ensures consistent environments
  - Simplifies deployment

- **docker-compose**
  - Multi-container orchestration
  - Local development setup
  - Manages auth service + PostgreSQL + Redis

### Docker Compose Services

```yaml
services:
  - auth-service (FastAPI app)
  - postgres (Database)
  - redis (Cache/sessions)
```

---

## Optional but Recommended

### Development Tools

- **pytest**
  - Testing framework
  - Fixtures and parametrization
  - Async test support with pytest-asyncio

- **httpx**
  - Async HTTP client
  - Used for testing FastAPI endpoints
  - Modern replacement for requests

- **black**
  - Opinionated code formatter
  - Consistent code style
  - Zero configuration

- **ruff**
  - Extremely fast Python linter
  - Replaces flake8, isort, and more
  - Written in Rust for performance

### Code Quality

- **mypy** - Static type checking
- **pre-commit** - Git hooks for quality checks
- **coverage** - Test coverage reporting

### Email Service (Optional)

If auth service handles email verification:

- **SendGrid Python SDK**
  - Email delivery service
  - Transactional emails
  - API key authentication

- **AWS SES (boto3)**
  - Alternative email service
  - Cost-effective
  - AWS integration

---

## Project Structure

```
auth-service/
├── Dockerfile                 # Container definition
├── docker-compose.yml         # Multi-container setup
├── pyproject.toml            # uv/pip dependencies
├── .env                      # Environment variables (not in git)
├── .env.example              # Template for .env
├── .gitignore
├── README.md
├── alembic/                  # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini
├── tests/                    # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_users.py
└── app/
    ├── __init__.py
    ├── main.py              # FastAPI app entry point
    ├── config.py            # Configuration settings
    ├── database.py          # Database connection
    ├── dependencies.py      # Dependency injection
    ├── models/              # SQLAlchemy models
    │   ├── __init__.py
    │   └── user.py
    ├── schemas/             # Pydantic schemas
    │   ├── __init__.py
    │   ├── user.py
    │   └── token.py
    ├── routers/             # API endpoints
    │   ├── __init__.py
    │   ├── auth.py
    │   └── users.py
    ├── services/            # Business logic
    │   ├── __init__.py
    │   ├── auth_service.py
    │   └── user_service.py
    └── utils/               # Utilities
        ├── __init__.py
        ├── security.py      # JWT, password hashing
        └── redis_client.py  # Redis connection
```

---

## Core Dependencies Summary

### Minimal Production Dependencies

```toml
[project]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "sqlalchemy>=2.0.0",
    "asyncpg>=0.29.0",
    "alembic>=1.12.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "redis>=5.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
]
```

### Development Dependencies

```toml
[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.25.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.6.0",
]
```

---

## Setup Checklist

- [ ] Install Python 3.11+
- [ ] Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- [ ] Install Docker and Docker Compose
- [ ] Clone repository
- [ ] Create `.env` from `.env.example`
- [ ] Run `uv sync` to install dependencies
- [ ] Start services: `docker-compose up -d`
- [ ] Run migrations: `alembic upgrade head`
- [ ] Start development server: `uvicorn app.main:app --reload`
- [ ] Access API docs: `http://localhost:8000/docs`

---

## Key Architecture Decisions

### Distributed JWT Validation

- Auth service issues tokens
- Other microservices validate independently
- Shared secret or public key validation
- Reduces auth service dependency
- Improves scalability and performance

### Token Storage Strategy

- Access tokens: Frontend memory/state (never localStorage for security)
- Refresh tokens: httpOnly cookies (prevents XSS attacks)
- Refresh tokens also stored in database for validation/revocation

### Password Security

- bcrypt hashing (cost factor: 12-14)
- Never store plain text passwords
- Password strength validation on signup
- Optional: Password reset via email

### API Versioning

- URL-based versioning: `/api/v1/`
- Future-proof for breaking changes
- Clear API evolution path

---

## Next Steps

1. **Initialize project with uv**
   - Set up virtual environment
   - Install core dependencies

2. **Create Docker setup**
   - Write Dockerfile
   - Configure docker-compose.yml

3. **Database models**
   - User model
   - Refresh token model

4. **Authentication endpoints**
   - POST /signup
   - POST /login
   - POST /refresh
   - POST /logout

5. **Security utilities**
   - JWT functions
   - Password hashing
   - Token validation middleware

6. **Testing**
   - Unit tests for services
   - Integration tests for endpoints
   - Test coverage setup

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/)
- [uv Documentation](https://github.com/astral-sh/uv)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)