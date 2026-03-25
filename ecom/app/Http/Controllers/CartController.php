<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $cart = Cart::with(['items.product.images', 'coupon'])
                ->firstOrCreate(['user_id' => $request->user()->id]);

            return $this->success($this->formatCart($cart), 'Cart retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve cart.', 500);
        }
    }

    public function addItem(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'sometimes|integer|min:1|max:100',
            'selected_color' => 'nullable|string|max:100',
            'selected_size' => 'nullable|string|max:100',
        ], [
            'product_id.required' => 'Please select a product.',
            'product_id.exists' => 'The selected product does not exist.',
            'quantity.integer' => 'Quantity must be a number.',
            'quantity.min' => 'Quantity must be at least 1.',
            'quantity.max' => 'Quantity cannot exceed 100.',
        ]);

        try {
            $product = Product::findOrFail($request->product_id);

            if ($request->filled('selected_color') && !empty($product->colors)) {
                if (!in_array($request->selected_color, $product->colors)) {
                    return $this->error('The selected color is not available for this product.', 422, [
                        'selected_color' => ['Invalid color. Available colors: ' . implode(', ', $product->colors)],
                    ]);
                }
            }

            if ($request->filled('selected_size') && !empty($product->sizes)) {
                if (!in_array($request->selected_size, $product->sizes)) {
                    return $this->error('The selected size is not available for this product.', 422, [
                        'selected_size' => ['Invalid size. Available sizes: ' . implode(', ', $product->sizes)],
                    ]);
                }
            }

            $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

            $query = $cart->items()->where('product_id', $request->product_id);

            if ($request->filled('selected_color')) {
                $query->where('selected_color', $request->selected_color);
            } else {
                $query->whereNull('selected_color');
            }

            if ($request->filled('selected_size')) {
                $query->where('selected_size', $request->selected_size);
            } else {
                $query->whereNull('selected_size');
            }

            $existingItem = $query->first();

            if ($existingItem) {
                $newQty = $existingItem->quantity + ($request->input('quantity', 1));
                if ($newQty > 100) {
                    return $this->error('Cart item quantity cannot exceed 100.', 422);
                }
                $existingItem->update(['quantity' => $newQty]);
            } else {
                $cart->items()->create([
                    'product_id' => $request->product_id,
                    'quantity' => $request->input('quantity', 1),
                    'selected_color' => $request->selected_color,
                    'selected_size' => $request->selected_size,
                ]);
            }

            $cart->load(['items.product.images', 'coupon']);

            return $this->success($this->formatCart($cart), 'Item added to cart.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Product not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to add item to cart.', 500);
        }
    }

    public function updateItem(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
        ], [
            'quantity.required' => 'Quantity is required.',
            'quantity.integer' => 'Quantity must be a number.',
            'quantity.min' => 'Quantity must be at least 1.',
            'quantity.max' => 'Quantity cannot exceed 100.',
        ]);

        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if (!$cart) {
                return $this->error('Cart not found.', 404);
            }

            $item = $cart->items()->where('id', $id)->first();

            if (!$item) {
                return $this->error('Cart item not found.', 404);
            }

            $item->update(['quantity' => $request->quantity]);
            $cart->load(['items.product.images', 'coupon']);

            return $this->success($this->formatCart($cart), 'Cart item updated.');
        } catch (\Throwable $e) {
            return $this->error('Failed to update cart item.', 500);
        }
    }

    public function removeItem(Request $request, $id)
    {
        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if (!$cart) {
                return $this->error('Cart not found.', 404);
            }

            $item = $cart->items()->where('id', $id)->first();

            if (!$item) {
                return $this->error('Cart item not found.', 404);
            }

            $item->delete();
            $cart->load(['items.product.images', 'coupon']);

            return $this->success($this->formatCart($cart), 'Item removed from cart.');
        } catch (\Throwable $e) {
            return $this->error('Failed to remove cart item.', 500);
        }
    }

    public function clear(Request $request)
    {
        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if ($cart) {
                $cart->items()->delete();
                $cart->update(['coupon_id' => null]);
            }

            return $this->success(null, 'Cart cleared successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to clear cart.', 500);
        }
    }

    public function applyCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:255',
        ], [
            'code.required' => 'Please enter a coupon code.',
        ]);

        try {
            $cart = Cart::with('items.product')
                ->firstOrCreate(['user_id' => $request->user()->id]);

            if ($cart->items->isEmpty()) {
                return $this->error('Cannot apply coupon to an empty cart.', 422);
            }

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

            $cart->update(['coupon_id' => $coupon->id]);
            $cart->load(['items.product.images', 'coupon']);

            return $this->success($this->formatCart($cart), 'Coupon applied successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to apply coupon.', 500);
        }
    }

    public function removeCoupon(Request $request)
    {
        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if ($cart) {
                $cart->update(['coupon_id' => null]);
                $cart->load(['items.product.images', 'coupon']);
            }

            $cart = $cart ?? Cart::firstOrCreate(['user_id' => $request->user()->id]);
            $cart->load(['items.product.images', 'coupon']);

            return $this->success($this->formatCart($cart), 'Coupon removed.');
        } catch (\Throwable $e) {
            return $this->error('Failed to remove coupon.', 500);
        }
    }

    private function formatCart(Cart $cart): array
    {
        $subtotal = $cart->getSubtotal();
        $discount = $cart->getDiscount();
        $total = $cart->getTotal();

        $couponData = null;
        if ($cart->coupon) {
            $couponData = [
                'id' => $cart->coupon->id,
                'code' => $cart->coupon->code,
                'discount_type' => $cart->coupon->discount_type,
                'discount_value' => $cart->coupon->discount_value,
                'is_valid' => $cart->coupon->isValid(),
            ];
        }

        return [
            'id' => $cart->id,
            'items' => $cart->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product' => $item->product,
                    'quantity' => $item->quantity,
                    'selected_color' => $item->selected_color,
                    'selected_size' => $item->selected_size,
                    'line_total' => $item->getLineTotal(),
                ];
            }),
            'item_count' => $cart->items->sum('quantity'),
            'coupon' => $couponData,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
        ];
    }
}
