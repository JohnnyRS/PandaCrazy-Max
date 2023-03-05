const gLocationUrl = window.location.href, _ = undefined;
let gHitCounter = 0, gHitInfo = {}, gForumName = null, gForumOptProp = null, gForumOptions = null, gForumObserver = null, gSlackObserver = null, gRObserver = null, gMObserver = null;
let gForumObj = {
  'MTC': {'quote':'.bbCodeBlock-content:first', 'container':'.block--messages .block-body ', 'messages':'article.message--post', 'message':'article .bbWrapper', 'postNumber':'header ul:first a:not([class])'},
  'TV': {'quote':'.quoteContainer:first .quote:first', 'container':'#messageList ', 'messages':'.messageInfo', 'message':'blockquote', 'postNumber':'.postNumber:first'},
  'OHS': {'quote':'.js-post__content-text:first', 'container':'.conversation-list ', 'messages':'.b-post__body', 'message':'.b-post__content', 'postNumber':'.b-post__count:first'},
  'MTF': {'quote':'.bbCodeBlock:first .quoteContainer:first table:first', 'container':'#messageList ', 'messages':'.messageInfo', 'message':'blockquote', 'postNumber':'.postNumber:first'},
  'slack': {'quote':'.hasnoquotething'},
  'discord': {'quote':'.hasnoquotething'}
};
let gFormatObj = {
  'TVR': {'regex':/.*\s*\[(A.*)\]\s*(.*)\s+\-\s*\$([\d.]*)\s*.*\|\s*PANDA/, 'order':[2,'rn',1,-1,-1,-1,3,'gid']},
  'MTS': {'regex':/Title:\s*(.*)\s*[\|•]\s*Accept\s*Requester:\s*(.*)\s*\[(A[^\s]+)\]\s*Contact.*Reward:\s*\${0,1}([\d.]*)\s*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Description:\s*(.*)\s*\s*Qualifications:/, 'order':[1,2,3,7,5,6,4,'gid']},
  'DARQ': {'regex':/Title:\s*(.*)(?:\s*\|\s*|\s*\[.*\|.*)PANDA\s*Requester:\s*(.*)\s*\[(A.+)\]\s*TurkerView:.*\s*Description:\s*(.*)\s*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Reward:\s*\$([\d.]*)\s*Qualifications:/, 'order':[1,2,3,4,5,6,7,'gid']},
  'DDRQ': {'regex':/Title:\s*(.*)\s*\|\s*PANDA\s*Requester:\s*(.*)\s*\[(A[^\]]+)\].*\]\s*Description:\s*(.*)\s*Duration:\s*(.*)\s*Reward:\s*\$([\d.]*)\s*Qualifications:/, 'order':[1,2,3,4,5,_,6,'gid']},
  'RDADRQ': {'regex':/Title:\s*([^•]*)\s*•\s*(https:[^•]*|[^•]*).*Requester:\s*([^•\/]*)\s*[•|]*\s*(https:[^•]*projects)\s*.*•.*Reward:\s*\${0,1}([\d.]*)[^:]*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Description:\s*(.*)\s*(Qualifications|Requirements):/, 'order':[1,3,'rid-4',8,6,7,5,'gid-2']},
  'TARQ': {'regex':/Title:\s*(.*)\s*\|\s*PANDA\s*Requester:\s*(.*)\s*\[(A.+)\]\s*\(.*Description:\s*(.*)\s*HITs Available:\s*([\d,]*)\s*Reward:\s*\$([\d.]*)\s*Qualifications:/, 'order':[1,2,3,4,-1,5,6,'gid']},
  'ARDADQ': {'regex':/Title:\s*(.*)\s*\|\s*(?:Accept|PANDA)[^:]*Requester:\s*(.*)\s*\[(A[^\]]*)\][\s(]*Contact.*Reward:[\s$]*([\d.]*)\s*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Description:\s*(.*)\s*(?:Qualifications|Requirements):/, 'order':[1,2,3,7,5,6,4,'gid']},
  'RTPG': {'regex':/Requester:\s*(.*)\s*(http\w?:\/\/.*)\s*Title:\s*(.*)\s*(http\w?:\/\/.*)\s*Pay:\s*([\d.]*)\s*Group ID:\s*(.*)\s*Avg Hourly/, 'order':[3,1,_,_,_,_,5,6,2,4]},
  'DISQUAL': {'regex':/Requester:\s*(.*)\s*(http\w?:[^\s]*)\s*HIT Title:\s*(.*)\s*Panda:\s*([^\s]*)\s*Qualification:\s*(.*)\s*(http\w?:[^\s]*)\s*Qual Description:\s*(.*)\s*Qual/, 'order':[3,1,_,_,_,_,_,4,2,_,6,7]},
  'QUALATT': {'regex':/Title:\s*([^•]*)\s*•\s*(https:[^•]*|)\s*•\s*[^\s]*Requester:\s*([^•\/]*)\s*[•|]*\s*(https:[^•]*projects)\s*.*•.*TO2/, 'order':[1,3,'rid-4',_,_,_,_,'gid-2']}
};

/** Detects if the extension was restarted or uninstalled.
 * @return {boolean} - Returns if extension is still loaded and hasn't been restarted.
**/
 function extensionLoad() { try { (browser.runtime.getManifest()); return true; } catch (error) { return false; } }
 /** Sends a message to the extension with given values.
 * @param  {string} com     - The command.   @param  {object} data  - Data object.     @param  {string} gId     - Group ID.        @param  {string} [desc]  - The description.
 * @param  {string} [title] - The title.     @param  {string} [rId] - Requester ID.    @param  {string} [rName] - Requester name.  @param  {number} [price] - The price.
 * @param  {string} [dur]   - The duration.  @param  {number} [hA]  - HITs available.  @param  {number} [aI]    - Assignment ID.   @param  {number} [tI]    - Tasks ID.
**/
function sendToExt(com, data, gId, desc='', title='', rId='', rName='', price=0.00, dur='', hA=0, aI=null, tI=null) {
  let extCommands = ['addOnlyJob', 'addOnceJob', 'addSearchJob', 'addSearchOnceJob', 'addJob', 'addSearchMultiJob', 'getQueueData'];
  if (!extensionLoad())  {
    if (data) localStorage.setItem('PCM_LastExtCommand', JSON.stringify({'command':com, 'data':data}));
    window.location.reload();
  } else if (extCommands.includes(com)) {
    browser.runtime.sendMessage({'command':com, 'groupId':gId, 'description':desc, 'title':title, 'reqId':rId, 'reqName':rName, 'price':price, 'duration':dur, 'hitsAvailable':hA, 'assignmentId':aI, 'taskId':tI, 'data':data});
  }
}
/** Sets up a mutation observer on the target element and use a function for each mutation or a trigger function when something changes.
 * @param  {object} observeTarget - Observe element.  @param  {object} subTree - SubTree also?  @param  {function} doFunc - Function for each mutation.
 * @param  {function} triggerFunc - Function on trigger.
 * @return {class}                - Returns mutationObserver class.
**/
function setUpObserver(observeTarget, subTree, doFunc, triggerFunc) {
  if (observeTarget.length === 0) return null;
  let elementToObserve = observeTarget[0];
  let observer = new MutationObserver( mutationsList => {
    if (doFunc) for (const mutation of mutationsList) { if (mutation.type === 'childList') for (const node of mutation.addedNodes) doFunc(node); } else triggerFunc();
  });
  observer.observe(elementToObserve, {childList: true, subtree:subTree});
  return observer;
}
/** Returns the group ID of the panda from the URL.
 * @param  {string} url - Panda URL.
 * @return {string}     - Group ID or empty string if URL not in known format.
**/
function gidMatch(url) {
  if (url.includes('preview')) return url.match(/mturk\.com\/.*groupId=([^\/]*)/)[1];
  else if (url.includes('projects')) return url.match(/mturk\.com\/projects\/([^\/]*)\/tasks/)[1];
  else return '';
}
/** Finds the panda URL in a message and then returns the Group ID.
 * @param  {object} message - Jquery message element.
 * @return {string}         - Group ID or empty string if URL was not a panda URL.
**/
function pandaUrl(message) { let pandaUrl = message.find('a:eq(1)').attr('href'); return gidMatch(pandaUrl); }
/** Finds the requester URL in a message and then returns the Requester ID.
 * @param  {object} message - Jquery message element.
 * @return {array}          - [Requester ID, Requester Name]
**/
function reqUrl(message) {
  try { let reqNode = message.find('a:first'), reqUrl = reqNode.attr('href'), reqName = reqNode.text(); return [ridMatch(reqUrl), reqName]; }
  catch (error) { console.error(message, error); return null; }
}
/** Returns the requester ID of the requester from the URL.
 * @param  {string} reqUrl - Requester URL.
 * @return {string}        - Requester ID or empty string if URL not in known format.
**/
function ridMatch(reqUrl) { if (reqUrl.includes('requesters')) return reqUrl.match(/mturk\.com\/requesters\/(A[^\/]*)\/projects/)[1]; else return ''; }
/** Holds HIT data in a local chrome storage so if the HIT is not available the data can be used to add buttons. **/
function setHoldData() {
  $(`a[href*='/projects/']`).click( e => {
    let theIndex = $(e.target).closest('.PCM_doneButtons').data('index'), data = (theIndex) ? gHitInfo[theIndex] : null;
    if (data) browser.storage.local.set({'PCM_holdGID':data.gid, 'PCM_holdRID':data.rid, 'PCM_holdRname':data.rName, 'PCM_holdTitle':data.title, 'PCM_holdReward':data.pay});
  });
}
/** Sends the HIT data to the extension in the correct format.
 * @param  {number} index - Index number for HIT.  @param  {string} command - Command to send to extension.
**/
function buttonCommand(index, command) {
  let data = gHitInfo[index];
  sendToExt(command, data, data.gid, data.desc, data.title, data.rid, data.rName, data.pay,_, data.avail);
}
/** Creates a button and appends it to the object given with the class name and button text. Uses an index for data. Also adds a function for clicking.
 * @param  {object} appendHere - Jquery object.  @param  {string} addClass - Class name(s)  @param  {string} text - Button text.
 * @param  {number} index - Index number data.   @param  {function} clickFunc - Click function.
**/
function createButton(appendHere, addClass, text, index, clickFunc) {
  appendHere.append($(`<button class='pcm-button ${addClass}'>${text}</button>`).data('index',index).click( e => { clickFunc(e); return false; } ));
}
/** Will add buttons to the message on a forum with the given HIT object data.
 * @param  {object} message - Jquery message object.  @param  {object} forum - Object with forum values.  @param  {object} obj - Object with HIT data.
 * @param  {bool} [hide]    - Hide buttons?
**/
function addButtons(message, forum, obj, hide=false) {
  gHitInfo[++gHitCounter] = obj;
  let mtsExport = message.find(`.ctaBbcodeTableCellLeft:first`), tdFirst = message.find('td:first'), buttons = $(`<div class='pcm-buttonZone'>[PCM] </div>`);
  if (hide) buttons.hide();
  if (obj.gid) createButton(buttons, 'pcm-pandaB', 'Panda', gHitCounter, e => { buttonCommand($(e.target).data('index'), 'addJob'); });
  if (obj.gid) createButton(buttons, 'pcm-onceB', 'Once', gHitCounter, e => { buttonCommand($(e.target).data('index'), 'addOnceJob'); });
  if (obj.rid) createButton(buttons, 'pcm-searchB', 'Search', gHitCounter, e => { buttonCommand($(e.target).data('index'), 'addSearchOnceJob'); });
  if (obj.rid) createButton(buttons, 'pcm-search2B', 'S*', gHitCounter, e => { buttonCommand($(e.target).data('index'), 'addSearchMultiJob'); });
  if (mtsExport.length) mtsExport.prepend(buttons);
  else if (['MTF','MTC', 'OHS'].includes(forum) && tdFirst.length) tdFirst.prepend(buttons);
  else message.prepend(buttons);
  message.addClass('PCM_doneButtons').data('index',gHitCounter);
}
/** Fills values from forums in a format that I can use for sending to the extension.
 * @param  {string} [ti]  - The title.       @param  {string} [rn]  - Requester name.  @param  {string} [rid] - Requester ID.  @param  {string} [de]  - The description.
 * @param  {string} [dur] - The duration.    @param  {number} [av]  - Available HITs.  @param  {string} [pay] - Reward price.  @param  {string} [gid] - Group ID.
 * @param  {string} [rNs] - NSFT requester.  @param  {string} [gNs] - NSFT group.      @param  {string} [qNs] - NSFT qual.     @param  {string} [qD]  - Qual description.
**/
function fillValues(ti='', rn='', rid='', de='', dur='', av=0, pay='', gid='', rNs='', gNs='', qNs='', qD='') {
  return {'title':ti, 'rName':rn, 'rid':rid, 'desc':de, 'dur':dur, 'avail':av, 'pay':pay, 'gid':gid, 'ns4tReq':rNs, 'ns4tPanda':gNs, 'ns4tQual':qNs, 'qualDesc':qD};
}
/** Fills an array with important ID's found in the given message from the values object of the forum.
 * @param  {array} arr - Array for fills.  @param  {object} values - Values for match.  @param  {object} message - Jquery message element.
 * @return {array}     - Array filled with ID's found.
**/
function fillArray(arr, values, message) {
  let fills = [], valueIndex = -1;
  for (const value of arr) {
    if (Number.isInteger(value) && value >= 0 && values[value]) fills.push(values[value].trim());
    else if (typeof value === 'string') {
      if (value.includes('-')) valueIndex = value.split('-')[1];
      if (value === 'rn') fills.push(reqUrl(message)[1].trim());
      else {
        if (value.includes('rid-')) fills.push(ridMatch(values[valueIndex]).trim());
        else if (value.includes('gid-')) if (values[valueIndex]) fills.push(gidMatch(values[valueIndex]).trim()); else fills.push(_);
        else if (value.includes('gid')) fills.push(pandaUrl(message).trim());
      }
    }
    else fills.push(_);
  }
  return fills;
}
/** Uses a specified regex on the text for the message with the number given.
 * @param  {string} text - Text to use.  @param  {regex} r - The regex to use.  @param  {number} number - Message number.
 * @return {array}       - Returns the array from a match of the regex provided or null if got an error.
**/
function useRegex(text, r, number) { try { let returnValue = text.match(r); return returnValue; } catch (error) { console.error(number, error); return null; } }
/** Does parsing on message found with the unique format name of the message to use to get regex and other message details.
 * @param  {string} format - Name of message.  @param  {object} message - Jquery element.  @param  {string} text - Message element in text format.
 * @param  {number} number - Message number.
 * @return {object}        - Returns object filled with HIT data from the message being parsed.
**/
function doParsing(format, message, text, number) {
  let values = useRegex(text, gFormatObj[format].regex, number);
  if (values) return fillValues.apply(this, fillArray(gFormatObj[format].order, values, message)); else return values;
}
/** Parses the HIT message with the forum name and the message format.
 * @param  {object} message - Jquery message element.  @param  {string} text   - Message element in text format.  @param  {number} number - Message number.
 * @param  {string} forum   - Forum name.              @param  {string} format - Format of the HIT message.
**/
function parseHit(message, text, number, forum, format) {
  if (format === 'RDADRQ' && !text.includes('/projects/')) text = text.replace('Requester:',' •• Requester:');
  let obj = doParsing(format, message, text, number);
  if (obj) { addButtons(message, forum, obj, (forum === 'TV') ? true : false); }
  else { message.css('border', 'orangered solid 2px'); } // Unknown format found but it must be a HIT message.
}
/** Finds the messages in a container element and then figures out the message format so it can parse it correctly.
 * @param  {object} containerMessages - Jquery container element.  @param  {string} theMessage - Jquery selector of messages.
 * @param  {number} theNumber         - Message number.            @param  {string} forum      - Forum name.
**/
function findMessages(containerMessages, theMessage, theNumber, forum) {
  $(containerMessages).each( (_s, value) => {
    let messageHits = [];
    let messageNode = ($(value).find(theMessage).find(gForumObj[forum].quote).length) ? $(value).find(theMessage).find(gForumObj[forum].quote) : $(value).find(theMessage);
    if (messageNode.length) {
      let multipleNode = messageNode.find('.bbTable:not(:has(.bbTable)), .text_table_');
      if (multipleNode.length > 1) multipleNode.each( (_s, node) => messageHits.push($(node)) );
      else if (forum === 'MTF' && messageNode.find('table tbody tr td').length > 1) messageNode.find('table tbody tr td').each( (_s, node) => { messageHits.push($(node)); })
      else messageHits = [messageNode];
      for (const message of messageHits) {
        if (!(message).hasClass('PCM_doneButtons')) {
          let messageText = message.text().replace(/\n/g, ' ').replace(/tasks\s*https/, 'tasks • https').trim(), exportFormat = null;
          messageText = messageText.replace(/mturk\.com\/requestersA/,'mturk.com/requesters/A');
          let postNumber = ($(value).find(theNumber).length) ? $(value).find(theNumber).text().trim() : '##';
          if (/s full profile check out TurkerView!/.test(messageText)) exportFormat = 'TVR';
          else if (/HIT exported from Mturk Suite/.test(messageText)) exportFormat = 'MTS';
          else if (/Requester:.*\[A[^\s]+\]\s*Contact.*Reward:.*Duration:.*Available:.*Description:/.test(messageText)) exportFormat = 'MTS';
          else if (/Duration:.*Available:.*Reward:.*Qualifications:/.test(messageText)) exportFormat = 'DARQ';
          else if (/Description:.*Duration:.*Reward:.*Qualifications:.*/.test(messageText)) exportFormat = 'DDRQ';
          else if (/\|\s*(Accept|PANDA).*Reward:.*Duration:.*Available:.*Description:.*(Qualifications|Requirements):/.test(messageText)) exportFormat = 'ARDADQ';
          else if (/Time:.*HITs Available.*Reward.*Qualifications:.*/.test(messageText)) exportFormat = 'TARQ';
          else if (/Reward:.*Duration:.*Available:.*Description:.*(Requirements|Qualifications):/.test(messageText)) exportFormat = 'RDADRQ';
          else if (/Requester:.*Title:.*Pay:.*Group ID:/.test(messageText)) exportFormat = 'RTPG';
          else if (/Requester:.*HIT Title:.*Panda:.*Qual Description:/.test(messageText)) exportFormat = 'DISQUAL';
          else if (/Title:.*Requester:.*TV:.*TO .*TO2 /.test(messageText)) exportFormat = 'QUALATT';
          if (exportFormat) parseHit(message, messageText, postNumber, forum, exportFormat);
        }
      }
    }
  });
  setHoldData();
}
/** Finds the message container and sets up an observer for scrolling for slack when used in browser. **/
function slack() {
  let message = '.p-rich_text_section', message2 = '.c-message_kit__attachments';
  let loaded = setUpObserver($('body'), false,null, () => {
    if ($('.p-message_pane:first').length) {
      loaded.disconnect(); loaded = null;
      findMessages('.p-message_pane:first .c-virtual_list__scroll_container:first', message, '.c-timestamp:first', 'slack');
      findMessages('.p-message_pane:first .c-virtual_list__scroll_container:first', message2, '.c-timestamp:first', 'slack');
      setTimeout(() => {
        gSlackObserver = setUpObserver($('.p-message_pane:first .c-virtual_list__scroll_container:first'), false, node => {
          if ($(node).find(message).length) findMessages($(node), message, '.c-timestamp:first', 'slack');
          if ($(node).find(message2).length) findMessages($(node), message2, '.c-timestamp:first', 'slack');
        });
      }, 700);
    }
  });
}
/** Finds the message container and sets up an observer for scrolling for discord app when used in browser. **/
function discordApp() {
  let messageExpanded = () => {
    return setUpObserver($('ol[class^=scrollerInner-]'), false, node => { setTimeout( () => { findMessages(node, 'blockquote', 'span[class^=timestamp-]', 'discord');  }, 500);  });
  };
  /** Detects a room change and redoes the observer. */
  let roomChange = () => {
    return setUpObserver($('div[class^=content-] div[class^=chat-]'), false, null, () => {
      if (gMObserver) gMObserver.disconnect(); gMObserver = null;
      if (/discord\.com\/channels\/555541818771636254\//.test(window.location.href)) {
        gMObserver = messageExpanded();
        setTimeout(() => { findMessages('main[class^=chatContent-]:first ol[class^=scrollerInner-]:first div[class^=contents-]', 'blockquote', 'span[class^=timestamp-]', 'discord'); }, 500);
      }
    });
  };
  let loaded = setUpObserver($('body'), true, null, () => {
    loaded.disconnect(); loaded = null; gRObserver = roomChange(); gMObserver = messageExpanded();
    gForumObserver = setUpObserver($('div[class^=base-] div[class^=chat-]'), false, () => {
      if (/discord\.com\/channels\/555541818771636254\//.test(window.location.href)) {
        setTimeout(() => { findMessages('main[class^=chatContent-]:first ol[class^=scrollerInner-]:first div[class^=contents-]', 'blockquote', 'span[class^=timestamp-]', 'discord'); }, 500);
      }
    });
  });
}
/** Sets up an event listener and removes older buttons. **/
function onForums() {
  let forumInfo = gForumObj[gForumName];
  setTimeout( () => { $('.PCSpanButtons').remove(); if ($(`.div-pandacrazy`).length === 0) $('.pcm-buttonZone').show(); }, 1000);
  window.addEventListener('JR_message_pandacrazy', e => {
    if (e.detail && e.detail.hasOwnProperty('time') && e.detail.hasOwnProperty('command') && e.detail.hasOwnProperty('data')) {
      let data = e.detail.data, comm = e.detail.command;
      sendToExt(comm, data, data.groupId, data.description, data.title, data.requesterId, data.requesterName, data.pay, data.duration, data.hitsAvailable);
    }
  }, false);
  if (forumInfo.messages) findMessages(forumInfo.container + forumInfo.messages, forumInfo.message, forumInfo.postNumber, gForumName);
  if ($(forumInfo.container).length) gForumObserver = setUpObserver($(forumInfo.container), false, node => {
    setTimeout( () => { if ($(`.div-pandacrazy`).length === 0) $('.pcm-buttonZone').show(); }, 1000);
    if ($(node).find(forumInfo.message).length) findMessages($(node), forumInfo.message, forumInfo.postNumber, gForumName);
  });
}
/** Detects which forum the user is on right now.
 * @param {object} data - Forum options data.
**/
function detectForums(data) {
  if (data && data.forumButtons) {
    if (/mturkcrowd\.com/.test(gLocationUrl)) { gForumName = 'MTC'; gForumOptProp = 'MTCButtons'; if (data.MTCButtons) onForums(); }
    else if (/turkerview\.com/.test(gLocationUrl)) { gForumName = 'TV'; gForumOptProp = 'TVButtons'; if (data.TVButtons) onForums(); }
    else if (/mturkforum\.com/.test(gLocationUrl)) { gForumName = 'MTF'; gForumOptProp = 'MTFButtons'; if (data.MTFButtons) onForums(); }
    else if (/ourhitstop\.com/.test(gLocationUrl)) { gForumName = 'OHS'; gForumOptProp = 'OHSButtons'; if (data.OHSButtons) onForums(); }
    else if (/forum\.theottoforum\.com/.test(gLocationUrl)) { gForumName = 'OHS'; gForumOptProp = 'OHSButtons'; if (data.OHSButtons) onForums(); }
    else if (/slack\.com\/client\/TDBT14TPY\//.test(gLocationUrl)) { gForumName = 'slack'; gForumOptProp = 'SlackButtons'; if (data.SlackButtons) slack(); }
    else if (/discord\.com\/channels\//.test(gLocationUrl)) { gForumName = 'discord'; gForumOptProp = 'DiscordButtons'; if (data.DiscordButtons) discordApp(); }
    else if (/discord\.com\/app/.test(gLocationUrl)) { gForumName = 'discord'; gForumOptProp = 'DiscordButtons'; if (data.DiscordButtons) discordApp('@me'); }
    else { console.info('unknown page'); }
    gForumOptions = data;
  }
}

/** Sends a message to the extension background page to send the forum options back. **/
browser.runtime.sendMessage({'command':'forumOptions', 'data':{}}).then(data => { detectForums(data); });

/** Adds a listener to get any messages coming from the background page to change the forum options. **/
browser.runtime.onMessage.addListener(request => {
  let command = request.command, data = request.data;
  if (command && data) {
    if (command === 'globalOptions') {
      if (gForumOptions[gForumOptProp] !== data[gForumOptProp]) {
        if (gForumObserver) gForumObserver.disconnect(); if (gSlackObserver) gSlackObserver.disconnect();
        if (gRObserver) gRObserver.disconnect(); if (gMObserver) gMObserver.disconnect();
        $('.pcm-buttonZone').remove(); $('.PCM_doneButtons').removeClass('PCM_doneButtons');
        if (gForumName === 'slack' || gForumName === 'discord') location.reload();
        else if (data[gForumOptProp] && gForumName) onForums();
      }
      gForumOptions = data;
    }
  }
});
