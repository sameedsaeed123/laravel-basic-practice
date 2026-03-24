<?php

namespace App\Http\Controllers;

use App\Models\Size;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class SizeController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $sizes = Size::all();
            return $this->success($sizes, 'Sizes retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve sizes.', 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:sizes,name',
        ]);

        try {
            $size = Size::create($request->only('name'));
            return $this->success($size, 'Size created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error('Failed to create size.', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:sizes,name,' . $id,
        ]);

        try {
            $size = Size::findOrFail($id);
            $size->update($request->only('name'));
            return $this->success($size, 'Size updated successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Size not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to update size.', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $size = Size::findOrFail($id);
            $size->delete();
            return $this->success(null, 'Size deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Size not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete size.', 500);
        }
    }
}
