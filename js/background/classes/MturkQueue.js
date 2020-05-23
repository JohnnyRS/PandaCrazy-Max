/**
 * This class gets the queue from mturk and sends it out to other classes that need it.
 * It will try to get queue at a slower rate if logged off and then wait for log on to message other classes.
 * @param  {number} timer                   Time to use for the timer to get queue results.
 * @param  {number} loggedOffTimer=5000     Time to use for the timer when logged off to get queue results.
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class MturkQueue extends MturkClass {
	constructor(timer, loggedOffTimer=5000) {
    super();
    this.timer = timer;
    this.loggedOffTimer = loggedOffTimer;
    this.queueUnique = null;
    this.queueUrl = new UrlClass('https://worker.mturk.com/tasks');
    this.queueResults = [];
    this.loggedOff = false;
    this.authenticityToken = null;
		queueTimer.setMyClass(this);				// Tell timer what class is using it so it can send information back
		queueTimer.setTimer(timer);
  }
  /**
   * Sends queue results and authenticity token for returning jobs to the panda UI and search UI.
   */
  sendQueueResults() {
    myPanda.gotNewQueue(this.queueResults,this.authenticityToken);
    mySearch.gotNewQueue(this.queueResults,this.authenticityToken);
  }
  /**
   * Starts the queue monitor by adding a job to the timer queue.
   */
  startQueueMonitor() {
    if (!queueTimer.running) {
			if (this.dLog(1)) console.info('%cStarting Queue Monitor.', CONSOLE_INFO);
      this.queueUnique = queueTimer.addToQueue(-1, (unique, elapsed) => { this.goFetch(this.queueUrl, unique, elapsed); }, () => { this.stopQueueMonitor(); });
    }
  }
	/**
   * Stop the queue monitor by removing job from timer queue.
	 */
	stopQueueMonitor() {
    if (this.dLog(1)) console.info(`%cStopping Queue Monitor. Delete ${this.queueUnique}`, CONSOLE_INFO);
    queueTimer.deleteFromQueue(this.queueUnique);
  }
  /**
   * Will count how many hits in queue with the given group ID or requester ID.
   * If no ID's are given then it will get the total reward potential of all the hits in queue.
   * @param  {string} rId=''      Requester ID to get total count from.
   * @param  {string} gId=''      Group ID to get total count from.
   * @param  {number} price=0     Any price higher than this amount will be totaled in reward total.
   * @return {number}             Returns total counted value of given options.
   */
  totalResults(rId='', gId='', price=0) {
    let total = 0;
    if (gId!=='') total = this.queueResults.filter( item => item.project.hit_set_id===gId ).length;
    else if (rId!=='') total = this.queueResults.filter( item => item.project.requester_id===rId ).length;
    else total = parseFloat(this.queueResults.map( item => item.project.monetary_reward.amount_in_dollars )
      .reduce( (acc, reward) => { return acc +  ( (reward>price) ? reward : 0 ); }, 0 )).toFixed(2);
    return total;
  }
  /**
   * Changes the timer to a longer time and informs panda and search class when logged off.
   */
  nowLoggedOff() {
    this.loggedOff = true; queueTimer.setTimer(this.loggedOffTimer);
    if (this.dLog(1)) console.info('%cYou are logged off from mturk.com.',CONSOLE_WARN);
    myPanda.nowLoggedOff(); mySearch.nowLoggedOff(); // Show logged off warning on all running UI's.
  }
  /**
   * Changes the timer to the normal time and informs panda and search class when logged back in.
   */
  nowLoggedOn() {
    this.loggedOff = false; queueTimer.setTimer(this.timer);
    if (this.dLog(1)) console.info('%cYou are logged back in to mturk.com.',CONSOLE_WARN);
    myPanda.nowLoggedOn(); mySearch.nowLoggedOn(); // Remove logged off warning on all running UI's.
  }
  /**
   * @param  {object} objUrl        Url object to use when fetching.
   * @param  {number} queueUnique   Unique number for the job in timer queue.
   * @param  {number} elapsed       Exact time it took for the queue timer to do next queue job.
   */
  goFetch(objUrl, queueUnique, elapsed) { // Can deal with getting search results data.
		super.goFetch(objUrl).then(result => {
      if (!result) {
        if (this.dError(1)) { 
          console.error('Returned result from queue fetch was a null.', JSON.stringify(objUrl));
        }
      } else {
        if (this.dLog(4)) console.debug(`%cgoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
        if (result.mode === 'logged out' && queueUnique !== null) { this.nowLoggedOff(); }
        else if (result.type === 'ok.text') {
          if (this.loggedOff) this.nowLoggedOn(); // Must be logged in if mturk sent relevant data.
          const html = $.parseHTML( result.data );
          const errorPage = $(html).find('.error-page');
          if (errorPage.length>0) {
            const errorMessage = $(errorPage).find('p.message').html();
            if (errorMessage.includes('We have detected an excessive rate of page')) // PRE found.
            if (this.dLog(1)) console.info('%cReceived a Queue PRE!!',CONSOLE_WARN);
          } else {
            const targetDiv = $(html).find('.task-queue-header').next('div');
            const rawProps = $(targetDiv).find('div[data-react-props]').attr('data-react-props');
            const authenticityToken = $(html).filter('meta[name="csrf-token"]')[0].content;
            if (authenticityToken) this.authenticityToken = authenticityToken;
            this.queueResults = JSON.parse(rawProps).bodyData;
            this.sendQueueResults();
          }
        }
      }
    });
  }
	/**
	 * Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
	 * @param  {number} levelNumber			Level number for this error.
	 * @return {bool}										True if this error is permitted to show.
	 */
	dError(levelNumber) { return dError(levelNumber, 'MturkQueue'); }
	/**
	 * Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber			Level number for this debug message.
	 * @return {bool}										True if this message is permitted to show.
	 */
	dLog(levelNumber) { return dLog(levelNumber, 'MturkQueue'); }
}
