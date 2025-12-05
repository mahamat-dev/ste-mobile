import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
};

// Get stored token
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Store auth data
export const storeAuthData = async (token: string, refreshToken: string, user: any) => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, token],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
      [STORAGE_KEYS.USER, JSON.stringify(user)],
    ]);
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw error;
  }
};

// Clear auth data
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

// Get stored user
export const getStoredUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
};

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// API upload helper (multipart/form-data)
const apiUpload = async (
  endpoint: string,
  formData: FormData
): Promise<any> => {
  const token = await getToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Auth API endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      const { token, refreshToken, user } = response.data;
      await storeAuthData(token, refreshToken, user);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await clearAuthData();
    }
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me', { method: 'GET' });
  },

  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) throw new Error('No refresh token');

      const response = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success && response.data) {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.TOKEN, response.data.token],
          [STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken],
        ]);
        return response.data;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      await clearAuthData();
      throw error;
    }
  },
};

// Meter API endpoints
export const meterApi = {
  getByMeterNumber: async (meterNumber: string) => {
    // Backend does not expose /meters; reuse connection-request with relations
    // Use pagination instead of all=true to get relations included
    const resp = await apiRequest(`/connection-request?page=1&limit=100`, {
      method: "GET",
    });
    if (!resp?.success || !resp?.data?.data) {
      throw new Error(resp?.message || "API request failed");
    }
    const rows = resp.data.data as any[];
    const match = rows.find((r) => r?.meter?.meterNumber === meterNumber);
    if (!match) {
      return { success: false, message: "Meter not found" };
    }
    // Shape a compatible response for the screen
    return {
      success: true,
      data: {
        meter: match.meter,
        customer: match.customer,
        lastReading: null,
      },
    };
  },

  getByCustomerCode: async (customerCode: string) => {
    try {
      // First, find the customer in connection-request to get customerId
      const listResp = await apiRequest(`/connection-request?page=1&limit=100`, { method: "GET" });
      if (!listResp?.success || !listResp?.data?.data) {
        return { success: false, message: "Customer not found" };
      }
      const rows = listResp.data.data as any[];
      const match = rows.find((r) => r?.customer?.customerCode === customerCode);
      if (!match || !match.customer) {
        return { success: false, message: "Customer not found" };
      }

      const customerId = match.customer.customerId;
      const customer = match.customer;

      // Use meter-readings endpoint filtered by customerId to get meter data
      // This returns meter readings with meter and customer info
      try {
        const resp = await apiRequest(`/meter-readings?customerId=${customerId}&page=1&limit=50`, { method: "GET" });

        if (resp?.success && resp?.data?.data && resp.data.data.length > 0) {
          // Get the first reading which contains meter info
          const firstReading = resp.data.data[0];
          const meter = firstReading.meter;

          // Find the latest APPROVED reading by date - only use validated index
          const allReadings = resp.data.data;
          const approvedReadings = allReadings.filter(
            (reading: any) => String(reading?.status || '').toLowerCase() === 'approved'
          );
          
          const latestApprovedReading = approvedReadings.length > 0
            ? [...approvedReadings].sort(
                (a: any, b: any) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
              )[0]
            : null;

          const lastReading = latestApprovedReading
            ? { readingValue: Number(latestApprovedReading.currentIndex) || 0 }
            : null;

          return {
            success: true,
            data: {
              meter,
              customer: meter?.customer || customer,
              lastReading,
            },
          };
        }
      } catch (meterErr: any) {
        // If meter-readings endpoint fails, fall back to connection-request data
        console.warn("meter-readings endpoint failed, using connection-request data", meterErr?.message);
      }

      // Fallback: return connection-request data (meter might be null)
      return {
        success: true,
        data: {
          meter: match.meter,
          customer: customer,
          lastReading: null,
        },
      };
    } catch (err: any) {
      return { success: false, message: err?.message || "Customer not found" };
    }
  },

  getByCustomerId: async (customerId: number | string) => {
    const idNum = typeof customerId === 'string' ? Number(customerId) : customerId;
    try {
      const resp = await apiRequest(`/meter-readings/customer/${idNum}`, { method: 'GET' });
      if (!resp?.success || !resp?.data) {
        // Fallback to connection-request listing (use pagination to get relations)
        const list = await apiRequest(`/connection-request?page=1&limit=100`, { method: 'GET' });
        const rows = list?.data?.data || [];
        const match = rows.find((r: any) => Number(r?.customer?.customerId) === Number(idNum));
        if (!match) {
          return { success: false, message: resp?.message || 'Customer not found' };
        }
        return {
          success: true,
          data: {
            meter: match.meter || null,
            customer: match.customer,
            lastReading: null,
          },
        };
      }
      // Adapt backend shape: resp.data is the Customer payload with an array of meters
      const customerPayload = resp.data as any;
      const meters = Array.isArray(customerPayload?.meters) ? customerPayload.meters : [];
      const meter = meters.length > 0 ? meters[0] : null;

      // Derive lastReading from the meter's meterReading list (latest APPROVED reading by readingDate)
      let lastReading: { readingValue?: number } | null = null;
      if (meter && Array.isArray(meter.meterReading) && meter.meterReading.length > 0) {
        // Filter only approved readings
        const approvedReadings = meter.meterReading.filter(
          (reading: any) => String(reading?.status || '').toLowerCase() === 'approved'
        );
        
        if (approvedReadings.length > 0) {
          const latest = [...approvedReadings].sort(
            (a: any, b: any) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
          )[0];
          // Map backend currentIndex to expected readingValue
          const readingValueNum =
            typeof latest.currentIndex === 'number' ? latest.currentIndex : Number(latest.currentIndex);
          lastReading = { readingValue: readingValueNum };
        }
      }

      // If no meter is linked to the customer, attempt fallback list lookup
      if (!meter) {
        try {
          const list = await apiRequest(`/connection-request?page=1&limit=100`, { method: 'GET' });
          const rows = list?.data?.data || [];
          const match = rows.find((r: any) => Number(r?.customer?.customerId) === Number(idNum));
          if (!match) {
            return { success: false, message: 'Meter not found for customer' };
          }
          return {
            success: true,
            data: {
              meter: match.meter || null,
              customer: match.customer,
              lastReading: null,
            },
          };
        } catch (fallbackErr: any) {
          return { success: false, message: fallbackErr?.message || 'Meter not found for customer' };
        }
      }

      return {
        success: true,
        data: {
          meter,
          customer: customerPayload,
          lastReading,
        },
      };
    } catch (err: any) {
      // Network or auth error: attempt fallback list
      try {
        const list = await apiRequest(`/connection-request?page=1&limit=100`, { method: 'GET' });
        const rows = list?.data?.data || [];
        const match = rows.find((r: any) => Number(r?.customer?.customerId) === Number(idNum));
        if (!match) {
          return { success: false, message: err?.message || 'API request failed' };
        }
        return {
          success: true,
          data: {
            meter: match.meter || null,
            customer: match.customer,
            lastReading: null,
          },
        };
      } catch (fallbackErr: any) {
        return { success: false, message: fallbackErr?.message || err?.message || 'API request failed' };
      }
    }
  },

  getMeterById: async (meterId: number) => {
    return await apiRequest(`/meters/${meterId}`, {
      method: 'GET',
    });
  },

  getReadings: async (meterId: number, page: number = 1, limit: number = 50, startDate?: string) => {
    // Use the meter-readings endpoint with meterId filter and pagination
    let url = `/meter-readings?meterId=${meterId}&page=${page}&limit=${limit}`;
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    return await apiRequest(url, {
      method: 'GET',
    });
  },

  submitReading: async (data: {
    meterId: number;
    currentIndex?: number;
    previousIndex?: number;
    isInaccessible: boolean;
    imageUri?: string;
    notes?: string;
    longitude?: string;
    latitude?: string;
  }) => {
    const form = new FormData();

    // Required fields for backend validation
    form.append('meterId', String(data.meterId));

    // Reading date (ISO 8601)
    const today = new Date();
    const readingDate = today.toISOString().slice(0, 10);
    form.append('readingDate', readingDate);

    // Compute indices and consumption
    const prev = typeof data.previousIndex === 'number' ? data.previousIndex : 0;
    let curr: number;
    let consumption: number;

    if (data.isInaccessible) {
      // No access: set currentIndex to previous and consumption to 0
      curr = prev;
      consumption = 0;
      form.append('accessReason', 'Door_Closed');
    } else {
      curr = typeof data.currentIndex === 'number' ? data.currentIndex : 0;
      consumption = Math.max(0, curr - prev);
      form.append('accessReason', 'Accessed');
    }

    // Backend requires these as decimal strings
    form.append('currentIndex', String(curr));
    form.append('previousIndex', String(prev));
    form.append('consumption', String(consumption));

    // Optional geolocation and notes
    if (data.longitude) form.append('longitude', data.longitude);
    if (data.latitude) form.append('latitude', data.latitude);
    if (data.notes) form.append('comments', data.notes);

    // Evidence photo - React Native requires specific format
    if (data.imageUri) {
      const filename = `evidence-${Date.now()}.jpg`;
      const fileExtension = data.imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

      // React Native FormData expects this specific format
      form.append('evidencePhotoUrl', {
        uri: data.imageUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    return await apiUpload(`/meter-readings/new`, form);
  },
};

// Complaints API endpoints
export const complaintsApi = {
  // Create a new complaint
  create: async (data: {
    customerId: string;
    subject: string;
    category: 'General' | 'Technical' | 'Billing' | 'Maintenance';
    description?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    phone?: string;
  }) => {
    return await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get complaints list (for viewing history)
  getAll: async (page: number = 1, limit: number = 50) => {
    return await apiRequest(`/complaints?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  },

  // Get a single complaint by ID
  getById: async (id: number) => {
    return await apiRequest(`/complaints/${id}`, {
      method: 'GET',
    });
  },

  // Sync local complaints to server (call after agent login)
  syncLocalComplaints: async () => {
    try {
      const token = await getToken();
      if (!token) return { synced: 0, failed: 0 };

      const localData = await AsyncStorage.getItem('local_complaints');
      if (!localData) return { synced: 0, failed: 0 };

      const complaints = JSON.parse(localData);
      if (!Array.isArray(complaints) || complaints.length === 0) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;
      const remaining: any[] = [];

      for (const complaint of complaints) {
        try {
          await apiRequest('/complaints', {
            method: 'POST',
            body: JSON.stringify({
              customerId: complaint.customerId,
              subject: complaint.subject,
              category: complaint.category,
              description: complaint.description,
              priority: complaint.priority,
              phone: complaint.phone,
            }),
          });
          synced++;
        } catch (err) {
          console.error('Failed to sync complaint:', err);
          remaining.push(complaint);
          failed++;
        }
      }

      // Update local storage with remaining (failed) complaints
      if (remaining.length > 0) {
        await AsyncStorage.setItem('local_complaints', JSON.stringify(remaining));
      } else {
        await AsyncStorage.removeItem('local_complaints');
      }

      return { synced, failed };
    } catch (error) {
      console.error('Error syncing local complaints:', error);
      return { synced: 0, failed: 0 };
    }
  },

  // Get count of pending local complaints
  getPendingCount: async () => {
    try {
      const localData = await AsyncStorage.getItem('local_complaints');
      if (!localData) return 0;
      const complaints = JSON.parse(localData);
      return Array.isArray(complaints) ? complaints.length : 0;
    } catch {
      return 0;
    }
  },
};

// Billing API endpoints
export const billingApi = {
  // Get bills by customer code (unpaid bills)
  getByCustomerCode: async (customerCode: string) => {
    return await apiRequest(`/bills/getBillsByCustomerId/${customerCode}?all=true`, {
      method: 'GET',
    });
  },

  // Get customer stats (consumption, bills count, paid count)
  getCustomerStats: async (customerCode: string) => {
    try {
      // Get all bills for this customer
      const billsResp = await apiRequest(`/bills/getBillsByCustomerId/${customerCode}?all=true`, {
        method: 'GET',
      });

      const bills = billsResp?.data?.data || billsResp?.data || [];
      const billsArray = Array.isArray(bills) ? bills : [];

      // Calculate stats
      const totalBills = billsArray.length;
      const paidBills = billsArray.filter((b: any) => b.status === 'PAID').length;
      
      // Get current month consumption from latest bill
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthBill = billsArray.find((b: any) => {
        const billDate = new Date(b.createdAt || b.billingPeriod);
        return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
      });

      const monthlyConsumption = currentMonthBill?.consumption || 0;

      return {
        success: true,
        data: {
          monthlyConsumption,
          totalBills,
          paidBills,
          unpaidBills: totalBills - paidBills,
        },
      };
    } catch (error: any) {
      console.warn('Error fetching customer stats:', error?.message);
      return {
        success: false,
        data: {
          monthlyConsumption: 0,
          totalBills: 0,
          paidBills: 0,
          unpaidBills: 0,
        },
      };
    }
  },
};

// Customer API endpoints
export const customerApi = {
  searchByCode: async (code: string, phone?: string) => {
    // Use the connection-request endpoint with pagination to get relations
    let endpoint = `/connection-request?page=1&limit=100`;
    if (phone) {
      // If phone is provided, use search param
      endpoint += `&search=${encodeURIComponent(phone)}`;
    }

    const response = await apiRequest(endpoint, {
      method: 'GET',
    });

    if (response.success && response.data && Array.isArray(response.data.data)) {
      // Filter client-side for the exact customer code match
      const match = response.data.data.find(
        (r: any) =>
          r?.customer?.customerCode === code && (!phone || r?.customer?.phone === phone)
      );

      // If we found a match, fetch additional data and return enriched customer
      if (match) {
        const customer = match.customer;
        const customerId = customer.customerId;
        
        // Try to fetch billing stats
        let stats = {
          monthlyConsumption: 0,
          totalBills: 0,
          paidBills: 0,
          unpaidBills: 0,
        };

        try {
          const billsResp = await apiRequest(`/bills/getBillsByCustomerId/${code}?all=true`, {
            method: 'GET',
          });
          const bills = billsResp?.data?.data || billsResp?.data || [];
          const billsArray = Array.isArray(bills) ? bills : [];
          
          const totalBills = billsArray.length;
          const paidBills = billsArray.filter((b: any) => b.status === 'PAID').length;
          
          // Get current month consumption
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const currentMonthBill = billsArray.find((b: any) => {
            const billDate = new Date(b.createdAt || b.billingPeriod);
            return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
          });

          stats = {
            monthlyConsumption: currentMonthBill?.consumption || 0,
            totalBills,
            paidBills,
            unpaidBills: totalBills - paidBills,
          };
        } catch (billErr) {
          console.warn('Could not fetch billing stats:', billErr);
        }

        // Build address string from address object if available
        let addressString = '';
        if (match.customer?.address) {
          const addr = match.customer.address;
          addressString = [addr.area?.name, addr.center?.name, addr.city?.name]
            .filter(Boolean)
            .join(', ');
        }

        return {
          success: true,
          data: {
            ...customer,
            clientId: customer.customerCode,
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            address: addressString || undefined,
            stats,
          },
        };
      }
    }

    throw new Error('Client non trouvé');
  },
};

export default apiRequest;
