import type { Greeting } from '../api/greetings';

interface GreetingsTableProps {
  greetings: Greeting[];
}

function formatDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime()) ? isoDate : parsed.toLocaleString();
}

/** Renders stored greetings newest first. */
export function GreetingsTable({ greetings }: GreetingsTableProps) {
  const sorted = [...greetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <table className="greetings-table">
      <caption className="visually-hidden">Stored greetings sorted by date descending</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Response</th>
          <th scope="col">Date</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((greeting) => (
          <tr key={greeting.id}>
            <td>{greeting.name}</td>
            <td>{greeting.response}</td>
            <td>
              <time dateTime={greeting.date}>{formatDate(greeting.date)}</time>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
