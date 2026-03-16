<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $user->load('roles.permissions');

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'status' => false,
                'message' => "Access denied. You do not have the required permission: {$permission}",
            ], 403);
        }

        return $next($request);
    }
}
