// Utility function to trigger notification count updates across the app
export const triggerNotificationUpdate = () => {
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('notifications_updated'))
  
  // Update localStorage to trigger cross-tab updates
  localStorage.setItem('notifications_updated', Date.now().toString())
  localStorage.removeItem('notifications_updated')
}
