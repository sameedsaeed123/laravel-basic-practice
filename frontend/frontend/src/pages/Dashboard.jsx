import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState({ categories: 0, subCategories: 0, products: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [cats, subs, prods] = await Promise.all([
                    api.get('/categories'),
                    api.get('/sub-categories'),
                    api.get('/products'),
                ]);
                setStats({
                    categories: cats.data.length,
                    subCategories: subs.data.length,
                    products: prods.data.length,
                });
            } catch (e) {}
        };
        fetchStats();
    }, []);

    const cards = [
        { label: 'Categories', count: stats.categories, color: 'bg-blue-500' },
        { label: 'Sub Categories', count: stats.subCategories, color: 'bg-green-500' },
        { label: 'Products', count: stats.products, color: 'bg-purple-500' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className={`${card.color} rounded-xl shadow-lg p-6 text-white`}>
                        <p className="text-lg font-medium opacity-90">{card.label}</p>
                        <p className="text-4xl font-bold mt-2">{card.count}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
