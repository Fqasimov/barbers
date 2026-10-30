<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Sign in · Usta admin</title>
  <link rel="stylesheet" href="{{ asset('admin-assets/admin.css') }}?v=5">
</head>
<body>
<div class="login">
  <div class="card">
    <h1>usta admin</h1>
    <p class="soft">Staff only. You need your password and the code from your authenticator app.</p>
    @if (session('status'))<div class="flash flash-top" role="status">{{ session('status') }}</div>@endif
    @if ($errors->any())<div class="flash error flash-top" role="alert">{{ $errors->first() }}</div>@endif
    <form method="post" action="{{ route('admin.login.attempt') }}">
      @csrf
      <label class="field">Email<input type="email" name="email" value="{{ old('email') }}" autocomplete="username" required autofocus></label>
      <label class="field">Password<input type="password" name="password" autocomplete="current-password" required></label>
      <label class="field">Authenticator code<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" placeholder="123 456" required></label>
      <button class="btn btn-ink" type="submit">Sign in</button>
    </form>
  </div>
</div>
</body>
</html>
