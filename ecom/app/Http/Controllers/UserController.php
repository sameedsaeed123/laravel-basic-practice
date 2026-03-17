<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $users = User::with('roles.permissions')->get();
            return $this->success($users, 'Users retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve users.', 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with('roles.permissions')->findOrFail($id);
            return $this->success($user, 'User retrieved successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('User not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve user.', 500);
        }
    }

    public function assignRoles(Request $request, $id)
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);

        try {
            $user = User::findOrFail($id);
            $user->syncRoles($request->roles);

            return $this->success(
                $user->load('roles.permissions'),
                'Roles assigned to user successfully.'
            );
        } catch (ModelNotFoundException $e) {
            return $this->error('User not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to assign roles.', 500);
        }
    }

    public function removeRole($userId, $roleId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->roles()->detach($roleId);

            return $this->success(
                $user->load('roles.permissions'),
                'Role removed from user successfully.'
            );
        } catch (ModelNotFoundException $e) {
            return $this->error('User not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to remove role.', 500);
        }
    }
}
