<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Http\Resources\BusinessResource;
use App\Rules\LocText;
use App\Rules\V;
use App\Services\Photos\PhotoProcessor;
use App\Support\Loc;
use App\Support\PhotoUpload;
use App\Support\PublicFile;
use App\Support\Week;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BusinessController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json((new BusinessResource($this->business($request)))->resolve($request));
    }

    public function update(Request $request): JsonResponse
    {
        // Managers run the calendar, hours and the team's day; how clients reach the salon
        // (name, phone, WhatsApp, links, page address) is the owner's.
        if ($request->hasAny(['salon_name', 'name', 'phone', 'whatsapp', 'booking_url', 'slug', 'instagram'])) {
            $this->ownerOnly($request);
        }
        $this->normalize($request);
        if (is_string($request->input('slug'))) {
            $request->merge(['slug' => mb_strtolower(trim($request->input('slug')))]);
        }
        $data = $request->validate([
            'salon_name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'about' => ['sometimes', 'nullable', new LocText(2000)],
            'phone' => ['sometimes', 'required', 'string', 'regex:'.V::AZ_PHONE],
            'whatsapp' => ['sometimes', 'nullable', 'string', 'regex:/^\+?994\d{9}$/'],
            // The salon's own booking page (DIKIDI, a website, wa.me…), optional.
            'booking_url' => ['sometimes', 'nullable', 'string', 'max:500', 'url:https,http'],
            'address' => ['sometimes', 'required', 'string', 'max:255'],
            'district' => ['sometimes', 'required', 'string', 'max:120'],
            'coords' => ['sometimes', 'nullable', 'array'],
            'coords.latitude' => ['required_with:coords', 'numeric', 'between:-90,90'],
            'coords.longitude' => ['required_with:coords', 'numeric', 'between:-180,180'],
            'categories' => ['sometimes', 'required', 'array', 'min:1'],
            'categories.*' => ['string', 'distinct', Rule::in(config('usta.categories'))],
            'audience' => ['sometimes', 'required', Rule::in(['all', 'women', 'men'])],
            'hours' => ['sometimes', 'required', 'array'],
            'hours.open' => ['required_with:hours', ...V::clock()],
            'hours.close' => ['required_with:hours', ...V::clock()],
            'closed_days' => ['sometimes', 'present', 'array', 'max:7'],
            'closed_days.*' => ['integer', 'distinct', 'between:0,6'],
            ...Week::rules('hours_week', 'open', 'close'),
            // Personal page: <slug>.yazilnow.az. Lowercase latin letters, digits and single hyphens.
            'slug' => ['sometimes', 'nullable', 'string', 'min:3', 'max:30', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/',
                Rule::notIn(config('usta.reserved_slugs')), Rule::unique('businesses', 'slug')->ignore($this->business($request)->id)],
        ]);
        if (! empty($data['slug'])) {
            $this->business($request)->requireFeature('personal_page');
        }
        if (isset($data['categories'])) {
            $market = Business::marketOf(array_values($data['categories']));
            if ($market === null) {
                throw ValidationException::withMessages(['categories' => ['A couture showroom and beauty services are separate kinds of business.']]);
            }
            $plan = $this->account($request)->subscription?->plan;
            if ($plan && ! in_array($plan, config("usta.markets.{$market}.plans"), true)) {
                throw new ApiException(422, 'wrong_market', 'Your plan is for another kind of business. Change the plan first.');
            }
        }
        if (isset($data['hours']) && $data['hours']['close'] <= $data['hours']['open']) {
            throw ValidationException::withMessages(['hours.close' => ['Closing time must be after opening time.']]);
        }

        $b = $this->business($request);
        $map = [];
        foreach ($data as $field => $value) {
            match ($field) {
                'salon_name' => $map['name'] = $value,
                'about' => $map['about'] = Loc::from($value),
                'whatsapp' => $map['whatsapp'] = $value ? ltrim($value, '+') : '',
                'booking_url' => $map['booking_url'] = $value ? trim($value) : null,
                'slug' => $map['slug'] = $value ?: null,
                'coords' => [$map['latitude'], $map['longitude']] = $value ? [(float) $value['latitude'], (float) $value['longitude']] : [null, null],
                'categories' => $map['categories'] = array_values($value),
                'hours' => [$map['hours_open'], $map['hours_close']] = [$value['open'], $value['close']],
                'closed_days' => $map['closed_days'] = array_values(array_map('intval', $value)),
                'hours_week' => null,
                default => $map[$field] = is_string($value) ? trim($value) : $value,
            };
        }
        if (array_key_exists('hours_week', $data)) {
            if ($data['hours_week'] === null) {
                $map['hours_week'] = null;
            } else {
                $week = Week::normalize($data['hours_week'], 'hours_week', 'open', 'close');
                [$off, $open, $close] = Week::summary($week, 'open', 'close');
                // Keep the single pair in step for app versions that only read it.
                $map += ['hours_week' => $week, 'closed_days' => $off, 'hours_open' => $open ?? $b->hours_open, 'hours_close' => $close ?? $b->hours_close];
            }
        } elseif (isset($map['hours_open']) || isset($map['closed_days'])) {
            // An older app set one pair for the week: that replaces the per-day hours.
            $map['hours_week'] = null;
        }
        $b->forceFill($map)->save();

        $b->fresh()->ensureSoloMaster(); // Fərdi: the one master works the salon’s hours.

        return response()->json((new BusinessResource($b->fresh()))->resolve($request));
    }

    /** The salon's logo: square-ish mark shown on the map, the salon page and the panel. */
    public function logo(Request $request, PhotoProcessor $processor): JsonResponse
    {
        $this->ownerOnly($request);
        $b = $this->business($request);
        $path = PhotoUpload::store($request, $processor, "salons/{$b->id}/logo", 600);
        $old = $b->logo_path;
        $b->forceFill(['logo_path' => $path])->save();
        PublicFile::delete($old);

        return response()->json((new BusinessResource($b->fresh()))->resolve($request));
    }

    public function deleteLogo(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $b = $this->business($request);
        $old = $b->logo_path;
        $b->forceFill(['logo_path' => null])->save();
        PublicFile::delete($old);

        return response()->json((new BusinessResource($b->fresh()))->resolve($request));
    }
}
