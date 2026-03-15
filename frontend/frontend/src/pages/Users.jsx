import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles'),
            ]);
            setUsers(usersRes.data.data);
            setAllRoles(rolesRes.data.data);
        } catch (e) {
            setToast({ message: 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleEditRoles = (user) => {
        setEditingUserId(user.id);
        setSelectedRoles(user.roles.map((r) => r.id));
    };

    const handleSaveRoles = async () => {
        try {
            const res = await api.put(`/users/${editingUserId}/roles`, {
                roles: selectedRoles,
            });
            setUsers(users.map((u) => (u.id === editingUserId ? res.data.data : u)));
            setEditingUserId(null);
            setToast({ message: 'Roles updated successfully', type: 'success' });
        } catch (err) {
            setToast({
                message: err.response?.data?.message || 'Failed to update roles',
                type: 'error',
            });
        }
    };

    const toggleRole = (roleId) => {
        setSelectedRoles((prev) =>
            prev.includes(roleId)
                ? prev.filter((id) => id !== roleId)
                : [...prev, roleId]
        );
    };

    const getUserPermissions = (user) => {
        if (!user.roles) return [];
        const perms = new Set();
        user.roles.forEach((role) => {
            if (role.permissions) {
                role.permissions.forEach((p) => perms.add(p.name));
            }
        });
        return [...perms];
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Users Management</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Roles</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Effective Permissions</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-400">ID: {user.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {editingUserId === user.id ? (
                                            <div className="space-y-2">
                                                {allRoles.map((role) => (
                                                    <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRoles.includes(role.id)}
                                                            onChange={() => toggleRole(role.id)}
                                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{role.name}</span>
                                                    </label>
                                                ))}
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={handleSaveRoles}
                                                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUserId(null)}
                                                        className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <span
                                                            key={role.id}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                        >
                                                            {role.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400">No roles assigned</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {getUserPermissions(user).map((perm) => (
                                                <span
                                                    key={perm}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                                                >
                                                    {perm}
                                                </span>
                                            ))}
                                            {getUserPermissions(user).length === 0 && (
                                                <span className="text-xs text-gray-400">None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingUserId !== user.id && (
                                            <button
                                                onClick={() => handleEditRoles(user)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                Manage Roles
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
