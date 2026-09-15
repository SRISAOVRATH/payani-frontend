import { useEffect } from "react";

import {
  Bell,
  BusFront,
  CheckCheck,
  Info,
  Trash2,
  AlertTriangle,
  Clock3,
} from "lucide-react";

import { useNotifications } from "../context/NotificationContext";

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Date.now() - date.getTime();

  if (diff < 60 * 1000) {
    return "now";
  }

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} min ago`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hr ago`;
  }

  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  if (type === "critical_crowd") {
    return <AlertTriangle size={17} />;
  }

  if (type === "high_crowd") {
    return <Info size={17} />;
  }

  if (type === "approaching") {
    return <Clock3 size={17} />;
  }

  return <Bell size={17} />;
}

function getNotificationClass(type) {
  if (type === "critical_crowd") {
    return "notification-item notification-critical";
  }

  if (type === "high_crowd") {
    return "notification-item notification-warning";
  }

  if (type === "approaching") {
    return "notification-item notification-info";
  }

  return "notification-item";
}

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  } = useNotifications();

  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  return (
    <main className="page-shell notifications-page">
      <section className="page-intro">
        <div>
          <div className="section-kicker">
            PAYANI ALERT CENTER
          </div>

          <h1>Notifications</h1>

          <p>
            Stay updated about your saved buses, crowd levels and
            arrival alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="notification-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-action-btn"
                onClick={markAllAsRead}
              >
                <CheckCheck size={15} />
                Mark all as read
              </button>
            )}

            <button
              type="button"
              className="notification-action-btn"
              onClick={clearNotifications}
            >
              <Trash2 size={15} />
              Clear all
            </button>
          </div>
        )}
      </section>

      <section className="notification-panel">
        <div className="notification-panel-header">
          <div className="notification-icon">
            <Bell size={18} />
          </div>

          <div>
            <h2>All notifications</h2>

            <p>
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount === 1 ? "" : "s"
                  }`
                : "You are all caught up"}
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              <Info size={18} />
            </div>

            <strong>No new notifications</strong>

            <span>
              Save a bus to My Buses and PAYANI will show useful
              alerts here when it is approaching or becomes crowded.
            </span>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => {
              const isUnread = !notification.read;

              return (
                <article
                  key={notification.id}
                  className={getNotificationClass(
                    notification.type
                  )}
                  onClick={() => {
                    if (isUnread) {
                      markAsRead(notification.id);
                    }

                    if (notification.trip_id) {
                      window.location.href = `/bus/${notification.trip_id}`;
                    }
                  }}
                >
                  <div className="notification-item-icon">
                    {notification.bus_name ? (
                      <BusFront size={17} />
                    ) : (
                      getNotificationIcon(notification.type)
                    )}
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-top">
                      <div>
                        <h3>{notification.title}</h3>

                        {notification.route_name && (
                          <span className="notification-route">
                            {notification.route_name}
                          </span>
                        )}
                      </div>

                      <span className="notification-time">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>

                    <p>{notification.message}</p>

                    {notification.bus_name && (
                      <div className="notification-bus">
                        Bus {notification.bus_name}
                      </div>
                    )}
                  </div>

                  <div className="notification-item-actions">
                    {isUnread && (
                      <span className="notification-unread-dot" />
                    )}

                    <button
                      type="button"
                      className="notification-delete-btn"
                      aria-label="Remove notification"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}