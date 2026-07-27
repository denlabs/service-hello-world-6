import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GreetingsTable } from '../components/GreetingsTable';
import { Pagination } from '../components/Pagination';
import { PAGE_SIZE, fetchGreetings, type GreetingPage } from '../api/greetings';

const EMPTY_PAGE: GreetingPage = {
  content: [],
  page: { size: PAGE_SIZE, number: 0, totalElements: 0, totalPages: 0 },
};

/** Homepage listing of stored greetings with pagination and an Add New action. */
export function GreetingsListPage() {
  const location = useLocation();
  const createdName = (location.state as { createdName?: string } | null)?.createdName;
  const [pageNumber, setPageNumber] = useState(0);
  const [data, setData] = useState<GreetingPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchGreetings(page, PAGE_SIZE));
    } catch (err) {
      setData(EMPTY_PAGE);
      setError(err instanceof Error ? err.message : 'Failed to load greetings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(pageNumber);
  }, [load, pageNumber]);

  const hasGreetings = data.content.length > 0;

  return (
    <section className="page">
      <header className="page-header">
        <h1>Greetings</h1>
        <Link className="button primary" to="/greetings/new">
          Add New
        </Link>
      </header>

      {createdName && (
        <p role="status" className="success">
          Greeting created for {createdName}.
        </p>
      )}

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {loading && <p>Loading greetings&hellip;</p>}

      {!loading && !error && !hasGreetings && (
        <p className="empty-state">No greetings yet. Use Add New to create the first one.</p>
      )}

      {!loading && hasGreetings && <GreetingsTable greetings={data.content} />}

      {!loading && !error && hasGreetings && (
        <Pagination
          pageNumber={data.page.number}
          totalPages={data.page.totalPages}
          totalElements={data.page.totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPageNumber}
          disabled={loading}
        />
      )}
    </section>
  );
}
