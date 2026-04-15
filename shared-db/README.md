# shared-db

## What It Does

Owns the shared Postgres schema for Netlife and applies it via Flyway migrations (users, refresh tokens, videos metadata).

## How It Works

This is a non-web Spring Boot application (`spring.main.web-application-type=none`) with Flyway enabled. On startup it runs migrations from `src/main/resources/db/migration` against the configured Postgres database.

Current migrations create:

- `person`
- `refresh_token`
- `videos` (with `videos.user_id` referencing `person.id`)

## Configuration

Defaults are in `src/main/resources/application.properties` and can be overridden via env vars:

- `DB_URL` (default `jdbc:postgresql://localhost:5432/netlife`)
- `DB_USERNAME` (default `alice`)
- `DB_PASSWORD` (default `OmagaZ`)

## Run Locally

Run this once whenever you need to bootstrap or upgrade the DB schema:

```bash
./mvnw spring-boot:run
```

It will exit after applying migrations (or keep running briefly depending on Spring lifecycle), and can be re-run safely (Flyway tracks applied versions).

