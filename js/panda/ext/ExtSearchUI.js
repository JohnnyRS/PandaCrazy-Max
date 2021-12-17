const PCM_search2Channel = new BroadcastChannel('PCM_kSearch2_band');  // Used specifically for promises so search page can wait for a response on search channel.
const PCM_searchChannel = new BroadcastChannel('PCM_kSearch_band');    // Used for sending and receiving messages from search page.

/** Class dealing with the messaging from the SearchUI to the PandaUI page through Broadcast channels.
 * @class ExtSearchUI ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ExtSearchUI {
  constructor() {
		this.searchGStats = new SearchGStats();     // Sets up the search global stats class for SearchUI page.
  }

  // Methods which do not need to send messages back and forth.
  isSearchUI() { return gPCM_searchOpened; }

  /** Methods that pass messages through the Broadcast channel to the search class but no parameters because it gets passed through. */
  // Methods to send a message but doesn't have to wait for a response and no arguments to pass.
  nowLoggedOff() { PCM_searchChannel.postMessage({'msg':'searchTo: nowLoggedOff'}); }
  nowLoggedOn() { PCM_searchChannel.postMessage({'msg':'searchTo: nowLoggedOn'}); }
  nowPaused() { PCM_searchChannel.postMessage({'msg':'searchTo: nowPaused'}); }
  unPaused() { PCM_searchChannel.postMessage({'msg':'searchTo: unPaused'}); }
  stopSearching() { PCM_searchChannel.postMessage({'msg':'searchTo: stopSearching'}); }
  startSearching() { PCM_searchChannel.postMessage({'msg':'searchTo: startSearching'}); }
  importing() { PCM_searchChannel.postMessage({'msg':'searchTo: importing'}); }
  importingDone() { PCM_searchChannel.postMessage({'msg':'searchTo: importingDone'}); }
  importCompleted() { PCM_searchChannel.postMessage({'msg':'searchTo: importCompleted'}); }
  goRestart() { PCM_searchChannel.postMessage({'msg':'searchTo: goRestart'}); }
  themeChanged() { PCM_searchChannel.postMessage({'msg':'searchTo: themeChanged'}); }
  releaseHoldAlarm() { PCM_searchChannel.postMessage({'msg':'searchTo: releaseHoldAlarm'}); }

  // Methods to send a message but doesn't have to wait for a response and with arguments to pass.
  externalSet() { PCM_searchChannel.postMessage({'msg':'searchTo: externalSet', 'value':[...arguments]}); }
  updateStatNav() { PCM_searchChannel.postMessage({'msg':'searchTo: updateStatNav', 'value':[...arguments]}); }
  removeTrigger() { PCM_searchChannel.postMessage({'msg':'searchTo: removeTrigger', 'value':[...arguments]}); }
  redoFilters() { PCM_searchChannel.postMessage({'msg':'searchTo: redoFilters', 'value':[...arguments]}); }
  triggeredHit() { PCM_searchChannel.postMessage({'msg':'searchTo: triggeredHit', 'value':[...arguments]}); }
  updateStats() { PCM_searchChannel.postMessage({'msg':'searchTo: updateStats', 'value':[...arguments]}); }
	addToUI() { PCM_searchChannel.postMessage({'msg':'searchTo: addToUI', 'value':[...arguments]}); }
  updateTrigger() { PCM_searchChannel.postMessage({'msg':'searchTo: updateTrigger', 'value':[...arguments]}); }
  statusMe() { PCM_searchChannel.postMessage({'msg':'searchTo: statusMe', 'value':[...arguments]}); }
  appendFragments() { PCM_searchChannel.postMessage({'msg':'searchTo: appendFragments', 'value':[...arguments]}); }
  resetToolTips() { PCM_searchChannel.postMessage({'msg':'searchTo: resetToolTips', 'value':[...arguments]}); }

  // Combo methods for specific multiple actions needed instead of sending multiple messages.
  getTheGroups() {}
  groupingExternalCommand() {}
}

/** A function to send messages through a Broadcast channel PCM_search2Channel easier.
 * @param  {string} returning - Returning string message.  @param  {object} value - The value to send back.  @param  {string} [subject] - The subject of this message.
**/
function sendToChannel(returning, value, subject='search') { PCM_search2Channel.postMessage({'msg':`${subject}: returning ${returning}`, 'value':value}); }

/** Listens on a channel for messages from PandaUI to the SearchUI page. **/
PCM_searchChannel.onmessage = async (e) => {
  if (e.data && gPCM_searchOpened) {
    const data = e.data, val = data.value;
    if (data.msg === 'search: stopSearching') { if (MySearch) MySearch.stopSearching(); }
    else if (data.msg === 'search: unPauseTimer') { MySearch.unPauseTimer(); }
    else if (data.msg === 'search: pauseTimer') { MySearch.pauseTimer(); }
    else if (data.msg === 'searchGStat: searchingOff') { MySearchUI.searchGStats.searchingOff(); }
    else if (data.msg === 'searchGStat: searchingOn') { MySearchUI.searchGStats.searchingOn(); }
    else if (data.msg === 'searchGStat: prepare') { MySearchUI.searchGStats.prepare(); }
    else if (data.msg === 'searchGStat: toggleStat') { MySearchUI.searchGStats.toggleStat(val[0], val[1], val[2]); }
  }
}

/** Listens on a channel for messages from PandaUI to the SearchUI page. **/
PCM_search2Channel.onmessage = async (e) => {
  if (e.data && gPCM_searchOpened && MySearch) {
    const data = e.data;
    if (data.msg === 'search: startSearching') { let retVal = MySearch.startSearching(); sendToChannel('startSearching', retVal); }
    else if (data.msg === 'search: loadFromDB') {
      let success = [], err = null;
      await MySearch.loadFromDB( (s, e) => { success = s; err = e; });
      let retVal = {'success':success, 'err':err};
      sendToChannel('loadFromDB', retVal);
    }
    else if (data.msg === 'search: resetSearch') { await MySearch.resetSearch(); sendToChannel('resetSearch', null); }
    else if (data.msg === 'search: toggleAutoHits') { let retVal = await MySearch.autoHitsAllow(!MySearch.autoHitsAllow()); sendToChannel('toggleAutoHits', retVal); }
    else if (data.msg === 'searchGStat: isSearchOn') { let retVal = await MySearchUI.searchGStats.isSearchOn(); sendToChannel('isSearchOn', retVal, 'searchGStat'); }
    else if (data.msg === 'searchGStat: getStats') { let retVal = await MySearchUI.searchGStats.getStats(); sendToChannel('getStats', retVal, 'searchGStat');
    } else if (data.value) {
      const val = data.value;
      if (data.msg === 'search: addTrigger') { let retVal = await MySearch.addTrigger(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('addTrigger', retVal); }
      else if (data.msg === 'search: removeTrigger') { await MySearch.removeTrigger(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('removeTrigger', null); }
      else if (data.msg === 'search: optionsCopy') { let retVal = await MySearch.optionsCopy(val[0]); sendToChannel('optionsCopy', retVal); }
      else if (data.msg === 'search: sendToPanda') { await MySearch.sendToPanda(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('sendToPanda', null); }
      else if (data.msg === 'search: optionsChanged') { await MySearch.optionsChanged(val[0], val[1]); sendToChannel('optionsChanged', null); }
      else if (data.msg === 'search: rulesCopy') { let retVal = await MySearch.rulesCopy(val[0]); sendToChannel('rulesCopy', retVal); }
      else if (data.msg === 'search: timerChange') { let retVal = await MySearch.timerChange(val[0]); sendToChannel('timerChange', retVal); }
      else if (data.msg === 'search: pandaToDbId') { let retVal = await MySearch.pandaToDbId(val[0]); sendToChannel('pandaToDbId', retVal); }
      else if (data.msg === 'search: getData') { let retVal = await MySearch.getData(val[0]); sendToChannel('getData', retVal); }
      else if (data.msg === 'search: theData') { let retVal = await MySearch.theData(val[0], val[1], val[2]); sendToChannel('theData', retVal); }
      else if (data.msg === 'search: uniqueToDbId') { let retVal = await MySearch.uniqueToDbId(val[0]); sendToChannel('uniqueToDbId', retVal); }
      else if (data.msg === 'search: getFrom') { let retVal = await MySearch.getFrom(val[0]); sendToChannel('getFrom', retVal); }
      else if (data.msg === 'search: theBlocked') { let retVal = await MySearch.theBlocked(val[0], val[1], val[2], val[3], val[4]); sendToChannel('theBlocked', retVal); }

        // ********** Start of multiple actions needed for search messages. ************
      else if (data.msg === 'search: doFilterSearch') { let retVal = MySearch.getFrom('Search').filter((item) => MySearch[val[0]](item)); sendToChannel('doFilterSearch', retVal); }
      else if (data.msg === 'search: getToggleTrigger') {
        let item = MySearch.getTrigger(val[0]); MySearch.toggleTrigger(null, val[0], val[1], val[2]); sendToChannel('getToggleTrigger', item.count);
      } else if (data.msg === 'search: getBothBlocked') {
        let gidVals = MySearch.getBlocked(), ridVals = MySearch.getBlocked(false); sendToChannel('getBothBlocked', [gidVals, ridVals]);
      } else if (data.msg === 'search: getDataTrigger') {
        let status = (val[1] !== null) ? val[1] : MySearch.toggleTrigger(val[0]), info = MySearch.getData(MySearch.uniqueToDbId(val[0])); sendToChannel('getDataTrigger', [info, status]);
      } else if (data.msg === 'search: getTrigData') {
        let trigger = MySearch.getTrigger(val[0]), gotData = MySearch.getData(val[0]), theData = (val[1]) ? await MySearch.theData(val[0], val[1]) : null;
        sendToChannel('getTrigData', [trigger, gotData, theData]);
      } else if (data.msg === 'search: getUniquesDbIds') {
        let retVal = []; for (let dbId of val[0]) { retVal.push(MySearch.getTrigger(dbId).count); } sendToChannel('getUniquesDbIds', retVal);
      } else if (data.msg === 'search: doRidSearch') {
        let timerUnique = MySearch.doRidSearch(val[0], async (timerUnique, elapsed, rId) => {
          await MySearch.goFetch(MySearch.createReqUrl(rId), timerUnique, elapsed, MySearch.uniqueToDbId(val[1]), 'gid', val[2], true, val[2]);
        });
        sendToChannel('doRidSearch', timerUnique);
      } else if (data.msg === 'search: sortingTriggers') {
        let retVal = {}, uniques = MySearch.getAllUniques();
        for (const unique of Object.keys(uniques)) { let dbId = uniques[unique]; retVal[unique] = MySearch.getData(dbId); }
        sendToChannel('sortingTriggers', retVal);
      } else if (data.msg === 'search: getFromDBData') {
        let groupHist = await MySearch.getFromDB(val[0], val[1], val[2], val[3], val[4], val[5]), rules = await MySearch.theData(val[1], val[6]);
        sendToChannel('getFromDBData', [groupHist, rules]);
      } else if (data.msg === 'search: goCheckGroup') {
        let retVal = {};
        for (const key of val[0]) { myId = (MySearch.getTrigger(key)) ? key : undefined; enabled = (myId !== undefined) ? MySearch.isEnabled(myId) : undefined; retVal[key] = enabled; }
        sendToChannel('goCheckGroup', retVal);
      }
    }
  }
}
