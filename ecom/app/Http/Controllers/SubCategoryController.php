<?php

namespace App\Http\Controllers;

use App\Models\SubCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SubCategoryController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $subCategories = SubCategory::with('category')->get();
        return $this->success($subCategories, 'Sub-categories retrieved successfully.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ], [
            'name.required' => 'Sub-category name is required.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'Selected category does not exist.',
        ]);

        $subCategory = SubCategory::create($request->only('name', 'category_id'));

        return $this->success(
            $subCategory->load('category'),
            'Sub-category created successfully.',
            201
        );
    }

    public function show($id)
    {
        $subCategory = SubCategory::with('category')->findOrFail($id);
        return $this->success($subCategory, 'Sub-category retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ], [
            'name.required' => 'Sub-category name is required.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'Selected category does not exist.',
        ]);

        $subCategory = SubCategory::findOrFail($id);
        $subCategory->update($request->only('name', 'category_id'));

        return $this->success(
            $subCategory->load('category'),
            'Sub-category updated successfully.'
        );
    }

    public function destroy($id)
    {
        $subCategory = SubCategory::findOrFail($id);
        $subCategory->delete();

        return $this->success(null, 'Sub-category deleted successfully.');
    }
}
