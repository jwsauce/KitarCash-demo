import { collection, addDoc, getDocs, updateDoc, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { PickupRequest } from "../types";
import { getDistanceKm } from './geoUtils';

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

// Sums total item quantity within 2km radius (waiting + pooled requests)
export const countNearbyRequests = async (lat: number, lng: number): Promise<number> => {
  const all = await fetchPickupRequests();

  const totalQuantity = all
    .filter((r) =>
      (r.status === 'waiting' || r.status === 'pooled') &&
      getDistanceKm(lat, lng, r.lat, r.lng) <= 2
    )
    .reduce((sum, r) => sum + (r.quantity || 1), 0);

  return totalQuantity;
};

export const runPoolingAlgorithm = async (lat: number, lng: number): Promise<{ pooledIds: string[]; userIds: string[] }> => {
  const all = await fetchPickupRequests();

  const nearby = all.filter(
    (r) => r.status === 'waiting' && r.id && getDistanceKm(lat, lng, r.lat, r.lng) <= 2
  );

  const totalQuantity = nearby.reduce((sum, r) => sum + (r.quantity || 1), 0);
  if (totalQuantity < 5) return { pooledIds: [], userIds: [] };

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
      userIds.push(request.userId);
    })
  );

  return { pooledIds, userIds };
};

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

export const cancelPickupRequest = async (requestId: string): Promise<void> => {
  await updateDoc(doc(db, "pickupRequests", requestId), {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });
};
