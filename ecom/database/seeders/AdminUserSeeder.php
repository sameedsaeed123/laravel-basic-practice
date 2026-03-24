<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $user->roles()->syncWithoutDetaching([$adminRole->id]);

        $this->command->info("Admin user ready: admin@test.com / admin123");
    }
}
