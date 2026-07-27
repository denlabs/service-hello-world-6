/** Rows requested per page, matching the backend default page size. */
export const PAGE_SIZE = 20;

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export interface Greeting {
  id: string;
  name: string;
  date: string;
  response: string;
}

export interface GreetingPage {
  content: Greeting[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CreateGreetingPayload {
  name: string;
}

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Reads an error response body without letting a malformed payload mask the failure. */
async function readErrorBody(res: Response): Promise<unknown> {
  try {
    if (typeof res.json === 'function') {
      return await res.json();
    }
  } catch {
    return null;
  }
  return null;
}

function collectFieldMessages(errors: unknown): string[] {
  if (Array.isArray(errors)) {
    return errors
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        const item = (entry ?? {}) as Record<string, unknown>;
        const message = item.defaultMessage ?? item.message ?? item.detail;
        if (typeof message !== 'string' || !message.trim()) {
          return '';
        }
        return typeof item.field === 'string' && item.field ? `${item.field}: ${message}` : message;
      })
      .filter((message): message is string => Boolean(message));
  }

  if (errors && typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>)
      .filter(([, message]) => typeof message === 'string' && message.trim())
      .map(([field, message]) => `${field}: ${String(message)}`);
  }

  return [];
}

/**
 * Pulls a human-readable explanation out of a backend error payload. Supports Spring's
 * `ProblemDetail` (`detail`/`title`), the default error attributes (`message`/`error`) and
 * bean-validation field error collections.
 */
function serverMessage(raw: unknown): string | null {
  if (typeof raw === 'string') {
    return raw.trim() || null;
  }
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const body = raw as Record<string, unknown>;
  const fieldMessages = collectFieldMessages(body.errors ?? body.fieldErrors);
  if (fieldMessages.length > 0) {
    return fieldMessages.join(' ');
  }

  for (const key of ['detail', 'message', 'error', 'title'] as const) {
    const value = body[key];
    if (typeof value === 'string' && value.trim() && value.trim() !== 'No message available') {
      return value.trim();
    }
  }

  return null;
}

/** Builds `<prefix>: <server detail> (HTTP <status>).` falling back to `<prefix> (HTTP <status>).` */
function failureMessage(prefix: string, status: number, detail: string | null): string {
  const cleaned = detail ? detail.replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '') : '';
  return cleaned ? `${prefix}: ${cleaned} (HTTP ${status}).` : `${prefix} (HTTP ${status}).`;
}

function normalisePage(raw: unknown, requestedPage: number): GreetingPage {
  const body = (raw ?? {}) as Partial<GreetingPage>;
  const content = Array.isArray(body.content) ? body.content : [];
  const page = body.page ?? {
    size: PAGE_SIZE,
    number: requestedPage,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
  };

  return { content, page };
}

/** Fetches one page of stored greetings, newest first. */
export async function fetchGreetings(page = 0, size = PAGE_SIZE): Promise<GreetingPage> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/greetings?page=${page}&size=${size}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError('Unable to reach the greetings service.');
  }

  if (!res.ok) {
    throw new ApiError(
      failureMessage('Failed to load greetings', res.status, serverMessage(await readErrorBody(res))),
      res.status,
    );
  }

  try {
    return normalisePage(await res.json(), page);
  } catch {
    throw new ApiError('The greetings service returned an unreadable response.', res.status);
  }
}

/** Creates a greeting from the supplied name payload. */
export async function createGreeting(payload: CreateGreetingPayload): Promise<Greeting> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/greeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('Unable to reach the greetings service.');
  }

  if (!res.ok) {
    throw new ApiError(
      failureMessage(
        'Failed to create greeting',
        res.status,
        serverMessage(await readErrorBody(res)),
      ),
      res.status,
    );
  }

  try {
    return (await res.json()) as Greeting;
  } catch {
    // The greeting was accepted; the refreshed listing is the authoritative view.
    return { id: '', name: payload.name, date: '', response: '' };
  }
}
