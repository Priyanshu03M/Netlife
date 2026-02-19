# Netlife

Netlife is a Spring Boot microservices project in active development.

## Current Scope
- Service discovery with Eureka
- API routing through a Gateway service
- Authentication service with JWT and PostgreSQL

## Services
- `Eureka-Service`: Eureka server (`http://localhost:8761`)
- `Api-Gateway-Service`: Gateway entry point (`http://localhost:8765`)
- `Auth-Service`: Auth APIs (`/auth/**`), registered with Eureka

## High-Level Flow
1. Services register with `Eureka-Service`.
2. `Api-Gateway-Service` resolves services through Eureka.
3. Client requests to `/auth/**` are routed to `Auth-Service`.

## Local Run Order (Current)
1. Start `Eureka-Service`
2. Start `Auth-Service` (with DB and env vars configured)
3. Start `Api-Gateway-Service`

## Status
This is the current baseline architecture. Additional domain services and features can be added behind the gateway as the project expands.
