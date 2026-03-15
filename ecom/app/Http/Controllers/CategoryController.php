<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $categories = Category::with('subCategories')->get();
        return $this->success($categories, 'Categories retrieved successfully.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category = Category::create($request->only('name'));

        return $this->success(
            $category->load('subCategories'),
            'Category created successfully.',
            201
        );
    }

    public function show($id)
    {
        $category = Category::with('subCategories')->findOrFail($id);
        return $this->success($category, 'Category retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category = Category::findOrFail($id);
        $category->update($request->only('name'));

        return $this->success(
            $category->load('subCategories'),
            'Category updated successfully.'
        );
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return $this->success(null, 'Category deleted successfully.');
    }
}
