# Video Processing Service

An event-driven worker that takes an uploaded video and produces **HLS** output (a playlist + segment files), storing everything in **MinIO** and tracking state in **Postgres**.

## What It Does

Given a `videoId` event, the service converts the corresponding source video into HLS and marks it ready for streaming.

### End-to-end behavior

1. **Consume event from Kafka**: listens on `app.kafka.topic.video-uploaded` for a JSON payload containing `videoId`.
2. **Load metadata from Postgres**: fetches `videos.id = videoId`.
3. **Gate on status**: processing starts only if `videos.status == UPLOADED`. This makes re-delivered messages effectively no-ops once a video has moved past `UPLOADED`.
4. **Download source from MinIO**: verifies the object exists, then downloads it to a temp folder as `input.mp4`.
5. **Generate HLS with FFmpeg**: shells out to `ffmpeg` to produce `index.m3u8` + `.ts` segment files.
6. **Upload processed output to MinIO**: uploads `index.m3u8` and all `.ts` files to `processed/<videoId>/...`.
7. **Update status in Postgres**: `UPLOADED -> PROCESSING -> READY`, or `FAILED` on any exception (download, ffmpeg, upload).
8. **Cleanup**: deletes the temp directory (with a safety guard to avoid deleting unrelated paths).

## How It Does It (Concrete Mechanics)

### Kafka consumer

The worker is driven by a Spring Kafka listener (`@KafkaListener`). Default topic is `video-processing-topic`.

Payload shape:

```json
{ "videoId": "abc123" }
```

If the message is missing `videoId`, it is ignored.

### Postgres state machine

The `videos` table row is treated as the source of truth for state:

- Required fields: `id`, `object_key`, `status`
- Status transitions: `UPLOADED -> PROCESSING -> READY` or `UPLOADED -> PROCESSING -> FAILED`

### MinIO I/O

Bucket: `minio.bucket` (default `videos`)

- **Source input** (read): `s3://<bucket>/<videos.object_key>`
- **Processed output** (write): `s3://<bucket>/processed/<videoId>/index.m3u8` and `s3://<bucket>/processed/<videoId>/*.ts`

### FFmpeg invocation (HLS packaging)

The service runs `ffmpeg` as an external process (must be on `PATH`) with the equivalent command:

```bash
ffmpeg -i input.mp4 -codec copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls index.m3u8
```

Notes:

- It uses `-codec copy` (no transcoding). The input must already be compatible with HLS segmenting.
- FFmpeg logs are streamed into application logs under `[FFMPEG] ...`.
- Temporary work is done in a directory named like `video-<videoId>-*` (created via `Files.createTempDirectory`).
- Upload only includes `.m3u8` and `.ts` files from the output directory; other files are ignored.

## Dependencies

- Java 17
- `ffmpeg` on `PATH`
- Kafka
- MinIO
- Postgres (must already contain the `videos` row)

`Video-Processing-Service/docker-compose.yml` provides Kafka + MinIO (no Postgres).

## Key Configuration

In `src/main/resources/application.properties`:

- Kafka: `spring.kafka.bootstrap-servers`, `app.kafka.topic.video-uploaded`
- MinIO: `minio.url`, `minio.accessKey`, `minio.secretKey`, `minio.bucket`
- DB: `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`
