<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\SubCategory;
use App\Models\User;
use App\Support\DashboardStatsCache;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function stats(Request $request)
    {
        try {
            $user = $request->user();
            $user->loadMissing('roles.permissions');

            $canViewCategories = $user->hasAnyPermission('view-categories', 'manage-categories');
            $canViewSubCategories = $user->hasAnyPermission('view-sub-categories', 'manage-sub-categories');
            $canViewProducts = $user->hasAnyPermission('view-products', 'create-products', 'edit-products', 'delete-products');
            $canViewOrders = $user->hasAnyPermission('view-orders', 'manage-orders');
            $canManageCoupons = $user->hasPermission('manage-coupons');
            $canManageUsers = $user->hasPermission('manage-users');
            $canManageRoles = $user->hasPermission('manage-roles');

            $stats = DashboardStatsCache::rememberForUser($user->id, function () use (
                $canViewCategories,
                $canViewSubCategories,
                $canViewProducts,
                $canViewOrders,
                $canManageCoupons,
                $canManageUsers,
                $canManageRoles
            ) {
                $stats = [
                    'categories' => null,
                    'subCategories' => null,
                    'products' => null,
                    'orders' => null,
                    'coupons' => null,
                    'users' => null,
                    'roles' => null,
                ];

                if ($canViewCategories) {
                    $stats['categories'] = Category::count();
                }

                if ($canViewSubCategories) {
                    $stats['subCategories'] = SubCategory::count();
                }

                if ($canViewProducts) {
                    $stats['products'] = Product::count();
                }

                if ($canViewOrders) {
                    $stats['orders'] = Order::count();
                }

                if ($canManageCoupons) {
                    $stats['coupons'] = Coupon::count();
                }

                if ($canManageUsers) {
                    $stats['users'] = User::count();
                }

                if ($canManageRoles) {
                    $stats['roles'] = Role::count();
                }

                return $stats;
            });

            return $this->success($stats, 'Dashboard stats retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve dashboard stats.', 500);
        }
    }
}
