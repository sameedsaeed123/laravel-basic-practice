<?php

namespace App\Observers;

use App\Support\DashboardStatsCache;

class DashboardStatsInvalidationObserver
{
    public function created(object $model): void
    {
        DashboardStatsCache::invalidateAll();
    }

    public function deleted(object $model): void
    {
        DashboardStatsCache::invalidateAll();
    }

    public function restored(object $model): void
    {
        DashboardStatsCache::invalidateAll();
    }

    public function forceDeleted(object $model): void
    {
        DashboardStatsCache::invalidateAll();
    }
}
