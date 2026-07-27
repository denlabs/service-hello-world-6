import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

function brokenResponse(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  } as unknown as Response;
}

function created(name: string): Greeting {
  return { id: 'id-1', name, date: '2024-05-05T10:00:00Z', response: `Hello, ${name}!` };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/greetings/new']}>
      <App />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(first = 'Ada', last = 'Lovelace') {
  await userEvent.type(screen.getByLabelText(/first name/i), first);
  await userEvent.type(screen.getByLabelText(/last name/i), last);
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
}

describe('FSH-200 AC-5: inline submission failure handling', () => {
  it('shows the backend ProblemDetail explanation inline on the form', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ title: 'Bad Request', detail: 'name must not be blank' }, 400),
    );

    renderForm();
    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/name must not be blank/i);
    expect(alert).toHaveTextContent(/HTTP 400/);
    expect(screen.getByRole('heading', { name: /add new greeting/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
  });

  it('surfaces bean-validation field errors returned by the backend', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { errors: [{ field: 'name', defaultMessage: 'size must be between 1 and 100' }] },
        400,
      ),
    );

    renderForm();
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /name: size must be between 1 and 100/i,
    );
  });

  it('falls back to the status message when the error body is unreadable', async () => {
    fetchMock.mockResolvedValue(brokenResponse(503));

    renderForm();
    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed to create greeting \(HTTP 503\)\./i);
  });

  it('keeps the user in the form context, retains input and offers a retry hint', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Database unavailable' }, 500));

    renderForm();
    await fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/database unavailable/i);
    expect(alert).toHaveTextContent(/select save to try again/i);
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Ada');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Lovelace');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^greetings$/i })).not.toBeInTheDocument();
  });

  it('clears the failure message once a retry succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'Temporary outage' }, 500))
      .mockResolvedValueOnce(jsonResponse(created('Ada Lovelace'), 201))
      .mockResolvedValue(jsonResponse(pageOf([created('Ada Lovelace')], 1)));

    renderForm();
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/temporary outage/i);

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByText(/temporary outage/i)).not.toBeInTheDocument();
  });

  it('does not show the retry hint for client-side validation errors', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/enter a first name/i);
    expect(alert).not.toHaveTextContent(/select save to try again/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('FSH-200: listing failures stay actionable', () => {
  it('reports the backend detail when the listing request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Greetings store offline' }, 500));

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/greetings store offline/i);
    expect(screen.getByRole('link', { name: /add new/i })).toBeInTheDocument();
  });
});
