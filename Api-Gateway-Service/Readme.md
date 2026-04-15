# Api-Gateway-Service

## What It Does

Acts as the single entry point for Netlife. It routes HTTP requests to internal services using Eureka service discovery and enforces JWT-based authentication for protected routes.

## How It Works

### Routing (Spring Cloud Gateway MVC)

Routes are defined in [`GatewayRoutesConfig`](src/main/java/com/spring/apigatewayservice/GatewayRoutesConfig.java) and use the MVC router-function style with a load-balancer filter:

- Auth:
  - Matches: `Path=/auth/**`
  - Target: `lb://AUTHSERVICE`
- Video upload:
  - Matches: `POST /videos/initiate-upload`, `POST /videos/complete-upload`
  - Target: `lb://VIDEOUPLOADSERVICE`
- Video delivery:
  - Matches: `GET /videos/**`
  - Target: `lb://VIDEODELIVERYSERVICE`

`lb://...` targets are resolved from the Eureka registry.

### AuthZ/AuthN (Spring Security + JWT)

Security is configured in [`SecurityConfig`](src/main/java/com/spring/apigatewayservice/SecurityConfig.java) and the JWT is validated in [`JwtAuthenticationFilter`](src/main/java/com/spring/apigatewayservice/JwtAuthenticationFilter.java):

- Public:
  - `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`
  - `GET /videos/**`
- Protected (JWT required):
  - `POST /videos/initiate-upload`
  - `POST /videos/complete-upload`
  - Anything else by default

When a bearer token is present, the filter validates it and puts an authentication object in the `SecurityContext` with:

- Principal: `userId` (from JWT claim `userId`)
- Authorities: `roles` (from JWT claim `roles`)

Header format:

`Authorization: Bearer <jwt>`

## Configuration

- `server.port=8765`
- `eureka.client.service-url.defaultZone=${EUREKA_SERVER_URL:http://localhost:8761/eureka}`
- `jwt.secret=${JWT_SECRET:...}`

## Run Locally

```bash
./mvnw spring-boot:run
```

Local URL: `http://localhost:8765`
