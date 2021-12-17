const PCM_searchChannel = new BroadcastChannel('PCM_kSearch_band');      // Used for sending and receiving messages from search page.

/** This class deals with the different menus and which methods to call for SearchUI page.
 * @class ExtHitSearch ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ExtHitSearch {
  constructor() {
    this.searchGStats = {    // Sets up the search global stats object for SearchUI page.
      isSearchOn: async () => { return await this.sendBroadcastMsg('searchGStat: isSearchOn', 'searchGStat: returning isSearchOn', null, null); },
      searchingOff: () => { PCM_searchChannel.postMessage({'msg':'searchGStat: searchingOff'}); },
      searchingOn: () => { PCM_searchChannel.postMessage({'msg':'searchGStat: searchingOn'}); },
      toggleStat: (v1, v2, v3) => { PCM_searchChannel.postMessage({'msg':'searchGStat: toggleStat', 'value':[v1, v2, v3]}); },
      prepare: () => { PCM_searchChannel.postMessage({'msg':'searchGStat: prepare'}); },
      getStats: async () => { return await this.sendBroadcastMsg('searchGStat: getStats', 'searchGStat: returning getStats', null, null); },
    };
    this.searchOn = false;
    this.loggedoff = false;
  }
  /** Sends a message through the Broadcast channel PCM_hist2Channel and waits for a response or timeouts and then sends the response.
   * @async                        - To wait for the response from a message.
   * @param  {string} msg          - The message to send.             @param  {string} retMsg        - The return string to use.  @param  {object} [value] - The value to send.
   * @param  {object} [timeoutVal] - Object to use when it timeouts.  @param  {number} [timeoutTime] - The timeout time to wait for response.
   * @return {promise}             - A promised value after waiting for a message to return.
   */
   async sendBroadcastMsg(msg, retMsg, value=null, timeoutVal=null, timeoutTime=2000) {
    const PCM_hist2Channel = new BroadcastChannel('PCM_kSearch2_band');
    return new Promise( (resolve) => {
      let thisTimeOut = null;
      PCM_hist2Channel.postMessage({'msg':msg, 'value':value});
      PCM_hist2Channel.onmessage = async (e) => {
        PCM_hist2Channel.close(); if (thisTimeOut) clearTimeout(thisTimeOut);
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        else resolve(false);
      }
      thisTimeOut = setTimeout(() => { PCM_hist2Channel.close(); resolve(timeoutVal); }, timeoutTime);
    });
  }
  // Methods which do not need to send messages back and forth.
  isPandaUI() { return gPCM_pandaOpened; }

  // Methods to send a message but doesn't have to wait for a response and no arguments to pass.
  stopSearching() { PCM_searchChannel.postMessage({'msg':'search: stopSearching'}); }
  unPauseTimer() { PCM_searchChannel.postMessage({'msg':'search: unPauseTimer'}); }
  pauseTimer() { PCM_searchChannel.postMessage({'msg':'search: pauseTimer'}); }

  /** Methods that pass messages through the Broadcast channel to the history class but no parameters because it gets passed through. */
  // Methods to send a message and wait for a response back and no arguments to pass.
  async startSearching() { return await this.sendBroadcastMsg('search: startSearching', 'search: returning startSearching', null, false); }
  async resetSearch() { return await this.sendBroadcastMsg('search: resetSearch', 'search: returning resetSearch', null, false, 10000); }

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
  async optionsCopy() { return await this.sendBroadcastMsg('search: optionsCopy', 'search: returning optionsCopy', [...arguments], null); }
	async rulesCopy() { return await this.sendBroadcastMsg('search: rulesCopy', 'search: returning rulesCopy', [...arguments], null); }
  async addTrigger() { return await this.sendBroadcastMsg('search: addTrigger', 'search: returning addTrigger', [...arguments], null); }
  async removeTrigger() { return await this.sendBroadcastMsg('search: removeTrigger', 'search: returning removeTrigger', [...arguments], null); }
  async loadFromDB() {
    let returnResults =  await this.sendBroadcastMsg('search: loadFromDB', 'search: returning loadFromDB', null, false, 10000);
    if (arguments[0]) arguments[0](returnResults.success, returnResults.err);
    return returnResults;
  }

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

/** Listens on a channel for messages from PandaUI to the SearchUI page. **/
PCM_searchChannel.onmessage = async (e) => {
  if (e.data && MySearchUI) {
    const data = e.data, msg=data.msg, val = data.value, theObject = data.object;
    if (msg === 'search: go for start') { startNow(); }
    else if (msg === 'search: abort start') {  }
    else if (msg === 'search: DB loaded') { MySearchUI.appendFragments(); setTimeout( () => { MyModal.closeModal('Loading Data'); }, 300); }
    else if (msg === 'searchTo: nowLoggedOn') { MySearchUI.nowLoggedOn(); }
    else if (msg === 'searchTo: nowLoggedOff') { MySearchUI.nowLoggedOff(); }
    else if (msg === 'searchTo: nowPaused') { MySearchUI.nowPaused(); }
    else if (msg === 'searchTo: unPaused') { MySearchUI.unPaused(); }
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
      MyOptions.doRanges(theObject.ranges, false);
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
