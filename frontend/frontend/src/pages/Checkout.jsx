import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Toast from '../components/Toast';

const API_BASE = 'http://localhost:8000';

export default function Checkout() {
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product_id');
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [couponCode, setCouponCode] = useState('');
    const [couponResult, setCouponResult] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) {
            setError('No product selected');
            setLoading(false);
            return;
        }
        axios.get(`${API_BASE}/api/public/products`)
            .then(res => {
                const found = res.data.find(p => String(p.id) === String(productId));
                if (found) {
                    setProduct(found);
                } else {
                    setError('Product not found');
                }
            })
            .catch(() => setError('Failed to load product'))
            .finally(() => setLoading(false));
    }, [productId]);

    const subtotal = product ? Number(product.price) * quantity : 0;
    const discount = couponResult ? couponResult.discount_amount * quantity : 0;
    const total = Math.max(0, subtotal - discount);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');
        setCouponResult(null);
        setCouponLoading(true);
        try {
            const res = await api.post('/validate-coupon', {
                code: couponCode.trim(),
                amount: Number(product.price),
            });
            setCouponResult(res.data.coupon);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon');
            setCouponResult(null);
        }
        setCouponLoading(false);
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setCouponResult(null);
        setCouponError('');
    };

    const handleCheckout = async () => {
        setError('');
        setCheckoutLoading(true);
        try {
            const payload = {
                product_id: product.id,
                quantity,
            };
            if (couponResult) {
                payload.coupon_code = couponResult.code;
            }
            const { data } = await api.post('/stripe/checkout-session', payload);
            if (data.url) {
                window.location.href = data.url;
                return;
            }
            setError(data.message || 'Failed to start checkout');
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed. Please try again.');
        }
        setCheckoutLoading(false);
    };

    const getImageUrl = (prod) => {
        if (prod?.images?.length > 0) {
            return `${API_BASE}/storage/${prod.images[0].image}`;
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

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{error || 'Product not found'}</h2>
                    <Link to="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
                        ← Back to shop
                    </Link>
                </div>
            </div>
        );
    }

    const imageUrl = getImageUrl(product);

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Continue shopping
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-8">Checkout</h1>

                {error && (
                    <Toast message={error} type="error" onClose={() => setError('')} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>

                        <div className="flex gap-4 mb-6">
                            {imageUrl ? (
                                <img src={imageUrl} alt={product.title} className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                            ) : (
                                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{product.title}</h3>
                                {product.category && (
                                    <p className="text-sm text-gray-500">{product.category.name}</p>
                                )}
                                <p className="text-lg font-bold text-indigo-600 mt-1">${Number(product.price).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-4 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Quantity</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Have a coupon?</h2>

                            {couponResult ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 text-green-700 font-medium text-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {couponResult.code}
                                            </span>
                                            <p className="text-sm text-green-600 mt-1">
                                                {couponResult.discount_type === 'percent_off'
                                                    ? `${couponResult.discount_value}% off`
                                                    : `$${Number(couponResult.discount_value).toFixed(2)} off`}
                                                {' '}— You save ${Number(couponResult.discount_amount).toFixed(2)} per item
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm uppercase"
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={couponLoading || !couponCode.trim()}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            {couponLoading ? 'Checking...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && (
                                        <p className="text-red-500 text-sm mt-2">{couponError}</p>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Price Details</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {couponResult && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount ({couponResult.code})</span>
                                        <span>−${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={checkoutLoading}
                                className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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
                                        Pay ${total.toFixed(2)}
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center mt-3">
                                Secure payment powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
