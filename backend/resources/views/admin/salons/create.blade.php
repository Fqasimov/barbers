@extends('admin.layout')
@section('title', 'Add salon')
@section('content')
<a class="crumb" href="{{ route('admin.salons') }}">← Salons</a>
<div class="head"><div><h1>Add salon</h1><p>Register a salon yourself: the owner, the salon and its plan. The owner sets their own password with "Şifrəni unutdum" on first sign-in.</p></div></div>

<form method="post" action="{{ route('admin.salons.store') }}" class="stack">
  @csrf
  <section class="card">
    <div class="card-head"><h2>Owner</h2></div>
    <div class="card-body stack tight new-grid">
      <label class="field">First name<input name="first_name" value="{{ old('first_name') }}" maxlength="60" required></label>
      <label class="field">Last name<input name="last_name" value="{{ old('last_name') }}" maxlength="60" required></label>
      <label class="field">Email (their sign-in)<input type="email" name="email" value="{{ old('email') }}" maxlength="254" required autocomplete="off"></label>
      <label class="field">Phone, +994…<input name="phone" value="{{ old('phone') }}" inputmode="tel" maxlength="20"></label>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Salon</h2></div>
    <div class="card-body stack tight new-grid">
      <label class="field">Salon name<input name="salon_name" value="{{ old('salon_name') }}" maxlength="120" required></label>
      <label class="field">Page address (optional; made from the name if empty)<input name="slug" value="{{ old('slug') }}" maxlength="30" autocomplete="off"></label>
      <label class="field">District<input name="district" value="{{ old('district') }}" maxlength="120" required></label>
      <label class="field">Address<input name="address" value="{{ old('address') }}" maxlength="255" required></label>
      <label class="field">Serves<select name="audience">
        @foreach (['all' => 'Everyone', 'women' => 'Women only', 'men' => 'Men only'] as $v => $l)<option value="{{ $v }}" @selected(old('audience', 'all') === $v)>{{ $l }}</option>@endforeach
      </select></label>
      <fieldset class="field cats">
        <legend>Categories (beauty, or couture on its own)</legend>
        @foreach ($categories as $cat)
          <label class="check"><input type="checkbox" name="categories[]" value="{{ $cat }}" @checked(in_array($cat, old('categories', []), true))> {{ ucfirst($cat) }}</label>
        @endforeach
      </fieldset>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Plan</h2></div>
    <div class="card-body stack tight new-grid">
      <label class="field">Plan<select name="plan">
        @foreach ($markets as $m => $market)
          <optgroup label="{{ ucfirst($m) }}">
            @foreach ($market['plans'] as $p)<option value="{{ $p }}" @selected(old('plan', 'start') === $p)>{{ ucfirst(str_replace('_', ' ', $p)) }} · {{ config("usta.plans.$p.month") }} ₼/month</option>@endforeach
          </optgroup>
        @endforeach
      </select></label>
      <label class="field">Billing<select name="billing">
        <option value="trial" @selected(old('billing', 'trial') === 'trial')>Free trial</option>
        <option value="paid" @selected(old('billing') === 'paid')>Paid until a date (cash, transfer, free for a partner)</option>
      </select></label>
      <label class="field">Trial days (for a trial)<input type="number" name="trial_days" min="1" max="365" value="{{ old('trial_days', 30) }}"></label>
      <label class="field">Paid until (for paid)<input type="date" name="paid_until" value="{{ old('paid_until') }}"></label>
      <label class="check"><input type="checkbox" name="approve" value="1" @checked(old('approve', true))> Approve now (live; in search once it has a service and a master)</label>
    </div>
  </section>

  <div class="row"><button class="btn btn-ink" type="submit">Register salon</button></div>
</form>
@endsection
