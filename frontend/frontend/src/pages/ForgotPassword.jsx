
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Toast from '../components/Toast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrors({});
        setMessage('');
        setLoading(true);
        try {
            const res = await api.post('/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            setError(err.response?.data?.message || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    Forgot Password
                </h2>
                <p className="text-center text-gray-500 mb-8">
                    Enter your email and we'll send you a reset link
                </p>

                {message && (
                    <Toast message={message} type="success" onClose={() => setMessage('')} />
                )}

                {error && (
                    <Toast message={error} errors={errors} type="error" onClose={() => { setError(''); setErrors({}); }} />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Back to login
                    </Link>
                </p>
            </div>
        </div>
    );
}
