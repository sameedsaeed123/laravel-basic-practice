<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'user',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->success([
                'user' => $user,
                'token' => $token,
            ], 'User registered successfully.', 201);
        } catch (\Throwable $e) {
            Log::error('Registration failed: ' . $e->getMessage());
            return $this->error('Registration failed. Please try again.', 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return $this->error('Invalid credentials.', 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            $user->load('roles.permissions');
            $permissions = $user->getAllPermissions()->pluck('name');

            return $this->success([
                'user' => $user,
                'token' => $token,
                'permissions' => $permissions,
            ], 'Login successful.');
        } catch (\Throwable $e) {
            Log::error('Login failed: ' . $e->getMessage());
            return $this->error('Login failed. Please try again.', 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        try {
            $status = Password::sendResetLink($request->only('email'));

            if ($status === Password::RESET_LINK_SENT) {
                return $this->success(null, 'Password reset link sent to your email.');
            }

            return $this->error(__($status), 400);
        } catch (\Throwable $e) {
            Log::error('Forgot password failed: ' . $e->getMessage());
            return $this->error('Failed to send reset link. Please try again.', 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
            'token' => 'required',
        ]);

        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->password = Hash::make($password);
                    $user->save();
                }
            );

            return $status === Password::PASSWORD_RESET
                ? $this->success(null, 'Password has been reset successfully.')
                : $this->error('Failed to reset password.', 400);
        } catch (\Throwable $e) {
            Log::error('Password reset failed: ' . $e->getMessage());
            return $this->error('Failed to reset password. Please try again.', 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return $this->success(null, 'Logged out successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to logout.', 500);
        }
    }

    public function user(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('roles.permissions');
            $permissions = $user->getAllPermissions()->pluck('name');

            return $this->success([
                'user' => $user,
                'permissions' => $permissions,
            ], 'User retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve user.', 500);
        }
    }
}
