<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('status', true)
            ->assertJsonPath('user.role', 'user')
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'role' => 'user',
        ]);
    }

    public function test_registration_fails_without_name(): void
    {
        $response = $this->postJson('/api/register', [
            'email' => 'john@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'John',
            'email' => 'taken@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_fails_with_short_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John',
            'email' => 'john@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_without_password_confirmation(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John',
            'email' => 'john@example.com',
            'password' => 'secret123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('status', false)
            ->assertJsonPath('message', 'Invalid credentials');
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'secret123',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('status', false);
    }

    public function test_login_validation_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/login', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $response = $this->getJson('/api/categories');
        $response->assertOk();
    }

    public function test_regular_user_cannot_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $response = $this->getJson('/api/categories');

        $response
            ->assertForbidden()
            ->assertJson([
                'status' => false,
                'message' => 'Access denied. Admin privileges required.',
            ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_routes(): void
    {
        $response = $this->getJson('/api/categories');

        $response->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_category(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $response = $this->postJson('/api/categories', [
            'name' => 'Hacked Category',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('categories', 0);
    }

    public function test_regular_user_cannot_access_products_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $response = $this->getJson('/api/products');
        $response->assertForbidden();
    }

    public function test_regular_user_cannot_access_orders(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $response = $this->getJson('/api/orders');
        $response->assertForbidden();
    }

    public function test_regular_user_cannot_access_coupons(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $response = $this->getJson('/api/coupons');
        $response->assertForbidden();
    }


    public function test_public_products_accessible_without_auth(): void
    {
        $response = $this->getJson('/api/public/products');
        $response->assertOk();
    }
    public function test_authenticated_user_can_logout(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/logout');
        $response->assertOk();
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/logout');
        $response->assertUnauthorized();
    }

    public function test_forgot_password_validation(): void
    {
        $response = $this->postJson('/api/forgot-password', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'nobody@example.com',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_validation(): void
    {
        $response = $this->postJson('/api/reset-password', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'token']);
    }
}
