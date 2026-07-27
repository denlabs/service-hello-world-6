# Greetings frontend

A small React + TypeScript (Vite) UI for the greetings service.

## Run and test

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Start the dev server | `npm run dev` (http://localhost:5173) |
| Run tests | `npm test` |
| Type-check and build | `npm run build` |

The dev server proxies the API endpoints (`POST /greeting`, `GET /greetings?...`) to
`http://localhost:8080`, so start the Spring Boot service (`mvn spring-boot:run`) alongside it. The
proxy rules are exact-match regexes so the client route `/greetings/new` is still served by the SPA.
For other deployments set `VITE_API_BASE_URL` to the backend origin. See the
[repository README](../README.md) for the full backend + frontend run-through.

## Failure handling

Backend failures never navigate the user away from what they were doing:

- **Create failures** (`POST /greeting`) render an inline alert above the form. The entered first and
  last names are kept, the Save button is re-enabled for a retry, focus moves to the alert, and a
  hint explains the entries were preserved.
- Error text prefers the backend explanation — Spring `ProblemDetail` (`detail`/`title`), default
  error attributes (`message`/`error`) or bean-validation field errors — and falls back to
  `Failed to create greeting (HTTP <status>).` when the body carries nothing useful. Unreachable
  backends report `Unable to reach the greetings service.`
- **Listing failures** (`GET /greetings`) render an alert on the homepage while keeping the
  **Add New** action available.

## Views

- `/` — homepage listing of stored greetings (name, response, date) sorted by date descending,
  paginated at 20 rows per page, with an empty state and an **Add New** action.
- `/greetings/new` — greeting creation form with first name and last name inputs. On submit the two
  values are concatenated into the `name` field of `POST /greeting`; success returns to the refreshed
  listing and failures show an inline error without leaving the form.

## Structure

- `src/api/greetings.ts` — backend client (`GET /greetings`, `POST /greeting`), `PAGE_SIZE = 20`.
- `src/pages/GreetingsListPage.tsx` — homepage listing, loading, empty and error states.
- `src/pages/NewGreetingPage.tsx` — creation form.
- `src/components/GreetingsTable.tsx`, `src/components/Pagination.tsx` — presentation components.
- `src/test/App.test.tsx` — Vitest + Testing Library coverage for the listing and add flows.
- `src/test/NewGreetingFlow.test.tsx` — Add New action, form fields and submission flow.
- `src/test/SubmissionFailure.test.tsx` — inline error handling for failed submissions and listings.
