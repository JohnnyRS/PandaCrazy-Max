class LogTabsClass {
  constructor() {
    this.tabs = new TabbedClass($(`#pcm_logSection`), `pcm_logTabs`, `pcm_tabbedlogs`, `pcm_logTabContents`);
    this.ids = [];
    this.tabs.tabIds += "l";
    this.ids.push(this.tabs.addTab("Accepted")); // ids[0]
    this.ids.push(this.tabs.addTab("Status log")); // ids[1]
    this.ids.push(this.tabs.addTab("Queue Watch", true)); // ids[2]
    this.assignIds = [];
    this.taskInfo = {};
    this.queueTab = $(`#${this.ids[2].tabId}`);
    this.queueContent = $(`<div class="pcm_queueResults"></div>`).appendTo(`#${this.ids[2].tabContent}`);
  }
  addToLog(panda, newInfo, key, element, index, indexAdd, appendTo=true) {
    const hitInfo = newInfo[key], timeLeft = getTimeLeft(hitInfo.secondsLeft);
    const toAdd = $(`<div class="pcm_q01">(${hitInfo.project.requester_name}) [$${hitInfo.project.monetary_reward.amount_in_dollars.toFixed(2)}] - <span class="pcm_timeLeft" style="color:cyan;">${timeLeft}</span> - ${hitInfo.project.title}</div>`).data('assignId',key);
    if (appendTo) $(toAdd).appendTo(element);
    else $(toAdd).insertBefore(element);
    $(toAdd).append(" :: ");
    createLink(toAdd, "pcm_returnLink", "#", "Return", "_blank", (e) => {
      const returnLink = "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "ref=w_wp_rtrn_top");
      fetch(returnLink, { method: 'POST', credentials: `include`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: "_method=delete&authenticity_token=" + encodeURIComponent(panda.authenticityToken)
      }).then( res => console.log("ok: ",res) ).catch( err => console.log("error:",err) );
      e.preventDefault();
    });
    $(toAdd).append(" :: ");
    createLink(toAdd, "pcm_continueLink", "https://worker.mturk.com" + hitInfo.task_url.replace("ref=w_pl_prvw", "from_queue=true"), "Continue Work", "_blank", (e) => {
        const theHeight=window.outerHeight-80, theWidth=window.outerWidth-10;
        window.open($(e.target).attr("href"),"_blank","width=" + theWidth + ",height=" +  theHeight + ",scrollbars=yes,toolbar=yes,menubar=yes,location=yes");
        e.preventDefault();
    });
    if (indexAdd) index++;
    return index;
  }
  addIntoQueue(panda, hitInfo, hitInfo2, task_url="") {
    if (this.assignIds.includes(hitInfo.taskId)) return null;
    let found =this.assignIds.findIndex( key => { return this.taskInfo[key].secondsLeft>hitInfo.assignedTime; } );
    this.assignIds.splice( ((found===-1) ? this.assignIds.length-1 : found-1), 0, hitInfo.taskId );
    const newInfo = { project: { assignable_hits_count:hitInfo.hitsAvailable, assignment_duration_in_seconds:hitInfo.assignedTime, creation_time:hitInfo2.creationTime, description:hitInfo.description, latest_expiration_time:hitInfo.expires, monetary_reward:{amount_in_dollars:hitInfo.price}, requester_name:hitInfo.reqName, title:hitInfo.title}, secondsLeft:hitInfo.assignedTime, task_id:hitInfo.task_id, task_url:task_url.replace("&auto_accept=true","")};
    this.taskInfo[hitInfo.taskId] = newInfo;
    if (found===-1) this.addToLog(panda, this.taskInfo, hitInfo.taskId, this.queueContent, 0, false, true);
    else this.addToLog(panda, this.taskInfo, hitInfo.taskId, $(this.queueContent).find("div")[found], 0, false, false);
  }
  updateQueue(panda, queueResults) {
    let prevHits = $(this.queueContent).find("div");
    $(this.queueTab).find("span").html(`Queue Watch - ${queueResults.length}`);
    if (queueResults.length > 0) {
      let newIds = [], newInfo = {};
      queueResults.forEach( (value) => { newIds.push(value.assignment_id); newInfo[value.assignment_id] = {project:value.project, secondsLeft:value.time_to_deadline_in_seconds, task_url:value.task_url.replace(".json","")}; } );
      if (prevHits.length >  0) {
        let prevDivIndex = 0, addedToEnd = false;
        newIds.forEach( (value, index) => { // seconds is -1 then expired
          if (index===0 && newInfo[value].secondsLeft!==-1 && panda.globalOpt.checkQueueAlert(newInfo[value].secondsLeft)) {
            if (panda.globalOpt.isQueueAlert()) $(this.queueContent).closest(".tab-pane").stop(true,true).effect( "highlight", {color:"#ff0000"}, 3600 );
            if (panda.globalOpt.isQueueAlarm()) alarms.doQueueAlarm();
          }
          if (newInfo[value].secondsLeft!==-1 && prevDivIndex >= prevHits.length) { // hit added to end
            addedToEnd = true;
            prevDivIndex = this.addToLog(panda, newInfo, value, this.queueContent, prevDivIndex, true, true); }
          else {
            let prevAssignId = $(prevHits[prevDivIndex]).data('assignId'), nomore = false, deleted = false;
            while (!nomore && prevAssignId !== value) {
              if (newInfo[value].secondsLeft!==-1 && !this.assignIds.includes(value)) {
                prevDivIndex = this.addToLog(panda, newInfo, value, prevHits[prevDivIndex], prevDivIndex, true, false);
                nomore=true;
              } else $(prevHits[prevDivIndex]).remove(); deleted = true;
              prevHits = $(this.queueContent).find("div");
              if (prevDivIndex >= prevHits.length ) nomore=true;
              if (!nomore && deleted) prevAssignId = $(prevHits[prevDivIndex]).data('assignId');
            }
            if (newInfo[value].secondsLeft!==-1 && prevAssignId === value) {
              const timeLeft = getTimeLeft(newInfo[value].secondsLeft);
              $(prevHits[prevDivIndex]).find(`.pcm_timeLeft`).html(timeLeft);
              prevDivIndex++;
            }
          }
        });
        if (!addedToEnd && newIds.length < prevHits.length) $(prevHits[newIds.length-1]).nextAll('div').remove();
      } else if (newIds.length > 0) {
        newIds.forEach( (key) => {
          if (newInfo[key].secondsLeft!==-1) this.addToLog(panda, newInfo, key, this.queueContent, 0, false, true);
        });
      }
      this.assignIds = Array.from(newIds); this.taskInfo = Object.assign({}, newInfo);
    } else if (prevHits.length >  0) { $(this.queueContent).empty(); this.assignIds.length = 0; this.taskInfo = Object.assign({}, {}); }
  }
  updateCaptcha(captchaCount) {
    if (captchaCount!==null) this.tabs.updateCaptcha(captchaCount);
  }
}
