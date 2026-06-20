import React, { useState } from 'react';
import { X, Reply, Send, User, Mail, MessageSquare } from 'lucide-react';
import Button from './Button';

const SupportTicketModal = ({ isOpen, onClose, notification }) => {
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !notification) return null;

    // Parse the notification message
    const parseSupportTicket = (messageStr) => {
        const fromMatch = messageStr.match(/From: (.*?) \((.*?)\)/);
        const subjectMatch = messageStr.match(/Subject: (.*?)\n/);
        const bodyIndex = messageStr.indexOf('\n\n');
        return {
            name: fromMatch ? fromMatch[1] : 'Unknown User',
            email: fromMatch ? fromMatch[2] : 'No Email',
            subject: subjectMatch ? subjectMatch[1] : 'No Subject',
            body: bodyIndex !== -1 ? messageStr.substring(bodyIndex + 2) : messageStr
        };
    };

    const ticket = parseSupportTicket(notification.message);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: ticket.email,
                    subject: `Re: ${ticket.subject}`,
                    replyMessage: replyText
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to send reply');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReplyText('');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Support Ticket
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grow">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">From</p>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {ticket.name}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {ticket.email}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Subject</p>
                                <p className="text-gray-900 font-medium">{ticket.subject}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Message</p>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-800 whitespace-pre-wrap text-sm">
                                {ticket.body}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Reply className="w-5 h-5 text-gray-400" />
                            Reply to User
                        </h3>

                        {success ? (
                            <div className="bg-green-500/10 text-green-600 p-4 rounded-xl text-center font-medium">
                                Reply sent successfully!
                            </div>
                        ) : (
                            <form onSubmit={handleReply} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write your reply here. This will be sent as a notification to the user's dashboard (and email if configured)..."
                                        rows="5"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                        required
                                    ></textarea>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                                        {loading ? 'Sending...' : (
                                            <>
                                                <span>Send Reply</span>
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketModal;
