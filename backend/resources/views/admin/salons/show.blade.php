@extends('admin.layout')
@section('title', $salon->name)
@use('App\Support\AdminView', 'V')
@section('content')
@php($sub = $salon->subscription)
<a class="crumb" href="{{ route('admin.salons') }}">← Salons</a>
<div class="head">
  <div>
    <h1>{{ $salon->name }}</h1>
    <p>{{ implode(' · ', array_filter([$salon->district, $salon->address])) }} · <span class="mono">{{ $salon->id }}</span></p>
  </div>
  <div class="actions">
    @include('admin.partials.badge', ['s' => $salon->trashed() ? 'deleted' : $salon->status])
    @if ($listed)<span class="badge b-live">In search</span>@else<span class="badge">Not in search</span>@endif
  </div>
</div>

<div class="split">
  <div class="stack">
    <section class="card">
      <div class="card-head"><h2>Details</h2></div>
      <div class="card-body">
        <dl class="facts">
          <dt>Owner</dt><dd>@if ($salon->owner)<a href="{{ route('admin.users.show', $salon->owner->id) }}">{{ $salon->owner->first_name }} {{ $salon->owner->last_name }}</a> · {{ $salon->owner->email }} · {{ $salon->owner->phone ?: '—' }}@else<span class="muted">No owner (seeded catalogue)</span>@endif</dd>
          <dt>Categories</dt><dd>{{ implode(', ', $salon->categories ?? []) ?: '—' }}</dd>
          <dt>Serves</dt><dd>{{ ['all' => 'Everyone', 'women' => 'Women only', 'men' => 'Men only'][$salon->audience] ?? $salon->audience }}</dd>
          <dt>Hours</dt><dd>{{ $salon->hours_open }}–{{ $salon->hours_close }}@if ($salon->closed_days), closed on day {{ implode(', ', $salon->closed_days) }}@endif</dd>
          <dt>Phone</dt><dd>{{ $salon->phone ?: '—' }} @if ($salon->whatsapp)· WhatsApp {{ $salon->whatsapp }}@endif</dd>
          <dt>Rating</dt><dd>{{ $salon->review_count }} reviews in the app @if ($salon->base_review_count)(+{{ $salon->base_review_count }} imported)@endif</dd>
          <dt>Signed up</dt><dd>{{ V::dt($salon->created_at) }}</dd>
          <dt>Approved</dt><dd>{{ V::dt($salon->approved_at) }}</dd>
          @if ($salon->suspended_at)<dt>Suspended</dt><dd>{{ V::dt($salon->suspended_at) }} — {{ $salon->suspended_reason }}</dd>@endif
          @if ($salon->trashed())<dt>Deleted</dt><dd>{{ V::dt($salon->deleted_at) }} (the owner deleted their account)</dd>@endif
        </dl>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>Services ({{ $salon->services->count() }})</h2></div>
      @if ($salon->services->isEmpty())<p class="empty">No services yet.</p>@else
      <div class="table-wrap"><table>
        <thead><tr><th>Service</th><th>Category</th><th class="num">Minutes</th><th class="num">Price</th></tr></thead>
        <tbody>@foreach ($salon->services as $s)<tr><td>{{ V::loc($s->name) }}</td><td>{{ $s->category }}</td><td class="num">{{ $s->duration_min }}</td><td class="num">{{ V::money($s->price) }}</td></tr>@endforeach</tbody>
      </table></div>@endif
    </section>

    <section class="card">
      <div class="card-head"><h2>Masters ({{ $salon->masters->count() }})</h2></div>
      @if ($salon->masters->isEmpty())<p class="empty">No masters yet.</p>@else
      <div class="table-wrap"><table>
        <thead><tr><th>Master</th><th>Role</th><th class="num">Years</th><th>Shift</th></tr></thead>
        <tbody>@foreach ($salon->masters as $m)<tr><td>{{ $m->name }}</td><td>{{ V::loc($m->role) }}</td><td class="num">{{ $m->years }}</td><td>{{ $m->shift_start }}–{{ $m->shift_end }}</td></tr>@endforeach</tbody>
      </table></div>@endif
    </section>

    @if ($salon->photos->isNotEmpty())
    <section class="card">
      <div class="card-head"><h2>Photos ({{ $salon->photos->count() }})</h2></div>
      <div class="card-body photos">
        @foreach ($salon->photos as $p)<a href="{{ $p->url() }}" target="_blank" rel="noopener"><img src="{{ $p->url() }}" alt="Photo {{ $loop->iteration }}" loading="lazy"></a>@endforeach
      </div>
    </section>
    @endif

    <section class="card">
      <div class="card-head"><h2>Latest bookings</h2><a href="{{ route('admin.bookings', ['q' => $salon->name]) }}">All</a></div>
      @if ($bookings->isEmpty())<p class="empty">No bookings yet.</p>@else
      <div class="table-wrap"><table>
        <thead><tr><th>When</th><th>Client</th><th>Services</th><th class="num">Total</th><th>Status</th></tr></thead>
        <tbody>
        @foreach ($bookings as $b)
          <tr>
            <td class="small">{{ V::dt($b->start_at) }}</td>
            <td>@if ($b->isBlock())<span class="muted">Time off{{ $b->note ? ': '.$b->note : '' }}</span>@elseif ($b->user)<a href="{{ route('admin.users.show', $b->user->id) }}">{{ $b->user->first_name }} {{ $b->user->last_name }}</a>@elseif ($b->source === 'salon'){{ $b->client_name ?? '—' }} <span class="sub">added by the salon</span>@else<span class="muted">Deleted user</span>@endif</td>
            <td class="small">{{ collect($b->services ?? [])->map(fn ($s) => V::loc($s['name'] ?? ''))->implode(', ') }}</td>
            <td class="num">{{ $b->isBlock() ? '' : V::money($b->total) }}</td>
            <td>@include('admin.partials.badge', ['s' => $b->status])</td>
          </tr>
        @endforeach
        </tbody>
      </table></div>@endif
    </section>

    <section class="card">
      <div class="card-head"><h2>Latest reviews</h2><a href="{{ route('admin.reviews', ['tab' => 'all', 'q' => $salon->name]) }}">All</a></div>
      @if ($reviews->isEmpty())<p class="empty">No reviews in the app yet.</p>@else
      <ul class="list">
        @foreach ($reviews as $r)
          <li><span><span class="stars">{{ str_repeat('★', $r->rating) }}</span> {{ \Illuminate\Support\Str::limit($r->text, 110) }}<span class="sub">{{ $r->author }} · {{ V::date($r->created_at) }}</span></span>@if ($r->hidden_at)@include('admin.partials.badge', ['s' => 'hidden'])@endif</li>
        @endforeach
      </ul>@endif
    </section>
  </div>

  <div class="stack">
    <section class="card">
      <div class="card-head"><h2>Search listing</h2></div>
      <div class="card-body">
        <ul class="checks">
          @foreach ($checks as $check => $ok)<li><span class="{{ $ok ? 'ok' : 'no' }}" aria-hidden="true">{{ $ok ? '✓' : '✕' }}</span>{{ $check }}<span class="sr-only">: {{ $ok ? 'yes' : 'no' }}</span></li>@endforeach
        </ul>
        @if ($upcoming)<p class="small soft mt-10">{{ $upcoming }} upcoming visit{{ $upcoming > 1 ? 's' : '' }}. Suspending keeps them.</p>@endif
      </div>
      @unless ($salon->trashed())
        @if ($salon->status !== 'live')
          <form class="action-form" method="post" action="{{ route('admin.salons.approve', $salon->id) }}">
            @csrf
            <p class="small soft">{{ $salon->status === 'suspended' ? 'Reinstate: back to live, in search again.' : 'Approve after checking the address, photos and a phone that answers.' }}</p>
            <div class="row"><button class="btn btn-ink" type="submit">{{ $salon->status === 'suspended' ? 'Reinstate' : 'Approve' }}</button></div>
          </form>
        @endif
        @if ($salon->status !== 'suspended')
          <form class="action-form" method="post" action="{{ route('admin.salons.suspend', $salon->id) }}" data-confirm="Suspend {{ $salon->name }}? It leaves search and takes no new bookings.">
            @csrf
            <label class="field">Suspend: reason (kept in the log)<input name="reason" maxlength="255" required placeholder="E.g. fake photos, repeated no-shows"></label>
            <div class="row"><button class="btn btn-danger-ghost" type="submit">Suspend</button></div>
          </form>
        @endif
      @endunless
    </section>

    <section class="card">
      <div class="card-head"><h2>Plan</h2></div>
      <div class="card-body">
        @if ($sub)
        <dl class="facts">
          <dt>Plan</dt><dd>{{ ucfirst($sub->plan) }} · {{ ($sub->billing_period ?? 'month') === 'year' ? 'yearly' : 'monthly' }}</dd>
          <dt>Status</dt><dd>@include('admin.partials.badge', ['s' => $sub->status])</dd>
          <dt>Trial ends</dt><dd>{{ V::dt($sub->trial_ends_at) }}</dd>
          <dt>Paid until</dt><dd>{{ V::dt($sub->current_period_end) }}</dd>
          <dt>Hidden after</dt><dd>{{ V::dt($sub->graceEndsAt()) }} <span class="sub">end + 7-day grace</span></dd>
        </dl>
        @else
        <p class="soft">No plan yet: the owner hasn't started the trial.</p>
        @endif
      </div>
      @if ($sub && ! $salon->trashed())
        <form class="action-form" method="post" action="{{ route('admin.salons.extend', $sub->business_id) }}">
          @csrf
          <p class="small soft">Add days to the {{ $sub->current_period_end ? 'paid period' : 'trial' }} (goodwill, a late approval). A lapsed plan restarts from today.</p>
          <div class="row">
            <label class="field">Days<input type="number" name="days" min="1" max="365" value="7" required></label>
            <label class="field grow-2">Reason<input name="reason" maxlength="255" required placeholder="E.g. approved 5 days late"></label>
            <button class="btn" type="submit">Add days</button>
          </div>
        </form>
        <form class="action-form" method="post" action="{{ route('admin.salons.plan', $sub->business_id) }}">
          @csrf
          <div class="row">
            <label class="field">Change plan<select name="plan">@foreach ($plans as $p)<option value="{{ $p }}" @selected($sub->plan === $p)>{{ ucfirst($p) }}</option>@endforeach</select></label>
            <button class="btn" type="submit">Save plan</button>
          </div>
        </form>
      @endif
    </section>

    <section class="card">
      <div class="card-head"><h2>Payments</h2></div>
      @if ($payments->isEmpty())<p class="empty">No payments yet.</p>@else
      <ul class="list">@foreach ($payments as $p)<li><span>{{ V::money($p->amount) }} · {{ ucfirst($p->plan) }} {{ ($p->billing_period ?? 'month') === 'year' ? 'yearly' : 'monthly' }}<span class="sub">{{ V::dt($p->created_at) }}</span></span>@include('admin.partials.badge', ['s' => $p->status])</li>@endforeach</ul>@endif
    </section>

    <section class="card">
      <div class="card-head"><h2>Admin history</h2></div>
      @include('admin.partials.activity', ['items' => $activity])
    </section>
  </div>
</div>
@endsection
