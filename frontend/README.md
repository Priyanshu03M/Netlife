# Netlife Frontend

React + Vite frontend for the Netlife authentication flow. The app provides registration, login, logout, and a simple protected content fetch against a backend running on `http://localhost:8765`.

## Stack

- React 18
- Vite 6
- Plain CSS
- Docker and Docker Compose for local containerized development

## Current Features

- Register a user with:
  - `username`
  - `email`
  - `password`
  - `role` (`ROLE_USER` or `ROLE_ADMIN`)
- Login with `username` and `password`
- Persist `accessToken` and `refreshToken` in `localStorage`
- Logout using the stored refresh token
- Call a protected `pages` endpoint and display the backend response text
- Toggle between register and login views in a single-page UI

## Project Structure

```text
frontend/
|-- src/
|   |-- App.jsx
|   |-- HomePage.jsx
|   |-- LoginForm.jsx
|   |-- RegisterForm.jsx
|   |-- apiRoutes.js
|   |-- main.jsx
|   `-- styles.css
|-- Dockerfile
|-- docker-compose.yml
|-- index.html
|-- package.json
`-- vite.config.mjs
```

## API Configuration

The frontend currently targets this backend base URL:

```js
http://localhost:8765
```

Defined routes in [`src/apiRoutes.js`](/E:/Netlife/frontend/src/apiRoutes.js):

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/pages`

If the backend runs on a different host or port, update [`src/apiRoutes.js`](/E:/Netlife/frontend/src/apiRoutes.js).

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm
- A backend service listening on `http://localhost:8765`

### Install dependencies

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

The Vite dev server runs on:

```text
http://localhost:5173
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Docker

### Build and run with Docker Compose

```bash
docker compose up --build
```

This starts the frontend on port `5173` and mounts the project directory into the container for live development.

### Container details

- Base image: `node:20-alpine`
- Exposed port: `5173`
- Startup command: `npm run dev -- --host 0.0.0.0 --port 5173`

## UI Behavior

- The app opens in register mode by default.
- Login success stores tokens in `localStorage`.
- The top navigation switches between auth buttons and a logout button depending on login state.
- The "Load pages" button calls the protected backend endpoint and shows the response message in the UI.

## Notes

- There is no routing library in use; the app is a single-page interface rendered from [`src/App.jsx`](/E:/Netlife/frontend/src/App.jsx).
- There is no automated test setup in the current frontend.
- Styling is defined in [`src/styles.css`](/E:/Netlife/frontend/src/styles.css).
