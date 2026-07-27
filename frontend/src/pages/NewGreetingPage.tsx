import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGreeting } from '../api/greetings';

/** Greeting creation form opened by the Add New action. */
export function NewGreetingPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name) {
      setError('Enter a first name and a last name.');
      return;
    }

    setSubmitting(true);
    try {
      await createGreeting({ name });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create greeting.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Add New Greeting</h1>
      </header>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <form className="greeting-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="firstName">First name</label>
        <input
          id="firstName"
          name="firstName"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />

        <label htmlFor="lastName">Last name</label>
        <input
          id="lastName"
          name="lastName"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="button" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
