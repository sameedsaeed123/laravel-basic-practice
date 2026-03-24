import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState } from 'react';

export default function Layout() {
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const allLinks = [
        { to: '/admin', label: 'Dashboard', permissions: null },
        { to: '/admin/categories', label: 'Categories', permissions: ['view-categories', 'manage-categories'] },
        { to: '/admin/sub-categories', label: 'Sub Categories', permissions: ['view-sub-categories', 'manage-sub-categories'] },
        { to: '/admin/products', label: 'Products', permissions: ['view-products', 'create-products', 'edit-products', 'delete-products'] },
        { to: '/admin/colors', label: 'Colors', permissions: ['view-products', 'create-products', 'edit-products', 'delete-products'] },
        { to: '/admin/sizes', label: 'Sizes', permissions: ['view-products', 'create-products', 'edit-products', 'delete-products'] },
        { to: '/admin/orders', label: 'Orders', permissions: ['view-orders', 'manage-orders'] },
        { to: '/admin/coupons', label: 'Coupons', permissions: ['manage-coupons'] },
        { to: '/admin/roles', label: 'Roles', permissions: ['manage-roles'] },
        { to: '/admin/permissions', label: 'Permissions', permissions: ['manage-permissions'] },
        { to: '/admin/users', label: 'Users', permissions: ['manage-users'] },
    ];

    const links = allLinks.filter(
        (link) => link.permissions === null || link.permissions.some(p => hasPermission(p))
    );

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-indigo-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-2 rounded hover:bg-indigo-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <Link to="/admin" className="text-xl font-bold">Ecom Admin</Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="hidden sm:block text-sm">{user?.name}</span>
                            <Link
                                to="/"
                                className="hidden sm:inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-sm transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                                </svg>
                                Store
                            </Link>
                            <button
                                onClick={logout}
                                className="bg-indigo-800 hover:bg-indigo-900 px-4 py-2 rounded text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-white shadow-md min-h-[calc(100vh-4rem)] fixed md:static z-10`}>
                    <div className="p-4 space-y-1">
                        {links.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
                                    isActive(link.to)
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </aside>

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 z-0 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
