<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\SubCategoryController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ── Public Routes ───────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/public/products', [ProductController::class, 'index']);

Route::post('/validate-coupon', [CouponController::class, 'validate']);

Route::get('/stripe/checkout-success', [StripeController::class, 'success']);
Route::get('/stripe/checkout-cancel', [StripeController::class, 'cancel']);
Route::post('/stripe/webhook', [StripeController::class, 'webhook']);
Route::get('/stripe/checkout', [StripeController::class, 'checkout']);
Route::post('/stripe/checkout-session', [StripeController::class, 'session']);

// ── Authenticated Routes ────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});

// ── Admin Routes (require auth + admin role) ────────────────────────────────
Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    // Categories — protected by manage-categories permission
    Route::middleware('permission:manage-categories')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::get('/categories/{id}', [CategoryController::class, 'show']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    });

    // Sub-categories — protected by manage-sub-categories permission
    Route::middleware('permission:manage-sub-categories')->group(function () {
        Route::get('/sub-categories', [SubCategoryController::class, 'index']);
        Route::post('/sub-categories', [SubCategoryController::class, 'store']);
        Route::get('/sub-categories/{id}', [SubCategoryController::class, 'show']);
        Route::put('/sub-categories/{id}', [SubCategoryController::class, 'update']);
        Route::delete('/sub-categories/{id}', [SubCategoryController::class, 'destroy']);
    });

    // Products — granular permissions
    Route::middleware('permission:view-products')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
    });
    Route::middleware('permission:create-products')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
    });
    Route::middleware('permission:edit-products')->group(function () {
        Route::put('/products/{id}', [ProductController::class, 'update']);
    });
    Route::middleware('permission:delete-products')->group(function () {
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::delete('/product-images/{id}', [ProductController::class, 'deleteImage']);
    });

    // Orders — view and manage
    Route::middleware('permission:view-orders')->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
    });
    Route::middleware('permission:manage-orders')->group(function () {
        Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    });

    // Coupons — protected by manage-coupons permission
    Route::middleware('permission:manage-coupons')->group(function () {
        Route::get('/coupons', [CouponController::class, 'index']);
        Route::post('/coupons', [CouponController::class, 'store']);
        Route::get('/coupons/{id}', [CouponController::class, 'show']);
        Route::put('/coupons/{id}', [CouponController::class, 'update']);
        Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
    });

    // Roles Management — protected by manage-roles permission
    Route::middleware('permission:manage-roles')->group(function () {
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/{id}', [RoleController::class, 'show']);
        Route::put('/roles/{id}', [RoleController::class, 'update']);
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
    });

    // Permissions Management — protected by manage-permissions permission
    Route::middleware('permission:manage-permissions')->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::delete('/permissions/{id}', [PermissionController::class, 'destroy']);
    });

    // User Management — protected by manage-users permission
    Route::middleware('permission:manage-users')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}/roles', [UserController::class, 'assignRoles']);
        Route::delete('/users/{userId}/roles/{roleId}', [UserController::class, 'removeRole']);
    });
});
