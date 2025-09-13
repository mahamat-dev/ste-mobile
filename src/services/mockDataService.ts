// Mock Data Service for STE App
// Provides client billing information lookup functionality

export interface BillingInfo {
  factureNo: string;
  clientId: string;
  consommationTotal: number; // in cubic meters
  moisFacturation: string;
  amount: number; // in local currency
  dueDate: string;
  status: PaymentStatus;
  // Optional payment date for history views
  paymentDate?: string;
}

export interface Client {
  clientId: string;
  name: string;
  address: string;
  phoneNumber: string;
}

export type PaymentStatus = 'paid' | 'unpaid';

// Mock client profiles for displaying client names and details
const mockClientProfiles: Record<string, Client> = {
  'STE001234': {
    clientId: 'STE001234',
    name: 'Jean Dupont',
    address: "Quartier Centre, N'Djamena",
    phoneNumber: '+235 66 00 00 01',
  },
  'STE005678': {
    clientId: 'STE005678',
    name: 'Amina Saleh',
    address: "Avenue de l'Unité, N'Djamena",
    phoneNumber: '+235 66 00 00 02',
  },
  'STE009876': {
    clientId: 'STE009876',
    name: 'Mahamat Idriss',
    address: 'Rue du Marché, Abéché',
    phoneNumber: '+235 66 00 00 03',
  },
  'STE111222': {
    clientId: 'STE111222',
    name: 'Fatimé Ibrahim',
    address: 'Boulevard Chari, Moundou',
    phoneNumber: '+235 66 00 00 04',
  },
};

// Mock client data with billing information
const mockClients: Record<string, BillingInfo> = {
  'STE001234': {
    factureNo: 'FAC-2024-001234',
    clientId: 'STE001234',
    consommationTotal: 45.5,
    moisFacturation: 'January 2024',
    amount: 125.75,
    dueDate: '2024-02-15',
    status: 'paid',
    paymentDate: '2024-01-28',
  },
  'STE005678': {
    factureNo: 'FAC-2024-005678',
    clientId: 'STE005678',
    consommationTotal: 62.3,
    moisFacturation: 'January 2024',
    amount: 187.50,
    dueDate: '2024-02-20',
    status: 'unpaid',
  },
  'STE009876': {
    factureNo: 'FAC-2024-009876',
    clientId: 'STE009876',
    consommationTotal: 38.2,
    moisFacturation: 'January 2024',
    amount: 98.40,
    dueDate: '2024-02-10',
    status: 'paid',
    paymentDate: '2024-01-25',
  },
  'STE111222': {
    factureNo: 'FAC-2024-111222',
    clientId: 'STE111222',
    consommationTotal: 75.8,
    moisFacturation: 'January 2024',
    amount: 245.30,
    dueDate: '2024-02-25',
    status: 'unpaid',
  }
};

// Historical billing data for all clients (paid months only)
const mockHistoricalBilling: Record<string, BillingInfo[]> = {
  'STE001234': [
    {
      factureNo: 'FAC-2023-001234-12',
      clientId: 'STE001234',
      consommationTotal: 42.3,
      moisFacturation: 'Décembre 2023',
      amount: 118.50,
      dueDate: '2024-01-15',
      status: 'paid',
      paymentDate: '2024-01-12'
    },
    {
      factureNo: 'FAC-2023-001234-11',
      clientId: 'STE001234',
      consommationTotal: 38.7,
      moisFacturation: 'Novembre 2023',
      amount: 105.25,
      dueDate: '2023-12-15',
      status: 'paid',
      paymentDate: '2023-12-10'
    }
  ],
  'STE005678': [
    {
      factureNo: 'FAC-2023-005678-12',
      clientId: 'STE005678',
      consommationTotal: 58.9,
      moisFacturation: 'Décembre 2023',
      amount: 172.40,
      dueDate: '2024-01-20',
      status: 'paid',
      paymentDate: '2024-01-18'
    }
  ],
  'STE009876': [
    {
      factureNo: 'FAC-2023-009876-12',
      clientId: 'STE009876',
      consommationTotal: 35.8,
      moisFacturation: 'Décembre 2023',
      amount: 89.75,
      dueDate: '2024-01-10',
      status: 'paid',
      paymentDate: '2024-01-05'
    },
    {
      factureNo: 'FAC-2023-009876-11',
      clientId: 'STE009876',
      consommationTotal: 41.5,
      moisFacturation: 'Novembre 2023',
      amount: 112.60,
      dueDate: '2023-12-10',
      status: 'paid',
      paymentDate: '2023-12-08'
    }
  ],
  'STE111222': [
    {
      factureNo: 'FAC-2023-111222-12',
      clientId: 'STE111222',
      consommationTotal: 72.4,
      moisFacturation: 'Décembre 2023',
      amount: 235.80,
      dueDate: '2024-01-25',
      status: 'paid',
      paymentDate: '2024-01-20'
    }
  ]
};

// Service function to get client billing information
export const getClientBillingInfo = async (clientId: string): Promise<BillingInfo | null> => {
  // Simulate API delay for realistic user experience
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return client data if found, null otherwise
  return mockClients[clientId.toUpperCase()] || null;
};

// Service function to get all paid months for a client
export const getPaidMonthsForClient = async (clientId: string): Promise<BillingInfo[]> => {
  // Simulate API delay for realistic user experience
  await new Promise(resolve => setTimeout(resolve, 800));

  const clientIdUpper = clientId.toUpperCase();
  const historicalData = mockHistoricalBilling[clientIdUpper] || [];
  const currentBilling = mockClients[clientIdUpper];

  const allPaidMonths: BillingInfo[] = [];

  if (currentBilling && currentBilling.status === 'paid') {
    allPaidMonths.push(currentBilling);
  }

  allPaidMonths.push(...historicalData);

  return allPaidMonths.sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.dueDate);
    const dateB = new Date(b.paymentDate || b.dueDate);
    return dateB.getTime() - dateA.getTime();
  });
};

// New: Service function to get client profile information (e.g., name)
export const getClientProfile = async (clientId: string): Promise<Client | null> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockClientProfiles[clientId.toUpperCase()] || null;
};

// Helper function to get payment status color
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  return status === 'paid' ? '#10B981' : '#EF4444';
};

// Helper function to get payment status display text
export const getPaymentStatusText = (status: PaymentStatus): string => {
  return status === 'paid' ? 'Payé' : 'Impayé';
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} FCFA`;
};

// Helper function to format consumption
export const formatConsumption = (consumption: number): string => {
  return `${consumption} m³`;
};