import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [form, setForm] = useState({
        code: '',
        discount_type: 'percent_off',
        discount_value: '',
        duration: 'once',
        duration_in_months: '',
        max_redemptions: '',
        expires_at: '',
    });
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({
        code: '',
        discount_type: 'percent_off',
        discount_value: '',
        duration: 'once',
        duration_in_months: '',
        max_redemptions: '',
        expires_at: '',
        is_active: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data.data);
        } catch (e) {
            setError('Failed to load coupons');
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setForm({
            code: '',
            discount_type: 'percent_off',
            discount_value: '',
            duration: 'once',
            duration_in_months: '',
            max_redemptions: '',
            expires_at: '',
        });
        setError('');
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors({});
        setSuccess('');
        setLoading(true);

        try {
            const discountValue = form.discount_type === 'percent_off'
                ? parseInt(form.discount_value, 10)
                : parseFloat(form.discount_value);

            const payload = {
                ...form,
                code: form.code.toUpperCase(),
                discount_value: discountValue,
                duration_in_months: form.duration === 'repeating' ? parseInt(form.duration_in_months) : null,
                max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions) : null,
                expires_at: form.expires_at || null,
            };

            const res = await api.post('/coupons', payload);
            setSuccess(res.data.message || 'Coupon created successfully');
            resetForm();
            fetchCoupons();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            setError(err.response?.data?.message || 'Failed to create coupon');
        }
        setLoading(false);
    };

    const handleEdit = (coupon) => {
        setEditId(coupon.id);
        setEditForm({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            duration: coupon.duration,
            duration_in_months: coupon.duration_in_months || '',
            max_redemptions: coupon.max_redemptions || '',
            expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
            is_active: coupon.is_active,
        });
        setError('');
        setErrors({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        setError('');
        setErrors({});
        setSuccess('');
        setLoading(true);
        try {
            const discountValue = editForm.discount_type === 'percent_off'
                ? parseInt(editForm.discount_value, 10)
                : parseFloat(editForm.discount_value);

            const payload = {
                code: editForm.code.toUpperCase(),
                discount_type: editForm.discount_type,
                discount_value: discountValue,
                duration: editForm.duration,
                duration_in_months: editForm.duration === 'repeating' ? parseInt(editForm.duration_in_months) : null,
                max_redemptions: editForm.max_redemptions ? parseInt(editForm.max_redemptions) : null,
                expires_at: editForm.expires_at || null,
                is_active: editForm.is_active,
            };
            const res = await api.put(`/coupons/${editId}`, payload);
            setSuccess(res.data.message || 'Coupon updated');
            setEditId(null);
            fetchCoupons();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            setError(err.response?.data?.message || 'Failed to update coupon');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon? This will also deactivate it on Stripe.')) return;
        setError('');
        setSuccess('');
        try {
            const res = await api.delete(`/coupons/${id}`);
            setSuccess(res.data.message || 'Coupon deleted');
            fetchCoupons();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete coupon');
        }
    };

    const cancelEdit = () => {
        setEditId(null);
        setError('');
        setErrors({});
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Coupons</h1>

            {success && (
                <Toast message={success} type="success" onClose={() => setSuccess('')} />
            )}

            {error && (
                <Toast message={error} errors={errors} type="error" onClose={() => { setError(''); setErrors({}); }} />
            )}

            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Create New Coupon</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                name="code"
                                value={form.code}
                                onChange={handleChange}
                                placeholder="e.g. SAVE20"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase"
                            />
                            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                            <select
                                name="discount_type"
                                value={form.discount_type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="percent_off">Percentage Off (%)</option>
                                <option value="amount_off">Fixed Amount Off ($)</option>
                            </select>
                            {errors.discount_type && <p className="text-red-500 text-xs mt-1">{errors.discount_type[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {form.discount_type === 'percent_off' ? 'Percentage (0-100)' : 'Amount ($)'}
                            </label>
                            <input
                                type="number"
                                name="discount_value"
                                value={form.discount_value}
                                onChange={handleChange}
                                placeholder={form.discount_type === 'percent_off' ? '20' : '10.00'}
                                step={form.discount_type === 'percent_off' ? '1' : '0.01'}
                                min={form.discount_type === 'percent_off' ? '1' : '0.01'}
                                max={form.discount_type === 'percent_off' ? '100' : undefined}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            {errors.discount_value && <p className="text-red-500 text-xs mt-1">{errors.discount_value[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <select
                                name="duration"
                                value={form.duration}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="once">Once (single use)</option>
                                <option value="repeating">Repeating</option>
                                <option value="forever">Forever</option>
                            </select>
                            {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration[0]}</p>}
                        </div>

                        {form.duration === 'repeating' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                                <input
                                    type="number"
                                    name="duration_in_months"
                                    value={form.duration_in_months}
                                    onChange={handleChange}
                                    placeholder="3"
                                    min="1"
                                    max="36"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                                {errors.duration_in_months && <p className="text-red-500 text-xs mt-1">{errors.duration_in_months[0]}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Redemptions</label>
                            <input
                                type="number"
                                name="max_redemptions"
                                value={form.max_redemptions}
                                onChange={handleChange}
                                placeholder="Unlimited"
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            {errors.max_redemptions && <p className="text-red-500 text-xs mt-1">{errors.max_redemptions[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                            <input
                                type="datetime-local"
                                name="expires_at"
                                value={form.expires_at}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            {errors.expires_at && <p className="text-red-500 text-xs mt-1">{errors.expires_at[0]}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Coupon'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {editId && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-2 border-indigo-200">
                    <h2 className="text-lg font-semibold mb-4">Edit Coupon #{editId}</h2>
                    <p className="text-xs text-gray-500 mb-4">Updating discount details will deactivate the old Stripe coupon and create a new one.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                name="code"
                                value={editForm.code}
                                onChange={handleEditChange}
                                placeholder="e.g. SAVE20"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase"
                            />
                            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                            <select
                                name="discount_type"
                                value={editForm.discount_type}
                                onChange={handleEditChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="percent_off">Percentage Off (%)</option>
                                <option value="amount_off">Fixed Amount Off ($)</option>
                            </select>
                            {errors.discount_type && <p className="text-red-500 text-xs mt-1">{errors.discount_type[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {editForm.discount_type === 'percent_off' ? 'Percentage (0-100)' : 'Amount ($)'}
                            </label>
                            <input
                                type="number"
                                name="discount_value"
                                value={editForm.discount_value}
                                onChange={handleEditChange}
                                placeholder={editForm.discount_type === 'percent_off' ? '20' : '10.00'}
                                step={editForm.discount_type === 'percent_off' ? '1' : '0.01'}
                                min={editForm.discount_type === 'percent_off' ? '1' : '0.01'}
                                max={editForm.discount_type === 'percent_off' ? '100' : undefined}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            {errors.discount_value && <p className="text-red-500 text-xs mt-1">{errors.discount_value[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <select
                                name="duration"
                                value={editForm.duration}
                                onChange={handleEditChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="once">Once (single use)</option>
                                <option value="repeating">Repeating</option>
                                <option value="forever">Forever</option>
                            </select>
                            {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration[0]}</p>}
                        </div>

                        {editForm.duration === 'repeating' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                                <input
                                    type="number"
                                    name="duration_in_months"
                                    value={editForm.duration_in_months}
                                    onChange={handleEditChange}
                                    placeholder="3"
                                    min="1"
                                    max="36"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                                {errors.duration_in_months && <p className="text-red-500 text-xs mt-1">{errors.duration_in_months[0]}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Redemptions</label>
                            <input
                                type="number"
                                name="max_redemptions"
                                value={editForm.max_redemptions}
                                onChange={handleEditChange}
                                placeholder="Unlimited"
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            {errors.max_redemptions && <p className="text-red-500 text-xs mt-1">{errors.max_redemptions[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                            <input
                                type="datetime-local"
                                name="expires_at"
                                value={editForm.expires_at}
                                onChange={handleEditChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            {errors.expires_at && <p className="text-red-500 text-xs mt-1">{errors.expires_at[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={editForm.is_active ? 'true' : 'false'}
                                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                            {errors.is_active && <p className="text-red-500 text-xs mt-1">{errors.is_active[0]}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Code</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Discount</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Duration</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Usage</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Expires</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No coupons yet</td>
                                </tr>
                            )}
                            {coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-mono font-bold bg-indigo-50 text-indigo-700">
                                            {coupon.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {coupon.discount_type === 'percent_off'
                                            ? `${coupon.discount_value}%`
                                            : `$${Number(coupon.discount_value).toFixed(2)}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                                        {coupon.duration}
                                        {coupon.duration === 'repeating' && coupon.duration_in_months && (
                                            <span className="text-gray-400"> ({coupon.duration_in_months}mo)</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {coupon.times_redeemed || 0}
                                        {coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ' / ∞'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            coupon.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {coupon.expires_at
                                            ? new Date(coupon.expires_at).toLocaleDateString()
                                            : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(coupon)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon.id)}
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
