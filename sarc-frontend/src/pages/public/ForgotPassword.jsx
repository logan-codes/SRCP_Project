import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to send reset email');
            }
        } catch (err) {
            setError('Could not connect to server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-body bg-canvas">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-20 fixed"
                    style={{ backgroundImage: `url('/images/banner2.jpg')` }}
                ></div>
                <div className="absolute inset-0 bg-canvas/90 backdrop-blur-sm z-0 fixed"></div>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold font-heading text-slate-900">
                            Forgot Password
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <Card className="mt-8">
                        {success ? (
                            <div className="text-center space-y-4">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                                <h3 className="text-lg font-medium text-slate-900">Email Sent</h3>
                                <p className="text-sm text-slate-600">
                                    We've sent an email to <strong>{email}</strong> with instructions to reset your password. 
                                    Please check your inbox (and spam folder).
                                </p>
                                <div className="mt-6">
                                    <Link to="/login">
                                        <Button variant="outline" className="w-full">
                                            Return to Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
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
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                            placeholder="you@sathyabama.ac.in"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full flex justify-center group" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                
                                <div className="mt-6 text-center text-sm">
                                    <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ForgotPassword;
