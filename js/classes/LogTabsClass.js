/** A class that deals with the queue watch, accepted hits and status log on the bottom.
 * It will also take care of how the logs are displayed on the UI page.
 * @class LogTabsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class LogTabsClass {
  constructor() {
    this.tabs = new TabbedClass($(`#pcm_logSection`), `pcm_logTabs`, `pcm_tabbedlogs`, `pcm_logTabContents`);
    this.ids = [];                      // Array of the id names of the log tabs on the bottom.
    this.taskIds = [];                  // Array of the task id's of the hits in the queue for queue watch.
    this.taskInfo = {};                 // Object of all the hits in the queue for queue watch.
    this.queueTab = null;               // The tab for the queue watch.
    this.queueContent = null;           // The contents for the queue watch.
    this.acceptContent = null;          // The contents for the accepted tab.
    this.statusContent = null;          // The contents for the status tab.
    this._queueTotal = 0;
    this._queueIsNew = false;
    this.queueUpdating = false;
    this.queueAdding = false;
  }
	/** Getter to return if the queue has actually changed.
	 * @return {bool} - True if there was anything new that changed in mturk queue. */
	get queueIsNew() { return this._queueIsNew; }
	/** Setter to change if queue has actually changed. If it did change then do skipped check on jobs.
	 * @param {bool} v - Set if there was anything new that changed in mturk queue. */											
	set queueIsNew(v) { this._queueIsNew = v; if (v) { bgPanda.doNewChecks(); } }
  /** Gets the total hits in the queue.
   * @return {number} - Total hits in the queue. */
  get queueTotal() { return this._queueTotal; }
	/** Setter to change the total amount of hits in queue. If changed then do skipped check on jobs.
	 * @param {bool} v - Set the total number of hits in queue. */											
	set queueTotal(v) {
    if (v !== this._queueTotal) {
      this._queueTotal = v;
      bgPanda.doNewChecks();
    }
  }
  /** Prepare the tabs on the bottom and placing the id names in an array.
   * @async          - To wait for the tabs to be prepared and displayed from the database.
   * @return {array} - Success message array and then error object in an array. */
  async prepare() {
    let [success, err] = await this.tabs.prepare();
    if (!err) {
      this.tabs.tabIds += "l"; // Adds a l letter to the id tab names representing these are log tabs.
      this.ids.push(await this.tabs.addTab("Accepted")); // ids[0]
      this.ids.push(await this.tabs.addTab("Status log")); // ids[1]
      this.ids.push(await this.tabs.addTab("Queue Watch", true)); // ids[2]
      this.queueTab = $(`#${this.ids[2].tabId}`);
      this.acceptContent = $(`<div class="pcm_acceptedHits"></div>`).appendTo(`#${this.ids[0].tabContent}`)
      this.statusContent = $(`<div class="pcm_hitStatus"></div>`).appendTo(`#${this.ids[1].tabContent}`)
      this.queueContent = $(`<div class="pcm_queueResults"></div>`).appendTo(`#${this.ids[2].tabContent}`);
    }
    return [success, err];
  }
  /** Add the hit information to the log and either append or before element passed.
   * @param  {object} hitInfo       - Object with information of the new hit being added to the log.
   * @param  {object} element       - Element to append this hit to in the log tab.
   * @param  {bool} [appendTo=true] - Should this be appended to element or before element? */
  addToWatch(hitInfo, element, appendTo=true) {
    if (!this.taskIds.includes(hitInfo.task_id)) {
      const timeLeft = getTimeLeft(hitInfo.secondsLeft);
      let toAdd = $(`<div class="pcm_queue">(${hitInfo.project.requester_name}) [$${hitInfo.project.monetary_reward.amount_in_dollars.toFixed(2)}] - <span class="pcm_timeLeft" style="color:cyan;">${timeLeft}</span> - ${hitInfo.project.title}</div>`).data('taskId',hitInfo.task_id);
      if (appendTo) toAdd.appendTo(element);
      else toAdd.insertBefore(element);
      toAdd.append(" :: ");
      createLink(toAdd, "pcm_returnLink", "#", "Return", "_blank", (e) => {
        modal = new ModalClass();
        modal.showDialogModal("700px", "Return this hit?", `Do you really want to return this hit:<br> ${hitInfo.project.requester_name} - ${hitInfo.project.title}`, () => {
          let returnLink = "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "ref=w_wp_rtrn_top");
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
      toAdd.append(" :: ");
      createLink(toAdd, "pcm_continueLink", "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "from_queue=true"), "Continue Work", "_blank", (e) => {
          let theHeight = window.outerHeight-80, theWidth = window.outerWidth-10;
          window.open($(e.target).attr("href"),"_blank","width=" + theWidth + ",height=" +  theHeight + ",scrollbars=yes,toolbar=yes,menubar=yes,location=yes");
          e.preventDefault();
      });
      if (this.dLog(3)) console.info(`%cNew to queue: {title: ${hitInfo.project.title}, task_id:${hitInfo.task_id}, hit_set_id:${hitInfo.project.hit_set_id}, assignment_id:${hitInfo.assignment_id}, requester_id:${hitInfo.project.requester_id}, requester_name:${hitInfo.project.requester_name}}`,CONSOLE_DEBUG);
      toAdd = null;
    }
  }
  /** Add a new hit accepted into the queue in the correct position according to seconds left.
   * @param  {object} hitInfo       - Object of the panda job from panda class.
   * @param  {object} hitInfo2      - Hit information from mturk queue results.
   * @param  {object} data          - Saved data from panda class just in case it gets removed.
   * @param  {string} [task_url=""] - The task url from the fetch results. */
  addIntoQueue(hitInfo, hitInfo2, data, task_url="") {
    this.addIntoQueue.counter = (this.addIntoQueue.counter) ? this.addIntoQueue.counter++ : 0;
    if (this.queueUpdating && this.addIntoQueue.counter<1000) // Check if currently updating queue.
      setTimeout(this.addIntoQueue.bind(this), 30, hitInfo, hitInfo2, data, task_url);
    else { // If not currently updating queue then add hit to queue watch.
      if (!this.taskIds.includes(data.taskId)) { // Make sure hit not in queue already.
        this.queueAdding = true;
        let found =this.taskIds.findIndex( key => { return this.taskInfo[key].secondsLeft > data.assignedTime; } );
        this.taskIds.splice( ((found===-1) ? this.taskIds.length-1 : found-1), 0, data.taskId );
        let newInfo = { project: {assignable_hits_count:data.hitsAvailable, assignment_duration_in_seconds:hitInfo2.assignmentDurationInSeconds, hit_set_id:data.groupId, creation_time:hitInfo2.creationTime, description:data.description, latest_expiration_time:hitInfo2.expirationTime, monetary_reward:{amount_in_dollars:data.price}, requester_name:data.reqName, requester_id:data.reqId, title:data.title}, secondsLeft:hitInfo2.assignmentDurationInSeconds, task_id:hitInfo2.task_id, assignment_id:hitInfo2.assignment_id, task_url:task_url.replace("&auto_accept=true","")};
        if (found===-1) this.addToWatch(newInfo, this.queueContent, true);
        else this.addToWatch(newInfo, this.queueContent.find("div")[found], false);
        this.taskInfo[data.taskId] = newInfo; this.taskIds.push(data.taskId);
        this.queueTab.find("span").html(`Queue Watch - ${this.queueTotal}`);
        newInfo = null;
      }
      this.queueAdding = false;
    }
  }
  /** Update the queue watch with newer hits and update time left in the queue watch.
   * This will figure out if there are any new hits and add it in the correct position.
   * Also will figure out if a hit was removed from queue and remove it from queue watch.
   * @param  {object} queueResults - Object of all the hits on the mturk queue. */
  updateQueue(queueResults) {
    this.updateQueue.counter = (this.updateQueue.counter) ? this.updateQueue.counter++ : 0;
    if (this.queueAdding && this.updateQueue.counter<1000) // Check if currently updating queue.
      setTimeout(this.updateQueue.bind(this), 30, queueResults);
    else {
      let newIds = [], newInfo = {}, oldIds = [];
      this.queueTotal = queueResults.length; this.queueUpdating = true;
      this.queueTab.find("span").html(`Queue Watch - ${this.queueTotal}`);
      let prevHits = this.queueContent.find("div");
      if (this.queueTotal === 0 && prevHits.length > 0) {
        this.queueContent.empty(); this.taskIds.length = 0; this.taskInfo = Object.assign({}, {});
      } else if (this.queueTotal > 0) {
        let counter = 0, theSame = true;
        for (const value of queueResults) {
          const taskId = value.task_id;
          newIds.push(taskId);
          newInfo[taskId] = {project:value.project, secondsLeft:value.time_to_deadline_in_seconds, task_id:taskId, assignment_id:value.assignment_id, task_url:value.task_url.replace(".json","")};
          if (prevHits.length === 0) this.addToWatch(newInfo[taskId], this.queueContent, true);
          else if (counter < prevHits.length && taskId !== $(prevHits[counter]).data('taskId')) theSame = false;
          counter++;
        }
        if (counter!==prevHits.length) theSame = false;
        if (prevHits.length > 0) {
          if (!theSame) {
            for (const hit of prevHits) {
              oldIds.push($(hit).data('taskId'));
            }
            let difference2 = oldIds.map( (x, i) => { if (!newIds.includes(x)) return i; } ).filter(x => (x>=0));
            if (difference2.length > 0 ) {
              for (const index of difference2) {
                $(prevHits[index]).remove();
              }
            }
            let difference1 = newIds.filter(x => !oldIds.includes(x));
            if (difference1.length > 0 ) {
              for (const taskId of difference1) {
                let currentHits = this.queueContent.find("div");
                let i = 0, newTimeLeft = newInfo[taskId].secondsLeft, found = false, prevSeconds = -1;
                while (i < currentHits.length && !found) {
                  let taskId = $(currentHits[i]).data('taskId');
                  let secondsLeft = (newInfo.hasOwnProperty(taskId)) ? newInfo[taskId].secondsLeft : prevSeconds;
                  if (newTimeLeft > secondsLeft) i++;
                  else found = true;
                }
                if (i >= currentHits.length) this.addToWatch(newInfo[taskId], this.queueContent, true);
                else this.addToWatch(newInfo[taskId], this.queueContent.find("div")[i], false);
                currentHits = null;
              }
            }
          }
        }
        this.taskIds = Array.from(newIds); this.taskInfo = Object.assign({}, newInfo);
        let queueWatch = this.queueContent.find("div"), firstOne = true;
        for (const hit of queueWatch) {
          const taskId = $(hit).data('taskId');
          const timeLeft = getTimeLeft(newInfo[taskId].secondsLeft);
          $(hit).find('.pcm_timeLeft').html(timeLeft);
          if (newInfo[taskId].secondsLeft < 0) $(hit).css('text-decoration', 'line-through');
          else if (firstOne) {
            if (globalOpt.checkQueueAlert(newInfo[taskId].secondsLeft)) {
              if (globalOpt.isQueueAlert()) this.queueContent.closest(".tab-pane")
                .stop(true,true).effect( "highlight", {color:"#ff0000"}, 3600 );
              if (globalOpt.isQueueAlarm()) alarms.doQueueAlarm();
            }
            firstOne = false;
          }
        }
        queueWatch = null;
      }
      newIds = []; oldIds = [];
      this.queueUpdating = false; prevHits = newInfo = null;
    }
  }
  /** Update the queue watch captcha counter.
   * @param  {number} captchaCount - The counter for the captcha text in queue watch. */
  updateCaptcha(captchaCount) {
    if (captchaCount!==null) this.tabs.updateCaptcha(captchaCount);
  }
  /** Add accepted hit to the accepted log and limit it to a maximum hits shown.
   * @param  {object} data - The data for the job to display that was accepted. */
  addToLog(data) {
    let divHits = this.acceptContent.find('div');
    if (divHits.length >= 100) divHits[divHits.length - 1].remove();
    let now = moment().format('ddd hh:mma');
    const requester = (data.friendlyReqName !== "") ? data.friendlyReqName : data.reqName;
    const title = (data.friendlyTitle) ? data.friendlyTitle : data.title;
    this.acceptContent.prepend(`<div class='pcm_log'>${requester} - <span>${data.groupId}</span> [<span class='time'>${now}</span>] - ${title}</div>`);
    divHits = now = null;
  }
  /** Adds the status for this panda job with the unique ID to the status log tab.
   * @param  {object} data  - Object of the data from the panda job with the unique number ID.
   * @param  {object} stats - Object with the stats for this panda job with the unique number ID.
   * @param  {number} myId  - The unique ID for a panda job. */
  addToStatus(data, stats, myId) {
    const requester = (data.friendlyReqName !== "") ? data.friendlyReqName : data.reqName;
    this.statusContent.append(`<div class='pcm_${myId}'><span class='pcm_emp'>Requester:</span> <span class='requester'>${requester}</span> | <span class='pcm_emp'>Pay:</span> $<span class='pay'>${Number(data.price).toFixed(2)}</span> | <span class='pcm_emp'>Mode:</span> panda | <span class='pcm_emp'>Accepted:</span> <span class='accepted'>${stats.accepted.value}</span> | <span class='pcm_emp'>Fetched:</span> <span class='fetched'>${stats.fetched.value}</span> | <span class='pcm_emp'>Elapsed:</span> <span class='elapsed'>0.0s</span></div>`);
  }
  /** Display the stats from panda job with the unique ID on the status tab or the changes to requester name and pay.
   * @param  {object} stats          - The stats for this panda job with the unique ID.
   * @param  {number} myId           - The unique ID for a panda job.
   * @param  {number} seconds        - Number of seconds elapsed from last time job fetched url.
   * @param  {object} [changes=null] - The changes to data that needs to be shown in status tab. */
  updateLogStatus(stats, myId, milliseconds, changes=null) {
    if (stats) {
      this.statusContent.find(`.pcm_${myId} .fetched:first`).html(stats.fetched.value);
      this.statusContent.find(`.pcm_${myId} .accepted:first`).html(stats.accepted.value);
      if (milliseconds>0) {
        let elapsedSeconds = (Math.round( (milliseconds / 1000) * 10 ) / 10).toFixed(1);
        this.statusContent.find(`.pcm_${myId} .elapsed:first`).html(elapsedSeconds + 's');
      }
    } else if (changes) {
      const requester = (changes.friendlyReqName !== "") ? changes.friendlyReqName : changes.reqName;
      this.statusContent.find(`.pcm_${myId} .requester:first`).html(requester);
      this.statusContent.find(`.pcm_${myId} .pay:first`).html(Number(changes.price).toFixed(2));
    }
  }
  /** Remove a status line from the status tab giving it 12 seconds before removal.
   * @param  {number} myId - The unique ID for a panda job. */
  removeFromStatus(myId) {
    this.statusContent.find(`.pcm_${myId}`).removeClass(`pcm_${myId}`).addClass(`pcm_${myId}-stop`)
      .css('background-color', '#260000');
    setTimeout( () => { this.statusContent.find(`.pcm_${myId}-stop`).remove(); }, 12000);
  }
	/** Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
   * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}							  - True if this error is permitted to show. */
	dError(levelNumber) { return dError(levelNumber, 'LogTabsClass'); }
	/** Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}							  - True if this message is permitted to show. */
	dLog(levelNumber) { return dLog(levelNumber, 'LogTabsClass'); }
}
