const search2Channel = new BroadcastChannel('PCM_kSearch2_band');  // Used specifically for promises so search page can wait for a response on search channel.
const searchChannel = new BroadcastChannel('PCM_kSearch_band');      // Used for sending and receiving messages from search page.
const pcm_channel = new BroadcastChannel('PCM_kpanda_band');      // Used for sending and receiving messages from search page.

class ExtSearchUI {
  constructor() {
		this.searchGStats = new SearchGStats();
  }

  isSearchUI() { return searchUIOpened; }
  
  // Methods to send a message but doesn't have to wait for a response and no arguments to pass.
  nowLoggedOff() { searchChannel.postMessage({'msg':'searchTo: nowLoggedOff'}); }
  nowLoggedOn() { searchChannel.postMessage({'msg':'searchTo: nowLoggedOn'}); }
  stopSearching() { searchChannel.postMessage({'msg':'searchTo: stopSearching'}); }
  startSearching() { searchChannel.postMessage({'msg':'searchTo: startSearching'}); }
  importing() { searchChannel.postMessage({'msg':'searchTo: importing'}); }
  importingDone() { searchChannel.postMessage({'msg':'searchTo: importingDone'}); }
  importCompleted() { searchChannel.postMessage({'msg':'searchTo: importCompleted'}); }
  goRestart() { searchChannel.postMessage({'msg':'searchTo: goRestart'}); }
  themeChanged() { searchChannel.postMessage({'msg':'searchTo: themeChanged'}); }
  releaseHoldAlarm() { searchChannel.postMessage({'msg':'searchTo: releaseHoldAlarm'}); }
  
  // Methods to send a message but doesn't have to wait for a response and with arguments to pass.
  externalSet() { searchChannel.postMessage({'msg':'searchTo: externalSet', 'value':[...arguments]}); }
  updateStatNav() { searchChannel.postMessage({'msg':'searchTo: updateStatNav', 'value':[...arguments]}); }
  removeTrigger() { searchChannel.postMessage({'msg':'searchTo: removeTrigger', 'value':[...arguments]}); }
  redoFilters() { searchChannel.postMessage({'msg':'searchTo: redoFilters', 'value':[...arguments]}); }
  triggeredHit() { searchChannel.postMessage({'msg':'searchTo: triggeredHit', 'value':[...arguments]}); }
  updateStats() { searchChannel.postMessage({'msg':'searchTo: updateStats', 'value':[...arguments]}); }
	addToUI() { searchChannel.postMessage({'msg':'searchTo: addToUI', 'value':[...arguments]}); }
  updateTrigger() { searchChannel.postMessage({'msg':'searchTo: updateTrigger', 'value':[...arguments]}); }
  statusMe() { searchChannel.postMessage({'msg':'searchTo: statusMe', 'value':[...arguments]}); }
  appendFragments() { searchChannel.postMessage({'msg':'searchTo: appendFragments', 'value':[...arguments]}); }
  resetToolTips() { searchChannel.postMessage({'msg':'searchTo: resetToolTips', 'value':[...arguments]}); }

  // Combo methods for specific multiple actions needed instead of sending multiple messages.
  getTheGroups() { }
  groupingExternalCommand() {}
}

function sendToChannel(returning, value, subject='search') { search2Channel.postMessage({'msg':`${subject}: returning ${returning}`, 'value':value}); }

searchChannel.onmessage = async (e) => {
  if (e.data && searchUIOpened) {
    const data = e.data, val = data.value;
    if (data.msg === 'search: stopSearching') { mySearch.stopSearching(); }
    else if (data.msg === 'search: unPauseTimer') { mySearch.unPauseTimer(); }
    else if (data.msg === 'searchGStat: searchingOff') { MySearchUI.searchGStats.searchingOff(); }
    else if (data.msg === 'searchGStat: searchingOn') { MySearchUI.searchGStats.searchingOn(); }
    else if (data.msg === 'searchGStat: prepare') { MySearchUI.searchGStats.prepare(); }
    else if (data.msg === 'searchGStat: toggleStat') { MySearchUI.searchGStats.toggleStat(val[0], val[1], val[2]); }
  }
}

search2Channel.onmessage = async (e) => {
  if (e.data && searchUIOpened) {
    const data = e.data;
    if (data.msg === 'search: startSearching') { let retVal = mySearch.startSearching(); sendToChannel('startSearching', retVal); }
    else if (data.msg === 'search: loadFromDB') { let retVal = await mySearch.loadFromDB(); sendToChannel('loadFromDB', retVal); }
    else if (data.msg === 'search: prepareSearch') { await mySearch.prepareSearch(); sendToChannel('prepareSearch', null); }
    else if (data.msg === 'search: toggleAutoHits') { let retVal = await mySearch.autoHitsAllow(!mySearch.autoHitsAllow()); sendToChannel('toggleAutoHits', retVal); }
    else if (data.msg === 'searchGStat: isSearchOn') { let retVal = await MySearchUI.searchGStats.isSearchOn(); sendToChannel('isSearchOn', retVal, 'searchGStat'); }
    else if (data.msg === 'searchGStat: getStats') { let retVal = await MySearchUI.searchGStats.getStats(); sendToChannel('getStats', retVal, 'searchGStat');
    } else if (data.value) {
      const val = data.value;
      if (data.msg === 'search: addTrigger') { let retVal = await mySearch.addTrigger(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('addTrigger', retVal); }
      else if (data.msg === 'search: removeTrigger') { await mySearch.removeTrigger(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('removeTrigger', null); }
      else if (data.msg === 'search: optionsCopy') { let retVal = await mySearch.optionsCopy(val[0]); sendToChannel('optionsCopy', retVal); }
      else if (data.msg === 'search: sendToPanda') { await mySearch.sendToPanda(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('sendToPanda', null); }
      else if (data.msg === 'search: optionsChanged') { await mySearch.optionsChanged(val[0], val[1]); sendToChannel('optionsChanged', null); }
      else if (data.msg === 'search: rulesCopy') { let retVal = await mySearch.rulesCopy(val[0]); sendToChannel('rulesCopy', retVal); }
      else if (data.msg === 'search: pauseToggle') { let retVal = await mySearch.pauseToggle(val[0]); sendToChannel('pauseToggle', retVal); }
      else if (data.msg === 'search: timerChange') { let retVal = await mySearch.timerChange(val[0]); sendToChannel('timerChange', retVal); }
      else if (data.msg === 'search: pandaToDbId') { let retVal = await mySearch.pandaToDbId(val[0]); sendToChannel('pandaToDbId', retVal); }
      else if (data.msg === 'search: getData') { let retVal = await mySearch.getData(val[0]); sendToChannel('getData', retVal); }
      else if (data.msg === 'search: theData') { let retVal = await mySearch.theData(val[0], val[1], val[2]); sendToChannel('theData', retVal); }
      else if (data.msg === 'search: uniqueToDbId') { let retVal = await mySearch.uniqueToDbId(val[0]); sendToChannel('uniqueToDbId', retVal); }
      else if (data.msg === 'search: getFrom') { let retVal = await mySearch.getFrom(val[0]); sendToChannel('getFrom', retVal); }
      else if (data.msg === 'search: theBlocked') { let retVal = await mySearch.theBlocked(val[0], val[1], val[2], val[3], val[4]); sendToChannel('theBlocked', retVal); }

        // ********** Start of multiple actions needed for search messages. ************
      else if (data.msg === 'search: doFilterSearch') { let retVal = mySearch.getFrom('Search').filter((item) => mySearch[val[0]](item)); sendToChannel('doFilterSearch', retVal); }
      else if (data.msg === 'search: getToggleTrigger') {
        let item = mySearch.getTrigger(val[0]); mySearch.toggleTrigger(null, val[0], val[1], val[2]); sendToChannel('getToggleTrigger', item.count);
      } else if (data.msg === 'search: getBothBlocked') {
        let gidVals = mySearch.getBlocked(), ridVals = mySearch.getBlocked(false); sendToChannel('getBothBlocked', [gidVals, ridVals]);
      } else if (data.msg === 'search: getDataTrigger') {
        let status = (val[1] !== null) ? val[1] : mySearch.toggleTrigger(val[0]), info = mySearch.getData(mySearch.uniqueToDbId(val[0])); sendToChannel('getDataTrigger', [info, status]);
      } else if (data.msg === 'search: getTrigData') {
        let trigger = mySearch.getTrigger(val[0]), gotData = mySearch.getData(val[0]), theData = (val[1]) ? await mySearch.theData(val[0], val[1]) : null;
        sendToChannel('getTrigData', [trigger, gotData, theData]);
      } else if (data.msg === 'search: getUniquesDbIds') {
        let retVal = []; for (let dbId of val[0]) { retVal.push(mySearch.getTrigger(dbId).count); } sendToChannel('getUniquesDbIds', retVal);
      } else if (data.msg === 'search: doRidSearch') {
        let timerUnique = mySearch.doRidSearch(val[0], async (timerUnique, elapsed, rId) => {
          await mySearch.goFetch(mySearch.createReqUrl(rId), timerUnique, elapsed, mySearch.uniqueToDbId(val[1]), 'gid', val[2], true, val[2]);
        });
        sendToChannel('doRidSearch', timerUnique);
      } else if (data.msg === 'search: sortingTriggers') {
        let retVal = {}, uniques = mySearch.getAllUniques();
        for (const unique of Object.keys(uniques)) { let dbId = uniques[unique]; retVal[unique] = mySearch.getData(dbId); }
        sendToChannel('sortingTriggers', retVal);
      } else if (data.msg === 'search: getFromDBData') {
        let groupHist = await mySearch.getFromDB(val[0], val[1], val[2], val[3], val[4], val[5]), rules = await mySearch.theData(val[1], val[6]);
        sendToChannel('getFromDBData', [groupHist, rules]);
      } else if (data.msg === 'search: goCheckGroup') {
        let retVal = {};
        for (const key of val[0]) { myId = (mySearch.getTrigger(key)) ? key : undefined; enabled = (myId !== undefined) ? mySearch.isEnabled(myId) : undefined; retVal[key] = enabled; }
        sendToChannel('goCheckGroup', retVal);
      }
    }
  }
}
