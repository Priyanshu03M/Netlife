# Video Upload Service

Spring Boot service for uploading video files to MinIO and storing upload metadata in PostgreSQL.

## What It Does

- Accepts multipart video uploads over HTTP.
- Validates that the uploaded file is present and has a `video/*` content type.
- Stores the file in a MinIO bucket.
- Persists upload metadata in the `videos` table.
- Returns a JSON response with upload details.

## Tech Stack

- Java 17
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- PostgreSQL
- MinIO
- Maven
- Docker
- Eureka Client dependency included

## Project Structure

```text
src/main/java/com/spring/videouploadservice
|-- config
|   `-- MinioConfig.java
|-- controller
|   `-- UploadController.java
|-- dto
|   |-- UploadResponseDto.java
|   `-- UploadVideoDto.java
|-- entity
|   `-- VideoMetadata.java
|-- repository
|   `-- VideoMetadataRepository.java
`-- service
    `-- UploadService.java
```

## Configuration

Application settings are defined in [`src/main/resources/application.properties`](/E:/Netlife/Video-Upload-Service/src/main/resources/application.properties).

### Required Environment Variables

Set these before starting the service:

```properties
DB_URL=jdbc:postgresql://localhost:5432/video_upload
DB_USERNAME=postgres
DB_PASSWORD=postgres
EUREKA_SERVER_URL=http://localhost:8761/eureka
```

### Built-in Defaults

These values are currently hardcoded in `application.properties`:

```properties
server.port=8081
spring.servlet.multipart.max-file-size=500MB
spring.servlet.multipart.max-request-size=500MB

minio.url=http://localhost:9000
minio.accessKey=minioadmin
minio.secretKey=minioadmin123
minio.bucket=videos
```

### Important Notes

- Flyway is present but currently disabled: `spring.flyway.enabled=false`
- Eureka client registration and registry fetch are both disabled
- The service expects PostgreSQL and MinIO to be available when upload requests are handled

## API

### Upload Video

- Method: `POST`
- Path: `/videos/upload`
- Content-Type: `multipart/form-data`
- Required header: `X-User-Id`

### Form Fields

- `file`: video file
- `title`: video title
- `description`: video description

### Example cURL

```bash
curl -X POST "http://localhost:8081/videos/upload" \
  -H "X-User-Id: 11111111-1111-1111-1111-111111111111" \
  -F "file=@sample.mp4" \
  -F "title=Demo Video" \
  -F "description=Upload test"
```

### Success Response

Status: `201 Created`

```json
{
  "status": "UPLOADED",
  "bucket": "videos",
  "objectKey": "11111111-1111-1111-1111-111111111111/550e8400-e29b-41d4-a716-446655440000/sample.mp4",
  "title": "Demo Video",
  "description": "Upload test",
  "contentType": "video/mp4",
  "size": 1234567,
  "userId": "11111111-1111-1111-1111-111111111111"
}
```

### Error Responses

- `400 Bad Request`: empty file or unsupported content type
- `500 Internal Server Error`: upload or storage failure

## Upload Flow

1. Controller receives multipart request and `X-User-Id` header.
2. Service validates file presence and MIME type.
3. Service creates a unique object key in the format:

```text
<userId>/<random-uuid>/<sanitized-original-file-name>
```

4. Service ensures the MinIO bucket exists.
5. Service uploads the video to MinIO.
6. Service stores metadata in PostgreSQL.
7. Service returns upload details to the client.

## Database

The service maps video metadata to the `videos` table through [`src/main/java/com/spring/videouploadservice/entity/VideoMetadata.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/entity/VideoMetadata.java).

Migration script:
- [`src/main/resources/db/migration/V2__video_table.sql`](/E:/Netlife/Video-Upload-Service/src/main/resources/db/migration/V2__video_table.sql)

Stored fields include:

- `id`
- `user_id`
- `title`
- `description`
- `bucket_url`
- `object_key`
- `duration`
- `size`
- `format`
- `status`
- `created_at`

## Running Locally

### 1. Start PostgreSQL and MinIO

Make sure both services are running and reachable using the configured values.

### 2. Export Environment Variables

PowerShell:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/video_upload"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:EUREKA_SERVER_URL="http://localhost:8761/eureka"
```

### 3. Start the Service

Using Maven Wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

Or build a jar:

```powershell
.\mvnw.cmd clean package
java -jar target\VideoUploadService-0.0.1-SNAPSHOT.jar
```

## Docker

Build image:

```powershell
docker build -t video-upload-service .
```

Run container:

```powershell
docker run -p 8081:8081 `
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/video_upload" `
  -e DB_USERNAME="postgres" `
  -e DB_PASSWORD="postgres" `
  -e EUREKA_SERVER_URL="http://host.docker.internal:8761/eureka" `
  video-upload-service
```

## Current Gaps

- No authentication or authorization beyond the `X-User-Id` header.
- Flyway migrations will not run unless Flyway is enabled.
- There is only a minimal default test class in the repository.
- The database migration defines UUID columns, while the entity currently stores `String` values. That should be reviewed before production use.

## Useful Files

- [`pom.xml`](/E:/Netlife/Video-Upload-Service/pom.xml)
- [`Dockerfile`](/E:/Netlife/Video-Upload-Service/Dockerfile)
- [`src/main/java/com/spring/videouploadservice/controller/UploadController.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/controller/UploadController.java)
- [`src/main/java/com/spring/videouploadservice/service/UploadService.java`](/E:/Netlife/Video-Upload-Service/src/main/java/com/spring/videouploadservice/service/UploadService.java)
