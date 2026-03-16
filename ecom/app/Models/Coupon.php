<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'duration',
        'duration_in_months',
        'max_redemptions',
        'times_redeemed',
        'is_active',
        'expires_at',
        'stripe_coupon_id',
        'stripe_promotion_code_id',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'max_redemptions' => 'integer',
            'times_redeemed' => 'integer',
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_redemptions && $this->times_redeemed >= $this->max_redemptions) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $amount): float
    {
        if ($this->discount_type === 'percent_off') {
            return round($amount * ($this->discount_value / 100), 2);
        }
        return min((float) $this->discount_value, $amount);
    }
}
