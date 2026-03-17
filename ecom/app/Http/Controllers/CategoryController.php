<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $categories = Category::with('subCategories')->get();
            return $this->success($categories, 'Categories retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve categories.', 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        try {
            $category = Category::create($request->only('name'));

            return $this->success(
                $category->load('subCategories'),
                'Category created successfully.',
                201
            );
        } catch (\Throwable $e) {
            return $this->error('Failed to create category.', 500);
        }
    }

    public function show($id)
    {
        try {
            $category = Category::with('subCategories')->findOrFail($id);
            return $this->success($category, 'Category retrieved successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Category not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve category.', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        try {
            $category = Category::findOrFail($id);
            $category->update($request->only('name'));

            return $this->success(
                $category->load('subCategories'),
                'Category updated successfully.'
            );
        } catch (ModelNotFoundException $e) {
            return $this->error('Category not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to update category.', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $category = Category::findOrFail($id);
            $category->delete();

            return $this->success(null, 'Category deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Category not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete category.', 500);
        }
    }
}
