import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [permissions, setPermissions] = useState([]);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const clearAuth = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setPermissions([]);
    }, []);

    const fetchPermissions = useCallback(async () => {
        if (!localStorage.getItem('token')) {
            clearAuth();
            setPermissionsLoaded(true);
            return;
        }
        try {
            const res = await api.get('/user');
            const { user: userData, permissions: perms } = res.data.data;
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setPermissions(perms || []);
        } catch (e) {
            clearAuth();
        }
        setPermissionsLoaded(true);
    }, [clearAuth]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { user: userData, token: authToken, permissions: perms } = res.data.data;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        setPermissions(perms || []);
        setPermissionsLoaded(true);
        showToast(res.data.message || 'Login successful!', 'success');

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
        setToken(authToken);
        setUser(userData);
        setPermissions([]);
        setPermissionsLoaded(true);
        showToast(res.data.message || 'Registered successfully!', 'success');
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
        setPermissions([]);
        setPermissionsLoaded(true);
        navigate('/');
    };

    const refreshUser = async () => {
        await fetchPermissions();
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
                permissionsLoaded,
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
