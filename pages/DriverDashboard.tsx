import { useEffect, useState } from "react";
import { collection, query, where, doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function DriverDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "pickupRequests"),
      where("status", "in", ["waiting", "pooled", "assigned"])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const taskList = await Promise.all(snapshot.docs.map(async (taskDoc) => {
        const data = taskDoc.data();

        if (data.status === "assigned" && data.driverId !== auth.currentUser?.uid) {
          return null;
        }

        try {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            id: taskDoc.id,
            ...data,
            userName: userData.displayName || userData.fullName || "KitarCash Customer",
            userPhone: userData.phone || "No Phone Provided"
          };
        } catch (err) {
          console.error("Error fetching customer details:", err);
          return { id: taskDoc.id, ...data, userName: "Customer", userPhone: "N/A" };
        }
      }));

      setTasks(taskList.filter(t => t !== null));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptTask = async (id: string) => {
    try {
      await updateDoc(doc(db, "pickupRequests", id), {
        driverId: auth.currentUser?.uid,
        status: "assigned"
      });
      alert("🎉 Task accepted! You can now navigate to the location.");
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to accept task. Check security rules.");
    }
  };

  const handleCollected = async (id: string) => {
    if (!window.confirm("Confirm that you have collected the items?")) return;
    try {
      await updateDoc(doc(db, "pickupRequests", id), {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      alert("✅ Pickup successfully completed!");
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-blue-600 font-medium animate-pulse">Scanning Marketplace...</div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">

      <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 leading-tight">Driver Marketplace</h1>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: <span className="font-semibold text-blue-600">{user?.displayName || "Driver"}</span>
          </p>
        </div>
        <button
          onClick={() => { if (window.confirm("Logout from Driver Board?")) logout(); }}
          className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100"
        >
          Logout
        </button>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400">No active requests available right now.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`p-5 rounded-2xl shadow-sm border transition-all ${
                task.status === 'assigned'
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                  : task.status === 'pooled'
                  ? 'bg-green-50 border-green-200 ring-1 ring-green-100'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-gray-800">{task.userName}</h2>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  task.status === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : task.status === 'pooled'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {task.status === 'assigned' ? 'Your Active Task' : task.status === 'pooled' ? 'Pool Confirmed' : 'Open Request'}
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="mr-2">📞</span> {task.userPhone}
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="mr-2">📍</span> {task.address}
                </p>
                <div className="mt-3 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 border border-gray-200">
                  📦 Item: {task.item}
                </div>
              </div>

              <div className="flex gap-3">
                {task.status === 'waiting' || task.status === 'pooled' ? (
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-100 active:scale-[0.98] transition-transform"
                  >
                    Accept Task
                  </button>
                ) : (
                  <>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-white border border-gray-300 text-center py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Navigate
                    </a>
                    <button
                      onClick={() => handleCollected(task.id)}
                      className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md shadow-green-100 active:scale-[0.98] transition-transform"
                    >
                      Mark Collected
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
