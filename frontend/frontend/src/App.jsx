import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import SubCategories from './pages/SubCategories';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Coupons from './pages/Coupons';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import Users from './pages/Users';
import HomePage from './pages/HomePage';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';

function AdminRoute({ children }) {
    const { token, isAdmin, permissionsLoaded } = useAuth();
    if (!permissionsLoaded) return null;
    if (!token) return <Navigate to="/login" />;
    if (!isAdmin) return <Navigate to="/" />;
    return children;
}

function GuestRoute({ children }) {
    const { token, isAdmin, permissionsLoaded } = useAuth();
    if (!permissionsLoaded) return null;
    if (token && isAdmin) return <Navigate to="/admin" />;
    if (token) return <Navigate to="/" />;
    return children;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="sub-categories" element={<SubCategories />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="roles" element={<Roles />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="users" element={<Users />} />
            </Route>
        </Routes>
    );
}

export default App;
