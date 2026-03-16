import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function Permissions() {
    const [permissions, setPermissions] = useState([]);
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Permissions</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Permission Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
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
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Active
                                        </span>
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

            <p className="mt-4 text-sm text-gray-400">
                Permissions are managed by developers in the codebase. Use the Roles page to assign permissions to roles.
            </p>
        </div>
    );
}
