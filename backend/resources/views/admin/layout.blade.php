<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>@yield('title', 'Admin') · Usta</title>
  <link rel="stylesheet" href="{{ asset('admin-assets/admin.css') }}?v=5">
  <script src="{{ asset('admin-assets/admin.js') }}?v=5" defer></script>
</head>
<body>
@php
  $nav = [
    ['admin.dashboard', 'Overview', null],
    ['admin.salons', 'Salons', $navCounts['pending'] ?? 0],
    ['admin.reviews', 'Reviews', $navCounts['reports'] ?? 0],
    ['admin.users', 'Users', null],
    ['admin.bookings', 'Bookings', null],
    ['admin.payments', 'Payments', null],
    ['admin.activity', 'Activity', null],
  ];
@endphp
<div class="shell">
  <aside class="side">
    <a class="brand" href="{{ route('admin.dashboard') }}">usta <small>admin</small></a>
    <nav class="nav" aria-label="Sections">
      @foreach ($nav as [$name, $label, $count])
        <a href="{{ route($name) }}" @if (request()->routeIs($name.'*')) aria-current="page" @endif>
          <span>{{ $label }}</span>
          @if ($count) <span class="count" title="Waiting">{{ $count }}</span> @endif
        </a>
      @endforeach
    </nav>
    <div class="side-foot">
      <span class="who">Signed in as <strong>{{ auth('admin')->user()->name }}</strong></span>
      <form method="post" action="{{ route('admin.logout') }}">@csrf<button class="btn btn-sm" type="submit">Sign out</button></form>
    </div>
  </aside>
  <main>
    @if (session('status'))<div class="flash" role="status">{{ session('status') }}</div>@endif
    @if ($errors->any())
      <div class="flash error" role="alert"><ul>@foreach ($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul></div>
    @endif
    @yield('content')
  </main>
</div>
</body>
</html>
