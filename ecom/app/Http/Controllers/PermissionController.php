<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $permissions = Permission::all();
            return $this->success($permissions, 'Permissions retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve permissions.', 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
        ]);

        try {
            $permission = Permission::create(['name' => $request->name]);
            return $this->success($permission, 'Permission created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error('Failed to create permission.', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $permission = Permission::findOrFail($id);
            $permission->delete();

            return $this->success(null, 'Permission deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Permission not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete permission.', 500);
        }
    }
}
