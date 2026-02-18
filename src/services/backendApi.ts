import type { Chef, Order, DailyMeal } from '@/types';

const API_URL = 'http://localhost:3000/api';

// Helper for authorized requests
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const backendApi = {
    // Auth - mostly handled by existing auth flow, but adding for completeness if needed

    // Chef Discovery
    getAvailableChefs: async (pincode: string): Promise<Chef[]> => {
        const response = await fetch(`${API_URL}/chefs?pincode=${pincode}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch chefs');

        const data = await response.json();

        // Map backend data to Frontend Chef type
        return data.map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            email: '', // Not exposed in public list
            role: 'chef',
            specialty: c.specialty || 'General',
            rating: parseFloat(c.rating),
            status: 'approved',
            serviceArea: 'Local',
            createdAt: new Date().toISOString()
        })) as Chef[];
    },

    // Chef Menu
    getChefMenu: async (chefId: string, weekStart: string) => {
        const response = await fetch(`${API_URL}/chefs/${chefId}/menu?weekStart=${weekStart}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch menu');
        return response.json();
    },

    // Submit Order
    createOrder: async (orderData: any) => {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Order failed');
        return data;
    },

    // Get Customer Orders
    getCustomerOrders: async (customerId: string) => {
        // Assuming backend supports filtering by customerId via query or infers from token
        const response = await fetch(`${API_URL}/orders?customerId=${customerId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        return response.json();
    },

    // Chef: Upload Menu Card
    uploadMenuCard: async (chefId: string, file: File, weekStart: string) => {
        const formData = new FormData();
        formData.append('menuCard', file);
        formData.append('weekStart', weekStart);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/chefs/${chefId}/menu-upload`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
                // Content-Type is set automatically for FormData
            },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        return data;
    }
};
