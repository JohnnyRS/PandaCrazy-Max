const search2Channel = new BroadcastChannel('PCM_kSearch2_band');  // Used specifically for promises so search page can wait for a response on search channel.
const searchChannel = new BroadcastChannel('PCM_kSearch_band');      // Used for sending and receiving messages from search page.

class ExtSearchUI {
  constructor() {
		this.searchGStats = new SearchGStats();
  }
	addToUI(trigger, status, name, unique) { if (extSearchUI) extSearchUI.addToUI(trigger, status, name, unique); }
  nowLoggedOff() { if (extSearchUI) extSearchUI.nowLoggedOff(); }
  nowLoggedOn() { if (extSearchUI) extSearchUI.nowLoggedOn(); }
  updateStatNav(statObj, text='') { if (extSearchUI) extSearchUI.updateStatNav(statObj, text); }
  resetToolTips(enabled) { if (extSearchUI) extSearchUI.resetToolTips(enabled); }
  importing() { if (extSearchUI) extSearchUI.importing(); }
  importingDone() { if (extSearchUI) extSearchUI.importingDone(); }
  stopSearching() { if (extSearchUI) extSearchUI.stopSearching(); }
  statusMe(unique, status) { if (extSearchUI) extSearchUI.statusMe(unique, status); }
  updateStats(count, data) { if (extSearchUI) extSearchUI.updateStats(count, data); }
  triggeredHit(count, data, item, term, started, auto) { if (extSearchUI) extSearchUI.triggeredHit(count, data, item, term, started, auto); }
  redoFilters(type) { if (extSearchUI) extSearchUI.redoFilters(type); }
  appendFragments() { if (extSearchUI) extSearchUI.appendFragments(); }
  removeTrigger(count) { if (extSearchUI) extSearchUI.removeTrigger(count); }
  themeChanged() { if (extSearchUI) extSearchUI.themeChanged(); }

  isSearchUI() { return (extSearchUI !== null); }
  // Combo methods for specific multiple actions needed instead of sending multiple messages.
  moveToSearch(data, status, name, count, type) { }
}

function sendToChannel(msg, value) { search2Channel.postMessage({'msg':msg, 'value':value}); }

searchChannel.onmessage = async (e) => {
  if (e.data && searchUIOpened) {
    const data = e.data;
    if (data.msg === 'search: prepareSearch') { mySearch.prepareSearch(); }
    else if (data.msg === 'search: stopSearching') { mySearch.stopSearching(); }
    else if (data.msg === 'search: unPauseTimer') { mySearch.unPauseTimer(); }
  }
}

search2Channel.onmessage = async (e) => {
  if (e.data && searchUIOpened) {
    const data = e.data;
    if (data.msg === 'search: startSearching') {
      let retVal = mySearch.startSearching(); search2Channel.postMessage({'msg':'search: returning startSearching', 'value':retVal});
    } else if (data.value) {
      const val = data.value;
      if (data.msg === 'search: addTrigger') {
        let retVal = await mySearch.addTrigger(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('search: returning addTrigger', retVal);
      } else if (data.msg === 'search: removeTrigger') {
        await mySearch.removeTrigger(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('search: returning removeTrigger', null);
      } else if (data.msg === 'search: optionsCopy') {
        let retVal = await mySearch.optionsCopy(val[0]); sendToChannel('search: returning optionsCopy', retVal);
      } else if (data.msg === 'search: sendToPanda') {
        await mySearch.sendToPanda(val[0], val[1], val[2], val[3], val[4], val[5]); sendToChannel('search: returning sendToPanda', null);
      } else if (data.msg === 'search: rulesCopy') {
        let retVal = await mySearch.rulesCopy(val[0]); sendToChannel('search: returning rulesCopy', retVal);
      } else if (data.msg === 'search: pauseToggle') {
        let retVal = await mySearch.pauseToggle(val[0]); sendToChannel('search: returning pauseToggle', retVal);
      } else if (data.msg === 'search: timerChange') {
        let retVal = await mySearch.timerChange(val[0]); sendToChannel('search: returning timerChange', retVal);
      } else if (data.msg === 'search: pandaToDbId') {
        let retVal = await mySearch.pandaToDbId(val[0]); sendToChannel('search: returning pandaToDbId', retVal);
      } else if (data.msg === 'search: getData') {
        let retVal = await mySearch.getData(val[0]); sendToChannel('search: returning getData', retVal);
      } else if (data.msg === 'search: uniqueToDbId') {
        let retVal = await mySearch.uniqueToDbId(val[0]); sendToChannel('search: returning uniqueToDbId', retVal);

        // ********** Start of multiple actions needed for search messages. ************
      } else if (data.msg === 'search: getToggleTrigger') {
        let item = mySearch.getTrigger(val[0]); mySearch.toggleTrigger(null, val[0], val[1]); sendToChannel('search: returning getToggleTrigger', item.count);
      } else if (data.msg === 'search: getDataTrigger') {
        let status = (val[1] !== null) ? val[1] : mySearch.toggleTrigger(val[0]), info = mySearch.getData(mySearch.uniqueToDbId(val[0]));
        sendToChannel('search: returning getDataTrigger', [info, status]);
      } else if (data.msg === 'search: getTrigData') {
        let trigger = mySearch.getTrigger(val[0]), gotData = mySearch.getData(val[0]), theData = (val[1]) ? await mySearch.theData(val[0], val[1]) : null;
        sendToChannel('search: returning getTrigData', [trigger, gotData, theData]);
      } else if (data.msg === 'search: doRidSearch') {
        let timerUnique = mySearch.doRidSearch(val[0], async (timerUnique, elapsed, rId) => {
          await mySearch.goFetch(mySearch.createReqUrl(rId), timerUnique, elapsed, mySearch.uniqueToDbId(val[1]), 'gid', val[2], true, val[2]);
        });
        sendToChannel('search: returning doRidSearch', timerUnique);
      } else if (data.msg === 'search: sortingTriggers') {
        let retVal = {}, uniques = mySearch.getAllUniques();
        for (const unique of Object.keys(uniques)) {
          let dbId = uniques[unique]; retVal[unique] = mySearch.getData(dbId);
        }
        sendToChannel('search: returning sortingTriggers', retVal);
      } else if (data.msg === 'search: doFilterSearch') {
        let retVal = mySearch.getFrom('Search').filter((item) => mySearch[val[0]](item)); sendToChannel('search: returning doFilterSearch', retVal);
      } else if (data.msg === 'search: goCheckGroup') {
        let retVal = {};
        for (const key of val[0]) {
          myId = (mySearch.getTrigger(key)) ? key : undefined; enabled = (myId !== undefined) ? mySearch.isEnabled(myId) : undefined; retVal[key] = enabled;
        }
        sendToChannel('search: returning goCheckGroup', retVal);
      }
    }
  }
}
