# Netlife

Netlife is a Spring Boot microservices project for authentication + an event-driven video pipeline (upload -> process -> deliver), wired together through Eureka service discovery and an API gateway.

## Services

- `Eureka-Service` (`http://localhost:8761`)
  - What: service registry.
  - How: Spring Cloud Netflix Eureka Server; other services register and the gateway resolves `lb://...` targets from the registry.

- `Api-Gateway-Service` (`http://localhost:8765`)
  - What: single entry point for clients.
  - How: Spring Cloud Gateway (MVC) routes requests by path/method to downstream services via Eureka load-balancing; validates JWTs on protected routes.

- `Auth-Service` (`http://localhost:8080`)
  - What: user registration/login and token lifecycle.
  - How: stores users in Postgres (`person`), issues JWT access tokens, stores refresh tokens in Postgres (`refresh_token`) for refresh/logout flows.

- `Video-Upload-Service` (`http://localhost:8081`)
  - What: initiates uploads and confirms when raw video bytes are present in object storage.
  - How: creates a `videos` DB row, returns a pre-signed MinIO PUT URL for direct upload, then verifies the object and publishes a Kafka event for processing.

- `Video-Processing-Service` (`http://localhost:8082`)
  - What: turns an uploaded MP4 into HLS (`index.m3u8` + `.ts` segments).
  - How: consumes the “video uploaded” Kafka event, downloads the raw object from MinIO, runs `ffmpeg`, uploads HLS artifacts back to MinIO, updates `videos.status` to `READY`.

- `Video-Delivery-Service` (`http://localhost:8083`)
  - What: serves playback and video metadata.
  - How: reads `processed/<videoId>/index.m3u8` from MinIO, rewrites `.ts` lines to short-lived pre-signed MinIO URLs, publishes/consumes Kafka view events to increment `videos.views`.

- `shared-db` (no HTTP server)
  - What: database migrations for the shared Postgres schema.
  - How: a non-web Spring Boot app that runs Flyway migrations (creates `person`, `refresh_token`, `videos`, etc.).

## How Requests/Events Flow

1. Services register with `Eureka-Service`.
2. Clients call `Api-Gateway-Service`:
   - Auth: `/auth/**` -> `Auth-Service`.
   - Upload: `POST /videos/initiate-upload` + `POST /videos/complete-upload` -> `Video-Upload-Service` (JWT required).
   - Playback/metadata: `GET /videos/**` -> `Video-Delivery-Service` (public by default).
3. `Video-Upload-Service` publishes `{ "videoId": "..." }` to Kafka after confirming the raw object exists.
4. `Video-Processing-Service` consumes that event, generates HLS, uploads to MinIO, and marks the DB row as `READY`.
5. `Video-Delivery-Service` serves HLS playlists with signed segment URLs and tracks views via Kafka.

## Tech Stack

- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0
- PostgreSQL + Flyway
- MinIO (S3-compatible storage)
- Kafka

## Configuration (Common)

- `EUREKA_SERVER_URL` (Eureka clients)
  - Default: `http://localhost:8761/eureka`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (services that talk to Postgres)
  - Default DB: `jdbc:postgresql://localhost:5432/netlife`
- `JWT_SECRET` (Auth + Gateway)
- `KAFKA_BOOTSTRAP_SERVERS` (video pipeline)
  - Default: `localhost:29092`

## Running Locally (High Level)

1. Start Postgres and run migrations (see `shared-db/README.md`).
2. Start Kafka + MinIO (see `Video-Upload-Service/docker-compose.yml`).
3. Start services: `Eureka-Service` -> `Auth-Service` -> `Api-Gateway-Service` -> video services.

Each service can be run from its folder with:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```
