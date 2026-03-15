<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'manage-categories',
            'manage-sub-categories',
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            'view-orders',
            'manage-orders',
            'manage-coupons',
            'manage-users',
            'manage-roles',
            'manage-permissions',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->permissions()->sync(Permission::all());

        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $managerRole->permissions()->sync(
            Permission::whereIn('name', [
                'manage-categories',
                'manage-sub-categories',
                'view-products',
                'create-products',
                'edit-products',
                'view-orders',
                'manage-coupons',
            ])->pluck('id')
        );

        Role::firstOrCreate(['name' => 'viewer']);

        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $user) {
            $user->roles()->syncWithoutDetaching([$adminRole->id]);
        }
    }
}
