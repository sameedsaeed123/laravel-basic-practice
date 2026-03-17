import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import Toast from '../components/Toast';
import { useToast } from '../ToastContext';

export default function Products() {
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const canCreate = hasPermission('create-products');
    const canEdit = hasPermission('edit-products');
    const canDelete = hasPermission('delete-products');
    const showForm = canCreate || canEdit;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [filteredSubs, setFilteredSubs] = useState([]);
    const [form, setForm] = useState({ title: '', price: '', category_id: '', sub_category_id: '' });
    const [images, setImages] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const fetchData = async () => {
        try {
            const prodRes = await api.get('/products');
            setProducts(prodRes.data.data);
        } catch (e) {}

        if (showForm) {
            try {
                const [catsRes, subsRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/sub-categories'),
                ]);
                setCategories(catsRes.data.data);
                setSubCategories(subsRes.data.data);
            } catch (e) {}
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (form.category_id) {
            setFilteredSubs(subCategories.filter(s => String(s.category_id) === String(form.category_id)));
        } else {
            setFilteredSubs([]);
        }
    }, [form.category_id, subCategories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            if (name === 'category_id') {
                return { ...prev, category_id: value, sub_category_id: '' };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors({});
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', form.title);
            data.append('price', form.price);
            data.append('category_id', form.category_id);
            if (form.sub_category_id) data.append('sub_category_id', form.sub_category_id);
            for (const file of images) {
                data.append('images[]', file);
            }

            if (editId) {
                data.append('_method', 'PUT');
                const res = await api.post(`/products/${editId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                showToast(res.data.message || 'Product updated successfully!', 'success');
            } else {
                const res = await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                showToast(res.data.message || 'Product created successfully!', 'success');
            }
            setForm({ title: '', price: '', category_id: '', sub_category_id: '' });
            setImages([]);
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

    const handleEdit = (product) => {
        if (!canEdit) return;
        setForm({
            title: product.title,
            price: product.price,
            category_id: product.category_id,
            sub_category_id: product.sub_category_id || '',
        });
        setImages([]);
        setEditId(product.id);
        setError('');
        setErrors({});
    };

    const handleDelete = async (id) => {
        if (!canDelete) return;
        if (!window.confirm('Delete this product?')) return;
        try {
            const res = await api.delete(`/products/${id}`);
            showToast(res.data.message || 'Product deleted successfully!', 'success');
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to delete product', 'error');
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!canDelete) return;
        if (!window.confirm('Delete this image?')) return;
        try {
            const res = await api.delete(`/product-images/${imageId}`);
            showToast(res.data.message || 'Image deleted successfully!', 'success');
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to delete image', 'error');
        }
    };

    const cancelEdit = () => {
        setForm({ title: '', price: '', category_id: '', sub_category_id: '' });
        setImages([]);
        setEditId(null);
        setError('');
        setErrors({});
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Products</h1>

            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Product' : 'Add Product'}</h2>

                    {error && (
                        <Toast message={error} errors={errors} type="error" onClose={() => { setError(''); setErrors({}); }} />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Product title"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>}
                            </div>
                            <div className="w-full sm:w-32">
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="Price"
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors.price ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price[0]}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
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
                            <div className="flex-1">
                                <select
                                    name="sub_category_id"
                                    value={form.sub_category_id}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors.sub_category_id ? 'border-red-400' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Sub Category</option>
                                    {filteredSubs.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                                {errors.sub_category_id && <p className="text-red-500 text-xs mt-1">{errors.sub_category_id[0]}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                            <div className="flex-1">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setImages([...e.target.files])}
                                    className={`w-full px-4 py-2 border rounded-lg text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-medium file:cursor-pointer ${errors['images.0'] || errors['images.1'] || errors['images.2'] ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {(errors['images.0'] || errors['images.1'] || errors['images.2']) && (
                                    <p className="text-red-500 text-xs mt-1">{(errors['images.0'] || errors['images.1'] || errors['images.2'])[0]}</p>
                                )}
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
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Price</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Category</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Sub Category</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Images</th>
                                {(canEdit || canDelete) && (
                                    <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.length === 0 && (
                                <tr><td colSpan={canEdit || canDelete ? 7 : 6} className="px-6 py-8 text-center text-gray-400">No products found</td></tr>
                            )}
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{product.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">${Number(product.price).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.sub_category?.name || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {product.images?.map((img) => (
                                                <div key={img.id} className="relative group">
                                                    <img
                                                        src={`http://localhost:8000/${img.image}`}
                                                        alt=""
                                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteImage(img.id)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs leading-none hidden group-hover:flex items-center justify-center"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    {(canEdit || canDelete) && (
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            )}
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
