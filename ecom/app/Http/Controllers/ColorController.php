<?php

namespace App\Http\Controllers;

use App\Models\Color;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class ColorController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $colors = Color::all();
            return $this->success($colors, 'Colors retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve colors.', 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:colors,name',
        ]);

        try {
            $color = Color::create($request->only('name'));
            return $this->success($color, 'Color created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error('Failed to create color.', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:colors,name,' . $id,
        ]);

        try {
            $color = Color::findOrFail($id);
            $color->update($request->only('name'));
            return $this->success($color, 'Color updated successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Color not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to update color.', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $color = Color::findOrFail($id);
            $color->delete();
            return $this->success(null, 'Color deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Color not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete color.', 500);
        }
    }
}
