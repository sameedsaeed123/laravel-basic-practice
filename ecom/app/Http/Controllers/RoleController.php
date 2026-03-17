<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $roles = Role::with('permissions')->get();
            return $this->success($roles, 'Roles retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve roles.', 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            $role = Role::create(['name' => $request->name]);

            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }

            return $this->success($role->load('permissions'), 'Role created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->error('Failed to create role.', 500);
        }
    }

    public function show($id)
    {
        try {
            $role = Role::with('permissions')->findOrFail($id);
            return $this->success($role, 'Role retrieved successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Role not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve role.', 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $role = Role::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
                'permissions' => 'array',
                'permissions.*' => 'exists:permissions,id',
            ]);

            $role->update(['name' => $request->name]);

            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }

            return $this->success($role->load('permissions'), 'Role updated successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Role not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to update role.', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);
            $role->delete();

            return $this->success(null, 'Role deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Role not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to delete role.', 500);
        }
    }
}
