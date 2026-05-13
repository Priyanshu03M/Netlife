# User-Service

## What It Does

Provides user/profile APIs backed by the shared Postgres schema (`person` table). This service registers with Eureka so it can be discovered by other services if/when routed through the gateway.

## API

Base path: `/users`

- `GET /users/{username}/info`
  - Returns basic user info (used by `Video-Upload-Service` to resolve `username -> userId`).
- `GET /users/{userId}/fullinfo`
  - Returns a richer user payload (`UserFullInfo`).
- `GET /users/{userId}/videos`
  - Returns a list of video IDs for the given user (proxied from `Video-Delivery-Service` `GET /videos/{userId}/feed`).
- `DELETE /users/{userId}/videos/{videoId}`
  - Deletes a user’s video (proxied to `Video-Delivery-Service` `DELETE /videos/{userId}/{videoId}`).

## Configuration

Defaults are in `src/main/resources/application.properties` and can be overridden via env vars:

- `server.port` (default `8084`)
- `DB_URL` (default `jdbc:postgresql://localhost:5432/netlife`)
- `DB_USERNAME` (default `alice`)
- `DB_PASSWORD` (default `OmagaZ`)
- `EUREKA_SERVER_URL` (default `http://localhost:8761/eureka`)

This service expects the DB schema to already exist (run `shared-db` first).

## Run Locally

From `User-Service/`:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Local URL: `http://localhost:8084`

