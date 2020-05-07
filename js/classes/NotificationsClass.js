class NotificationsClass {
  constructor() {
    this.enabled = "Notification" in window;
    this.granted = (this.enabled) ? Notification.permission : false;
    if (this.enabled && this.granted!=="granted") Notification.requestPermission().then( (permission) => {
      if (permission === "granted") this.granted = true;
      this.show("Notifications are on");
    });
  }
  isReady() { return this.enabled && this.granted; }
  show(message) {
    const n = ( this.isReady() ) ? new Notification(message) : null;
  }
}