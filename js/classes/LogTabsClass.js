/**
 */
class LogTabsClass {
  constructor() {
    this.tabs = new TabbedClass($(`#pcm_logSection`), `pcm_logTabs`, `pcm_tabbedlogs`, `pcm_logTabContents`);
    this.ids = [];
    this.assignIds = [];
    this.taskInfo = {};
    this.queueTab = null;
    this.queueContent = null;
  }
  /**
   */
  async prepare() {
    let [success, err] = await this.tabs.prepare();
    if (!err) {
      this.tabs.tabIds += "l";
      this.ids.push(await this.tabs.addTab("Accepted")); // ids[0]
      this.ids.push(await this.tabs.addTab("Status log")); // ids[1]
      this.ids.push(await this.tabs.addTab("Queue Watch", true)); // ids[2]
      this.queueTab = $(`#${this.ids[2].tabId}`);
      this.queueContent = $(`<div class="pcm_queueResults"></div>`).appendTo(`#${this.ids[2].tabContent}`);
    }
    return [success, err];
  }
  /**
   * @param  {object} newInfo
   * @param  {string} key
   * @param  {object} element
   * @param  {number} index
   * @param  {bool} indexAdd
   * @param  {bool} appendTo=true
   */
  addToLog(newInfo, key, element, index, indexAdd, appendTo=true) {
    const hitInfo = newInfo[key], timeLeft = getTimeLeft(hitInfo.secondsLeft);
    const toAdd = $(`<div class="pcm_q01">(${hitInfo.project.requester_name}) [$${hitInfo.project.monetary_reward.amount_in_dollars.toFixed(2)}] - <span class="pcm_timeLeft" style="color:cyan;">${timeLeft}</span> - ${hitInfo.project.title}</div>`).data('assignId',key);
    if (appendTo) $(toAdd).appendTo(element);
    else $(toAdd).insertBefore(element);
    $(toAdd).append(" :: ");
    createLink(toAdd, "pcm_returnLink", "#", "Return", "_blank", (e) => {
      const returnLink = "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "ref=w_wp_rtrn_top");
      console.log(returnLink,bgPanda.authenticityToken)
      fetch(returnLink, { method: 'POST', credentials: `include`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: "_method=delete&authenticity_token=" + encodeURIComponent(bgPanda.authenticityToken)
      }).then( res => { logThis(1, "LogTabsClass", `Returned hit: ${res}`); console.log(res); }
      ).catch( error => { logError(2, "LogTabsClass", `Returned hit error: ${error}`); console.log(res); } );
      e.preventDefault();
    });
    $(toAdd).append(" :: ");
    createLink(toAdd, "pcm_continueLink", "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "from_queue=true"), "Continue Work", "_blank", (e) => {
        const theHeight=window.outerHeight-80, theWidth=window.outerWidth-10;
        window.open($(e.target).attr("href"),"_blank","width=" + theWidth + ",height=" +  theHeight + ",scrollbars=yes,toolbar=yes,menubar=yes,location=yes");
        e.preventDefault();
    });
    if (indexAdd) index++;
    logThis(3, "LogTabsClass",`new to queue: {title: ${escape(hitInfo.project.title)}, hit_set_id: ${hitInfo.project.hit_set_id}, requester_id: ${hitInfo.project.requester_id}, requester_name: ${escape(hitInfo.project.requester_name)}}`);
    return index;
  }
  /**
   * @param  {object} hitInfo
   * @param  {object} hitInfo2
   * @param  {object} data
   * @param  {string} task_url=""
   */
  addIntoQueue(hitInfo, hitInfo2, data, task_url="") {
    if (this.assignIds.includes(hitInfo.taskId)) return null; // Hit already in queue so don't add.
    let found =this.assignIds.findIndex( key => { return this.taskInfo[key].secondsLeft>hitInfo.assignedTime; } );
    this.assignIds.splice( ((found===-1) ? this.assignIds.length-1 : found-1), 0, hitInfo.taskId );
    const newInfo = { project: {assignable_hits_count:hitInfo.hitsAvailable, assignment_duration_in_seconds:hitInfo2.assignmentDurationInSeconds, creation_time:hitInfo2.creationTime, description:data.description, latest_expiration_time:hitInfo2.expirationTime, monetary_reward:{amount_in_dollars:data.price}, requester_name:data.reqName, title:data.title}, secondsLeft:hitInfo2.assignmentDurationInSeconds, task_id:data.taskId, task_url:task_url.replace("&auto_accept=true","")};
    this.taskInfo[hitInfo.taskId] = newInfo;
    if (found===-1) this.addToLog(this.taskInfo, hitInfo.taskId, this.queueContent, 0, false, true);
    else this.addToLog(this.taskInfo, hitInfo.taskId, $(this.queueContent).find("div")[found], 0, false, false);
  }
  /**
   * @param  {object} queueResults
   */
  updateQueue(queueResults) {
    let prevHits = $(this.queueContent).find("div");
    $(this.queueTab).find("span").html(`Queue Watch - ${queueResults.length}`);
    if (queueResults.length > 0) {
      let newIds = [], newInfo = {}, oldIds = []; // oldIds is used for duplication error checking
      queueResults.forEach( (value) => { newIds.push(value.assignment_id); newInfo[value.assignment_id] = {project:value.project, secondsLeft:value.time_to_deadline_in_seconds, task_url:value.task_url.replace(".json","")}; } );
      if (prevHits.length > 0) {
        // Some previous jobs are still in queue. Let's compare and find out if something was added or removed.
        let prevDivIndex = 0, addedToEnd = false;
        newIds.forEach( (value, index) => {
          if (newInfo[value].secondsLeft!==-1) { // make sure job isn't expired.
            let prevAssignId = $(prevHits[prevDivIndex]).data('assignId');
            if (oldIds.includes(prevAssignId)) 
              logError(0,"LogTabsClass",`Duplication error found. Not adding job to queue.`);
            else if (prevDivIndex >= prevHits.length) { // There are more jobs in new queue than old queue.
              logThis(2,"LogTabsClass",`Add job to end of queue.`);
              addedToEnd = true;
              prevDivIndex = this.addToLog(newInfo, value, this.queueContent, prevDivIndex, true, true);
            } else {
              // Look for a difference between previous queue and new queue.
              if (value != prevAssignId) { // found something that is different.
                if (!this.assignIds.includes(value)) {
                  // Work was added here at prevDivIndex because this new work is not in previous queue.
                  logThis(2,"LogTabsClass",`Add job in queue.`);
                  prevDivIndex = this.addToLog(newInfo, value, prevHits[prevDivIndex], prevDivIndex, true, false);
                  prevHits = $(this.queueContent).find("div");
                } else { // Previous jobs were returned at prevDivIndex because the new work was in previous queue
                  do {
                    logThis(2,"LogTabsClass",`Remove job from queue because it was returned.`);
                    $(prevHits[prevDivIndex]).remove();
                    prevHits = $(this.queueContent).find("div");
                    prevAssignId = $(prevHits[prevDivIndex]).data('assignId');
                  } while (prevAssignId !== value); // for multiple jobs returned at once.
                }
              }
              if (prevAssignId === value) { // Update the time left for this job
                const timeLeft = getTimeLeft(newInfo[value].secondsLeft);
                $(prevHits[prevDivIndex]).find(`.pcm_timeLeft`).html(timeLeft);
                prevDivIndex++; // Point to the next previous job in queue.
              }
              oldIds.push(value);
            }
          } else {
            if ($(prevHits[prevDivIndex]).data('assignId') === value) {
              logThis(2,"LogTabsClass",`Job has been expired and still in previous.`);
              $(prevHits[prevDivIndex]).remove();
              prevHits = $(this.queueContent).find("div");
            }
          }
        });
        // check if previous jobs were returned from end of queue so need to be removed manually.
        if (!addedToEnd && newIds.length < prevHits.length) $(prevHits[newIds.length-1]).nextAll('div').remove();
      } else if (newIds.length > 0) {
        // Previous queue is empty and new queue has something so just add the new work.
        newIds.forEach( (key) => { // make sure ALL work is added
          logThis(2,"LogTabsClass",`Add jobs to empty queue.`);
          if (newInfo[key].secondsLeft!==-1) this.addToLog(newInfo, key, this.queueContent, 0, false, true);
        });
      }
      this.assignIds = Array.from(newIds); this.taskInfo = Object.assign({}, newInfo);
      // Let's find out if an alarm should be alerted because of a low timer
      let firstTimeLeft = queueResults[0].time_to_deadline_in_seconds;
      if (firstTimeLeft!==-1 && globalOpt.checkQueueAlert(firstTimeLeft)) { // -1 means expired
        if (globalOpt.isQueueAlert()) $(this.queueContent).closest(".tab-pane").stop(true,true).effect( "highlight", {color:"#ff0000"}, 3600 );
        if (globalOpt.isQueueAlarm()) alarms.doQueueAlarm();
      }
    } else if (prevHits.length>0) { $(this.queueContent).empty(); this.assignIds.length = 0; this.taskInfo = Object.assign({}, {}); }
  }
  /**
   * @param  {number} captchaCount
   */
  updateCaptcha(captchaCount) {
    if (captchaCount!==null) this.tabs.updateCaptcha(captchaCount);
  }
}
