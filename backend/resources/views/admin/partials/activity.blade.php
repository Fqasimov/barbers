@if ($items->isEmpty())
  <p class="empty">Nothing yet.</p>
@else
<ul class="list">
  @foreach ($items as $a)
    <li><span>{{ $a->summary }}</span><span class="meta" title="{{ \App\Support\AdminView::dt($a->created_at) }}">{{ $a->admin?->name ?? 'system' }} · {{ \App\Support\AdminView::ago($a->created_at) }}</span></li>
  @endforeach
</ul>
@endif
