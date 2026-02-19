# Netlife

Netlife is a Spring Boot microservices project with service discovery, API gateway routing, and JWT-based authentication.

## Services
- `Eureka-Service` (`http://localhost:8761`)
  - Service registry (Spring Cloud Netflix Eureka server)
- `Auth-Service` (`http://localhost:8080`)
  - Authentication APIs, PostgreSQL persistence, JWT issue/refresh
- `Api-Gateway-Service` (`http://localhost:8765`)
  - Single entry point, `/auth/**` routing to `Auth-Service`, JWT verification for protected routes

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0
- PostgreSQL
- Flyway

## Request Flow
1. `Auth-Service` and `Api-Gateway-Service` register to `Eureka-Service`.
2. Clients call `Api-Gateway-Service` on `http://localhost:8765`.
3. Gateway routes `/auth/**` requests to `Auth-Service` using service discovery.
4. Public routes are allowed without token; protected routes require `Authorization: Bearer <jwt>`.

## Prerequisites
- JDK 17
- Maven Wrapper (`mvnw` scripts are included per service)
- PostgreSQL (for `Auth-Service`)

## Required Environment Variables
Set these before starting services:

- `EUREKA_SERVER_URL` (used by Gateway + Auth)
  - Example: `http://localhost:8761/eureka`
- `JWT_SECRET` (used by Gateway + Auth)
- `DB_URL` (Auth only)
  - Example: `jdbc:postgresql://localhost:5432/netlife`
- `DB_USERNAME` (Auth only)
- `DB_PASSWORD` (Auth only)

## Local Startup Order
1. Start `Eureka-Service`
2. Start `Auth-Service`
3. Start `Api-Gateway-Service`

## Run Commands
From each service folder:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```
