import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [form, setForm] = useState({ name: '', permissions: [] });
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/roles'),
                api.get('/permissions'),
            ]);
            setRoles(rolesRes.data.data);
            setAllPermissions(permsRes.data.data);
        } catch (e) {
            setToast({ message: 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({ name: '', permissions: [] });
        setEditing(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                const res = await api.put(`/roles/${editing}`, form);
                setRoles(roles.map((r) => (r.id === editing ? res.data.data : r)));
                setToast({ message: 'Role updated successfully', type: 'success' });
            } else {
                const res = await api.post('/roles', form);
                setRoles([...roles, res.data.data]);
                setToast({ message: 'Role created successfully', type: 'success' });
            }
            resetForm();
        } catch (err) {
            setToast({
                message: err.response?.data?.message || 'Operation failed',
                errors: err.response?.data?.errors,
                type: 'error',
            });
        }
    };

    const handleEdit = (role) => {
        setForm({
            name: role.name,
            permissions: role.permissions.map((p) => p.id),
        });
        setEditing(role.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await api.delete(`/roles/${id}`);
            setRoles(roles.filter((r) => r.id !== id));
            setToast({ message: 'Role deleted successfully', type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Delete failed', type: 'error' });
        }
    };

    const togglePermission = (permId) => {
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter((id) => id !== permId)
                : [...prev.permissions, permId],
        }));
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Roles Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {editing ? 'Edit Role' : 'Create Role'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. manager"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                                    {allPermissions.map((perm) => (
                                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.permissions.includes(perm.id)}
                                                onChange={() => togglePermission(perm.id)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{perm.name}</span>
                                        </label>
                                    ))}
                                    {allPermissions.length === 0 && (
                                        <p className="text-sm text-gray-400">No permissions available</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                >
                                    {editing ? 'Update' : 'Create'}
                                </button>
                                {editing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Role</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Permissions</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {roles.map((role) => (
                                        <tr key={role.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {role.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {role.permissions.map((p) => (
                                                        <span
                                                            key={p.id}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                                        >
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                    {role.permissions.length === 0 && (
                                                        <span className="text-xs text-gray-400">No permissions</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(role.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {roles.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400">
                                                No roles found
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
