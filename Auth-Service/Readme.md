# Auth-Service

## What It Does

Provides authentication APIs for Netlife:

- Register users
- Authenticate credentials (username or email + password)
- Issue JWT access tokens
- Issue/validate refresh tokens (stored in Postgres)
- Logout by revoking refresh tokens

## How It Works

### Data Model (Postgres)

This service reads/writes:

- `person` (users)
- `refresh_token` (refresh tokens linked to a user)

The canonical schema is created by `shared-db` Flyway migrations.

### Login Flow

1. `POST /auth/login` hits [`AuthController`](src/main/java/com/spring/authservice/controller/AuthController.java).
2. [`AuthService.login`](src/main/java/com/spring/authservice/service/AuthService.java) authenticates via Spring Security’s `AuthenticationManager`.
3. Credentials are validated by [`UserDetailConfig`](src/main/java/com/spring/authservice/config/UserDetailConfig.java) which loads a `Person` by `username OR email`.
4. On success:
   - A JWT access token is created by [`JwtUtil`](src/main/java/com/spring/authservice/config/JwtUtil.java) with claims:
     - `userId`
     - `roles` (e.g. `ROLE_USER`)
   - A refresh token is generated (UUID) and persisted in `refresh_token`.

### Refresh Flow

`POST /auth/refresh` looks up the refresh token in `refresh_token`, checks expiry, and returns a new JWT access token.

### Logout Flow

`POST /auth/logout` deletes all refresh tokens for the associated user (token revocation via DB).

### Security Model

[`SecurityConfig`](src/main/java/com/spring/authservice/config/SecurityConfig.java) currently permits all requests (`anyRequest().permitAll()`), and access control is intended to be enforced at `Api-Gateway-Service`.

## API

Base path: `/auth`

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

## Configuration

- `server.port=8080`
- `spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/netlife}`
- `spring.datasource.username=${DB_USERNAME:alice}`
- `spring.datasource.password=${DB_PASSWORD:OmagaZ}`
- `jwt.secret=${JWT_SECRET:...}`
- `jwt.expiration-ms=600000`
- `refresh-token-expiration=3600000`
- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL:http://localhost:8761/eureka}`

## Run Locally

```bash
./mvnw spring-boot:run
```

Local URL: `http://localhost:8080`
