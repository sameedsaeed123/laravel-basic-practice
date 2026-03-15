import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [permissions, setPermissions] = useState(
        JSON.parse(localStorage.getItem('permissions') || '[]')
    );
    const navigate = useNavigate();

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { user: userData, token: authToken, permissions: perms } = res.data.data;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('permissions', JSON.stringify(perms || []));
        setToken(authToken);
        setUser(userData);
        setPermissions(perms || []);

        const hasAdminAccess =
            userData.role === 'admin' ||
            (userData.roles && userData.roles.length > 0);

        if (hasAdminAccess) {
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
        const { user: userData, token: authToken } = res.data.data;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('permissions', JSON.stringify([]));
        setToken(authToken);
        setUser(userData);
        setPermissions([]);
        navigate('/');
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        setToken(null);
        setUser(null);
        setPermissions([]);
        navigate('/');
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/user');
            const { user: userData, permissions: perms } = res.data.data;
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('permissions', JSON.stringify(perms || []));
            setUser(userData);
            setPermissions(perms || []);
        } catch (e) {}
    };

    const hasPermission = (permissionName) => {
        return permissions.includes(permissionName);
    };

    const hasAnyPermission = (...permissionNames) => {
        return permissionNames.some((p) => permissions.includes(p));
    };

    const isAdmin =
        user?.role === 'admin' ||
        (user?.roles && user.roles.length > 0);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                permissions,
                login,
                register,
                logout,
                refreshUser,
                isAdmin,
                hasPermission,
                hasAnyPermission,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
