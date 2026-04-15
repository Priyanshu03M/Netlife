# Netlife Frontend

## What It Does

Netlife’s frontend is a React + Vite single-page app that provides:

- Account registration, login, and logout
- A public video feed (IDs + metadata) and HLS playback
- An authenticated upload flow that uses a pre-signed MinIO URL (client uploads bytes directly to object storage)

The frontend expects the backend API gateway to be reachable at `http://localhost:8765` by default.

## How It Works

### Navigation (No React Router)

The app implements minimal client-side navigation using `history.pushState` in [`src/App.jsx`](src/App.jsx). The UI is rendered based on `window.location.pathname`.

Routes used by the UI:

- `/` feed
- `/login`
- `/register`
- `/watch/<videoId>` playback + metadata

### Session Storage

On login, the frontend stores:

- `accessToken`
- `refreshToken`
- `username`

in `localStorage` via [`src/auth/session.js`](src/auth/session.js).

There is no automatic refresh flow wired yet (the refresh endpoint exists in `src/apiRoutes.js`, but `apiRequest` does not retry with refresh).

### API Calls (Gateway + Upload Service)

All API endpoints are defined in [`src/apiRoutes.js`](src/apiRoutes.js):

- Auth (via gateway `:8765`):
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
- Video delivery (via gateway `:8765`, public):
  - `GET /videos/feed` (returns IDs)
  - `GET /videos/{id}` (metadata)
  - `GET /videos/{id}/play` (returns an HLS `index.m3u8` playlist whose `.ts` entries are already signed URLs)
- Upload (initiate via gateway `:8765`, protected):
  - `POST /videos/initiate-upload` (requires `Authorization: Bearer <jwt>`)

Upload is a 3-step flow implemented by [`src/UploadModal.jsx`](src/UploadModal.jsx):

1. Initiate upload:
   - calls `POST /videos/initiate-upload` through the gateway with JWT
   - sends `X-Client-ID` (derived from the JWT claim `userId` when available)
   - receives `{ videoId, url }`
2. Upload bytes:
   - does a `PUT` directly to the returned pre-signed MinIO URL via `XMLHttpRequest` (progress bar)
3. Complete upload:
   - prefers direct call to `Video-Upload-Service` at `http://localhost:8081/videos/complete-upload`
   - falls back to the gateway `POST /videos/complete-upload` if the direct call fails due to CORS/network issues

### Playback

`/watch/<videoId>` fetches playlist text + metadata and plays HLS using:

- native HLS when the browser supports it
- otherwise `hls.js` (lazy-loaded) in [`src/HlsPlayer.jsx`](src/HlsPlayer.jsx)

## Stack

- React 18
- Vite 6
- Plain CSS
- `hls.js` for HLS playback
- Docker Compose for local containerized development

## Configuration

Backend addresses are currently hard-coded in [`src/apiRoutes.js`](src/apiRoutes.js):

- Gateway: `API_BASE_URL = http://localhost:8765`
- Upload service (direct completion): `VIDEOS_API_BASE_URL = http://localhost:8081`

If your backend runs elsewhere, update these constants.

## Local Development

Prereqs:

- Node.js 20+ recommended
- A running backend (at minimum: `Api-Gateway-Service` on `:8765` and `Video-Delivery-Service` behind it)
- For uploads/playback end-to-end: MinIO and Kafka as documented in the backend services

Run:

```bash
npm install
npm run dev
```

Dev server: `http://localhost:5173`

## Docker

From `frontend/`:

```bash
docker compose up --build
```

This starts the Vite dev server in a container on port `5173` and mounts the project directory for live reload.

## Notes

- Styling is defined in [`src/styles.css`](src/styles.css).
- No automated frontend tests are set up yet.
