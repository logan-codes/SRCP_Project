import React, { useState } from 'react';
import ContactAdminModal from '../common/ContactAdminModal';

const Footer = () => {
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    return (
        <footer className="bg-primary text-white border-t border-primary-dark mt-20">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-bold font-heading text-secondary">SARCG Portal</span>
                        <p className="mt-4 text-sm text-white/80">
                            Sathyabama Institute of Science and Technology. Empowering faculty and students through AI-driven research collaboration.
                        </p>
                        <p className="mt-2 text-sm text-secondary italic">
                            Established 1987
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-secondary tracking-wider uppercase">Platform</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">Browse Projects</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">For Students</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">For Faculty</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">Admin Portal</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-secondary tracking-wider uppercase">Contact</h3>
                        <ul className="mt-4 space-y-4">
                            <li className="text-base text-white/80">Sathyabama University</li>
                            <li className="text-base text-white/80">Jeppiaar Nagar, Rajiv Gandhi Salai</li>
                            <li className="text-base text-white/80">Chennai, Tamil Nadu 600119</li>
                            <li><a href="#" className="text-base text-secondary hover:text-white transition-colors">research@sathyabama.ac.in</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-secondary tracking-wider uppercase">Help</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <button 
                                    onClick={() => setIsContactModalOpen(true)}
                                    className="text-base text-white/80 hover:text-secondary transition-colors cursor-pointer bg-transparent border-none p-0"
                                >
                                    Contact Admin
                                </button>
                            </li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">Support Portal</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">FAQs</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-primary-dark pt-8 flex items-center justify-center lg:justify-start">
                    <p className="text-base text-white/60">
                        &copy; {new Date().getFullYear()} Sathyabama Institute of Science and Technology. All rights reserved.
                    </p>
                </div>
            </div>
            
            <ContactAdminModal 
                isOpen={isContactModalOpen} 
                onClose={() => setIsContactModalOpen(false)} 
            />
        </footer>
    );
};

export default Footer;
