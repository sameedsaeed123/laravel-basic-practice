import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useToast } from '../ToastContext';

const STATUS_OPTIONS = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
    paid: 'bg-green-100 text-green-800',
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
};

export default function Orders() {
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const canManage = hasPermission('manage-orders');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders');
                setOrders(res.data.data);
            } catch (e) {
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? res.data.data : o));
            showToast(res.data.message || 'Order status updated!', 'success');
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ID</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Products</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Coupon ID / Type</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No orders yet</td>
                                </tr>
                            )}
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{order.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{order.email || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">${Number(order.amount).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {canManage ? (
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                disabled={updatingId === order.id}
                                                className={`px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'} ${updatingId === order.id ? 'opacity-50' : ''}`}
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {order.items && order.items.length > 0 ? (
                                            <ul className="space-y-1">
                                                {order.items.map((item) => (
                                                    <li key={item.id}>
                                                        <span className="font-medium">ID {item.product_id}</span>
                                                        {item.stripe_product_id && <span className="text-gray-500 ml-1">(Stripe: {item.stripe_product_id})</span>}
                                                        {item.product && <span className="block text-gray-600">{item.product.title}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {order.stripe_coupon_id ? (
                                            <span className="block">{order.stripe_coupon_id}</span>
                                        ) : null}
                                        {order.coupon_type && <span className="block text-gray-500">{order.coupon_type}</span>}
                                        {!order.stripe_coupon_id && !order.coupon_type && '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
