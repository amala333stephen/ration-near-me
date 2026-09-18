// RationNearMe - Initial Seed Data & Mock Database
// Realistic data for Fair Price Shops (FPS) under the Public Distribution System (PDS)

const DEFAULT_ITEMS = [
  { id: 'rice', name: 'Rice', localName: 'Chawal / അരി', icon: '🌾', quota: '5 kg / person', price: '₹2 / kg', defaultThreshold: 50 },
  { id: 'wheat', name: 'Wheat', localName: 'Gehun / ഗോതമ്പ്', icon: '🍞', quota: '3 kg / person', price: '₹3 / kg', defaultThreshold: 40 },
  { id: 'sugar', name: 'Sugar', localName: 'Cheeni / പഞ്ചസാര', icon: '🍬', quota: '1 kg / card', price: '₹13.50 / kg', defaultThreshold: 20 },
  { id: 'dal', name: 'Dal (Toor/Chana)', localName: 'Dal / പരിപ്പ്', icon: '🥣', quota: '1 kg / card', price: '₹35 / kg', defaultThreshold: 25 },
  { id: 'kerosene', name: 'Kerosene', localName: 'Mitti Tel / മണ്ണെണ്ണ', icon: '🛢️', quota: '2 L / card', price: '₹22 / L', defaultThreshold: 30 }
];

const DEFAULT_SHOPS = [
  {
    id: 'fps-01',
    name: 'Green Valley Ration Shop',
    fpsCode: 'FPS-KL-EKM-0419',
    dealerName: 'K. R. Narayanan (Authorized Dealer)',
    phone: '+91 98470 12345',
    area: 'Kakkanad',
    fullAddress: 'Shop No. 14, Near Civil Station Junction, Kakkanad, Kochi, Kerala 682030',
    landmark: 'Opposite Government High School',
    lat: 10.0159,
    lng: 76.3419,
    distanceKm: 1.2,
    travelTime: '4 mins by bike • 14 mins walk',
    timing: '8:30 AM – 12:30 PM & 4:00 PM – 7:30 PM (Mon-Sat)',
    isOpen: true,
    queueStatus: 'Moderate (5-7 people, ~10 min wait)',
    stock: {
      rice: { qty: 420, status: 'AVAILABLE', unit: 'kg' },
      wheat: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      sugar: { qty: 35, status: 'LOW', unit: 'kg' },
      dal: { qty: 90, status: 'AVAILABLE', unit: 'kg' },
      kerosene: { qty: 45, status: 'AVAILABLE', unit: 'L' }
    },
    lastUpdatedMinutesAgo: 15,
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedBy: 'Authorized Shopkeeper',
    trustStatus: 'verified', // 'verified' (green), 'expiring' (orange), 'outdated' (gray)
    verificationBadge: 'Verified Shop',
    reportsCount: 0,
    hasDiscrepancy: false,
    history: [
      {
        id: 'hist-01-1',
        time: '08:15 AM',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        item: 'All Commodities',
        action: 'Morning Stock Intake Logged',
        details: 'Civil Supplies Dept Delivery Truck KL-07-CD-3129 unloaded 1,500 kg',
        updatedBy: 'Food Inspector S. Menon'
      },
      {
        id: 'hist-01-2',
        time: '10:00 AM',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        item: 'Wheat',
        action: 'Sold Out / Quota Exhausted',
        details: 'Wheat inventory reached 0 kg due to heavy morning rush',
        updatedBy: 'Authorized Shopkeeper'
      },
      {
        id: 'hist-01-3',
        time: '11:45 AM',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        item: 'Rice, Sugar, Dal',
        action: 'Midday Stock Count Reconciliation',
        details: 'Rice: 420 kg, Sugar: 35 kg (Low), Dal: 90 kg verified',
        updatedBy: 'Authorized Shopkeeper'
      }
    ]
  },
  {
    id: 'fps-02',
    name: 'Janaseva Ration Shop',
    fpsCode: 'FPS-KL-EKM-0821',
    dealerName: 'M. S. Radhakrishnan',
    phone: '+91 94471 67890',
    area: 'Palarivattom',
    fullAddress: 'Building 7/2, Pipeline Road, Near St. Martin Church, Palarivattom, Kochi 682025',
    landmark: 'Behind SBI Palarivattom Branch',
    lat: 10.0035,
    lng: 76.3115,
    distanceKm: 2.0,
    travelTime: '7 mins by auto • 24 mins walk',
    timing: '8:00 AM – 1:00 PM & 3:30 PM – 7:00 PM',
    isOpen: true,
    queueStatus: 'Low (1-2 people, instant token)',
    stock: {
      rice: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      wheat: { qty: 310, status: 'AVAILABLE', unit: 'kg' },
      sugar: { qty: 120, status: 'AVAILABLE', unit: 'kg' },
      dal: { qty: 18, status: 'LOW', unit: 'kg' },
      kerosene: { qty: 0, status: 'OUT_OF_STOCK', unit: 'L' }
    },
    lastUpdatedMinutesAgo: 25,
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedBy: 'Authorized Shopkeeper',
    trustStatus: 'verified',
    verificationBadge: 'Verified Shop',
    reportsCount: 0,
    hasDiscrepancy: false,
    history: [
      {
        id: 'hist-02-1',
        time: '09:00 AM',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        item: 'Rice',
        action: 'Exhausted',
        details: 'Rice stock finished at 09:00 AM. Next consignment expected in afternoon.',
        updatedBy: 'Authorized Shopkeeper'
      }
    ]
  },
  {
    id: 'fps-03',
    name: 'Priya Consumer Cooperative FPS',
    fpsCode: 'FPS-KL-EKM-0112',
    dealerName: 'Smt. Leela Varghese',
    phone: '+91 98950 45213',
    area: 'Vazhakkala',
    fullAddress: 'Door 22/410, Near Vazhakkala Temple Junction, Kakkanad Road, 682021',
    landmark: 'Adjacent to Co-operative Bank',
    lat: 10.0112,
    lng: 76.3275,
    distanceKm: 0.8,
    travelTime: '3 mins by bike • 9 mins walk',
    timing: '9:00 AM – 1:00 PM & 4:00 PM – 8:00 PM',
    isOpen: true,
    queueStatus: 'Crowded (10-12 people, ~18 min wait)',
    stock: {
      rice: { qty: 280, status: 'AVAILABLE', unit: 'kg' },
      wheat: { qty: 40, status: 'LOW', unit: 'kg' },
      sugar: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      dal: { qty: 75, status: 'AVAILABLE', unit: 'kg' },
      kerosene: { qty: 20, status: 'LOW', unit: 'L' }
    },
    lastUpdatedMinutesAgo: 45,
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedBy: 'Authorized Shopkeeper',
    trustStatus: 'verified',
    verificationBadge: 'Verified Shop',
    reportsCount: 1,
    hasDiscrepancy: false,
    history: [
      {
        id: 'hist-03-1',
        time: '10:15 AM',
        timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
        item: 'Sugar',
        action: 'Out of Stock Recorded',
        details: 'Sugar batch exhausted.',
        updatedBy: 'Authorized Shopkeeper'
      }
    ]
  },
  {
    id: 'fps-04',
    name: 'Mahatma Gandhi Fair Price Store',
    fpsCode: 'FPS-KL-EKM-0744',
    dealerName: 'P. B. Thomas',
    phone: '+91 97455 88912',
    area: 'Edappally Toll',
    fullAddress: 'Bazaar Road, Near Toll Gate, Edappally, Kochi 682024',
    landmark: 'Near Edappally Metro Station Exit 2',
    lat: 10.0245,
    lng: 76.3075,
    distanceKm: 2.8,
    travelTime: '10 mins by bus • 32 mins walk',
    timing: '8:30 AM – 12:30 PM & 3:30 PM – 7:30 PM',
    isOpen: true,
    queueStatus: 'Moderate (4-6 people)',
    stock: {
      rice: { qty: 550, status: 'AVAILABLE', unit: 'kg' },
      wheat: { qty: 410, status: 'AVAILABLE', unit: 'kg' },
      sugar: { qty: 150, status: 'AVAILABLE', unit: 'kg' },
      dal: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      kerosene: { qty: 80, status: 'AVAILABLE', unit: 'L' }
    },
    lastUpdatedMinutesAgo: 8,
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedBy: 'Authorized Shopkeeper',
    trustStatus: 'verified',
    verificationBadge: 'Verified Shop',
    reportsCount: 0,
    hasDiscrepancy: false,
    history: [
      {
        id: 'hist-04-1',
        time: '11:10 AM',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        item: 'All Commodities',
        action: 'Restocked by Sub-Depot',
        details: 'Full allocation received for BPL/AAY cards',
        updatedBy: 'Authorized Shopkeeper'
      }
    ]
  },
  {
    id: 'fps-05',
    name: 'Civic Center PDS Outlet No. 8',
    fpsCode: 'FPS-KL-EKM-0902',
    dealerName: 'S. Jayakumar',
    phone: '+91 93881 22334',
    area: 'Thrikkakara',
    fullAddress: 'Ward 12, Municipal Market Complex, Thrikkakara 682021',
    landmark: 'Near Thrikkakara Municipality Office',
    lat: 10.0340,
    lng: 76.3350,
    distanceKm: 3.4,
    travelTime: '12 mins by bike',
    timing: '9:00 AM – 1:00 PM & 4:00 PM – 7:00 PM',
    isOpen: true,
    queueStatus: 'Unknown',
    stock: {
      rice: { qty: 120, status: 'AVAILABLE', unit: 'kg' },
      wheat: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      sugar: { qty: 15, status: 'LOW', unit: 'kg' },
      dal: { qty: 20, status: 'LOW', unit: 'kg' },
      kerosene: { qty: 0, status: 'OUT_OF_STOCK', unit: 'L' }
    },
    lastUpdatedMinutesAgo: 490, // > 8 hours ago (Outdated)
    updatedAt: new Date(Date.now() - 490 * 60 * 1000).toISOString(),
    updatedBy: 'Automated POS System',
    trustStatus: 'outdated',
    verificationBadge: 'Information Outdated',
    reportsCount: 0,
    hasDiscrepancy: false,
    history: [
      {
        id: 'hist-05-1',
        time: 'Yesterday 05:00 PM',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        item: 'All',
        action: 'System Sync',
        details: 'End of day POS auto-upload',
        updatedBy: 'POS Terminal'
      }
    ]
  },
  {
    id: 'fps-06',
    name: 'Bharat Seva Fair Price Depot',
    fpsCode: 'FPS-KL-EKM-0331',
    dealerName: 'A. K. Abdul Rahman',
    phone: '+91 98462 77889',
    area: 'Kalamassery',
    fullAddress: 'Station Road, Near HMT Junction, Kalamassery 683104',
    landmark: 'Opposite Government Polytechnic College',
    lat: 10.0480,
    lng: 76.3230,
    distanceKm: 4.1,
    travelTime: '15 mins by bus',
    timing: '8:00 AM – 12:00 PM & 3:00 PM – 7:00 PM',
    isOpen: true,
    queueStatus: 'Short queue (2 people)',
    stock: {
      rice: { qty: 340, status: 'AVAILABLE', unit: 'kg' },
      wheat: { qty: 190, status: 'AVAILABLE', unit: 'kg' },
      sugar: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      dal: { qty: 0, status: 'OUT_OF_STOCK', unit: 'kg' },
      kerosene: { qty: 60, status: 'AVAILABLE', unit: 'L' }
    },
    lastUpdatedMinutesAgo: 190, // ~3 hours ago (Expiring/Orange)
    updatedAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
    updatedBy: 'Authorized Shopkeeper',
    trustStatus: 'expiring',
    verificationBadge: 'Update Getting Old',
    reportsCount: 2,
    hasDiscrepancy: true,
    reports: [
      {
        id: 'rep-06-1',
        time: '11:30 AM',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        item: 'Rice',
        reportedStatus: 'unavailable',
        reason: 'Dealer said electronic weighing scale is broken, asked to return tomorrow',
        citizenCardLast4: '8841'
      }
    ],
    history: [
      {
        id: 'hist-06-1',
        time: '09:30 AM',
        timestamp: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
        item: 'Rice, Wheat',
        action: 'Stock Count Verified',
        details: 'Dealer entered count via e-PoS device',
        updatedBy: 'Authorized Shopkeeper'
      }
    ]
  }
];

const DEFAULT_PENDING_REPORTS = [
  {
    id: 'rep-pending-01',
    shopId: 'fps-01',
    shopName: 'Green Valley Ration Shop',
    item: 'Wheat',
    reportedStatus: 'Dealer said out of stock',
    officialStatus: 'OUT_OF_STOCK',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    citizenCard: 'PHH-***-4091',
    details: 'Tried getting wheat at 11:30 AM, dealer said truck did not arrive yet.',
    status: 'resolved'
  },
  {
    id: 'rep-pending-02',
    shopId: 'fps-06',
    shopName: 'Bharat Seva Fair Price Depot',
    item: 'Rice',
    reportedStatus: 'Unavailable due to broken scale',
    officialStatus: 'AVAILABLE',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    citizenCard: 'AAY-***-8841',
    details: 'Shopkeeper refused to issue rice stating weighing machine failure.',
    status: 'pending'
  }
];
