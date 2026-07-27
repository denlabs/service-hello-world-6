interface PaginationProps {
  pageNumber: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Previous/next controls for the fixed-size greetings listing. */
export function Pagination({
  pageNumber,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const effectiveTotalPages = Math.max(totalPages, 1);
  const isFirstPage = pageNumber <= 0;
  const isLastPage = pageNumber >= effectiveTotalPages - 1;

  return (
    <nav className="pagination" aria-label="Greetings pagination">
      <button
        type="button"
        onClick={() => onPageChange(pageNumber - 1)}
        disabled={disabled || isFirstPage}
      >
        Previous
      </button>
      <span data-testid="page-status">
        Page {pageNumber + 1} of {effectiveTotalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(pageNumber + 1)}
        disabled={disabled || isLastPage}
      >
        Next
      </button>
      <span data-testid="page-summary" className="page-summary">
        {totalElements} greeting{totalElements === 1 ? '' : 's'} &middot; {pageSize} per page
      </span>
    </nav>
  );
}
