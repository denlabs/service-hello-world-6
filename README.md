# service-hello-world-6

A greetings service made of a Spring Boot backend (`POST /greeting`, `GET /greetings`) and a React +
TypeScript frontend that lists stored greetings and creates new ones.

## Prerequisites

| Tool | Version |
| --- | --- |
| JDK | 17+ |
| Maven | 3.9+ |
| Node.js | 18+ (ships with npm) |

## Run locally

The frontend expects the backend to be running, so start the backend first.

### 1. Backend (port 8080)

```bash
mvn spring-boot:run
```

- Serves `POST /greeting` (body `{ "name": "Ada Lovelace" }`) and
  `GET /greetings?page=0&size=20` (page sorted by date descending).
- Uses an in-memory H2 database seeded by Liquibase; data is lost on restart.
- H2 console: <http://localhost:8080/h2-console> (JDBC URL `jdbc:h2:mem:greetingsdb`, user `sa`, no
  password).

Smoke-test the API before wiring up the UI:

```bash
curl -X POST http://localhost:8080/greeting \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace"}'

curl 'http://localhost:8080/greetings?page=0&size=20'
```

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `POST /greeting` and `GET /greetings?...`
to `http://localhost:8080`, so no CORS setup or extra configuration is needed. The proxy rules are
exact-match regexes, which keeps the client-side route `/greetings/new` served by the SPA.

To point the UI at a backend on another origin (for example a deployed environment), set
`VITE_API_BASE_URL` before starting Vite or building:

```bash
VITE_API_BASE_URL=https://greetings.example.com npm run dev
```

## Verify the integration

1. The homepage lists stored greetings (name, response, date), newest first, 20 rows per page.
2. **Add New** opens `/greetings/new` with first name and last name inputs.
3. Saving concatenates the two inputs into the `name` field of `POST /greeting` and returns to the
   refreshed listing.
4. Stop the backend and submit the form again: the page stays on the form, keeps the entered values
   and shows an inline error such as `Unable to reach the greetings service.`

## Tests

| Scope | Command | Run from |
| --- | --- | --- |
| Backend unit/integration tests | `mvn test` | repository root |
| Frontend tests | `npm test` | `frontend/` |
| Frontend type-check and production build | `npm run build` | `frontend/` |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| UI shows `Unable to reach the greetings service.` | The backend is not running on port 8080, or `VITE_API_BASE_URL` points at the wrong origin. |
| UI shows `Failed to load greetings (HTTP 5xx).` | The backend responded with an error; check the `mvn spring-boot:run` console output. |
| `Port 8080 was already in use` | Stop the other process or run `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081` and set `VITE_API_BASE_URL=http://localhost:8081`. |
| Vite port 5173 busy | Start with `npm run dev -- --port 5174`. |
