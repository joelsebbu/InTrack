# Auth Service - API Contract

## Overview

This document defines the complete REST API contract for the Authentication microservice. It specifies all endpoints, request/response schemas, status codes, error handling, and business rules.

**Base URL:** `http://localhost:8000` (development)
**API Version:** `/api/v1`
**API Prefix:** `/api/v1/auth`

**Technology:**
- Framework: FastAPI
- Authentication: JWT (Access + Refresh tokens)
- Documentation: Auto-generated OpenAPI/Swagger at `/docs`

---

## Authentication Flow

### Token Strategy

**Access Token:**
- Lifespan: 30 minutes
- Storage: Frontend memory/state (NOT localStorage)
- Usage: Include in `Authorization` header for all protected endpoints
- Format: `Bearer <access_token>`

**Refresh Token:**
- Lifespan: 7 days
- Storage: httpOnly cookie (secure, SameSite=strict)
- Usage: Automatically sent by browser to refresh endpoint
- Cookie name: `refresh_token`

---

## API Endpoints

### 1. User Signup

**Endpoint:** `POST /api/v1/auth/signup`

**Description:** Register a new user account

**Authentication:** None (public endpoint)

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "role": "employee",
  "department": "Engineering"
}
```

**Request Schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | string | Yes | Valid email format, max 255 chars | User email (must be unique) |
| `password` | string | Yes | Min 8 chars, max 72 chars | User password |
| `full_name` | string | Yes | Min 2 chars, max 255 chars | User's full name |
| `role` | string | Yes | Enum: `employee`, `it_support`, `hr_support`, `admin` | User role |
| `department` | string | No | Max 100 chars | User department (optional) |

**Password Requirements:**
- Minimum 8 characters
- Maximum 72 characters (bcrypt limit)
- Must contain at least:
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character (@$!%*?&)

**Success Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "role": "employee",
    "department": "Engineering",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Email already exists:**
```json
{
  "detail": "Email already registered"
}
```

**400 Bad Request - Invalid email format:**
```json
{
  "detail": "Invalid email format"
}
```

**400 Bad Request - Weak password:**
```json
{
  "detail": "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
}
```

**422 Unprocessable Entity - Validation errors:**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

### 2. User Login

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate user and issue tokens

**Authentication:** None (public endpoint)

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!"
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |
| `password` | string | Yes | User password |

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "role": "employee",
    "department": "Engineering"
  }
}
```

**Response Headers:**
```
Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/v1/auth
```

**Access Token Payload (decoded):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440001",
  "email": "john.doe@company.com",
  "full_name": "John Doe",
  "role": "employee",
  "type": "access",
  "exp": 1705318200,
  "iat": 1705316400
}
```

**Error Responses:**

**401 Unauthorized - Invalid credentials:**
```json
{
  "detail": "Incorrect email or password"
}
```

**401 Unauthorized - Account inactive:**
```json
{
  "detail": "Account is inactive. Please contact support."
}
```

**422 Unprocessable Entity - Validation errors:**
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

### 3. Refresh Access Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Description:** Get a new access token using refresh token

**Authentication:** Refresh token (httpOnly cookie)

**Request Body:** None (refresh token sent via cookie)

**Request Headers:**
```
Cookie: refresh_token=<refresh_token>
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Optional: Token Rotation (New Refresh Token):**
```
Set-Cookie: refresh_token=<new_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/v1/auth
```

**Error Responses:**

**401 Unauthorized - Missing refresh token:**
```json
{
  "detail": "Refresh token not provided"
}
```

**401 Unauthorized - Invalid refresh token:**
```json
{
  "detail": "Invalid or expired refresh token"
}
```

**401 Unauthorized - Revoked refresh token:**
```json
{
  "detail": "Refresh token has been revoked"
}
```

---

### 4. User Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Invalidate refresh token and logout user

**Authentication:** Required (Access token)

**Request Headers:**
```
Authorization: Bearer <access_token>
Cookie: refresh_token=<refresh_token>
```

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Response Headers:**
```
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/v1/auth
```

**Backend Actions:**
1. Revoke refresh token in database
2. Clear refresh token cookie
3. Optionally add access token to blacklist (Redis)

**Error Responses:**

**401 Unauthorized - Invalid access token:**
```json
{
  "detail": "Could not validate credentials"
}
```

---

### 5. Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Description:** Get current authenticated user information

**Authentication:** Required (Access token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "john.doe@company.com",
  "full_name": "John Doe",
  "role": "employee",
  "department": "Engineering",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

**401 Unauthorized - Missing token:**
```json
{
  "detail": "Not authenticated"
}
```

**401 Unauthorized - Invalid token:**
```json
{
  "detail": "Could not validate credentials"
}
```

**401 Unauthorized - Expired token:**
```json
{
  "detail": "Token has expired"
}
```

---

### 6. Request Password Reset

**Endpoint:** `POST /api/v1/auth/password-reset/request`

**Description:** Request a password reset token (sent via email)

**Authentication:** None (public endpoint)

**Request Body:**
```json
{
  "email": "john.doe@company.com"
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |

**Success Response (200 OK):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Security Note:** Always return success message even if email doesn't exist (prevents email enumeration)

**Backend Actions:**
1. Check if user exists with this email
2. If exists and active:
   - Generate secure random token (32 bytes)
   - Hash token and store in database
   - Send email with reset link: `https://app.company.com/reset-password?token=<plain_token>`
   - Token expires in 60 minutes
3. If not exists: Still return success message

**Error Responses:**

**422 Unprocessable Entity - Validation errors:**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**429 Too Many Requests - Rate limited:**
```json
{
  "detail": "Too many password reset requests. Please try again later."
}
```

---

### 7. Confirm Password Reset

**Endpoint:** `POST /api/v1/auth/password-reset/confirm`

**Description:** Reset password using the reset token

**Authentication:** None (public endpoint)

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "new_password": "NewSecurePassword123!"
}
```

**Request Schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `token` | string | Yes | 64 hex chars | Password reset token from email |
| `new_password` | string | Yes | Same as signup | New password |

**Success Response (200 OK):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Backend Actions:**
1. Hash the provided token
2. Look up token in database
3. Validate:
   - Token exists
   - Token not expired
   - Token not already used
4. Hash new password
5. Update user's password_hash
6. Mark reset token as used
7. Revoke all user's refresh tokens (force re-login)

**Error Responses:**

**400 Bad Request - Invalid token:**
```json
{
  "detail": "Invalid or expired password reset token"
}
```

**400 Bad Request - Token already used:**
```json
{
  "detail": "Password reset token has already been used"
}
```

**400 Bad Request - Weak password:**
```json
{
  "detail": "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
}
```

---

## Common Response Patterns

### Error Response Structure

All error responses follow this structure:

```json
{
  "detail": "Error message description"
}
```

Or for validation errors (422):

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "error message",
      "type": "error_type"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, POST, PUT requests |
| 201 | Created | Successful resource creation (signup) |
| 400 | Bad Request | Business logic error (email exists, invalid token) |
| 401 | Unauthorized | Authentication failed or missing |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Request validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## Security Considerations

### CORS Configuration

```python
CORS_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "https://app.company.com"  # Production frontend
]
```

**Settings:**
- `allow_credentials=True` (for cookies)
- `allow_methods=["GET", "POST", "PUT", "DELETE"]`
- `allow_headers=["Authorization", "Content-Type"]`

### Rate Limiting

**Endpoints to rate limit:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/signup` | 5 requests | 1 hour per IP |
| `/login` | 5 requests | 15 minutes per IP |
| `/password-reset/request` | 3 requests | 1 hour per IP |
| `/password-reset/confirm` | 5 requests | 1 hour per token |

**Implementation:** Redis-based rate limiting

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Cost factor: 12 (adjustable in config)
- Never store plain text passwords

**Validation:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$
```

### Token Security

**Access Token:**
- Algorithm: HS256 (or RS256 for distributed systems)
- Claims: `sub`, `email`, `role`, `type`, `exp`, `iat`
- Never expose secret key

**Refresh Token:**
- Cryptographically secure random generation
- Hashed before storage
- httpOnly cookie prevents XSS
- Secure flag in production
- SameSite=Strict prevents CSRF

---

## Request/Response Examples

### Example: Full Signup → Login → Protected Request Flow

**1. Signup:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!",
    "full_name": "John Doe",
    "role": "employee",
    "department": "Engineering"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!"
  }'
```

**3. Access Protected Endpoint:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**4. Refresh Token:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**5. Logout:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -b cookies.txt
```

---

## Pydantic Schema Definitions

### Request Schemas

```python
# app/schemas/auth.py

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import re

class SignupRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=72)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., pattern="^(employee|it_support|hr_support|admin)$")
    department: Optional[str] = Field(None, max_length=100)

    @validator('password')
    def validate_password_strength(cls, v):
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$'
        if not re.match(pattern, v):
            raise ValueError('Password must contain at least one uppercase letter, lowercase letter, number, and special character')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=64, max_length=64)
    new_password: str = Field(..., min_length=8, max_length=72)

    @validator('new_password')
    def validate_password_strength(cls, v):
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$'
        if not re.match(pattern, v):
            raise ValueError('Password must contain at least one uppercase letter, lowercase letter, number, and special character')
        return v
```

### Response Schemas

```python
# app/schemas/user.py

from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    department: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy model compatibility

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800
    user: UserResponse

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800

class MessageResponse(BaseModel):
    message: str
```

---

## Testing Checklist

### Endpoint Testing

**Signup:**
- [ ] Successful user registration
- [ ] Duplicate email rejection
- [ ] Invalid email format rejection
- [ ] Weak password rejection
- [ ] Missing required fields
- [ ] Invalid role value

**Login:**
- [ ] Successful login with correct credentials
- [ ] Failed login with wrong password
- [ ] Failed login with non-existent email
- [ ] Inactive account rejection
- [ ] Refresh token cookie set correctly

**Refresh:**
- [ ] Successful token refresh
- [ ] Invalid refresh token rejection
- [ ] Expired refresh token rejection
- [ ] Revoked refresh token rejection

**Logout:**
- [ ] Successful logout
- [ ] Refresh token revoked in database
- [ ] Cookie cleared properly

**Get Current User:**
- [ ] Successful retrieval with valid token
- [ ] Rejection with missing token
- [ ] Rejection with invalid token
- [ ] Rejection with expired token

**Password Reset:**
- [ ] Reset email sent for existing user
- [ ] Success message for non-existent email (security)
- [ ] Token generation and storage
- [ ] Successful password change with valid token
- [ ] Invalid token rejection
- [ ] Expired token rejection
- [ ] Used token rejection

---

## Frontend Integration Guide

### React Example

```typescript
// api/auth.ts

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface SignupData {
  email: string;
  password: string;
  full_name: string;
  role: string;
  department?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const authAPI = {
  signup: async (data: SignupData) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.json());
    return response.json();
  },

  login: async (data: LoginData) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.json());
    return response.json();
  },

  refresh: async () => {
    const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(await response.json());
    return response.json();
  },

  logout: async (accessToken: string) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (!response.ok) throw new Error(await response.json());
    return response.json();
  },

  getCurrentUser: async (accessToken: string) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(await response.json());
    return response.json();
  },
};
```

---

## API Versioning Strategy

**Current Version:** v1 (`/api/v1/auth`)

**Future versions:**
- Breaking changes → new version (`/api/v2/auth`)
- Non-breaking changes → same version
- Deprecation notice → 6 months before removal

---

## Questions or Changes?

This API contract should be reviewed and approved by both frontend and backend teams before implementation. Any changes to this contract should be documented and communicated to all stakeholders.

**Last Updated:** 2024-01-15
**Status:** Draft - Pending Review
