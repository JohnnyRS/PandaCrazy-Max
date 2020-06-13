const locationUrl = window.location.href;
let hitData = {}, hitsData = {};

/**
 * Sends message commands to PandaCrazy about a new panda or search job to add.
 * Parses the url to grab the command and the relevant information for panda.
 */
function addCommands() {
  const regex = /\/PandaCrazy([^\/]*)\/.*JRGID=([^&]*)&JRRName=(.*)&JRRID=([^&]*)&JRTitle=(.*)&JRReward=(.*)/;
  let [_, command, groupId, reqName, reqId, title, reward] = locationUrl.match(regex);
  command = (command==="Add") ? "addJob" : ( (command==="Search") ? "addSearchJob" : ( (command==="SearchOnce") ? "addSearchOnceJob" : "addOnceJob" ));
  chrome.runtime.sendMessage({command:command, groupId:groupId, description:"", title:title, reqId:reqId, reqName:reqName, price:reward});
}
/**
 */
function maxTest() {
  window.addEventListener("storage", (e) => {
    console.log(JSON.stringify(e.key));
    if (e.key === 'JR_message_ping_pandacrazy') {
      localStorage.setItem("JR_message_pong_pandacrazy", JSON.stringify({"time":(new Date().getTime()),"command":'run',"url":e.url,"data":null,"theTarget":null, "version":"0.6.3","idNum":null}));
    } else if (e.key === 'JR_message_pandacrazy') {
      let message = JSON.parse(e.newValue), command = message.command, data = message.data;
      // ['projectedEarnings','addJob','addOnceJob','addSearchJob']
      console.log(message.data);
      if (['addJob','addOnceJob','addSearchJob'].includes(command)) {
        if (data.groupId !== '' && data.requesterId != '')
          chrome.runtime.sendMessage({command:command, groupId:data.groupId, description:"", title:data.title, reqId:data.requesterId, reqName:data.requesterName, price:data.pay});
      }
    }
  }, false);
}
/**
 */
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
/**
 */
function getProjectedEarnings() { console.log('i see you');
  let earnings = $('#mts-ht-earnings');
  if (earnings.length) {
    let totalPay = earnings.html().replace('$','');
    chrome.runtime.sendMessage({time:new Date().getTime(), command:'projectedEarnings', data:{"projectedEarnings":totalPay}});
  }
}
/**
 */
function addButtons() {
  let buttons = $('<button class="pcm-button pcm-pandaB">Panda</button><button class="pcm-button pcm-onceB">Once</button><button class="pcm-button pcm-searchB">Search</button><button class="pcm-button pcm-search2B">S*</button>');
  let span = $('<span class="JR_pandaCrazyMax no-wrap" style="font-size: 8px; margin-left: 10px; line-height:0.8"><span>[PC] Add:</span></span>').append(buttons);
  span.find('.pcm-button').css({"font-size":"9px","line-height":"8px","padding":"1px","color":"black"});
  return span;
}
/**
 */
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
/**
 * @param  {} e
 * @param  {} command
 */
function buttonsSend1(e, command) {
  let theIndex = $(e.target).closest('.table-row').index();
  let data = hitsData[theIndex];
  if (data) chrome.runtime.sendMessage({command:command, groupId:data.hit_set_id, description:data.description, title:data.title, reqId:data.requester_id, reqName:data.requester_name, price:data.monetary_reward.amount_in_dollars});
}
/**
 * @param  {} command
 */
function buttonsSend2(command) {
  if (hitData) {
    const regex = /\[hit_type_id\]=([^&]*)&.*\[requester_id\]=([^&]*)&/;
    let [all, groupId, reqId] = unescape(hitData.contactRequesterUrl).match(regex);
    chrome.runtime.sendMessage({command:command, groupId:groupId, description:hitData.description, title:hitData.projectTitle, reqId:reqId, reqName:hitData.requesterName, price:hitData.monetaryReward.amountInDollars});
  }
}
/**
 */
function doPreview() {
  oldPCRemoval(); getReactProps(); getProjectedEarnings();
  let span = addButtons();
  span.find('.pcm-button').css({"font-size":"9px","line-height":"8px","padding":"1px","color":"black"});
  $('.project-detail-bar:first .task-project-title:first').append(span);
  $('.pcm-pandaB').click( (e) => { buttonsSend2.call(this, 'addJob'); });
  $('.pcm-onceB').click( (e) => { buttonsSend2.call(this, 'addOnceJob'); });
  $('.pcm-searchB').click( (e) => { buttonsSend2.call(this, 'addSearchJob'); });
  $('.pcm-search2B').click( (e) => { buttonsSend2.call(this, 'addSearchOnceJob'); });
}
/**
 * Parses a url with an assignment ID attached.
 */
function doAssignment() {
  oldPCRemoval(); getReactProps(); getProjectedEarnings();
  const regex = /\/projects\/([^\/]*)\/tasks\/([^\?]*)\?assignment_id=([^&]*)/;
  let [_, groupId, hitId, assignmentId] = locationUrl.match(regex);
  let detailArea = $('.project-detail-bar:first .col-md-5:first .row:first > div:nth-child(2)');
  let buttons = addButtons();
  if (detailArea.find('div').length === 0) detailArea.append(buttons);
  else $('.navbar-content:first .navbar-nav:first').append($('<li class="nav-item" style="margin-left:0; margin-top:5px"></li>').append(buttons.css('margin-top', '5px')));
}
/**
 */
function hitList() {
  getReactProps(); getProjectedEarnings();
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

if (/worker\.mturk\.com(\/|$)$/.test(locationUrl)) hitList();
else if (/requesters\/PandaCrazy[^\/].*JRGID=.*JRRName=/.test(locationUrl)) addCommands();
else if (/projects\/[^\/]*\/tasks(\?|$)/.test(locationUrl)) doPreview();
else if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(locationUrl)) doAssignment();
else if (/requesters\/PandaCrazyMax/.test(locationUrl)) maxTest();
else if (/dashboard(\?|\/|$)/.test(locationUrl)) getProjectedEarnings();
