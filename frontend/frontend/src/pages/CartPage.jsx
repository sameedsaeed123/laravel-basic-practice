import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

const API_BASE = 'http://localhost:8000';

export default function CartPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingItem, setUpdatingItem] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editColor, setEditColor] = useState('');
    const [editSize, setEditSize] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/register');
            return;
        }
        fetchCart();
    }, [token]);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart');
            setCart(res.data.data);
        } catch {
            showToast('Failed to load cart.', 'error');
        }
        setLoading(false);
    };

    const updateQuantity = async (itemId, newQty) => {
        if (newQty < 1) return;
        setUpdatingItem(itemId);
        try {
            const res = await api.put(`/cart/items/${itemId}`, { quantity: newQty });
            setCart(res.data.data);
        } catch {
            showToast('Failed to update quantity.', 'error');
        }
        setUpdatingItem(null);
    };

    const removeItem = async (itemId) => {
        setUpdatingItem(itemId);
        try {
            const res = await api.delete(`/cart/items/${itemId}`);
            setCart(res.data.data);
            showToast('Item removed from cart.', 'success');
        } catch {
            showToast('Failed to remove item.', 'error');
        }
        setUpdatingItem(null);
    };

    const updateItemOptions = async (itemId, product) => {
        const needsColor = product.colors?.length > 0;
        const needsSize = product.sizes?.length > 0;
        if (needsColor && !editColor) {
            showToast('Please select a color.', 'error');
            return;
        }
        if (needsSize && !editSize) {
            showToast('Please select a size.', 'error');
            return;
        }
        setUpdatingItem(itemId);
        try {
            await api.delete(`/cart/items/${itemId}`);
            const item = cart.items.find(i => i.id === itemId);
            const payload = {
                product_id: product.id,
                quantity: item?.quantity || 1,
            };
            if (editColor) payload.selected_color = editColor;
            if (editSize) payload.selected_size = editSize;
            const res = await api.post('/cart/items', payload);
            setCart(res.data.data);
            setEditingItem(null);
            showToast('Options updated.', 'success');
        } catch {
            showToast('Failed to update options.', 'error');
            fetchCart();
        }
        setUpdatingItem(null);
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart');
            setCart(prev => ({ ...prev, items: [], item_count: 0, subtotal: 0, discount: 0, total: 0, coupon: null }));
            showToast('Cart cleared.', 'success');
        } catch {
            showToast('Failed to clear cart.', 'error');
        }
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        try {
            const res = await api.post('/cart/coupon', { code: couponCode.trim() });
            setCart(res.data.data);
            setCouponCode('');
            showToast(res.data.message || 'Coupon applied!', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid coupon code.', 'error');
        }
        setCouponLoading(false);
    };

    const removeCoupon = async () => {
        try {
            const res = await api.delete('/cart/coupon');
            setCart(res.data.data);
            showToast('Coupon removed.', 'success');
        } catch {
            showToast('Failed to remove coupon.', 'error');
        }
    };

    const itemsMissingSelections = () => {
        if (!cart?.items) return [];
        return cart.items.filter(item => {
            const p = item.product;
            const needsColor = p.colors?.length > 0;
            const needsSize = p.sizes?.length > 0;
            return (needsColor && !item.selected_color) || (needsSize && !item.selected_size);
        });
    };

    const handleCheckout = async () => {
        const missing = itemsMissingSelections();
        if (missing.length > 0) {
            const names = missing.map(i => i.product.title).join(', ');
            showToast(`Please select color/size for: ${names}`, 'error');
            return;
        }
        setCheckoutLoading(true);
        try {
            const res = await api.post('/cart/checkout');
            const url = res.data.data?.url || res.data.url;
            if (url) {
                window.location.href = url;
                return;
            }
            showToast(res.data.message || 'Failed to start checkout.', 'error');
        } catch (err) {
            showToast(err.response?.data?.message || 'Checkout failed. Please try again.', 'error');
        }
        setCheckoutLoading(false);
    };

    const getImageUrl = (product) => {
        if (product?.images?.length > 0) {
            return `${API_BASE}/${product.images[0].image}`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const items = cart?.items || [];
    const isEmpty = items.length === 0;
    const hasMissing = itemsMissingSelections().length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                ShopEcom
                            </span>
                        </Link>
                        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Continue shopping
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Shopping Cart
                        {!isEmpty && (
                            <span className="text-base font-normal text-gray-400 ml-2">
                                ({cart.item_count} item{cart.item_count !== 1 ? 's' : ''})
                            </span>
                        )}
                    </h1>
                    {!isEmpty && (
                        <button
                            onClick={clearCart}
                            className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                            Clear cart
                        </button>
                    )}
                </div>

                {isEmpty ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                        <p className="text-gray-500 mb-6">Looks like you haven't added any products yet.</p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => {
                                const imageUrl = getImageUrl(item.product);
                                const isUpdating = updatingItem === item.id;
                                const isEditing = editingItem === item.id;
                                const p = item.product;
                                const needsColor = p.colors?.length > 0;
                                const needsSize = p.sizes?.length > 0;
                                const missingColor = needsColor && !item.selected_color;
                                const missingSize = needsSize && !item.selected_size;
                                const hasMissingOptions = missingColor || missingSize;

                                return (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-2xl shadow-sm p-5 transition-opacity ${isUpdating ? 'opacity-60' : ''} ${hasMissingOptions ? 'ring-2 ring-amber-400' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={p.title}
                                                    className="w-24 h-24 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {item.selected_color && !isEditing && (
                                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    <span className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: item.selected_color.toLowerCase() }} />
                                                                    {item.selected_color}
                                                                </span>
                                                            )}
                                                            {item.selected_size && !isEditing && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    Size: {item.selected_size}
                                                                </span>
                                                            )}
                                                            {hasMissingOptions && !isEditing && (
                                                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                                                                    {[missingColor && 'color', missingSize && 'size'].filter(Boolean).join(' & ')} required
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {(needsColor || needsSize) && !isEditing && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item.id);
                                                                    setEditColor(item.selected_color || '');
                                                                    setEditSize(item.selected_size || '');
                                                                }}
                                                                className="text-gray-400 hover:text-indigo-500 transition-colors p-1"
                                                                title="Change options"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            disabled={isUpdating}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                            title="Remove item"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={isUpdating || item.quantity <= 1}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition disabled:opacity-40"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            disabled={isUpdating || item.quantity >= 100}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition disabled:opacity-40"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="font-bold text-indigo-600">
                                                        ${item.line_total.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                {needsColor && (
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Color <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {p.colors.map((color) => (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() => setEditColor(color)}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                                                                        editColor === color
                                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: color.toLowerCase() }} />
                                                                    {color}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {needsSize && (
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Size <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {p.sizes.map((size) => (
                                                                <button
                                                                    key={size}
                                                                    type="button"
                                                                    onClick={() => setEditSize(size)}
                                                                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                                                        editSize === size
                                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    {size}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => updateItemOptions(item.id, p)}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingItem(null)}
                                                        className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-5">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Have a coupon?</h2>

                                {cart.coupon ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 text-green-700 font-medium text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {cart.coupon.code}
                                                </span>
                                                <p className="text-sm text-green-600 mt-1">
                                                    {cart.coupon.discount_type === 'percent_off'
                                                        ? `${cart.coupon.discount_value}% off`
                                                        : `$${Number(cart.coupon.discount_value).toFixed(2)} off`}
                                                    {' '}&mdash; You save ${cart.discount.toFixed(2)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={removeCoupon}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm uppercase"
                                            onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                                        />
                                        <button
                                            onClick={applyCoupon}
                                            disabled={couponLoading || !couponCode.trim()}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            {couponLoading ? 'Checking...' : 'Apply'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal ({cart.item_count} item{cart.item_count !== 1 ? 's' : ''})</span>
                                        <span>${cart.subtotal.toFixed(2)}</span>
                                    </div>
                                    {cart.coupon && cart.discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount ({cart.coupon.code})</span>
                                            <span>&minus;${cart.discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>${cart.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {hasMissing && (
                                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-amber-700">Some items need color or size selection before you can checkout.</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleCheckout}
                                    disabled={checkoutLoading || hasMissing}
                                    className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {checkoutLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Redirecting to payment...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Checkout &mdash; ${cart.total.toFixed(2)}
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-400 text-center mt-3">
                                    Secure payment powered by Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
