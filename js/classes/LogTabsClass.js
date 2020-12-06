/** A class that deals with the queue watch, accepted HITs and status log on the bottom.
 * @class LogTabsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class LogTabsClass {
  constructor() {
    this.tabs = new TabbedClass($(`#pcm-logSection`), `pcm-logTabs`, `pcm-tabbedlogs`, `pcm-logTabContents`);
    this.ids = [];                      // Array of the id names of the log tabs on the bottom.
    this.taskIds = [];                  // Array of the task id's of the HITs in the queue for queue watch.
    this.groupIds = [];                 // Array of the group id's of the HITs in the queue for queue watch.
    this.payRate = [];                  // Array of the pay rate for each HIT in queue.
    this.taskInfo = {};                 // Object of all the HITs in the queue for queue watch.
    this.queueTab = null;               // The tab for the queue watch.
    this.queueContent = null;           // The contents for the queue watch.
    this.acceptContent = null;          // The contents for the accepted tab.
    this.statusContent = null;          // The contents for the status tab.
    this.tabContentsHeight = 0;
    this.tabNavHeight = 0;  
    this.queuePrice = 0;
    this._queueTotal = 0;
    this._queueIsNew = false;
    this.queueUpdating = false;
    this.queueAdding = false;
    this.bgLowTimeHighlighterDef = '#ff0000'; this.bgLowTimeHighlighter = null;
  }
	/** Getter to return if the queue has actually changed.
	 * @return {bool} - True if there was anything new that changed in mturk queue. */
	get queueIsNew() { return this._queueIsNew; }
	/** Setter to change if queue has actually changed. If it did change then do skipped check on jobs.
	 * @param {bool} v - Set if there was anything new that changed in mturk queue. */											
	set queueIsNew(v) { this._queueIsNew = v; if (v) { bgPanda.doNewChecks(); } }
  /** Gets the total HITs in the queue.
   * @return {number} - Total HITs in the queue. */
  get queueTotal() { return this._queueTotal; }
	/** Setter to change the total amount of HITs in queue. If changed then do skipped check on jobs.
	 * @param {bool} v - Set the total number of HITs in queue. */											
	set queueTotal(v) {
    if (v !== this._queueTotal) { this._queueTotal = v; bgPanda.doNewChecks(); }
    this.queuePrice = this.totalResults(); pandaUI.pandaGStats.setTotalValueInQueue(this.queuePrice);
    if (this.queueTab) this.queueTab.find('span').html(`Queue Watch - ${this.queueTotal} - $${this.queuePrice}`);
  }
  /** Prepare the tabs on the bottom and placing the id names in an array.
   * @async          - To wait for the tabs to be prepared and displayed from the database.
   * @return {array} - Success message array and then error object in an array. */
  async prepare() {
    let [success, err] = await this.tabs.prepare();
    this.bgLowTimeHighlighter = getCSSVar('bgLowTimeHighlighter', this.bgLowTimeHighlighterDef);
    if (!err) {
      this.tabs.tabIds += 'l'; // Adds a l letter to the id tab names representing these are log tabs.
      this.ids.push(await this.tabs.addTab('Accepted')); // ids[0]
      this.ids.push(await this.tabs.addTab('Status log')); // ids[1]
      this.ids.push(await this.tabs.addTab('Queue Watch', true)); // ids[2]
      this.queueTab = $(`#${this.ids[2].tabId}`);
      this.acceptContent = $(`<div class='pcm-acceptedHits'></div>`).appendTo(`#${this.ids[0].tabContent}`)
      this.statusContent = $(`<div class='pcm-hitStatus'></div>`).appendTo(`#${this.ids[1].tabContent}`)
      this.queueContent = $(`<div class='pcm-queueResults'></div>`).appendTo(`#${this.ids[2].tabContent}`);
    }
    this.tabContentsHeight = $('#pcm-logTabContents .pcm-tabs:first').height();
    this.tabNavHeight = $('#pcm-tabbedlogs').height();
    return [success, err];
  }
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. */
  resetCSSValues() { this.bgLowTimeHighlighter = getCSSVar('bgLowTimeHighlighter', this.bgLowTimeHighlighterDef); }
  /** Removes all data from class when shutting down to make sure memory is not used anymore. */
  removeAll() { this.tabs.removeAll(); this.ids = []; this.taskIds = []; this.groupIds = []; this.payRate = []; this.taskInfo = {}; this.tabs = null; }
  /** Add the HIT information to the log and either append or before element passed.
   * @param  {object} hitInfo - HIT Info  @param  {object} element - Append Element @param  {bool} [appendTo] - AppendTo or Before? */
  addToWatch(hitInfo, element, appendTo=true) {
    if (!this.taskIds.includes(hitInfo.task_id)) {
      const timeLeft = getTimeLeft(hitInfo.secondsLeft);
      let toAdd = $(`<div class='pcm-queueRow' id='pcm-TI-${hitInfo.task_id}'>(${hitInfo.project.requester_name}) [$${hitInfo.project.monetary_reward.amount_in_dollars.toFixed(2)}] - <span class='pcm-timeLeft'>${timeLeft}</span> - ${hitInfo.project.title}</div>`).data('taskId',hitInfo.task_id);
      if (appendTo) toAdd.appendTo(element); else toAdd.insertBefore(element);
      toAdd.append(' :: ');
      createLink(toAdd, 'pcm-returnLink', '#', 'Return', '_blank', e => {
        modal = new ModalClass();
        modal.showDialogModal('700px', 'Return this HIT?', `Do you really want to return this HIT:<br> ${hitInfo.project.requester_name} - ${hitInfo.project.title}`, () => {
          let returnLink = 'https://worker.mturk.com' + hitInfo.task_url.replace('ref=w_pl_prvw', 'ref=w_wp_rtrn_top'), taskID = hitInfo.task_id;
          fetch(returnLink, { method: 'POST', credentials: `include`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: '_method=delete&authenticity_token=' + encodeURIComponent(bgPanda.authenticityToken)
          }).then( async res => {
            await res.text();
            if (this.dLog(1)) console.info(`%cReturned HIT status: ${res.status} : ${res.url}`,CONSOLE_INFO);
            if (res.status === 200 && res.statusText === 'OK') { this.removeFromQueue(taskID); setTimeout(() => { modal.closeModal(); }, 400); }
            else modal.closeModal();
          }).catch( error => { if (this.dError(2)) console.error(`Returned HIT error: ${error}`); });
        }, true, true);
        e.preventDefault();
      });
      toAdd.append(' :: ');
      createLink(toAdd, 'pcm-continueLink', 'https://worker.mturk.com' + hitInfo.task_url.replace('ref=w_pl_prvw', 'from_queue=true'), 'Continue Work', '_blank', e => {
          let theHeight = window.outerHeight-80, theWidth = window.outerWidth-10;
          window.open($(e.target).attr('href'),'_blank','width=' + theWidth + ',height=' +  theHeight + ',scrollbars=yes,toolbar=yes,menubar=yes,location=yes');
          e.preventDefault();
      });
      if (this.dLog(3)) console.info(`%cNew to queue: {title: ${hitInfo.project.title}, task_id:${hitInfo.task_id}, hit_set_id:${hitInfo.project.hit_set_id}, assignment_id:${hitInfo.assignment_id}, requester_id:${hitInfo.project.requester_id}, requester_name:${hitInfo.project.requester_name}}`,CONSOLE_DEBUG);
      toAdd = null;
    }
  }
  /** Removes the HIT with the task ID from the queue.
   * @param {string} taskId - The Task ID */
  removeFromQueue(taskId) {
    let theIndex = this.taskIds.indexOf(taskId);
    if (!this.queueUpdating && theIndex !== -1) {
      this.queueUpdating = true; delete this.taskInfo[taskId]; this.taskIds.splice(theIndex, 1); this.groupIds.splice(theIndex, 1); this.payRate.splice(theIndex, 1);
      this.queueTotal = Math.max(this.queueTotal - 1, 0);
      this.queueTab.find('span').html(`Queue Watch - ${this.queueTotal} - $${this.totalResults()}`);
      $(`#pcm-TI-${taskId}`).remove(); this.queueUpdating = false;
    }
  }
  /** Add a new HIT accepted into the queue in the correct position according to seconds left.
   * @param  {object} hitInfo    - Panda Object  @param  {object} hitInfo2 - Mturk HIT Info  @param  {object} data - Data Object.  @param  {string} [task_url] - Task URL */
  addIntoQueue(hitInfo, hitInfo2, data, task_url='') {
    this.addIntoQueue.counter = (this.addIntoQueue.counter) ? this.addIntoQueue.counter++ : 0;
    if (this.queueUpdating && this.addIntoQueue.counter < 1000) // Check if currently updating queue.
      setTimeout(this.addIntoQueue.bind(this), 30, hitInfo, hitInfo2, data, task_url);
    else { // If not currently updating queue then add HIT to queue watch.
      if (!this.taskIds.includes(hitInfo2.task_id)) { // Make sure HIT not in queue already.
        this.queueUpdating = true;
        let found = this.taskIds.findIndex( key => { return this.taskInfo[key].secondsLeft > data.assignedTime; });
        let newInfo = { 'project': {'assignable_hits_count':data.hitsAvailable, 'assignment_duration_in_seconds':hitInfo2.assignmentDurationInSeconds, 'hit_set_id':data.groupId, 'creation_time':hitInfo2.creationTime, 'description':data.description, 'latest_expiration_time':hitInfo2.expirationTime, 'monetary_reward':{'amount_in_dollars':data.price}, 'requester_name':data.reqName, 'requester_id':data.reqId, 'title':data.title}, 'secondsLeft':hitInfo2.assignmentDurationInSeconds, 'task_id':hitInfo2.task_id, 'assignment_id':hitInfo2.assignment_id, 'task_url':task_url.replace('&auto_accept=true','')};
        if (found === -1) this.addToWatch(newInfo, this.queueContent, true);
        else this.addToWatch(newInfo, this.queueContent.find('div')[found], false);
        this.taskIds.splice( ((found === -1) ? this.taskIds.length : found-1), 0, hitInfo2.task_id );
        this.taskInfo[hitInfo2.task_id] = newInfo; this.groupIds.push(data.groupId); this.payRate.push(data.price);
        this.queueTab.find('span').html(`Queue Watch - ${this.queueTotal} - $${this.totalResults()}`);
        newInfo = null;
      }
      this.queueUpdating = false;
    }
  }
  /** Update the queue watch with newer HITs and update time left in the queue watch. Also removes returned HITs with a line-through.
   * @param  {object} queueResults - Object of all the HITs on the mturk queue. */
  updateQueue(queueResults) {
    this.updateQueue.counter = (this.updateQueue.counter) ? this.updateQueue.counter++ : 0;
    if (this.queueUpdating && this.updateQueue.counter < 1000) setTimeout(this.updateQueue.bind(this), 30, queueResults);
    else {
      let newIds = [], newgIds = [], newInfo = {}, oldIds = [], newPayRates = [], prevHits = this.queueContent.find('div');
      this.queueUpdating = true;
      if (queueResults.length === 0 && prevHits.length > 0) {
        this.queueContent.empty(); this.taskIds = []; this.groupIds = []; this.payRate = []; this.taskInfo = {}; this.queueTotal = 0;
      } else if (queueResults.length > 0) {
        let counter = 0, theSame = true;
        for (const value of queueResults) {
          const taskId = value.task_id;
          newIds.push(taskId); newgIds.push(value.project.hit_set_id); newPayRates.push(value.project.monetary_reward.amount_in_dollars);
          newInfo[taskId] = {'project':value.project, 'secondsLeft':value.time_to_deadline_in_seconds, 'task_id':taskId, 'assignment_id':value.assignment_id, 'task_url':value.task_url.replace('.json','')};
          if (prevHits.length === 0) this.addToWatch(newInfo[taskId], this.queueContent, true);
          else if (counter < prevHits.length && taskId !== $(prevHits[counter]).data('taskId')) theSame = false;
          counter++;
        }
        if (counter !== prevHits.length) theSame = false;
        if (prevHits.length > 0) {
          if (!theSame) {
            for (const hit of prevHits) { oldIds.push($(hit).data('taskId')); }
            let difference2 = oldIds.map( (x, i) => { if (!newIds.includes(x)) return i; } ).filter(x => (x>=0));
            if (difference2.length > 0 ) { for (const index of difference2) { $(prevHits[index]).remove(); }}
            let difference1 = newIds.filter(x => !oldIds.includes(x));
            if (difference1.length > 0 ) {
              for (const taskId of difference1) {
                let currentHits = this.queueContent.find('div'), i = 0, newTimeLeft = newInfo[taskId].secondsLeft, found = false, prevSeconds = -1;
                while (i < currentHits.length && !found) {
                  let taskId = $(currentHits[i]).data('taskId'), secondsLeft = (newInfo.hasOwnProperty(taskId)) ? newInfo[taskId].secondsLeft : prevSeconds;
                  if (newTimeLeft > secondsLeft) i++; else found = true;
                }
                if (i >= currentHits.length) this.addToWatch(newInfo[taskId], this.queueContent, true);
                else this.addToWatch(newInfo[taskId], this.queueContent.find('div')[i], false);
                currentHits = [];
              }
            }
            difference1 = []; difference2 = [];
          }
        }
        this.taskIds = Array.from(newIds); this.taskInfo = Object.assign({}, newInfo);
        this.groupIds = Array.from(newgIds); this.payRate = Array.from(newPayRates); this.queueTotal = queueResults.length;
        let queueWatch = this.queueContent.find('div'), firstOne = true;
        for (const hit of queueWatch) {
          const taskId = $(hit).data('taskId'), timeLeft = getTimeLeft(newInfo[taskId].secondsLeft);
          $(hit).find('.pcm-timeLeft').html(timeLeft);
          if (newInfo[taskId].secondsLeft < 0) $(hit).css('text-decoration', 'line-through');
          else if (firstOne) {
            if (globalOpt.checkQueueAlert(newInfo[taskId].secondsLeft)) {
              if (globalOpt.isQueueAlert()) this.queueContent.closest('.tab-pane').stop(true,true).effect( 'highlight', {color:this.bgLowTimeHighlighter}, 3600 );
              if (globalOpt.isQueueAlarm()) alarms.doQueueAlarm(globalOpt.lastQueueAlert);
            }
            firstOne = false;
          }
        }
        queueWatch = [];
      }
      newIds = []; newgIds = []; prevHits = []; oldIds = []; newPayRates = []; this.queueUpdating = false; newInfo = {};
    }
  }
  /** Update the queue watch captcha counter.
   * @param  {number} captchaCount - The counter for the captcha text in queue watch. */
  updateCaptcha(captchaCount) { if (captchaCount !== null) this.tabs.updateCaptcha(captchaCount); }
  /** Add accepted HIT to the accepted log and limit it to a maximum HITs shown.
   * @param  {object} data - The data for the job to display that was accepted. */
  addToLog(data) {
    let divHits = this.acceptContent.find('div');
    if (divHits.length >= 100) divHits[divHits.length - 1].remove();
    let now = moment().format('ddd hh:mma'), requester = (data.friendlyReqName !== '') ? data.friendlyReqName : data.reqName;
    let title = (data.friendlyTitle) ? data.friendlyTitle : data.title;
    this.acceptContent.prepend(`<div class='pcm-log'>${requester} - <span>${data.groupId}</span> [<span class='pcm-timeAccepted'>${now}</span>] - ${title}</div>`);
    divHits = []; now = null;
  }
  /** Adds the status for this panda job with the unique ID to the status log tab.
   * @param  {object} data  - Data Object  @param  {object} stats - Stats Object  @param  {number} myId  - Unique ID for a panda job. */
  addToStatus(data, stats, myId) {
    const requester = (data.friendlyReqName !== '') ? data.friendlyReqName : data.reqName;
    this.statusContent.append(`<div class='pcm-statusRow-${myId}'><span class='pcm-emp'>Requester:</span> <span class='pcm-requesterName'>${requester}</span> | <span class='pcm-emp'>Pay:</span> $<span class='pcm-statusPrice'>${Number(data.price).toFixed(2)}</span> | <span class='pcm-emp'>Mode:</span> panda | <span class='pcm-emp'>Accepted:</span> <span class='pcm-acceptedValue'>${stats.accepted.value}</span> | <span class='pcm-emp'>Fetched:</span> <span class='pcm-fetchedValue'>${stats.fetched.value}</span> | <span class='pcm-emp'>Elapsed:</span> <span class='pcm-elapsedTime'>0.0s</span></div>`);
  }
  /** Display the stats from panda job with the unique ID on the status tab or the changes to requester name and pay.
   * @param  {object} stats - Stats  @param  {number} myId - Unique ID  @param  {number} mSeconds - Elapsed Time  @param  {object} [changes] - Changes Object */
  updateLogStatus(stats, myId, mSeconds, changes=null) {
    if (stats) {
      this.statusContent.find(`.pcm-statusRow-${myId} .pcm-fetchedValue:first`).html(stats.fetched.value);
      this.statusContent.find(`.pcm-statusRow-${myId} .pcm-acceptedValue:first`).html(stats.accepted.value);
      if (mSeconds > 0) {
        let elapsedSeconds = (Math.round( (mSeconds / 1000) * 10 ) / 10).toFixed(1);
        this.statusContent.find(`.pcm-statusRow-${myId} .pcm-elapsedTime:first`).html(elapsedSeconds + 's');
      }
    } else if (changes) {
      const requester = (changes.friendlyReqName !== '') ? changes.friendlyReqName : changes.reqName;
      this.statusContent.find(`.pcm-statusRow-${myId} .pcm-requesterName:first`).html(requester);
      this.statusContent.find(`.pcm-statusRow-${myId} .pcm-statusPrice:first`).html(Number(changes.price).toFixed(2));
    }
  }
  /** Remove a status line from the status tab giving it 12 seconds before removal.
   * @param  {number} myId - The unique ID for a panda job. */
  removeFromStatus(myId) {
    this.statusContent.find(`.pcm-statusRow-${myId}`).addClass(`pcm-status-stop`);
    setTimeout( () => { this.statusContent.find(`.pcm-statusRow-${myId}`).remove(); }, 12000);
  }
	/** Returns the total number recorded of HITs in queue.
	 * @param  {string} [gId] - Group ID to search for and count the HITs in queue.
	 * @return {number}       - Returns the number of group ID HITs or all HITs in queue. */
  totalResults(gId='') {
    let total = 0;
    if (gId && this.groupIds.length) total = arrayCount(this.groupIds, item => item === gId);
    else if (gId === '') total = arrayCount(this.payRate, item => { return item; }, false).toFixed(2);
    return total;
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
