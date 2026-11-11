<?php

// Polyfill for PHP < 8.4 environments (e.g. PHP 8.3 in WAMP)
if (! function_exists('request_parse_body')) {
    function request_parse_body(): array
    {
        return [$_POST, $_FILES];
    }
}

use App\Http\Middleware\EnsureCanAccessHr;
use App\Http\Middleware\EnsureModuleAccess;
use App\Http\Middleware\EnsureSaasAdmin;
use App\Http\Middleware\EnsureTenantFeatureEnabled;
use App\Http\Middleware\EnsureTenantIsolation;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'tenant.isolation' => EnsureTenantIsolation::class,
            'tenant.feature' => EnsureTenantFeatureEnabled::class,
            'can.hr' => EnsureCanAccessHr::class,
            'module.access' => EnsureModuleAccess::class,
            'saas.admin' => EnsureSaasAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
