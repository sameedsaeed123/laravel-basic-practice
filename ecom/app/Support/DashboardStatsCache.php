<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

class DashboardStatsCache
{
    public const TTL_SECONDS = 60;

    private const VERSION_KEY = 'dashboard_stats_version';

    public static function rememberForUser(int $userId, Closure $callback, int $ttlSeconds = self::TTL_SECONDS): array
    {
        return Cache::remember(self::keyForUser($userId), now()->addSeconds($ttlSeconds), $callback);
    }

    public static function invalidateAll(): void
    {
        Cache::increment(self::VERSION_KEY);
    }

    private static function keyForUser(int $userId): string
    {
        $version = (int) Cache::get(self::VERSION_KEY, 1);

        return "dashboard_stats:v{$version}:user:{$userId}";
    }
}
