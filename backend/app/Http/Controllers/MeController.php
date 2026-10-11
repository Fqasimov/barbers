<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Http\Resources\UserResource;
use App\Models\PushToken;
use App\Rules\V;
use App\Services\AccountDeletion;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class MeController extends Controller
{
    public function show(Request $request, SessionService $sessions): JsonResponse
    {
        return response()->json($sessions->payload($request->user(), (string) $request->bearerToken(), $request));
    }

    public function update(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'first_name' => ['sometimes', 'required', ...V::name()],
            'last_name' => ['sometimes', 'required', ...V::name()],
            'phone' => ['sometimes', 'required', ...V::phone()],
            'birth_date' => ['sometimes', 'required', ...V::birthDate()],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female'])],
        ]);
        $user = $request->user();
        $user->fill($data)->save();

        return response()->json((new UserResource($user))->resolve($request));
    }

    public function destroy(Request $request, AccountDeletion $deletion): Response
    {
        $user = $request->user();
        if ($user->password !== null) {
            $request->validate(['password' => ['required', 'string', 'max:255']]);
            if (! Hash::check($request->input('password'), $user->password)) {
                throw new ApiException(422, 'invalid_credentials', 'The password is incorrect.', [
                    'errors' => ['password' => ['The password is incorrect.']],
                ]);
            }
        }
        $deletion->delete($user);

        return response()->noContent();
    }

    public function storePushToken(Request $request): Response
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['required', Rule::in(['ios', 'android'])],
        ]);
        // One row per token: a device that changes hands moves to the new user.
        PushToken::query()->updateOrCreate(
            ['token' => $data['token']],
            ['user_id' => $request->user()->id, 'platform' => $data['platform']],
        );

        return response()->noContent();
    }

    public function destroyPushToken(Request $request): Response
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:255']]);
        PushToken::query()->where('token', $data['token'])->where('user_id', $request->user()->id)->delete();

        return response()->noContent();
    }
}
