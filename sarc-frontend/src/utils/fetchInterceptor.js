export const setupFetchInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        let response = await originalFetch(...args);
        
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
                        const [url, options] = args;
                        const newOptions = { ...options };
                        if (newOptions.headers) {
                            // Clone headers and replace Authorization
                            if (newOptions.headers instanceof Headers) {
                                newOptions.headers = new Headers(newOptions.headers);
                                newOptions.headers.set('Authorization', `Bearer ${data.token}`);
                            } else {
                                newOptions.headers = { ...newOptions.headers };
                                if (newOptions.headers['Authorization']) {
                                    newOptions.headers['Authorization'] = `Bearer ${data.token}`;
                                }
                            }
                        }
                        // Fire the request again
                        response = await originalFetch(url, newOptions);
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
