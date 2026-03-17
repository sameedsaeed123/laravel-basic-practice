import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import Toast from '../components/Toast';
import { useToast } from '../ToastContext';

export default function Categories() {
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const canManage = hasPermission('manage-categories');

    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (e) {}
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors({});
        setLoading(true);
        try {
            if (editId) {
                const res = await api.put(`/categories/${editId}`, { name });
                showToast(res.data.message || 'Category updated successfully!', 'success');
            } else {
                const res = await api.post('/categories', { name });
                showToast(res.data.message || 'Category created successfully!', 'success');
            }
            setName('');
            setEditId(null);
            fetchCategories();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            setError(err.response?.data?.message || 'Error');
        }
        setLoading(false);
    };

    const handleEdit = (cat) => {
        setName(cat.name);
        setEditId(cat.id);
        setError('');
        setErrors({});
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            const res = await api.delete(`/categories/${id}`);
            showToast(res.data.message || 'Category deleted successfully!', 'success');
            fetchCategories();
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to delete category', 'error');
        }
    };

    const cancelEdit = () => {
        setName('');
        setEditId(null);
        setError('');
        setErrors({});
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Categories</h1>

            {canManage && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Category' : 'Add Category'}</h2>

                    {error && (
                        <Toast message={error} errors={errors} type="error" onClose={() => { setError(''); setErrors({}); }} />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Category name"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : editId ? 'Update' : 'Add'}
                                </button>
                                {editId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ID</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Sub Categories</th>
                                {canManage && <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {categories.length === 0 && (
                                <tr><td colSpan={canManage ? 4 : 3} className="px-6 py-8 text-center text-gray-400">No categories found</td></tr>
                            )}
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{cat.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{cat.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{cat.sub_categories?.length || 0}</td>
                                    {canManage && (
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
