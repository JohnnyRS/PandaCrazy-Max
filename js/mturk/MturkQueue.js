'use strict'
/** This class gets the queue from MTURK and sends it out to other classes that need it.
 * @class MturkQueue ##
 * @extends MturkClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class MturkQueue extends MturkClass {
	/**
   * @param  {number} timer      - Time to use for the timer to get queue results.
   * @param  {number} [OffTimer] - Time to use for the timer when logged off or disconnected to get queue results.
	 */
	constructor(timer, OffTimer=5000, disconnectedTimer=10000) {
    super();
    this.timer = timer;               // Sets the time to use for the queue Timer cycle.
    this.disconnected = false;
    this.disconnectTimer = disconnectedTimer;
    this.loggedOffTimer = OffTimer;   // Sets the timer to use for when it's logged off.
    this.queueUnique = null;          // The unique number set by the timer class for this class.
    this.queueResults = [];           // The results from MTURK queue with all HITs info.
    this.queueAdd = [];
    this.loggedOff = false;           // Are we logged off or not?
    this.authenticityToken = null;    // Keeps the authenticity token used for returning HITs.
		queueTimer.setMyClass(this);			// Tell timer what class is using it so it can send information back
		queueTimer.theTimer(timer);       // Sets the timer for the timer class.
    this.queueUrl = new UrlClass('https://worker.mturk.com/tasks');  // Sets up a url class for MTURK queue.
  }
  /** Returns the value of loggedOff value;
   * @return {bool} - True if logged off. */
  isLoggedOff() { return this.loggedOff; }
  /** Returns the queue size.
   * @return {number} - The queue size number. */
  getQueueSize() { return this.queueResults.length; }
  /** Sends queue results and authenticity token for returning jobs to the panda UI and search UI.
   * @param {function} sendResults - The function to use to send results if given. */
  sendQueueResults(sendResults=null) {
    if (sendResults) sendResults({'for':'getQueueData', 'response':this.queueResults});
    else {
      if (myPanda) myPanda.gotNewQueue(this.queueResults, this.authenticityToken);
      if (mySearch) mySearch.gotNewQueue(this.queueResults, this.authenticityToken);
      chrome.storage.local.set({'PCM_queueData':this.queueResults});
    }
  }
  /** Changes the time for the queue timer and returns the time saved.
   * @param  {number} timer - The time to change the queue timer to.
	 * @return {number}				- Returns the queue timer time that was set. */
  timerChange(timer) { if (timer) { this.timer = queueTimer.theTimer(timer, true); } return this.timer; }
  /** Starts the queue monitor by adding a job to the timer queue. */
  startQueueMonitor() {
    if (!queueTimer.running) {
      if (this.dLog(1)) console.info('%cStarting Queue Monitor.', CONSOLE_INFO);
      setTimeout( () => {
        if (queueTimer) this.queueUnique = queueTimer.addToQueue(-1, (unique) => { this.goFetch(this.queueUrl, unique); }, () => { this.stopQueueMonitor(); });
      }, 1);
    }
  }
	/** Stop the queue monitor by removing job from timer queue. */
	stopQueueMonitor() {
    if (this.dLog(1)) console.info(`%cStopping Queue Monitor. Delete ${this.queueUnique}`, CONSOLE_INFO);
    queueTimer.deleteFromQueue(this.queueUnique);
  }
  /** Will count how many HITs in queue with the given group ID or requester ID. Will send total reward potential if no ID's given.
   * @param  {string} [rId] - Requester ID to get total count from.  @param  {string} [gId]  - Group ID to get total count from.
   * @return {number}       - Returns total counted value of given options. */
  totalResults(rId='', gId='') {
    let total = 0;
    if (this.queueResults.length) {
      if (gId !== '') {
        total = arrayCount(this.queueResults, item => item.project.hit_set_id === gId);
        if (this.queueAdd.length) total += arrayCount(this.queueAdd, item => item.groupId === gId);
      } else if (rId !== '') {
        total = arrayCount(this.queueResults, item => item.project.requester_id === rId);
        if (this.queueAdd.length) total += arrayCount(this.queueAdd, item => item.reqId === rId);
      } else {
        total = arrayCount(this.queueResults, item => {
          return item.project.monetary_reward.amount_in_dollars;
        }, false).toFixed(2);
      }
    }
    return total;
  }
  /** Adds 1 to the accepted value for this HIT job.
   * @param  {object} pandaInfo - The information data for this panda job. */
  addAccepted(pandaInfo) { this.queueAdd.push(pandaInfo.data); }
  /** Changes the timer to a longer time and informs panda and search class when logged off. */
  nowLoggedOff() {
    this.loggedOff = true; if (queueTimer) queueTimer.theTimer(this.loggedOffTimer);
    if (this.dLog(1)) console.info('%cYou are logged off from mturk.com.',CONSOLE_WARN);
    if (myPanda) myPanda.nowLoggedOff(); if (mySearch) mySearch.nowLoggedOff(); // Show logged off warning on all running UI's.
  }
  /** Changes the timer to the normal time and informs panda and search class when logged back in. */
  nowLoggedOn() {
    this.loggedOff = false; queueTimer.theTimer(this.timer);
    if (this.dLog(1)) console.info('%cYou are logged back in to mturk.com.',CONSOLE_WARN);
    if (myPanda) myPanda.nowLoggedOn(); if (mySearch) mySearch.nowLoggedOn(); // Remove logged off warning on all running UI's.
  }
  /** Fetches the URL for the queue after timer class tells it to do so and handles MTURK results.
   * @param  {object} objUrl      - URL object to use when fetching.  @param  {number} queueUnique - Unique number for the job in timer queue. */
  goFetch(objUrl, queueUnique) {
    if (this.dLog(4)) console.debug(`%cGoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
		super.goFetch(objUrl).then(result => {
      if (!result) {
        if (this.dError(1)) { console.error('Returned result fetch was a null.', JSON.stringify(objUrl)); }
      } else {
        if (result.mode === 'logged out' && queueUnique !== null) { this.nowLoggedOff(); }
        else if (result.type === 'ok.text') {
          if (this.disconnected) { this.disconnected = false; queueTimer.theTimer(this.timer); }
          if (this.loggedOff) this.nowLoggedOn(); // Must be logged in if MTURK sent relevant data.
          let errorPage = $(result.data).find('.error-page');
          if (errorPage.length > 0) {
            let errorMessage = errorPage.find('p.message').html();
            if (errorMessage.includes('We have detected an excessive rate of page')) // PRE found.
            if (this.dLog(1)) console.info('%cReceived a Queue PRE!!',CONSOLE_WARN);
            errorMessage = null;
          } else {
            let targetDiv = $(result.data).find('.task-queue-header').next('div');
            let rawProps = targetDiv.find('div[data-react-props]').attr('data-react-props');
            let authenticityToken = $(result.data).filter(`meta[name='csrf-token']`)[0].content;
            if (authenticityToken) this.authenticityToken = authenticityToken;
            this.queueResults = JSON.parse(rawProps).bodyData;
            this.queueAdd = [];
            this.sendQueueResults();
            targetDiv = null; rawProps = null;
          }
          errorPage = null;
        } else if (result.type === 'caught.error') {
          if (JSON.stringify(result.status).includes('Failed to fetch')) { console.info('disconnected'); this.disconnected = true; queueTimer.theTimer(this.disconnectTimer); }
          console.info(`Mturk might be slow or you're disconnected. Received a service unavailable error.`);
        }
      }
      result = null;
    });
  }
	/** Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
	 * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}							  - True if this error is permitted to show. */
	dError(levelNumber) { return dError(levelNumber, 'MturkQueue'); }
	/** Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}							  - True if this message is permitted to show. */
	dLog(levelNumber) { return dLog(levelNumber, 'MturkQueue'); }
}
