# Agentic Ticketing System - Project Specifications

## Project Overview

An intelligent, microservice-based ticketing system with an agentic chatbot that handles user requests, analyzes priorities, routes to appropriate agents, and manages the entire ticket lifecycle with email notifications.

---

## System Flow

1. **User submits request** through authenticated chat interface
   - Examples: "My laptop broke", "I need to apply for leave", "I need to submit my tax form"

2. **Chatbot analyzes the request**
   - Classifies request type (IT/HR/Admin/etc.)
   - Determines priority/urgency level

3. **Routes to appropriate agents**
   - Agents can be:
     - **Autonomous AI agents** (for simple automated tasks like password resets, FAQ answers)
     - **Backend services** (for programmatic workflows, database updates, form processing)
     - **Human teams** (for complex issues requiring human intervention)

4. **Email notifications sent to user**
   - Ticket creation confirmation
   - Priority assignment
   - Progress updates
   - Final resolution notification

5. **Ticket lifecycle management**
   - Track status across all agent types
   - Orchestrate end-to-end process regardless of handler type

---

## Tech Stack

### Frontend
- **React** - Chat interface for user request submission

### Backend/API Layer
- **Python** (FastAPI or Flask) - Main API for authentication, request processing, and orchestration
- **JWT/OAuth2** - Authentication mechanism

### AI/LLM Layer
- **LLM** (Claude, GPT, or open-source models) - Request understanding, classification, priority determination, routing
- **LangChain** (or similar) - Agentic orchestration framework

### Microservices Architecture
- Individual Python services for each agent type:
  - IT Agent Service
  - HR Agent Service
  - Admin Agent Service
  - (Additional domain-specific services as needed)

### Message Queue/Event Bus
- **RabbitMQ, Kafka, or Redis** - Async communication between services, request routing, response handling

### Database
- **PostgreSQL or MongoDB** - Tickets, user data, request history, status tracking
- **Redis** - Caching and session management

### Email Service
- **SendGrid, AWS SES** (or similar) - Notification delivery

### Orchestration/Deployment
- **Docker** - Container for each microservice
- **Kubernetes or Docker Compose** - Service management and orchestration
- **API Gateway** (Kong or AWS API Gateway) - Request routing

---

## Authentication & Authorization

### Microservice Design Decision
- **Auth service is a separate microservice**
- All other microservices validate JWT tokens independently using shared secret/public key
- Auth service only called for login/signup/refresh operations (decoupled, scalable approach)

### Signup Flow

1. User fills registration form (email, password, name, role/department)
2. Frontend sends signup request to auth service
3. Backend validates data:
   - Email format validation
   - Password strength requirements
   - Duplicate email check
4. Password hashed using **bcrypt or argon2**
5. User data saved to database
6. **Optional:** Send verification email
7. Return success response

### Login Flow

1. User enters email and password
2. Frontend sends login request to auth service
3. Backend verifies user exists in database
4. Password verification via hash comparison
5. On success, generate two JWT tokens:
   - **Access Token** (short-lived: 15-30 minutes)
     - Contains: user ID, role, permissions
   - **Refresh Token** (long-lived: 7-30 days)
     - Stored in database for validation
6. Return both tokens to frontend
7. Frontend storage:
   - Access token: memory or state
   - Refresh token: httpOnly cookie (security best practice)

### Authenticated Requests

1. User makes request to chatbot/ticketing system
2. Frontend includes access token in Authorization header: `Bearer <token>`
3. Backend middleware validates token:
   - Signature verification
   - Expiration check
4. On valid token: extract user info and process request
5. On expired token: trigger refresh flow

### Token Refresh Flow

1. Access token expires
2. Frontend automatically sends refresh token to backend
3. Backend validates refresh token against database
4. On valid refresh token:
   - Issue new access token
   - **Optional:** Issue new refresh token (rotation)
5. On invalid/expired refresh token: require user login

### Logout Flow

1. Frontend discards tokens
2. Backend invalidates/deletes refresh token from database
3. **Optional:** Maintain token blacklist for revoked access tokens

---

## Key Architecture Decisions

### Agent Flexibility
- System supports heterogeneous agents (AI/service/human)
- Smart routing based on request complexity and type
- Unified orchestration regardless of agent type

### Microservice Independence
- Each domain service operates independently
- Loose coupling via message queue
- Independent scaling per service load

### Token Validation Strategy
- Distributed JWT validation (shared secret/public key)
- Reduces auth service dependency
- Improves performance and scalability

### Email Integration
- Async notification system
- Lifecycle tracking via email updates
- User-friendly status communication

---

## Next Steps

1. Define detailed API contracts between microservices
2. Design database schema for tickets and user data
3. Set up development environment and infrastructure
4. Implement auth microservice first (foundation)
5. Build chatbot orchestrator with LLM integration
6. Develop individual agent microservices
7. Implement email notification system
8. Set up message queue for inter-service communication
9. Containerize services with Docker
10. Deploy and test end-to-end flows