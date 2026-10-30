@extends('admin.layout')
@section('title', 'Bookings')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Bookings</h1><p>Visits by start time (Baku). Read-only: salons and customers manage their own bookings.</p></div></div>
<form class="filters" method="get">
  <label class="small soft">From <input type="date" name="from" value="{{ $from }}"></label>
  <label class="small soft">to <input type="date" name="to" value="{{ $to }}"></label>
  <select name="status" aria-label="Status">
    <option value="">Any status</option>
    @foreach (['upcoming' => 'Upcoming', 'completed' => 'Completed', 'cancelled' => 'Cancelled', 'no_show' => 'No-show'] as $v => $l)<option value="{{ $v }}" @selected($status === $v)>{{ $l }}</option>@endforeach
  </select>
  <select name="source" aria-label="Source">
    <option value="">App and phone</option>
    <option value="customer" @selected($source === 'customer')>Booked in the app</option>
    <option value="salon" @selected($source === 'salon')>Added by the salon</option>
  </select>
  <input type="search" name="q" value="{{ $q }}" placeholder="Salon, customer email, client name, id" aria-label="Search bookings">
  <button class="btn" type="submit">Filter</button>
</form>
<div class="card">
  @if ($bookings->isEmpty())<p class="empty">No bookings in this range.</p>@else
  <div class="table-wrap"><table>
    <thead><tr><th>When</th><th>Salon</th><th>Client</th><th>Services</th><th class="num">Total</th><th>Status</th></tr></thead>
    <tbody>
    @foreach ($bookings as $b)
      <tr>
        <td class="small">{{ V::dt($b->start_at) }}<span class="sub">{{ $b->duration_min }} min</span></td>
        <td>@if ($b->business)<a href="{{ route('admin.salons.show', $b->business_id) }}">{{ $b->business->name }}</a>@else<span class="muted">{{ $b->business_id }}</span>@endif</td>
        <td>@if ($b->user)<a href="{{ route('admin.users.show', $b->user->id) }}">{{ $b->user->first_name }} {{ $b->user->last_name }}</a><span class="sub">{{ $b->user->email }}</span>@elseif ($b->source === 'salon'){{ $b->client_name ?? '—' }}<span class="sub">added by the salon</span>@else<span class="muted">Deleted user</span>@endif</td>
        <td class="small">{{ collect($b->services ?? [])->map(fn ($s) => V::loc($s['name'] ?? ''))->implode(', ') }}</td>
        <td class="num">{{ V::money($b->total) }}</td>
        <td>@include('admin.partials.badge', ['s' => $b->status])@if ($b->cancelled_by)<span class="sub">by {{ $b->cancelled_by }}</span>@endif</td>
      </tr>
    @endforeach
    </tbody>
  </table></div>
  @include('admin.partials.pager', ['p' => $bookings])
  @endif
</div>
@endsection
