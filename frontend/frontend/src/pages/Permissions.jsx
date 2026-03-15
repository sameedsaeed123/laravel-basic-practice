import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function Permissions() {
    const [permissions, setPermissions] = useState([]);
    const [name, setName] = useState('');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/permissions');
            setPermissions(res.data.data);
        } catch (e) {
            setToast({ message: 'Failed to load permissions', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPermissions(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/permissions', { name });
            setPermissions([...permissions, res.data.data]);
            setName('');
            setToast({ message: 'Permission created successfully', type: 'success' });
        } catch (err) {
            setToast({
                message: err.response?.data?.message || 'Create failed',
                errors: err.response?.data?.errors,
                type: 'error',
            });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? Deleting this permission will remove it from all roles.')) return;
        try {
            await api.delete(`/permissions/${id}`);
            setPermissions(permissions.filter((p) => p.id !== id));
            setToast({ message: 'Permission deleted successfully', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Delete failed', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Permissions Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Permission</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. manage-reports"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Use kebab-case naming (e.g. manage-categories, view-orders)
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                            >
                                Create Permission
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">ID</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Permission Name</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {permissions.map((perm) => (
                                        <tr key={perm.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">{perm.id}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    {perm.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(perm.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {permissions.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400">
                                                No permissions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
