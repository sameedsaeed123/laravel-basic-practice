<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Coupon as StripeCoupon;
use Stripe\PromotionCode;
use Stripe\Stripe;

class CouponController extends Controller
{
    use ApiResponse;

    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function index()
    {
        $coupons = Coupon::orderBy('id', 'desc')->get();
        return $this->success($coupons, 'Coupons retrieved successfully.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:255|unique:coupons,code',
            'discount_type' => 'required|in:percent_off,amount_off',
            'discount_value' => 'required|numeric|min:0.01',
            'duration' => 'required|in:once,repeating,forever',
            'duration_in_months' => 'required_if:duration,repeating|nullable|integer|min:1|max:36',
            'max_redemptions' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date|after:now',
        ]);

        if ($request->discount_type === 'percent_off') {
            if (!is_numeric($request->discount_value) || floor((float) $request->discount_value) != (float) $request->discount_value) {
                return $this->error('Validation error.', 422, [
                    'discount_value' => ['Percentage discount must be a whole number.'],
                ]);
            }

            if ((int) $request->discount_value < 1 || (int) $request->discount_value > 100) {
                return $this->error('Validation error.', 422, [
                    'discount_value' => ['Percentage discount must be between 1 and 100.'],
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $stripeParams = [
                'name' => strtoupper($request->code),
                'duration' => $request->duration,
            ];

            if ($request->discount_type === 'percent_off') {
                $stripeParams['percent_off'] = (float) $request->discount_value;
            } else {
                $stripeParams['amount_off'] = (int) round($request->discount_value * 100);
                $stripeParams['currency'] = 'usd';
            }

            if ($request->duration === 'repeating') {
                $stripeParams['duration_in_months'] = (int) $request->duration_in_months;
            }

            if ($request->max_redemptions) {
                $stripeParams['max_redemptions'] = (int) $request->max_redemptions;
            }

            if ($request->expires_at) {
                $stripeParams['redeem_by'] = strtotime($request->expires_at);
            }
            $stripeCoupon = StripeCoupon::create($stripeParams);

            $promoParams = [
                'promotion' => [
                    'coupon' => $stripeCoupon->id,
                    'type' => 'coupon',
                ],
                'code' => strtoupper($request->code),
            ];

            if ($request->max_redemptions) {
                $promoParams['max_redemptions'] = (int) $request->max_redemptions;
            }

            if ($request->expires_at) {
                $promoParams['expires_at'] = strtotime($request->expires_at);
            }

            $promoCode = PromotionCode::create($promoParams);
            $coupon = Coupon::create([
                'code' => strtoupper($request->code),
                'discount_type' => $request->discount_type,
                'discount_value' => $request->discount_value,
                'duration' => $request->duration,
                'duration_in_months' => $request->duration === 'repeating' ? $request->duration_in_months : null,
                'max_redemptions' => $request->max_redemptions,
                'times_redeemed' => 0,
                'is_active' => true,
                'expires_at' => $request->expires_at,
                'stripe_coupon_id' => $stripeCoupon->id,
                'stripe_promotion_code_id' => $promoCode->id,
            ]);

            DB::commit();

            return $this->success($coupon, 'Coupon created successfully.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Coupon creation failed: ' . $e->getMessage());
            return $this->error('Failed to create coupon: ' . $e->getMessage(), 500);
        }
    }

    public function show($id)
    {
        $coupon = Coupon::findOrFail($id);
        return $this->success($coupon, 'Coupon retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);

        $request->validate([
            'is_active' => 'required|boolean',
            'max_redemptions' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date|after:now',
        ]);

        DB::beginTransaction();
        try {
            if (!$request->is_active && $coupon->is_active && $coupon->stripe_promotion_code_id) {
                PromotionCode::update($coupon->stripe_promotion_code_id, [
                    'active' => false,
                ]);
            } elseif ($request->is_active && !$coupon->is_active && $coupon->stripe_promotion_code_id) {
                PromotionCode::update($coupon->stripe_promotion_code_id, [
                    'active' => true,
                ]);
            }

            $coupon->update([
                'is_active' => $request->is_active,
                'max_redemptions' => $request->max_redemptions,
                'expires_at' => $request->expires_at,
            ]);

            DB::commit();

            return $this->success($coupon->fresh(), 'Coupon updated successfully.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Coupon update failed: ' . $e->getMessage());
            return $this->error('Failed to update coupon: ' . $e->getMessage(), 500);
        }
    }

    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);

        DB::beginTransaction();
        try {
            if ($coupon->stripe_promotion_code_id) {
                try {
                    PromotionCode::update($coupon->stripe_promotion_code_id, ['active' => false]);
                } catch (\Throwable $e) {
                    Log::warning('Could not deactivate Stripe promotion code: ' . $e->getMessage());
                }
            }

            if ($coupon->stripe_coupon_id) {
                try {
                    StripeCoupon::retrieve($coupon->stripe_coupon_id)->delete();
                } catch (\Throwable $e) {
                    Log::warning('Could not delete Stripe coupon: ' . $e->getMessage());
                }
            }

            $coupon->delete();
            DB::commit();

            return $this->success(null, 'Coupon deleted successfully.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->error('Failed to delete coupon.', 500);
        }
    }

    public function validate(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return $this->error('Invalid coupon code.', 404);
        }

        if (!$coupon->isValid()) {
            $reason = 'Coupon is no longer valid.';
            if (!$coupon->is_active) {
                $reason = 'This coupon has been deactivated.';
            } elseif ($coupon->expires_at && $coupon->expires_at->isPast()) {
                $reason = 'This coupon has expired.';
            } elseif ($coupon->max_redemptions && $coupon->times_redeemed >= $coupon->max_redemptions) {
                $reason = 'This coupon has reached its maximum usage limit.';
            }

            return $this->error($reason, 422);
        }

        $discount = $coupon->calculateDiscount((float) $request->amount);
        $finalAmount = round((float) $request->amount - $discount, 2);

        return $this->success([
            'code' => $coupon->code,
            'discount_type' => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
            'discount_amount' => $discount,
            'final_amount' => max(0, $finalAmount),
        ], 'Coupon applied successfully.');
    }
}
