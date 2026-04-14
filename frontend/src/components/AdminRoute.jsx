import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return <div className="container py-20 text-center">Đang kiểm tra quyền truy cập...</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
