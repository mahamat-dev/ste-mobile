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
    const resp = await apiRequest(`/connection-request?all=true`, {
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

  getByCustomerId: async (customerId: number | string) => {
    const idNum = typeof customerId === 'string' ? Number(customerId) : customerId;
    try {
      const resp = await apiRequest(`/meter-readings/customer/${idNum}`, { method: 'GET' });
      if (!resp?.success || !resp?.data) {
        // Fallback to connection-request listing when the endpoint is unavailable or returns no data
        const list = await apiRequest(`/connection-request?all=true`, { method: 'GET' });
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

      // Derive lastReading from the meter's meterReading list (latest by readingDate)
      let lastReading: { readingValue?: number } | null = null;
      if (meter && Array.isArray(meter.meterReading) && meter.meterReading.length > 0) {
        const latest = [...meter.meterReading].sort(
          (a: any, b: any) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
        )[0];
        // Map backend currentIndex to expected readingValue
        const readingValueNum = typeof latest.currentIndex === 'number'
          ? latest.currentIndex
          : Number(latest.currentIndex);
        lastReading = { readingValue: readingValueNum };
      }

      // If no meter is linked to the customer, attempt fallback list lookup
      if (!meter) {
        try {
          const list = await apiRequest(`/connection-request?all=true`, { method: 'GET' });
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
        const list = await apiRequest(`/connection-request?all=true`, { method: 'GET' });
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

  getReadings: async (meterId: number) => {
    return await apiRequest(`/meters/${meterId}/readings`, {
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

    // Reading date (ISO 8601). Use date-only to match examples.
    const today = new Date();
    const readingDate = today.toISOString().slice(0, 10);
    form.append('readingDate', readingDate);

    // Compute indices and consumption per backend validation
    const prev = typeof data.previousIndex === 'number' ? data.previousIndex : undefined;
    let curr: number | undefined = typeof data.currentIndex === 'number' ? data.currentIndex : undefined;
    let consumption: number = 0;

    if (data.isInaccessible) {
      // No access: set currentIndex to previous and consumption to 0
      curr = prev !== undefined ? prev : 0;
      consumption = 0;
      form.append('accessReason', 'Door_Closed');
    } else {
      curr = curr !== undefined ? curr : 0;
      consumption = prev !== undefined ? Number(curr) - Number(prev) : Number(curr);
      form.append('accessReason', 'Accessed');
    }

    form.append('currentIndex', String(curr));
    if (prev !== undefined) {
      form.append('previousIndex', String(prev));
    }
    form.append('consumption', String(consumption));

    // Optional geolocation and notes
    if (data.longitude) form.append('longitude', data.longitude);
    if (data.latitude) form.append('latitude', data.latitude);
    if (data.notes) form.append('comments', data.notes);

    // Single evidence photo per backend multer config
    if (data.imageUri) {
      const name = `evidence-${Date.now()}.jpg`;
      form.append('evidencePhotoUrl', {
        uri: data.imageUri,
        name,
        type: 'image/jpeg'
      } as any);
    }

    return await apiUpload(`/meter-readings/new`, form);
  },
};

export default apiRequest;
