class MturkHitSearch extends MturkClass {
  constructor(timer) {
    super();
    this.timerUnique = null;        					// Unique number for this timer in queue
		this.hitSearchResults = [];		  					// Array of unique value for objects
		this.lastSearchIdentify = [];							// Last hit position Indentifier Array
		this.hitSearchObjects = {};								// Objects of hits
		this.hitRequesters = {};									// Object of requester hit arrays
		this.triggerInfo = {"rid":{}, "gid":{}};	// Object of trigger info for rid and gid
		this.liveTriggers = [];
		this.disabledTriggers = [];
		this.triggersAdded = 0;
		this.pandaCollecting = [];								// Array of all panda gId's collecting now
		this.searchGStats =  new SearchGStats();	// global search stats
		this.dataUnique = 0;            	// Unique number for each hit data that it finds
		this.searchUrl = null;          	// Url class for search url
		this.pageSize = 25;             	// Only 25 hits to show on page by default
		this.onlyQualified = true;      	// Show only qualified hits in search results
		this.onlyMasters = false;       	// Show only master hits in search results
		this.minReward = 0.01;          	// The minimum reward will be $0.01 by default
		this.json = true;               	// Format json in url or not
		this.loggedOff = false;         	// Are we logged off from mturk?
		this.closing = false;
    this.sort = "updated_desc";     	// Sort by updated_desc by default
    this.sorting = ["updated_desc", 	// Set up sort array with all sorting options
			"updated_asc", "reward_asc", "reward_desc", "hits_asc", "hits_desc"];
		searchTimer.setMyClass(this);			// Tell timer what class is using it so it can send information back
		searchTimer.setTimer(timer);    	// Set timer for this timer
		this.prepareSearch();
	}
	is(key1, key2) { if (!(this.triggerInfo.hasOwnProperty(key1))) return false; if (!(this.triggerInfo[key1].hasOwnProperty(key2)) ) return false; return true; }
	isPandaUI() { return (extPandaUI!==null); }
	timerInfo(infoObj) {}
	unPauseTimer() { searchTimer.unPauseTimer(); }
	gotNewQueue() { this.nowLoggedOn(); }
	nowLoggedOff() {
    searchTimer.pauseTimer(); this.loggedOff = true;
    if (extSearchUI) extSearchUI.nowLoggedOff();
	}
	nowLoggedOn() {
    searchTimer.unPauseTimer(); this.loggedOff = false;
    if (extSearchUI) extSearchUI.nowLoggedOn();
	}
  fillData(w) {
		this.hitSearchResults.unshift(this.dataUnique);
		if (this.hitRequesters.includes(w.requester_id)) {
      this.hitRequesters[w.requester_id].unshift(this.dataUnique);
    } else {
      this.hitRequesters[w.requester_id] = [this.dataUnique];
    }
		this.hitSearchObjects[this.dataUnique] = { hitId:w.hit_set_id, reqId:w.requester_id, reqName:w.requester_name, title:w.title, description:w.description, duration:w.assignment_duration_in_seconds, hitCount:w.assignable_hits_count, allowed:w.caller_meets_requirements, prevAllowed:w.caller_meets_preview_requirements, reward:w.monetary_reward.amount_in_dollars, acceptUrl:w.accept_project_task_url, reqUrl:w.requester_url, prevUrl:w.project_tasks_url, dateAdded: new Date(), creationDate:w.creation_time, expireDate:w.latest_expiration_time };
		this.dataUnique++;
	}
	startSearching() {
		if (this.timerUnique) return;
		console.log("startsearching: add this");
		this.searchGStats.searchingOn();
		this.timerUnique = searchTimer.addToQueue(-1, this, (timerUnique, elapsed) => { 
      this.goFetch(this.searchUrl, timerUnique, elapsed); // do this every cycle
		}, () => { this.stopSearching(); }); // do after when timer is removed from queue
	}
	stopSearching() {
		if (this.timerUnique) {
			console.log("stopsearching: delete " + this.timerUnique);
			searchTimer.deleteFromQueue(this.timerUnique);
			this.timerUnique = null;
			this.searchGStats.searchingOff();
		}
	}
	pandaStatus(gId,status) {
		if (this.triggerInfo["gid"].hasOwnProperty(gId)) {
			const info = this.triggerInfo["gid"][gId];
			if (status) this.pandaCollecting.push(gId);
			else this.pandaCollecting = this.pandaCollecting.filter(item => item !== gId);
			if (!info.disabled) {
				info.tempDisabled = !status;
				this.toggleDisabled(gId, this.triggerInfo["gid"][gId], true);
			}
		}
	}
	requesterTempBlockGid(trigger, gId) {
		if (!(trigger.hasOwnProperty("tempBlockGid"))) trigger.tempBlockGid = [];
		if (!trigger.tempBlockGid.includes(gId)) trigger.tempBlockGid.push(gId);
	}
	isGidBlocked(trigger, gId) {
		if (trigger.hasOwnProperty("tempBlockGid") && trigger.tempBlockGid.includes(gId)) return true;
		else if (trigger.hasOwnProperty("blockGid") && trigger.blockGid.includes(gId)) return true;
		return false;
	}
	sendToPanda(item,triggerInfo) {
		if (extPandaUI) extPandaUI.addAndRunPanda(item.hit_set_id, item.description, item.title, item.requester_id, item.requester_name, item.monetary_reward.amount_in_dollars, triggerInfo.once, null, item.assignable_hits_count, triggerInfo.limitNumQueue, triggerInfo.limitTotalQueue, -1, triggerInfo.duration, triggerInfo.tempGoHam);
	}
	checkTriggers(item) {
		for (const trigger of this.liveTriggers) {
			const idString = `[${item.hit_set_id}][${item.requester_id}]`;
			const triggerInfo = this.triggerInfo[trigger.type][trigger.value];
			if (trigger.type==="rid" && this.isGidBlocked(triggerInfo, item.hit_set_id)) { return null; }
			if (trigger.type==="rid" || trigger.type==="gid") {
				if (idString.includes(`[${trigger.value}]`)) {
					if (!this.pandaCollecting.includes(item.hit_set_id)) {
						console.log(`Found a trigger: ${triggerInfo.name} - ${item.assignable_hits_count} - ${item.hit_set_id} - ${item.creation_time}`);
						this.sendToPanda(item,triggerInfo);
						if (triggerInfo.once && trigger.type==="rid") this.requesterTempBlockGid(triggerInfo, item.hit_set_id);
					}
				}
			}
		}
	}
	toggleDisabled(key2, info, tempDisabled=false, moveIt=true) {
		// toggle disabled value and live or disabled trigger.
		// if moveIt=false then removes from trigger arrays and leaves disabled value alone.
		const disabled = (tempDisabled) ? info.tempDisabled : info.disabled;
		const targetArr = (!disabled) ? this.liveTriggers : this.disabledTriggers;
		const moveToArr = (!disabled) ? this.disabledTriggers : this.liveTriggers;
		const removeIndex = targetArr.map(function(item) { return item.value; }).indexOf(key2);
		if (removeIndex!==-1) {
			const objs = targetArr.splice(removeIndex,1);
			if (moveIt) { 
				moveToArr.push(objs[0]);
				if (!tempDisabled) info.disabled = !info.disabled;
				else info.tempDisabled = !info.tempDisabled;
				if (this.searchGStats.isSearchOn() && this.liveTriggers.length===0) this.stopSearching();
			}
		}
	}
	checkTrigger(checkWithThis,key1,key2) {
		const info = this.triggerInfo[key1][key2];
		if (info.disabled === checkWithThis) {
			this.toggleDisabled(key2, info);
			if (extSearchUI) extSearchUI.updateTrigger(null,info,false);
		}
	}
	disableTrigger(key1, key2) { if (this.is(key1,key2)) this.checkTrigger(false, key1, key2);  }
	enableTrigger(key1, key2) { if (this.is(key1,key2)) this.checkTrigger(true, key1, key2);  }
  foundNewHit(hitData) {
		if (this.liveTriggers.length) this.checkTriggers(hitData);
      //this.fillData(thisItem);
    // else
    // 	continueNow = false;
	}
	addTrigger(type, value, info) {
		// requesterid, groupid, price, titlekeyword, descriptionkeyword, duration, hitcount, allowed, prevallowed, dateadded
		this.triggersAdded++;
		info.tempDisabled = false; // tempDisabled is used for temporary disabling trigger if it's running in PandaCrazy
		info.key1 = type; // key1 will be for the type of trigger
		info.key2 = value; // key2 will be for the value of trigger
		info.count = this.triggersAdded; // count will be the unique number for trigger
		if (this.triggerInfo[type][value]) { this.enableTrigger(type, value); return null; }
		this.triggerInfo[type][value] = Object.assign({}, info); // set up trigger info data with the info
    const gid = (type==="gid") ? value : ""; // if trigger is a gid then get the gid value
    const collectingPanda = (gid!=="" && this.pandaCollecting.includes(gid)); // is PandaCrazy collecting it?
    if ( collectingPanda || info.disabled) { // is panda collecting it or is it disabled?
      // disable trigger if it's disabled or already collecting in PandaCrazy
      this.disabledTriggers.push({type:type, value:value}); // put this trigger in the disabled array
      if (collectingPanda) info.tempDisabled = true; // set the disable temporary if PandaCrazy collecting it.
    } else this.liveTriggers.push({type:type, value:value}); // enable the trigger right away.
		if (extSearchUI) {
			const index = Object.keys(this.triggerInfo[info.key1]).length;
			extSearchUI.addToUI(this.triggerInfo[type][value], index);
		} else if (!info.disabled) this.startSearching();
		if (this.searchGStats.isSearchOn() && this.liveTriggers.length>0) this.startSearching();
		return this.triggersAdded;
	}
	removeTrigger(type, value) {
		if (this.triggerInfo[type][value]) {
			let info = this.triggerInfo[type][value];
			this.toggleDisabled(value, info, false, false);
			delete this.triggerInfo[type][value];
			if (extSearchUI) extSearchUI.removeTrigger(type, info.count);
		}
		if (this.searchGStats.isSearchOn() && this.liveTriggers.length===0) this.stopSearching();
	}
	openUI(origin="pandaUI") {
		Object.keys(this.triggerInfo).forEach( key => {
			Object.keys(this.triggerInfo[key]).forEach( key2 => {
				if (extSearchUI && this.triggerInfo[key][key2].from===origin) {
					const index = Object.keys(this.triggerInfo[key]).length;
					console.log(this.triggerInfo[key][key2],index);
					extSearchUI.addToUI(this.triggerInfo[key][key2], index);
				}
			});
		});
		this.searchGStats.searchingOn();
	}
	closedUI(origin="searchUI") {
		Object.keys(this.triggerInfo).forEach( key => {
			Object.keys(this.triggerInfo[key]).forEach( key2 => {
				if (this.triggerInfo[key][key2].from===origin) this.removeTrigger(key, key2);
			});
		});
	}
  goFetch(objUrl, timerUnique, elapsed) {
    // Can deal with getting search results data.
		this.searchGStats.setSearchElapsed(elapsed); // Pass elapsed time to global search stats
    super.goFetch(objUrl).then(result => { // Go fetch this url and bring back results from a promise
			this.searchGStats.addTotalSearchFetched(); // Increment counter for total searches fetched
			if (result.mode === "logged out" && timerUnique !== null) this.nowLoggedOff();
			else if (result.type === "ok.json") {
				if (result.mode === "pre") {
          this.searchGStats.addTotalSearchPRE(); // found a PRE while searching so increment search pre counter
				} else {
          this.searchGStats.addTotalSearchResults(result.data.total_num_results);
					let i = 0, indentifyArr = [], continueNow = true, thisItem = null, hitPosId = null;
					do {
            thisItem = result.data.results[i++];
            // hitPosId represents a signature for this particular hit using creation time and hit set ID
						hitPosId = new Date(thisItem.creation_time).getTime() + "" +  thisItem.hit_set_id;
            indentifyArr.push(hitPosId); // let's add the signature to an indentify array
            // check if signature is unique and then check all triggers.
						if (this.lastSearchIdentify.filter(value => value.includes(hitPosId)).length === 0) {
              this.foundNewHit(thisItem); // Inform search UI that it found a new hit
						}
          } while (continueNow && i < result.data.results.length);
          this.searchGStats.addTotalSearchHits(this.hitSearchResults.length);
					this.lastSearchIdentify.unshift(indentifyArr); // add new signatures to the beginning of the array
					this.lastSearchIdentify = this.lastSearchIdentify.slice(0,50); // Remember last 50 signatures
				}
			 }
    });
  }
	createSearchUrl() { // return search url with all options added
		const formatJson = (this.json) ? "&format=json" : ""; // add format json or not?
		return `https://worker.mturk.com/?page_size=${this.pageSize}&filters%5Bqualified%5D=${this.onlyQualified}&filters%5Bmasters%5D=${this.onlyMasters}&sort=${this.sort}&filters%5Bmin_reward%5D=${this.minReward}${formatJson}`;
	}
	prepareSearch(json=true, pageSize=35, onlyQual=true, onlyMasters=false, sort="updated_desc", minReward="0.01") {
		this.sort = (this.sorting.includes(sort)) ? sort : this.sorting[0];// set up sorting with passed value or default
		this.json = json; this.pageSize = pageSize; this.onlyQualified = onlyQual;
		this.onlyMasters = onlyMasters; this.minReward = minReward;
		this.searchUrl = new UrlClass(this.createSearchUrl()); // let's set up search url object with search options
  }
}
