<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessResource;
use App\Rules\LocText;
use App\Rules\V;
use App\Support\Loc;
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
        $this->normalize($request);
        $data = $request->validate([
            'salon_name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'about' => ['sometimes', 'nullable', new LocText(2000)],
            'phone' => ['sometimes', 'required', 'string', 'regex:'.V::AZ_PHONE],
            'whatsapp' => ['sometimes', 'nullable', 'string', 'regex:/^\+?994\d{9}$/'],
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
        ]);
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
                'coords' => [$map['latitude'], $map['longitude']] = $value ? [(float) $value['latitude'], (float) $value['longitude']] : [null, null],
                'categories' => $map['categories'] = array_values($value),
                'hours' => [$map['hours_open'], $map['hours_close']] = [$value['open'], $value['close']],
                'closed_days' => $map['closed_days'] = array_values(array_map('intval', $value)),
                default => $map[$field] = is_string($value) ? trim($value) : $value,
            };
        }
        $b->forceFill($map)->save();

        return response()->json((new BusinessResource($b->fresh()))->resolve($request));
    }
}
