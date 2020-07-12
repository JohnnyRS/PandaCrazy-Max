const locationUrl = window.location.href, _ = undefined;
const parentUrl = window.parent.location.href;
let hitData = {}, hitsData = {}, originalSetItem = null;
let queueHelper = JSON.parse(sessionStorage.getItem('JR_PC_QueueHelper'));

/** Sends a message to the extension with given values.
 * @param  {string} com          - The command to send to the extension.
 * @param  {string} gId          - The group ID for this hit job.
 * @param  {string} [desc='']    - The description for this hit job.
 * @param  {string} [title='']   - The title for this hit job.
 * @param  {string} [rId='']     - The requester ID for this hit job.
 * @param  {string} [rName='']   - The requester name for this hit job.
 * @param  {number} [price=0.00] - The price for this hit job.
 * @param  {string} [dur='']     - The duration given for this hit job.
 * @param  {number} [hA=0]       - The hits available for this hit job.
 */
function sendToExt(com, gId, desc='', title='', rId='', rName='', price=0.00, dur='', hA=0) {
  chrome.runtime.sendMessage({'command':com, 'groupId':gId, 'description':desc, 'title':title, 'reqId':rId, 'reqName':rName, 'price':price, 'duration':dur, 'hitsAvailable':hA});
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
    case 'acceptedhit':
    case 'returned':
    case 'submitted':
      break;
    case 'externalrun':
    case 'externalstop':
    case 'externalpong':
      break;
    case 'getQueueData':
    case 'queueData':
    case 'projectedEarnings':
      break;
    case 'startgroup':          // Start a grouping
    case 'stopgroup':           // Stop a grouping
      break;
    case 'startcollect':        // Start collecting a job with group ID or search job with requester ID.
    case 'stopcollect':         // Stop collecting a job with group ID or search job with requester ID.
    case 'addOnlyJob':          // Add a panda job but do not collect yet.
    case 'addOnceJob':          // Add a panda job but only accept one hit.
    case 'addSearchJob':        // Add a search job and try collecting it.
    case 'addJob':              // Add a job and try collecting it.
      sendToExt(command, data.groupId,_, data.title, data.requesterId, data.requesterName, data.pay, data.duration, data.hitsAvailable);
  }
}
/** Sends message commands to PandaCrazy about a new panda or search job to add. Used for forums with older PC buttons.
 * Parses the url to grab the command and the relevant information for panda. */
function addCommands() {
  const regex = /\/PandaCrazy([^\/]*)\/.*JRGID=([^&]*)&JRRName=(.*)&JRRID=([^&]*)&JRTitle=(.*)&JRReward=(.*)/;
  let [_, command, groupId, reqName, reqId, title, reward] = locationUrl.match(regex);
  command = (command==="Add") ? "addJob" : ( (command==="Search") ? "addSearchJob" : ( (command==="SearchOnce") ? "addSearchOnceJob" : "addOnceJob" ));
  chrome.runtime.sendMessage({command:command, groupId:groupId, description:"", title:title, reqId:reqId, reqName:reqName, price:reward});
}
/** To make older storage messages compatible to extension. */
function pcMAX_listener() { console.log('pcMAX_listener page');
  window.addEventListener("storage", (e) => {
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
  iframe.style.display = 'none';
  iframe.src = 'https://worker.mturk.com/requesters/PandaCrazyMax/';
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
  }
}
/** Returns newer buttons to work with the extension.
 * @return {object} - The jquery element for the buttons to add. */
function addButtons() {
  let buttons = $('<button class="pcm-button pcm-pandaB">Panda</button><button class="pcm-button pcm-onceB">Once</button><button class="pcm-button pcm-searchB">Search</button><button class="pcm-button pcm-search2B">S*</button>');
  let span = $('<span class="JR_pandaCrazyMax no-wrap" style="font-size: 8px; margin-left: 10px; line-height:0.8"><span>[PC] Add:</span></span>').append(buttons);
  span.find('.pcm-button').css({"font-size":"9px","line-height":"8px","padding":"1px","color":"black"});
  buttons = null;
  return span;
}
/** Removes old PandCrazy buttons on mturk pages. */
function oldPCRemoval() {
  checkButtons = (e) => {
    if (e.key === 'JR_message_pong_pandacrazy') {
      setTimeout( () => {
        if ($('.JR_PandaCrazy').length > 0) { $('.JR_PandaCrazy').remove(); }
        window.removeEventListener("storage", checkButtons);
      }, 5);
    }
  }
  window.addEventListener("storage", checkButtons);
}
/** Format 1 for button messages to send. Hitlist page.
 * @param  {object} e       - The button event given when button was clicked.
 * @param  {string} command - The command to send for this button. */
function buttonsSend1(e, command) {
  let theIndex = $(e.target).closest('.table-row').index();
  let data = hitsData[theIndex];
  if (data) chrome.runtime.sendMessage({command:command, groupId:data.hit_set_id, description:data.description, title:data.title, reqId:data.requester_id, reqName:data.requester_name, price:data.monetary_reward.amount_in_dollars});
}
/** Format 2 for button messages to send.
 * @param  {string} command - The command to send for this button. */
function buttonsSend2(command) {
  if (hitData) {
    const regex = /\[hit_type_id\]=([^&]*)&.*\[requester_id\]=([^&]*)&/;
    let [all, groupId, reqId] = unescape(hitData.contactRequesterUrl).match(regex);
    chrome.runtime.sendMessage({command:command, groupId:groupId, description:hitData.description, title:hitData.projectTitle, reqId:reqId, reqName:hitData.requesterName, price:hitData.monetaryReward.amountInDollars});
  }
}
/** Parses a URL with no assignment ID attached so must be a preview. */
function doPreview() { console.log('doPreview page');
  addIframe(); oldPCRemoval(); getReactProps(); getProjectedEarnings();
  let span = addButtons();
  span.find('.pcm-button').css({"font-size":"9px","line-height":"8px","padding":"1px","color":"black"});
  $('.project-detail-bar:first .task-project-title:first').append(span);
  $('.pcm-pandaB').click( (e) => { buttonsSend2.call(this, 'addJob'); });
  $('.pcm-onceB').click( (e) => { buttonsSend2.call(this, 'addOnceJob'); });
  $('.pcm-searchB').click( (e) => { buttonsSend2.call(this, 'addSearchJob'); });
  $('.pcm-search2B').click( (e) => { buttonsSend2.call(this, 'addSearchOnceJob'); });
}
/** Parses a URL with an assignment ID attached. */
function doAssignment() { console.log('doAssignment page');
  addIframe(); oldPCRemoval(); getReactProps(); getProjectedEarnings();
  const regex = /\/projects\/([^\/]*)\/tasks\/([^\?]*)\?assignment_id=([^&]*)/;
  let [_, groupId, hitId, assignmentId] = locationUrl.match(regex);
  let detailArea = $('.project-detail-bar:first .col-md-5:first .row:first > div:nth-child(2)');
  let buttons = addButtons();
  if (detailArea.find('div').length === 0) detailArea.append(buttons);
  else $('.navbar-content:first .navbar-nav:first').append($('<li class="nav-item" style="margin-left:0; margin-top:5px"></li>').append(buttons.css('margin-top', '5px')));
}
/** Adds buttons to the hits listed pages. Removes any old buttons too. */
function hitList() {
  addIframe(); getReactProps(); getProjectedEarnings();
  $('.hit-set-table .hit-set-table-row').click( (e) => {
    let tableRow = $(e.target).closest('.table-row');
    setTimeout( () => {
      if (tableRow.find('.JR_PandaCrazy').length > 0) { tableRow.find('.JR_PandaCrazy:first').remove(); }
      if (tableRow.find('.JR_pandaCrazyMax').length === 0) { tableRow.find('.p-b-md').append(addButtons()); }
    },0);
  });
  $('.expand-projects-button').click( (e) => {
    setTimeout( () => {
      if ($('.JR_PandaCrazy').length > 0) { $('.JR_PandaCrazy').remove(); }
      if ($('.JR_pandaCrazyMax').length === 0) {
        $('.p-b-md').append(addButtons());
        $('.hit-set-table .pcm-pandaB').click( (e) => { buttonsSend1.call(this, e, 'addJob'); });
        $('.hit-set-table .pcm-onceB').click( (e) => { buttonsSend1.call(this, e, 'addOnceJob'); });
        $('.hit-set-table .pcm-searchB').click( (e) => { buttonsSend1.call(this, e, 'addSearchJob'); });
        $('.hit-set-table .pcm-search2B').click( (e) => { buttonsSend1.call(this, e, 'addSearchOnceJob'); });
      }
    },0);
  });
}
/** Adds an iframe for getting old messages and grabs any projected earnings. */
function otherPage() { console.log('otherPage page'); addIframe(); getProjectedEarnings(); }
/** Works on old panda crazy pages to future use of importing data. */
function oldPandaCrazy() { console.log('old pandacrazy page'); }
/** Works on forum pages with the name given.
 * @param  {string} name - The name of the forum this page is on. */
function onForums(name) { console.log('onForums page name: ',name); }

/** Sort pages to relevant functions. */
if (/worker\.mturk\.com([\/]|$)([\?]|$)(.*=.*|)$/.test(locationUrl)) hitList(); // Pages with hits listed
else if (/requesters\/PandaCrazy[^\/].*JRGID=.*JRRName=/.test(locationUrl)) addCommands();
else if (/projects\/[^\/]*\/tasks(\?|$)/.test(locationUrl)) doPreview();
else if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(locationUrl)) doAssignment();
else if (/requesters\/PandaCrazyMax/.test(locationUrl)) pcMAX_listener();
else if (/worker\.mturk\.com\/.*(PandaCrazy|pandacrazy).*(on|$)/.test(locationUrl)) oldPandaCrazy();
else if (/worker\.mturk\.com[\/].*$/.test(locationUrl)) otherPage();
else if (/mturkcrowd\.com/.test(locationUrl)) onForums('mturkcrowd');
else if (/turkerview\.com/.test(locationUrl)) onForums('turkerview');
else if (/mturkforum\.com/.test(locationUrl)) onForums('mturkforum');
else if (/ourhitstop\.com/.test(locationUrl)) onForums('ourhitstop');
else if (/hitnotifier\.com/.test(locationUrl)) onForums('hitnotifier');
else if (/reddit\.com\/.*HITsWorthTurkingFor.*/.test(locationUrl)) onForums('reddit');
else { console.log('unknown page'); }
