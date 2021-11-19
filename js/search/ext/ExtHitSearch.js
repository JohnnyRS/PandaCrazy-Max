const searchChannel = new BroadcastChannel('PCM_kSearch_band');      // Used for sending and receiving messages from search page.
class ExtHitSearch {
  constructor() {
    this.searchGStats = {
      isSearchOn: async () => { return await this.sendBroadcastMsg('searchGStat: isSearchOn', 'searchGStat: returning isSearchOn', null, null); },
      searchingOff: () => { searchChannel.postMessage({'msg':'searchGStat: searchingOff'}); },
      searchingOn: () => { searchChannel.postMessage({'msg':'searchGStat: searchingOn'}); },
      toggleStat: (v1, v2, v3) => { searchChannel.postMessage({'msg':'searchGStat: toggleStat', 'value':[v1, v2, v3]}); },
      prepare: () => { searchChannel.postMessage({'msg':'searchGStat: prepare'}); }, 
      getStats: async () => { return await this.sendBroadcastMsg('searchGStat: getStats', 'searchGStat: returning getStats', null, null); }, 
    };
    this.searchOn = false;
    this.loggedoff = false;
  }
  async sendBroadcastMsg(msg, retMsg, value=null, timeoutVal=null, timeoutTime=2000) {
    const s2Channel = new BroadcastChannel('PCM_kSearch2_band');
    return new Promise( (resolve) => {
      let thisTimeOut = null;
      s2Channel.postMessage({'msg':msg, 'value':value});
      s2Channel.onmessage = async (e) => {
        s2Channel.close(); if (thisTimeOut) clearTimeout(thisTimeOut);
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        else resolve(false);
      }
      thisTimeOut = setTimeout(() => { s2Channel.close(); resolve(timeoutVal); }, timeoutTime);
    });
  }
  isPandaUI() { return pcm_pandaOpened; }
  
  // Methods to send a message but doesn't have to wait for a response and no arguments to pass.
  stopSearching() { searchChannel.postMessage({'msg':'search: stopSearching'}); }
  unPauseTimer() { searchChannel.postMessage({'msg':'search: unPauseTimer'}); }
  
  // Methods to send a message and wait for a response back and no arguments to pass.
  async loadFromDB() { return await this.sendBroadcastMsg('search: loadFromDB', 'search: returning loadFromDB', null, false, 10000); }
  async startSearching() { return await this.sendBroadcastMsg('search: startSearching', 'search: returning startSearching', null, false); }
  async prepareSearch() { return await this.sendBroadcastMsg('search: prepareSearch', 'search: returning prepareSearch', null, false, 10000); }
  
  // Methods to send a message and wait for a response back and with arguments to pass.
	async getFrom() { return await this.sendBroadcastMsg('search: getFrom', 'search: returning getFrom', [...arguments], false); }
	async theBlocked() { return await this.sendBroadcastMsg('search: theBlocked', 'search: returning theBlocked', [...arguments], false); }
	async theData() { return await this.sendBroadcastMsg('search: theData', 'search: returning theData', [...arguments], false); }
	async optionsChanged() { return await this.sendBroadcastMsg('search: optionsChanged', 'search: returning optionsChanged', [...arguments], false); }
  async uniqueToDbId() { return await this.sendBroadcastMsg('search: uniqueToDbId', 'search: returning uniqueToDbId', [...arguments], false); }
  async getData() { return await this.sendBroadcastMsg('search: getData', 'search: returning getData', [...arguments], false); }
  async sendToPanda() { return await this.sendBroadcastMsg('search: sendToPanda', 'search: returning sendToPanda', [...arguments], false); }
  async pandaToDbId() { return await this.sendBroadcastMsg('search: pandaToDbId', 'search: returning pandaToDbId', [...arguments], false); }
  async timerChange() { return await this.sendBroadcastMsg('search: timerChange', 'search: returning timerChange', [...arguments], false); }
  async pauseToggle() { return await this.sendBroadcastMsg('search: pauseToggle', 'search: returning pauseToggle', [...arguments], null); }
  async optionsCopy() { return await this.sendBroadcastMsg('search: optionsCopy', 'search: returning optionsCopy', [...arguments], null); }
	async rulesCopy() { return await this.sendBroadcastMsg('search: rulesCopy', 'search: returning rulesCopy', [...arguments], null); }
  async addTrigger() { return await this.sendBroadcastMsg('search: addTrigger', 'search: returning addTrigger', [...arguments], null); }
  async removeTrigger() { return await this.sendBroadcastMsg('search: removeTrigger', 'search: returning removeTrigger', [...arguments], null); }
  
  // Combo methods for specific multiple actions needed instead of sending multiple messages.
  async toggleAutoHits() { return await this.sendBroadcastMsg('search: toggleAutoHits', 'search: returning toggleAutoHits', null, false); }
  async doRidSearch() { return await this.sendBroadcastMsg('search: doRidSearch', 'search: returning doRidSearch', [...arguments], null); }
  async doFilterSearch() { return await this.sendBroadcastMsg('search: doFilterSearch', 'search: returning doFilterSearch', [...arguments], null); }
  async getToggleTrigger() { return await this.sendBroadcastMsg('search: getToggleTrigger', 'search: returning getToggleTrigger', [...arguments], null); }
  async getDataTrigger() { return await this.sendBroadcastMsg('search: getDataTrigger', 'search: returning getDataTrigger', [...arguments], null, 12000); }
  async goCheckGroup() { return await this.sendBroadcastMsg('search: goCheckGroup', 'search: returning goCheckGroup', [...arguments], null); }
  async getTrigData() { return await this.sendBroadcastMsg('search: getTrigData', 'search: returning getTrigData', [...arguments], [null, null, null], 12000); }
  async sortingTriggers() { return await this.sendBroadcastMsg('search: sortingTriggers', 'search: returning sortingTriggers', [...arguments], null, 12000); }
  async getFromDBData() { return await this.sendBroadcastMsg('search: getFromDBData', 'search: returning getFromDBData', [...arguments], null, 12000); }
  async getBothBlocked() { return await this.sendBroadcastMsg('search: getBothBlocked', 'search: returning getBothBlocked', [...arguments], null, 12000); }
  async getUniquesDbIds() { return await this.sendBroadcastMsg('search: getUniquesDbIds', 'search: returning getUniquesDbIds', [...arguments], null, 12000); }
}

function sendToChannel(msg, value) { search2Channel.postMessage({'msg':msg, 'value':value}); }

searchChannel.onmessage = async (e) => {
  if (e.data && MySearchUI) {
    const data = e.data, msg=data.msg, val = data.value, theObject = data.object;
    if (msg === 'search: go for start') { startNow(); }
    else if (msg === 'search: abort start') {  }
    else if (msg === 'search: DB loaded') { MySearchUI.appendFragments(); setTimeout( () => { modal.closeModal('Loading Data'); }, 300); }
    else if (msg === 'searchTo: nowLoggedOn') { MySearchUI.nowLoggedOn(); }
    else if (msg === 'searchTo: nowLoggedOff') { MySearchUI.nowLoggedOff(); }
    else if (msg === 'searchTo: stopSearching') { MySearchUI.stopSearching(); }
    else if (msg === 'searchTo: importing') { MySearchUI.importing(); }
    else if (msg === 'searchTo: importingDone') { MySearchUI.importingDone(); }
    else if (msg === 'searchTo: importCompleted') { MySearchUI.importCompleted(); }
    else if (msg === 'searchTo: goRestart') { MySearchUI.goRestart(); }
    else if (msg === 'searchTo: themeChanged') { MySearchUI.themeChanged(); }
    else if (msg === 'searchTo: startSearching') { await MySearchUI.startSearching(); }
    else if (msg === 'searchTo: releaseHoldAlarm') { MySearchUI.releaseHoldAlarm(); }
    else if (msg === 'searchTo: globalOptions' && theObject) {
      MyOptions.doGeneral(theObject.general, false); MyOptions.doSearch(theObject.search, false); MyOptions.doTimers(theObject.timers, false); MyOptions.doAlarms(theObject.alarms, false);
      MyOptions.doRanges(theObject.ranges, false); MyOptions.update(false);  
    }
    else if (val) {
      if (msg === 'searchTo: resetToolTips') { MySearchUI.resetToolTips(val[0]); }
      else if (msg === 'searchTo: statusMe') { MySearchUI.statusMe(val[0], val[1]); }
      else if (msg === 'searchTo: updateStats') { MySearchUI.updateStats(val[0], val[1], val[2]); }
      else if (msg === 'searchTo: triggeredHit') { MySearchUI.triggeredHit(val[0], val[1], val[2], val[3], val[4]); }
      else if (msg === 'searchTo: addToUI') { MySearchUI.addToUI(val[0], val[1], val[2], val[3]); }
      else if (msg === 'searchTo: redoFilters') { MySearchUI.redoFilters(val[0], val[1], val[2]); }
      else if (msg === 'searchTo: removeTrigger') { MySearchUI.removeTrigger(val[0]); }
      else if (msg === 'searchTo: updateStatNav') { MySearchUI.updateStatNav(val[0], val[1]); }
      else if (msg === 'searchTo: appendFragments') { await MySearchUI.appendFragments(val[0]); }
      else if (msg === 'searchTo: externalSet') { await MySearchUI.externalSet(val[0], val[1]); }
      else if (msg === 'searchTo: updateTrigger') { await MySearchUI.updateTrigger(val[0], val[1], val[2]); }
    }
  }
};
