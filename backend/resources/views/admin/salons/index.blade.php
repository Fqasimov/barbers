@extends('admin.layout')
@section('title', 'Salons')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Salons</h1><p>Waiting for review first, then newest.</p></div></div>

<form class="filters" method="get">
  <input type="search" name="q" value="{{ $q }}" placeholder="Name, district, owner email or phone, id" aria-label="Search salons">
  <select name="status" aria-label="Status">
    <option value="">Any status</option>
    @foreach (['pending_review' => 'Waiting for review', 'live' => 'Live', 'suspended' => 'Suspended', 'deleted' => 'Deleted'] as $v => $l)
      <option value="{{ $v }}" @selected($status === $v)>{{ $l }}</option>
    @endforeach
  </select>
  <select name="sub" aria-label="Plan">
    <option value="">Any plan</option>
    @foreach (['trialing' => 'On trial', 'active' => 'Paid', 'past_due' => 'Grace period', 'expired' => 'Expired', 'none' => 'No plan'] as $v => $l)
      <option value="{{ $v }}" @selected($plan === $v)>{{ $l }}</option>
    @endforeach
  </select>
  <button class="btn" type="submit">Filter</button>
  @if ($q || $status || $plan)<a class="btn" href="{{ route('admin.salons') }}">Clear</a>@endif
</form>

<div class="card">
  @if ($salons->isEmpty())
    <p class="empty">No salons match.</p>
  @else
  <div class="table-wrap"><table>
    <thead><tr><th>Salon</th><th>Owner</th><th>Status</th><th>Plan</th><th class="num">Services · masters · photos</th><th>Signed up</th></tr></thead>
    <tbody>
    @foreach ($salons as $s)
      <tr>
        <td><a class="row-link" href="{{ route('admin.salons.show', $s->id) }}">{{ $s->name }}</a><span class="sub">{{ $s->district }}</span></td>
        <td>@if ($s->owner)<a href="{{ route('admin.users.show', $s->owner->id) }}">{{ $s->owner->first_name }} {{ $s->owner->last_name }}</a><span class="sub">{{ $s->owner->email }}</span>@else<span class="muted">seeded</span>@endif</td>
        <td>@include('admin.partials.badge', ['s' => $s->trashed() ? 'deleted' : $s->status])</td>
        <td>
          @if ($s->subscription)
            {{ ucfirst($s->subscription->plan) }} @include('admin.partials.badge', ['s' => $s->subscription->status])
            <span class="sub">until {{ V::date($s->subscription->coveredUntil()) }}</span>
          @else
            @include('admin.partials.badge', ['s' => 'none'])
          @endif
        </td>
        <td class="num">{{ $s->services_count }} · {{ $s->masters_count }} · {{ $s->photos_count }}</td>
        <td class="small">{{ V::date($s->created_at) }}</td>
      </tr>
    @endforeach
    </tbody>
  </table></div>
  @include('admin.partials.pager', ['p' => $salons])
  @endif
</div>
@endsection
