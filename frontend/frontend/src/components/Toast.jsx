import { useEffect, useState } from 'react';

export default function Toast({ message, errors, type = 'error', onClose, duration = 5000 }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => handleClose(), duration);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => onClose?.(), 300);
    };

    const isError = type === 'error';
    const errorList = errors ? Object.values(errors).flat() : [];

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${exiting ? 'animate-slide-out' : 'animate-slide-in'}`}>
            <div className={`rounded-xl shadow-lg border p-4 backdrop-blur-sm ${
                isError
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
            }`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                            isError ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                            {isError ? (
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${isError ? 'text-red-800' : 'text-green-800'}`}>
                                {message}
                            </p>
                            {errorList.length > 0 && (
                                <ul className="mt-1.5 space-y-0.5">
                                    {errorList.map((err, i) => (
                                        <li key={i} className={`text-xs ${isError ? 'text-red-600' : 'text-green-600'}`}>
                                            • {err}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className={`flex-shrink-0 p-0.5 rounded-md transition ${
                            isError
                                ? 'text-red-400 hover:text-red-600 hover:bg-red-100'
                                : 'text-green-400 hover:text-green-600 hover:bg-green-100'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
