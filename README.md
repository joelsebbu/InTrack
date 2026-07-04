# InTrack

Expense tracker API backed by GitLab repository storage (Lambda + SAM).

## Deploy

1. Create a GitLab project access token with `api`, `read_repository`, `write_repository`.
2. Store the token in AWS Secrets Manager (plain string).
3. Create an auth secret in Secrets Manager (see `bootstrap/auth-secret.example.json`).
4. Bootstrap the GitLab repo with `metadata.json` on `main`.
5. Install SAM CLI and run:

```bash
npm install
sam build
sam deploy --guided
```

Set `GitLabProjectId`, `GitLabTokenSecretArn`, and `AuthSecretArn` when prompted.

## Authentication

OAuth2-style token endpoint with a single hardcoded user stored in Secrets Manager.

**Login (password grant):**

```bash
curl -X POST "$API_URL/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "username": "admin",
    "password": "your-password"
  }'
```

**Refresh:**

```bash
curl -X POST "$API_URL/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "<refresh_token>"
  }'
```

**Response:**

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "..."
}
```

All other endpoints require `Authorization: Bearer <access_token>`.

| Token | Lifetime |
|-------|----------|
| Access token | 15 minutes |
| Refresh token | 7 days |

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/oauth/token` | No | Issue access + refresh tokens |
| GET | `/metadata` | Yes | Category taxonomy |
| POST | `/add` | Yes | Add expense (commits to GitLab) |
| POST | `/reports/generate` | Yes | Read or compute report |
| POST | `/reports/save` | Yes | Commit report file |
| POST | `/reports/refresh` | Yes | Force recompute report |

## Calendar dates

Expense day files and report periods use IST (`Asia/Kolkata`) calendar dates.
For example, an expense timestamped `2026-07-04T02:00:00+05:30` is stored in
`expenses/2026/07/04.json`, and it invalidates the July 2026 monthly report.
