
import { RecyclingCenter, Transaction, TransactionStatus } from '../types';

export const mockRecyclingCenters: RecyclingCenter[] = [
  {
    id: 'rc1',
    name: 'EcoRecycle Hub KL',
    address: '123, Jalan Hijau, Kuala Lumpur',
    distance: 2.5,
    operatingHours: '9am - 6pm',
    contact: '03-12345678',
    lat: 3.1390,      // 👈 add this
    lng: 101.6869,    // 👈 add this
  },
  {
    id: 'rc2',
    name: 'GreenCircle PJ',
    address: '45, Lorong Lestari, Petaling Jaya',
    distance: 5.1,
    operatingHours: '10am - 8pm',
    contact: '03-87654321',
    lat: 3.1073,      // 👈 add this
    lng: 101.6374,   
  },
  {
    id: 'rc3',
    name: 'Cyberjaya E-Waste Solutions',
    address: 'Lot 6, Tech Park, Cyberjaya',
    distance: 8.9,
    operatingHours: '9am - 5pm (Mon-Fri)',
    contact: '03-55558888',
    lat: 2.9213,      // 👈 add this
    lng: 101.6559, 
  },
];

export const mockTransactions: Transaction[] = [
    {
        id: 'txn1',
        date: '2024-07-20',
        item: 'iPhone 11',
        amount: 150.00,
        status: TransactionStatus.Credited,
    },
    {
        id: 'txn2',
        date: '2024-07-18',
        item: 'Dell Laptop',
        amount: 85.50,
        status: TransactionStatus.Credited,
    },
    {
        id: 'txn3',
        date: '2024-07-15',
        item: 'Mixed Cables',
        amount: 15.00,
        status: TransactionStatus.Credited,
    }
];

export const mockActiveRequest: Transaction = {
    id: 'txn-active',
    date: '2024-07-22',
    item: 'Samsung Galaxy S20',
    amount: 180.00,
    status: TransactionStatus.Collected
};
