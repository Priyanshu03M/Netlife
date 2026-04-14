# Video Delivery Service

Spring Boot service that delivers HLS video playback by returning an `index.m3u8` playlist whose `.ts` segment URLs are rewritten as short-lived, pre-signed MinIO URLs. It also serves video metadata from Postgres and tracks view counts asynchronously via Kafka.

## What It Does

- **Playback**: `GET /videos/{id}/play` returns an HLS playlist (`application/vnd.apple.mpegurl`). Segment lines ending with `.ts` are replaced with **pre-signed** MinIO URLs (default expiry: 30 minutes).
- **Metadata**: `GET /videos/{id}` returns title/description/size/duration/views from Postgres.
- **Feed**: `GET /videos/feed` returns IDs of videos whose DB `status` is `READY`.
- **View counting**: each playback request publishes a Kafka event; a Kafka consumer increments the `views` column in Postgres.

## How It Works (Flow)

1. **Client requests playback**: `GET /videos/{id}/play`.
2. **Service reads the HLS playlist from MinIO**:
   - Bucket: `${minio.bucket}` (default `videos`)
   - Object key: `processed/{videoId}/index.m3u8`
3. **Service rewrites `.ts` lines**:
   - For each line in `index.m3u8` that ends with `.ts`, it generates a MinIO **pre-signed GET URL** and replaces that line.
   - Non-`.ts` lines (HLS directives like `#EXTM3U`) are returned as-is.
4. **Service publishes a view event to Kafka**:
   - Topic: `${app.kafka.topic.video-view}` (default `video-view-topic`)
   - Payload: `{"videoId":"..."}`
5. **Kafka consumer increments views**:
   - `VideoViewConsumer` listens on the same topic and calls an atomic DB update (`views = views + 1`) for that `videoId`.

## API

### Play (Signed HLS playlist)

```bash
curl -i http://localhost:8083/videos/VIDEO_ID/play
```

Response: an `index.m3u8` where `.ts` segment entries are pre-signed MinIO URLs.

### Get metadata

```bash
curl -s http://localhost:8083/videos/VIDEO_ID | jq
```

### Feed

```bash
curl -s http://localhost:8083/videos/feed | jq
```

## Dependencies

- **Java 17**
- **Postgres** for `videos` metadata and view counts
- **MinIO** for HLS artifacts (`index.m3u8` + `.ts` segments)
- **Kafka** for view events (producer + consumer)
- **Eureka (optional)**: configured as a client, but registration/fetch is disabled by default in `application.properties`

## Configuration

Defaults live in `src/main/resources/application.properties` and can be overridden via env vars:

- `DB_URL` (default `jdbc:postgresql://localhost:5432/netlife`)
- `DB_USERNAME` (default `alice`)
- `DB_PASSWORD` (default `OmagaZ`)
- `EUREKA_SERVER_URL` (default `http://localhost:8761/eureka`)
- `KAFKA_BOOTSTRAP_SERVERS` (default `localhost:29092`)
- `minio.url` (default `http://localhost:9000`)
- `minio.accessKey` (default `minioadmin`)
- `minio.secretKey` (default `minioadmin123`)
- `minio.bucket` (default `videos`)
- `app.kafka.topic.video-view` (default `video-view-topic`)

Server port: `8083`.

## Data Model (Required DB Table)

This service does **not** create tables (`spring.jpa.hibernate.ddl-auto=none`), so the `videos` table must already exist.

Minimal schema compatible with `VideoMetadata`:

```sql
create table if not exists videos (
  id             text primary key,
  user_id        text not null,
  title          text not null,
  description    text,
  processed_path text,
  object_key     text not null,
  views          bigint not null default 0,
  size           bigint,
  duration       integer,
  status         text not null,
  created_at     timestamp,
  updated_at     timestamp,
  err_message    text
);
```

`/videos/feed` returns only rows where `status` equals `READY` (case-insensitive).

## MinIO Object Layout (Expected)

The playback endpoint assumes HLS output is stored like:

- `processed/{videoId}/index.m3u8`
- `processed/{videoId}/*.ts`

Note: only lines that end with `.ts` are signed/replaced. If your playlists reference variant playlists (`.m3u8`) or other asset types, you’ll need to extend the rewrite logic.

## Running Locally

```bash
./mvnw spring-boot:run
```

Or build and run:

```bash
./mvnw -q clean package
java -jar target/Video-Delivery-Service-0.0.1-SNAPSHOT.jar
```

## Security

`SecurityConfig` permits all requests (stateless, CSRF disabled). If you intend to expose this publicly, add authentication/authorization and tighten CORS.

