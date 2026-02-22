
export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface EWasteItem {
  id: string;
  itemName: string;
  category: 'phone' | 'laptop' | 'battery' | 'appliance' | 'other';
  estimatedValue: {
    min: number;
    max: number;
  };
  environmentalImpact: string;
  hazardFlag: boolean;
  hazardDetails?: string;
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'ai';
  type: 'text' | 'image' | 'analysis';
  content: string | EWasteItem;
  imageUrl?: string;
}

export interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  distance: number;
  operatingHours: string;
  contact: string;
  lat: number;
  lng: number;
}

export enum TransactionStatus {
  Submitted = 'Request Submitted',
  Scheduled = 'Pickup Scheduled',
  Collected = 'Item Collected',
  AtCenter = 'Arrived at Recycling Center',
  Verified = 'Verified',
  Credited = 'Cash Credited'
}

export interface Transaction {
  id: string;
  date: string;
  item: string;
  amount: number;
  status: TransactionStatus;
}

export interface PickupRequest {
  id?: string;
  userId: string;
  address: string;
  item: string;
  quantity: number;
  addOn: string;
  lat: number;
  lng: number;
  status: 'waiting' | 'pooled' | 'assigned' | 'completed';
  createdAt: string;
}