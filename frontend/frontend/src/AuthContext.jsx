import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const userData = res.data.user;
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(res.data.token);
        setUser(userData);

        if (userData.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    const register = async (name, email, password, password_confirmation) => {
        const res = await api.post('/register', {
            name,
            email,
            password,
            password_confirmation,
        });
        const userData = res.data.user;
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(res.data.token);
        setUser(userData);
        navigate('/');
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
