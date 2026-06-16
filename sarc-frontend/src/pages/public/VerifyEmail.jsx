import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/common/Button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyAccount = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token, email })
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed. The link may have expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Could not connect to the server to verify email. Please try again later.');
            }
        };

        verifyAccount();
    }, [token, email]);

    return (
        <div className="min-h-screen bg-canvas font-body flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    
                    <div className="flex justify-center mb-6">
                        {status === 'loading' && <Loader className="animate-spin text-primary w-16 h-16" />}
                        {status === 'success' && <CheckCircle className="text-green-500 w-16 h-16" />}
                        {status === 'error' && <XCircle className="text-red-500 w-16 h-16" />}
                    </div>

                    <h2 className="text-2xl font-bold font-heading text-slate-800 mb-4">
                        {status === 'loading' ? 'Verifying...' : (status === 'success' ? 'Email Verified!' : 'Verification Failed')}
                    </h2>
                    
                    <p className="text-slate-600 mb-8">
                        {message}
                    </p>

                    {status !== 'loading' && (
                        <div className="flex flex-col gap-3">
                            <Button variant="primary" onClick={() => navigate('/login')} className="w-full">
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
