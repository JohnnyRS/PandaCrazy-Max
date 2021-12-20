/**
 * Class to deal with the notifications sent out to users through browser or windows.
 * @class NotificationsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class NotificationsClass {
  constructor() {
    this.tagNumber = 0;                           // Unique number for a tag.
    this.lastGroupId = '';                        // The last group ID that used a notification so it won't send multiple all at once.
    this.enabled = 'Notification' in window;      // The notification object from windows.
    this.granted = (this.enabled) ? Notification.permission : false;
  }
  /** Will prepare Notifications in browser by showing a modal which the user has to interact with so browsers will permit to ask permission.
   * @param  {bool} [reset] - Reset granted to try again if not granted already.
  **/
  prepare(reset=false) {
    if (reset && this.granted !== 'granted') this.granted = false;
    setTimeout(() => {
      if (this.enabled && this.granted !== 'granted') {
        let body = `<div class='pcm-notificationsAsk'>Notifications are not permitted on your browser right now.<br>Would you like Notifications to be shown when important actions happen?<br><br>When you click Yes your browser will ask for permission and you<br>must accept it or Notifications will be turned off for this session.<br>Click No to have no Notification used for this session.<br>To not allow Notifications permanently click on the 'Never Ask Again' button.</div>`;
        if (!MyModal) MyModal = new ModalClass();
        MyModal.showDialogModal('600px', 'Notification Permission.', body, () => {
          Notification.requestPermission().then( (permission) => {
            if (permission === 'granted') {
              this.granted = true;
              this.show('Notifications are allowed', 'You have allowed Notifications and will now receive notifications when HITs get accepted or other important information.');
            }
            MyModal.closeAll();
          });
        }, true, true,_,_,_,_,_,_,_, () => {},_, `Don't ask again`, () => { MyOptions.setNotifications(true); }, '');
      } else if (reset && this.granted === 'granted') this.show('Notifications are allowed', 'You have allowed Notifications and will now receive notifications when HITs get accepted or other important information.');
    }, 100);
  }
  /** Checks to make sure that the notifications are enabled and granted.
   * @return {bool} - Returns true if everything is fine.
  **/
  isReady() { return this.enabled && this.granted; }
  /** Sends a notification to the user with the title, message and the tag. Also can use alert icon. Will only show one notification for each group ID.
   * @param  {string} title     - The title.  @param  {string} [message] - The message.  @param  {string} [tag] The tag.  @param  {string} [groupId] - Group ID.
   * @param  {bool} [alertIcon] - Alert icon show?
  **/
  show(title, message='message', tag='tag', groupId='', alertIcon=false) {
    if (this.lastGroupId !== groupId) this.tagNumber++;
    this.lastGroupId = groupId;
    let iconUrl = '/img/Messaging-Online-icon.png';
    if (alertIcon) iconUrl = '/img/Messaging-Alert-Icon.png';
    if (this.isReady()) new Notification(title, { 'body': message, 'icon': iconUrl, 'tag': tag+this.tagNumber });
  }
  /** Shows a notification with the hit data when accepted.
   * @param  {object} hitData - Hit data.
  **/
  showAcceptedHit(hitData) {
    let title = `Accepted HIT From: ${hitData.reqName}`;
    let message = `Pay: $${hitData.price} \nAssigned Time: ${getTimeLeft(hitData.assignedTime)} \nTitle: ${hitData.title}`;
    this.show(title, message, 'accepted', hitData.groupId);
  }
  /** Shows a logged off notification. **/
  showLoggedOff() {
    this.show('ALERT: Logged Off!', 'You are logged off of MTURK so need to log back in as soon as possible', 'loggedoff', '3alert3', true);
  }
  /** Shows a captcha alert notification. **/
  showCaptchaAlert() {
    this.show('ALERT: Captcha ALERT!', 'Just found a captcha so you better go fill it in as soon as possible!', 'captcha', '3alert3', true);
  }
  /** Shows a daily limit notification. **/
  showDailyLimit() {
    this.show('ALERT: CONGRATS!', 'You have reached your daily limit!! You must wait for tomorrow. Go outside and see the sun!', 'dailyLimit', '3alert3', true);
  }
  /** Shows a new version notification.
   * @param  {string} version - New version number.
  **/
  showNewVersion(version) {
    this.show('ALERT: New Version Available', `There is a new version: ${version}! \nYour current version is ${gCurrentVersion}!`, 'newVersion', '3alert3', true);
  }
}