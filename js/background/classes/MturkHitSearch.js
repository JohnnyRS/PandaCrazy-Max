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
		this.searchesString = '';
		this.livePandaUIStr = '';
		this.liveSearchUIStr = '';
		this.liveCounter = 0;
		this.triggersAdded = 0;										// The number of triggers added.
		this.pandaCollecting = [];								// Array of all panda gId's collecting now.
		this.searchGStats = null;									// global search stats.
		this.searchUrl = null;          					// Url class for search url.
		this.pageSize = 25;             					// Only 25 hits to show on page by default.
		this.onlyQualified = true;      					// Show only qualified hits in search results.
		this.onlyMasters = false;       					// Show only master hits in search results.
		this.minReward = 0.01;          					// The minimum reward will be $0.01 by default.
		this.resultsBack = true;
		this.loggedOff = false;         					// Are we logged off from mturk?
    this.sort = "updated_desc";     					// Sort by updated_desc by default.
    this.sorting = ["updated_desc", "updated_asc", "reward_asc", "reward_desc", "hits_asc", "hits_desc"];
		this.dbSearchName = "Pcm_Searching";		// Name of the database used for all storage.
		this.storeName = 'searchTriggers';
		this.storeOptionsName = 'searchOptions';
		this.storeRulesName = 'searchRules';
		this.options = {};
		this.info = {};
		this.data = {};
		this.rules = {};
		this.groupIdHist = {};
		this.fromPanda = new Set();
		this.fromSearch = new Set();
		this.tempBlockGid = new Set();
		this.dbIds = {'pDbId':{}, 'values':{}};
		this.ruleSet = {'blockGid': new Set(), 'onlyGid': new Set(), 'terms': false, 'exclude': new Set(), 'include': new Set(), 'payRange': false, 'minPay': 0.00, 'maxPay': 0.00};
		this.db = null;													  // Set up the search database class.
		searchTimer.setMyClass(this);							// Tell timer what class is using it so it can send information back.
		searchTimer.setTimer(timer);    					// Set timer for this timer.
		this.prepareSearch();											// Prepare all the search data.
	}
	/** Find out if a trigger has been added with type, value and SUI values.
	 * @param  {string} type     - Type of the trigger [group ID or requester ID].
	 * @param  {string} value    - Group ID or Requester ID for value depending on type.
	 * @param  {bool} [sUI=true] - SUI is true if added from search UI instead of panda UI.
	 * @return {bool}				     - True if trigger has been added. */
	is(type, value, sUI=true) { return this.dbIds.values.hasOwnProperty(`${type}:${value}:${sUI}`); }
	/** Checks to see if a trigger with type and value has been added from any UI.
	 * @param  {string} type  - Type of the trigger [group ID or requester ID].
	 * @param  {string} value - Group ID or Requester ID for value depending on type.
	 * @return {bool}	        - True if trigger has been added. */
	isAll(type, value) { return (this.is(type, value, true) || this.is(type, value, false)); }
	/** returns the dbid from a type and value given from any UI.
	 * @param  {string} type  - Type of the trigger [group ID or requester ID].
	 * @param  {string} value - Group ID or Requester ID for value depending on type.
	 * @return {number}	      - The dbID for this trigger to use for all other data. */
	theDbId(type, value) { return (this.dbIds.values[`${type}:${value}:true`] || this.dbIds.values[`${type}:${value}:false`]) }
	/** Opens the search database or creates it if not found. (Database is cleared at start for NOW)
	 * @param  {bool} del - Should database be deleted at that start? */
	openDB(del=true) {
		return new Promise( (resolve, reject) => {
			this.db = new DatabaseClass(this.dbSearchName, 1);
    	this.db.openDB( del, (e) => {
				if (e.oldVersion === 0) { // Had no database so let's initialise it.
          let store1 = e.target.result.createObjectStore(this.storeName, {keyPath:'id', autoIncrement:'true'});
          store1.createIndex('type', 'type', {unique:false});
          store1.createIndex('value', 'value', {unique:false});
          store1.createIndex('unique', ['type', 'value'], {unique:false});
					e.target.result.createObjectStore(this.storeOptionsName, {keyPath:"dbId", autoIncrement:"false"});
					e.target.result.createObjectStore(this.storeRulesName, {keyPath:"dbId", autoIncrement:"false"});
					this.useDefault = true;
        }
      } ).then( response => resolve(response), rejected => { console.error(rejected); reject(rejected); });
		});
	}
	/** Updates the database with new data.
	 * @async 										- So the data gets added or updated to the database.
	 * @param  {string} storeName - The name of the storage for search database.
	 * @param  {object} newData   - The new data to update the database with. */
	async updateToDB(storeName, newData) {
		if (this.db) {
			await this.db.addToDB(storeName, newData)
			.then(_, rejected => { extPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database usually for importing or UI closing. */
	closeDB() { this.db.closeDB(); this.db = null; }
	/** Prepare the search URL with many options.
	 * @param  {bool} [json=true]							- Should JSON be used for the results from search.
	 * @param  {number} [pageSize=35]					- The number of hits to show on each page of search.
	 * @param  {bool} [onlyQual=true]					- Should it show only qualified hits or not?
	 * @param  {bool} [onlyMasters=false]			- Should it show only master hits or not?
	 * @param  {string} [sort="updated_desc"] - The sort value to use for the search URL.
	 * @param  {string} [minReward="0.01"]		- Only show hits that have a higher reward than this min reward. */
	prepareSearch(json=true, pageSize=35, onlyQual=true, onlyMasters=false, sort="updated_desc", minReward="0.01") {
		sort = (this.sorting.includes(sort)) ? sort : this.sorting[0];// set up sorting with passed value or default
		const formatJson = (json) ? "&format=json" : ""; // add format json or not?
		this.searchUrl = new UrlClass(`https://worker.mturk.com/?page_size=${pageSize}&filters%5Bqualified%5D=${onlyQual}&filters%5Bmasters%5D=${onlyMasters}&sort=${this.sort}&filters%5Bmin_reward%5D=${minReward}${formatJson}`);
		this.searchGStats =  new SearchGStats();
  }
	/** Removes all data from class to clear out memory as much as possible on exit.
	 * @async - Just so things get cleared out before a restart. */
	async removeAll() {
		this.searchesString = ''; this.livePandaUIStr = ''; this.liveSearchUIStr = '';
		this.liveCounter = 0; this.pandaCollecting = []; this.searchGStats = null;
		this.options = {}; this.data = {}; this.rules = {}; this.groupIdHist = {};
		this.fromPanda.clear(); this.fromSearch.clear(); this.tempBlockGid.clear();
		this.dbIds.pDbId = {}; this.dbIds.values = {};
	}
	/**
	 * @param  {number} dbId          - Database ID    @param  {bool} [info=false]  - Return info  @param  {bool} [data=false] - Return data
	 * @param  {bool} [options=false] - Return options @param  {bool} [rules=false] - return rules
	 * @return {array} - Returns data in format [info, data, options, rules] */
	getTriggers(dbId, info=false, data=false, options=false, rules=false) {
		let one = null, two = null, three = null, four = null;
		if (info) one = this.info[dbId]; if (data) two = this.data[dbId]; if (options) three = this.options[dbId]; if (rules) four = this.rules[dbId];
		return [one, two, three, four];
	}
	/** Find out if panda UI has been opened.
	 * @return {bool} - True if the panda UI has been opened. */
	isPandaUI() { return (extPandaUI!==null); }
	/** Unpause the search timer. */
	unPauseTimer() { searchTimer.paused = false; }
	/** This method gets called when the queue gets a new result from mturk so it has to be logged on. */
	gotNewQueue() { this.nowLoggedOn(); }
	/** We are logged off so pause the timer and tell the search UI that it's logged off. */
	nowLoggedOff() { searchTimer.paused = true; this.loggedOff = true; if (extSearchUI) extSearchUI.nowLoggedOff(); }
	/** We are logged on so unpause timer and tell the search UI that it's logged back in. */
	nowLoggedOn() { this.unPauseTimer(); this.loggedOff = false; if (extSearchUI) extSearchUI.nowLoggedOn(); }
	/** This method will start the searching of the mturk queue.
	 * @param  {number} - The database ID of the trigger that is starting. */
	startSearching(dbId) {
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
		if (!this.timerUnique && this.liveCounter) { // Make sure it's not already searching.
			this.timerUnique = searchTimer.addToQueue(-1, (timerUnique, elapsed) => {
				if (this.liveCounter) this.goFetch(this.searchUrl, timerUnique, elapsed, dbId);
				else {
					if (this.searchGStats.isSearchOn()) extSearchUI.stopSearching();
					else this.stopSearching();
				}
			});
		}
	}
	/** Mark a trigger as searching now.
	 * @param  {number} pDbId    - The panda job database number to use for the trigger.
	 * @param  {bool} [sUI=true] - do search from search UI or panda UI? */
	doSearching(pDbId, sUI=true) {
		let dbId = this.dbIds.pDbId[pDbId], [info, data] = this.getTriggers(dbId, true, true);
		if (data.type === 'rid') {
			info.status = 'finding';
			info.timerUnique = searchTimer.addToQueue(data.value, (timerUnique, elapsed, pandaId) => {
				this.goFetch(info.reqUrl, timerUnique, elapsed, pandaId, dbId, data.type, data.value, sUI);
			});
		} else {
			if (!info.tempDisabled) this.setDisabled(data.type, data.value, false, sUI);
			else info.tempDisabled = false;
		}
	}
	/** Mark a trigger as disabled now.
	 * @param  {string} type  	 - Type of the trigger [group ID or requester ID].
	 * @param  {string} value 	 - Group ID or Requester ID for value depending on type.
	 * @param  {bool} [sUI=true] - SUI is true if added from search UI instead of panda UI. */
	doDisabled(type, value, sUI=true) {
		if (this.is(type, value, sUI)) {
			let dbId = this.dbIds.values[`${type}:${value}:${sUI}`], [info] = this.getTriggers(dbId, true);
			this.setDisabled(type, value, true, sUI); info.tempDisabled = false;
		}
	}
	/** This method will stop the searching of the mturk queue. */
	async stopSearching() {
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
		let dbId = (this.isAll('gid', gId)) ? this.theDbId('gid', gId) : null;
		let [info] = (dbId) ? this.getTriggers(dbId, true) : [null];
		if (status) {
			this.pandaCollecting.push(gId);
			if (dbId && info.status === 'disabled') info.status = 'collecting';
		} else {
			this.pandaCollecting = arrayRemove(this.pandaCollecting, gId);
			if (dbId) {
				info.status = (info.status === 'collecting') ? 'searching' : 'disabled';
				this.requesterTempBlockGid(gId, false);
			}
		}
	}
	/** Temporarily block trigger from detecting this group ID in the search results.
	 * @param  {object} trigger	- The trigger to temporarily block a specific group id.
	 * @param  {string} gId			- The group ID for this trigger that needs to be temporarily blocked. */
	requesterTempBlockGid(gId, block=null) {
		let blocked = (this.tempBlockGid.has(gId));
		if (block === null) block = !blocked;
		if ((block && !blocked) || (!block && blocked)) {
			if (block) this.tempBlockGid.add(gId);
			else this.tempBlockGid.delete(gId);
		}
	}
	/** Find out if this group ID is temporarily blocked.
	 * @param  {object} trigger	- The trigger to temporarily block a specific group id.
	 * @param  {string} gId			- The group ID for this trigger that needs to be checked for a block.
	 * @return {bool}						- True if gId is blocked on this trigger. */
	isGidBlocked(rules, gId) {
		if (this.tempBlockGid.has(gId) || rules.blockGid.has(gId)) return true;
		return false;
	}
	/** Does this hit have a pay rate in the triggers pay range rules? Used for scan searches.
	 * @param  {object} rules - The rules object from a trigger.
	 * @param  {number} pay   - The pay rate of the hit to check.
	 * @return {bool}					- True if pay rate is good or not. */
	isPayRange(rules, pay) {
		if (pay < rules.minPay) return false;
		if (pay > rules.maxPay) return false;
		return true;
	}
	/** Does this hit have a term in the title or description that is in the triggers rules? Used for scan searches.
	 * @param  {object} rules - The rules object from a trigger.
	 * @param  {string} title - Title of this hit.
	 * @param  {string} desc	- Description of this hit.
	 * @return {bool}					- True if term rules is in the hit. */
	isTermCheck(rules, title, desc) {
		let searchStr = `[${title}][${desc}]`, good = false;
		if (rules.include.size === 0) good = true;
		else for (const term of rules.include) { if (searchStr.includes(term)) good = true; }
		if (rules.exclude.size > 0 && good) 
			for (const term of rules.exclude) { if (searchStr.includes(term)) good = false; }
		return good;
	}
	/** Send the panda information to panda UI for collecting with a duration and go ham duration in data.
	 * @param  {object} item		- The panda item to send to panda UI for collecting.
	 * @param  {object} info		- The info for the trigger.
	 * @param  {object} options	- The options for the trigger.
	 * @param  {object} type	  - Type of the trigger [group ID or requester ID]. */
	sendToPanda(item, info, options, type) {
		let dO = dataObject(item.hit_set_id, item.description, item.title, item.requester_id, item.requester_name, item.monetary_reward.amount_in_dollars, item.assignable_hits_count);
		let oO = optObject(options.once,_,_, options.limitNumQueue, options.limitTotalQueue, options.limitFetches, _, options.autoGoHam, options.goHamDuration);
		if (extPandaUI) extPandaUI.addFromSearch(dO, oO, true, true, true, options.duration, options.tempGoHam, type, info.pandaId, info.setName);
	}
	/** Check all live triggers for this item.
	 * @param  {object} item - The hit item that needs to be checked for any trigger detection. */
	checkTriggers(item) {
		let liveStr = this.livePandaUIStr + ((this.searchGStats.isSearchOn()) ? this.liveSearchUIStr : '');
		let gidFound = liveStr.includes(`[gid:${item.hit_set_id}]]`);
		let ridFound = liveStr.includes(`[rid:${item.requester_id}]]`);
		if (gidFound || ridFound) {
			let key1 = (gidFound) ? 'gid' : 'rid', key2 = (gidFound) ? item.hit_set_id : item.requester_id;
			let dbId = this.theDbId(key1, key2);
			let [info,_, options, rules] = this.getTriggers(dbId, true, false, true, true);
			if (rules.payRange) this.isPayRange(rules, item.monetary_reward.amount_in_dollars);
			if (rules.terms) this.isTermCheck(rules, item.title, item.description);
			if (!info.tempDisabled && !this.pandaCollecting.includes(item.hit_set_id)) {
				if ((key1 === 'rid' && !this.isGidBlocked(rules, item.hit_set_id)) || key1 === 'gid') {
					console.log(`Found a trigger: ${info.name} - ${item.assignable_hits_count} - ${item.hit_set_id} - ${item.creation_time}`);
					this.sendToPanda(item, info, options, key1);
					if (options.once && key1 === 'rid') this.requesterTempBlockGid(item.hit_set_id, true);
					if (key1 === 'gid') { info.tempDisabled = true; info.status = 'collecting'; }
				}
			}
			info = options = rules = {};
		}
		liveStr = ''; item = {};
	}
	/**	Creates the live trigger string which holds all trigger info for faster searching.
	 * @param  {string} type	   - The type of trigger this is for. 'gid' or 'rid'.
	 * @param  {string} value	   - Group ID or requester ID depending on the trigger type.
	 * @param  {bool} enable     - Should this trigger be enabled or disabled?
	 * @param  {bool} [sUI=true] - SUI is true if added from search UI instead of panda UI. */
	liveString(type, value, enable, sUI=true) {
		let liveStr = (sUI) ? 'liveSearchUIStr' : 'livePandaUIStr';
		if (enable) this[liveStr] += `[[${type}:${value}]]`;
		else this[liveStr] = this[liveStr].replace(`[[${type}:${value}]]`, '');
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
	}
	/** Sets the disabled status of trigger and redoes the live string if needed.
	 * @param  {string} type		 - The type of trigger this is for. 'gid' or 'rid'.
	 * @param  {string} value		 - Group ID or requester ID depending on the trigger type.
	 * @param  {object} status	 - Will this be disabled or enabled?
	 * @param  {bool} [sUI=true] - SUI is true if added from search UI instead of panda UI. */
	setDisabled(type, value, status, sUI=true) {
		this.liveString(type, value, !status, sUI);
		if (this.searchGStats.isSearchOn() && this.liveCounter === 0) this.stopSearching();
		else if (this.liveCounter) this.startSearching();
	}
	/** Toggles the status of the trigger.
	 * @param  {string} type  - The type of trigger this is for. 'gid' or 'rid'.
	 * @param  {string} value - Group ID or requester ID depending on the trigger type.
	 * @return {bool}         - Status of the trigger. */
	toggleTrigger(type, value) {
		if (this.is(type, value, true)) {
			let dbId = this.dbIds.values[`${type}:${value}:true`];
			let [info] = this.getTriggers(dbId, true);
			let status = (info.status === 'disabled') ? true : false;
			this.setDisabled(type, value, !status);
			info.status = (status) ? 'searching' : 'disabled';
			return info.status;
		}
		return null;
	}
  /** If new hit found then check triggers and fill in the data for future search results.
   * @param  {object} hitData - The object data with details about the hit. */
  foundNewHit(hitData) {
		if (this.liveCounter) this.checkTriggers(hitData);
	}
	/** Sets up object for the group ID history for a trigger and returns it.
	 * @param  {object} history - The history for this trigger.
	 * @return {object}					- The object with the group ID history set. */
	fillInGidHistory(history) { return Object.keys(history).map((key) => { return {'gid':key, 'date':history[key].date}; } ); }
	/** Adds a new trigger with the type of it and the value for group ID or requester ID.
	 * @param  {string} type	     - Type         @param  {object} info	        - Info object     @param  {object} options	- Options object
	 * @param  {object} [rules={}] - Rules object @param  {object} [history={}] - History object  @param  {bool} [sUI=true] - From UI
	 * @return {number}				- Returns the unique id of this trigger. */
	async addTrigger(type, info, options, rules={}, history={}, sUI=true) {
		if (type === 'scan') return; // Not ready for search scans yet.
		let key2 = (type === 'rid') ? info.reqId : info.groupId, valueString = `${type}:${key2}:${sUI}`;
		if (!key2) return; // No value set for search type.
		this.triggersAdded++;
		if (this.dbIds.values[valueString]) return null; // Cannot accept any duplicates.

		if (!info.pandaId) info.pandaId = -1; if (!info.pDbId) info.pDbId = -1;
		info.timerUnique = -1; info.count = this.triggersAdded; info.tempDisabled = false;
		info.reqUrl = (type === 'rid') ? new UrlClass(`https://worker.mturk.com/requesters/${info.reqId}/projects`) : null;
		let theObject = {'type':type, 'value':key2, 'pDbId':info.pDbId, 'searchUI':sUI};
		await this.updateToDB(this.storeName, theObject);
		let dbId = info.dbId = options.dbId = theObject.id;
		this.data[dbId] = theObject; this.dbIds.pDbId[info.pDbId] = dbId; this.dbIds.values[valueString] = dbId;
		info.setName = (sUI) ? 'fromSearch' : 'fromPanda'; this[info.setName].add(dbId);
		
		rules = Object.assign({}, this.ruleSet, rules);
		this.options[dbId] = options; this.info[dbId] = info; this.rules[dbId] = Object.assign({}, this.ruleSet, rules);
		this.updateToDB(this.storeOptionsName, options);
		this.updateToDB(this.storeRulesName, {rules:[rules], 'dbId':dbId, 'ruleSet':0});
		this.groupIdHist[dbId] = this.fillInGidHistory(history);
		if (myHistory) myHistory.fillInHistory(history, 'triggers');

		if (extSearchUI && sUI) {
			const index = this.fromSearch.size;
			extSearchUI.addToUI(theObject, info, options, index, dbId);
			if (info.status === 'searching') this.setDisabled(type, key2, false, sUI);
		}
		return this.triggersAdded;
	}
	/** Remove the trigger with the type and value from the class.
	 * @param  {number} [dbId=null]	 - Database ID
	 * @param  {number} [pDbId=null] - Panda Database ID.
	 * @param  {bool} [sUI=true]     - SUI is true if added from search UI instead of panda UI. */
	removeTrigger(dbId=null, pDbId=null, sUI=true) {
		dbId = (dbId) ? dbId : this.dbIds.pDbId[pDbId];
		if (dbId) {
			let [_, data] = this.getTriggers(dbId, false, true);
			this.setDisabled(data.type, data.value, true); // Remove trigger from live strings.
			if (sUI && extSearchUI) extSearchUI.removeTrigger(data.type, data.value);
			this.fromPanda.delete(dbId); this.fromSearch.delete(dbId);
			delete this.options[dbId]; delete this.rules[dbId]; delete this.info[dbId];
			delete this.dbIds.pDbId[pDbId]; delete this.dbIds.values[`${data.type}:${data.value}:${sUI}`];
			if (this.searchGStats.isSearchOn() && this.liveCounter === 0) this.stopSearching();
		}
	}
	/** When a UI is closed then this method will remove any triggers added from that UI.
	 * @param  {bool} [sUI=true] - The UI that is being closed. */
	originRemove(sUI=true) {
		let setName = (sUI) ? 'fromSearch' : 'fromPanda';
		for (const dbId of this[setName]) {
			this.removeTrigger(dbId,_, sUI);
		}
	}
  /** Fetches the url for this search after timer class tells it to do so and handles mturk results.
	 * Can detect logged out, pre's and good search results.
   * @param  {object} objUrl	   - Url object        @param  {number} queueUnique - Queue Unique ID @param  {number} elapsed	 - Elapsed Time
	 * @param  {number} pandaId    - Panda Job ID      @param  {number} dbId 				- Database ID     @param  {string} [type=''] - Type for trigger
	 * @param  {string} [value=''] - Value for trigger @param  {bool} [sUI=true]		- From UI */
  async goFetch(objUrl, queueUnique, elapsed, pandaId, dbId, type='', value='', sUI=true) {
		this.searchGStats.setSearchElapsed(elapsed); // Pass elapsed time to global search stats
		if (pandaId === -1 || this.resultsBack) {
			if (pandaId !== -1) this.resultsBack = false;
			if (this.dLog(4)) console.debug(`%cgoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
			let result = await super.goFetch(objUrl);
			if (!result) {
				if (this.dError(1)) { console.error('Returned fetch result was a null.', JSON.stringify(objUrl)); }
			} else {
				this.searchGStats.addTotalSearchFetched();
				myPanda.searchFetched();
				if (result.mode === "logged out" && queueUnique !== null) this.nowLoggedOff();
				else if (result.type === "ok.json") {
					if (result.mode === "pre") {
						this.searchGStats.addTotalSearchPRE(); // found a PRE while searching so increment search pre counter
					} else {
						this.searchGStats.addTotalSearchResults(result.data.total_num_results);
						let i = 0, thisItem = {}, hitPosId = null, tempString = '', tempNewHits = {};
						do {
							thisItem = result.data.results[i++];
							// hitPosId represents a signature for this particular hit using creation time and hit set ID
							hitPosId = new Date(thisItem.creation_time).getTime() + "" +  thisItem.hit_set_id;
							tempString += `[[${hitPosId}]]`;
							if (!this.searchesString.includes(`[[${hitPosId}]]`)) {
								if (this.liveCounter) this.checkTriggers(thisItem);
								let dO = hitObject(thisItem.hit_set_id, thisItem.description, thisItem.title, thisItem.requester_id, thisItem.requester_name, thisItem.monetary_reward.amount_in_dollars, thisItem.assignable_hits_count, thisItem.assignment_duration_in_seconds, thisItem.latest_expiration_time);
								tempNewHits[dO.groupId] = dO;
							}
						} while (i < result.data.results.length);
						myHistory.fillInHistory(tempNewHits, 'searchResults');
						this.searchesString = tempString + this.searchesString;
						this.searchesString = this.searchesString.substr(0,4700);
						thisItem = {}; tempString = ''; tempNewHits = {};
					}
				} else if (result.type === "ok.text") {
					let [info] = this.getTriggers(dbId, true);
					let reactProps = $(result.data).find('.row.m-b-md div:eq(1)').data('react-props');
					if (reactProps) {
						let hitsData = reactProps.bodyData;
						if (hitsData.length > 0) {
							let requesterName = $(result.data).find('h1.m-b-md').text();
							if (requesterName !== '') myPanda.updateReqName(info.pandaId, requesterName);
							for (const hit of hitsData) { this.checkTriggers(hit, [{'type':'rid', 'value':pandaId}]) }
						}
						hitsData = null;
					}
					searchTimer.deleteFromQueue(queueUnique); info.status = 'searching';
					this.setDisabled(type, value, false, sUI);
					if (!this.timerUnique) this.startSearching(dbId);
					info = null;
				}
			}
			result = {};
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
