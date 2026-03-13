<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_can_be_created_with_valid_data(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $response = $this->postJson('/api/categories', [
            'name' => 'Electronics',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'Electronics');

        $this->assertDatabaseHas('categories', [
            'name' => 'Electronics',
        ]);
    }

    public function test_category_creation_fails_when_name_is_missing(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $response = $this->postJson('/api/categories', []);

        $response
            ->assertUnprocessable()
            ->assertJson([
                'status' => false,
                'message' => 'Validation error',
            ])
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseCount('categories', 0);
    }

    public function test_category_creation_fails_when_name_is_not_a_string(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $response = $this->postJson('/api/categories', [
            'name' => ['invalid'],
        ]);

        $response
            ->assertUnprocessable()
            ->assertJson([
                'status' => false,
                'message' => 'Validation error',
            ])
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseCount('categories', 0);
    }

    public function test_category_can_be_updated_with_valid_data(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $category = Category::create([
            'name' => 'Old Name',
        ]);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => 'Updated Name',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Updated Name');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_category_update_fails_when_name_is_too_long(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $category = Category::create([
            'name' => 'Books',
        ]);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => str_repeat('A', 256),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJson([
                'status' => false,
                'message' => 'Validation error',
            ])
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Books',
        ]);
    }
}
