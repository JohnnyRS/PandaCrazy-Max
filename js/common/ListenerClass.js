/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ListenerClass {
  constructor() {
    this.customMenuAdded = false;
    browser.runtime.onMessage.addListener((request, sender) => { console.info(request.command);
      if (sender.url && !sender.url.includes('generated_background_page')) {
        let command = request.command, data = request.data;
        if (command && data) {
          if (command.substring(0, 3) === 'add') { if (MyPandaUI !== null) MyPandaUI.addFromExternal(request); }
          else if (command === 'projectedEarnings') { if (MyPandaUI !== null) MyPandaUI.setEarnings(data.projectedEarnings); }
          else if (command === 'getQueueData') { if (MyPandaUI !== null && MyQueue) return Promise.resolve(MyQueue.sendQueueResults(true)); }
          else if (command === 'submitted') { if (MyPandaUI !== null) MyPandaUI.submittedHit(request); }
          else if (command === 'returned') { if (MyPandaUI !== null) MyPandaUI.returnedHit(request); }
          else if (command === 'acceptedhit') { if (MyPandaUI !== null) MyPandaUI.acceptedHit(request); }
          else if (command === 'getJobs') { if (MyPandaUI !== null) return Promise.resolve(MyPandaUI.getAllData()); }
          else if (command === 'removeJob') { if (MyPandaUI !== null && MyPanda && data.hasOwnProperty('id')) { return Promise.resolve(MyPandaUI.extRemoveJob(data.id)); }}
          else if (command === 'getTriggers') { if (MySearchUI && MySearch) return Promise.resolve(MySearch.getAllTriggers()); }
          else if (command === 'startSearching') { if (MySearchUI.isSearchUI()) MySearchUI.startSearching(); }
          else if (command === 'stopSearching') { if (MySearchUI.isSearchUI()) MySearchUI.stopSearching(); }
          else if (command === 'searchPause') { if (MySearchUI.isSearchUI()) MySearch.pauseTimer(); }
          else if (command === 'searchUnpause') { if (MySearchUI.isSearchUI()) MySearch.unPauseTimer(); }
          else if (command === 'enableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, true) }
          else if (command === 'disableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, false); }
          else if (command === 'removeTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) return Promise.resolve(MySearch.removeTrigger(data.id,_,_, true, true, true)); }
          else if (command === 'getStats') { if (MyPandaUI !== null) return Promise.resolve(MyPandaUI.sendStats()); }
          else if (command === 'pause') { if (MyPandaUI !== null) MyPandaUI.pauseToggle(true); }
          else if (command === 'unpause') { if (MyPandaUI !== null) MyPandaUI.pauseToggle(false); }
          else if (command === 'forumOptions') { if (MyPandaUI !== null && MyOptions) return Promise.resolve(MyOptions.theHelperOptions()); }
          else if (command === 'queueOptions') { if (MyPandaUI !== null && MyOptions) MyOptions.theSessionQueue(data); return Promise.resolve(MyOptions.theHelperOptions()); }
          else if (command === 'monitorSpeech') { if (MyPandaUI !== null && !MyOptions.doGeneral().disableMonitorAlert) MyAlarms.speakThisNow('HITs in Queue. Going to first.'); }
          else if (command === 'getGroups') { if (MyPandaUI !== null && MyGroupings) { let r = MyGroupings.theGroups(); return Promise.resolve({'for':'getGroups', 'response':r}); }}
          else if (command === 'getSGroups') { if (MySearchUI.isSearchUI() && MySGroupings) { let r = MySGroupings.theGroups(); return Promise.resolve({'for':'getSGroups', 'response':r}); }}
          else if (command === 'enableSgroup' || command === 'disableSgroup') { if (MySearchUI && MySGroupings && data.hasOwnProperty('id')) MySGroupings.externalCommand(command, data.id); }
          else if (command === 'startcollect') { if (MyPandaUI !== null && data.hasOwnProperty('id')) { let myId = MyPanda.getMyId(data.id); if (myId >= 0) MyPandaUI.startCollecting(myId); }}
          else if (command === 'stopcollect') { if (MyPandaUI !== null && data.hasOwnProperty('id')) { let myId = MyPanda.getMyId(data.id); if (myId >= 0) MyPandaUI.stopCollecting(myId); }}
          else if (command === 'startgroup' || command === 'stopgroup') { if (MyPandaUI !== null && MyGroupings && data.hasOwnProperty('id')) MyGroupings.externalCommand(command, data.id); }
          else if (command === 'popup: sessionOptions') { MyOptions.theSessionQueue(data); }
          else if (command === 'popup: helperOptions') { MyOptions.theHelperOptions(data); }
          else console.info(JSON.stringify(request), sender);
        }
      }
    });
    browser.contextMenus.create({'title':'PandaCrazyMax', 'id':'pcm_mturkHitsPassing', 'contexts':['link'], 'targetUrlPatterns':[`https://worker.mturk.com/*`]});
    browser.contextMenus.create({'title':'Create Panda', 'id':'pcm_mturkHitsPandaAdd', 'parentId':'pcm_mturkHitsPassing', 'contexts':['link'], 'targetUrlPatterns':[`https://worker.mturk.com/projects/*`]});
    browser.contextMenus.create({'title':'Create Panda (Once)', 'id':'pcm_mturkHitsPandaOnceAdd', 'parentId':'pcm_mturkHitsPassing', 'contexts':['link'], 'targetUrlPatterns':[`https://worker.mturk.com/projects/*`]});
    browser.contextMenus.create({'title':'Create Search Trigger (GID)', 'id':'pcm_mturkHitsTriggerGIDAdd', 'parentId':'pcm_mturkHitsPassing', 'contexts':['link'], 'targetUrlPatterns':[`https://worker.mturk.com/projects/*`]});
    browser.contextMenus.create({'title':'Create Search Trigger (RID)', 'id':'pcm_mturkHitsTriggerRIDAdd', 'parentId':'pcm_mturkHitsPassing', 'contexts':['link'], 'targetUrlPatterns':[`https://worker.mturk.com/requesters/*`]});
    browser.contextMenus.onClicked.addListener(this.contextActions);
  }
  /** Creates the custom context menu and sets the value customMenuAdded to true so it won't create another menu if already exists. **/
  addCustomContextMenu() {
    if (!this.customMenuAdded) {
      browser.contextMenus.create({'title':'PandaCrazyMax Custom', 'id':'pcm_mturkHitsCustom', 'contexts':['selection']});
      browser.contextMenus.create({'title':'Create Custom Trigger for word(s): %s', 'id':'pcm_mturkHitsTriggerCustomAdd', 'parentId':'pcm_mturkHitsCustom', 'contexts':['selection']});
      this.customMenuAdded = true;
    }
  }
  /** Removes the custom context menu and sets the value customMenuAdded to false so it knows the menu is not already added. **/
  removeCustomContextMenu() {
    if (this.customMenuAdded) {
       browser.contextMenus.remove('pcm_mturkHitsTriggerCustomAdd'); browser.contextMenus.remove('pcm_mturkHitsCustom');
      this.customMenuAdded = false;
    }
  }
  /** Uses the info from a contextMenu click and will add a panda/trigger job or a custom trigger from a selected text over 3 letters.
   * @async                - To wait for successful addition of trigger and then append all fragments so the new trigger is shown on SearchUI.
   * @param  {object} info - Info from the contextMenus action.
  **/
  async contextActions(info) {
    if (info.linkUrl) {
      let [groupId, reqId] = parsePandaUrl(info.linkUrl);
      let command = null;
      if (groupId && info.menuItemId === 'pcm_mturkHitsPandaAdd') command = 'addJob'; else if (groupId && info.menuItemId === 'pcm_mturkHitsPandaOnceAdd') command = 'addOnceJob';
      else if (groupId && info.menuItemId === 'pcm_mturkHitsTriggerGIDAdd') command = 'addSearchOnceJob';
      else if (reqId && info.menuItemId === 'pcm_mturkHitsTriggerRIDAdd') command = 'addSearchMultiJob';
      if (command) {
        let theRid = reqId || null, reqName = reqId || groupId, theDesc = reqId || groupId, theTitle = reqId || groupId;
        MyPandaUI.addFromExternal({'command':command, 'groupId':groupId, 'description':theDesc, 'title':theTitle, 'reqId':theRid, 'reqName':reqName, 'price':'0.00'});
      }
    } else {
      if (info.menuItemId === 'pcm_mturkHitsTriggerCustomAdd') {
        let customText = info.selectionText.toLowerCase().trim();
        if (customText.length > 3 && !customText.includes('://')) {
          let theName = `${customText} - ${Date.now()}`, searchOpt = MyOptions.doSearch();
          let addSuccess = await MySearch.addTrigger('custom', {'name':theName, 'reqId':null, 'groupId':null, 'title':'', 'reqName':'', 'pay':0.01, 'status':'searching'}, {'tempDuration': searchOpt.defaultDur, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'tempFetches':searchOpt.defaultFetches, 'autoGoHam':true, 'tempGoHam':searchOpt.defaultCustHamDur, 'acceptLimit':0, 'auto':false}, {'terms':true, 'include':new Set([customText]), 'payRange': true, 'minPay':0.01});
          if (addSuccess && MySearchUI) MySearchUI.appendFragments();
        }
      }
    }
  }
  removeContextAll() {
    browser.contextMenus.removeAll();
  }
}
