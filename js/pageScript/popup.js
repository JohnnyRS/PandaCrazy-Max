$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});
let gCurrentTab = null, gCurrentURL = '', gCurrentTitle = '', gExtData = {'toolTips':false, 'sessionQueue':null, 'queueSize':0, 'helpers':null, 'gNewUpdatedVersion':null};

/** Adds a jquery fragment to the popup from background page or closes this popup window.
 * @param  {object} fragment - Jquery object.  @param  {bool} [closeThis] - Close popup window?  @param  {bool} [tooltips] - Show tooltips?
**/
function pageData(fragment, closeThis=false, tooltips=null) {
  if (closeThis) window.close();
  else if (tooltips !== null) { if (tooltips) $('.pcm-tooltipData').removeClass('pcm-tooltipDisable'); else $('.pcm-tooltipData').addClass('pcm-tooltipDisable'); }
  else if (fragment) $(`<div class='pcm-addedSection'></div>`).appendTo('body').append(fragment);
}
/** Adds the Panda Crazy Buttons option to the element provided to forum pages and the property for the helper option to use.
 * @param  {object} appendHere - Jquery object.  @param  {string} prop - Property name to change.
**/
function popupForumOptions(appendHere, prop) {
  createCheckBox(appendHere, 'Panda Crazy Buttons', '', gExtData.helpers[prop], gExtData.helpers[prop], ' pcm-tooltipData', ' pcm-tooltipData', 'Should PCM buttons be added?', e => {
    gExtData.helpers[prop] = $(e.target).prop('checked');
    chrome.runtime.sendMessage({'command':'popup: helperOptions', 'data':gExtData.helpers});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'globalOptions', 'data':gExtData.helpers});
  });
}
/** Adds options to MTURK pages on the element provided using helper and session options from current page.
 * @param  {object} appendHere - Jquery object.
**/
function mturkQueueOptions(appendHere) {
  createCheckBox(appendHere, 'Panda Crazy Buttons', 'pcm-mturkButtons', gExtData.helpers.mturkPageButtons, gExtData.helpers.mturkPageButtons, ' pcm-tooltipData', ' pcm-tooltipData', 'Should PCM buttons be added?', () => {
    gExtData.helpers.mturkPageButtons = !gExtData.helpers.mturkPageButtons;
    chrome.runtime.sendMessage({'command':'popup: helperOptions', 'data':gExtData.helpers});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'globalOptions', 'data':gExtData.helpers});
  });
  createCheckBox(appendHere, 'Unique Tab Hits Restriction', 'pcm-restrictTabUnique', gExtData.helpers.tabUniqueHits, gExtData.helpers.tabUniqueHits, ' pcm-tooltipData', ' pcm-tooltipData', 'Allow only unique HITs in each tab.', () => {
    gExtData.helpers.tabUniqueHits = !gExtData.helpers.tabUniqueHits;
    chrome.runtime.sendMessage({'command':'popup: helperOptions', 'data':gExtData.helpers});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'globalOptions', 'data':gExtData.helpers});
  });
  createCheckBox(appendHere, `Display Queue #'s in Title`, 'pcm-displayQueueTitle', gExtData.helpers.titleQueueDisplay, gExtData.helpers.titleQueueDisplay, ' pcm-tooltipData', ' pcm-tooltipData', `Show Hit position in queue and total HITs in queue in tab title.`, () => {
    gExtData.helpers.titleQueueDisplay = !gExtData.helpers.titleQueueDisplay;
    chrome.runtime.sendMessage({'command':'popup: helperOptions', 'data':gExtData.helpers});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'globalOptions', 'data':gExtData.helpers});
  });
  $(`<hr class='pcm-sessionVarsSplit'><div class='pcm-sessionOptText'>Session Options:</div>`).appendTo(appendHere);
  createCheckBox(appendHere, 'Monitor at Queue End?', 'pcm-monitorNext', gExtData.sessionQueue.monitorNext, gExtData.sessionQueue.monitorNext, ' pcm-tooltipData', ' pcm-tooltipData', 'Monitor Queue automatically once you finish HITs in your queue.', () => {
    gExtData.sessionQueue.monitorNext = !gExtData.sessionQueue.monitorNext;
    chrome.runtime.sendMessage({'command':'popup: sessionOptions', 'data':gExtData.sessionQueue});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'optionsChange', 'data':gExtData.sessionQueue});
  });
}
/** Adds options to HIT pages on the element provided using session options from current page.
 * @param  {object} appendHere - Jquery object.
**/
function mturkAssignedOptions(appendHere) {
  createCheckBox(appendHere, 'Same GroupID Next?', 'pcm-sameGIDHit', gExtData.sessionQueue.gidNext, gExtData.sessionQueue.gidNext, ' pcm-tooltipData', ' pcm-tooltipData', 'After submit go to the next HIT in queue with the same group ID as this HIT.', e => {
    gExtData.sessionQueue.gidNext = !gExtData.sessionQueue.gidNext; gExtData.sessionQueue.ridNext = false;
    $(e.target).closest('.pcm-addedSection').find('#pcm-sameRIDHit').prop('checked',false);
    chrome.runtime.sendMessage({'command':'popup: sessionOptions', 'data':gExtData.sessionQueue});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'optionsChange', 'data':gExtData.sessionQueue});
  });
  createCheckBox(appendHere, 'Same RequesterID Next?', 'pcm-sameRIDHit', gExtData.sessionQueue.ridNext, gExtData.sessionQueue.ridNext, ' pcm-tooltipData', ' pcm-tooltipData', 'After submit go to the next HIT in queue from the same Requester ID as this HIT.', e => {
    gExtData.sessionQueue.ridNext = !gExtData.sessionQueue.ridNext; gExtData.sessionQueue.gidNext = false;
    $(e.target).closest('.pcm-addedSection').find('#pcm-sameGIDHit').prop('checked',false);
    chrome.runtime.sendMessage({'command':'popup: sessionOptions', 'data':gExtData.sessionQueue});
    chrome.tabs.sendMessage(gCurrentTab.id, {'command':'optionsChange', 'data':gExtData.sessionQueue});
  });
}
/** Adds the go to queue position link using the number of HITs in queue and a function to send any commands needed to popup page.
 * @param  {object} appendHere - Jquery object.
**/
function mturkQueueLinks(appendHere) {
  if (gExtData.queueSize > 0) {
    let gotoLink = $(`<div class='pcm-goSelectDiv'>Go To Queue Position: </div>`).appendTo(appendHere);
    let sel = $(`<select></select>`).change( e => {
      let value = $(e.target).val(), position = (value.length <= 2) ? value : '1', goUrl = null;
      if (value === 'Last') goUrl = 'https://worker.mturk.com/tasks?JRPC=lasthit'; else if (value) goUrl = `https://worker.mturk.com/tasks?JRPC=gohit${position}`;
      chrome.tabs.sendMessage(gCurrentTab.id, {'command':'newUrl', 'data':{'url':goUrl}}); window.close();
    }).appendTo(gotoLink);
    sel.append($('<option>').attr('value','---').text('---'));
    sel.append($('<option>').attr('value','First').text('First'));
    for (let i = 2; i < gExtData.queueSize; i++) { sel.append($('<option>').attr('value',i).text(i)); }
    sel.append($('<option>').attr('value','Last').text('Last'));
    let goLinks = $(`<div>Go To </div>`);
    $(`<a href='#' class='pcm-goPrevHit'>Prev Hit</a>`).click( () => {
      chrome.tabs.sendMessage(gCurrentTab.id, {'command':'goPrev', 'data':{}}); window.close();
    }).appendTo(goLinks);
    $(`<a href='#' class='pcm-goNextHit'>Next Hit</a>`).click( () => {
      chrome.tabs.sendMessage(gCurrentTab.id, {'command':'goNext', 'data':{}}); window.close();
    }).appendTo(goLinks);
    goLinks.appendTo(appendHere);
    gotoLink = null; sel = null;
  }
}
/** Figures out which options should be shown on the popup page from the URL and then uses the queue size and popup function.
 * @return {object} - Jquery object with html filled in.
**/
function helperOptions() {
  let df = $('<div></div>'), onMturk = false;
  if (/\/\/worker\.mturk\.com($|\/$|.*projects[/]?|.*tasks.*|.*requesters\/.*)/.test(gCurrentURL)) { onMturk = true; mturkQueueOptions(df); }
  if (/\/\/[^/]*\/projects\/[^/]*\/tasks\/.*?assignment_id/.test(gCurrentURL)) mturkAssignedOptions(df);
  else if (/\/\/[^/]*mturkcrowd.com.*$/.test(gCurrentURL)) popupForumOptions(df, 'MTCButtons');
  else if (/\/\/[^/]*turkerview.com.*$/.test(gCurrentURL)) popupForumOptions(df, 'TVButtons');
  else if (/\/\/[^/]*mturkforum.com.*$/.test(gCurrentURL)) popupForumOptions(df, 'MTFButtons');
  else if (/\/\/[^/]*ourhitstop.com.*$/.test(gCurrentURL)) popupForumOptions(df, 'OHSButtons');
  else if (/\/\/[^/]*slack.com.*$/.test(gCurrentURL)) popupForumOptions(df, 'SlackButtons');
  else if (/\/\/[^/]*discord.com.*$/.test(gCurrentURL)) popupForumOptions(df, 'DiscordButtons');
  if (onMturk) mturkQueueLinks(df);
  return df;
}
/** Checks the current URL and shows the helper options if needed. Also will show a message about a new version available. **/
function checkPage() {
  if (gCurrentURL && /^(?!.*chrome-extension:\/\/|.*chrome:\/\/).*$/.test(gCurrentURL)) {
    if (!gCurrentTitle.includes('NO PCM')) {
      let fragment = helperOptions();
      $(`<div class='pcm-addedSection'></div>`).appendTo('body').append(fragment);
    }
  }
  if (gExtData.gNewUpdatedVersion) {
    let newUpdateOptions = $('<div></div>');
    let versionUpdate = $(`<div class='pcm-newVersionUpdate'>New version: ${gExtData.gNewUpdatedVersion} is detected.<br></div>`).appendTo(newUpdateOptions);
    $(`<button data-toggle='confirmation'>Click to Update Extension</button>`).click( () => {
      let result = confirm('Be aware that updating now will stop all jobs running and restart the extension.\n\nAre you sure you want to update now?');
      if (result === true) { chrome.runtime.reload(); }
      else { alert('OK. Extension update will happen after next chrome start.'); gExtData.gNewUpdatedVersion = null; }
    }).appendTo(versionUpdate);
    $('.pcm-addedSection').append(newUpdateOptions);
    versionUpdate = null; newUpdateOptions = null; fragment = null;
  }
}
/** Will inform extension that it's icon has been clicked and sends active tab object. Waits for any sent data back to add to popup or close it. **/
window.onload = () => {
  chrome.runtime.sendMessage({'command':'pandaUI_status'}, (result) => {
    if (result) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        gCurrentTab = tabs[0], gCurrentURL = gCurrentTab.url; gCurrentTitle = gCurrentTab.title;
        chrome.runtime.sendMessage({'command':'popupOpened'}, (results) => { if (results) { gExtData = results; checkPage(); }});
      });
    }
  })
};
