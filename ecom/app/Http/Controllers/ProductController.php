<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Stripe\Price;
use Stripe\Product as StripeProduct;
use Stripe\Stripe;

class ProductController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $products = Product::with(['category', 'subCategory', 'images'])->get();
            return $this->success($products, 'Products retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve products.', 500);
        }
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

        try {
            $product = Product::create($request->only('title', 'price', 'category_id', 'sub_category_id'));

            $this->syncProductToStripe($product);

            if ($request->hasFile('images')) {
                File::ensureDirectoryExists(public_path('products'));
                foreach ($request->file('images') as $image) {
                    $filename = uniqid() . '_' . $image->getClientOriginalName();
                    $image->move(public_path('products'), $filename);
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image' => 'products/' . $filename,
                    ]);
                }
            }

            return $this->success(
                $product->load(['category', 'subCategory', 'images']),
                'Product created successfully.',
                201
            );
        } catch (\Throwable $e) {
            Log::error('Product creation failed: ' . $e->getMessage());
            return $this->error('Failed to create product: ' . $e->getMessage(), 500);
        }
    }

    public function show($id)
    {
        try {
            $product = Product::with(['category', 'subCategory', 'images'])->findOrFail($id);
            return $this->success($product, 'Product retrieved successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Product not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve product.', 500);
        }
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

        try {
            $product = Product::findOrFail($id);
            $product->update($request->only('title', 'price', 'category_id', 'sub_category_id'));

            $this->syncProductToStripe($product);

            if ($request->hasFile('images')) {
                foreach ($product->images as $img) {
                    $fullPath = public_path($img->image);
                    if (File::exists($fullPath)) {
                        File::delete($fullPath);
                    }
                    $img->delete();
                }
                File::ensureDirectoryExists(public_path('products'));
                foreach ($request->file('images') as $image) {
                    $filename = uniqid() . '_' . $image->getClientOriginalName();
                    $image->move(public_path('products'), $filename);
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image' => 'products/' . $filename,
                    ]);
                }
            }

            return $this->success(
                $product->load(['category', 'subCategory', 'images']),
                'Product updated successfully.'
            );
        } catch (ModelNotFoundException $e) {
            return $this->error('Product not found.', 404);
        } catch (\Throwable $e) {
            Log::error('Product update failed: ' . $e->getMessage());
            return $this->error('Failed to update product: ' . $e->getMessage(), 500);
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            foreach ($product->images as $img) {
                $fullPath = public_path($img->image);
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }
                $img->delete();
            }

            $product->delete();

            return $this->success(null, 'Product deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Product not found.', 404);
        } catch (\Throwable $e) {
            Log::error('Product deletion failed: ' . $e->getMessage());
            return $this->error('Failed to delete product.', 500);
        }
    }

    public function deleteImage($id)
    {
        try {
            $image = ProductImage::findOrFail($id);
            $fullPath = public_path($image->image);
            if (File::exists($fullPath)) {
                File::delete($fullPath);
            }
            $image->delete();

            return $this->success(null, 'Image deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Image not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete image.', 500);
        }
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
