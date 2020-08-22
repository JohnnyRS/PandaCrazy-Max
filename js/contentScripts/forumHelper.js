const locationUrl = window.location.href, _ = undefined;
let hitCounter = 0;
let hitInfo = {};
let forumObj = {
  'MTC': {'quote':'.bbCodeBlock-content:first', 'container':'.block--messages .block-body ', 'messages':'article.message--post', 'message':'article .bbWrapper', 'postNumber':'header ul:first a:not([class])'},
  'TV': {'quote':'.quoteContainer:first .quote:first', 'container':'#messageList ', 'messages':'.messageInfo', 'message':'blockquote', 'postNumber':'.postNumber:first'},
  'OHS': {'quote':'.bbcode_container:first .message:first', 'container':'.conversation-list ', 'messages':'.b-post__body', 'message':'.js-post__content-text', 'postNumber':'.b-post__count:first'},
  'MTF': {'quote':'.bbCodeBlock:first .quoteContainer:first table:first', 'container':'#messageList ', 'messages':'.messageInfo', 'message':'blockquote', 'postNumber':'.postNumber:first'},
  'slack': {'quote':'.hasnoquotething'},
  'discord': {'quote':'.hasnoquotething'}
};
let formatObj = {
  'TVR': {'regex':/.*\s*\[(A.*)\]\s*(.*)\s+\-\s*\$([\d.]*)\s*.*\|\s*PANDA/, 'order':[2,'rn',1,-1,-1,-1,3,'gid']},
  'MTS': {'regex':/Title:\s*(.*)\s*[\|•]\s*Accept Requester:\s*(.*)\s*\[(A[^\s]+)\]\s*Contact.*Reward:\s*\${0,1}([\d.]*)\s*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Description:\s*(.*)\s*\s*Qualifications:/, 'order':[1,2,3,7,5,6,4,'gid']},
  'DARQ': {'regex':/Title:\s*(.*)(\s*\|\s*|\s*\[.*\|.*)PANDA Requester:\s*(.*)\s*\[(A.+)\]\s*TurkerView:.*\s*Description:\s*(.*)\s*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Reward:\s*\$([\d.]*)\s*Qualifications:/, 'order':[1,2,3,4,5,6,7,'gid']},
  'DDRQ': {'regex':/Title:\s*(.*)\s*\|\s*PANDA Requester:\s*(.*)\s*\[(A[^\]]+)\].*\]\s*Description:\s*(.*)\s*Duration:\s*(.*)\s*Reward:\s*\$([\d.]*)\s*Qualifications:/, 'order':[1,2,3,4,5,_,6,'gid']},
  'RDADRQ': {'regex':/Title:\s*([^•]*)\s*•\s*(https:[^•]*|)\s*•\s*[^\s]*Requester:\s*([^•\/]*)\s*[•|]*\s*(https:[^•]*projects)\s*.*•.*Reward:\s*\${0,1}([\d.]*)[^:]*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Description:\s*(.*)\s*(Qualifications|Requirements):/, 'order':[1,3,'rid-4',8,6,7,5,'gid-2']},
  'TARQ': {'regex':/Title:\s*(.*)\s*\|\s*PANDA Requester:\s*(.*)\s*\[(A.+)\]\s*\(.*Description:\s*(.*)\s*HITs Available:\s*([\d,]*)\s*Reward:\s*\$([\d.]*)\s*Qualifications:/, 'order':[1,2,3,4,-1,5,6,'gid']},
  'ARDADQ': {'regex':/Title:\s*(.*)\s*\|\s*(?:Accept|PANDA)[^:]*Requester:\s*(.*)\s*\[(A[^\]]*)\][\s(]*Contact.*Reward:[\s$]*([\d.]*)\s*Duration:\s*(.*)\s*Available:\s*([\d,]*)\s*Description:\s*(.*)\s*(?:Qualifications|Requirements):/, 'order':[1,2,3,7,5,6,4,'gid']},
  'RTPG': {'regex':/Requester:\s*(.*)\s*(http:\/\/.*)\s*Title:\s*(.*)\s*(http:\/\/.*)\s*Pay:\s*([\d.]*)\s*Group ID:\s*(.*)\s*Avg Hourly/, 'order':[3,1,_,_,_,_,5,6,2,4]},
  'DISQUAL': {'regex':/Requester:\s*(.*)\s*(http:[^\s]*)\s*HIT Title:\s*(.*)\s*Panda:\s*([^\s]*)\s*Qualification:\s*(.*)\s*(http:[^\s]*)\s*Qual Description:\s*(.*)\s*Qual/, 'order':[3,1,_,_,_,_,_,4,2,_,6,7]},
  'QUALATT': {'regex':/Title:\s*([^•]*)\s*•\s*(https:[^•]*|)\s*•\s*[^\s]*Requester:\s*([^•\/]*)\s*[•|]*\s*(https:[^•]*projects)\s*.*•.*TO2/, 'order':[1,3,'rid-4',_,_,_,_,'gid-2']}
};
let MTC_enabled = true, TV_enabled = true, OHS_enabled = true, MTF_enabled = true, slack_enabled = true, discord_enabled = true;

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
function setUpObserver(observeTarget, subTree, doFunc, triggerFunc) {
  let elementToObserve = observeTarget[0];
  let checkChanged = (mutationsList) => {
    if (doFunc) for (const mutation of mutationsList) {
      if (mutation.type === 'childList') for (const node of mutation.addedNodes) doFunc(node);
    } else triggerFunc(); }
  let observer = new MutationObserver(checkChanged);
  observer.observe(elementToObserve, {childList: true, subtree:subTree});
  return observer;
}
function fillValues(ti='', rn='', rid='', de='', dur='', av=0, pay='', gid='', rNs='', gNs='', qNs='', qD='') {
  return {'title':ti, 'rName':rn, 'rid':rid, 'desc':de, 'dur':dur, 'avail':av, 'pay':pay, 'gid':gid, 'ns4tReq':rNs, 'ns4tPanda':gNs, 'ns4tQual':qNs, 'qualDesc':qD};
}
function TVquote(message) { return message.find('.quoteContainer:first .quote:first'); }
function MTCquote(message) { return message.find('.bbCodeBlock-content:first .bbTable:first'); }
function OHSquote(message) { return message.find('.bbcode_container:first .message:first'); }
function gidMatch(pandaUrl) {
  if (pandaUrl.includes('preview')) return pandaUrl.match(/mturk\.com\/.*groupId=([^\/]*)/)[1];
  else if (pandaUrl.includes('projects')) return pandaUrl.match(/mturk\.com\/projects\/([^\/]*)\/tasks/)[1];
  else return '';
}
function ridMatch(reqUrl) { return reqUrl.match(/mturk\.com\/requesters\/(A[^\/]*)\/projects/)[1]; }
function pandaUrl(message) { let pandaUrl = message.find('a:eq(1)').attr('href'); return gidMatch(pandaUrl); }
function reqUrl(message) { let reqNode = message.find('a:first'), reqUrl = reqNode.attr('href'), reqName = reqNode.text(); return [ridMatch(reqUrl), reqName]; }
function useRegex(text, r, number) { try { let returnValue = text.match(r); return returnValue; } catch (error) { console.log(number, error); return null; } }
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
function setHoldData() {
  $(`a[href*='/projects/']`).click( (e) => {
    theIndex = $(e.target).closest('.PCM_doneButtons').data('index');
    let data = (theIndex) ? hitInfo[theIndex] : null;
    if (data) chrome.storage.local.set({'pcm_holdGID':data.gid, 'pcm_holdRID':data.rid, 'pcm_holdRname':data.rName, 'pcm_holdTitle':data.title, 'pcm_holdReward':data.pay});
  });
}
function buttonCommand(index, command) {
  let data = hitInfo[index];
  sendToExt(command, data, data.gid, data.desc, data.title, data.rid, data.rName, data.pay,_, data.avail); // parse duration
}
function createButton(appendHere, addClass, text, index, clickFunc) {
  appendHere.append($(`<button class='pcm-button ${addClass}'>${text}</button>`).data('index',index).click( (e) => { clickFunc(e); e.preventDefault(); e.stopPropagation(); } ));
}
function addButtons(message, forum, obj) {
  hitInfo[++hitCounter] = obj;
  let mtsExport = message.find(`.ctaBbcodeTableCellLeft:first`), tdFirst = message.find('td:first'), buttons = $(`<div class='pcm-buttonZone'>[PCM] </div>`);
  if (obj.gid) createButton(buttons, 'pcm-pandaB', 'Panda', hitCounter, (e) => { buttonCommand($(e.target).data('index'), 'addJob'); });
  if (obj.gid) createButton(buttons, 'pcm-onceB', 'Once', hitCounter, (e) => { buttonCommand($(e.target).data('index'), 'addOnceJob'); });
  if (obj.rid) createButton(buttons, 'pcm-searchB', 'Search', hitCounter, (e) => { buttonCommand($(e.target).data('index'), 'addSearchOnceJob'); });
  if (obj.rid) createButton(buttons, 'pcm-search2B', 'S*', hitCounter, (e) => { buttonCommand($(e.target).data('index'), 'addSearchMultiJob'); });
  if (mtsExport.length) mtsExport.prepend(buttons);
  else if (['MTF','MTC', 'OHS'].includes(forum) && tdFirst.length) tdFirst.prepend(buttons);
  else message.prepend(buttons);
  message.addClass('PCM_doneButtons').data('index',hitCounter);
}
function doParsing(format, message, text, number) {
  let values = useRegex(text, formatObj[format].regex, number);
  if (values) return fillValues.apply(this, fillArray(formatObj[format].order, values, message));
  else return values;
}
function parseHit(message, text, number, forum, format) {
  if (format === 'RDADRQ' && !text.includes('/projects/')) text = text.replace('Requester:',' •• Requester:');
  let obj = doParsing(format, message, text, number);
  if (obj) { addButtons(message, forum, obj); }
  else { console.log(number, format, {'text':text}); message.css('border', 'orangered solid 2px'); }
}
function findMessages(containerMessages, theMessage, theNumber, forum) {
  $(containerMessages).each( (_, value) => {
    let messageHits = [];
    messageNode = ($(value).find(theMessage).find(forumObj[forum].quote).length) ? $(value).find(theMessage).find(forumObj[forum].quote) : $(value).find(theMessage);
    if (messageNode.length) {
      let multipleNode = messageNode.find('.bbTable:not(:has(.bbTable)), .text_table_');
      if (multipleNode.length > 1) multipleNode.each( (_, node) => messageHits.push($(node)) );
      else if (forum === 'MTF' && messageNode.find('table tbody tr td').length > 1) messageNode.find('table tbody tr td').each( (_, node) => { messageHits.push($(node)); })
      else messageHits = [messageNode];
      for (const message of messageHits) {
        if (!(message).hasClass('PCM_doneButtons')) {
          let messageText = message.text().replace(/\n/g, ' ').replace(/tasks\s*https/, 'tasks • https').trim(), exportFormat = null;
          let postNumber = ($(value).find(theNumber).length) ? $(value).find(theNumber).text().trim() : '##';
          if (/s full profile check out TurkerView!/.test(messageText)) exportFormat = 'TVR';
          else if (/HIT exported from Mturk Suite/.test(messageText)) exportFormat = 'MTS';
          else if (/Requester:.*\[A[^\s]+\]\s*Contact.*Reward:.*Duration:.*Available:.*Description:/.test(messageText)) exportFormat = 'MTS';
          else if (/Duration:.*Available:.*Reward:.*Qualifications:/.test(messageText)) exportFormat = 'DARQ';
          else if (/Description:.*Duration:.*Reward:.*Qualifications:/.test(messageText)) exportFormat = 'DDRQ';
          else if (/\|\s*(Accept|PANDA).*Reward:.*Duration:.*Available:.*Description:.*(Qualifications|Requirements):/.test(messageText)) exportFormat = 'ARDADQ';
          else if (/Time:.*HITs Available.*Reward.*Qualifications:/.test(messageText)) exportFormat = 'TARQ';
          else if (/Reward:.*Duration:.*Available:.*Description:.*(Requirements|Qualifications):/.test(messageText)) exportFormat = 'RDADRQ';
          else if (/Requester:.*Title:.*Pay:.*Group ID:/.test(messageText)) exportFormat = 'RTPG';
          else if (/Requester:.*HIT Title:.*Panda:.*Qual Description:/.test(messageText)) exportFormat = 'DISQUAL';
          else if (/Title:.*Requester:.*TV:.*TO .*TO2 /.test(messageText)) exportFormat = 'QUALATT';
          // else console.log('Not a hit: ',postNumber, {'text':messageText});
          if (exportFormat) parseHit(message, messageText, postNumber, forum, exportFormat);
        }
      }
    }
  });
  setHoldData();
}
/** Works on forum pages with the name given.
 * @param  {string} name - The name of the forum this page is on. */
function onForums(forum) {
  let forumInfo = forumObj[forum]; setTimeout(() => { $('.PCSpanButtons').remove(); }, 1000);
  window.addEventListener("JR_message_pandacrazy", (e) => { console.log('listen to: ', e.detail); }, false);
  if (forumInfo.messages) findMessages(forumInfo.container + forumInfo.messages, forumInfo.message, forumInfo.postNumber, forum);
  if ($(forumInfo.container).length) setUpObserver($(forumInfo.container), false, (node) => {
    if ($(node).find(forumInfo.message).length) findMessages($(node), forumInfo.message, forumInfo.postNumber, forum);
  });
}
function slack() {
  $(window).on('load', () => {
    let message = '.p-rich_text_section', message2 = '.c-message_kit__attachments';
    setUpObserver($('.c-message_list:first').find('.c-virtual_list__scroll_container'), false, (node) => {
      if ($(node).find(message).length) findMessages($(node), message, '.c-timestamp:first', 'slack'); 
      if ($(node).find(message2).length) findMessages($(node), message2, '.c-timestamp:first', 'slack'); 
    });
    setTimeout( () => { findMessages('.p-message_pane:first .c-virtual_list__scroll_container:first .c-message_kit__gutter__right', message, '.c-timestamp:first', 'slack'); }, 400);
    setTimeout( () => { findMessages('.p-message_pane:first .c-virtual_list__scroll_container:first .c-message_kit__gutter__right', message2, '.c-timestamp:first', 'slack'); }, 600);
  });
}
function discordApp() {
  let mturkCrowd = false, roomObserver = null, messageObserver = null;
  let messageExpanded = () => {
    return setUpObserver($('div[class^=scrollerInner-]'), false, (node) => { setTimeout( () => { findMessages($(node), 'blockquote', 'span[class^=timestamp-]', 'discord'); }, 100); });
  }
  let roomChange = () => {
    return setUpObserver($('div[class^=content-] div[class^=chat-]'), false, null, () => {
      messageObserver.disconnect(); messageObserver = null; messageObserver = messageExpanded();
      setTimeout( () => { findMessages('main[class^=chatContent-]:first div[class^=scrollerInner-]:first div[class^=contents-]', 'blockquote', 'span[class^=timestamp-]', 'discord'); }, 400);
    });
  };
  $(window).on('load', () => {
    setTimeout(() => {
      let loaded = setUpObserver($('div[class^=base-] div[class^=content-]'), true, null, () => {
        loaded.disconnect(); roomObserver = roomChange(); messageObserver = messageExpanded();
        setTimeout( () => { findMessages('main[class^=chatContent-]:first div[class^=scrollerInner-]:first div[class^=contents-]', 'blockquote', 'span[class^=timestamp-]', 'discord'); }, 400);
        setUpObserver($('div[class^=base-] div[class^=content-]'), false, () => {
          if (/discord\.com\/channels\/555541818771636254\//.test(window.location.href)) mturkCrowd = true; else mturkCrowd = false;
          if (roomObserver) { roomObserver.disconnect(); roomObserver = null; }
          if (mturkCrowd) {
            setTimeout( () => { findMessages('main[class^=chatContent-]:first div[class^=scrollerInner-]:first div[class^=contents-]', 'blockquote', 'span[class^=timestamp-]', 'discord'); }, 400);
            roomObserver = roomChange(); messageObserver.disconnect(); messageObserver = null; messageObserver = messageExpanded();
          }
        });
      });
    }, 500);
  });
}

if (MTC_enabled && /mturkcrowd\.com/.test(locationUrl)) onForums('MTC');
else if (TV_enabled && /turkerview\.com/.test(locationUrl)) onForums('TV');
else if (MTF_enabled && /mturkforum\.com/.test(locationUrl)) onForums('MTF');
else if (OHS_enabled && /ourhitstop\.com/.test(locationUrl)) onForums('OHS');
else if (slack_enabled && /slack\.com\/client\/TDBT14TPY\//.test(locationUrl)) slack();
else if (discord_enabled && /discord\.com\/channels\//.test(locationUrl)) discordApp();
else if (discord_enabled && /discord\.com\/app/.test(locationUrl)) discordApp('@me');
else { console.log('unknown page'); }
