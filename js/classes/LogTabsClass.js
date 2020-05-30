/**
 * A class that deals with the queue watch, accepted hits and status log on the bottom.
 * It will also take care of how the logs are displayed on the UI page.
 * @class LogTabsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class LogTabsClass {
  constructor() {
    this.tabs = new TabbedClass($(`#pcm_logSection`), `pcm_logTabs`, `pcm_tabbedlogs`, `pcm_logTabContents`);
    this.ids = [];                // Array of the id names of the log tabs on the bottom.
    this.taskIds = [];            // Array of the task id's of the hits in the queue for queue watch.
    this.taskInfo = {};           // Object of all the hits in the queue for queue watch.
    this.queueTab = null;         // The tab for the queue watch.
    this.queueContent = null;     // The contents for the queue watch.
    this.queueTotal = 0;
    this._queueIsNew = false;
  }
	/**
	 * @type {bool} - True if timer is running.
	 */
	get queueIsNew() { return this._queueIsNew; }
	/**
	 * @param {bool} v - Set timer as running or not.
	 */											
	set queueIsNew(v) { this._queueIsNew = v; if (v) { bgPanda.doNewChecks(); } }
  /**
   * Gets the total hits in the queue.
   * @return {number} - Total hits in the queue.
   */
  getQueueTotal() { return this.queueTotal; }
  /**
   * Prepare the tabs on the bottom and placing the id names in an array.
   * @async
   * @return {array}
   */
  async prepare() {
    let [success, err] = await this.tabs.prepare();
    if (!err) {
      this.tabs.tabIds += "l"; // Adds a l letter to the id tab names representing these are log tabs.
      this.ids.push(await this.tabs.addTab("Accepted")); // ids[0]
      this.ids.push(await this.tabs.addTab("Status log")); // ids[1]
      this.ids.push(await this.tabs.addTab("Queue Watch", true)); // ids[2]
      this.queueTab = $(`#${this.ids[2].tabId}`);
      this.queueContent = $(`<div class="pcm_queueResults"></div>`).appendTo(`#${this.ids[2].tabContent}`);
    }
    return [success, err];
  }
  /**
   * Add the hit information to the log and either append or before element passed.
   * @param  {object} newInfo       - Object with information of the new hit being added to the log.
   * @param  {string} taskId        - The task id of the hit in the queue results.
   * @param  {object} element       - Element to append this hit to in the log tab.
   * @param  {bool} [appendTo=true] - Should this be appended to element or before element?
   */
  addToLog(hitInfo, taskId, element, appendTo=true) {
    const timeLeft = getTimeLeft(hitInfo.secondsLeft);
    const toAdd = $(`<div class="pcm_q01">(${hitInfo.project.requester_name}) [$${hitInfo.project.monetary_reward.amount_in_dollars.toFixed(2)}] - <span class="pcm_timeLeft" style="color:cyan;">${timeLeft}</span> - ${hitInfo.project.title}</div>`).data('taskId',taskId);
    if (appendTo) $(toAdd).appendTo(element);
    else $(toAdd).insertBefore(element);
    $(toAdd).append(" :: ");
    createLink(toAdd, "pcm_returnLink", "#", "Return", "_blank", (e) => {
      modal.showDialogModal("700px", "Return this hit?", `Do you really want to return this hit:<br> ${hitInfo.project.requester_name} - ${hitInfo.project.title}`, () => {
        const returnLink = "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "ref=w_wp_rtrn_top");
        fetch(returnLink, { method: 'POST', credentials: `include`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: "_method=delete&authenticity_token=" + encodeURIComponent(bgPanda.authenticityToken)
        }).then( res => {
          if (this.dLog(1)) console.info(`%cReturned hit status: ${res.status} : ${res.url}`,CONSOLE_INFO);
          modal.closeModal();
        }).catch( error => { if (this.dError(2)) console.error(`Returned hit error: ${error}`); });
      }, true, true);
      e.preventDefault();
    });
    $(toAdd).append(" :: ");
    createLink(toAdd, "pcm_continueLink", "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "from_queue=true"), "Continue Work", "_blank", (e) => {
        const theHeight=window.outerHeight-80, theWidth=window.outerWidth-10;
        window.open($(e.target).attr("href"),"_blank","width=" + theWidth + ",height=" +  theHeight + ",scrollbars=yes,toolbar=yes,menubar=yes,location=yes");
        e.preventDefault();
    });
    if (this.dLog(3)) console.info(`%cNew to queue: {title: ${escape(hitInfo.project.title)}, task_id: ${taskId}, hit_set_id: ${hitInfo.project.hit_set_id}, requester_id: ${hitInfo.project.requester_id}, requester_name: ${escape(hitInfo.project.requester_name)}}`,CONSOLE_DEBUG);
  }
  /**
   * Add a new hit accepted into the queue in the correct position accroding to seconds left.
   * @param  {object} hitInfo       - Object of the panda job from panda class.
   * @param  {object} hitInfo2      - Hit information from mturk queue results.
   * @param  {object} data          - Saved data from panda class just in case it gets removed.
   * @param  {string} [task_url=""] - The task url from the fetch results.
   */
  addIntoQueue(hitInfo, hitInfo2, data, task_url="") {
    if (!this.taskIds.includes(data.taskId)) { // Make sure hit not in queue already.
      let found =this.taskIds.findIndex( key => { return this.taskInfo[key].secondsLeft>data.assignedTime; } );
      this.taskIds.splice( ((found===-1) ? this.taskIds.length-1 : found-1), 0, data.taskId );
      const newInfo = { project: {assignable_hits_count:hitInfo.hitsAvailable, assignment_duration_in_seconds:hitInfo2.assignmentDurationInSeconds, hit_set_id:data.groupId, creation_time:hitInfo2.creationTime, description:data.description, latest_expiration_time:hitInfo2.expirationTime, monetary_reward:{amount_in_dollars:data.price}, requester_name:data.reqName, requester_id:data.reqId, title:data.title}, secondsLeft:hitInfo2.assignmentDurationInSeconds, task_id:data.taskId, task_url:task_url.replace("&auto_accept=true","")};
      this.taskInfo[data.taskId] = newInfo;
      if (found===-1) this.addToLog(newInfo, data.taskId, this.queueContent, true);
      else this.addToLog(newInfo, data.taskId, $(this.queueContent).find("div")[found], false);
      this.queueTotal++;
    }
  }
  /**
   * Update the queue watch with newer hits and update time left in the queue watch.
   * This will figure out if there are any new hits and add it in the correct position.
   * Also will figure out if a hit was removed from queue and remove it from queue watch.
   * @param  {object} queueResults - Object of all the hits on the mturk queue.
   */
  updateQueue(queueResults) {
    let prevHits = $(this.queueContent).find("div"); this.queueIsNew = false;
    this.queueTotal = queueResults.length;
    $(this.queueTab).find("span").html(`Queue Watch - ${this.queueTotal}`);
    if (this.queueTotal > 0) {
      let newIds = [], newInfo = {}, oldIds = []; // oldIds is used for duplication error checking
      queueResults.forEach( (value) => { newIds.push(value.task_id); newInfo[value.task_id] = {project:value.project, secondsLeft:value.time_to_deadline_in_seconds, task_id:value.taskId, task_url:value.task_url.replace(".json","")}; } );
      if (prevHits.length > 0) {
        // Some previous jobs are still in queue. Let's compare and find out if something was added or removed.
        let prevDivIndex = 0, addedToEnd = false;
        newIds.forEach( (value) => {
          if (newInfo[value].secondsLeft!==-1) { // make sure job isn't expired.
            let prevAssignId = $(prevHits[prevDivIndex]).data('taskId');
            if (oldIds.includes(prevAssignId)) {
              if (this.dError(1)) console.info('%cDuplication error found. Not adding job to queue.',CONSOLE_WARN);
            } else if (prevDivIndex >= prevHits.length) { // There are more jobs in new queue than old queue.
              if (this.dLog(2)) console.info('%cAdd job to end of queue.',CONSOLE_DEBUG);
              addedToEnd = true; this.queueIsNew = true;
              this.addToLog(newInfo[value], value, this.queueContent, true);
              prevDivIndex++;
            } else {
              // Look for a difference between previous queue and new queue.
              if (value != prevAssignId) { // found something that is different.
                if (!this.taskIds.includes(value)) {
                  // Work was added here at prevDivIndex because this new work is not in previous queue.
                  if (this.dLog(2)) console.info('%cAdd job in queue.',CONSOLE_DEBUG);
                  this.addToLog(newInfo[value], value, prevHits[prevDivIndex], false);
                  prevDivIndex++;
                  prevHits = $(this.queueContent).find("div");
                } else { // Previous jobs were returned at prevDivIndex because the new work was in previous queue
                  do {
                    if (this.dLog(2)) console.info('%cRemove job because it was returned or submitted.',CONSOLE_DEBUG);
                    $(prevHits[prevDivIndex]).remove();
                    prevHits = $(this.queueContent).find('div');
                    prevAssignId = $(prevHits[prevDivIndex]).data('taskId');
                  } while (prevAssignId !== value); // For multiple jobs returned at once.
                }
                this.queueIsNew = true;
              }
              if (prevAssignId === value) { // Update the time left for this job
                const timeLeft = getTimeLeft(newInfo[value].secondsLeft);
                $(prevHits[prevDivIndex]).find('.pcm_timeLeft').html(timeLeft);
                prevDivIndex++; // Point to the next previous job in queue.
              }
              oldIds.push(value);
            }
          } else {
            if ($(prevHits[prevDivIndex]).data('taskId') === value) {
              if (this.dLog(2)) console.info('%cJob has been expired so don\'t show it.',CONSOLE_DEBUG);
              $(prevHits[prevDivIndex]).remove();
              prevHits = $(this.queueContent).find("div");
            }
          }
        });
        // Check if previous jobs were returned from end of queue so need to be removed manually.
        if (!addedToEnd && newIds.length < prevHits.length) $(prevHits[newIds.length-1]).nextAll('div').remove();
      } else if (newIds.length > 0) {
        // Previous queue is empty and new queue has something so just add the new work.
        this.queueIsNew = true;
        newIds.forEach( (key) => { // Make sure ALL work is added
          if (this.dLog(2)) console.info('%cAdd jobs to empty queue.',CONSOLE_DEBUG);
          if (newInfo[key].secondsLeft!==-1) this.addToLog(newInfo[key], key, this.queueContent, true);
        });
      }
      this.taskIds = Array.from(newIds); this.taskInfo = Object.assign({}, newInfo);
      // Let's find out if an alarm should be alerted because of a low timer
      let firstTimeLeft = queueResults[0].time_to_deadline_in_seconds;
      if (firstTimeLeft!==-1 && globalOpt.checkQueueAlert(firstTimeLeft)) { // -1 means expired
        if (globalOpt.isQueueAlert()) $(this.queueContent).closest(".tab-pane").stop(true,true).effect( "highlight", {color:"#ff0000"}, 3600 );
        if (globalOpt.isQueueAlarm()) alarms.doQueueAlarm();
      }
    } else if (prevHits.length>0) { $(this.queueContent).empty(); this.taskIds.length = 0; this.taskInfo = Object.assign({}, {}); }
  }
  /**
   * Update the queue watch captcha counter.
   * @param  {number} captchaCount - The counter for the captcha text in queue watch.
   */
  updateCaptcha(captchaCount) {
    if (captchaCount!==null) this.tabs.updateCaptcha(captchaCount);
  }
	/**
	 * Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
   * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}							  - True if this error is permitted to show.
	 */
	dError(levelNumber) { return dError(levelNumber, 'LogTabsClass'); }
	/**
	 * Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}							  - True if this message is permitted to show.
	 */
	dLog(levelNumber) { return dLog(levelNumber, 'LogTabsClass'); }
}
