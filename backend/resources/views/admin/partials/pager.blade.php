@if ($p->total() > 0)
<div class="pager">
  <span>{{ $p->firstItem() }}–{{ $p->lastItem() }} of {{ $p->total() }}</span>
  <span class="actions">
    @if ($p->previousPageUrl())<a class="btn btn-sm" href="{{ $p->previousPageUrl() }}">← Newer</a>@endif
    @if ($p->nextPageUrl())<a class="btn btn-sm" href="{{ $p->nextPageUrl() }}">Older →</a>@endif
  </span>
</div>
@endif
