<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Stripe\Price;
use Stripe\Product as StripeProduct;
use Stripe\Stripe;

class ProductController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $products = Product::with(['category', 'subCategory', 'images'])->get();
        return $this->success($products, 'Products retrieved successfully.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'sub_category_id' => 'nullable|exists:sub_categories,id',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'title.required' => 'Product title is required.',
            'price.required' => 'Product price is required.',
            'price.numeric' => 'Product price must be a number.',
            'price.min' => 'Product price must be at least 0.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'Selected category does not exist.',
            'sub_category_id.exists' => 'Selected sub-category does not exist.',
            'images.*.image' => 'Each file must be an image.',
            'images.*.mimes' => 'Images must be jpeg, png, jpg, or gif.',
            'images.*.max' => 'Each image may not exceed 2MB.',
        ]);

        $product = Product::create($request->only('title', 'price', 'category_id', 'sub_category_id'));

        $this->syncProductToStripe($product);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image' => $path,
                ]);
            }
        }

        return $this->success(
            $product->load(['category', 'subCategory', 'images']),
            'Product created successfully.',
            201
        );
    }

    public function show($id)
    {
        $product = Product::with(['category', 'subCategory', 'images'])->findOrFail($id);
        return $this->success($product, 'Product retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'sub_category_id' => 'nullable|exists:sub_categories,id',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'title.required' => 'Product title is required.',
            'price.required' => 'Product price is required.',
            'price.numeric' => 'Product price must be a number.',
            'price.min' => 'Product price must be at least 0.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'Selected category does not exist.',
            'sub_category_id.exists' => 'Selected sub-category does not exist.',
            'images.*.image' => 'Each file must be an image.',
            'images.*.mimes' => 'Images must be jpeg, png, jpg, or gif.',
            'images.*.max' => 'Each image may not exceed 2MB.',
        ]);

        $product = Product::findOrFail($id);
        $product->update($request->only('title', 'price', 'category_id', 'sub_category_id'));

        $this->syncProductToStripe($product);

        if ($request->hasFile('images')) {
            foreach ($product->images as $img) {
                Storage::disk('public')->delete($img->image);
                $img->delete();
            }
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image' => $path,
                ]);
            }
        }

        return $this->success(
            $product->load(['category', 'subCategory', 'images']),
            'Product updated successfully.'
        );
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        foreach ($product->images as $img) {
            Storage::disk('public')->delete($img->image);
            $img->delete();
        }

        $product->delete();

        return $this->success(null, 'Product deleted successfully.');
    }

    public function deleteImage($id)
    {
        $image = ProductImage::findOrFail($id);
        Storage::disk('public')->delete($image->image);
        $image->delete();

        return $this->success(null, 'Image deleted successfully.');
    }

    private function syncProductToStripe(Product $product): void
    {
        Stripe::setApiKey(config('services.stripe.secret'));
        if (!$product->stripe_product_id) {
            $stripeProduct = StripeProduct::create([
                'name' => $product->title,
                'metadata' => ['product_id' => (string) $product->id],
            ]);
            $product->update(['stripe_product_id' => $stripeProduct->id]);
        } else {
            StripeProduct::update($product->stripe_product_id, ['name' => $product->title]);
        }

        $unitAmount = (int) round($product->price * 100);
        if ($product->stripe_price_id) {
            try {
                $existingPrice = Price::retrieve($product->stripe_price_id);
                if ((int) $existingPrice->unit_amount === $unitAmount && $existingPrice->active) {
                    return;
                }
            } catch (\Throwable $e) {
            }
        }

        $stripePrice = Price::create([
            'product' => $product->stripe_product_id,
            'unit_amount' => $unitAmount,
            'currency' => 'usd',
        ]);
        $product->update(['stripe_price_id' => $stripePrice->id]);
    }
}
