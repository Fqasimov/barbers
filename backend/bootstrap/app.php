<?php

use App\Http\Middleware\EnsureBusinessOwner;
use App\Http\Middleware\ForceJson;
use App\Http\Middleware\TrustProxiesFromConfig;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [ForceJson::class]);
        $middleware->alias(['business' => EnsureBusinessOwner::class]);
        // Behind a load balancer / reverse proxy: TRUSTED_PROXIES="*" or a list of IPs.
        $middleware->replace(TrustProxies::class, TrustProxiesFromConfig::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $isApi = fn (Request $request) => $request->is('api/*') || $request->expectsJson();
        $exceptions->shouldRenderJsonWhen($isApi);

        $error = fn (int $status, string $code, string $message) => response()->json(['error' => $code, 'message' => $message], $status);

        // ApiException renders itself; ValidationException keeps Laravel's standard 422 { message, errors }.
        $exceptions->render(function (AuthenticationException $e, Request $request) use ($isApi, $error) {
            return $isApi($request) ? $error(401, 'session_expired', 'Please sign in again.') : null;
        });
        $exceptions->render(function (AuthorizationException|AccessDeniedHttpException $e, Request $request) use ($isApi, $error) {
            return $isApi($request) ? $error(403, 'forbidden', 'You can’t do that.') : null;
        });
        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $e, Request $request) use ($isApi, $error) {
            return $isApi($request) ? $error(404, 'not_found', 'Not found.') : null;
        });
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) use ($isApi, $error) {
            return $isApi($request) ? $error(405, 'method_not_allowed', 'Method not allowed.') : null;
        });
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) use ($isApi) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json(['error' => 'too_many_attempts', 'message' => 'Too many requests. Try again in a moment.'], 429, $e->getHeaders());
        });
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($isApi, $error) {
            if (! $isApi($request) || $e->getStatusCode() < 400) {
                return null;
            }

            return $error($e->getStatusCode(), $e->getStatusCode() >= 500 ? 'server_error' : 'http_error', $e->getMessage() ?: 'Request failed.');
        });
        $exceptions->render(function (Throwable $e, Request $request) use ($isApi, $error) {
            if (! $isApi($request) || config('app.debug')
                || $e instanceof ValidationException || $e instanceof HttpResponseException || $e instanceof AuthenticationException) {
                return null;
            }

            return $error(500, 'server_error', 'Something went wrong.');
        });
    })->create();
