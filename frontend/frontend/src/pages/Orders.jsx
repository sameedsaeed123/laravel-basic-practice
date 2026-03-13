import { useEffect, useState } from 'react';
import api from '../api';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders');
                setOrders(res.data);
            } catch (e) {
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>
                <p className="text-gray-500">Loading...</p>
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
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            order.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {order.status}
                                        </span>
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
