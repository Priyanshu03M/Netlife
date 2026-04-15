# Video Upload Service

Spring Boot service that provides a two-step upload workflow:

1. Create an upload: persist video metadata and return a **pre-signed MinIO PUT URL**.
2. Complete an upload: verify the object exists in MinIO, mark the video as uploaded, and publish a Kafka event for downstream processing.

## What It Does (In Practice)

- Returns a pre-signed URL so clients upload video bytes directly to object storage (MinIO), not through this service.
- Stores and updates upload state in Postgres (`UPLOADING` -> `UPLOADED` or `FAILED`).
- Emits a Kafka event when an upload is confirmed, enabling an async video-processing pipeline.

## How It Does It (Code Flow)

### 1) Initiate Upload (`POST /videos/initiate-upload`)

Implemented in `UploadController` -> `UploadService.uploadVideoMetadata(...)`.

1. Validates input (`UploadService.validateUpload`).
2. Generates a `videoId` (UUID) for the DB record.
3. Builds an object key (currently `raw/<id>/original.mp4` via `UploadService.buildObjectKey(...)`).
4. Generates a pre-signed **PUT** URL using MinIO SDK (`MinioClient.getPresignedObjectUrl`) with 1-day expiry.
5. Persists a `VideoMetadata` row with:
   - `status=UPLOADING`
   - `objectKey=<raw/.../original.mp4>`
   - timestamps
6. Returns `UploadResponseDto { status, url, videoId }`.

Notes:

- The controller uses the `X-Client-ID` header as `userId` (stored in `videos.user_id`). In the shared schema, `videos.user_id` has a foreign key to `person.id`, so in practice this header should be the authenticated user id (today it is still passed explicitly as a header).

### 2) Client Uploads Bytes to MinIO

The client uses the returned pre-signed URL to `PUT` the file directly into the configured bucket. This service does not stream or proxy the upload.

### 3) Complete Upload (`POST /videos/complete-upload`)

Implemented in `UploadController` -> `UploadService.completeUpload(...)`.

1. Loads the `VideoMetadata` row by `videoId`.
2. If already `UPLOADED`, returns immediately.
3. Calls `minioClient.statObject(...)` on `bucket + objectKey` to verify the uploaded object exists.
4. On success:
   - updates status to `UPLOADED`
   - persists the change
   - publishes `CompleteVideoRequestDto { videoId }` to Kafka via `KafkaTemplate`
5. On failure:
   - updates status to `FAILED`
   - persists the change
   - throws `StorageException`

### Error Handling

`GlobalExceptionHandler` maps:

- `BadRequestException` -> HTTP 400 with `ErrorResponseDto`
- `StorageException` -> HTTP 500 with `ErrorResponseDto`

## Tech Stack

- Java 17, Spring Boot 4.x (WebMVC, Security)
- Spring Data JPA (PostgreSQL)
- MinIO (S3-compatible object storage)
- Kafka (event publication)

## Quickstart (Local)

### Prerequisites

- Java 17
- Docker + Docker Compose

### Start Dependencies (Kafka + MinIO)

```bash
docker compose up -d
```

`Video-Upload-Service/docker-compose.yml` exposes:

- Kafka (host): `localhost:29092`
- MinIO S3 API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001` (default credentials below)

MinIO defaults from `Video-Upload-Service/docker-compose.yml`:

- `MINIO_ROOT_USER=minioadmin`
- `MINIO_ROOT_PASSWORD=minioadmin123`

### Start Postgres

`Video-Upload-Service/docker-compose.yml` does not include Postgres. Run it locally via Docker:

```bash
docker run --rm -d \
  --name video-upload-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=netlife \
  -e POSTGRES_USER=alice \
  -e POSTGRES_PASSWORD=OmagaZ \
  postgres:16
```

### Create the MinIO Bucket

The service expects bucket name `videos` (see `minio.bucket` in `application.properties`).

Create it via the MinIO Console:

1. Open `http://localhost:9001`
2. Login with `minioadmin` / `minioadmin123`
3. Create bucket named `videos`

### Run the Service

```bash
./mvnw spring-boot:run
```

By default the service runs on `http://localhost:8081`.

## Configuration

Defaults are defined in `src/main/resources/application.properties`. Common overrides:

- `DB_URL` (default `jdbc:postgresql://localhost:5432/netlife`)
- `DB_USERNAME` (default `alice`)
- `DB_PASSWORD` (default `OmagaZ`)
- `KAFKA_BOOTSTRAP_SERVERS` (default `localhost:29092`)
- `EUREKA_SERVER_URL` (default `http://localhost:8761/eureka`)
- `minio.url` (default `http://localhost:9000`)
- `minio.accessKey` (default `minioadmin`)
- `minio.secretKey` (default `minioadmin123`)
- `minio.bucket` (default `videos`)
- `app.kafka.topic.video-uploaded` (default `video-processing-topic`)

Example:

```bash
export DB_URL="jdbc:postgresql://localhost:5432/netlife"
export DB_USERNAME="alice"
export DB_PASSWORD="OmagaZ"
export KAFKA_BOOTSTRAP_SERVERS="localhost:29092"
./mvnw spring-boot:run
```

## API

### Initiate Upload

`POST /videos/initiate-upload`

Request:

```json
{
  "title": "My Video",
  "description": "Optional description"
}
```

Example:

```bash
curl -sS -X POST "http://localhost:8081/videos/initiate-upload" \
  -H "X-Client-ID: <person-id>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Video","description":"Optional description"}'
```

Response (example):

```json
{
  "status": "UPLOADING",
  "url": "http://localhost:9000/videos/raw/<id>/original.mp4?X-Amz-Algorithm=...",
  "videoId": "<uuid>"
}
```

### Upload File to MinIO (Using the Pre-Signed URL)

Use the `url` returned by `initiate-upload`:

```bash
curl -sS -X PUT --upload-file ./original.mp4 "<PRESIGNED_URL>"
```

### Complete Upload

`POST /videos/complete-upload`

Request:

```json
{
  "videoId": "<uuid>"
}
```

Example:

```bash
curl -sS -X POST "http://localhost:8081/videos/complete-upload" \
  -H "Content-Type: application/json" \
  -d '{"videoId":"<uuid>"}'
```

Response body is a string: `UPLOADED` (or an error response on failure).

### Error Response Format

On handled errors (e.g., bad request), the API returns:

```json
{
  "timestamp": "2026-04-14T12:34:56.789",
  "status": 400,
  "error": "Bad Request",
  "message": "Title is required",
  "path": "/videos/initiate-upload"
}
```

## Current Limitations

- Authentication/authorization is not enforced inside this service (`SecurityConfig` permits all requests). `UploadController` uses `X-Client-ID` as `userId` instead of deriving it from a JWT claim.
- This service does not create or migrate DB schema (`spring.jpa.hibernate.ddl-auto=none`). Use `shared-db` to apply the Flyway migrations.
- Upload is single-object PUT (not multipart). The service generates pre-signed **PUT** URLs only.

## Tests

```bash
./mvnw test
```
