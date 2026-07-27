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
    throw new ApiError(`Failed to load greetings (HTTP ${res.status}).`, res.status);
  }

  return normalisePage(await res.json(), page);
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
    throw new ApiError(`Failed to create greeting (HTTP ${res.status}).`, res.status);
  }

  return (await res.json()) as Greeting;
}
