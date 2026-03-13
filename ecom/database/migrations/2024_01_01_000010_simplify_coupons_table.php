<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn(['valid_from', 'valid_until', 'usage_limit', 'times_used']);
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->timestamp('valid_from')->nullable()->after('stripe_coupon_id');
            $table->timestamp('valid_until')->nullable()->after('valid_from');
            $table->unsignedInteger('usage_limit')->nullable()->after('valid_until');
            $table->unsignedInteger('times_used')->default(0)->after('usage_limit');
        });
    }
};
