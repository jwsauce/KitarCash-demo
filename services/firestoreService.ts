import { collection, addDoc, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PickupRequest } from "../types";

// Haversine formula
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const savePickupRequest = async (request: PickupRequest): Promise<string> => {
  const docRef = await addDoc(collection(db, "pickupRequests"), request);
  return docRef.id;
};

export const fetchPickupRequests = async (): Promise<PickupRequest[]> => {
  const snapshot = await getDocs(collection(db, "pickupRequests"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PickupRequest[];
};

export const countNearbyRequests = async (lat: number, lng: number): Promise<number> => {
  const all = await fetchPickupRequests();
  return all.filter(
    (r) => r.status === 'waiting' && getDistanceKm(lat, lng, r.lat, r.lng) <= 2
  ).length;
};

// Updated — returns both pooledIds and userIds
export const runPoolingAlgorithm = async (lat: number, lng: number): Promise<{ pooledIds: string[]; userIds: string[] }> => {
  const all = await fetchPickupRequests();

  const nearby = all.filter(
    (r) => r.status === 'waiting' && r.id && getDistanceKm(lat, lng, r.lat, r.lng) <= 2
  );

  if (nearby.length < 5) return { pooledIds: [], userIds: [] };

  const poolId = `pool-${Date.now()}`;
  const pooledIds: string[] = [];
  const userIds: string[] = [];

  await Promise.all(
    nearby.map(async (request) => {
      await updateDoc(doc(db, "pickupRequests", request.id!), {
        status: 'pooled',
        pooledAt: new Date().toISOString(),
        poolId,
      });
      pooledIds.push(request.id!);
      userIds.push(request.userId); // 👈 collect user IDs
    })
  );

  return { pooledIds, userIds };
};

// Fetch emails of all pooled users
export const fetchUserEmails = async (userIds: string[]): Promise<{ email: string; fullName: string }[]> => {
  const users = await Promise.all(
    userIds.map(async (userId) => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return {
          email: userDoc.data().email,
          fullName: userDoc.data().fullName,
        };
      }
      return null;
    })
  );
  return users.filter(Boolean) as { email: string; fullName: string }[];
};

export const setPickupTime = async (requestId: string, pickupTime: string): Promise<void> => {
  await updateDoc(doc(db, "pickupRequests", requestId), {
    pickupTime,
    status: 'assigned',
  });
};