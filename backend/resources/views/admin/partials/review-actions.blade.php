{{-- Approve / Reject for a salon waiting for review, right in a list. --}}
<div class="row-actions">
  <form method="post" action="{{ route('admin.salons.approve', $s->id) }}">
    @csrf
    <button class="btn btn-sm btn-ink" type="submit">Approve</button>
  </form>
  <form method="post" action="{{ route('admin.salons.reject', $s->id) }}" data-confirm="Reject {{ $s->name }}? It stays out of search. You can reinstate it later.">
    @csrf
    <button class="btn btn-sm btn-danger-ghost" type="submit">Reject</button>
  </form>
</div>
