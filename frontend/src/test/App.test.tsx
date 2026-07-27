import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import type { Greeting, GreetingPage } from '../api/greetings';

function greeting(index: number, isoDate: string): Greeting {
  return {
    id: `id-${index}`,
    name: `Person ${index}`,
    date: isoDate,
    response: `Hello, Person ${index}!`,
  };
}

function pageOf(content: Greeting[], number: number, totalElements: number): GreetingPage {
  return {
    content,
    page: { size: 20, number, totalElements, totalPages: Math.ceil(totalElements / 20) },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AC-1: greetings listing', () => {
  it('requests page 0 with 20 rows per page and renders the table newest first', async () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      greeting(i, new Date(Date.UTC(2024, 0, i + 1, 12)).toISOString()),
    );
    fetchMock.mockResolvedValue(jsonResponse(pageOf(rows, 0, 45)));

    renderApp();

    const table = await screen.findByRole('table');
    const [requestUrl] = fetchMock.mock.calls[0] as [string];
    expect(requestUrl).toContain('/greetings?page=0&size=20');

    const bodyRows = within(table).getAllByRole('row').slice(1);
    expect(bodyRows).toHaveLength(20);
    expect(within(bodyRows[0]).getByText('Person 19')).toBeInTheDocument();
    expect(within(bodyRows[19]).getByText('Person 0')).toBeInTheDocument();
    expect(screen.getByTestId('page-status')).toHaveTextContent('Page 1 of 3');
    expect(screen.getByTestId('page-summary')).toHaveTextContent('20 per page');
  });

  it('pages forward through the listing', async () => {
    const first = Array.from({ length: 20 }, (_, i) =>
      greeting(i, new Date(Date.UTC(2024, 1, i + 1, 12)).toISOString()),
    );
    const second = [greeting(99, '2023-12-01T12:00:00Z')];
    fetchMock
      .mockResolvedValueOnce(jsonResponse(pageOf(first, 0, 21)))
      .mockResolvedValueOnce(jsonResponse(pageOf(second, 1, 21)));

    renderApp();
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByTestId('page-status')).toHaveTextContent('Page 2 of 2'));
    const [secondUrl] = fetchMock.mock.calls[1] as [string];
    expect(secondUrl).toContain('/greetings?page=1&size=20');
    expect(screen.getByText('Person 99')).toBeInTheDocument();
  });

  it('shows an empty state when no greetings are stored', async () => {
    fetchMock.mockResolvedValue(jsonResponse(pageOf([], 0, 0)));

    renderApp();

    expect(await screen.findByText(/no greetings yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an error when the listing request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load greetings/i);
  });
});

describe('AC-2: Add New action', () => {
  it('offers an Add New action that opens the greeting creation form', async () => {
    fetchMock.mockResolvedValue(jsonResponse(pageOf([], 0, 0)));

    renderApp();

    const addNew = await screen.findByRole('link', { name: /add new/i });
    await userEvent.click(addNew);

    expect(await screen.findByRole('heading', { name: /add new greeting/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });
});

describe('AC-3 to AC-5: creation form behaviour', () => {
  it('concatenates the names, posts them, and returns to a refreshed listing', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { id: 'id-1', name: 'Ada Lovelace', date: '2024-05-05T10:00:00Z', response: 'Hello, Ada Lovelace!' },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          pageOf(
            [
              {
                id: 'id-1',
                name: 'Ada Lovelace',
                date: '2024-05-05T10:00:00Z',
                response: 'Hello, Ada Lovelace!',
              },
            ],
            0,
            1,
          ),
        ),
      );

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    const [postUrl, postInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(postUrl).toContain('/greeting');
    expect(postInit.method).toBe('POST');
    expect(JSON.parse(String(postInit.body))).toEqual({ name: 'Ada Lovelace' });

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('keeps the form open and shows an error when the POST fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to create greeting/i);
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Ada');
    expect(screen.getByRole('heading', { name: /add new greeting/i })).toBeInTheDocument();
  });
});
