@extends('admin.layout')
@section('title', 'Payments')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Payments</h1><p>Subscription payments from salons. Customers pay salons in person; that money never passes through Usta.</p></div></div>
<div class="stats">
  <div class="card stat"><div class="k">Paid this month</div><div class="v">{{ V::money($totals['month']) }}</div></div>
  <div class="card stat"><div class="k">Paid all time</div><div class="v">{{ V::money($totals['all']) }}</div></div>
  <div class="card stat"><div class="k">Started, not finished</div><div class="v">{{ $totals['pending'] }}</div><div class="s">checkouts left open</div></div>
</div>
<form class="filters" method="get">
  <select name="status" aria-label="Status">
    <option value="">Any status</option>
    @foreach (['paid' => 'Paid', 'pending' => 'Pending', 'failed' => 'Failed'] as $v => $l)<option value="{{ $v }}" @selected($status === $v)>{{ $l }}</option>@endforeach
  </select>
  <button class="btn" type="submit">Filter</button>
</form>
<div class="card">
  @if ($payments->isEmpty())<p class="empty">No payments yet.</p>@else
  <div class="table-wrap"><table>
    <thead><tr><th>Created</th><th>Salon</th><th>Plan</th><th class="num">Amount</th><th>Status</th><th>Provider</th></tr></thead>
    <tbody>
    @foreach ($payments as $p)
      <tr>
        <td class="small">{{ V::dt($p->created_at) }}@if ($p->paid_at)<span class="sub">paid {{ V::dt($p->paid_at) }}</span>@endif</td>
        <td>@if ($p->business)<a href="{{ route('admin.salons.show', $p->business_id) }}">{{ $p->business->name }}</a>@else<span class="muted">{{ $p->business_id }}</span>@endif</td>
        <td>{{ ucfirst($p->plan) }} <span class="sub">{{ ($p->billing_period ?? 'month') === 'year' ? 'yearly' : 'monthly' }}</span></td>
        <td class="num">{{ V::money($p->amount) }}</td>
        <td>@include('admin.partials.badge', ['s' => $p->status])</td>
        <td class="small">{{ $p->provider }}<span class="sub mono">{{ $p->provider_ref }}</span></td>
      </tr>
    @endforeach
    </tbody>
  </table></div>
  @include('admin.partials.pager', ['p' => $payments])
  @endif
</div>
@endsection
