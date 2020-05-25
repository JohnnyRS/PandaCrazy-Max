/**
 * Class to deal with the notifications sent out to users through browser or windows.
 * @class NotificationsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class NotificationsClass {
  constructor() {
    this.enabled = "Notification" in window;      // The notification object from windows.
    this.granted = (this.enabled) ? Notification.permission : false;
    if (this.enabled && this.granted!=="granted") Notification.requestPermission().then( (permission) => {
      if (permission === "granted") this.granted = true;
      this.show("Notifications are on");
    });
  }
  /**
   * Checks to make sure that the notifications are enabled and granted.
   * @return {bool} - Returns true if everything is fine.
   */
  isReady() { return this.enabled && this.granted; }
  /**
   * Sends a notification to the user.
   * @param  {string} message - The message to send in the notification.
   */
  show(message) {
    const n = ( this.isReady() ) ? new Notification(message) : null;
  }
}