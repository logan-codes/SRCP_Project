import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isSubmitting = React.useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('sarc_token');
        const role = localStorage.getItem('sarc_role');
        if (token && role) {
            if (role === 'FACULTY') navigate('/faculty');
            else if (role === 'ADMIN') navigate('/admin');
            else navigate('/student');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        
        setError('');
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('sarc_token', data.token);
                if (data.refreshToken) localStorage.setItem('sarc_refreshToken', data.refreshToken);
                localStorage.setItem('sarc_role', data.user.role || (data.user.isFaculty ? 'FACULTY' : 'STUDENT'));
                localStorage.setItem('sarc_isFirstLogin', data.user.isFirstLogin ? 'true' : 'false');
                
                if (data.user.isFirstLogin) {
                    navigate('/change-password');
                } else if (data.user.role === 'FACULTY') {
                    navigate('/faculty');
                } else if (data.user.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/student');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Could not connect to server. Please try again later.');
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-body bg-canvas">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-20 fixed"
                    style={{ backgroundImage: `url('/images/banner2.webp')` }}
                ></div>
                <div className="absolute inset-0 bg-canvas/90 backdrop-blur-sm z-0 fixed"></div>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold font-heading text-slate-900">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Please sign in to your SARCG account
                        </p>
                    </div>

                    <Card className="mt-8">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200 text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="you@sathyabama.ac.in"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                                        Remember me
                                    </label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full flex justify-center group" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-600">Please contact administration if you don't have an account.</span>
                        </div>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
