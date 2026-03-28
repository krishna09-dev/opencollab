import { useEffect, useState } from "react";
import { fetchCurrentUser, fetchNotifications } from "../api/issueDetailApi";
import type { CurrentUser, NotificationDto } from "../types";

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadUser = async () => {
    setLoadingUser(true);
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUser();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { currentUser, loadingUser, notifications, unreadCount, loadNotifications };
}
