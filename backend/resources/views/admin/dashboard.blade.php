@extends('admin.layout')
@section('title', 'Overview')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head">
  <div><h1>Overview</h1><p>{{ \App\Support\Baku::now()->format('l, d.m.Y · H:i') }} in Baku</p></div>
</div>

<div class="stats">
  <a class="card stat {{ $stats['pending'] ? 'alert' : '' }}" href="{{ route('admin.salons', ['status' => 'pending_review']) }}"><div class="k">Salons waiting for review</div><div class="v">{{ $stats['pending'] }}</div><div class="s">Approve within a day</div></a>
  <a class="card stat {{ $stats['reports'] ? 'alert' : '' }}" href="{{ route('admin.reviews') }}"><div class="k">Reported reviews</div><div class="v">{{ $stats['reports'] }}</div><div class="s">Handle within 24 hours</div></a>
  <a class="card stat" href="{{ route('admin.salons', ['status' => 'live']) }}"><div class="k">Salons in search</div><div class="v">{{ $stats['listed'] }}</div><div class="s">{{ $stats['suspended'] }} suspended</div></a>
  <a class="card stat" href="{{ route('admin.bookings') }}"><div class="k">Visits today</div><div class="v">{{ $stats['bookingsToday'] }}</div><div class="s">{{ $stats['bookingsWeek'] }} booked · {{ $stats['cancelledWeek'] }} cancelled in 7 days</div></a>
  <a class="card stat" href="{{ route('admin.users', ['role' => 'customer']) }}"><div class="k">Customers</div><div class="v">{{ $stats['customers'] }}</div><div class="s">+{{ $stats['customersNew'] }} in 7 days</div></a>
  <a class="card stat" href="{{ route('admin.payments') }}"><div class="k">Paid this month</div><div class="v">{{ V::money($stats['revenueMonth']) }}</div><div class="s">{{ $stats['active'] }} paid · {{ $stats['trialing'] }} on trial</div></a>
  <a class="card stat {{ $stats['pastDue'] ? 'alert' : '' }}" href="{{ route('admin.salons', ['sub' => 'past_due']) }}"><div class="k">In the 7-day grace</div><div class="v">{{ $stats['pastDue'] }}</div><div class="s">{{ $stats['expired'] }} expired</div></a>
  <a class="card stat" href="{{ route('admin.reviews', ['tab' => 'all']) }}"><div class="k">New reviews</div><div class="v">{{ $stats['reviewsWeek'] }}</div><div class="s">in 7 days</div></a>
</div>

<div class="split">
  <div class="stack">
    <section class="card">
      <div class="card-head"><h2>Waiting for review</h2><a href="{{ route('admin.salons', ['status' => 'pending_review']) }}">All</a></div>
      @if ($pending->isEmpty())
        <p class="empty">No salons waiting. Nice.</p>
      @else
      <div class="table-wrap"><table>
        <thead><tr><th>Salon</th><th>Owner</th><th class="num">Setup</th><th>Signed up</th></tr></thead>
        <tbody>
        @foreach ($pending as $s)
          <tr>
            <td><a class="row-link" href="{{ route('admin.salons.show', $s->id) }}">{{ $s->name }}</a><span class="sub">{{ $s->district }} · {{ $s->address }}</span></td>
            <td>{{ $s->owner?->first_name }} {{ $s->owner?->last_name }}<span class="sub">{{ $s->owner?->email }}</span></td>
            <td class="num small">{{ $s->services_count }} services<br>{{ $s->masters_count }} masters · {{ $s->photos_count }} photos</td>
            <td class="small">{{ V::ago($s->created_at) }}</td>
          </tr>
        @endforeach
        </tbody>
      </table></div>
      @endif
    </section>

    <section class="card">
      <div class="card-head"><h2>Reported reviews</h2><a href="{{ route('admin.reviews') }}">Open queue</a></div>
      @if ($reported->isEmpty())
        <p class="empty">No open reports.</p>
      @else
      <ul class="list">
        @foreach ($reported as $r)
          <li><span><span class="stars">{{ str_repeat('★', $r->rating) }}</span> {{ \Illuminate\Support\Str::limit($r->text, 80) }}<span class="sub">{{ $r->business?->name }} · {{ $r->author }}</span></span><span class="badge b-reported">{{ $r->open_reports }} report{{ $r->open_reports > 1 ? 's' : '' }}</span></li>
        @endforeach
      </ul>
      @endif
    </section>
  </div>

  <div class="stack">
    <section class="card">
      <div class="card-head"><h2>Trials ending in 3 days</h2></div>
      @if ($endingTrials->isEmpty())
        <p class="empty">None.</p>
      @else
      <ul class="list">
        @foreach ($endingTrials as $t)
          <li><a href="{{ route('admin.salons.show', $t->business_id) }}">{{ $t->business?->name ?? $t->business_id }}</a><span class="meta">{{ V::date($t->trial_ends_at) }}</span></li>
        @endforeach
      </ul>
      @endif
    </section>
    <section class="card">
      <div class="card-head"><h2>In the grace period</h2></div>
      @if ($inGrace->isEmpty())
        <p class="empty">None.</p>
      @else
      <ul class="list">
        @foreach ($inGrace as $g)
          <li><a href="{{ route('admin.salons.show', $g->business_id) }}">{{ $g->business?->name ?? $g->business_id }}</a><span class="meta">hidden {{ V::date($g->graceEndsAt()) }}</span></li>
        @endforeach
      </ul>
      @endif
    </section>
    <section class="card">
      <div class="card-head"><h2>Recent admin activity</h2><a href="{{ route('admin.activity') }}">All</a></div>
      @include('admin.partials.activity', ['items' => $activity])
    </section>
  </div>
</div>
@endsection
