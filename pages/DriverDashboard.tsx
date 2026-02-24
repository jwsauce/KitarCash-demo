import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function DriverDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    /**
     * Use onSnapshot for real-time updates. 
     * Drivers will see new "waiting" tasks immediately without refreshing.
     */
    const q = query(
      collection(db, "pickupRequests"),
      // Find tasks that are either WAITING (available to pick) 
      // OR already ASSIGNED to the current driver
      where("status", "in", ["waiting", "assigned"])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const taskList = await Promise.all(snapshot.docs.map(async (taskDoc) => {
        const data = taskDoc.data();
        
        // Filter: Show 'waiting' tasks to everyone, but 'assigned' tasks ONLY to the owner
        if (data.status === "assigned" && data.driverId !== auth.currentUser?.uid) {
          return null;
        }

        const userSnap = await getDoc(doc(db, "users", data.userId));
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        return { 
          id: taskDoc.id, 
          ...data, 
          userName: userData.displayName || userData.fullName || "Customer", 
          userPhone: userData.phone || "N/A" 
        };
      }));

      // Filter out nulls (tasks assigned to other drivers)
      setTasks(taskList.filter(t => t !== null));
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Action 1: Driver accepts a "waiting" task
  const handleAcceptTask = async (id: string) => {
    try {
      const taskRef = doc(db, "pickupRequests", id);
      await updateDoc(taskRef, {
        driverId: auth.currentUser?.uid,
        status: "assigned"
      });
      alert("Success: Task assigned to you!");
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to accept task.");
    }
  };

  // Action 2: Driver marks an "assigned" task as finished
  const handleCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, "pickupRequests", id), { status: "collected" });
      alert("Pickup Complete!");
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  if (loading) return <div className="p-10 text-center">Scanning for requests...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Pickup Marketplace</h1>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-gray-500">No requests available in your area.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`p-5 rounded-2xl shadow-sm border ${task.status === 'assigned' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold">{task.userName}</h2>
                <span className={`px-2 py-1 rounded text-xs font-bold ${task.status === 'assigned' ? 'bg-blue-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  {task.status === 'assigned' ? 'YOUR TASK' : 'AVAILABLE'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600">📞 {task.userPhone}</p>
              <p className="text-sm text-gray-600 mt-1">📍 {task.address}</p>
              <p className="text-sm font-semibold text-green-700 mt-2">Item: {task.item}</p>
              
              <div className="mt-4 flex gap-2">
                {task.status === 'waiting' ? (
                  // Button for Waiting tasks
                  <button 
                    onClick={() => handleAcceptTask(task.id)} 
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
                  >
                    Accept Task
                  </button>
                ) : (
                  // Buttons for Assigned tasks
                  <>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 bg-white border border-gray-300 text-center py-2 rounded-lg text-sm font-medium"
                    >
                      Navigate
                    </a>
                    <button 
                      onClick={() => handleCollected(task.id)} 
                      className="flex-[2] bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
                    >
                      Mark as Collected
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