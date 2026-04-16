import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastNotification, setLastNotification] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await authService.check();
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (error) {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // Global Socket Connection
    useEffect(() => {
        if (user?._id) {
            const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
            const newSocket = io(socketUrl, {
                query: { userId: user._id }
            });

            setSocket(newSocket);

            newSocket.on('favoriteUpdate', (newFavorites) => {
                setUser(prev => prev ? { ...prev, favorites: newFavorites } : null);
            });

            // Global Chat Notification Listener
            newSocket.on('newMessageNotification', (data) => {
                // DON'T show notification if chat is already open or on /admin/chat
                if (window.isChatOpen || (user.role === 'admin' && window.location.pathname === '/admin/chat')) return;

                // Play notification sound
                new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(e => {});
                
                setLastNotification(data);
                
                // Auto hide after 6 seconds
                setTimeout(() => {
                    setLastNotification(null);
                }, 6000);
            });

            return () => newSocket.disconnect();
        } else {
            setSocket(null);
        }
    }, [user?._id]);

    const login = async (credentials) => {
        const res = await authService.login(credentials);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const clearNotification = () => setLastNotification(null);

    const value = {
        user,
        isAuthenticated,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        updateUser,
        socket,
        lastNotification,
        clearNotification
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
