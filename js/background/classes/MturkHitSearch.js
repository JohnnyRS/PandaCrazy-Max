/** This class takes care of the search trigger data. Also handles dealing with the database to get data.
 * @class MturkHitSearch
 * @extends MturkClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class MturkHitSearch extends MturkClass {
  /**
	 * @param  {number} timer - Time to use for the timer to get next hit search results.
   */
  constructor(timer) {
    super();
    this.timerUnique = null;        					// Unique number for this timer in queue.
		this.hitSearchResults = [];		  					// Array of unique value for objects.
		this.lastSearchIdentify = [];							// Last hit position Indentifier Array.
		this.testString = '';
		this.hitSearchObjects = {};								// Objects of hits.
		this.hitRequesters = {};									// Object of requester hit arrays.
		this.triggerInfo = {"rid":{}, "gid":{}};	// Object of trigger info for rid and gid.
		this.livePandaUIStr = '';
		this.liveSearchUIStr = '';
		this.liveCounter = 0;
		this.triggersAdded = 0;										// The number of triggers added.
		this.pandaCollecting = [];								// Array of all panda gId's collecting now.
		this.searchGStats =  new SearchGStats();	// global search stats.
		this.dataUnique = 0;            					// Unique number for each hit data that it finds.
		this.searchUrl = null;          					// Url class for search url.
		this.pageSize = 25;             					// Only 25 hits to show on page by default.
		this.onlyQualified = true;      					// Show only qualified hits in search results.
		this.onlyMasters = false;       					// Show only master hits in search results.
		this.minReward = 0.01;          					// The minimum reward will be $0.01 by default.
		this.resultsBack = true;
		this.json = true;               					// Format json in url or not.
		this.loggedOff = false;         					// Are we logged off from mturk?
    this.sort = "updated_desc";     					// Sort by updated_desc by default.
    this.sorting = ["updated_desc", 					// Set up sort array with all sorting options.
			"updated_asc", "reward_asc", "reward_desc", "hits_asc", "hits_desc"];
		searchTimer.setMyClass(this);							// Tell timer what class is using it so it can send information back.
		searchTimer.setTimer(timer);    					// Set timer for this timer.
		this.prepareSearch();											// Prepare all the search data.
	}
	/** Find out if a trigger has been added the with key 1 and key 2 values.
	 * @param  {string} type  - Type of the trigger [group ID or requester ID].
	 * @param  {string} value - Group ID or Requester ID for value depending on type.
	 * @return {bool}				  - True if trigger has been added. */
	is(type, value) {
		if (!(this.triggerInfo.hasOwnProperty(type))) return false;
		if (!(this.triggerInfo[type].hasOwnProperty(value)) ) return false; return true;
	}
	/** Find out if a panda UI has been opened.
	 * @return {bool} - True if the panda UI has been opened. */
	isPandaUI() { return (extPandaUI!==null); }
	/** Unpause the search timer. */
	unPauseTimer() { searchTimer.paused = false; }
	/** This method gets called when the queue gets a new result from mturk so it has to be logged on. */
	gotNewQueue() { this.nowLoggedOn(); }
	/** We are logged off so pause the timer and tell the search UI that it's logged off. */
	nowLoggedOff() {
    searchTimer.paused = true; this.loggedOff = true;
    if (extSearchUI) extSearchUI.nowLoggedOff();
	}
	/** We are logged on so unpause timer and tell the search UI that it's logged back in. */
	nowLoggedOn() {
    this.unPauseTimer(); this.loggedOff = false;
    if (extSearchUI) extSearchUI.nowLoggedOn();
	}
  /** This will fill hit information into the hit search object.
   * @param  {object} w - Object with information for this current hit. */
  fillData(w) {
		this.hitSearchResults.unshift(this.dataUnique);
		if (this.hitRequesters.hasOwnProperty(w.requester_id)) {
      this.hitRequesters[w.requester_id].unshift(this.dataUnique);
    } else {
      this.hitRequesters[w.requester_id] = [this.dataUnique];
    }
		this.hitSearchObjects[this.dataUnique] = { hitId:w.hit_set_id, reqId:w.requester_id, reqName:w.requester_name, title:w.title, description:w.description, duration:w.assignment_duration_in_seconds, hitCount:w.assignable_hits_count, allowed:w.caller_meets_requirements, prevAllowed:w.caller_meets_preview_requirements, reward:w.monetary_reward.amount_in_dollars, acceptUrl:w.accept_project_task_url, reqUrl:w.requester_url, prevUrl:w.project_tasks_url, dateAdded: new Date(), creationDate:w.creation_time, expireDate:w.latest_expiration_time };
		this.dataUnique++;
	}
	/** This method will start the searching of the mturk queue. */
	startSearching() {
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
		if (!this.timerUnique && this.liveCounter) { // Make sure it's not already searching.
			this.timerUnique = searchTimer.addToQueue(-1, (timerUnique, elapsed) => {
				if (this.liveCounter) this.goFetch(this.searchUrl, timerUnique, elapsed);
				else {
					if (this.searchGStats.isSearchOn()) extSearchUI.stopSearching();
					else this.stopSearching();
				}
			});
		}
	}
	/** This method will stop the searching of the mturk queue. */
	stopSearching() {
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
		if (this.timerUnique && this.liveCounter === 0) {
			searchTimer.deleteFromQueue(this.timerUnique);
			this.timerUnique = null;
		}
	}
	/** Gets the status from panda UI of this particular panda job.
	 * @param  {string} gId	 - The group ID of the panda status being passed.
	 * @param  {bool} status - The status of the panda in panda UI. */
	pandaStatus(gId, status) {
		if (this.triggerInfo['gid'].hasOwnProperty(gId)) {
			const info = this.triggerInfo['gid'][gId];
			if (status) this.pandaCollecting.push(gId);
			else this.pandaCollecting = this.pandaCollecting.filter(item => item !== gId);
		}
	}
	/** Temporarily block trigger from detecting this group ID in the search results.
	 * @param  {object} trigger	- The trigger to temporarily block a specific group id.
	 * @param  {string} gId			- The group ID for this trigger that needs to be temporarily blocked. */
	requesterTempBlockGid(trigger, gId) {
		if (!(trigger.hasOwnProperty("tempBlockGid"))) trigger.tempBlockGid = [];
		if (!trigger.tempBlockGid.includes(gId)) trigger.tempBlockGid.push(gId);
	}
	/** Find out if this group ID is temporarily blocked.
	 * @param  {object} trigger	- The trigger to temporarily block a specific group id.
	 * @param  {string} gId			- The group ID for this trigger that needs to be checked for a block.
	 * @return {bool}						- True if gId is blocked on this trigger. */
	isGidBlocked(trigger, gId) {
		if (trigger.hasOwnProperty("tempBlockGid") && trigger.tempBlockGid.includes(gId)) return true;
		else if (trigger.hasOwnProperty("blockGid") && trigger.blockGid.includes(gId)) return true;
		return false;
	}
	/** Send the panda information to panda UI for collecting with a duration and go ham duration in data.
	 * @param  {object} item				- The panda item to send to panda UI for collecting.
	 * @param  {object} triggerInfo	- The trigger object that found this panda item. */
	sendToPanda(item, triggerInfo, theType) {
		let data = dataObject(item.hit_set_id, item.description, item.title, item.requester_id, item.requester_name, item.monetary_reward.amount_in_dollars, item.assignable_hits_count);
		let opt = optObject(triggerInfo.once,_,_, triggerInfo.limitNumQueue, triggerInfo.limitTotalQueue, triggerInfo.limitFetches, _, triggerInfo.autoGoHam, triggerInfo.goHamDuration);
		if (extPandaUI) extPandaUI.addFromSearch(data, opt, true, true, true, triggerInfo.duration, triggerInfo.tempGoHam, theType, triggerInfo.myId);
	}
	/** Check all live triggers for this item.
	 * @param  {object} item - The hit item that needs to be checked for any trigger detection.
	 * @return {void}				 - Sends back nothing. */
	checkTriggers(item, triggers=null) {
		// console.time('check2');
		let liveStr = this.livePandaUIStr + this.liveSearchUIStr;
		let gidFound = liveStr.includes(`[[gid:${item.hit_set_id}]]`);
		let ridFound = liveStr.includes(`[[rid:${item.requester_id}]]`);
		if (gidFound || ridFound) {
			let key1 = (gidFound) ? 'gid' : 'rid', key2 = (gidFound) ? item.hit_set_id : item.requester_id;
			let triggerInfo = this.triggerInfo[key1][key2]; console.log('checking: ',liveStr, triggerInfo.tempDisabled)
			if (!triggerInfo.tempDisabled && !this.pandaCollecting.includes(item.hit_set_id) && triggerInfo) {
				if ((key1 === 'rid' && !this.isGidBlocked(triggerInfo, item.hit_set_id)) || key1 === 'gid') {
					console.log(`Found a trigger: ${triggerInfo.name} - ${item.assignable_hits_count} - ${item.hit_set_id} - ${item.creation_time}`);
					// console.timeEnd('check2');
					// console.time('check3');
					this.sendToPanda(item, triggerInfo, key1);
					// console.timeEnd('check3');
					if (triggerInfo.once && key1 === 'rid') this.requesterTempBlockGid(triggerInfo, item.hit_set_id, key1);
					if (key1 === 'gid') triggerInfo.tempDisabled = true;
				} //else console.timeEnd('check2');
			} //else console.timeEnd('check2');
		} //else console.timeEnd('check2');
		liveStr = '';
	}
	/**	Creates the live trigger string which holds all trigger info for faster searching.
	 * @param  {object} info - The object with information for this trigger.
	 * @param  {bool} enable - Should this trigger be enabled or disabled?
	 */
	liveString(info, enable, from='searchUI') {
		let liveStr = (from === 'searchUI') ? 'liveSearchUIStr' : 'livePandaUIStr';
		if (enable) this[liveStr] += `[[${info.key1}:${info.key2}]]`;
		else this[liveStr] = this[liveStr].replace(`[[${info.key1}:${info.key2}]]`, '');
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
	}
	/** Sets the disabled status of trigger and redoes the live string if needed.
	 * @param  {string} type							 - The type of trigger this is for. 'gid' or 'rid'.
	 * @param  {string} value							 - Group ID or requester ID depending on the trigger type.
	 * @param  {object} status						 - Will this be disabled or enabled?*/
	setDisabled(type, value, status, from='searchUI') {
		const info = this.triggerInfo[type][value];
		this.liveString(info, !status, from); info.disabled = status;
		if (this.searchGStats.isSearchOn() && this.liveCounter === 0) this.stopSearching();
		else if (this.liveCounter) this.startSearching();
	}
	/** Enables or disables the trigger disabled status.
	 * @param  {string} type			 - The type of trigger this is for. 'gid' or 'rid'.
	 * @param  {string} value			 - Group ID or requester ID depending on the trigger type.
	 * @param  {bool} status			 - Will this be disabled or enabled?
	 * @param  {bool} [temp=false] - Should temporary disable property be changed or the main disable property? */
	triggerStatus(type, value, status, from='searchUI') {
		if (this.is(type,value)) this.setDisabled(type, value, status, from);
	}
	/** Toggles the status of the trigger.
	 * @param  {string} type  - The type of trigger this is for. 'gid' or 'rid'.
	 * @param  {string} value - Group ID or requester ID depending on the trigger type. */
	toggleTrigger(type, value) {
		const info = this.triggerInfo[type][value];
		if (this.is(type,value)) this.setDisabled(type, value, !info.disabled);
	}
  /** If new hit found then check triggers and fill in the data for future search results.
   * @param  {object} hitData - The object data with details about the hit. */
  foundNewHit(hitData) {
		if (this.liveCounter) this.checkTriggers(hitData);
      //this.fillData(thisItem);
    // else
    // 	continueNow = false;
	}
	/** Adds a new trigger with the type of it and the value for group ID or requester ID.
	 * @param  {string} type	- The type of the new trigger.
	 * @param  {object} info	- The object with the information for this new trigger.
	 * @return {number}				- Returns the unique id of this trigger. */
	addTrigger(type, info, loaded=true, from='searchUI') {
		this.triggersAdded++;
		let ridPanda = (type === 'rid' && info.from === 'pandaUI') ? true : false;
		info.key1 = type; info.key2 = (type==='rid') ? info.rid : info.gid; info.count = this.triggersAdded;
		info.tempDisabled = false; info.timerUnique = -1;
		info.reqUrl = (type === 'rid') ? new UrlClass(`https://worker.mturk.com/requesters/${info.rid}/projects`) : null;
		let triggerData = this.triggerInfo[type][info.key2];
		if (!info.hasOwnProperty('myId')) info.myId = -1; 
		if (!loaded && triggerData) {
			if (triggerData.tempDisabled) { triggerData.tempDisabled = false; }
			else this.triggerStatus(type, info.key2, info.disabled, from);
			return null;
		} else {
			const collectingPanda = (type === 'gid' && this.pandaCollecting.includes(info.gid));
			if (collectingPanda || ridPanda) info.tempDisabled = true;
			this.triggerInfo[type][info.key2] = Object.assign({}, info);
			if (!info.disabled && !info.tempDisabled) this.liveString(info, true, from);
			if (extSearchUI) {
				const index = Object.keys(this.triggerInfo[info.key1]).length;
				extSearchUI.addToUI(this.triggerInfo[type][info.key2], index);
			} else if (!ridPanda && !loaded && !info.disabled) {
				if (!this.searchGStats.isSearchOn() && this.liveCounter) this.startSearching();
			}
			if (ridPanda) {
				info.timerUnique = searchTimer.addToQueue(info.key2, (timerUnique, elapsed, myId) => { 
					this.goFetch(info.reqUrl, timerUnique, elapsed, myId, from);
				});
			}
			return this.triggersAdded;
		}
	}
	/** Remove the trigger with the type and value from the class.
	 * @param  {string} type	- The type of the trigger.
	 * @param  {string} value	- Group ID or requester ID depending on the trigger. */
	removeTrigger(type, value) {
		if (this.triggerInfo[type][value]) {
			let info = this.triggerInfo[type][value];
			this.setDisabled(type, value, true); // Remove trigger from disabled and enabled arrays.
			delete this.triggerInfo[type][value];
			if (extSearchUI) extSearchUI.removeTrigger(type, info.count);
		}
		if (this.searchGStats.isSearchOn() && this.liveCounter === 0) this.stopSearching();
	}
	/** Will add any search panda's to the triggers from the panda UI. */
	openUI() {
		Object.keys(this.triggerInfo).forEach( key => {
			Object.keys(this.triggerInfo[key]).forEach( key2 => {
				if (extSearchUI && this.triggerInfo[key][key2].from === "pandaUI") {
					const index = Object.keys(this.triggerInfo[key]).length;
					extSearchUI.addToUI(this.triggerInfo[key][key2], index);
				}
			});
		});
		this.searchGStats.searchingOn();
	}
	/** When a UI is closed then this method will remove any triggers added from that UI.
	 * @param  {string} [origin="searchUI"] - The UI that is being closed. */
	originRemove(origin="searchUI") {
		Object.keys(this.triggerInfo).forEach( key => {
			Object.keys(this.triggerInfo[key]).forEach( key2 => {
				if (this.triggerInfo[key][key2].from===origin) this.removeTrigger(key, key2);
			});
		});
	}
	/** Creates a search URL and returns it.
	 * @return {string} - The URL to get the search results from mturk. */
	createSearchUrl() { // return search url with all options added
		const formatJson = (this.json) ? "&format=json" : ""; // add format json or not?
		return `https://worker.mturk.com/?page_size=${this.pageSize}&filters%5Bqualified%5D=${this.onlyQualified}&filters%5Bmasters%5D=${this.onlyMasters}&sort=${this.sort}&filters%5Bmin_reward%5D=${this.minReward}${formatJson}`;
	}
	/** Prepare the search URL with many options.
	 * @param  {bool} [json=true]							- Should JSON be used for the results from search.
	 * @param  {number} [pageSize=35]					- The number of hits to show on each page of search.
	 * @param  {bool} [onlyQual=true]					- Should it show only qualified hits or not?
	 * @param  {bool} [onlyMasters=false]			- Should it show only master hits or not?
	 * @param  {string} [sort="updated_desc"] - The sort value to use for the search URL.
	 * @param  {string} [minReward="0.01"]		- Only show hits that have a higher reward than this min reward. */
	prepareSearch(json=true, pageSize=35, onlyQual=true, onlyMasters=false, sort="updated_desc", minReward="0.01") {
		this.sort = (this.sorting.includes(sort)) ? sort : this.sorting[0];// set up sorting with passed value or default
		this.json = json; this.pageSize = pageSize; this.onlyQualified = onlyQual;
		this.onlyMasters = onlyMasters; this.minReward = minReward;
		this.searchUrl = new UrlClass(this.createSearchUrl());
  }
  /** Fetches the url for this search after timer class tells it to do so and handles mturk results.
	 * Can detect logged out, pre's and good search results.
   * @param  {object} objUrl			- Url object to use when fetching.
   * @param  {number} queueUnique - Unique number for the job in timer queue.
   * @param  {number} elapsed			- Exact time it took for the panda timer to do next queue job. */
  async goFetch(objUrl, queueUnique, elapsed, myId, from='searchUI') {
		this.searchGStats.setSearchElapsed(elapsed); // Pass elapsed time to global search stats
		if (myId === -1 || this.resultsBack) {
			if (myId !== -1) this.resultsBack = false;
			if (this.dLog(4)) console.debug(`%cgoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
			let result = await super.goFetch(objUrl);
			if (!result) {
				if (this.dError(1)) { console.error('Returned fetch result was a null.', JSON.stringify(objUrl)); }
			} else {
				this.searchGStats.addTotalSearchFetched(); myPanda.searchFetched();
				if (result.mode === "logged out" && queueUnique !== null) this.nowLoggedOff();
				else if (result.type === "ok.json") {
					if (result.mode === "pre") {
						this.searchGStats.addTotalSearchPRE(); // found a PRE while searching so increment search pre counter
					} else {
						this.searchGStats.addTotalSearchResults(result.data.total_num_results);
						let i = 0, indentifyArr = [], thisItem = null, hitPosId = null, tempString = '';
						do {
							thisItem = result.data.results[i++];
							// hitPosId represents a signature for this particular hit using creation time and hit set ID
							hitPosId = new Date(thisItem.creation_time).getTime() + "" +  thisItem.hit_set_id;
							indentifyArr.push(hitPosId); // let's add the signature to an indentify array
							tempString += `[[${hitPosId}]]`;
							// check if signature is unique and then check all triggers.
							if (!this.testString.includes(`[[${hitPosId}]]`)) {
								this.foundNewHit(thisItem);
							}
						} while (i < result.data.results.length);
						this.testString = tempString + this.testString;
						this.testString = this.testString.substr(0,4700);
						this.searchGStats.addTotalSearchHits(this.hitSearchResults.length);
						indentifyArr = [];
					}
				} else if (result.type === "ok.text") {
					let reactProps = $(result.data).find('.row.m-b-md div:eq(1)').data('react-props');
					let triggerData = this.triggerInfo['rid'][myId];
					if (reactProps) {
						let hitsData = reactProps.bodyData;
						if (hitsData.length > 0) {
							let requesterName = $(result.data).find('h1.m-b-md').text();
							if (requesterName !== '') myPanda.updateReqName(triggerData.myId, requesterName);
							for (const hit of hitsData) { this.checkTriggers(hit, [{'type':'rid', 'value':myId}]) }
						}
						hitsData = null;
					}
					searchTimer.deleteFromQueue(queueUnique);
					triggerData.tempDisabled = false;
					this.triggerStatus('rid', myId, false, from);
					if (!this.timerUnique) this.startSearching();
					reactProps = null;
				}
			}
			result = null;
			this.resultsBack = true;
		}
  }
	/** Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
	 * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}							  - True if this error is permitted to show. */
	dError(levelNumber) { return dError(levelNumber, 'MturkHitSearch'); }
	/** Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}							  - True if this message is permitted to show. */
	dLog(levelNumber) { return dLog(levelNumber, 'MturkHitSearch'); }
}
