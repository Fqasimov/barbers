<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhotoResource;
use App\Models\Photo;
use App\Services\Photos\PhotoProcessor;
use App\Services\Photos\UnsupportedPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PhotoController extends Controller
{
    public function store(Request $request, PhotoProcessor $processor): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'max:8192', 'mimetypes:image/jpeg,image/png,image/heic,image/heif', 'extensions:jpg,jpeg,png,heic,heif'],
        ]);
        $business = $this->business($request);
        if (Photo::query()->where('business_id', $business->id)->count() >= config('usta.max_photos')) {
            throw ValidationException::withMessages(['photo' => ['A salon can have at most '.config('usta.max_photos').' photos.']]);
        }

        try {
            $jpeg = $processor->toJpeg($request->file('photo')->getRealPath(), config('usta.photo_max_px'));
        } catch (UnsupportedPhoto $e) {
            throw ValidationException::withMessages(['photo' => [$e->getMessage()]]);
        }

        $disk = config('usta.photo_disk');
        $id = strtolower((string) Str::ulid());
        $path = "salons/{$business->id}/{$id}.jpg";
        Storage::disk($disk)->put($path, $jpeg, ['visibility' => 'public']);

        $photo = new Photo;
        $photo->forceFill([
            'id' => $id,
            'business_id' => $business->id,
            'disk' => $disk,
            'path' => $path,
            'position' => (int) Photo::query()->where('business_id', $business->id)->max('position') + 1,
        ])->save();

        return response()->json((new PhotoResource($photo))->resolve($request), 201);
    }

    public function destroy(Request $request, string $id): Response
    {
        $photo = $this->owned($request, Photo::class, $id);
        $photo->delete();
        $photo->deleteFile();

        return response()->noContent();
    }
}
