import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "info" | "warning" | "success";
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Simulazione notifiche - TODO: collegare al backend
    setNotifications([
      {
        id: "1",
        title: "Nuova circolare pubblicata",
        message: "Circolare n. 5 - Convocazione Collegio dei Docenti",
        date: new Date().toISOString(),
        read: false,
        type: "info"
      },
      {
        id: "2",
        title: "Promemoria evento",
        message: "Consiglio di Classe 5A domani alle 15:00",
        date: new Date(Date.now() - 86400000).toISOString(),
        read: false,
        type: "warning"
      }
    ]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Adesso";
    if (hours < 24) return `${hours}h fa`;
    if (days === 1) return "Ieri";
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl z-50 max-h-[600px] overflow-y-auto">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900">
              <h3 className="font-bold text-white text-lg">Notifiche</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Segna tutte come lette
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="mx-auto mb-2" size={32} />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 hover:bg-slate-800 cursor-pointer transition-colors ${
                      !notification.read ? "bg-slate-800/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className={`text-sm font-semibold ${
                          !notification.read ? "text-white" : "text-slate-300"
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <span className="text-xs text-slate-500 mt-2 block">
                          {formatDate(notification.date)}
                        </span>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}