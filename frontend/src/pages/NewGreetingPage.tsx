import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGreeting } from '../api/greetings';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
}

/** Collapses runs of whitespace so the concatenated payload holds a single separator. */
function normalise(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Builds the backend `name` payload from the two form inputs. */
export function buildName(firstName: string, lastName: string): string {
  return normalise(`${normalise(firstName)} ${normalise(lastName)}`);
}

function validate(firstName: string, lastName: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!normalise(firstName)) {
    errors.firstName = 'Enter a first name.';
  }
  if (!normalise(lastName)) {
    errors.lastName = 'Enter a last name.';
  }
  return errors;
}

/** Greeting creation form opened by the Add New action (FSH-199, FSH-200). */
export function NewGreetingPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submissionFailed, setSubmissionFailed] = useState(false);
  const inFlight = useRef(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Keep the failure visible where the user is working by moving focus onto the message.
  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) {
      return;
    }

    setError(null);
    setSubmissionFailed(false);

    const errors = validate(firstName, lastName);
    setFieldErrors(errors);
    if (errors.firstName || errors.lastName) {
      setError([errors.firstName, errors.lastName].filter(Boolean).join(' '));
      return;
    }

    const name = buildName(firstName, lastName);
    inFlight.current = true;
    setSubmitting(true);
    try {
      await createGreeting({ name });
      navigate('/', { replace: true, state: { createdName: name } });
    } catch (err) {
      inFlight.current = false;
      setSubmitting(false);
      setSubmissionFailed(true);
      setError(err instanceof Error ? err.message : 'Failed to create greeting.');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Add New Greeting</h1>
      </header>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="error"
        >
          <p className="error-message">{error}</p>
          {submissionFailed && (
            <p className="error-hint">
              Your details were kept. Check them and select Save to try again.
            </p>
          )}
        </div>
      )}

      <form className="greeting-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="firstName">First name</label>
        <input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          aria-invalid={Boolean(fieldErrors.firstName)}
          aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
          onChange={(event) => setFirstName(event.target.value)}
        />
        {fieldErrors.firstName && (
          <span id="firstName-error" className="field-error">
            {fieldErrors.firstName}
          </span>
        )}

        <label htmlFor="lastName">Last name</label>
        <input
          id="lastName"
          name="lastName"
          autoComplete="family-name"
          value={lastName}
          aria-invalid={Boolean(fieldErrors.lastName)}
          aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
          onChange={(event) => setLastName(event.target.value)}
        />
        {fieldErrors.lastName && (
          <span id="lastName-error" className="field-error">
            {fieldErrors.lastName}
          </span>
        )}

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="button"
            disabled={submitting}
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
