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

export interface MeterInfo {
  clientId: string;
  clientName: string;
  meterNumber: string;
  zoneCode: string;
  longitude: string;
  latitude: string;
  currentIndex: number;
  lastReadingDate: string;
}

export type PaymentStatus = 'paid' | 'unpaid';

// Mock client profiles for displaying client names and details
const mockClientProfiles: Record<string, Client> = {
  "CUST-001": {
    clientId: "CUST-001",
    name: "Jean Dupont",
    address: "Quartier Centre, N'Djamena",
    phoneNumber: "+235 66 00 00 01",
  },
  "CUST-002": {
    clientId: "CUST-002",
    name: "Amina Saleh",
    address: "Avenue de l'Unité, N'Djamena",
    phoneNumber: "+235 66 00 00 02",
  },
  "CUST-003": {
    clientId: "CUST-003",
    name: "Mahamat Idriss",
    address: "Rue du Marché, Abéché",
    phoneNumber: "+235 66 00 00 03",
  },
  "CUST-004": {
    clientId: "CUST-004",
    name: "Fatimé Ibrahim",
    address: "Boulevard Chari, Moundou",
    phoneNumber: "+235 66 00 00 04",
  },
};

// Mock meter information for clients
const mockMeterInfo: Record<string, MeterInfo> = {
  "CL-1001": {
    clientId: "CL-1001",
    clientName: "MAHAMAT HASSAN",
    meterNumber: "MTR-001",
    zoneCode: "AR-01",
    longitude: "15.0224491936516",
    latitude: "12.1497712614681",
    currentIndex: 1200,
    lastReadingDate: "2024-01-15",
  },
  "CUST-001": {
    clientId: "CUST-001",
    clientName: "Jean Dupont",
    meterNumber: "MTR-002",
    zoneCode: "AR-02",
    longitude: "15.0334491936516",
    latitude: "12.1597712614681",
    currentIndex: 1150,
    lastReadingDate: "2024-01-20",
  },
  "CUST-002": {
    clientId: "CUST-002",
    clientName: "Amina Saleh",
    meterNumber: "MTR-003",
    zoneCode: "AR-03",
    longitude: "15.0444491936516",
    latitude: "12.1697712614681",
    currentIndex: 980,
    lastReadingDate: "2024-01-18",
  },
  "CUST-003": {
    clientId: "CUST-003",
    clientName: "Mahamat Idriss",
    meterNumber: "MTR-004",
    zoneCode: "AR-04",
    longitude: "15.0554491936516",
    latitude: "12.1797712614681",
    currentIndex: 1350,
    lastReadingDate: "2024-01-22",
  },
  "CUST-004": {
    clientId: "CUST-004",
    clientName: "Fatimé Ibrahim",
    meterNumber: "MTR-005",
    zoneCode: "AR-05",
    longitude: "15.0664491936516",
    latitude: "12.1897712614681",
    currentIndex: 875,
    lastReadingDate: "2024-01-25",
  },
};

// Mock client data with billing information
const mockClients: Record<string, BillingInfo> = {
  "CUST-001": {
    factureNo: "FAC-2024-001234",
    clientId: "CUST-001",
    consommationTotal: 45.5,
    moisFacturation: "January 2024",
    amount: 125.75,
    dueDate: "2024-02-15",
    status: "paid",
    paymentDate: "2024-01-28",
  },
  "CUST-002": {
    factureNo: "FAC-2024-005678",
    clientId: "CUST-002",
    consommationTotal: 62.3,
    moisFacturation: "January 2024",
    amount: 187.5,
    dueDate: "2024-02-20",
    status: "unpaid",
  },
  "CUST-003": {
    factureNo: "FAC-2024-009876",
    clientId: "CUST-003",
    consommationTotal: 38.2,
    moisFacturation: "January 2024",
    amount: 98.4,
    dueDate: "2024-02-10",
    status: "paid",
    paymentDate: "2024-01-25",
  },
  "CUST-004": {
    factureNo: "FAC-2024-111222",
    clientId: "CUST-004",
    consommationTotal: 75.8,
    moisFacturation: "January 2024",
    amount: 245.3,
    dueDate: "2024-02-25",
    status: "unpaid",
  },
};

// Mock unpaid billing data for unpaid months view
const mockUnpaidBilling: Record<string, BillingInfo[]> = {
  "CUST-001": [
    {
      factureNo: "FAC-2024-001234-02",
      clientId: "CUST-001",
      consommationTotal: 48.2,
      moisFacturation: "Février 2024",
      amount: 135.6,
      dueDate: "2024-03-15",
      status: "unpaid",
    },
  ],
  "CUST-002": [
    {
      factureNo: "FAC-2024-005678-02",
      clientId: "CUST-002",
      consommationTotal: 65.7,
      moisFacturation: "Février 2024",
      amount: 198.3,
      dueDate: "2024-03-20",
      status: "unpaid",
    },
    {
      factureNo: "FAC-2024-005678-01",
      clientId: "CUST-002",
      consommationTotal: 62.3,
      moisFacturation: "Janvier 2024",
      amount: 187.5,
      dueDate: "2024-02-20",
      status: "unpaid",
    },
  ],
  "CUST-003": [],
  "CUST-004": [
    {
      factureNo: "FAC-2024-111222-03",
      clientId: "CUST-004",
      consommationTotal: 78.9,
      moisFacturation: "Mars 2024",
      amount: 256.7,
      dueDate: "2024-04-25",
      status: "unpaid",
    },
    {
      factureNo: "FAC-2024-111222-02",
      clientId: "CUST-004",
      consommationTotal: 73.1,
      moisFacturation: "Février 2024",
      amount: 238.9,
      dueDate: "2024-03-25",
      status: "unpaid",
    },
    {
      factureNo: "FAC-2024-111222-01",
      clientId: "CUST-004",
      consommationTotal: 75.8,
      moisFacturation: "Janvier 2024",
      amount: 245.3,
      dueDate: "2024-02-25",
      status: "unpaid",
    },
  ],
};

// Historical billing data for all clients (paid months only)
const mockHistoricalBilling: Record<string, BillingInfo[]> = {
  "CUST-001": [
    {
      factureNo: "FAC-2023-001234-12",
      clientId: "CUST-001",
      consommationTotal: 42.3,
      moisFacturation: "Décembre 2023",
      amount: 118.5,
      dueDate: "2024-01-15",
      status: "paid",
      paymentDate: "2024-01-12",
    },
    {
      factureNo: "FAC-2023-001234-11",
      clientId: "CUST-001",
      consommationTotal: 38.7,
      moisFacturation: "Novembre 2023",
      amount: 105.25,
      dueDate: "2023-12-15",
      status: "paid",
      paymentDate: "2023-12-10",
    },
  ],
  "CUST-002": [
    {
      factureNo: "FAC-2023-005678-12",
      clientId: "CUST-002",
      consommationTotal: 58.9,
      moisFacturation: "Décembre 2023",
      amount: 172.4,
      dueDate: "2024-01-20",
      status: "paid",
      paymentDate: "2024-01-18",
    },
  ],
  "CUST-003": [
    {
      factureNo: "FAC-2023-009876-12",
      clientId: "CUST-003",
      consommationTotal: 35.8,
      moisFacturation: "Décembre 2023",
      amount: 89.75,
      dueDate: "2024-01-10",
      status: "paid",
      paymentDate: "2024-01-05",
    },
    {
      factureNo: "FAC-2023-009876-11",
      clientId: "CUST-003",
      consommationTotal: 41.5,
      moisFacturation: "Novembre 2023",
      amount: 112.6,
      dueDate: "2023-12-10",
      status: "paid",
      paymentDate: "2023-12-08",
    },
  ],
  "CUST-004": [
    {
      factureNo: "FAC-2023-111222-12",
      clientId: "CUST-004",
      consommationTotal: 72.4,
      moisFacturation: "Décembre 2023",
      amount: 235.8,
      dueDate: "2024-01-25",
      status: "paid",
      paymentDate: "2024-01-20",
    },
  ],
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

export const getUnpaidMonthsForClient = async (clientId: string): Promise<BillingInfo[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const unpaidData = mockUnpaidBilling[clientId] || [];
  
  // Sort by due date ascending (oldest first - most urgent)
  const unpaidBills = unpaidData
    .filter(bill => bill.status === 'unpaid')
    .sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  
  return unpaidBills;
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
  return `${consumption.toFixed(1)} m³`;
};

// Get meter information for a client
export const getClientMeterInfo = async (clientId: string): Promise<MeterInfo | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMeterInfo[clientId] || null;
};