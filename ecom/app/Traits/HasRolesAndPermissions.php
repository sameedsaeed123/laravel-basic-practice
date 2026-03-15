<?php

namespace App\Traits;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasRolesAndPermissions
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function assignRole(string ...$roleNames): void
    {
        $roles = Role::whereIn('name', $roleNames)->get();
        $this->roles()->syncWithoutDetaching($roles);
    }

    public function removeRole(string ...$roleNames): void
    {
        $roles = Role::whereIn('name', $roleNames)->get();
        $this->roles()->detach($roles);
    }

    public function syncRoles(array $roleIds): void
    {
        $this->roles()->sync($roleIds);
    }

    public function hasRole(string $roleName): bool
    {
        return $this->roles->contains('name', $roleName);
    }

    public function hasAnyRole(string ...$roleNames): bool
    {
        return $this->roles->whereIn('name', $roleNames)->isNotEmpty();
    }

    /**
     * Collects all permissions from all assigned roles.
     */
    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        return $this->roles->flatMap(fn ($role) => $role->permissions)->unique('id');
    }

    public function hasPermission(string $permissionName): bool
    {
        return $this->getAllPermissions()->contains('name', $permissionName);
    }

    public function hasAnyPermission(string ...$permissionNames): bool
    {
        return $this->getAllPermissions()->whereIn('name', $permissionNames)->isNotEmpty();
    }
}
