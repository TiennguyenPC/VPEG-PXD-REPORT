export const NOTIFICATIONS_REFRESH_EVENT = 'epc-notifications-refresh';

export function refreshNotificationsBell() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
}
