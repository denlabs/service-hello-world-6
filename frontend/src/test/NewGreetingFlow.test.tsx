import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import type { Greeting, GreetingPage } from '../api/greetings';

function pageOf(content: Greeting[], totalElements: number): GreetingPage {
  return {
    content,
    page: { size: 20, number: 0, totalElements, totalPages: Math.ceil(totalElements / 20) },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function created(name: string): Greeting {
  return { id: 'id-1', name, date: '2024-05-05T10:00:00Z', response: `Hello, ${name}!` };
}

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

function postBodies(): Array<{ name: string }> {
  return fetchMock.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === 'POST')
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FSH-199 AC-2: Add New action', () => {
  it('renders the Add New action on the homepage pointing at the creation form', async () => {
    fetchMock.mockResolvedValue(jsonResponse(pageOf([], 0)));

    renderApp();

    const addNew = await screen.findByRole('link', { name: /add new/i });
    expect(addNew).toHaveAttribute('href', '/greetings/new');
  });

  it('keeps the Add New action available when the listing fails to load', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    renderApp();

    await screen.findByRole('alert');
    expect(screen.getByRole('link', { name: /add new/i })).toBeInTheDocument();
  });
});

describe('FSH-199 AC-3: form fields', () => {
  it('exposes empty first and last name inputs that capture user input', async () => {
    renderApp('/greetings/new');

    const first = screen.getByLabelText(/first name/i);
    const last = screen.getByLabelText(/last name/i);
    expect(first).toHaveValue('');
    expect(last).toHaveValue('');

    await userEvent.type(first, 'Ada');
    await userEvent.type(last, 'Lovelace');

    expect(first).toHaveValue('Ada');
    expect(last).toHaveValue('Lovelace');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires both names before a request is made', async () => {
    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/last name/i);
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-invalid', 'false');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input', async () => {
    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), '   ');
    await userEvent.type(screen.getByLabelText(/last name/i), '   ');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('FSH-199 AC-4: submission flow', () => {
  it('concatenates the trimmed names into the POST /greeting payload', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(created('Ada Lovelace'), 201))
      .mockResolvedValue(jsonResponse(pageOf([created('Ada Lovelace')], 1)));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), '  Ada  ');
    await userEvent.type(screen.getByLabelText(/last name/i), '  Lovelace  ');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(postBodies()).toHaveLength(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/greeting');
    expect(url).not.toContain('/greetings');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(postBodies()[0]).toEqual({ name: 'Ada Lovelace' });
  });

  it('collapses repeated whitespace inside the concatenated name', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(created('Ada Byron King Lovelace'), 201))
      .mockResolvedValue(jsonResponse(pageOf([created('Ada Byron King Lovelace')], 1)));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada  Byron');
    await userEvent.type(screen.getByLabelText(/last name/i), 'King   Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(postBodies()).toHaveLength(1));
    expect(postBodies()[0]).toEqual({ name: 'Ada Byron King Lovelace' });
  });

  it('returns to a refreshed listing that shows the new greeting', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(created('Ada Lovelace'), 201))
      .mockResolvedValue(jsonResponse(pageOf([created('Ada Lovelace')], 1)));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/ada lovelace/i);

    const listCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/greetings?'));
    expect(listCalls.length).toBeGreaterThanOrEqual(1);
    expect(String(listCalls[listCalls.length - 1][0])).toContain('page=0&size=20');
  });

  it('sends only one POST when the save button is clicked repeatedly', async () => {
    let resolvePost: (value: Response) => void = () => {};
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolvePost = resolve;
          }),
      )
      .mockResolvedValue(jsonResponse(pageOf([created('Ada Lovelace')], 1)));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');

    const save = screen.getByRole('button', { name: /save/i });
    await userEvent.click(save);
    await userEvent.click(save);
    await userEvent.click(save);

    expect(postBodies()).toHaveLength(1);
    expect(save).toBeDisabled();

    resolvePost(jsonResponse(created('Ada Lovelace'), 201));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('cancelling returns to the listing without posting', async () => {
    fetchMock.mockResolvedValue(jsonResponse(pageOf([], 0)));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(await screen.findByRole('heading', { name: /^greetings$/i })).toBeInTheDocument();
    expect(postBodies()).toHaveLength(0);
  });
});

describe('FSH-199 AC-5: submission failure', () => {
  it('stays on the form, preserves input, and re-enables saving after a failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to create greeting/i);
    expect(screen.getByRole('heading', { name: /add new greeting/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Ada');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Lovelace');
    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('allows a retry that succeeds after an initial failure', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse(created('Ada Lovelace'), 201))
      .mockResolvedValue(jsonResponse(pageOf([created('Ada Lovelace')], 1)));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(postBodies()).toHaveLength(2);
  });

  it('reports a network failure without leaving the form', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network down'));

    renderApp('/greetings/new');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Ada');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach/i);
    expect(screen.getByRole('heading', { name: /add new greeting/i })).toBeInTheDocument();
  });
});
