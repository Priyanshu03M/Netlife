# Video Upload Service

Spring Boot service that creates presigned MinIO upload URLs, stores upload metadata in PostgreSQL, and emits a Kafka event after upload completion is confirmed.

## Overview

The service currently exposes a two-step upload flow:

1. `POST /videos/initiate-upload`
Creates a database record with status `UPLOADING`, generates a presigned MinIO `PUT` URL, and returns the URL plus the generated `videoId`.

2. `POST /videos/complete-upload`
Verifies that the object exists in MinIO, marks the video as `UPLOADED`, and publishes a Kafka message for downstream processing.

The actual file bytes are not proxied through this service. Clients upload directly to MinIO using the returned presigned URL.

## Tech Stack

- Java 17
- Spring Boot 4.0.4
- Spring Web MVC
- Spring Data JPA
- Flyway
- PostgreSQL
- MinIO
- Kafka
- Spring Security
- Eureka client dependency present but registration disabled

## Project Structure

```text
src/main/java/com/spring/videouploadservice
|-- config
|   |-- MinioConfig.java
|   `-- SecurityConfig.java
|-- controller
|   `-- UploadController.java
|-- dto
|   |-- CompleteVideoRequestDto.java
|   |-- ErrorResponseDto.java
|   |-- UploadResponseDto.java
|   `-- UploadVideoRequestDto.java
|-- entity
|   `-- VideoMetadata.java
|-- exception
|   |-- BadRequestException.java
|   |-- GlobalExceptionHandler.java
|   `-- StorageException.java
|-- repository
|   `-- VideoMetadataRepository.java
`-- service
    `-- UploadService.java
```

## Configuration

Primary configuration lives in [`application.properties`](/E:/Netlife/Video-Upload-Service/src/main/resources/application.properties).

### Database

The service uses PostgreSQL and Flyway.

Default values:

```properties
DB_URL=jdbc:postgresql://localhost:5432/Videos
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

Runtime settings:

```properties
spring.flyway.enabled=true
spring.jpa.hibernate.ddl-auto=validate
```

Flyway migration scripts are stored in [`src/main/resources/db/migration`](/E:/Netlife/Video-Upload-Service/src/main/resources/db/migration).

### MinIO

Default values:

```properties
minio.url=http://localhost:9000
minio.accessKey=minioadmin
minio.secretKey=minioadmin123
minio.bucket=videos
```

Important: the code does not create the bucket automatically. The configured bucket must already exist in MinIO.

### Kafka

Default values:

```properties
spring.kafka.bootstrap-servers=localhost:9092
app.kafka.topic.video-uploaded=video-processing-topic
```

### Eureka

Eureka client dependency is included, but service registration and registry fetch are disabled by configuration.

## API

Base path: `/videos`

### 1. Initiate Upload

- Method: `POST`
- Path: `/videos/initiate-upload`
- Content-Type: `application/json`

Request body:

```json
{
  "title": "Demo video",
  "description": "Upload test"
}
```

Behavior:

- The controller currently generates a random `userId` server-side for testing.
- The request `userId` field is not sourced from authentication yet.
- The service creates a `videos` row with status `UPLOADING`.
- A presigned MinIO `PUT` URL is returned.

Example response:

```json
{
  "status": "UPLOADING",
  "url": "http://localhost:9000/videos/....",
  "videoId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Upload File to MinIO

Use the returned presigned URL to upload the file directly to MinIO with an HTTP `PUT`.

Example:

```bash
curl -X PUT "<presigned-url>" \
  --upload-file sample.mp4
```

### 3. Complete Upload

- Method: `POST`
- Path: `/videos/complete-upload`
- Content-Type: `application/json`

Request body:

```json
{
  "videoId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Behavior:

- The service looks up the metadata row by `videoId`.
- It checks object existence in MinIO using `statObject`.
- On success it sets status to `UPLOADED`.
- It publishes the completion payload to Kafka.
- On failure it sets status to `FAILED` and returns an error.

Example response:

```text
UPLOADED
```

## Error Handling

Global error handling is implemented in [`GlobalExceptionHandler.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/exception/GlobalExceptionHandler.java).

Mapped exceptions:

- `BadRequestException` -> `400 Bad Request`
- `StorageException` -> `500 Internal Server Error`

Error response shape:

```json
{
  "timestamp": "2026-03-25T20:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Title is required",
  "path": "/videos/initiate-upload"
}
```

## Security

[`SecurityConfig.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/config/SecurityConfig.java) configures the service as stateless and currently permits every request.

Current state:

- CSRF disabled
- HTTP Basic disabled
- Form login disabled
- All endpoints are publicly accessible

## Data Model

Flyway creates the `videos` table from [`V1__create_videos_table.sql`](/E:/Netlife/Video-Upload-Service/src/main/resources/db/migration/V1__create_videos_table.sql).

The corresponding entity is [`VideoMetadata.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/entity/VideoMetadata.java).

Stored fields:

- `id`
- `user_id`
- `title`
- `description`
- `processed_path`
- `object_key`
- `views`
- `size`
- `duration`
- `status`
- `created_at`
- `updated_at`

## Running Locally

### 1. Start Infrastructure

The repository includes Docker Compose for PostgreSQL, MinIO, and Kafka:

```powershell
docker compose up -d
```

Services started by Compose:

- PostgreSQL on `localhost:5432` with database `Videos`
- MinIO API on `localhost:9000`
- MinIO console on `localhost:9001`
- Kafka on `localhost:9092`

### 2. Ensure the MinIO Bucket Exists

Create the `videos` bucket in MinIO if it does not already exist.

### 3. Start the Application

Using Maven Wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

Or build and run the jar:

```powershell
.\mvnw.cmd clean package
java -jar target\Video-Upload-Service-0.0.1-SNAPSHOT.jar
```

The service runs on `http://localhost:8081`.

## Docker Image

Build the application image:

```powershell
docker build -t video-upload-service .
```

Run the application container against the Compose-managed infrastructure on the host:

```powershell
docker run -p 8081:8081 `
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/Videos" `
  -e DB_USERNAME="postgres" `
  -e DB_PASSWORD="postgres" `
  -e KAFKA_BOOTSTRAP_SERVERS="host.docker.internal:9092" `
  -e EUREKA_SERVER_URL="http://host.docker.internal:8761/eureka" `
  video-upload-service
```

## Testing

Current automated test coverage is minimal. The repository only contains a Spring context load test in [`VideoUploadServiceApplicationTests.java`](/E:/Netlife/Video-Upload-Service/src/test/java/com/spring/videouploadservice/VideoUploadServiceApplicationTests.java).

## Current Gaps

- No authenticated user flow; `userId` is generated in the controller for testing.
- No MinIO bucket bootstrap logic.
- No validation annotations on DTOs; validation is manual and limited.
- `complete-upload` returns a plain string instead of a structured response object.
- The code assumes Kafka and MinIO are available when completion is requested.
- Test coverage is not sufficient for production changes.

## Useful Files

- [`docker-compose.yml`](/E:/Netlife/Video-Upload-Service/docker-compose.yml)
- [`Dockerfile`](/E:/Netlife/Video-Upload-Service/Dockerfile)
- [`application.properties`](/E:/Netlife/Video-Upload-Service/src/main/resources/application.properties)
- [`UploadController.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/controller/UploadController.java)
- [`UploadService.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/service/UploadService.java)
- [`VideoMetadata.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/entity/VideoMetadata.java)
