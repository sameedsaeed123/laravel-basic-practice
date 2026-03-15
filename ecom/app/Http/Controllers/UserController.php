<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $users = User::with('roles.permissions')->get();
        return $this->success($users, 'Users retrieved successfully.');
    }

    public function show($id)
    {
        $user = User::with('roles.permissions')->findOrFail($id);
        return $this->success($user, 'User retrieved successfully.');
    }

    public function assignRoles(Request $request, $id)
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user = User::findOrFail($id);
        $user->syncRoles($request->roles);

        return $this->success(
            $user->load('roles.permissions'),
            'Roles assigned to user successfully.'
        );
    }

    public function removeRole($userId, $roleId)
    {
        $user = User::findOrFail($userId);
        $user->roles()->detach($roleId);

        return $this->success(
            $user->load('roles.permissions'),
            'Role removed from user successfully.'
        );
    }
}
