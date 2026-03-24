<?php

namespace App\Http\Controllers;

use App\Mail\OrderConfirmation;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Price;
use Stripe\Product as StripeProduct;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function checkout()
    {
        return response()->json(['message' => 'Use POST /stripe/checkout-session with product_id, quantity, and optional coupon_code']);
    }

    public function session(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'sometimes|integer|min:1|max:100',
            'coupon_code' => 'nullable|string|max:255',
            'selected_color' => 'nullable|string|max:100',
            'selected_size' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $quantity = (int) $request->input('quantity', 1);
        $product = Product::findOrFail($request->product_id);

        $this->ensureProductHasStripePrice($product);
        $product->refresh();

        if (!$product->stripe_price_id) {
            return response()->json([
                'status' => false,
                'message' => 'Product is not available for checkout at this time',
            ], 500);
        }

        $lineItem = [
            'price' => $product->stripe_price_id,
            'quantity' => $quantity,
        ];

        $successUrl = url('/api/stripe/checkout-success') . '?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = url('/api/stripe/checkout-cancel');

        $sessionParams = [
            'payment_method_types' => ['card'],
            'line_items' => [$lineItem],
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'metadata' => array_filter([
                'product_id' => (string) $product->id,
                'quantity' => (string) $quantity,
                'selected_color' => $request->input('selected_color'),
                'selected_size' => $request->input('selected_size'),
            ]),
        ];
        if ($request->coupon_code) {
            $coupon = Coupon::where('code', strtoupper($request->coupon_code))->first();

            if (!$coupon || !$coupon->isValid()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid or expired coupon code',
                ], 422);
            }

            if ($coupon->stripe_coupon_id) {
                $sessionParams['discounts'] = [
                    ['coupon' => $coupon->stripe_coupon_id],
                ];
                $sessionParams['metadata']['coupon_id'] = (string) $coupon->id;
            }
        } else {
            $sessionParams['allow_promotion_codes'] = true;
        }

        if ($request->user() && $request->user()->email) {
            $sessionParams['customer_email'] = $request->user()->email;
        }

        try {
            $session = StripeSession::create($sessionParams);
            return response()->json([
                'status' => true,
                'url' => $session->url,
            ]);
        } catch (\Throwable $e) {
            Log::error('Stripe session creation failed: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to create checkout session',
            ], 500);
        }
    }

    public function success(Request $request)
    {
        $sessionId = $request->get('session_id');
        $frontendUrl = config('services.frontend_url');

        if (!$sessionId) {
            return redirect($frontendUrl);
        }

        try {
            $session = StripeSession::retrieve($sessionId, [
                'expand' => [
                    'discounts.coupon',
                    'discounts.promotion_code',
                ],
            ]);

            if ($session->payment_status === 'paid') {
                $this->createOrderFromSession($session);
                return redirect($frontendUrl . '/checkout-success?session_id=' . urlencode($sessionId));
            }
        } catch (\Throwable $e) {
            Log::error('Stripe success handler error: ' . $e->getMessage());
        }

        return redirect($frontendUrl);
    }

    private function createOrderFromSession($session): void
    {
        $existing = Order::where('stripe_session_id', $session->id)->first();
        if ($existing) {
            return;
        }

        $email = $session->customer_email
            ?? ($session->customer_details->email ?? null);
        $amount = $session->amount_total ? $session->amount_total / 100 : 0;

        $userId = null;
        if ($email) {
            $user = \App\Models\User::where('email', $email)->first();
            $userId = $user?->id;
        }

        $stripeCouponId = null;
        $couponType = null;
        $localCouponId = null;

        try {
           
            $metadata = $session->metadata ?? (object) [];
            if (!empty($metadata->coupon_id)) {
                $localCoupon = Coupon::find($metadata->coupon_id);
                if ($localCoupon) {
                    $localCouponId = $localCoupon->id;
                    $stripeCouponId = $localCoupon->stripe_coupon_id;
                    $couponType = $localCoupon->discount_type;
                }
            }
            if (!$stripeCouponId && !empty($session->discounts)) {
                $first = is_array($session->discounts) ? ($session->discounts[0] ?? null) : ($session->discounts[0] ?? null);
                if ($first) {
                    $couponObj = null;
                    if (is_object($first->coupon ?? null)) {
                        $couponObj = $first->coupon;
                    } elseif (is_string($first->coupon ?? null) && $first->coupon !== '') {
                        $stripeCouponId = $first->coupon;
                    }
                    if ($couponObj) {
                        $stripeCouponId = $couponObj->id;
                        $couponType = isset($couponObj->percent_off) && $couponObj->percent_off > 0 ? 'percent_off' : 'amount_off';
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('Stripe coupon extraction failed: ' . $e->getMessage(), ['session_id' => $session->id]);
        }

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $userId,
                'stripe_session_id' => $session->id,
                'status' => 'paid',
                'amount' => $amount,
                'email' => $email,
                'stripe_coupon_id' => $stripeCouponId,
                'coupon_type' => $couponType,
            ]);

            $productId = $metadata->product_id ?? null;
            $quantity = (int) ($metadata->quantity ?? 1);

            if ($productId) {
                $product = Product::find($productId);
                if ($product) {
                    $itemPrice = $quantity > 0 ? $amount / $quantity : $amount;
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'price' => round($itemPrice, 2),
                    ]);
                }
            }

            if ($localCouponId) {
                Coupon::where('id', $localCouponId)->increment('times_redeemed');
            }

            DB::commit();

            if ($email) {
                try {
                    $order->load(['items.product']);
                    Mail::to($email)->send(new OrderConfirmation($order));
                } catch (\Throwable $e) {
                    Log::error('Order confirmation mail failed: ' . $e->getMessage(), ['order_id' => $order->id]);
                }
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Order creation failed: ' . $e->getMessage(), ['session_id' => $session->id]);
        }
    }

    private function ensureProductHasStripePrice(Product $product): void
    {
        if (!$product->stripe_product_id) {
            $stripeProduct = StripeProduct::create([
                'name' => $product->title,
                'metadata' => ['product_id' => (string) $product->id],
            ]);
            $product->update(['stripe_product_id' => $stripeProduct->id]);
        }

        $unitAmount = (int) round($product->price * 100);
        if ($product->stripe_price_id) {
            try {
                $existingPrice = Price::retrieve($product->stripe_price_id);
                if ((int) $existingPrice->unit_amount === $unitAmount && $existingPrice->active) {
                    return;
                }
            } catch (\Throwable $e) {
                Log::warning('Stripe price retrieval failed, creating new: ' . $e->getMessage());
            }
        }
        $stripePrice = Price::create([
            'product' => $product->stripe_product_id,
            'unit_amount' => $unitAmount,
            'currency' => 'usd',
        ]);
        $product->update(['stripe_price_id' => $stripePrice->id]);
    }

    public function cancel(Request $request)
    {
        return redirect(config('services.frontend_url'));
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (!$webhookSecret) {
            Log::error('Stripe webhook secret not configured');
            return response('Webhook secret not set', 500);
        }

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            Log::warning('Stripe webhook invalid payload: ' . $e->getMessage());
            return response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::warning('Stripe webhook invalid signature: ' . $e->getMessage());
            return response('Invalid signature', 400);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $session = $event->data->object;
                if ($session->payment_status === 'paid') {
                    try {
                        $session = StripeSession::retrieve($session->id, [
                            'expand' => [
                                'discounts.coupon',
                                'discounts.promotion_code',
                            ],
                        ]);
                        $this->createOrderFromSession($session);
                    } catch (\Throwable $e) {
                        Log::error('Webhook order creation failed: ' . $e->getMessage());
                    }
                }
                break;

            case 'checkout.session.expired':
                $session = $event->data->object;
                $existing = Order::where('stripe_session_id', $session->id)->first();
                if (!$existing) {
                    $email = $session->customer_email
                        ?? ($session->customer_details->email ?? null);
                    Order::create([
                        'user_id' => null,
                        'stripe_session_id' => $session->id,
                        'status' => 'failed',
                        'amount' => 0,
                        'email' => $email,
                    ]);
                } else {
                    $existing->update(['status' => 'failed']);
                }
                break;

            default:
                break;
        }

        return response()->json(['received' => true]);
    }
}
