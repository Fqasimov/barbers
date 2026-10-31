<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Business;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

abstract class Controller
{
    /** Trims/lowercases emails and strips spaces from phone numbers before validation. */
    protected function normalize(Request $request): void
    {
        $merge = [];
        if (is_string($request->input('email'))) {
            $merge['email'] = mb_strtolower(trim($request->input('email')));
        }
        foreach (['phone', 'whatsapp'] as $f) {
            if (is_string($request->input($f))) {
                $merge[$f] = preg_replace('/[\s\-().]/', '', $request->input($f));
            }
        }
        foreach (['first_name', 'last_name', 'salon_name'] as $f) {
            if (is_string($request->input($f))) {
                $merge[$f] = preg_replace('/\s+/u', ' ', trim($request->input($f)));
            }
        }
        if ($merge) {
            $request->merge($merge);
        }
    }

    /** The signed-in owner's business (resolved by the `business` middleware). */
    protected function business(Request $request): Business
    {
        return $request->attributes->get('business');
    }

    /** The main salon: holds the plan, the branches and the team. */
    protected function account(Request $request): Business
    {
        return $request->attributes->get('account') ?? $this->business($request)->account();
    }

    /** owner | manager */
    protected function role(Request $request): string
    {
        return $request->attributes->get('business_role', 'owner');
    }

    /** Billing, branches and the team are the owner's alone. */
    protected function ownerOnly(Request $request): void
    {
        if ($this->role($request) !== 'owner') {
            throw ApiException::forbidden('Only the salon owner can do this.');
        }
    }

    /**
     * Ownership check for anything addressed by id under /business:
     * unknown → 404 not_found, someone else's → 403 forbidden.
     *
     * @template T of Model
     *
     * @param  class-string<T>  $class
     * @return T
     */
    protected function owned(Request $request, string $class, string $id): Model
    {
        $model = $class::query()->find($id);
        if (! $model) {
            throw ApiException::notFound();
        }
        if ($model->business_id !== $this->business($request)->id) {
            throw ApiException::forbidden();
        }

        return $model;
    }
}
