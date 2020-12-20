/**
 * Class to deal with the notifications sent out to users through browser or windows.
 * @class NotificationsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class NotificationsClass {
  constructor() {
    this.tagNumber = 0;
    this.lastGroupId = '';
    this.enabled = 'Notification' in window;      // The notification object from windows.
    this.granted = (this.enabled) ? Notification.permission : false;
    if (this.enabled && this.granted !== 'granted') Notification.requestPermission().then( (permission) => {
      if (permission === 'granted') this.granted = true;
      this.show('Notifications are on');
    });
  }
  /** Checks to make sure that the notifications are enabled and granted.
   * @return {bool} - Returns true if everything is fine. */
  isReady() { return this.enabled && this.granted; }
  /** Sends a notification to the user with the title, message and the tag. Also can use alert icon. Will only show one notification for each group ID.
   * @param {string} title - The title  @param {string} [message] - The Message  @param {string} [tag] The Tag  @param {string} [groupId] - Group ID
   * @param {bool} [alertIcon] - Alert Icon Show? */
  show(title, message='message', tag='tag', groupId='', alertIcon=false) {
    if (this.lastGroupId !== groupId) this.tagNumber++;
    this.lastGroupId = groupId;
    let iconUrl = '/img/Messaging-Online-icon.png';
    if (alertIcon) iconUrl = '/img/Messaging-Alert-Icon.png';
    const n = ( this.isReady() ) ? new Notification(title, {
      body: message, icon: iconUrl,
      tag: tag+this.tagNumber
    }) : null;
  }
  /** Shows a notification with the hit data when accepted.
   * @param {object} hitData - Hit Data */
  showAcceptedHit(hitData) {
    let title = `Accepted HIT From: ${hitData.reqName}`;
    let message = `Pay: $${hitData.price} \nAssigned Time: ${getTimeLeft(hitData.assignedTime)} \nTitle: ${hitData.title}`;
    this.show(title, message, 'accepted', hitData.groupId);
  }
  /** Shows a logged off notification. */
  showLoggedOff() {
    this.show('ALERT: Logged Off!', 'You are logged off of mturk so need to log back in as soon as possible', 'loggedoff', '3alert3', true);
  }
  /** Shows a captcha alert notification. */
  showCaptchaAlert() {
    this.show('ALERT: Captcha ALERT!', 'Just found a captcha so you better go fill it in as soon as possible!', 'captcha', '3alert3', true);
  }
  /** Shows a daily limit notification. */
  showDailyLimit() {
    this.show('ALERT: CONGRATS!', 'You have reached your daily limit!! You must wait for tomorrow. Go outside and see the sun!', 'dailyLimit', '3alert3', true);
  }
  /** Shows a new version notification.
   * @param {string} version - Ver Version Number */
  showNewVersion(version) {
    this.show('ALERT: New Version Available', `There is a new version: ${version}! \nYour current version is ${localVersion}!`, 'newVersion', '3alert3', true);
  }
}