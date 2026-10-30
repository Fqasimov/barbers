@extends('admin.layout')
@section('title', 'Activity')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Activity</h1><p>Every change made in this panel, and every sign-in. Entries can't be edited or deleted.</p></div></div>
<form class="filters" method="get">
  <input type="search" name="q" value="{{ $q }}" placeholder="Text, action or salon/user id" aria-label="Search activity">
  <button class="btn" type="submit">Search</button>
</form>
<div class="card">
  @if ($actions->isEmpty())<p class="empty">Nothing yet.</p>@else
  <div class="table-wrap"><table>
    <thead><tr><th>When</th><th>Who</th><th>What</th><th>Subject</th><th>IP</th></tr></thead>
    <tbody>
    @foreach ($actions as $a)
      <tr>
        <td class="small">{{ V::dt($a->created_at) }}</td>
        <td>{{ $a->admin?->name ?? '—' }}</td>
        <td>{{ $a->summary }}<span class="sub mono">{{ $a->action }}</span></td>
        <td class="small">
          @if ($a->subject_type === 'salon')<a href="{{ route('admin.salons.show', $a->subject_id) }}">salon</a>
          @elseif ($a->subject_type === 'user' && $a->action !== 'user.delete')<a href="{{ route('admin.users.show', $a->subject_id) }}">user</a>
          @else{{ $a->subject_type ?? '—' }}@endif
        </td>
        <td class="small mono">{{ $a->ip }}</td>
      </tr>
    @endforeach
    </tbody>
  </table></div>
  @include('admin.partials.pager', ['p' => $actions])
  @endif
</div>
@endsection
