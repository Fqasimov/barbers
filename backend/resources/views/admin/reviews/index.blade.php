@extends('admin.layout')
@section('title', 'Reviews')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Reviews</h1><p>Act on reports within 24 hours. Three reports hide a review automatically until someone checks it.</p></div></div>
<nav class="tabs" aria-label="Review lists">
  <a href="{{ route('admin.reviews', ['tab' => 'reported']) }}" @if ($tab === 'reported') aria-current="page" @endif>Reported · {{ $reportedCount }}</a>
  <a href="{{ route('admin.reviews', ['tab' => 'hidden']) }}" @if ($tab === 'hidden') aria-current="page" @endif>Hidden</a>
  <a href="{{ route('admin.reviews', ['tab' => 'all']) }}" @if ($tab === 'all') aria-current="page" @endif>All</a>
</nav>
<form class="filters" method="get">
  <input type="hidden" name="tab" value="{{ $tab }}">
  <input type="search" name="q" value="{{ $q }}" placeholder="Text, author or salon" aria-label="Search reviews">
  <button class="btn" type="submit">Search</button>
</form>
<div class="stack">
  @forelse ($reviews as $r)
    <article class="card">
      <div class="card-head">
        <div><span class="stars">{{ str_repeat('★', $r->rating) }}{{ str_repeat('☆', 5 - $r->rating) }}</span> <strong>{{ $r->author }}</strong> on <a href="{{ route('admin.salons.show', $r->business_id) }}">{{ $r->business?->name ?? $r->business_id }}</a><span class="sub">{{ V::dt($r->created_at) }}@if ($r->user_id) · <a href="{{ route('admin.users.show', $r->user_id) }}">author's account</a>@endif</span></div>
        <div class="actions">
          @if ($r->hidden_at)@include('admin.partials.badge', ['s' => 'hidden'])@endif
          @if ($r->open_reports)<span class="badge b-reported">{{ $r->open_reports }} open report{{ $r->open_reports > 1 ? 's' : '' }}</span>@endif
        </div>
      </div>
      <div class="card-body stack tight">
        <p class="quote">{{ $r->text }}</p>
        @if ($r->reply)<p class="reply"><strong>Salon's reply:</strong> {{ $r->reply }}</p>@endif
        @if ($r->reports->isNotEmpty())
          <ul class="small soft bullets">
            @foreach ($r->reports as $rep)<li>{{ ucfirst($rep->reason) }}@if ($rep->note): “{{ $rep->note }}”@endif · {{ V::ago($rep->created_at) }}</li>@endforeach
          </ul>
        @endif
        <div class="actions">
          @if ($r->hidden_at)
            <form class="inline" method="post" action="{{ route('admin.reviews.restore', $r->id) }}">@csrf<button class="btn btn-sm" type="submit">Show again</button></form>
          @else
            <form class="inline" method="post" action="{{ route('admin.reviews.hide', $r->id) }}" data-confirm="Hide this review? It leaves the salon page and its rating.">@csrf<button class="btn btn-sm btn-danger-ghost" type="submit">Hide</button></form>
          @endif
          @if ($r->open_reports)
            <form class="inline" method="post" action="{{ route('admin.reviews.dismiss', $r->id) }}">@csrf<button class="btn btn-sm" type="submit">Dismiss reports</button></form>
          @endif
        </div>
      </div>
    </article>
  @empty
    <div class="card"><p class="empty">{{ $tab === 'reported' ? 'No open reports.' : 'No reviews match.' }}</p></div>
  @endforelse
  @if ($reviews->hasPages())<div class="card">@include('admin.partials.pager', ['p' => $reviews])</div>@endif
</div>
@endsection
