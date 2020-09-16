const locationUrl = window.location.href, _ = undefined, isInIframe = (parent !== window);
const parentUrl = document.referrer;
let hitData = {}, hitsData = {}, originalSetItem = null, prevAssignedhit = null;
let holdArray = ['pcm_holdGID', 'pcm_holdRID', 'pcm_holdRname', 'pcm_holdTitle', 'pcm_holdReward']
let holdThis = {'pcm_running':false, 'pcm_holdGID':'', 'pcm_holdRID':'', 'pcm_holdRname':'', 'pcm_holdTitle':'', 'pcm_holdReward':''};
let queueHelper = JSON.parse(sessionStorage.getItem('JR_PC_QueueHelper'));

/** Sends a message to the extension with given values.
 * @param  {string} com        - Command        @param {object} data          - Data Object  @param  {string} gId      - GroupID
 * @param  {string} [desc='']  - Description    @param  {string} [title='']   - Title        @param  {string} [rId=''] - Requester ID
 * @param  {string} [rName=''] - Requester name @param  {number} [price=0.00] - Price        @param  {string} [dur=''] - Duration
 * @param  {number} [hA=0]     - Hits available
 */
function sendToExt(com, data, gId, desc='', title='', rId='', rName='', price=0.00, dur='', hA=0, aI=null, tI=null) {
  if (typeof chrome.app.isInstalled === 'undefined')  {
    if (data) localStorage.setItem('PCM_LastExtCommand', JSON.stringify({'command':com, 'data':data}));
    location.reload();
  } else {
    chrome.runtime.sendMessage({'command':com, 'groupId':gId, 'description':desc, 'title':title, 'reqId':rId, 'reqName':rName, 'price':price, 'duration':dur, 'hitsAvailable':hA, 'assignmentId':aI, 'taskId':tI});
  }
}
/** Parses the command string and sends message to extension.
 * @param  {string} command - The command to send for this button.
 * @param  {object} data    - The data object that was given from a message. */
function parseCommands(command, data) {
  switch (command) {
    case 'pause':
      bgPanda.pauseToggle(true);
      break;
    case 'unpause':
      bgPanda.pauseToggle(false);
      break;
    case 'acceptedhit': case 'returned': case 'submitted':
      sendToExt(command, data, data.groupId,_,_,_,_, data.pay,_,_, data.assignmentId, data.hitId);
      break;
    case 'externalrun': case 'externalstop': case 'externalpong':
      break;
    case 'getQueueData': case 'queueData': case 'projectedEarnings':
      break;
    case 'startgroup': case 'stopgroup':
      break;
    case 'startcollect':        // Start collecting a job with group ID or search job with requester ID.
    case 'stopcollect':         // Stop collecting a job with group ID or search job with requester ID.
    case 'addOnlyJob':          // Add a panda job but do not collect yet.
    case 'addOnceJob':          // Add a panda job but only accept one hit.
    case 'addSearchJob':        // Add a search job and try collecting it.
    case 'addJob':              // Add a job and try collecting it.
      sendToExt(command, data, data.groupId,_, data.title, data.requesterId, data.requesterName, data.pay, data.duration, data.hitsAvailable);
  }
}
/** Sends message commands to PandaCrazy about a new panda or search job to add. Used for forums with older PC buttons.
 * Parses the url to grab the command and the relevant information for panda. */
function addCommands() { console.log(locationUrl);
  let regex = /\/PandaCrazy([^\/]*)\/.*JRGID=([^&]*)&JRRName=(.*)&JRRID=([^&]*)&JRTitle=(.*)&JRReward=(.*)/;
  if (!locationUrl.includes('JRGID')) regex = /\/.{0,2}PandaCrazy([^\/]*)\/.*groupID=([^&]*)&requesterName=(.*)&requesterID=([^&]*)&hitTitle=(.*)&hitReward=(.*)/;
  let [_, command, groupId, reqName, reqId, title, reward] = locationUrl.match(regex);
  command = (command==="Add") ? "addJob" : ( (command==="Search") ? "addSearchOnceJob" : ( (command==="SearchOnce") ? "addSearchMultiJob" : "addOnceJob" ));
  chrome.runtime.sendMessage({command:command, groupId:groupId, description:"", title:title, reqId:reqId, reqName:reqName, price:reward});
}
/** To make older storage messages compatible to extension. */
function pcMAX_listener() { console.log('pcMAX_listener page');
  window.addEventListener("storage", (e) => { console.log('listen to: ', e.key, JSON.parse(e.newValue));
    if (e.url === parentUrl) {
      if (e.key === 'JR_message_ping_pandacrazy') {
        localStorage.setItem("JR_message_pong_pandacrazy", JSON.stringify({"time":(new Date().getTime()),"command":'run',"url":e.url,"data":null,"theTarget":null, "version":"0.6.3","idNum":null}));
      } else if (e.key === 'JR_message_pandacrazy') {
        let message = JSON.parse(e.newValue), command = message.command, data = message.data;
        parseCommands(command, data);
      } else console.log('storage key: ',JSON.stringify(e.key));
    }
  }, false);
}
/** Fixes a problem where old queue helper script changes a value because of the iframe trick I use. */
function fixForQueueHelper() {
  window.addEventListener("storage", (e) => {
    if (e.key === 'JR_PC_QueueHelper' && e.url === 'https://worker.mturk.com/requesters/PandaCrazyMax/') {
      sessionStorage.setItem('JR_PC_QueueHelper',JSON.stringify(queueHelper));
    }
  });
}
/** Adds an iframe to the page so it can receive storage events to pass to the extension. */
function addIframe() {
  fixForQueueHelper();
  let iframe = document.createElement('iframe');
  iframe.style.display = 'none'; iframe.src = 'https://worker.mturk.com/requesters/PandaCrazyMax/';
  document.body.appendChild(iframe);
}
/** Parses the properties on mturk page. */
function getReactProps() {
  const hitsPage = $('.row.m-b-md').length, hitPage = $('.project-detail-bar').length;
  let reactProps = null;
  if (hitPage > 0) {
    reactProps = $('.project-detail-bar:first span').data('react-props');
    if (reactProps) hitData = reactProps.modalOptions;
  } else if (hitsPage > 0) {
    reactProps = $('.row.m-b-md div:eq(1)').data('react-props');
    if (reactProps) hitsData = reactProps.bodyData;
  }
}
/** Gets the projected earnings that is placed on page my MTS to pass on to extension. */
function getProjectedEarnings() {
  let earnings = $('#mts-ht-earnings');
  if (earnings.length) {
    let totalPay = earnings.html().replace('$','');
    chrome.runtime.sendMessage({time:new Date().getTime(), command:'projectedEarnings', data:{"projectedEarnings":totalPay}});
    return true;
  } else return false;
}
function prevAssigned() {
  prevAssignedhit = sessionStorage.getItem('pcm_hitDoing'); console.log('prevAssignedhit: ', prevAssignedhit);
  prevAssignedhit = (prevAssignedhit) ? JSON.parse(prevAssignedhit) : null;
  sessionStorage.removeItem('pcm_hitDoing');
}
function setSendData(sendData) {
  const regex = /\[hit_type_id\]=([^&]*)&.*\[requester_id\]=([^&]*)&/;
  let [_, groupId, reqId] = (sendData.hasOwnProperty('contactRequesterUrl')) ? unescape(hitData.contactRequesterUrl).match(regex) : [null, null, null];
  let data = {
    'groupId': (sendData.hasOwnProperty('hit_set_id')) ? sendData.hit_set_id : groupId,
    'description': sendData.description,
    'title': (sendData.hasOwnProperty('title')) ? sendData.title : sendData.projectTitle,
    'reqId': (sendData.hasOwnProperty('requester_id')) ? sendData.requester_id : reqId,
    'reqName': (sendData.hasOwnProperty('requester_name')) ? sendData.requester_name : sendData.requesterName,
    'reward': (sendData.hasOwnProperty('monetary_reward')) ? sendData.monetary_reward.amount_in_dollars : sendData.monetaryReward.amountInDollars
  }
  return data;
}
/** Format for button messages to send.
 * @param  {object} e       - The button event given when button was clicked.
 * @param  {string} command - The command to send for this button. */
function buttonsSend(e, command, passData=null) {
  let theIndex = -1, data = passData;
  if (!passData && Object.keys(hitsData).length) { theIndex = $(e.target).closest('.table-row').index(); data = setSendData(hitsData[theIndex-1]); }
  else if (!passData && Object.keys(hitData).length) { data = setSendData(hitData); }
  if (data) this.sendToExt(command,_, data.groupId, data.description, data.title, data.reqId, data.reqName, data.reward);
}
function setHoldData() {
  $(`a[href*='/projects/']`).click( (e) => {
    theIndex = $(e.target).closest('.table-row').index();
    let data = (theIndex) ? setSendData(hitsData[theIndex-1]) : null;
    if (data) chrome.storage.local.set({'pcm_holdGID':data.groupId, 'pcm_holdRID':data.reqId, 'pcm_holdRname':data.reqName, 'pcm_holdTitle':data.title, 'pcm_holdReward':data.reward});
  });
}
/** Returns newer buttons to work with the extension.
 * @return {object} - The jquery element for the buttons to add. */
function addButtons(className='pcm-buttonZoneHits', classButton='pcm-buttonHits', passData=null) {
  let buttons = $(`<button class='${classButton} pcm-pandaB'>Panda</button><button class='${classButton} pcm-onceB'>Once</button><button class='${classButton} pcm-searchB'>Search</button><button class='${classButton} pcm-search2B'>S*</button>`);
  let returnThis = $(`<span class='${className}'>[PCM]: </span>`).append(buttons);
  returnThis.find('.pcm-pandaB').click( (e) => { buttonsSend.call(this, e, 'addJob', passData); });
  returnThis.find('.pcm-onceB').click( (e) => { buttonsSend.call(this, e, 'addOnceJob', passData); });
  returnThis.find('.pcm-searchB').click( (e) => { buttonsSend.call(this, e, 'addSearchOnceJob', passData); });
  returnThis.find('.pcm-search2B').click( (e) => { buttonsSend.call(this, e, 'addSearchMultiJob', passData); });
  buttons = null;
  return returnThis;
}
function checkSubmitted() {
  if (prevAssignedhit && $(`.mturk-alert-content:contains('The HIT has been successfully submitted')`).length) { console.log('Something submitter');
    sendToExt('submitted', prevAssignedhit, prevAssignedhit.groupId,_,_,_,_, prevAssignedhit.pay,_,_, prevAssignedhit.assignmentId, prevAssignedhit.taskId);
  }
}
function noMoreHits() {
  if (holdThis['pcm_holdGID'] && $(`.mturk-alert-content:contains('There are no more of these HITs available')`).length) {
    $(`.mturk-alert-content:contains('There are no more of these HITs available') p:first`).append(addButtons(_,_, {
      'groupId': holdThis['pcm_holdGID'], 'description': null, 'title': holdThis['pcm_holdTitle'], 'reqId': holdThis['pcm_holdRID'], 'reqName': holdThis['pcm_holdRname'], 'reward': holdThis['pcm_holdReward']
    }));
  }
}
/** Removes old PandCrazy buttons on mturk pages. */
function oldPCRemoval() {
  checkButtons = (e) => {
    if (e.key === 'JR_message_pong_pandacrazy') {
      setTimeout( () => { if ($('.JR_PandaCrazy').length > 0) { $('.JR_PandaCrazy').remove(); } window.removeEventListener("storage", checkButtons); }, 5);
    }
  }
  window.addEventListener("storage", checkButtons);
}
/** Parses a URL with no assignment ID attached so must be a preview. */
function doPreview() { console.log('doPreview page');
  addIframe(); oldPCRemoval(); getReactProps(); getProjectedEarnings(); checkSubmitted(); noMoreHits();
  let span = addButtons('pcm-buttonZonePreview no-wrap', 'pcm-buttonPreview');
  span.find('.pcm-button').css({"font-size":"9px","line-height":"8px","padding":"1px","color":"black"});
  $('.project-detail-bar:first .task-project-title:first').append(span);
}
/** Parses a URL with an assignment ID attached. */
function doAssignment() { console.log('doAssignment page');
  prevAssigned(); addIframe(); oldPCRemoval(); getReactProps(); getProjectedEarnings(); checkSubmitted(); noMoreHits();
  const regex = /\/projects\/([^\/]*)\/tasks\/([^\?]*)\?assignment_id=([^&]*)/;
  let [_, groupId, taskId, assignmentId] = locationUrl.match(regex);
  sessionStorage.setItem('pcm_hitDoing',JSON.stringify({'assignmentId':assignmentId, 'groupId':groupId, 'taskId':taskId, 'pay':hitData.monetaryReward.amountInDollars}));
  let detailArea = $('.project-detail-bar:first .col-md-5:first .row:first > div:nth-child(2)'), buttons = addButtons();
  if (detailArea.find('div').length === 0) detailArea.append(buttons);
  else $('.navbar-content:first .navbar-nav:first').append($('<li class="nav-item" style="margin-left:0; margin-top:5px"></li>').append(buttons.css('margin-top', '5px')));
}
/** Adds buttons to the hits listed pages. Removes any old buttons too. */
function hitList() {
  prevAssigned(); addIframe(); getReactProps(); getProjectedEarnings(); checkSubmitted(); noMoreHits(); console.log('hitList page');
  $('.hit-set-table .hit-set-table-row').click( (e) => {
    let tableRow = $(e.target).closest('.table-row');
    setTimeout( () => {
      if (tableRow.find('.JR_PandaCrazy').length > 0) { tableRow.find('.JR_PandaCrazy:first').remove(); }
      if (tableRow.find('.pcm-buttonZoneHits').length === 0) { tableRow.find('.p-b-md').append(addButtons()); }
    },0);
  });
  $('.expand-projects-button').click( (e) => {
    setTimeout( () => {
      if ($('.JR_PandaCrazy').length > 0) { $('.JR_PandaCrazy').remove(); }
      if ($('.pcm-buttonZoneHits').length === 0) $('.p-b-md').append(addButtons());
    },0);
  });
  setHoldData();
}
function dashboard() { console.log('dashboard page'); addIframe(); getProjectedEarnings(); }
/** Adds an iframe for getting old messages and grabs any projected earnings. */
function otherPage() { if ($('.projects-controls').length) hitList(); else { console.log('otherPage page'); addIframe(); getProjectedEarnings(); } }
/** Works on old panda crazy pages to future use of importing data. */
function oldPandaCrazy() { console.log('old pandacrazy page'); }

/** load up any local storage data saved */
chrome.storage.local.get(['pcm_running', ...holdArray], (result) => {
  for (const key of Object.keys(result)) { holdThis[key] = result[key]; console.log(key, result[key]); }
  chrome.storage.local.remove(holdArray);

  /** Find out if there was an external command needing to run because of a reload page. */
  let lastExtCommand = localStorage.getItem('PCM_LastExtCommand');
  if (lastExtCommand) {
    let parsed = JSON.parse(lastExtCommand);
    this.parseCommands(parsed.command, parsed.data);
    localStorage.remove('PCM_LastExtCommand');
  }

  /** Sort pages to relevant functions. */
  if (/worker\.mturk\.com([\/]|$)([\?]|$)(.*=.*|)$/.test(locationUrl)) hitList(); // Pages with hits listed
  else if (/requesters\/.{0,2}PandaCrazy[^\/].*(JRGID|groupID)=.*(JRRName|requesterName)=/.test(locationUrl)) addCommands();
  else if (/requesters\/PandaCrazy[^\/].*JRGID=.*JRRName=/.test(locationUrl)) addCommands();
  else if (/projects\/[^\/]*\/tasks(\?|$)/.test(locationUrl)) doPreview();
  else if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(locationUrl)) doAssignment();
  else if (/requesters\/PandaCrazyMax/.test(locationUrl)) pcMAX_listener();
  else if (/worker\.mturk\.com\/.*(PandaCrazy|pandacrazy).*(on|$)/.test(locationUrl)) oldPandaCrazy();
  else if (/worker\.mturk\.com[\/]dashboard.*$/.test(locationUrl)) dashboard();
  else if (/worker\.mturk\.com[\/].*$/.test(locationUrl)) otherPage();
  else { console.log('unknown page'); }
});
