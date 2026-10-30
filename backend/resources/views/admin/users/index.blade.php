@extends('admin.layout')
@section('title', 'Users')
@use('App\Support\AdminView', 'V')
@section('content')
<div class="head"><div><h1>Users</h1><p>Customers and salon owners. Staff accounts are separate.</p></div></div>
<form class="filters" method="get">
  <input type="search" name="q" value="{{ $q }}" placeholder="Name, email, phone or id" aria-label="Search users">
  <select name="role" aria-label="Role">
    <option value="">Everyone</option>
    <option value="customer" @selected($role === 'customer')>Customers</option>
    <option value="business" @selected($role === 'business')>Salon owners</option>
  </select>
  <button class="btn" type="submit">Filter</button>
  @if ($q || $role)<a class="btn" href="{{ route('admin.users') }}">Clear</a>@endif
</form>
<div class="card">
  @if ($users->isEmpty())<p class="empty">No users match.</p>@else
  <div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th class="num">Bookings</th><th class="num">Sessions</th><th>Joined</th></tr></thead>
    <tbody>
    @foreach ($users as $u)
      <tr>
        <td><a class="row-link" href="{{ route('admin.users.show', $u->id) }}">{{ $u->first_name }} {{ $u->last_name }}</a>@if ($u->business)<span class="sub">{{ $u->business->name }}</span>@endif</td>
        <td>{{ $u->email }}<span class="sub">{{ $u->phone ?: '—' }}</span></td>
        <td>{{ $u->role === 'business' ? 'Salon owner' : 'Customer' }}@unless ($u->email_verified_at)<span class="sub">email not confirmed</span>@endunless</td>
        <td class="num">{{ $u->bookings_count }}</td>
        <td class="num">{{ $u->tokens_count }}</td>
        <td class="small">{{ V::date($u->created_at) }}</td>
      </tr>
    @endforeach
    </tbody>
  </table></div>
  @include('admin.partials.pager', ['p' => $users])
  @endif
</div>
@endsection
