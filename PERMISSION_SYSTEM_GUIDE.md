# Dynamic Permission System & Standardized API Responses

A comprehensive guide explaining the **Role-Based Access Control (RBAC)** system and **Global API Response Standard** implemented in this project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
   - [Models & Traits](#models--traits)
   - [ApiResponse Trait](#apiresponse-trait)
   - [Middleware](#middleware)
   - [Controllers](#controllers)
   - [Routes & Permission Mapping](#routes--permission-mapping)
   - [Global Error Handling](#global-error-handling)
   - [Database Seeder](#database-seeder)
4. [Frontend Implementation](#frontend-implementation)
   - [AuthContext Updates](#authcontext-updates)
   - [Admin Pages](#admin-pages)
   - [Permission-Aware Sidebar](#permission-aware-sidebar)
5. [API Response Format](#api-response-format)
6. [How to Use](#how-to-use)
7. [Adding New Permissions](#adding-new-permissions)

---

## Architecture Overview

The system is built on four pillars:

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  AuthContext stores user permissions             │
│  Layout sidebar filters links by permission      │
│  Admin pages for Roles, Permissions, Users       │
└──────────────────────┬──────────────────────────┘
                       │ API calls
┌──────────────────────▼──────────────────────────┐
│                 Routes (api.php)                  │
│  Every route group has permission middleware      │
│  e.g. middleware('permission:manage-categories')  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Middleware Layer                     │
│  1. auth:sanctum — checks authentication         │
│  2. admin — checks user is an admin              │
│  3. permission:X — checks user has permission X  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Controllers                         │
│  All use ApiResponse trait                       │
│  Return standardized JSON responses              │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│           Global Exception Handler               │
│  Catches ALL errors and returns standard format  │
│  Validation, Auth, NotFound, Permission, Server  │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables

Four new tables power the RBAC system:

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  roles   │────▶│ permission_role │◀────│ permissions  │
│──────────│     │─────────────────│     │──────────────│
│ id       │     │ role_id (FK)    │     │ id           │
│ name     │     │ permission_id   │     │ name         │
│ timestamps│    │ (FK)            │     │ timestamps   │
└──────────┘     └─────────────────┘     └──────────────┘
      │
      │          ┌─────────────────┐
      └─────────▶│   role_user    │◀──── users table
                 │─────────────────│
                 │ role_id (FK)    │
                 │ user_id (FK)    │
                 └─────────────────┘
```

**Migration file:** `database/migrations/2024_01_01_000013_create_roles_permissions_tables.php`

This migration creates:
- `roles` — stores role names (e.g. "admin", "manager")
- `permissions` — stores permission names (e.g. "manage-categories", "view-orders")
- `permission_role` — many-to-many pivot between roles and permissions
- `role_user` — many-to-many pivot between users and roles

**Key design decision:** A user can have **multiple roles**, and each role can have **multiple permissions**. A user's effective permissions are the union of all permissions from all their assigned roles.

---

## Backend Implementation

### Models & Traits

#### `app/Models/Role.php`

```php
class Role extends Model
{
    protected $fillable = ['name'];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user');
    }
}
```

**What it does:** Represents a role (like "admin" or "manager"). Each role has a many-to-many relationship with both `permissions` and `users`.

#### `app/Models/Permission.php`

```php
class Permission extends Model
{
    protected $fillable = ['name'];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'permission_role');
    }
}
```

**What it does:** Represents a single permission (like "manage-categories"). Linked to roles via the `permission_role` pivot table.

#### `app/Traits/HasRolesAndPermissions.php`

This trait is added to the `User` model and provides all role/permission helper methods:

```php
trait HasRolesAndPermissions
{
    // Relationship: user belongs to many roles
    public function roles(): BelongsToMany

    // Assign one or more roles by name
    public function assignRole(string ...$roleNames): void

    // Remove one or more roles by name
    public function removeRole(string ...$roleNames): void

    // Replace all roles with given IDs
    public function syncRoles(array $roleIds): void

    // Check if user has a specific role
    public function hasRole(string $roleName): bool

    // Check if user has any of the given roles
    public function hasAnyRole(string ...$roleNames): bool

    // Get all permissions from all roles (merged, unique)
    public function getAllPermissions(): Collection

    // Check if user has a specific permission
    public function hasPermission(string $permissionName): bool

    // Check if user has any of the given permissions
    public function hasAnyPermission(string ...$permissionNames): bool
}
```

**How `getAllPermissions()` works:**
1. Loads all roles assigned to the user
2. For each role, loads its permissions
3. Flattens into a single collection
4. Removes duplicates by permission ID
5. Returns the unique set

This means if a user has the "admin" role (with all permissions) and the "manager" role (with some permissions), they get the union — no duplicates.

#### Updated `app/Models/User.php`

```php
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRolesAndPermissions;

    public function isAdmin(): bool
    {
        // Supports both old column-based and new dynamic role check
        return $this->role === 'admin' || $this->hasRole('admin');
    }
}
```

**Backward compatibility:** The `isAdmin()` method checks both the old `role` column AND the new dynamic roles table. This means existing admin users continue to work while new ones use the dynamic system.

---

### ApiResponse Trait

**File:** `app/Traits/ApiResponse.php`

```php
trait ApiResponse
{
    protected function success($data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        $response = [
            'status' => true,
            'message' => $message,
        ];
        if ($data !== null) {
            $response['data'] = $data;
        }
        return response()->json($response, $code);
    }

    protected function error(string $message = 'Error', int $code = 400, $errors = null): JsonResponse
    {
        $response = [
            'status' => false,
            'message' => $message,
        ];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        return response()->json($response, $code);
    }
}
```

**Why this pattern?**

Every controller uses `use ApiResponse;` and calls `$this->success()` or `$this->error()`. This guarantees:
- **Consistency:** Every API response has the same structure
- **Simplicity:** Controllers don't manually build response arrays
- **Maintainability:** Change the format in ONE place, all endpoints update

**Usage examples in controllers:**
```php
// Return data with message
return $this->success($categories, 'Categories retrieved successfully.');

// Return created resource (201 status)
return $this->success($role->load('permissions'), 'Role created.', 201);

// Return error
return $this->error('Invalid credentials.', 401);

// Return validation error with field-level details
return $this->error('Validation error.', 422, ['email' => ['Email is required.']]);

// Return success with no data
return $this->success(null, 'Deleted successfully.');
```

---

### Middleware

#### `app/Http/Middleware/CheckPermission.php`

```php
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

        // Eager load roles and their permissions to avoid N+1 queries
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
```

**How it works:**
1. Receives the required permission name as a parameter from the route definition
2. Loads the authenticated user
3. Eager loads `roles.permissions` (single DB query with joins — efficient)
4. Calls `hasPermission()` from the trait to check if the user's roles grant this permission
5. If not, returns 403 with a clear message naming the missing permission
6. If yes, passes the request through to the controller

**Registration in `bootstrap/app.php`:**
```php
$middleware->alias([
    'admin' => \App\Http\Middleware\EnsureAdmin::class,
    'permission' => \App\Http\Middleware\CheckPermission::class,
]);
```

The `permission` alias allows usage like `middleware('permission:manage-categories')` in routes.

#### Updated `app/Http/Middleware/EnsureAdmin.php`

Now supports both old column-based and new dynamic role checking:
```php
if ($user->role !== 'admin' && !$user->hasRole('admin')) {
    return 403;
}
```

---

### Controllers

#### `app/Http/Controllers/RoleController.php`

Provides CRUD operations for roles:

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `index` | `GET /roles` | Lists all roles with their permissions |
| `store` | `POST /roles` | Creates a role and optionally assigns permissions |
| `show` | `GET /roles/{id}` | Gets a single role with permissions |
| `update` | `PUT /roles/{id}` | Updates role name and syncs permissions |
| `destroy` | `DELETE /roles/{id}` | Deletes a role (cascade removes pivots) |

**Key behavior in `store` and `update`:**
```php
if ($request->has('permissions')) {
    $role->permissions()->sync($request->permissions);
}
```
The `sync()` method replaces ALL existing permissions with the new array. This means the admin can fully control which permissions belong to each role from the frontend.

#### `app/Http/Controllers/PermissionController.php`

Simpler CRUD — permissions are just names:

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `index` | `GET /permissions` | Lists all permissions |
| `store` | `POST /permissions` | Creates a new permission |
| `destroy` | `DELETE /permissions/{id}` | Deletes a permission (cascade removes from roles) |

#### `app/Http/Controllers/UserController.php`

Manages user-role assignments:

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `index` | `GET /users` | Lists all users with roles and permissions |
| `show` | `GET /users/{id}` | Gets a single user with roles |
| `assignRoles` | `PUT /users/{id}/roles` | Replaces all roles for a user |
| `removeRole` | `DELETE /users/{userId}/roles/{roleId}` | Removes a specific role from a user |

**How `assignRoles` works:**
```php
$user->syncRoles($request->roles); // Array of role IDs
```
This replaces the user's entire role set. The frontend sends an array of selected role IDs.

#### Updated Existing Controllers

All existing controllers (Auth, Category, SubCategory, Product, Order, Coupon, Stripe) now:
1. Use `use ApiResponse;` trait
2. Call `$this->success()` for success responses
3. Call `$this->error()` for error responses
4. Use `$request->validate()` instead of manual `Validator::make()` (validation exceptions are caught globally)

**Before (old pattern):**
```php
$validator = Validator::make($request->all(), [...]);
if ($validator->fails()) {
    return response()->json([
        'status' => false,
        'message' => 'Validation error',
        'errors' => $validator->errors(),
    ], 422);
}
```

**After (new pattern):**
```php
$request->validate([...]);
// If validation fails, the global exception handler catches it
// and returns the standardized 422 response automatically
```

This removes ~10 lines of boilerplate from every method that validates input.

---

### Routes & Permission Mapping

**File:** `routes/api.php`

Routes are organized in layers:

```
Public routes (no auth needed)
  └── Login, Register, Password Reset, Public Products, Stripe Webhook

Auth routes (requires auth:sanctum)
  └── Logout, Get User

Admin routes (requires auth:sanctum + admin middleware)
  └── Each module group has its own permission middleware:
        ├── Categories     → permission:manage-categories
        ├── Sub-categories → permission:manage-sub-categories
        ├── Products       → split into view/create/edit/delete permissions
        ├── Orders         → view-orders / manage-orders (for status updates)
        ├── Coupons        → permission:manage-coupons
        ├── Roles          → permission:manage-roles
        ├── Permissions    → permission:manage-permissions
        └── Users          → permission:manage-users
```

**Products use granular permissions:**
```php
Route::middleware('permission:view-products')->group(function () {
    Route::get('/products', ...);      // List
    Route::get('/products/{id}', ...); // Detail
});
Route::middleware('permission:create-products')->group(function () {
    Route::post('/products', ...);     // Create
});
Route::middleware('permission:edit-products')->group(function () {
    Route::put('/products/{id}', ...); // Update
});
Route::middleware('permission:delete-products')->group(function () {
    Route::delete('/products/{id}', ...);       // Delete product
    Route::delete('/product-images/{id}', ...); // Delete image
});
```

This allows creating a "product viewer" role that can only see products but not modify them.

**Complete Permission List:**

| Permission | What it controls |
|-----------|-----------------|
| `manage-categories` | Full CRUD on categories |
| `manage-sub-categories` | Full CRUD on sub-categories |
| `view-products` | View/list products |
| `create-products` | Create new products |
| `edit-products` | Update existing products |
| `delete-products` | Delete products and images |
| `view-orders` | View order list and details |
| `manage-orders` | Update order status |
| `manage-coupons` | Full CRUD on coupons |
| `manage-users` | View users and assign roles |
| `manage-roles` | Full CRUD on roles |
| `manage-permissions` | Create/delete permissions |

---

### Global Error Handling

**File:** `bootstrap/app.php`

Every possible error type is caught and returned in the standard format:

```php
->withExceptions(function (Exceptions $exceptions): void {
    // 401 — Unauthenticated
    $exceptions->renderable(function (AuthenticationException $e, $request) {
        return response()->json(['status' => false, 'message' => 'Unauthenticated.'], 401);
    });

    // 403 — Access Denied
    $exceptions->renderable(function (AccessDeniedHttpException $e, $request) {
        return response()->json(['status' => false, 'message' => $e->getMessage()], 403);
    });

    // 404 — Model Not Found (e.g. findOrFail fails)
    $exceptions->renderable(function (ModelNotFoundException $e, $request) {
        $model = class_basename($e->getModel()); // "Category", "Product", etc.
        return response()->json(['status' => false, 'message' => "{$model} not found."], 404);
    });

    // 404 — Route Not Found
    $exceptions->renderable(function (NotFoundHttpException $e, $request) {
        return response()->json(['status' => false, 'message' => 'Route not found.'], 404);
    });

    // 422 — Validation Failed
    $exceptions->renderable(function (ValidationException $e, $request) {
        return response()->json([
            'status' => false,
            'message' => 'Validation error.',
            'errors' => $e->errors(),
        ], 422);
    });

    // Any other HTTP exception
    $exceptions->renderable(function (HttpException $e, $request) {
        return response()->json(['status' => false, 'message' => $e->getMessage()], $e->getStatusCode());
    });

    // 500 — Catch-all for unexpected errors
    $exceptions->renderable(function (\Throwable $e, $request) {
        return response()->json([
            'status' => false,
            'message' => app()->hasDebugModeEnabled() ? $e->getMessage() : 'Internal server error.',
        ], 500);
    });
});
```

**Why this matters:** Controllers never need to wrap code in try/catch for common errors. If `findOrFail()` throws, the global handler catches `ModelNotFoundException` and returns a clean 404. If validation fails via `$request->validate()`, it catches `ValidationException` and returns 422 with field errors.

**Production safety:** The catch-all handler only shows the real error message when `APP_DEBUG=true`. In production, it returns a generic "Internal server error." to avoid leaking sensitive information.

---

### Database Seeder

**File:** `database/seeders/RolesAndPermissionsSeeder.php`

```php
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create all permissions
        $permissions = [
            'manage-categories', 'manage-sub-categories',
            'view-products', 'create-products', 'edit-products', 'delete-products',
            'view-orders', 'manage-orders', 'manage-coupons',
            'manage-users', 'manage-roles', 'manage-permissions',
        ];

        // 2. Create "admin" role with ALL permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->permissions()->sync(Permission::all());

        // 3. Create "manager" role with selected permissions
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        // managers can manage catalog and view orders, but not manage users/roles

        // 4. Create "viewer" role (no permissions by default)
        Role::firstOrCreate(['name' => 'viewer']);

        // 5. Assign admin role to existing admin users
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $user) {
            $user->roles()->syncWithoutDetaching([$adminRole->id]);
        }
    }
}
```

**Run it with:**
```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

This is safe to run multiple times — it uses `firstOrCreate` so it won't create duplicates.

---

## Frontend Implementation

### AuthContext Updates

**File:** `frontend/src/AuthContext.jsx`

The auth context now stores permissions alongside user data:

```jsx
const [permissions, setPermissions] = useState(
    JSON.parse(localStorage.getItem('permissions') || '[]')
);
```

**On login**, the API returns permissions:
```jsx
const { user: userData, token: authToken, permissions: perms } = res.data.data;
localStorage.setItem('permissions', JSON.stringify(perms || []));
setPermissions(perms || []);
```

**Permission checking helpers exposed to all components:**
```jsx
const hasPermission = (permissionName) => {
    return permissions.includes(permissionName);
};

const hasAnyPermission = (...permissionNames) => {
    return permissionNames.some((p) => permissions.includes(p));
};
```

**`refreshUser()` function** — fetches fresh user data + permissions from the API. Call this after the admin changes a user's roles so the UI updates immediately:
```jsx
const refreshUser = async () => {
    const res = await api.get('/user');
    const { user: userData, permissions: perms } = res.data.data;
    // Updates localStorage and state
};
```

### Admin Pages

Three new admin pages were created:

#### Roles Page (`frontend/src/pages/Roles.jsx`)

- Left panel: form to create/edit a role with name and permission checkboxes
- Right panel: table of existing roles showing assigned permissions
- Permissions are fetched from the API and displayed as checkboxes
- When editing, the form pre-selects the role's current permissions
- Uses `role.permissions()->sync()` on the backend, so the entire permission set is replaced

#### Permissions Page (`frontend/src/pages/Permissions.jsx`)

- Left panel: simple form to create a new permission
- Right panel: table listing all permissions with delete buttons
- Naming convention hint shown: use kebab-case (e.g. `manage-reports`)
- Deleting a permission cascade-removes it from all roles

#### Users Page (`frontend/src/pages/Users.jsx`)

- Full-width table showing all users with their roles and effective permissions
- "Manage Roles" button opens inline role checkboxes for that user
- Shows effective permissions (union of all permissions from all assigned roles)
- Save syncs the selected roles via `PUT /users/{id}/roles`

### Permission-Aware Sidebar

**File:** `frontend/src/components/Layout.jsx`

The sidebar dynamically shows only the links the user has permission to access:

```jsx
const allLinks = [
    { to: '/admin', label: 'Dashboard', permission: null },           // Always visible
    { to: '/admin/categories', label: 'Categories', permission: 'manage-categories' },
    { to: '/admin/products', label: 'Products', permission: 'view-products' },
    { to: '/admin/orders', label: 'Orders', permission: 'view-orders' },
    { to: '/admin/coupons', label: 'Coupons', permission: 'manage-coupons' },
    { to: '/admin/roles', label: 'Roles', permission: 'manage-roles' },
    { to: '/admin/permissions', label: 'Permissions', permission: 'manage-permissions' },
    { to: '/admin/users', label: 'Users', permission: 'manage-users' },
];

const links = allLinks.filter(
    (link) => link.permission === null || hasPermission(link.permission)
);
```

If a user has the "manager" role with only "manage-categories" and "view-products" permissions, they'll only see Dashboard, Categories, and Products in the sidebar.

---

## API Response Format

### Success Response

```json
{
    "status": true,
    "message": "Categories retrieved successfully.",
    "data": [
        { "id": 1, "name": "Electronics", "sub_categories": [...] },
        { "id": 2, "name": "Clothing", "sub_categories": [...] }
    ]
}
```

### Error Responses

**Validation Error (422):**
```json
{
    "status": false,
    "message": "Validation error.",
    "errors": {
        "name": ["The name field is required."],
        "email": ["The email has already been taken."]
    }
}
```

**Unauthorized (401):**
```json
{
    "status": false,
    "message": "Unauthenticated."
}
```

**Permission Denied (403):**
```json
{
    "status": false,
    "message": "Access denied. You do not have the required permission: manage-categories"
}
```

**Not Found (404):**
```json
{
    "status": false,
    "message": "Category not found."
}
```

**Server Error (500):**
```json
{
    "status": false,
    "message": "Internal server error."
}
```

---

## How to Use

### 1. Run Migrations and Seeder

```bash
cd ecom
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
```

### 2. Login as Admin

Login with an existing admin user. The system will automatically:
- Load the user's roles and permissions
- Return them in the login response
- Store them in the frontend

### 3. Manage via Admin Panel

1. Go to **Permissions** — create any new permissions you need
2. Go to **Roles** — create roles and assign permissions to them
3. Go to **Users** — assign roles to users

### 4. Test Permission Enforcement

1. Create a non-admin user
2. Give them the "admin" role via the Users page (or the seeder)
3. But only assign limited permissions through a custom role
4. Login as that user — they'll only see and access what their permissions allow

---

## Adding New Permissions

When you add a new module (e.g. "Reports"), follow these steps:

### Backend

1. **Create the permission** via the admin panel or add it to the seeder
2. **Create the controller** using the `ApiResponse` trait:
   ```php
   class ReportController extends Controller
   {
       use ApiResponse;

       public function index()
       {
           return $this->success(Report::all(), 'Reports retrieved.');
       }
   }
   ```
3. **Add the route** with permission middleware:
   ```php
   Route::middleware('permission:view-reports')->group(function () {
       Route::get('/reports', [ReportController::class, 'index']);
   });
   ```

### Frontend

4. **Create the page component** (e.g. `Reports.jsx`)
5. **Add the route** in `App.jsx`:
   ```jsx
   <Route path="reports" element={<Reports />} />
   ```
6. **Add the sidebar link** in `Layout.jsx`:
   ```jsx
   { to: '/admin/reports', label: 'Reports', permission: 'view-reports' },
   ```

That's it — the permission system, response format, and error handling are all automatic.

---

## File Summary

### New Files Created

| File | Purpose |
|------|---------|
| `database/migrations/..._create_roles_permissions_tables.php` | Creates the 4 RBAC tables |
| `app/Models/Role.php` | Role model with relationships |
| `app/Models/Permission.php` | Permission model with relationships |
| `app/Traits/HasRolesAndPermissions.php` | User trait for role/permission methods |
| `app/Traits/ApiResponse.php` | Standardized JSON response helpers |
| `app/Http/Middleware/CheckPermission.php` | Dynamic permission checking middleware |
| `app/Http/Controllers/RoleController.php` | CRUD for roles |
| `app/Http/Controllers/PermissionController.php` | CRUD for permissions |
| `app/Http/Controllers/UserController.php` | User-role management |
| `database/seeders/RolesAndPermissionsSeeder.php` | Seeds default roles & permissions |
| `frontend/src/pages/Roles.jsx` | Admin roles management UI |
| `frontend/src/pages/Permissions.jsx` | Admin permissions management UI |
| `frontend/src/pages/Users.jsx` | Admin user-role assignment UI |

### Modified Files

| File | What Changed |
|------|-------------|
| `app/Models/User.php` | Added `HasRolesAndPermissions` trait, updated `isAdmin()` |
| `app/Http/Middleware/EnsureAdmin.php` | Supports both column and dynamic role check |
| `bootstrap/app.php` | Added `CheckPermission` middleware alias, expanded error handling |
| `routes/api.php` | Added permission middleware to all admin routes, new role/permission/user routes |
| All controllers | Refactored to use `ApiResponse` trait, use `$request->validate()` |
| `app/Http/Requests/*.php` | Removed custom `failedValidation` (global handler covers it) |
| `frontend/src/AuthContext.jsx` | Stores permissions, provides `hasPermission()` helper |
| `frontend/src/App.jsx` | Added routes for Roles, Permissions, Users pages |
| `frontend/src/components/Layout.jsx` | Permission-filtered sidebar links |
| All frontend pages | Updated to handle new `res.data.data` response structure |
