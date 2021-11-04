class ExtHitSearch {
  constructor(pcm_channel, theHitSearch) {
    this.pcm_channel = pcm_channel;
    this.searchGStats = {};
    this.searchOn = false;
    this.loggedoff = false;
    this.theHitSearch = theHitSearch;
  }
  async sendBroadcastMsg(msg, retMsg, value=null) {
    const search_channel = new BroadcastChannel('PCM_ksearch_band');
    return new Promise( (resolve) => {
      search_channel.postMessage({'msg':msg, 'value':value});
      search_channel.onmessage = async (e) => { console.log(e.data);
        if (e.data.msg === retMsg && e.data.value) resolve(e.data.value);
        else resolve(false);
        search_channel.close();
      }
    });
  }
  prepareSearch() {
    this.searchGStats = {
      'prepare': async () => { this.pcm_channel.postMessage({'msg':'search: prepare stats'}); },
      'isSearchOn': () => { return this.searchOn; },
      'searchingOff': () => {  },
      'searchingOn': () => {  },
    }
    this.pcm_channel.postMessage({'msg':'search: prepare'});
  }
  resetSearch() { this.pcm_channel.postMessage({'msg':'search: reset now'}); }
  timerChange() {}
  addTrigger() {
    // MySearch.setTempBlockGid(gId, true);
		// let unique = await MySearch.addTrigger(gId, 'gid', {'name':hitData.title, 'reqId':hitData.requester_id, 'groupId':gId, 'title':hitData.title, 'reqName':hitData.requester_name, 'pay':hitData.monetary_reward.amount_in_dollars, 'status':'finding'}, {'duration': 12000, 'once':once, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':true, 'tempGoHam':5000, 'acceptLimit':0});
  }
  pandaToDbId() {}
  getData() {}
  optionsCopy() {}
  stopSearching() { this.searchOn = false; this.pcm_channel.postMessage({'msg':'search: stop searching'}); }
  async startSearching() { let result = await this.sendBroadcastMsg('search: start searching', 'result return'); if (result) this.searchOn = true; return result; }
  isLoggedOff() { return this.loggedoff; }
  unPauseTimer() { this.pcm_channel.postMessage({'msg':'search: unpause timer'}); }
  toggleTrigger() {}
  getData() {}
  getTrigger() {}
  uniqueToDbId() {}
  data() {}
  setTempBlockGid() {}
  doRidSearch() {}
  createReqUrl() {}
  goFetch() {}
  sendToPanda() {}
  removeTrigger() {}
  isPandaUI() { return true; }
  loadFromDB() { if (this.theHitSearch) this.theHitSearch.loadFromDB(); }

  // Combo methods for specific multiple actions needed instead of sending multiple messages.
  async updateTrigger(unique) { return await this.sendBroadcastMsg('search: update trigger', 'result return', unique); }
  async menuStartButton() {}
}

function searchListener(data) {
  if (data) {
    let obj = data.object, value = data.value;
    if (data.msg === 'search: go for start') { console.log('Go ahead and start search crazy'); startNow(); }
    else if (data.msg === 'search: abort start') console.log('Do not start search crazy because of error.');
    else if (data.msg === 'search: DB loaded') { MySearchUI.appendFragments(); setTimeout( () => { modal.closeModal('Loading Data'); }, 300); }
    else if (data.msg === 'search: logged on') { MySearchUI.nowLoggedOn(); this.loggedon = true; }
    else if (data.msg === 'search: logged off') { MySearchUI.nowLoggedOff(); this.loggedon = false; }
    else if (data.msg === 'search: importing') { MySearchUI.importing(); }
    else if (data.msg === 'search: importing done') { MySearchUI.importingDone(); }
    else if (data.msg === 'search: stop searching') { MySearchUI.stopSearching(true); }
    else if (data.msg === 'search: append fragments') { MySearchUI.appendFragments(); }
    else if (value) {
      if (data.msg === 'search: reset tooltips') { MySearchUI.resetToolTips(value); }
      else if (data.msg === 'search: redo filters') { MySearchUI.redoFilters(value); }
      else if (data.msg === 'search: remove trigger') { MySearchUI.removeTrigger(value); }
    } else if (obj) {
      if (data.msg === 'search: add to UI') { MySearchUI.addToUI(obj.trigger, obj.status, obj.name, obj.unique); }
      else if (data.msg === 'search: update stats nav') { MySearchUI.updateStatNav(obj.statObj, obj.text); }
      else if (data.msg === 'search: status me') { MySearchUI.statusMe(obj.unique, obj.status); }
      else if (data.msg === 'search: update stats') { MySearchUI.updateStats(obj.count, obj.data); }
      else if (data.msg === 'search: triggered hit') { MySearchUI.triggeredHit(obj.count, obj.data, obj.item, obj.term, obj.started, obj.auto); }
      else if (data.msg === 'search: move to search') { MySearchUI.addToUI(obj.data, obj.status, obj.name, obj.count); MySearchUI.redoFilters(obj.type); MySearchUI.appendFragments(); }
    }
    console.log('got msg:', data.msg);
  }
};
