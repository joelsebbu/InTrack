# InTrack

Expense tracker API backed by GitLab repository storage (Lambda + SAM).

## Deploy

1. Create a GitLab project access token with `api`, `read_repository`, `write_repository`.
2. Store the token in AWS Secrets Manager (plain string).
3. Bootstrap the repo with `metadata.json` on `main`.
4. Install SAM CLI and run:

```bash
npm install
sam build
sam deploy --guided
```

Set `GitLabProjectId` and `GitLabTokenSecretArn` when prompted.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/metadata` | Category taxonomy |
| POST | `/add` | Add expense (commits to GitLab) |
| POST | `/reports/generate` | Read or compute report |
| POST | `/reports/save` | Commit report file |
| POST | `/reports/refresh` | Force recompute report |
