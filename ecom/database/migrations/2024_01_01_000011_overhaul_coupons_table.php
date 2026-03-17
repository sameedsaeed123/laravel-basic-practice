<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            if (Schema::hasColumn('coupons', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('coupons', 'value')) {
                $table->dropColumn('value');
            }
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->string('discount_type')->default('percent_off')->after('code'); 
            $table->decimal('discount_value', 10, 2)->default(0)->after('discount_type'); 
            $table->string('duration')->default('once')->after('discount_value');
            $table->unsignedInteger('duration_in_months')->nullable()->after('duration'); 
            $table->unsignedInteger('max_redemptions')->nullable()->after('duration_in_months');
            $table->unsignedInteger('times_redeemed')->default(0)->after('max_redemptions');
            $table->boolean('is_active')->default(true)->after('times_redeemed');
            $table->timestamp('expires_at')->nullable()->after('is_active');
            $table->string('stripe_promotion_code_id')->nullable()->after('stripe_coupon_id');
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn([
                'discount_type',
                'discount_value',
                'duration',
                'duration_in_months',
                'max_redemptions',
                'times_redeemed',
                'is_active',
                'expires_at',
                'stripe_promotion_code_id',
            ]);
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->string('type')->default('percentage')->after('code');
            $table->decimal('value', 10, 2)->default(0)->after('type');
        });
    }
};
