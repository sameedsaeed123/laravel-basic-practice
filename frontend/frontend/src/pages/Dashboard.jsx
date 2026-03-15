import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function Dashboard() {
    const { user, permissions, hasPermission } = useAuth();
    const [stats, setStats] = useState({
        categories: null,
        subCategories: null,
        products: null,
        orders: null,
        coupons: null,
    });

    useEffect(() => {
        const fetchStats = async () => {
            const results = {};
            const fetches = [];

            if (hasPermission('view-categories') || hasPermission('manage-categories')) {
                fetches.push(
                    api.get('/categories')
                        .then(res => { results.categories = res.data.data.length; })
                        .catch(() => {})
                );
            }
            if (hasPermission('view-sub-categories') || hasPermission('manage-sub-categories')) {
                fetches.push(
                    api.get('/sub-categories')
                        .then(res => { results.subCategories = res.data.data.length; })
                        .catch(() => {})
                );
            }
            if (hasPermission('view-products')) {
                fetches.push(
                    api.get('/products')
                        .then(res => { results.products = res.data.data.length; })
                        .catch(() => {})
                );
            }
            if (hasPermission('view-orders')) {
                fetches.push(
                    api.get('/orders')
                        .then(res => { results.orders = res.data.data.length; })
                        .catch(() => {})
                );
            }
            if (hasPermission('manage-coupons')) {
                fetches.push(
                    api.get('/coupons')
                        .then(res => { results.coupons = res.data.data.length; })
                        .catch(() => {})
                );
            }

            await Promise.all(fetches);
            setStats(prev => ({ ...prev, ...results }));
        };

        fetchStats();
    }, []);

    const allCards = [
        { label: 'Categories', count: stats.categories, color: 'bg-blue-500', permissions: ['view-categories', 'manage-categories'] },
        { label: 'Sub Categories', count: stats.subCategories, color: 'bg-green-500', permissions: ['view-sub-categories', 'manage-sub-categories'] },
        { label: 'Products', count: stats.products, color: 'bg-purple-500', permissions: ['view-products'] },
        { label: 'Orders', count: stats.orders, color: 'bg-orange-500', permissions: ['view-orders'] },
        { label: 'Coupons', count: stats.coupons, color: 'bg-pink-500', permissions: ['manage-coupons'] },
    ];

    const cards = allCards.filter(card => card.permissions.some(p => hasPermission(p)));

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-500 mb-6">Welcome back, {user?.name}</p>

            {cards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <div key={card.label} className={`${card.color} rounded-xl shadow-lg p-6 text-white`}>
                            <p className="text-lg font-medium opacity-90">{card.label}</p>
                            <p className="text-4xl font-bold mt-2">
                                {card.count !== null ? card.count : '—'}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">No modules assigned yet</h3>
                    <p className="text-sm text-gray-500">
                        Contact your administrator to get permissions for managing store modules.
                    </p>
                </div>
            )}

            {permissions.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Permissions</h2>
                    <div className="flex flex-wrap gap-2">
                        {permissions.map((perm) => (
                            <span
                                key={perm}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                                {perm}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
