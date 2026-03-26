<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\SubCategory;
use App\Models\User;
use App\Observers\DashboardStatsInvalidationObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Category::observe(DashboardStatsInvalidationObserver::class);
        SubCategory::observe(DashboardStatsInvalidationObserver::class);
        Product::observe(DashboardStatsInvalidationObserver::class);
        Order::observe(DashboardStatsInvalidationObserver::class);
        Coupon::observe(DashboardStatsInvalidationObserver::class);
        User::observe(DashboardStatsInvalidationObserver::class);
        Role::observe(DashboardStatsInvalidationObserver::class);

        $caFile = env('MAIL_CA_FILE');

        if (is_string($caFile) && $caFile !== '' && is_file($caFile)) {
            ini_set('openssl.cafile', $caFile);
            ini_set('curl.cainfo', $caFile);
        } elseif (is_string($caFile) && $caFile !== '') {
            Log::warning('MAIL_CA_FILE is configured but file not found: '.$caFile);
        }

        ResetPassword::createUrlUsing(function (object $user, string $token) {
            return config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });
    }
}
