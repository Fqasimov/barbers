@extends('admin.layout')
@section('title', $user->first_name.' '.$user->last_name)
@use('App\Support\AdminView', 'V')
@section('content')
<a class="crumb" href="{{ route('admin.users') }}">← Users</a>
<div class="head">
  <div><h1>{{ $user->first_name }} {{ $user->last_name }}</h1><p>{{ $user->email }} · <span class="mono">{{ $user->id }}</span></p></div>
  <span class="badge">{{ $user->role === 'business' ? 'Salon owner' : 'Customer' }}</span>
</div>

<div class="split">
  <div class="stack">
    <section class="card">
      <div class="card-head"><h2>Profile</h2></div>
      <div class="card-body">
        <dl class="facts">
          <dt>Phone</dt><dd>{{ $user->phone ?: '—' }}</dd>
          <dt>Email</dt><dd>{{ $user->email }} @if ($user->email_verified_at)<span class="muted">· confirmed {{ V::date($user->email_verified_at) }}</span>@else<span class="badge b-past_due">not confirmed</span>@endif</dd>
          <dt>Signs in with</dt><dd>{{ ucfirst($user->provider) }}</dd>
          <dt>Birth date</dt><dd>{{ $user->birth_date?->format('d.m.Y') ?? '—' }}</dd>
          <dt>Joined</dt><dd>{{ V::dt($user->created_at) }}</dd>
          <dt>App sessions</dt><dd>{{ $user->tokens_count }} signed-in device{{ $user->tokens_count === 1 ? '' : 's' }} · {{ $user->push_tokens_count }} with notifications</dd>
          @if ($user->business)<dt>Salon</dt><dd><a href="{{ route('admin.salons.show', $user->business->id) }}">{{ $user->business->name }}</a> @include('admin.partials.badge', ['s' => $user->business->status])</dd>@endif
        </dl>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Bookings</h2></div>
      @if ($bookings->isEmpty())<p class="empty">No bookings.</p>@else
      <div class="table-wrap"><table>
        <thead><tr><th>When</th><th>Salon</th><th class="num">Total</th><th>Status</th></tr></thead>
        <tbody>@foreach ($bookings as $b)<tr><td class="small">{{ V::dt($b->start_at) }}</td><td>@if ($b->business)<a href="{{ route('admin.salons.show', $b->business_id) }}">{{ $b->business->name }}</a>@else<span class="muted">{{ $b->business_id }}</span>@endif</td><td class="num">{{ V::money($b->total) }}</td><td>@include('admin.partials.badge', ['s' => $b->status])@if ($b->cancelled_by)<span class="sub">by {{ $b->cancelled_by }}</span>@endif</td></tr>@endforeach</tbody>
      </table></div>@endif
    </section>
    <section class="card">
      <div class="card-head"><h2>Reviews</h2></div>
      @if ($reviews->isEmpty())<p class="empty">No reviews.</p>@else
      <ul class="list">@foreach ($reviews as $r)<li><span><span class="stars">{{ str_repeat('★', $r->rating) }}</span> {{ \Illuminate\Support\Str::limit($r->text, 110) }}<span class="sub">{{ $r->business?->name }} · {{ V::date($r->created_at) }}</span></span>@if ($r->hidden_at)@include('admin.partials.badge', ['s' => 'hidden'])@endif</li>@endforeach</ul>@endif
    </section>
  </div>
  <div class="stack">
    <section class="card">
      <div class="card-head"><h2>Account</h2></div>
      <form class="action-form" method="post" action="{{ route('admin.users.signout', $user->id) }}" data-confirm="Sign {{ $user->email }} out on every device?">
        @csrf
        <p class="small soft">Sign out on every device: a lost phone or a shared account. They sign in again with their password or a code.</p>
        <div class="row"><button class="btn" type="submit">Sign out everywhere</button></div>
      </form>
      <div class="action-form">
        <details class="danger">
          <summary>Delete this account…</summary>
          <form method="post" action="{{ route('admin.users.delete', $user->id) }}" class="stack tight" data-confirm="Delete {{ $user->email }} for good? This can't be undone.">
            @csrf
            <p class="small soft">The same as "Delete account" in the app: personal data and sessions are removed, upcoming bookings cancelled (salons notified), past bookings and reviews kept anonymised.@if ($user->business) Their salon is unpublished and its future bookings cancelled, with customers notified.@endif</p>
            <label class="field">Reason (kept in the log)<input name="reason" maxlength="255" required placeholder="E.g. asked by email on 30.10"></label>
            <label class="field">Type <strong>{{ $user->email }}</strong> to confirm<input name="confirm" autocomplete="off" required></label>
            <div class="row"><button class="btn btn-danger" type="submit">Delete account</button></div>
          </form>
        </details>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Admin history</h2></div>
      @include('admin.partials.activity', ['items' => $activity])
    </section>
  </div>
</div>
@endsection
