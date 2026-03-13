<?php

namespace App\Http\Controllers;

use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubCategoryController extends Controller
{
    public function index()
    {
        return response()->json(SubCategory::with('category')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ], [
            'name.required' => 'Sub-category name is required.',
            'name.string' => 'Sub-category name must be a string.',
            'name.max' => 'Sub-category name may not exceed 255 characters.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'Selected category does not exist.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $subCategory = SubCategory::create($request->only('name', 'category_id'));

        return response()->json([
            'status' => true,
            'message' => 'Sub-category created successfully',
            'sub_category' => $subCategory->load('category'),
        ], 201);
    }

    public function show($id)
    {
        $subCategory = SubCategory::with('category')->findOrFail($id);

        return response()->json($subCategory);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ], [
            'name.required' => 'Sub-category name is required.',
            'name.string' => 'Sub-category name must be a string.',
            'name.max' => 'Sub-category name may not exceed 255 characters.',
            'category_id.required' => 'Category is required.',
            'category_id.exists' => 'Selected category does not exist.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $subCategory = SubCategory::findOrFail($id);
        $subCategory->update($request->only('name', 'category_id'));

        return response()->json([
            'status' => true,
            'message' => 'Sub-category updated successfully',
            'sub_category' => $subCategory->load('category'),
        ]);
    }

    public function destroy($id)
    {
        $subCategory = SubCategory::findOrFail($id);
        $subCategory->delete();

        return response()->json([
            'status' => true,
            'message' => 'Sub-category deleted successfully',
        ]);
    }
}
