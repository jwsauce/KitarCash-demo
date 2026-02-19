
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
  imagePreviewUrl?: string;
}

export interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  distance: number;
  operatingHours: string;
  contact: string;
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
