export const setupFetchInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
        let response = await originalFetch(input, init);
        
        // If unauthorized, try to refresh token
        if (response.status === 401) {
            const refreshToken = localStorage.getItem('sarc_refreshToken');
            if (refreshToken) {
                try {
                    const baseURL = import.meta.env.VITE_API_URL || '';
                    const refreshRes = await originalFetch(`${baseURL}/api/auth/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });
                    
                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        localStorage.setItem('sarc_token', data.token);
                        if (data.refreshToken) localStorage.setItem('sarc_refreshToken', data.refreshToken);
                        
                        // Retry original request with new token
                        let newInit = { ...init };
                        
                        if (input instanceof Request) {
                            // If input is a Request object, clone the headers and set Authorization
                            const newHeaders = new Headers(input.headers);
                            newHeaders.set('Authorization', `Bearer ${data.token}`);
                            newInit.headers = newHeaders;
                            
                            // Re-create Request with updated headers
                            const newRequest = new Request(input, newInit);
                            response = await originalFetch(newRequest);
                        } else {
                            // If input is a string URL or similar
                            if (!newInit.headers) {
                                newInit.headers = {};
                            }
                            
                            if (newInit.headers instanceof Headers) {
                                newInit.headers = new Headers(newInit.headers);
                                newInit.headers.set('Authorization', `Bearer ${data.token}`);
                            } else if (Array.isArray(newInit.headers)) {
                                // If it's an array of headers
                                const headersMap = new Map(newInit.headers.map(([k, v]) => [k.toLowerCase(), v]));
                                headersMap.set('authorization', `Bearer ${data.token}`);
                                newInit.headers = Array.from(headersMap.entries());
                            } else {
                                // Plain object
                                newInit.headers = { ...newInit.headers };
                                // Remove any existing case-insensitive authorization header to avoid duplicates
                                for (const key of Object.keys(newInit.headers)) {
                                    if (key.toLowerCase() === 'authorization') {
                                        delete newInit.headers[key];
                                    }
                                }
                                newInit.headers['Authorization'] = `Bearer ${data.token}`;
                            }
                            response = await originalFetch(input, newInit);
                        }
                    } else {
                        // Refresh failed, clear tokens and redirect to login
                        localStorage.removeItem('sarc_token');
                        localStorage.removeItem('sarc_refreshToken');
                        localStorage.removeItem('sarc_role');
                        window.location.href = '/login';
                    }
                } catch (e) {
                    console.error("Token refresh failed", e);
                }
            }
        }
        return response;
    };
};
