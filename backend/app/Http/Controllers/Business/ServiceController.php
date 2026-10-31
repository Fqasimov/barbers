<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Rules\LocText;
use App\Support\Catalogue;
use App\Support\Loc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, true);
        $business = $this->business($request);
        $name = Loc::from($data['name']);

        $service = new Service;
        $service->forceFill([
            'business_id' => $business->id,
            'key' => Catalogue::serviceKey($name),
            'name' => $name,
            'description' => Loc::from($data['description'] ?? null),
            'category' => $data['category'],
            'duration_min' => (int) $data['duration_min'],
            'price' => (int) $data['price'],
            'deposit_type' => $data['deposit']['type'] ?? 'none',
            'deposit_value' => (int) ($data['deposit']['value'] ?? 0),
            'position' => (int) Service::query()->where('business_id', $business->id)->max('position') + 1,
        ])->save();

        return response()->json((new ServiceResource($service))->resolve($request), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $service = $this->owned($request, Service::class, $id);
        $data = $this->validated($request, false);
        $map = [];
        if (array_key_exists('name', $data)) {
            $map['name'] = Loc::from($data['name']);
            $map['key'] = Catalogue::serviceKey($map['name']);
        }
        if (array_key_exists('description', $data)) {
            $map['description'] = Loc::from($data['description']);
        }
        foreach (['category', 'duration_min', 'price'] as $f) {
            if (array_key_exists($f, $data)) {
                $map[$f] = $f === 'category' ? $data[$f] : (int) $data[$f];
            }
        }
        if (array_key_exists('deposit', $data)) {
            $map['deposit_type'] = $data['deposit']['type'] ?? 'none';
            $map['deposit_value'] = $map['deposit_type'] === 'none' ? 0 : (int) ($data['deposit']['value'] ?? 0);
        }
        $service->forceFill($map)->save();

        return response()->json((new ServiceResource($service))->resolve($request));
    }

    /** Also removed from every master's service_ids (pivot rows cascade). */
    public function destroy(Request $request, string $id): Response
    {
        $service = $this->owned($request, Service::class, $id);
        $service->masters()->detach();
        $service->delete();

        return response()->noContent();
    }

    private function validated(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        $data = $request->validate([
            'name' => [$req, new LocText(120)],
            'category' => [$req, Rule::in(config('usta.categories'))],
            'duration_min' => [$req, 'integer', 'min:5', 'max:480'],
            'price' => [$req, 'integer', 'min:0', 'max:10000'],
            'description' => ['sometimes', 'nullable', new LocText(1000)],
            // Pro: what the client pays when booking. fixed: whole AZN; percent: of the price.
            'deposit' => ['sometimes', 'array'],
            'deposit.type' => ['required_with:deposit', Rule::in(['none', 'fixed', 'percent'])],
            'deposit.value' => ['exclude_without:deposit', 'required_unless:deposit.type,none', 'integer', 'min:1', 'max:10000'],
        ]);
        if (($data['deposit']['type'] ?? 'none') !== 'none') {
            $this->business($request)->requireFeature('deposits');
            if ($data['deposit']['type'] === 'percent' && (int) $data['deposit']['value'] > 100) {
                throw ValidationException::withMessages(['deposit.value' => ['A percentage is at most 100.']]);
            }
        }

        return $data;
    }
}
