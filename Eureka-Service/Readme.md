# Eureka-Service

## What It Does

Service registry for Netlife. All other services register here so they can discover each other by logical name instead of hard-coded host:port.

## How It Works

This is a Spring Cloud Netflix Eureka Server. Client services (Gateway/Auth/Video services) are configured with:

- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL:http://localhost:8761/eureka}`

The API Gateway uses Eureka resolution for `lb://...` targets (client-side load balancing).

## Tech Stack
- Java 17
- Spring Boot 4.0.2
- Spring Cloud 2025.1.0

## Current Configuration
- `spring.application.name=eureka-server`
- `server.port=8761`
- `eureka.client.register-with-eureka=false`
- `eureka.client.fetch-registry=false`

## Run Locally
From `Eureka-Service`:

```bash
./mvnw spring-boot:run
```

On PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

## Local URL
- Dashboard: `http://localhost:8761`
- Registry endpoint: `http://localhost:8761/eureka`
