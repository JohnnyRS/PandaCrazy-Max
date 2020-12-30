const locationUrl = window.location.href;
let gParentUrl = document.referrer, gDocTitle = document.title, gHitReturned = false, gInterval = null, gQueuePage = false, gOpenHits = null, gAlreadyOpened = false;
let gHitData = {}, gHitsData = {}, gPrevHit = null, gAssignedHit = null, gGroupId = null, gMyInterval = null, gMonitorOn = false, returnBtn = false, gSessionData = {};
let gGotoHit = 0, gHitSubmitted = null, gPcmRunning = false, gQueueResults = [], gTaskId = null, gPay = null, gIframeAtt = false, gHitLost = false, gReqId = null;
let gNewQueue = false, gHolders = {}, gTabIds = {}, gPositionsTitle = false, gIds = {}, gIdsSession = {}, gIdsDone = false, gTabUnique = null, gUnloading = false; 
let gSessionDefault = {'monitorNext':false, 'gidNext':false, 'ridNext':false}, gOptions = {'mturkPageButtons':true, 'tabUniqueHits':true};
let gPreviewPage = false, gAssignmentPage = false, gHitList = false, gNextGID = null, gNextRID = null, gSubmits = [], gReturns = [], gExtVerified = false;
let secure = ['startcollect', 'stopcollect', 'startgroup', 'stopgroup', 'enableSgroup', 'disableSgroup', 'getJobs', 'getTriggers', 'removeJob', 'removeTrigger', 'getGroups', 'getSGroups', 'pause', 'unpause', 'enableTrigger', 'disableTrigger', 'startSearching', 'stopSearching', 'getStats'];

/** Detects if the extension was restarted or uninstalled.
 * @return {boolean} - Returns if extension is still loaded and hasn't been restarted. */
function extensionLoad() { if (!chrome.app || typeof chrome.app.isInstalled === 'undefined') return false; else return true; }
/** Sends a message to the extension with given values.
 * @param  {string} com     - Command  @param  {object} data    - Data Object  @param  {bool} passHit - Passing HIT Data?  @param  {string} gId     - GroupID
 * @param  {string} [desc]  - Desc     @param  {string} [title] - Title        @param  {string} [rId] - Requester ID       @param  {string} [rName] - Req name
 * @param  {number} [price] - Price    @param  {string} [dur]   - Duration     @param  {number} [hA]  - HITs available     @param  {string} [aI]    - Assign ID
 * @param  {number} [tI]    - Task ID  @param  {number} [hD]    - HIT Data */
function sendToExt(com, data, passHit, gId, desc='', title='', rId='', rName='', price='0.00', dur='', hA=0, aI=null, tI=null, hD=null) {
  if (typeof chrome.app.isInstalled === 'undefined')  {
    if (data) localStorage.setItem('PCM_LastExtCommand', JSON.stringify({'command':com, 'data':data}));
    window.location.reload();
  } else if (passHit) {
    if (rName === '') rName = gId; if (title === '') title = gId;
    chrome.runtime.sendMessage({'command':com, 'groupId':gId, 'description':desc, 'title':title, 'reqId':rId, 'reqName':rName, 'price':price, 'duration':dur, 'hitsAvailable':hA, 'assignmentId':aI, 'taskId':tI, 'hitData':hD, 'data':data});
  } else {
    chrome.runtime.sendMessage({'command':com, 'data': data}, (data) => { localStorage.setItem('JR_message_response', JSON.stringify({'data':data, 'date': new Date().getTime()})); });
  }
}
/** Parses the command string and sends message to extension.
 * @param  {string} command - Command  @param  {object} data    - The data object that was given from a message. */
function parseCommands(command, data) {
  switch (command) {
    case 'accepted':
      command = 'acceptedhit';
    case 'returned': case 'submitted': case 'acceptedhit':
      sendToExt(command, data, true, data.groupId,_,_,_,_, data.pay,_,_, data.assignmentId, data.hitId);
      break;
    case 'startgroup': case 'stopgroup': case 'enableSgroup': case 'disableSgroup': case 'pause': case 'unpause': case 'getGroups': case 'getSGroups':
    case 'startSearching': case 'getJobs': case 'getTriggers': case 'startcollect': case 'stopcollect': case 'enableTrigger': case 'disableTrigger':
    case 'getStats': case 'stopSearching': case 'removeTrigger':  case 'removeJob': case 'projectedEarnings': case 'getQueueData':
      sendToExt(command, data, false);
      break;
    case 'addOnlyJob': case 'addOnceJob': case 'addSearchJob': case 'addJob': case 'addSearchOnceJob':
      if (command === 'addSearchJob') command = 'addSearchOnceJob'
      sendToExt(command, data, true, data.groupId, data.description, data.title, data.requesterId, data.requesterName, data.pay, data.duration, data.hitsAvailable);
  }
}
/** This sends a pong message after removing a ping message. Used primarily for scripts for older Panda Crazy script. */
function sendPong() {
  let message = JSON.stringify({'time':new Date().getTime(),'command':'run','url':gParentUrl,'data':null,'theTarget':null, 'version':'0.6.3','idNum':null});
  localStorage.removeItem('JR_message_ping_pandacrazy'); localStorage.setItem('JR_message_pong_pandacrazy', message);
}
/** Prepares global variables from local chrome storage. Starts storage listener. */
function prepareGlobals() {
  if ($('.mturk-alert-danger').text().includes('This HIT is no longer available')) {
    console.log('Old HIT error for', locationUrl);
    if (gSessionData.monitorNext) $('.mturk-alert-danger').remove();
  }
  chrome.storage.local.get(null, value => {
    for (const key of Object.keys(value)) {
      if (key === 'PCM_returnedHit') { setRememberIds('return', value.PCM_returnedHit.assignmentId); gHitReturned = true; }
      else if (key.includes('PCM_t_')) { let obj = value[key]; gTabIds[obj.unique] = obj; doIds(obj.assignmentId, obj.unique); }
    }
    gIdsDone = true;
    chrome.storage.onChanged.addListener(listenChanged);
  });
  if (localStorage.getItem('JR_message_ping_pandacrazy')) sendPong();
  window.addEventListener('storage', e => {
    if (e.url === gParentUrl && e.newValue) {
      if (e.key === 'JR_message_ping_pandacrazy') sendPong();
      else if (e.key === 'JR_message_pandacrazy') {
        let message = JSON.parse(e.newValue), command = message.command, data = message.data, secureCommand = false;
        if (secure.includes(command) && !gExtVerified) {
          secureCommand = true; gExtVerified = confirm('An external script is trying to send secure commands!\nAre you sure you are using an external script that uses these secure commands and are allowing it access to the operation of Panda Crazy Max?');
        }
        if (!secureCommand || (secureCommand && gExtVerified)) parseCommands(command, data);
      }
    }
  }, false);
  window.addEventListener('JR_message_ping_pandacrazy', () => { addIframe(); });
  window.addEventListener('JR_message_pandacrazy', e => {
    if (e.detail && e.detail.hasOwnProperty('time') && e.detail.hasOwnProperty('command') && e.detail.hasOwnProperty('data')) {
      let data = e.detail.data, command = e.detail.command;
      parseCommands(command, data)
    }
  }, false);
}
/** To make older scripts work correctly. Examples: HITForker, Overwatch, PandaPush. Sends a pong message at beginning. */
function pcMAX_listener() { console.log('pcMAX_listener page'); setTimeout( () => { sendPong(); }, 0 ); }
/** Adds an iframe to the page so it can receive storage events to pass to the extension for older scripts support. */
function addIframe() {
  let iframe = document.createElement('iframe'); gIframeAtt = true;
  iframe.style.display = 'none'; iframe.src = 'https://worker.mturk.com/tasks?PandaCrazyMax';
  document.body.appendChild(iframe); resetIDNext();
}
/** Cleans the chrome local storage of all created data from extension. Used at start. */
function cleanLocalStorage() {
  if (extensionLoad()) {
    chrome.storage.local.get(null, values => {
      for (const key of Object.keys(values)) { if (['PCM_returnClicked','PCM_returnedHit','PCM_submittedHit','PCM_acceptedHit'].includes(key)) chrome.storage.local.remove(key); }
    })
  }
}
/** Creates an object with all the assigned HITs in other tabs to make it easier to find HIT in other tabs.
 * @param {string} assignedHit - Assigned ID  @param {bool} closed - Page Closing? */
function doIds(assignedHit, uniqueTab, closed=false) {
  if (gIds[assignedHit] && uniqueTab) {
    if (closed) gIds[assignedHit].count--; else gIds[assignedHit].count++;
    if (gIds[assignedHit].count < 1) delete gIds[assignedHit];
  }
  else gIds[assignedHit] = {'count':1, 'unique':gTabUnique};
}
/** This HIT is expired or not found so add classes to iframe to show it is not in your queue anymore. */
function hitExpired() {
  if (!gUnloading) $(`.task-question-iframe-container`).addClass(`pcm-expiredHit`); $(`iframe.embed-responsive-item`).addClass(`pcm-expiredIframe`);
  document.title = gDocTitle;
}
/** This HIT is not expired so make sure any expired classes are removed. */
function notExpired() { $(`.task-question-iframe-container`).removeClass(`pcm-expiredHit`); $(`iframe.embed-responsive-item`).removeClass(`pcm-expiredIframe`); }
/** Shows the position in queue of this HIT and the total queue size in the document title. */
function resetTitle(older=false) {
  if (gPcmRunning && extensionLoad()) {
    let queueSize = gQueueResults.length, position = 0, positionFound = 0, timeLeft = 0;
    arrayCount(gQueueResults, (item) => { 
      position++;
      if (item.assignment_id === gAssignedHit) { positionFound = position; timeLeft = item.time_to_deadline_in_seconds; return true; } else return false;
    }, true);
    document.title = `(${positionFound}/${queueSize}) ${gDocTitle}`;
    if (!older && (timeLeft < 7 || positionFound === 0)) { if ((gHitLost || queueSize === 0) && !$(`.pcm-expireHit`).length) hitExpired(); gHitLost = true; }
    else { gHitLost = false; if ($(`.pcm-expireHit`).length) notExpired(); }
  } else { document.title = gDocTitle + ' - (NO PCM)'; notExpired(); }
}
/** Will find the next HIT not in other tabs, submitted, returned, current or almost expired from the queue.
 * @param  {string} [groupID] - Group ID to get next URL.
 * @return {string}       - The task URL of HIT or null if not found. */
function nextHit() {
  let theIds = (Object.keys(gIdsSession).length) ? gIdsSession : (gIdsDone) ? gIds : null;
  if (theIds) {
    let foundHit = null;
    for (const hit of gQueueResults) {
      if (hit.time_to_deadline_in_seconds < 15) continue; // Queue seems to be about 5 seconds behind and allows 5 seconds for loading of HIT. Allows 5 seconds for user to do HIT.
      if (gAssignedHit === hit.assignment_id) continue; // Skip current HIT.
      if (gSubmits.length && gSubmits.includes(hit.assignment_id)) continue; // Skip submitted HIT.
      if (gReturns.length && gReturns.includes(hit.assignment_id)) continue; // Skip returned HIT.
      if (!theIds.hasOwnProperty(hit.assignment_id)) {
        if (gSessionData.gidNext) { if (gNextGID === hit.project.hit_set_id) { foundHit = hit; break; }}
        else if (gSessionData.ridNext) { if (gNextRID === hit.project.requester_id) { foundHit = hit; break; }}
        else { foundHit = hit; break; }
      }
    }
    if (foundHit) return foundHit.task_url.replace('&ref=w_pl_prvw', '&from_queue=true'); else return null;
  } else return null;
}
/** Recursive calls if queue data is being loaded at same time. Will copy new queue data to global variable. Resets title to show queue stats if allowed.
 * @param {object} data - The queue data  @param {number} depth - Depth of recursion */
function queueData(data=null, older=false, depth=0) {
  if (gNewQueue && ++depth < 500) setTimeout( () => { queueData(data, older, depth); }, 20);
  else { gNewQueue = true; if (data) gQueueResults = data; gNewQueue = false; if (gPositionsTitle) resetTitle(older); }
}
/** Checks the queue data to see if needs to go to another HIT due to user commands.
 * @param {object} queueResults - Queue data */
function checkQueue(queueResults) {
  if (gGotoHit === 26) gGotoHit = queueResults.length;
  if (extensionLoad()) {
    if (gGotoHit && gGotoHit > 0 && queueResults.length >= gGotoHit) {
      chrome.storage.onChanged.removeListener(listenChanged);
      window.location.replace('https://worker.mturk.com' + queueResults[gGotoHit-1].task_url.replace('&ref=w_pl_prvw','&from_queue=true'));
    } else if (!gAlreadyOpened && gOpenHits && gOpenHits > 1 && queueResults.length >= gOpenHits) {
      let hitPosition = 2, numOpenHits = gOpenHits; gAlreadyOpened = true;
      let nowOpenHits = () => {
        window.open('https://worker.mturk.com' + queueResults[hitPosition - 1].task_url.replace('&ref=w_pl_prvw','&from_queue=true'), '_blank');
        hitPosition++; numOpenHits--;
        if (numOpenHits > 1) setTimeout(nowOpenHits, 1570);
        else { window.location.replace('https://worker.mturk.com' + queueResults[0].task_url.replace('&ref=w_pl_prvw','&from_queue=true')); window.focus(); }
      }
      nowOpenHits();
    } else if (gMonitorOn && queueResults.length > 0) {
      let task_url = nextHit();
      if (task_url) {
        chrome.runtime.sendMessage({'command':'monitorSpeech', 'data':{}});
        chrome.storage.onChanged.removeListener(listenChanged);
        window.location.replace('https://worker.mturk.com' + task_url.replace('&ref=w_pl_prvw','&from_queue=true'));
      }
    }
  }
}
/** Sets the session storage with the id array using the array name and add the id value.
 * @param {string} arrName - Array Name  @param {string} id - Id Value to Remember */
function setRememberIds(arrName, id) {
  let arr = (arrName === 'submit') ? gSubmits : gReturns, sessValue = (arrName === 'submit') ? 'PCM_hitSubmits' : 'PCM_hitReturns';
  if (!arr.includes(id)) { if (arr.length > 2) arr.shift(); arr.push(id); }
  sessionStorage.setItem(sessValue,JSON.stringify(arr));
}
/** Adds more keys for HIT data to simulate the old script data sent. */
function addQueueOldKeys() {
  for (const hit of gQueueResults) {
    hit.pay = parseFloat(hit.project.monetary_reward.amount_in_dollars).toFixed(2); hit.title = hit.project.title;
    hit.duration = getTimeLeft(hit.project.assignment_duration_in_seconds);
    hit.description = hit.project.description; hit.continueURL = `https://worker.mturk.com${hit.task_url}`; hit.hitId = hit.project.hit_set_id;
    hit.requesterName = hit.project.requester_name; hit.requesterId = hit.project.requester_id; hit.assignmentId = hit.assignment_id;
  }
}
/** When chrome storage detects a change then this function will be called to find out what has changed and do whatever it needs to do.
 * @param {object} changes - Changes Object  @param {string} name - Storage Name Changed */
function listenChanged(changes, name) {
  if (name === 'local') {
    for (const key of Object.keys(changes)) {
      let newVal = changes[key].newValue, oldVal = changes[key].oldValue;
      if (key === 'PCM_queueData') {
        queueData(newVal); addQueueOldKeys();
        if (gIframeAtt) localStorage.setItem('JR_QUEUE_StoreData',JSON.stringify( {'date': new Date().getTime(), 'ScriptID': '1', 'queue':gQueueResults} ));
        else checkQueue(gQueueResults); }
      else if (key === 'PCM_running') { gPcmRunning = newVal; document.title = gDocTitle; }
      else if (key === 'PCM_returnClicked') { // Detects a return cancelled from a prompt dialog due to a script.
        if (newVal) {
          let thisAssignedID = newVal.assignmentId;
          if (thisAssignedID && thisAssignedID === gAssignedHit) { if (returnBtn) { setTimeout( () => { returnBtn = false; }, 1000); }}
        }}
      else if (key === 'PCM_returnedHit') { if (newVal) { setRememberIds('return', newVal.assignmentId); }}
      else if (key.includes('PCM_t_')) {
        if (!newVal && oldVal) doIds(oldVal.assignmentId, oldVal.unique, true); else if (newVal) doIds(newVal.assignmentId, newVal.unique); }
    }
  }
}
/** Resets the gidNext and ridNext values back to being false. */
function resetIDNext() {
  gSessionData.gidNext = false; gSessionData.ridNext = false; sessionStorage.setItem('PCM_sessionValues', JSON.stringify(gSessionData));
}
/** Will load any session data stored. Used for temporary options for this tab only. Will also send a message to get global options. */
function loadSessionData() {
  gHolders = JSON.parse(sessionStorage.getItem('PCM_holders')); sessionStorage.removeItem('PCM_holders');
  gIdsSession = JSON.parse(sessionStorage.getItem('PCM_gIds')) || {}; if (Object.keys(gIdsSession).length) { sessionStorage.removeItem('PCM_gIds'); }
  gSessionData = JSON.parse(sessionStorage.getItem('PCM_sessionValues')) || gSessionDefault;
  gTabUnique = sessionStorage.getItem('PCM_sessionTabID') || new Date().getTime().toString(); sessionStorage.setItem('PCM_sessionTabID', gTabUnique);
  gNextGID = sessionStorage.getItem('PCM_nextGroupID') || null; gNextRID = sessionStorage.getItem('PCM_nextReqID') || null;
  gSubmits = JSON.parse(sessionStorage.getItem('PCM_hitSubmits')) || []; gReturns = JSON.parse(sessionStorage.getItem('PCM_hitReturns')) || [];
  if (gQueuePage && gSessionData.monitorNext) gMonitorOn = true;
  chrome.runtime.sendMessage({'command':'queueOptions', 'data':gSessionData}, data => { gOptions = data; });
}
/** Parses the HIT data on queue page, assigned HIT page or HIT list on MTURK page. */
function getReactProps() {
  let dataHits = $('.projects-info-header ~ div, .task-queue-header ~ div').find('div[data-react-props]:first'), hitPage = $('.project-detail-bar span[data-react-props]:first');
  let reqHits = $(`ol.hit-set-table`).closest('div[data-react-props]'), theHits = (dataHits.length) ? dataHits : (reqHits.length) ? reqHits : null;
  if (hitPage && hitPage.length > 0) {
    let rawProps = hitPage.attr('data-react-props'), hit = JSON.parse(rawProps);
    if (hit.modalHeader === 'HIT Details') gHitData = hit.modalOptions;
  } else if (theHits && theHits.length) {
    let reactClass = theHits.attr('data-react-class'), rawProps = theHits.attr('data-react-props'), props = JSON.parse(rawProps).bodyData;
    if (reactClass.includes('TaskQueueTable')) checkQueue(props);
    else if (reactClass.includes('HitSetTable')) gHitsData = props;
  }
}
/** Grabs the previous HIT that this page was assigned to detect if a HIT was submitted. */
function prevAssigned() { gPrevHit = JSON.parse(sessionStorage.getItem('PCM_hitDoing')); if (gPrevHit) sessionStorage.removeItem('PCM_hitDoing'); }
/** Creates the send data object for buttons on MTURK.
 * @param {object} sendData - Data to be sent. */
function setSendData(sendData) {
  const regex = /\[hit_type_id\]=([^&]*)&.*\[requester_id\]=([^&]*)&/;
  let [, groupId, reqId] = (sendData.hasOwnProperty('contactRequesterUrl')) ? unescape(gHitData.contactRequesterUrl).match(regex) : [null, null, null];
  let data = {
    'groupId': (sendData.hasOwnProperty('hit_set_id')) ? sendData.hit_set_id : groupId,
    'description': sendData.description,
    'title': (sendData.hasOwnProperty('title')) ? sendData.title : sendData.projectTitle,
    'reqId': (sendData.hasOwnProperty('requester_id')) ? sendData.requester_id : reqId,
    'reqName': (sendData.hasOwnProperty('requester_name')) ? sendData.requester_name : sendData.requesterName,
    'reward': (sendData.hasOwnProperty('monetary_reward')) ? sendData.monetary_reward.amount_in_dollars : sendData.monetaryReward.amountInDollars
  };
  return data;
}
/** Sets up the data to send to extension with the passed data or the global HIT(s) data and then sends the data.
 * @param  {object} e - Button event  @param  {string} command - Command to Send  @param  {object} passData - Data Passed */
function buttonsSend(e, command, passData=null) {
  let theIndex = -1, data = passData;
  if (!passData && Object.keys(gHitsData).length) { theIndex = $(e.target).closest('.table-row').index(); data = setSendData(gHitsData[theIndex-1]); }
  else if (!passData && Object.keys(gHitData).length) { data = setSendData(gHitData); }
  if (data) this.sendToExt(command, data, true, data.groupId, data.description, data.title, data.reqId, data.reqName, data.reward);
}
/** Sets up the hold data for MTURK preview and accept buttons so it can set up buttons if HIT is not available. */
function setHoldData() {
  $(`a[href*='/projects/']`).click( e => {
    let theIndex = $(e.target).closest('.table-row').index();
    if (gHitsData[theIndex-1]) {
      let d = (theIndex) ? setSendData(gHitsData[theIndex-1]) : null;
      if (d) sessionStorage.setItem('PCM_holders',JSON.stringify({'pcm_holdGID':d.groupId, 'pcm_holdRID':d.reqId, 'pcm_holdRname':d.reqName, 'pcm_holdTitle':d.title, 'pcm_holdReward':d.reward}));
    }
  });
}
/** Returns newer buttons to work with the extension using class names and passed data.
 * @param  {string} className - Class Name  @param  {string} classButton - Button Class Name  @param  {object} passData - Data Passed
 * @return {object}           - The jquery element for the buttons to add. */
function addButtons(className='pcm-buttonZoneHits', classButton='pcm-buttonHits', passData=null) {
  if (!gOptions.mturkPageButtons) return $('');
  let buttons = $(`<button class='${classButton} pcm-pandaB'>Panda</button><button class='${classButton} pcm-onceB'>Once</button><button class='${classButton} pcm-searchB'>Search</button><button class='${classButton} pcm-search2B'>S*</button>`);
  let returnThis = $(`<span class='${className}'>[PCM]: </span>`).append(buttons);
  returnThis.find('.pcm-pandaB').click( e => { buttonsSend.call(this, e, 'addJob', passData); });
  returnThis.find('.pcm-onceB').click( e => { buttonsSend.call(this, e, 'addOnceJob', passData); });
  returnThis.find('.pcm-searchB').click( e => { buttonsSend.call(this, e, 'addSearchOnceJob', passData); });
  returnThis.find('.pcm-search2B').click( e => { buttonsSend.call(this, e, 'addSearchMultiJob', passData); });
  buttons = null;
  return returnThis;
}
/** Checks for any message that a HIT was submitted and then uses the previous HIT data saved to send message to extension and set local chrome storage submittedHit variable. */
function checkSubmitted() {
  let submitText1 = `The HIT has been successfully submitted`, submitText2 = `HIT Submitted`, alertContent = $(`.mturk-alert-content`).text();
  if (gPrevHit && (alertContent.includes(submitText1) || alertContent.includes(submitText2))) {
    gHitSubmitted = true; setRememberIds('submit', gPrevHit.assignmentId);
    chrome.storage.local.set({'PCM_submittedHit':{'assignmentId':gPrevHit.assignmentId, 'groupId':gPrevHit.groupId, 'taskId':gPrevHit.taskId, 'unique':new Date().getTime()}});
    sendToExt('submitted', gPrevHit, true, gPrevHit.groupId,_,_,_,_, gPrevHit.pay,_,_, gPrevHit.assignmentId, gPrevHit.taskId);
  }
}
/** Checks for no more HITs message so it can add buttons using the held variables from a previous page accept button. */
function noMoreHits() {
  if (gHolders && gHolders.pcm_holdGID && $(`.mturk-alert-content:contains('There are no more of these HITs available')`).length) {
    $(`.mturk-alert-content:contains('There are no more of these HITs available') p:first`).append(addButtons(_,_, {'groupId': gHolders.pcm_holdGID, 'description': null, 'title': gHolders.pcm_holdTitle, 'reqId': gHolders.pcm_holdRID, 'reqName': gHolders.pcm_holdRname, 'reward': gHolders.pcm_holdReward }));
  }
}
/** Removes old PandaCrazy buttons on MTURK pages. */
function oldPCRemoval() {
  checkButtons = e => {
    if (e.key === 'JR_message_pong_pandacrazy') {
      setTimeout( () => { if ($('.JR_PandaCrazy').length > 0) { $('.JR_PandaCrazy').remove(); } window.removeEventListener('storage', checkButtons); }, 5);
    }
  }
  window.addEventListener('storage', checkButtons);
}
/** Sets up any return buttons on the page so the script can detect a return HIT even when a return prompt script is installed. */
function setReturnBtn() {
  $(`.btn-secondary:contains('Return')`).unbind('click').bind( 'click', e => {
    let theIndex = (Object.keys(gHitData).length) ? -1 : $(e.target).closest('.table-row').index(), theHit = (theIndex !== -1) ? gQueueResults[theIndex-1] : gHitData;
    if (theHit) { if (extensionLoad()) { chrome.storage.local.set({'PCM_returnClicked':{'assignmentId':theHit.assignment_id, 'unique':new Date().getTime()}}); returnBtn = true; }}
  });
  $(`.btn-secondary:contains('Return')`).unbind('blur').bind( 'blur', () => { if (returnBtn) returnBtn = false; });
  $('.expand-projects-button').unbind('click').bind( 'click', () => { setTimeout( () => { setReturnBtn(); }, 0); });
}
/** Sets up a listener for unloading page so it can remove old local chrome storage variables. Detects returned HITs here also. */
function setBeforeUnload() {
  window.addEventListener('beforeunload', async () => {
    gUnloading = true;
    if (extensionLoad()) {
      if (gIds[gAssignedHit] && gIds[gAssignedHit].count < 2) { chrome.storage.local.remove(`PCM_tHit_${gAssignedHit}`); delete gIds[gAssignedHit]; }
      chrome.storage.local.remove(`PCM_t_${gTabUnique}`);
      sessionStorage.setItem('PCM_gIds',JSON.stringify(gIds));
      if (returnBtn) {
        chrome.storage.local.set({'PCM_returnedHit':{'assignmentId':gAssignedHit, 'groupId':gGroupId, 'taskId':gTaskId}});
        sendToExt('returned', {}, true, gGroupId,_,_,_,_, gPay,_,_, gAssignedHit, gTaskId);
      }
    }
  });
}
/** Makes sure extension is still loaded and if not then it removes script changes. */
function checkExtension() {
  let gInterval = setInterval( () => {
    if (!extensionLoad()) { resetTitle(); clearInterval(gInterval); $(`.btn-secondary:contains('Return')`).unbind('click blur'); };
  }, 8000);
}
/** Grabs group ID, task ID and assigned ID quickly from the current URL. */
function grabCurrentHit() { const regex = /\/projects\/([^\/]*)\/tasks\/([^\?]*)\?assignment_id=([^&]*)/; [, gGroupId, gTaskId, gAssignedHit] = locationUrl.match(regex); }
/** Sends message commands to PandaCrazy Max about a new panda or search job to add. Used for forums with older PC buttons. */
function addCommands() {
  if (!extensionLoad()) return; resetIDNext();
  let regex = /\/PandaCrazy([^\/]*)\/.*JRGID=([^&]*)&JRRName=(.*)&JRRID=([^&]*)&JRTitle=(.*)&JRReward=(.*)/;
  if (!locationUrl.includes('JRGID')) regex = /\/.{0,2}PandaCrazy([^\/]*)\/.*groupID=([^&]*)&requesterName=(.*)&requesterID=([^&]*)&hitTitle=(.*)&hitReward=(.*)/;
  let [, command, groupId, reqName, reqId, title, reward] = locationUrl.match(regex);
  command = (command === 'Add') ? 'addJob' : (command === 'Search') ? 'addSearchOnceJob' : (command === 'Once') ? 'addOnceJob' : 'addSearchMultiJob';
  chrome.runtime.sendMessage({'command':command, 'groupId':groupId, 'description':'', 'title':title, 'reqId':reqId, 'reqName':reqName, 'price':reward, 'data':{}});
}
/** Adds buttons to the preview page making sure to remove any other buttons added before. */
function previewButtons() {
  $('.pcm-buttonZonePreview').remove();
  let span = addButtons('pcm-buttonZonePreview no-wrap', 'pcm-buttonPreview');
  span.find('.pcm-button').css({'font-size':'9px','line-height':'8px','padding':'1px','color':'black'});
  $('.project-detail-bar:first .task-project-title:first').append(span);
  span = null;
}
/** Parses a URL with no assignment ID attached so must be a preview. */
function doPreview() {
  console.log('doPreview page'); gPreviewPage = true;
  resetIDNext(); oldPCRemoval(); noMoreHits(); previewButtons();
  let [, groupId] = locationUrl.match(/\/projects\/([^\/]*)\/tasks.*/);
  $(`.btn-primary:contains('Accept')`).click( () => { sessionStorage.setItem('PCM_acceptedBtn',groupId); });
}
/** Adds buttons to the assignment page making sure to remove any other buttons added before. */
function assignmentButtons() {
  $('.pcm-buttonZonePreview').remove();
  let detailArea = $('.project-detail-bar:first .col-md-5:first .row:first > div:nth-child(2)'), buttons = addButtons();
  if (detailArea.find('div').length === 0) detailArea.append(buttons);
  else $('.navbar-content:first .navbar-nav:first').append($(`<li class='nav-item' style='margin-left:0; margin-top:5px'></li>`).append(buttons.css('margin-top', '5px')));
  detailArea = null; buttons = null;
}
/** Parses a URL with an assignment ID attached and detects accepted HIT. Also sets up local chrome storage variables for current HIT in tab. */
function doAssignment() {
  console.log('doAssignment page');
  gPositionsTitle = true; oldPCRemoval(); noMoreHits();
  gPay = gHitData.monetaryReward.amountInDollars; gHitData.task_id = gTaskId; gHitData.assignment_id = gAssignedHit; gHitData.task_url = locationUrl;
  let requesterUrl = $(`.project-detail-bar a[href*='/requesters/']`).attr('href'), tabUnique = `PCM_t_${gTabUnique}`; gReqId = requesterUrl.split('/')[2];
  let acceptedId = sessionStorage.getItem('PCM_acceptedBtn'); sessionStorage.removeItem('PCM_acceptedBtn'), tabHit = `PCM_tHit_${gAssignedHit}`;
  if (acceptedId && acceptedId === gGroupId) {
    chrome.storage.local.set({'PCM_acceptedHit':{'assignmentId':gAssignedHit, 'groupId':gGroupId, 'taskId':gTaskId, 'unique':new Date().getTime()}});
    sendToExt('acceptedhit', {}, true, gGroupId, gHitData.description, gHitData.projectTitle, gReqId, gHitData.requesterName, gPay, gHitData.assignmentDurationInSeconds, gHitData.assignableHitsCount, gAssignedHit, gTaskId, gHitData);
  }
  if (gHolders) {
    chrome.storage.local.set({'PCM_acceptedHit':{'assignmentId':gAssignedHit, 'groupId':gGroupId, 'taskId':gTaskId, 'unique':new Date().getTime()}});
    sendToExt('acceptedhit', {}, true, gGroupId, gHitData.description, gHitData.projectTitle, gReqId, gHitData.requesterName, gPay, gHitData.assignmentDurationInSeconds, gHitData.assignableHitsCount, gAssignedHit, gTaskId, gHitData);
  }
  if (gOptions.tabUniqueHits && gIdsDone && gIds[gAssignedHit]) {
    let newUrl = nextHit(); gIds[gAssignedHit].count++;
    if (newUrl) window.location.replace('https://worker.mturk.com' + newUrl);
    else if (gSessionData.monitorNext) window.location.replace('https://worker.mturk.com/tasks?JRPC=monitornext');
    else window.location.replace('https://worker.mturk.com/tasks');
  } else if (gSessionData.gidNext && gPrevHit && gGroupId !== gNextGID) {
    let newUrl = nextHit();
    if (!newUrl) { resetIDNext(); window.location.replace('https://worker.mturk.com/tasks'); } else window.location.replace('https://worker.mturk.com' + newUrl);
  } else if (gSessionData.ridNext && gPrevHit && gReqId !== gNextRID) {
    let newUrl = nextHit();
    if (!newUrl) { resetIDNext(); window.location.replace('https://worker.mturk.com/tasks'); } else window.location.replace('https://worker.mturk.com' + newUrl);
  } else {
    chrome.storage.local.set({[tabUnique]:{'unique':gTabUnique, 'assignmentId':gAssignedHit, 'groupId':gGroupId, 'taskId':gTaskId}});
    chrome.storage.local.set({[tabHit]:{'assignmentId':gAssignedHit, 'groupId':gGroupId, 'taskId':gTaskId}});
  }
  sessionStorage.setItem('PCM_hitDoing',JSON.stringify({'assignmentId':gAssignedHit, 'groupId':gGroupId, 'taskId':gTaskId, 'pay':gHitData.monetaryReward.amountInDollars, 'reqId':gReqId}));
  assignmentButtons(); setReturnBtn();
}
/** Adds buttons to the HIT List page making sure to remove any other buttons added before. Will use Jquery element to use for find.
 * @param  {object} - Jquery Object */
function hitListButtons(element=null) {
  if (element === null) element = $('body');
  if (element.find('.JR_PandaCrazy').length > 0) { element.find('.JR_PandaCrazy:first').remove(); }
  if (element.find('.pcm-buttonZoneHits').length === 0) { element.find('.p-b-md').append(addButtons()); }
}
/** Adds buttons to the HITs listed pages. Removes any old buttons too. */
function hitList() {
  console.log('HITList page');
  resetIDNext(); noMoreHits(); gHitList = true;
  $('.hit-set-table .hit-set-table-row').click( e => { setTimeout( () => { hitListButtons($(e.target).closest('.table-row')); }, 0); });
  $('.expand-projects-button').click( () => { setTimeout( () => { hitListButtons(); }, 0); });
  setHoldData();
  if ((gHitSubmitted || gHitReturned) && gSessionData.monitorNext) window.location.replace('https://worker.mturk.com/tasks?JRPC=monitornext');
}
/** Used when user goes to the monitor page and sets up the monitor queue text on page. */
function monitorNext() { console.log('doing monitoring');
  $(`.task-queue-header`).after(`<div class='pcm-monitoringDiv'></div>`);
  $(`.pcm-monitoringDiv`).append(`<h2 class='pcm-monitoringQueue'>Monitoring queue for a new HIT to open.</h2>`); queuePage();
}
/** Check if this page is a HIT list or some other page that is unknown. */
function otherPage() { if ($('.projects-controls').length) hitList(); else { resetIDNext(); console.log('otherPage page'); } }
/** Used when user goes to a queue page. Sets the return buttons on each HIT too. */
function queuePage() { resetIDNext(); setReturnBtn(); }
/** Works on old panda crazy pages to future use of importing data. */
function oldPandaCrazy() { resetIDNext(); console.log('old pandacrazy page'); }

/** Checks for special commands in URL and sets the global values. */
if (/worker\.mturk\.com\/tasks.*$/.test(locationUrl)) { gQueuePage = true; }
if (/worker\.mturk\.com\/tasks\?JRPC=(monitornext|nexthit)$/.test(locationUrl)) { gMonitorOn = true; }
else if (/worker\.mturk\.com\/tasks\?JRPC=gohit\d*$/.test(locationUrl)) gGotoHit = locationUrl.split('JRPC=gohit')[1];
else if (/worker\.mturk\.com\/tasks\?JRPC=lasthit\d*$/.test(locationUrl)) gGotoHit = 26;
else if (/worker\.mturk\.com\/tasks\?JRPC=openhits\d*$/.test(locationUrl)) gOpenHits = locationUrl.split('JRPC=openhits')[1];
else if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(locationUrl)) { grabCurrentHit(); gPositionsTitle = true; gAssignmentPage = true; }

/** load up any local storage data saved */
loadSessionData(); prepareGlobals(); getReactProps();
chrome.storage.local.get('PCM_running', value => {
  gPcmRunning = value.PCM_running;
  chrome.storage.local.get('PCM_queueData', value => { queueData(value.PCM_queueData, true); checkQueue(gQueueResults); } );
  cleanLocalStorage(); setBeforeUnload(); checkExtension();
  $( () => {
    prevAssigned(); checkSubmitted();
    if (gPcmRunning) { // Make sure Panda Crazy extension is running.
      if (/requesters\/PandaCrazyMax/.test(locationUrl) || /worker\.mturk\.com\/tasks\?PandaCrazyMax/.test(locationUrl)) { pcMAX_listener(); }
      else {
        /** Find out if there was an external command needing to run because of a reload page. */
        let lastExtCommand = localStorage.getItem('PCM_LastExtCommand');
        if (lastExtCommand) { let parsed = JSON.parse(lastExtCommand); this.parseCommands(parsed.command, parsed.data); localStorage.removeItem('PCM_LastExtCommand'); }
        /** Sort pages to relevant functions. */
        if (/worker\.mturk\.com([\/]|$)([\?]|$)(.*=.*|)$/.test(locationUrl)) hitList(); // Pages with HITs listed
        else if (/requesters\/.{0,2}PandaCrazy[^\/].*(JRGID|groupID)=.*(JRRName|requesterName)=/.test(locationUrl)) addCommands();
        else if (gMonitorOn) monitorNext(); else if (gAssignmentPage) doAssignment();
        else if (/projects\/[^\/]*\/tasks(\?|$)/.test(locationUrl)) doPreview();
        else if (/worker\.mturk\.com\/.*(PandaCrazy|pandacrazy).*(on|$)/.test(locationUrl)) oldPandaCrazy();
        else if (/worker\.mturk\.com\/overwatch.*$/.test(locationUrl)) addIframe();
        else if (/worker\.mturk\.com\/.*[?|&](hit_forker|finder_beta_test)/.test(locationUrl)) addIframe();
        else if (/worker\.mturk\.com\/requesters\/PandaPush\/projects.*$/.test(locationUrl)) addIframe();
        else if (/worker\.mturk\.com[\/]tasks.*$/.test(locationUrl)) { if (gSessionData.monitorNext) monitorNext(); else queuePage(); }
        else if (/worker\.mturk\.com[\/].*$/.test(locationUrl)) otherPage();
        else { console.info('unknown page'); }
      }
    }
  });
});

/** Listens for messages that are sent from the extension background page. */
chrome.runtime.onMessage.addListener( (request) => { 
  let command = request.command, data = request.data;
  if (command && data) {
    if (command === 'optionsChange') {
      sessionStorage.setItem('PCM_sessionValues', JSON.stringify(data)); gSessionData = data;
      sessionStorage.setItem('PCM_nextGroupID', gGroupId); sessionStorage.setItem('PCM_nextReqID', gReqId);
    } else if (command === 'globalOptions') {
      gOptions = data;
      if (!gOptions.mturkPageButtons) $('.pcm-buttonZonePreview, .pcm-buttonZoneHits').remove();
      else { if (gPreviewPage) previewButtons(); else if (gAssignmentPage) assignmentButtons(); else if (gHitList) hitListButtons(); }
    } else if (command === 'newUrl') window.location.replace(data.url);
  }
});

/** When window has focus it will send the current session values over to extension so when user changes options it will be correct. */
$(window).on( 'focus', () => { if (extensionLoad()) chrome.runtime.sendMessage({'command':'queueOptions', 'data':gSessionData}); });
