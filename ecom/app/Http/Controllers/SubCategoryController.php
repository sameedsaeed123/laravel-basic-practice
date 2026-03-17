<?php

namespace App\Http\Controllers;

use App\Models\SubCategory;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class SubCategoryController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $subCategories = SubCategory::with('category')->get();
            return $this->success($subCategories, 'Sub-categories retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve sub-categories.', 500);
        }
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

        try {
            $subCategory = SubCategory::create($request->only('name', 'category_id'));

            return $this->success(
                $subCategory->load('category'),
                'Sub-category created successfully.',
                201
            );
        } catch (\Throwable $e) {
            return $this->error('Failed to create sub-category.', 500);
        }
    }

    public function show($id)
    {
        try {
            $subCategory = SubCategory::with('category')->findOrFail($id);
            return $this->success($subCategory, 'Sub-category retrieved successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Sub-category not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve sub-category.', 500);
        }
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

        try {
            $subCategory = SubCategory::findOrFail($id);
            $subCategory->update($request->only('name', 'category_id'));

            return $this->success(
                $subCategory->load('category'),
                'Sub-category updated successfully.'
            );
        } catch (ModelNotFoundException $e) {
            return $this->error('Sub-category not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to update sub-category.', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $subCategory = SubCategory::findOrFail($id);
            $subCategory->delete();

            return $this->success(null, 'Sub-category deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Sub-category not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete sub-category.', 500);
        }
    }
}
