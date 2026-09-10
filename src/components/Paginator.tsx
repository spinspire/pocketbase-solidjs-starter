export default function Paginator(props: { page: number; totalPages: number; onPage: (p: number) => void }) {
  return (
    <nav class="paginator" aria-label="Blog pages">
      <menu class="buttons">
        <li>
          <button
            class="outline small"
            disabled={props.page <= 1}
            onClick={() => props.onPage(props.page - 1)}
          >
            ← Prev
          </button>
        </li>
        <li>
          <button
            class="outline small"
            disabled={props.page >= props.totalPages}
            onClick={() => props.onPage(props.page + 1)}
          >
            Next →
          </button>
        </li>
      </menu>
    </nav>
  );
}
