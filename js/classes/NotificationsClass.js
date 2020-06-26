/**
 * Class to deal with the notifications sent out to users through browser or windows.
 * @class NotificationsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class NotificationsClass {
  constructor() {
    this.tagNumber = 0;
    this.lastGroupId = '';
    this.enabled = 'Notification' in window;      // The notification object from windows.
    this.granted = (this.enabled) ? Notification.permission : false;
    if (this.enabled && this.granted!=='granted') Notification.requestPermission().then( (permission) => {
      if (permission === 'granted') this.granted = true;
      this.show('Notifications are on');
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
  show(title, message='message', tag='tag', groupId='', alertIcon=false) {
    if (this.lastGroupId !== groupId) this.tagNumber++;
    this.lastGroupId = groupId;
    let iconUrl = 'https://pandacrazy.allbyjohn.com/mturk/Messaging-Online-icon.png';
    if (alertIcon) iconUrl = 'https://pandacrazy.allbyjohn.com/mturk/Messaging-Alert-Icon.png';
    const n = ( this.isReady() ) ? new Notification(title, {
      body: message, icon: iconUrl,
      tag: tag+this.tagNumber
    }) : null;
  }
  showAcceptedHit(hitData) {
    let title = `Accepted Hit From: ${hitData.reqName}`;
    let message = `Pay: $${hitData.price} \nAssigned Time: ${getTimeLeft(hitData.assignedTime)} \nTitle: ${hitData.title}`;
    this.show(title, message, 'accepted', hitData.groupId);
  }
  showLoggedOff() {
    this.show('ALERT: Logged Off!', 'You are logged off of mturk so need to log back in as soon as possible', 'loggedoff', '3alert3', true);
  }
  showCaptchaAlert() {
    this.show('ALERT: Captcha ALERT!', 'Just found a captcha so you better go fill it in as soon as possible!', 'captcha', '3alert3', true);
  }
  showDailyLimit() {
    this.show('ALERT: CONGRATS!', 'You have reached your daily limit!! You must wait for tomorrow. Go outside and see the sun!', 'dailyLimit', '3alert3', true);
  }
  showNotFocussed() {
    this.show('Panda Crazy not Focussed.', 'Please put Panda Crazy in it\'s own window and not a tab or minimized so it works efficiently as fast as possible. This warning may be disabled in the options/general menu', 'unfocussed', 'PC Alert', true);
  }
}