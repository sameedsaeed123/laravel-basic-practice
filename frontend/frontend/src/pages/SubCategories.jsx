import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function SubCategories() {
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ name: '', category_id: '' });
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const fetchData = async () => {
        try {
            const [subsRes, catsRes] = await Promise.all([
                api.get('/sub-categories'),
                api.get('/categories'),
            ]);
            setSubCategories(subsRes.data.data);
            setCategories(catsRes.data.data);
        } catch (e) {}
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors({});
        setLoading(true);
        try {
            if (editId) {
                await api.put(`/sub-categories/${editId}`, form);
            } else {
                await api.post('/sub-categories', form);
            }
            setForm({ name: '', category_id: '' });
            setEditId(null);
            fetchData();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            setError(err.response?.data?.message || 'Error');
        }
        setLoading(false);
    };

    const handleEdit = (sub) => {
        setForm({ name: sub.name, category_id: sub.category_id });
        setEditId(sub.id);
        setError('');
        setErrors({});
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this sub category?')) return;
        try {
            await api.delete(`/sub-categories/${id}`);
            fetchData();
        } catch (e) {}
    };

    const cancelEdit = () => {
        setForm({ name: '', category_id: '' });
        setEditId(null);
        setError('');
        setErrors({});
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Sub Categories</h1>

            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Sub Category' : 'Add Sub Category'}</h2>

                {error && (
                    <Toast message={error} errors={errors} type="error" onClose={() => { setError(''); setErrors({}); }} />
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Sub category name"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                        </div>
                        <div className="flex-1">
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors.category_id ? 'border-red-400' : 'border-gray-300'}`}
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id[0]}</p>}
                        </div>
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
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ID</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Category</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {subCategories.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No sub categories found</td></tr>
                            )}
                            {subCategories.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{sub.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{sub.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{sub.category?.name}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(sub)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
