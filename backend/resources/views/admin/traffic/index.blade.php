@extends('admin.layout')
@section('title', 'Traffic')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Traffic</h1><p>Website and web-app visits, sign-ups, and addresses that look suspicious. Read from the web server's log every 10 minutes. @if ($updated)Last read {{ V::dt($updated) }}. @endif</p></div></div>

<div class="stats">
  <div class="card stat"><div class="k">Visitors today</div><div class="v">{{ number_format($stats['visitorsToday']) }}</div><div class="s">{{ number_format($stats['viewsToday']) }} page views</div></div>
  <div class="card stat"><div class="k">Visitors, 7 days</div><div class="v">{{ number_format($stats['visitorsWeek']) }}</div><div class="s">{{ number_format($stats['viewsWeek']) }} page views</div></div>
  <div class="card stat"><div class="k">New customers, 7 days</div><div class="v">{{ $stats['customersWeek'] }}</div><div class="s">{{ number_format($stats['customersAll']) }} in all</div></div>
  <div class="card stat"><div class="k">New salons, 7 days</div><div class="v">{{ $stats['salonsWeek'] }}</div><div class="s">registered</div></div>
  <div class="card stat {{ $stats['flagged'] ? 'alert' : '' }}"><div class="k">Suspicious addresses</div><div class="v">{{ $stats['flagged'] }}</div><div class="s">all time</div></div>
</div>

<div class="split">
  <div class="card">
    <div class="card-head"><h2>Last 14 days</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Day</th><th class="num">Visitors</th><th class="num">Page views</th><th class="num">New customers</th><th class="num">New salons</th><th class="num">Bot requests</th></tr></thead>
      <tbody>
      @foreach ($rows as $r)
        <tr>
          <td>{{ \Carbon\Carbon::parse($r->day)->format('D, j M') }}@if ($r->day === $today) <span class="sub">today</span>@endif</td>
          <td class="num">{{ number_format($r->visitors) }}</td>
          <td class="num">{{ number_format($r->views) }}</td>
          <td class="num">{{ $r->customers }}</td>
          <td class="num">{{ $r->salons }}</td>
          <td class="num muted">{{ number_format($r->bots) }}</td>
        </tr>
      @endforeach
      </tbody>
    </table></div>
  </div>
  <div class="stack">
    <div class="card">
      <div class="card-head"><h2>Top pages, 7 days</h2></div>
      @if ($pages->isEmpty())<p class="empty">Nothing yet.</p>@else
      <ul class="list">@foreach ($pages as $p)<li><span class="mono">{{ $p->key }}</span><span class="meta">{{ number_format($p->n) }}</span></li>@endforeach</ul>
      @endif
    </div>
    <div class="card">
      <div class="card-head"><h2>Came from, 7 days</h2></div>
      @if ($refs->isEmpty())<p class="empty">No links from other sites yet.</p>@else
      <ul class="list">@foreach ($refs as $r)<li><span>{{ $r->key }}</span><span class="meta">{{ number_format($r->n) }}</span></li>@endforeach</ul>
      @endif
    </div>
  </div>
</div>

<div class="card mt-10">
  <div class="card-head"><h2>Suspicious addresses</h2><span class="small muted">Probing for weak spots (.env, wp-admin, .php …), 5+ admin sign-in attempts, or 30+ missing pages</span></div>
  @if ($ips->isEmpty())<p class="empty">None so far.</p>@else
  <div class="table-wrap"><table>
    <thead><tr><th>Address</th><th>Last seen</th><th class="num">Requests</th><th class="num">Probes</th><th class="num">Admin sign-ins</th><th class="num">Not found</th><th>Example</th></tr></thead>
    <tbody>
    @foreach ($ips as $ip)
      <tr>
        <td class="mono">{{ $ip->ip }}<span class="sub" title="{{ $ip->agent }}">{{ \Illuminate\Support\Str::limit($ip->agent ?? '', 40) }}</span></td>
        <td class="small">{{ V::dt(\Carbon\Carbon::parse($ip->last_seen)) }}</td>
        <td class="num">{{ number_format($ip->hits) }}</td>
        <td class="num">@if ($ip->probes)<span class="badge b-failed">{{ $ip->probes }}</span>@else 0 @endif</td>
        <td class="num">{{ $ip->admin_posts }}</td>
        <td class="num">{{ $ip->not_found }}</td>
        <td class="small mono">{{ \Illuminate\Support\Str::limit($ip->sample ?? '', 48) }}</td>
      </tr>
    @endforeach
    </tbody>
  </table></div>
  @endif
</div>
@endsection
