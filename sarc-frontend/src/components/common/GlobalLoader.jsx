import React from 'react';

const GlobalLoader = () => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-canvas">
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute w-16 h-16 rounded-full border-4 border-primary/20 animate-ping"></div>
                {/* Inner spinning ring */}
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-primary font-heading font-bold animate-pulse">Loading...</p>
        </div>
    );
};

export default GlobalLoader;
