/** This class takes care of the search trigger data. Also handles dealing with the database to get data.
 * @class MturkHitSearch ##
 * @extends MturkClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class MturkHitSearch extends MturkClass {
  /**
	 * @param  {number} timer - Time to use for the timer to get next HIT search results.
   */
  constructor(timer) {
    super();
		this.liveTermStr = ''; this.liveTermReg = null; this.liveTermData = {}; this.liveTermArr = []; this.liveCounter = 0; this.termCounter = 0;
		this.tempBlockGid = new Set(); this.tempBlockRidGid = new Set(); this.blockedRids = null; this.blockedGids = null; this.customGidSkip = [];
		this.resultsBack = {'status':true, 'elapsed':null, 'parsedTime':null, 'lastParsed':null};	// Records status and times of results returned from MTURK including parsed times.
    this.timerUnique = null;        					// Unique number for this timer in queue.
		this.searchesString = '';									// Temporary id's of HITs to find new HITs in results. Limited to 100 HITs remembered.
		this.livePandaUIStr = '';									// Live search triggers from pandaUI
		this.liveSearchUIStr = '';								// Live search triggers from searchUI
		this.triggersAdded = 0;										// The number of triggers added. Also used for a unique number for each trigger.
		this.pandaCollecting = [];								// Array of all panda gId's collecting now from pandaUI.
		this.searchUrl = null;          					// Url class for search url.
		this.onlyQualified = true;      					// Show only qualified HITs in search results.
		this.onlyMasters = false;       					// Show only master HITs in search results.
		this.minReward = 0.01;          					// The minimum reward will be $0.01 by default.
		this.loggedOff = false;         					// Are we logged off from MTURK?
		this.queueDbIds = [];											// Array of dbid's in memory which is limited by size to save memory use.
		this.triggers = {};												// Object with info in memory for triggers. Stays in memory.
		this.data = {};														// Object with all the data for triggers. Stays in memory.
		this.options = {};												// Object with all the options for triggers. Memory limits enforced.
		this.rules = {};													// Object with all the rules for triggers. Memory limits enforced.
		this.fromPanda = new Set();								// A set with dbID's of triggers coming from pandaUI.
		this.fromSearch = new Set();							// A set with dbID's of triggers coming from searchUI.
		this.pausedPandaUI = false;
		this.pausedSearchUI = false;
		this.fetchSkipped = false;								// A fetch was skipped due to 2 fetches not receiving a response.
		this.slowRequest = false;									// Last fetch did not receive a response so slowness detected.
    this.sort = 'updated_desc';     					// Sort by updated_desc by default.
    this.pandaDur = {'min':0, 'max':60} 		  // Limits for the panda duration in minutes.
		this.loaded = false;											// Has data been loaded from database?
		if (timer) {
			searchTimer.setMyClass(this);						// Tell timer what class is using it so it can send information back.
			searchTimer.theTimer(timer);    				// Set timer for this timer.
		}
		this.temps = 1;
		this.lastCreationTime = 0;
		this.autoTaskIds = {}, this.autoGids = {}, this.autoCollected = [], this.autoAllow = false;
    this.sorting = ['updated_desc', 'updated_asc', 'reward_asc', 'reward_desc', 'hits_asc', 'hits_desc'];
		this.dbIds = {'pDbId':{}, 'values':{}, 'unique':{}};
		this.optionDef = {'duration': 0, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'goHamDuration':MyOptions.getHamDelayTimer(), 'tempGoHam':MyOptions.doSearch().defaultHamDur, 'acceptLimit':0, 'auto':false, 'autoLimit':2, 'tempDuration':MyOptions.doSearch().defaultDur, 'tempFetches':MyOptions.doSearch().defaultFetches, 'pandaHamDur':MyOptions.getHamDelayTimer()};
		this.ruleSet = {'blockGid':new Set(), 'blockRid':new Set(), 'onlyGid':new Set(), 'terms':false, 'exclude':new Set(), 'include':new Set(), 'payRange':false, 'minPay':0, 'maxPay':0};
		if (timer) this.prepareSearch();						// Prepare all the search data.
	}
	/** Is searchUI opened?
	 * @return {bool} - Returns True if searchUI is opened and false if not. */
	isSearchUI() { return MySearchUI.isSearchUI(); }
	/** Find out if a trigger has been added with type, value and SUI values.
	 * @param  {string} type - Trigger type  @param  {string} value - Trigger value  @param  {bool} [sUI] - From searchUI?
	 * @return {bool}				 - True if trigger has been added. */
	is(type, value, sUI=true) { return this.dbIds.values.hasOwnProperty(`${type}:${value}:${sUI}`); }
	/** Checks to see if a trigger with type and value has been added from any UI.
	 * @param  {string} type - Trigger type  @param  {string} value - Trigger value
	 * @return {bool}        - True if trigger has been added. */
	isAll(type, value) { return (this.is(type, value, true) || this.is(type, value, false)); }
	/** Checks to make sure the name given is a unique trigger name.
	 * @param  {string} name - Unique Trigger Name
	 * @return {bool} 			 - True if name is unique and false if now. */
	uniqueName(name) {
		let returnValue = true;
		for (const key of Object.keys(this.data)) { if (this.data[key].name === name) { returnValue = false; break; } }
		return returnValue;
	}
	/** To send all triggers from the searchUI to a function given.
	 * @param  {function} sendResponse - Function to send response */
	getAllTriggers(sendResponse) { sendResponse({'for':'getTriggers', 'response':{'info':this.triggers, 'data':this.data}}); }
	/** returns the dbid from a type and value given from any UI.
	 * @param  {string} type  - Trigger type  @param  {string} value - Trigger value  @param  {bool} [live] - Check only live triggers.  @param  {bool} [sUI] - From searchUI?
	 * @return {number}	      - The dbID for this trigger to use for all other data. */
	theDbId(type, value, live=true, sUI=null) {
		let dbIdPanda = this.dbIds.values[`${type}:${value}:false`], dbIdSearch = this.dbIds.values[`${type}:${value}:true`];
		if (live) {
			let pandaLive = (this.triggers[dbIdPanda]) ? this.triggers[dbIdPanda].status : 'disabled'; return (pandaLive !== 'disabled') ? dbIdPanda : (dbIdSearch) ? dbIdSearch : null;
		} else {
			if (sUI !== null) return this.dbIds.values[`${type}:${value}:${sUI}`];
			return (this.dbIds.values[`${type}:${value}:false`] || this.dbIds.values[`${type}:${value}:true`]);
		}
	}
	/** Returns an array with all the triggers of this particular type from.
	 * @param  {string} type - Trigger Type
	 * @return {array} 			 - Returns an array of triggers of this type provided. */
	getFrom(type='Panda') { return Array.from(this[`from${type}`]); }
	/** Checks if this trigger with the database number is enabled.
	 * @param  {number} dbId - Database Number
	 * @return {bool}				 - Returns value representing if it's enabled or not. */
	isEnabled(dbId) { return this.triggers[dbId].status !== 'disabled'; }
	/** Checks if this trigger with the database number is disabled.
	 * @param  {number} dbId - Database Number
	 * @return {bool}				 - Returns value representing if it's disabled or not. */
	isDisabled(dbId) { return this.triggers[dbId].status === 'disabled'; }
	/** Returns the trigger object with the database number.
	 * @param  {number} dbId - Database Number
	 * @return {object}			 - Returns the trigger object. */
	getTrigger(dbId) { return this.triggers[dbId]; }
	/** Returns the trigger data object with the database number.
	 * @param  {number} dbId - Database Number
	 * @return {object}      - Returns the trigger data object. */
	getData(dbId) { return this.data[dbId]; }
	/** Checks to see if there are any triggers enabled and live.
	 * @return {bool} - Returns if there are live triggers enabled. */
	isLiveSearches() { return this.liveCounter || this.termCounter; }
	/** Passes the database id from the unique id for trigger given.
	 * @param  {number} unique - The unique id number for the trigger.
	 * @return {number}	       - The dbID for this trigger to use for all other data. */
	uniqueToDbId(unique) { return this.dbIds.unique[unique]; }
	getAllUniques() { return this.dbIds.unique; }
	/** Returns the database id from the panda unique id number given.
	 * @param  {number} pDbId - Panda Database Number
	 * @return {number}				- The dbID for this trigger to use. */
	pandaToDbId(pDbId) { return this.dbIds.pDbId[pDbId]; }
	/** Toggle the ReqSearch value of a panda job trigger so it does a requester search.
	 * @async 								- Just in case it needs to wait to disable a trigger.
	 * @param  {number} pDbId - Panda Database Number
	 * @return {number}				- Null if panda job trigger not found or returns value of reqSearch. */
	async toggleReqSearch(pDbId) {
		let dbId = this.pandaToDbId(pDbId);
		if (dbId) {
			let thisTrigger = this.triggers[dbId], thisData = this.data[dbId];
			thisTrigger.reqSearch = !thisTrigger.reqSearch;
			if (thisTrigger.status === 'searching') { await this.setDisabled(thisData.type, thisData.value, true, false); this.doSearching(null, false, dbId); }
			return thisTrigger.reqSearch;
		} else return null;
	}
	/** Sets the autoAllow option to status given or returns the current value.
	 * @param  {bool} [status] - Automatically Collect HITs Allowed?
	 * @return {bool}          - The status of the autoAllow HITs value. */
	autoHitsAllow(status=null) { if (status !== null) this.autoAllow = status; return this.autoAllow; }
	/** Wipes all data from the searching database. Usually for importing reasons.
	 * @async - To wait for all data to be wiped from searching database. */
	async wipeData() { await MYDB.openSearching().then( async () => { await MYDB.deleteDB('searching'); }); }
	/** Updates the database with new data.
	 * @async 										 - So the data gets added or updated to the database.
	 * @param  {string} name - Storage name  @param  {object} newData - New Data  @param  {bool} [onlyNew] - Only new data saved?  @param  {string} [key] - Key name */
	async updateToDB(name, newData, onlyNew=false, key=null) {
		if (MYDB) {
			await MYDB.addToDB('searching', name, newData, onlyNew, key)
			.then( () => {}, rejected => { console.error(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database usually for importing or UI closing. */
	closeDB() { MYDB.closeDB('searching'); this.db = null; }
	/** Loads data from database into memory using restrictions and adds to UI.
	 * @async  - So the data can be loaded into memory. */
	async loadFromDB() {
		let success = [], err = null, optionsUpdated = [], triggersUpdated = [], updateOptions = false;
		await MYDB.getFromDB('searching').then( async result => {
			for (const trigger of result) {
				let dbId = trigger.id, status = (trigger.disabled || !trigger.searchUI) ? 'disabled' : 'searching';
				await MYDB.getFromDB('searching', 'options', dbId).then( async options => {
					await MYDB.getFromDB('searching', 'rules', dbId).then( async ruleData => {
						await MYDB.getFromDB('searching', 'history', dbId,_, 'dbId', true).then( historyNum => {
							if (this.loaded && MySearchUI && trigger.searchUI) {
								MySearchUI.addToUI(trigger, status, trigger.name, this.triggers[dbId].count);
								if (!trigger.disabled) this.setDisabled(trigger.type, trigger.value, false, trigger.searchUI, false);
							} else if (!this.loaded) {
								let valueString = `${trigger.type}:${trigger.value}:${trigger.searchUI}`; updateOptions = false;
								if (!this.dbIds.values.hasOwnProperty(valueString)) {
									let numHits = historyNum, stats = Object.assign({'numFound':numHits, 'added':new Date().getTime(), 'lastFound':null},trigger); stats.numHits = numHits;
									if (options.autoGoHam && options.goHamDuration === 0) options.goHamDuration = this.optionDef.goHamDuration;
									if (options.tempGoHam === 0) options.tempGoHam = MyOptions.doSearch().defaultHamDur;
									if (compareVersion(gLocalVersion, '0.9.38')) { options.duration = 0; options.limitFetches = 0; updateOptions = true; }
									this.options[dbId] = Object.assign({}, this.optionDef, options);
									this.data[dbId] = {...trigger, ...stats}; this.rules[dbId] = ruleData.rules[ruleData.ruleSet];
									if (this.options[dbId].duration < 60000 && this.options[dbId].duration !== 0) { this.options[dbId].duration = 0; updateOptions = true; }
									if (!options.hasOwnProperty('autoLimit') || updateOptions) optionsUpdated.push(this.options[dbId]);
									if (!trigger.hasOwnProperty('numHits') || trigger.numHits !== stats.numHits) triggersUpdated.push(this.data[dbId]);
									this.fillInObjects(this.triggersAdded++, dbId, this.data[dbId], status, valueString, this.data[dbId].searchUI); stats = {};
								}
							}
							success[0] = 'Loaded all search triggers from database';
						});
						ruleData = null;
					});
					options = null;
				});
			}
			result = [];
		}, rejected => err = rejected );
		this.loaded = true;
		if (MYDB.useDefault('searching')) {
			await this.addTrigger('rid', {'name':'Receipt Processing Requester Trigger', 'reqId':'AGVV5AWLJY7H2', 'groupId':'', 'title':'', 'reqName':'Receipt Processing', 'pay':0.01, 'duration':'6 minutes', 'status':'disabled'}, {'duration': 0, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'goHamDuration':this.optionDef.goHamDuration, 'tempGoHam':this.optionDef.tempGoHam, 'acceptLimit':0, 'auto':false, 'autoLimit':2, 'tempDuration':this.optionDef.tempDuration, 'tempFetches':this.optionDef.tempFetches});
			await this.addTrigger('gid', {'name':'Receipt Processing GroupID Trigger', 'reqId':'', 'groupId':'30B721SJLR5BYYBNQJ0CVKKCWQZ0OI', 'title':'', 'reqName':'Receipt Processing', 'pay':0.01, 'duration':'6 minutes', 'status':'disabled'}, {'duration': 0, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'goHamDuration':this.optionDef.goHamDuration, 'tempGoHam':this.optionDef.tempGoHam, 'acceptLimit':0, 'auto':false, 'autoLimit':2, 'tempDuration':this.optionDef.tempDuration, 'tempFetches':this.optionDef.tempFetches});
			await this.addTrigger('custom', {'name':'Surveys higher than $1.00', 'reqId':null, 'groupId':null, 'title':'', 'reqName':'', 'pay':1.00, status: 'disabled'}, {'duration': 0, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':true, 'goHamDuration':this.optionDef.goHamDuration, 'tempGoHam':this.optionDef.tempGoHam, 'acceptLimit':0, 'auto':false, 'autoLimit':2, 'tempDuration':MyOptions.doSearch().defaultCustDur, 'tempFetches':MyOptions.doSearch().defaultCustFetches}, {'terms':true, 'include':new Set(['survey']), 'payRange': true, 'minPay':1.00});
		}
		if (optionsUpdated.length) { this.updateToDB('options', optionsUpdated); }
		if (triggersUpdated.length) { this.updateToDB(_, triggersUpdated); }
		optionsUpdated = null; triggersUpdated = null;
	}
	/** Gets data from the database with name, ID, index given. Uses cursor if needed and returns in certain order with limit.
	 * @async 							 - To wait for database to get the data that was asked for.
	 * @param  {string} name - Database Name     @param  {number} dbId    - Database ID  @param  {string} [indexName] - Index Name  @param  {bool} [cursor] - Use Cursor
	 * @param  {bool} [asc]  - Ascending order?  @param  {number} [limit] - Limit Data
	 * @return {object}      - Data that was retrieved from the database. */
	async getDBData(name, dbId, indexName=null, cursor=false, asc=true, limit=0) {
		let returnValue = null;
		await MYDB.getFromDB('searching', name, dbId,_, indexName,_, cursor, asc, limit).then( result => { returnValue = result; }, () => { delete this[name][dbId]; returnValue = null; });
		return returnValue;
	}
	/** Gets data according to the storage name and loads it into memory.
	 * @async 							 - To wait for database to get the data that was asked for.
	 * @param  {string} name - Database Name     @param  {number} dbId    - Database ID  @param  {string} [indexName] - Index Name  @param  {bool} [cursor] - Use Cursor
	 * @param  {bool} [asc]  - Ascending order?  @param  {number} [limit] - Limit Data
	 * @return {object}      - Data that was retrieved from the database. */
	async getFromDB(name, dbId, indexName=null, cursor=false, asc=true, limit=0) {
		let storeName = (name === 'rulesets') ? 'rules' : name, returnValue = await this.getDBData(storeName, dbId, indexName, cursor, asc, limit);
		if (!returnValue) return null;
		if (name === 'rules') { let ruleSet = returnValue.ruleSet; returnValue = returnValue.rules[ruleSet]; }
		return returnValue;
	}
	/** Prepare the search URL with many options.
	 * @param  {number} [pageSize]  - Page size      @param  {bool} [onlyQual] - Only qualified?
	 * @param  {bool} [onlyMasters]	- Only Masters?  @param  {string} [sort]   - Sort value       @param  {string} [minReward] - Minimum reward */
	prepareSearch() { this.resetSearch(); }
	resetSearch(pageSize=35, onlyQual=true, onlyMasters=false, sort='updated_desc', minReward='0.01') {
		let savedOptions = MyOptions.doSearch();
		sort = (this.sorting.includes(sort)) ? sort : this.sorting[0]; // set up sorting with passed value or default
		pageSize = (savedOptions) ? savedOptions.pageSize : pageSize; minReward = (savedOptions) ? savedOptions.minReward : minReward;
		const formatJson = (savedOptions.useJSON) ? '&format=json' : ''; // add format json or not?
		this.searchUrl = new UrlClass(`https://worker.mturk.com/?page_size=${pageSize}&filters%5Bqualified%5D=${onlyQual}&filters%5Bmasters%5D=${onlyMasters}&sort=${this.sort}&filters%5Bmin_reward%5D=${minReward}${formatJson}`);
		this.optionDef.goHamDuration = MyOptions.getHamDelayTimer(); this.optionDef.tempGoHam = MyOptions.doSearch().defaultHamDur;
		this.optionDef.tempDuration = MyOptions.doSearch().defaultDur; this.optionDef.tempFetches = MyOptions.doSearch().defaultFetches;
	}
	/** Sets the timer value with the number given or returns the current value of search timer.
	 * @param  {number} [timer] - Timer Value for Search Timer
	 * @return {number}         - Current value of search timer. */
	timerChange(timer=null) { if (timer) return searchTimer.theTimer(timer); else return searchTimer.theTimer(); }
	/** Removes all data from class to clear out memory as much as possible on exit. */
	removeAll() {
		this.searchesString = ''; this.livePandaUIStr = ''; this.liveSearchUIStr = ''; this.liveCounter = 0; this.pandaCollecting = [];
		this.options = {}; this.data = {}; this.rules = {}; this.dbIds.pDbId = {}; this.termCounter = 0; this.fromPanda.clear();
		this.fromSearch.clear(); this.tempBlockGid.clear(); this.tempBlockRidGid.clear(); this.dbIds.values = {}; this.dbIds.unique = {}; this.loaded = false;
	}
	/** Add database ID to a queue of data allowed in memory. Deletes data which isn't used much.
	 * @param  {number} item - Database ID */
	addToQueueMem(item) {
		if (this.queueDbIds.unshift(item) > MyOptions.doSearch().queueSize) { let deleteThis = this.queueDbIds.pop(); delete this.options[deleteThis]; delete this.rules[deleteThis]; }
	}
	/** Sets up the data in memory for given database ID and waits for data to be retrieved from database if needed.
	 * @async 							 - To wait for the data to be retrieved from database if needed.
	 * @param  {number} dbId - Database ID */
	async pingTriggers(dbId) {
		if (!this.rules[dbId]) this.rules[dbId] = await this.getFromDB('rules', dbId); if (!this.options[dbId]) this.options[dbId] = await this.getFromDB('options', dbId);
		this.queueDbIds = arrayRemove(this.queueDbIds, dbId); this.addToQueueMem(dbId);
	}
	/** Change the rules with the given object and update database.
	 * @param  {number} dbId - Database ID  @param  {object} newRules - Rules Object */
	rulesChanged(dbId, newRules) { this.updateToDB('rules', {rules:[newRules], 'dbId':dbId, 'ruleSet':0}, false); }
	/** Changes the data for the database of given name and then saves it to database or returns the data object from database.
	 * @async 							 - To wait for data from database if needed.
	 * @param  {number} dbId - Database ID  @param  {string} name - Database Name  @param  {object} [changed] - Object Data
	 * @return {object}         - Object data from database */
	async theData(dbId, name, changed=null) {
		let returnValue = null;
		if (changed && name !== 'rules') this.updateToDB(name, changed, false); else if (changed) this.rulesChanged(dbId, changed);
		if (!this[name][dbId]) await this.pingTriggers(dbId); else if (changed) this[name][dbId] = changed; returnValue = this[name][dbId];
		return returnValue;
	}
	/** Returns an object with all the data for search triggers packed together for exporting to a file.
	 * @async						- To wait for getting data from database if needed.
	 * @return {object} - Returns an object with all data. */
	async exportTriggers() {
		let exportThis = {}, setArray = Array.from(this.fromSearch);
		for (const dbId of setArray) {
			let fullRules = await this.getFromDB('rulesets', dbId), theHistory = await this.getFromDB('history', dbId, 'dbId'), options = await this.getFromDB('options', dbId);
			let theData = Object.assign({}, this.data[dbId]), theOptions = Object.assign({}, options);
			for (const ruleSet of fullRules.rules) {
				ruleSet.blockGid = Array.from(ruleSet.blockGid); ruleSet.blockRid = Array.from(ruleSet.blockRid); ruleSet.exclude = Array.from(ruleSet.exclude);
				ruleSet.include = Array.from(ruleSet.include); ruleSet.onlyGid = Array.from(ruleSet.onlyGid);
			}
			theHistory = Object.assign({}, (theData.type === 'custom') ? {} : theHistory);
			exportThis[dbId] = {'trigger':theData, 'options':theOptions, 'rules':fullRules, 'history':theHistory};
		}
		return exportThis;
	}
	/**	Returns an object with all the groupings so it can be exported to a file.
	 * @async						- To wait for the groupings data to be loaded from database.
	 * @return {object} - All the groupings in one object. */
	async exportSearchGroupings() {
		let groupings = await this.getFromDB('grouping'), i = 1, exportGroups = {};
		for (const value of groupings) exportGroups[i++] = value;
		return exportGroups;
	}
	/** Find out if panda UI has been opened.
	 * @return {bool} - True if the panda UI has been opened. */
	isPandaUI() { return (extPandaUI !== null); }
	/** Toggle the panda timer pause status with the value sent or returns the value of the pause value instead.
	 * @param  {bool} [val] - Sets the timer to the value or returns pause status if null.
	 * @return {bool}       - Returns the status of the panda timer pause mode. */
	pauseToggle(val=null) { if (searchTimer) { let paused = (val) ? searchTimer.paused = val : searchTimer.pauseToggle(); return paused; } }
	/** Unpause the search timer. */
	unPauseTimer() { searchTimer.paused = false; }
	/** This method gets called when the queue gets a new result from MTURK so it has to be logged on.
	 * @param  {object} results - The results from a new queue with all the hit data.
	**/
	gotNewQueue(results) {
		if (!this.isSearchUI()) this.autoTaskIds = {};
		else {
			if (Object.keys(this.autoTaskIds).length) {
				for (const dbId of Object.keys(this.autoTaskIds)) {
					for (const taskId of this.autoTaskIds[dbId]) {
						let count = arrayCount(results, item => { if (item.task_id === taskId) return true; else return false; }, true);
						if (count === 0) { flattenSortObject(this.autoTaskIds, dbId, taskId); this.triggers[dbId].auto--; }
					}
				}
			}
			this.nowLoggedOn();
		}
	}
	/** We are logged off so pause the timer and tell the search UI that it's logged off. */
	nowLoggedOff() { searchTimer.paused = true; this.loggedOff = true; if (MySearchUI) MySearchUI.nowLoggedOff(); }
	/** We are logged on so unpause timer and tell the search UI that it's logged back in. */
	nowLoggedOn() { this.unPauseTimer(); this.loggedOff = false; if (MySearchUI) MySearchUI.nowLoggedOn(); }
	/** Checks to see if logged off from MTURK and returns the result.
	 * @return {bool} - Returns if it's logged off or not. */
	isLoggedOff() { return this.loggedOff; }
	/** Set up searchUI to prepare for importing new data. */
	importing() { if (MySearchUI) { MySearchUI.importing(); } }
	/** Tell searchUI that importing is now done. */
	importingDone() { if (MySearchUI) MySearchUI.importingDone(); }
	/** This method will start the searching of the MTURK search page. */
	startSearching() {
		this.termCounter = Object.keys(this.liveTermData).length;
		this.liveCounter = this.livePandaUIStr.length + this.liveSearchUIStr.length;
		let liveStr = ((!this.pausedPandaUI) ? this.livePandaUIStr : '') + ((MySearchUI.searchGStats.isSearchOn() && !this.pausedSearchUI) ? this.liveSearchUIStr : '');
		if (!this.timerUnique && (this.liveCounter || this.termCounter)) { // Make sure it's not already searching.
			this.timerUnique = searchTimer.addToQueue(-1, (timerUnique, elapsed) => {
				if (this.liveCounter || this.termCounter) this.goFetch(this.searchUrl, timerUnique, elapsed);
				else { if (MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn()) MySearchUI.stopSearching(); else this.stopSearching(); }
			});
			return true;
		} else if (this.timerUnique && liveStr) return true;
		else return false;
	}
	/** Set up a search timer for a RID search so it checks if any HITs have already dropped.
	 * @param  {number} unique - Unique Number  @param  {function} [doThis] - Do function After Timer */
	doRidSearch(unique, doThis=null) { return searchTimer.addToQueue(unique, (timerUnique, elapsed, rId) => { if (doThis) doThis(timerUnique, elapsed, rId); }); }
	/** Mark a trigger as searching now.
	 * @param  {number} pDbId - The panda ID  @param  {bool} [sUI] - Do search from search UI or panda UI?  @param  {number} [thisDbId] - The Database ID. */
	doSearching(pDbId, sUI=true, thisDbId=null) {
		let dbId = (thisDbId) ? thisDbId : this.dbIds.pDbId[pDbId];
		if (this.data[dbId].type === 'rid') {
			this.triggers[dbId].status = 'finding';
			this.triggers[dbId].timerUnique = searchTimer.addToQueue(this.data[dbId].value, (timerUnique, elapsed) => {
				this.goFetch(this.triggers[dbId].reqUrl, timerUnique, elapsed, dbId, this.data[dbId].type, this.data[dbId].value, sUI);
			});
		} else {
			if (!this.triggers[dbId].tempDisabled) this.setDisabled(this.data[dbId].type, this.data[dbId].value, false, sUI);
			else this.triggers[dbId].tempDisabled = false;
		}
	}
	/** Mark a trigger as disabled now.
	 * @param  {string} type - Trigger type  @param  {string} value - Trigger value  @param  {bool} [sUI] - From searchUI? */
	async doDisabled(type, value, sUI=true) {
		if (this.is(type, value, sUI)) {
			let dbId = this.dbIds.values[`${type}:${value}:${sUI}`];
			await this.setDisabled(type, value, true, sUI); this.triggers[dbId].tempDisabled = false;
		}
	}
	/** This method will stop the searching of the MTURK search page. */
	stopSearching() {
		this.liveCounter = this.livePandaUIStr.length + ((MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
		if (this.timerUnique && this.liveCounter === 0) { if (searchTimer) searchTimer.deleteFromQueue(this.timerUnique); this.timerUnique = null; }
	}
	/** Gets the status from panda UI of this particular panda job.
	 * @async								  - To wait for data to be loaded from the database if needed.
	 * @param  {string} gId	  - The Group ID  @param  {string} rId - The Requester ID  @param  {bool} status - Job Status  @param  {bool} [collected] - Collected Yet?
	 * @param  {string} [url] - Panda URL */
	async pandaStatus(gId, rId, status, collected=false, url='') {
		if (!this.isSearchUI()) this.autoTaskIds = {};
		else {
			if (this.tempBlockRidGid.has(gId)) {
				let ridDbId = this.theDbId('rid', rId);
				if (ridDbId) {
					let ridTrigger = this.triggers[ridDbId];
					if (collected && ridDbId) {
						ridTrigger.collected.add(gId);
						this.setTempBlockGid(gId, false, true);
						setTimeout( (dbId, gId) => { if (this.triggers[dbId]) this.triggers[dbId].collected.delete(gId); }, 600000, ridDbId, gId );
					} else if (!status) this.setTempBlockGid(gId, false, true);
				}
			}
			let autoGid = this.autoGids.hasOwnProperty(gId), disabled = false;
			let dbId = (this.isAll('gid', gId)) ? this.theDbId('gid', gId) : (autoGid) ? this.autoGids[gId] : null, trigger = this.triggers[dbId];
			if (dbId) {
				if (collected && !autoGid) {
					let options = await this.theData(dbId, 'options'), unique = trigger.count;
					if (options.once) { this.toggleTrigger(unique,_, false); disabled = true; if (MySearchUI) MySearchUI.statusMe(unique, trigger.status); }
				} else if (collected && autoGid && url !== '') {
					let taskId = url.match(/\/projects\/.*\/tasks[\/?]([^\/?]*)/)[1]; buildSortObject(this.autoTaskIds, dbId, taskId); this.autoCollected.push(gId);
				}
				if (status && !autoGid) { this.pandaCollecting.push(gId); if (dbId && trigger.status === 'disabled' && !disabled) trigger.status = 'collecting'; }
				else if (!status) {
					if (autoGid) {
						delete this.autoGids[gId]; if (this.autoCollected.includes(gId)) arrayRemove(this.autoCollected, gId); else trigger.auto--;
					} else {
						this.pandaCollecting = arrayRemove(this.pandaCollecting, gId);
						if (trigger.status === 'collecting' && !disabled) trigger.status = 'searching';
					}
				}
			}
		}
		if (gId) this.setTempBlockGid(gId, status);
	}
	/** Maintain the GID history by deleting some older data if too old.
	 * @async								 - To wait for data to be retrieved from database if needed.
	 * @param  {number} dbId - Database ID  @param  {string} key - Key Name  @param  {bool} sent - Sent Already?  @param  {bool} doUpdate - Update Also? */
	async maintainGidHistory(dbId, key, sent, doUpdate=false) {
		let limitDays = (this.data[dbId].type === 'custom') ? MyOptions.doSearch().customHistDays : MyOptions.doSearch().triggerHistDays;
		await MYDB.getFromDB('searching', 'history', [dbId, key],_, 'dbIdGid').then( async history => {
			if (history.length !== 0) MYDB.deleteFromDB('searching', 'history', history[0].id).then( null, rejected => console.log(rejected));
			this.updateToDB('history', {'dbId':dbId, 'gid':key, 'date':new Date().getTime(), 'sent':sent, 'updated':new Date().getTime()}, false);
			if (!this.triggers[dbId].histDaily) {
				let beforeDate = new Date(); beforeDate.setDate( beforeDate.getDate() - limitDays );
				let keyRange = IDBKeyRange.bound([dbId, 0], [dbId, beforeDate.getTime()]);
				MYDB.deleteFromDB('searching', 'history', keyRange, 'dbIdDate').then( null, rejected => console.log(rejected));
				this.triggers[dbId].histDaily = true;
			}
		});
		await MYDB.getFromDB('searching', 'history', dbId,_, 'dbId', true).then( async historyNum => {
			if (this.data[dbId]) {
				this.data[dbId].numHits = historyNum; if (doUpdate) this.updateToDB(_, this.data[dbId]);
				if (MySearchUI) MySearchUI.updateStats(this.triggers[dbId].count, this.data[dbId]);
			}
		});
	}
	/** Temporarily block trigger from detecting this group ID in the search results.
	 * @param  {string} gId - Blocked group ID  @param  {bool} [block] - Block This?  @param  {bool} [rIdBlock] - Block Gid from Requester */
	setTempBlockGid(gId, block=null, rIdBlock=false) {
		let blockVar = (rIdBlock) ? 'tempBlockRidGid' : 'tempBlockGid';
		let blocked = (this[blockVar].has(gId));
		if (block === null) block = !blocked;
		if ((block && !blocked) || (!block && blocked)) { if (block) this[blockVar].add(gId); else this[blockVar].delete(gId); }
	}
	/** Sets it so a group ID is skipped from a custom trigger.
	 * @param  {string} gId - Group ID  @param  {bool} skip - Skip This? */
	setCustomGidSkip(gId, skip) {
		let gidSkipped = this.customGidSkip.includes(gId);
		if (skip && !gidSkipped) this.customGidSkip.push(gId);
		else if (!skip && gidSkipped) this.customGidSkip = arrayRemove(this.customGidSkip, gId);
		if (this.customGidSkip.length > 600) this.customGidSkip.shift();
	}
	/** Returns a requester URL class from the provided requester ID.
	 * @param  {string} rId - Requester ID
	 * @return {object}			- Returns a URL class with the requester URL. */
	createReqUrl(rId) { return new UrlClass(`https://worker.mturk.com/requesters/${rId}/projects`); }
	/** Sets up the blocked variables from the database options. */
	checkBlocked() { if (this.blockedGids === null) { let theOptions = MyOptions.doSearch(); this.blockedGids = theOptions.blockedGids; this.blockedRids = theOptions.blockedRids; } }
	/** Returns the string with all the blocked ID's from the group or requester ID.
	 * @param  {bool} [gId] - Use Blocked Group IDs?
	 * @return {string}     - Returns the full string of all blocked IDs. */
	getBlocked(gId=true) {
		this.checkBlocked(); let value = (gId) ? this.blockedGids : this.blockedRids;
		if (value.length === 0) return [];
		return value.replace(/\|\|/g,',').replace(/\|/g,'').split(',');
	}
	/** Adds or removes an ID to the blocked variables or can toggle the blocked status. Can also return a value showing which is being blocked.
	 * @param  {string} gId    - Group ID           @param  {string} rId - Requester ID  @param  {bool} [add] - Add to Blocked?  @param  {bool} [remove] - Remove from Blocked?
	 * @param  {bool} [toggle] - Toggle if Blocked
	 * @return {array}			   - Returns array with returned Group ID first and returned Requester ID second. */
	theBlocked(gId, rId, add=false, remove=false, toggle=false) {
		this.checkBlocked();
		let blockData = {'rid':{'found':false, 'search':`|${rId}|`, 'block':'blockedRids', 'ret':true}, 'gid':{'found':false, 'search':`|${gId}|`, 'block':'blockedGids', 'ret':true}};
		for (const key of Object.keys(blockData)) {
			if ( (key === 'rid' && rId) || (key === 'gid' && gId)) {
				let thisBlock = blockData[key]; thisBlock.found = this[thisBlock.block].includes(thisBlock.search);
				if (!thisBlock.found && add) { this[thisBlock.block] += thisBlock.search; }
				else if (thisBlock.found && (remove || (toggle && add))) this[thisBlock.block] = this[thisBlock.block].replace(thisBlock.search, '');
				else if (add || remove) thisBlock.ret = false;
				else thisBlock.ret = thisBlock.found;
			} else blockData[key].ret = false;
		}
		let status = (gId && this.blockedGids.includes(`|${gId}|`)) || (rId && this.blockedRids.includes(`|${rId}|`)) || false;
		if ((add || remove) && (blockData.gid.ret || blockData.rid.ret)) {
			let opt = MyOptions.doSearch(); opt.blockedRids = this.blockedRids; opt.blockedGids = this.blockedGids; MyOptions.doSearch(opt);
		}
		return [blockData.gid.ret, blockData.rid.ret, status];
	}
	/** Checks to see if Group ID or Requester ID is blocked.
	 * @param  {string} gId - Group ID  @param  {string} rId - Requester ID
	 * @return {bool}				- True if blocked and false if not. */
	isIdsBlocked(gId, rId) {
		this.checkBlocked();
		if (this.tempBlockGid.has(gId) || this.tempBlockRidGid.has(gId) || this.blockedGids.includes(`|${gId}|`) || this.blockedRids.includes(`|${rId}|`)) return true; else return false;
	}
	/** Does this HIT have a pay rate in the triggers pay range rules?
	 * @param  {object} rules - The rules object from a trigger.  @param  {number} pay - The pay rate of the HIT to check.
	 * @return {bool}					- True if pay rate is good or not. */
	isPayRange(rules, pay) {
		if (pay < rules.minPay) return false;
		if (rules.maxPay !== 0 && pay > rules.maxPay) return false;
		return true;
	}
	/** Does this HIT have a term in the title or description that is in the triggers rules?
	 * @param  {object} rules - The rules   @param  {string} searchStr - String to Search  @param  {string} [orLogic]	- Use an OR logic?
	 * @return {bool}					- True if term rules is in the HIT. */
	isTermCheck(rules, searchStr, orLogic=true) {
		let good = (orLogic) ? false : true;
		if (rules.include.size === 0) good = true;
		else for (const term of rules.include) { if (searchStr.includes(term.toLowerCase())) good = (orLogic) ? true : good && true; else if (!orLogic) good = false; }
		if (rules.exclude.size > 0 && good) for (const term of rules.exclude) { if (searchStr.includes(term.toLowerCase())) good = false; }
		return good;
	}
	/** Send the panda information to panda UI for collecting with a duration, fetches, once and go ham duration in data.
	 * @async										 - To wait for dat to be loaded from database if needed.
	 * @param  {object} item     - HIT item         @param  {number} dbId         - Database ID   @param  {object} [type] - Trigger type  @param  {object} [useOnce] - Only Once?
	 * @param  {number} [useDur] - Duration to use  @param  {number} [useFetches] - Fetches Limit */
	async sendToPanda(item, dbId, type='', useOnce=null, useDur=null, useFetches=null) {
		myPanda.fetchFromSearch(item.hit_set_id, useOnce);
		let info = this.triggers[dbId], options = await this.theData(dbId, 'options');
		let pandaId = myPanda.getMyId(info.pDbId), tempDur = (options.tempDuration >= 0) ? options.tempDuration : MyOptions.doSearch().defaultDur;
		if (tempDur < 0 || tempDur > 3600000) { tempDur = options.tempDuration = MyOptions.doSearch().defaultDur; this.updateToDB('options', options, false); }
		if (options.goHamDuration === 0 && options.autoGoHam) options.goHamDuration = MyOptions.getHamDelayTimer();
		let goOnce = (useOnce) ? useOnce : options.once, goDur = (useDur !== null) ? useDur : tempDur, useFetch = (useFetches !== null) ? useFetches : options.tempFetches;
		if (goDur === 0 && useFetch === 0) goDur = MyOptions.doSearch().defaultDur || 12000;
		let dO = dataObject(item.hit_set_id, item.description, item.title, item.requester_id, item.requester_name, item.monetary_reward.amount_in_dollars, item.assignable_hits_count);
		let oO = optObject(goOnce,_,_, options.limitNumQueue, options.limitTotalQueue, options.limitFetches, options.duration, options.autoGoHam, options.goHamDuration);
		if (extPandaUI) extPandaUI.addFromSearch(dO, oO, true, true, true, goDur, options.tempGoHam, type, pandaId, info.setName, useFetch);
	}
	/** Check all live triggers for this item.
	 * @async 							 - To wait for The data from the database to be loaded if needed.
	 * @param  {object} item - The HIT Item   @param  {bool} [started] - Started to Collect?  @param  {string} [checkRid] - Rid to Search For
	 * @return {bool}        - If collection has been started. */
	async checkTriggers(item, started=true, checkRid=null) {
		let liveStr = ((!this.pausedPandaUI) ? this.livePandaUIStr : '') + ((MySearchUI.searchGStats.isSearchOn() && !this.pausedSearchUI) ? this.liveSearchUIStr : '');
		if (this.isIdsBlocked(item.hit_set_id, item.requester_id)) return;
		let gidFound = liveStr.includes(`[[gid:${item.hit_set_id}]]`), ridFound = liveStr.includes(`[[rid:${item.requester_id}]]`) || (checkRid === item.requester_id);
		let titleDescription = item.title.toLowerCase() + ' , ' + item.description.toLowerCase(), termsFound = [];
		if (MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn() && Object.keys(this.liveTermData).length) {
			for (const key of Object.keys(this.liveTermData)) {
				if (titleDescription.includes(key.toLowerCase())) {
					if (this.liveTermData[key].length && this.liveTermData[key][0].includes('true')) termsFound.unshift(key); else termsFound.push(key);
				}
			}
		}
		if (gidFound || ridFound || termsFound.length) {
			let key1 = (gidFound) ? 'gid' : (ridFound) ? 'rid' : 'terms', key2 = (gidFound) ? item.hit_set_id : item.requester_id;
			if (key1 !== 'terms') termsFound = [key1];
			for (let term of termsFound) {
				let dbIdArr = (key1 === 'terms') ? this.liveTermData[term]: [`${this.theDbId(key1, key2)}`];
				for (const thisDbId of dbIdArr) {
					let dbId = (thisDbId.includes(',')) ? Number(thisDbId.split(',')[0]) : Number(thisDbId);
					let triggered = true, thisTrigger = this.triggers[dbId], gId = item.hit_set_id, auto = false, doUpdate = false;
					let options = await this.theData(dbId, 'options'), rules = await this.theData(dbId, 'rules');
					if (rules.payRange) triggered = this.isPayRange(rules, item.monetary_reward.amount_in_dollars);
					if (rules.include.size || rules.exclude.size) triggered = triggered && this.isTermCheck(rules, titleDescription, (key1 !== 'terms'));
					if (triggered && !thisTrigger.tempDisabled && !this.pandaCollecting.includes(gId)) {
						console.info(`Found a trigger: ${this.data[dbId].name} - ${item.assignable_hits_count} - ${gId} - ${item.monetary_reward.amount_in_dollars}`);
						this.data[dbId].numFound++; this.data[dbId].lastFound = new Date().getTime();
						if ((key1 === 'rid' && !thisTrigger.collected.has(gId) && !rules.blockGid.has(gId)) || key1 === 'gid') {
							this.sendToPanda(item, dbId, key1, options.once); this.setTempBlockGid(gId, true);
							if (MySearchUI) MySearchUI.triggeredHit(thisTrigger.count, this.data[dbId]);
							if (options.once && key1 === 'rid') this.setTempBlockGid(gId, true, true);
							if (key1 === 'gid') { thisTrigger.tempDisabled = true; thisTrigger.status = 'collecting'; }
							doUpdate = true;
						} else if (key1 === 'terms' && !this.customGidSkip.includes(gId)) {
							if (options.auto && this.autoAllow && thisTrigger.auto < options.autoLimit) {
								this.sendToPanda(item, dbId, key1, true, 10000); thisTrigger.auto++; this.autoGids[gId] = dbId; auto = true; this.setTempBlockGid(gId, true);
							}
							if (MySearchUI) MySearchUI.triggeredHit(thisTrigger.count, this.data[dbId], item, term, started, auto);
							this.setCustomGidSkip(gId, true); doUpdate = true;
						}
						this.maintainGidHistory(dbId, gId, true, doUpdate);
						break;
					}
				}
			}
		}
		liveStr = ''; item = {}; termsFound = [];
	}
	/** Tells search that pandaUI is paused.
	 * @param  {bool} [pandaUI] - PandaUI Paused? */
	pauseSearch(pandaUI=false) { this.pausedPandaUI = pandaUI; }
	/**	Creates the live trigger string which holds all trigger info for faster searching.
	 * @param  {string} type - Trigger Type  @param  {string} value  - Trigger Value   @param  {bool} enable - Enabled?
	 * @param  {bool} [sUI]  - Search UI?    @param  {bool} [remove] - Remove Live Trigger? */
	liveString(type, value, enable, sUI=true, remove=true) {
		let liveStr = (sUI) ? 'liveSearchUIStr' : 'livePandaUIStr', triggerString = `[[${type}:${value}]]`;
		if (enable && !this[liveStr].includes(triggerString)) this[liveStr] += triggerString; else if (remove) this[liveStr] = this[liveStr].replace(triggerString, '');
		this.termCounter = Object.keys(this.liveTermData).length;
		this.liveCounter = this.livePandaUIStr.length + ((MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
	}
	/** Sets up the live terms data for faster searching of terms.
	 * @param  {bool} enable - Enabled?  @param  {object}  options - Options Object  @param  {object} rules - Rules Object  @param  {number} dbId - Database ID */
	termData(enable, rules, options, dbId) {
		if (rules.terms && rules.include.size) {
			let thisTermStr = rules.include.values().next().value;
			if (enable && thisTermStr) { buildSortObject(this.liveTermData, thisTermStr, `${dbId},${options.auto}`); }
			else if (thisTermStr) flattenSortObject(this.liveTermData, thisTermStr, `${dbId},${options.auto}`);
		}
	}
	/** Sets the disabled status of trigger and does the live string again if needed.
	 * @async								 - To wait for the data from database to be fully loaded.
	 * @param  {string} type - Type of trigger  @param  {string} value  - Group ID or requester ID  @param  {bool} disabled - Disabled?
	 * @param  {bool} [sUI]  - Search UI?       @param  {bool} [remove] - Remove Live Trigger?  */
	async setDisabled(type, value, disabled, sUI=true, remove=true, stopOk=true) {
		let dbId = this.theDbId(type, value, false, sUI); if (!dbId) return;
		let rules = await this.theData(dbId, 'rules'), options = await this.theData(dbId, 'options'); 
		if (type === 'custom') this.termData(!disabled, rules, options, dbId);
		else this.liveString(type, value, !disabled, sUI, remove);
		if (disabled && this.triggers[dbId].reqSearch) {
			searchTimer.deleteFromQueue(this.triggers[dbId].timerUnique); this.triggers[dbId].status = 'disabled'; this.triggers[dbId].reqSLastCreated = null;
		}
		else if (!sUI && disabled) this.triggers[dbId].status = 'disabled';
		if (stopOk && MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn()) { if (this.liveCounter === 0 && this.termCounter === 0) this.stopSearching(); }
		else if (this.liveCounter > 0 && !sUI) this.startSearching();
		else if (stopOk && this.liveCounter === 0) this.stopSearching();
	}
	/** Toggles the status of the trigger.
	 * @param  {string} unique - Trigger Unique ID  @param  {string} [passedDbId] - Passed Database ID  @param  {bool} [forceEnabled] - Enabled Status
	 * @return {bool}          - Status of the trigger. */
	toggleTrigger(unique, passedDbId=null, forceEnabled=null, stopOk=false) {
		let dbId = (passedDbId !== null) ? passedDbId : this.dbIds.unique[unique];
		if (dbId) {
			let oldStatus = this.triggers[dbId].status, disabled = (forceEnabled !== null) ? forceEnabled : (oldStatus === 'disabled') ? true : false;
			if (this.data[dbId].type === 'rid' && disabled && MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn()) this.doSearching(null,_, dbId);
			else {
				this.setDisabled(this.data[dbId].type, this.data[dbId].value, !disabled,_,_, stopOk);
				this.triggers[dbId].status = (disabled) ? 'searching' : 'disabled';
			}
			this.data[dbId].disabled = !disabled; this.updateToDB(_, this.data[dbId]);
			return this.triggers[dbId].status;
		} else return null;
	}
	/** Copy the changes to the options and rules for trigger with the database id.
	 * @async										- To wait for the rules and options to be fully loaded from database.
	 * @param  {object} changes - Changes for trigger  @param  {number} dbId - Database id for trigger. */
	async optionsChanged(changes, dbId) {
		changes.rules.payRange = (changes.rules.minPay > 0 || changes.rules.maxPay > 0);
		await this.theData(dbId, 'rules', changes.rules); await this.theData(dbId, 'options', changes.options);
		if (changes.hasOwnProperty('details') && changes.details) {
			this.data[dbId].name = changes.details.name; this.data[dbId].disabled = changes.details.disabled;
			this.updateToDB(_, this.data[dbId], false);
		}
	}
	/** Returns a copy of the options object using the database ID.
	 * @async								 - To wait for the data to be fully loaded from database.
	 * @param  {number} dbId - Database ID number.
	 * @return {object}      - The object of the copied options data. */
	async optionsCopy(dbId) { let options = await this.theData(dbId, 'options'); return Object.assign({}, options); }
	/** Returns a deep copy of the rules for trigger.
	 * @async								 - To wait for the rules to be fully loaded from database.
	 * @param  {number} dbId - Database id for trigger.
	 * @return {object}			 - The deep copy of the rules for trigger. */
	async rulesCopy(dbId) {
		let rules = await this.theData(dbId, 'rules'), rulesCopied = Object.assign({}, rules);
		rulesCopied.blockGid = new Set(rules.blockGid); rulesCopied.exclude = new Set(rules.exclude);
		rulesCopied.include = new Set(rules.include); rulesCopied.onlyGid = new Set(rules.onlyGid);
		return rulesCopied;
	}
	/** Loads trigger information to database from import file or user trigger adds.
	 * @async											- To wait for the data to be updated to database.
	 * @param  {object} data      - Trigger Data     @param  {object} [options] - Trigger options        @param  {object} [rules] - Trigger rules
	 * @param  {object} [history] - Trigger History  @param  {bool} [multiple]  - Save object is array.  @param  {array} [prevId] - Previous Id's */
	async saveToDatabase(data, options=null, rules=null, history=null, multiple=false, prevId=null) {
		let dbId = null;
		await this.updateToDB(_, data, false);
		if (multiple) {
			for (let i = 0, len = data.length; i < len; i++) {
				options[i].dbId = data[i].id; rules[i].dbId = data[i].id; if (prevId) prevId[i].newId = data[i].id;
				if (history && history[i]) {
					for (const key of Object.keys(history[i])) { history[i][key].dbId = data[i].id; }
					await this.updateToDB('history', Object.values(history[i]), !multiple);
				}
			}
		} else { dbId = data.id; if (options !== null) options.dbId = dbId; if (rules !== null) rules.dbId = dbId;}
		if (options !== null) await this.updateToDB('options', options, !multiple, dbId);
		if (rules !== null) await this.updateToDB('rules', rules, !multiple, dbId);
	}
	/** Fills objects in memory for adding from database or from user.
	 * @param  {number} count	- Unique ID       @param  {number} dbId				 - Database ID    @param  {object} data - Trigger data
	 * @param  {bool} status	- Trigger status  @param  {string} valueString - Unique string 	@param  {bool} SUI 		- From searchUI? */
	fillInObjects(count, dbId, data, status, valueString, sUI) {
		let reqUrl = (data.type === 'rid') ? this.createReqUrl(data.value) : null;
		let setName = (data.searchUI) ? 'fromSearch' : 'fromPanda'; this[setName].add(dbId);
		this.triggers[dbId] = {'count':count, 'pDbId':data.pDbId, 'setName':setName, 'status':status, 'tempDisabled':false, 'timerUnique':-1, 'reqUrl':reqUrl, 'histDaily':false,
			'auto': 0, 'collected': new Set(), 'reqSearch':false, 'reqSLastCreated':null};
		if (data.pDbId !== -1) this.dbIds.pDbId[data.pDbId] = dbId; this.dbIds.values[valueString] = dbId; this.dbIds.unique[count] = dbId;
		this.addToQueueMem(dbId);
		if (MySearchUI && sUI) {
			MySearchUI.addToUI(data, status, data.name, count);
			if (status === 'searching') this.setDisabled(data.type, data.value, false, data.searchUI);
		}
	}
	/** Moves a panda search job to the searchUI and saves it to the database.
	 * @async									- To wait for saving data to database.
	 * @param  {number} pDbId - Panda Database ID  @param  {bool} status - Trigger Status
	 * @return {bool}					- Returns if moving was successful. */
	async moveToSearch(pDbId, status) {
		let dbId = this.dbIds.pDbId[pDbId], uniqueData = {};
		let theData = this.data[dbId], valueString = `${theData.type}:${theData.value}:`;
		this.triggers[dbId].status = (status) ? 'searching' : 'disabled'; theData.status = status;
		if (theData.searchUI) return false; else theData.searchUI = true;
		if (this.dbIds.values[valueString + 'true']) return false;
		delete this.dbIds.values[valueString + 'false']; this.dbIds.values[valueString + 'true'] = dbId; delete this.dbIds.pDbId[pDbId];
		this.triggers[dbId].setName = 'fromSearch'; this.fromPanda.delete(dbId); this.fromSearch.add(dbId); this.triggers[dbId].pDbId = -1; theData.pDbId = -1;
		MySearchUI.addToUI(theData, this.triggers[dbId].status, theData.name, this.triggers[dbId].count);
		for (const unique of Object.keys(this.dbIds.unique)) { let dbId = this.dbIds.unique[unique]; uniqueData[unique] = this.data[dbId]; }
		MySearchUI.redoFilters(theData.type,_, uniqueData); this.appendFragments(false);
		await this.saveToDatabase(theData,_,_,_, false);
		return true;
	}
	/** Adds a new trigger with the type of it and the value for group ID or requester ID.
	 * @async										- To wait for saving it to database.
	 * @param  {string} type	  - Type          @param  {object} info	     - Info object     @param  {object} options	- Options object
	 * @param  {object} [rules] - Rules object  @param  {object} [history] - History object  @param  {bool} [sUI]     - From searchUI?
	 * @return {number}				  - Returns the unique id of this trigger. */
	async addTrigger(type, info, options, rules={}, history={}, sUI=true) {
		let key2 = (type === 'rid') ? info.reqId : (info.idNum) ? info.idNum : info.groupId, valueString = `${type}:${key2}:${sUI}`;
		if (!key2 && type !== 'custom') return null; // No value set for search type.
		if (type === 'custom' && !this.uniqueName(info.name)) return null; // No value set for search type.
		if (this.dbIds.values[valueString]) return null; // Cannot accept any duplicates.
		if (!info.pDbId) info.pDbId = -1; this.triggersAdded++;
		if (type === 'custom' && !info.idNum) { key2 = this.triggersAdded; valueString = `${type}:${key2}:${sUI}`; }
		let theObject = {'type':type, 'value':key2, 'pDbId':info.pDbId, 'searchUI':sUI, 'name':info.name, 'disabled':(info.status === 'disabled'), 'numFound':0, 'added':new Date().getTime(), 'lastFound':null, 'numHits':0};
		let theOptions = Object.assign({}, this.optionDef, options), theRule = Object.assign({}, this.ruleSet, rules), theRules = {'rules':[theRule], 'ruleSet':0};
		if (type === 'custom') { theOptions.tempDuration = MyOptions.doSearch().defaultCustDur; theOptions.tempFetches = MyOptions.doSearch().defaultCustFetches; }
		let theHistory = history; theObject.numHits = Object.keys(theHistory).length;
		await this.saveToDatabase(theObject, theOptions, theRules,_, false);
		let dbId = theObject.id; this.data[dbId] = theObject;
		await this.theData(dbId, 'options'); await this.theData(dbId, 'rules');
		this.fillInObjects(this.triggersAdded, dbId, theObject, info.status, valueString, sUI);
		if (myHistory) myHistory.fillInHistory(history, 'triggers');
		myPanda.searchUIConnect(true);
		return this.triggersAdded;
	}
	/** Appends any fragments in the Search UI that is needed. */
	appendFragments() { if (MySearchUI) MySearchUI.appendFragments(); }
	/** Remove the trigger from memory with the database ID, Panda Database ID, unique number with sUI value. Can also force removal from database.
	 * @async 								 - To wait for Disabling the trigger.
	 * @param  {number} [dbId] - Database ID  @param  {number} [pDbId]  - Panda Database ID.     @param  {number} [unique]       - Unique Number
	 * @param  {bool} [sUI]    - SearchUI?    @param  {bool} [removeDB] - Remove From Database?  @param  {function} sendResponse - Function to send Queue Results. */
	async removeTrigger(dbId=null, pDbId=null, unique=null, sUI=true, removeDB=false, sendResponse=null) {
		dbId = (dbId) ? dbId : (unique !== null) ? this.dbIds.unique[unique] : this.dbIds.pDbId[pDbId];
		if (dbId && this.data[dbId]) {
			let tempData = Object.assign({}, this.data[dbId]);
			await this.setDisabled(tempData.type, tempData.value, true); // Remove trigger from live strings.
			if (sUI && MySearchUI) MySearchUI.removeTrigger(this.triggers[dbId].count);
			this.fromPanda.delete(dbId); this.fromSearch.delete(dbId);
			delete this.options[dbId]; delete this.rules[dbId]; delete this.triggers[dbId]; delete this.data[dbId];
			delete this.dbIds.pDbId[pDbId]; delete this.dbIds.values[`${tempData.type}:${tempData.value}:${sUI}`];
			if (removeDB) {
				MYDB.deleteFromDB('searching',_, dbId); MYDB.deleteFromDB('searching', 'rules', dbId);
				MYDB.deleteFromDB('searching', 'options', dbId); MYDB.deleteFromDB('searching', 'history', dbId, 'dbId');
			}
			if (MySearchUI.searchGStats && MySearchUI.searchGStats.isSearchOn() && this.liveCounter === 0 && this.termCounter === 0) this.stopSearching();
			myPanda.searchUIConnect(true);
			if (sendResponse) this.getAllTriggers( (data) => { data.for = 'removeTrigger'; data['removedTrigger'] = true; sendResponse(data); });
		} else if (sendResponse) sendResponse({'for':'removeJob', 'response':{}, 'removedJob':false});
	}
	/** When a UI is closed then this method will remove any triggers added from that UI.
	 * @async								- To wait for removal of triggers from memory.
	 * @param  {bool} [sUI] - The UI that is being closed. */
	async originRemove(sUI=true) {
		let setName = (sUI) ? 'fromSearch' : 'fromPanda';
		for (const dbId of this[setName]) { await this.removeTrigger(dbId,_,_, sUI); }
		if (sUI) this.loaded = false;
	}
  /** Fetches the URL for this search after timer class tells it to do so and handles MTURK results.
	 * @async									 - To wait for fetch results.
   * @param  {object} objUrl - Url object   @param  {number} queueUnique - Queue Unique ID   @param  {number} elapsed	- Elapsed Time
	 * @param  {number} [dbId] - Database ID  @param  {string} [type]      - Type for trigger  @param  {string} [value] - Value for trigger
	 * @param  {bool} [sUI]		 - From UI      @param  {string} [lookGid]   - Group ID */
  goFetch(objUrl, queueUnique, elapsed, dbId=null, type='', value='', sUI=true, lookGid=null) {
		if (MySearchUI.searchGStats) MySearchUI.searchGStats.setSearchElapsed(elapsed); // Pass elapsed time to global search stats
		if (MySearchUI.searchGStats && (this.resultsBack.status || (!this.slowRequest && !this.resultsBack.status))) {
			if (this.dLog(4)) console.debug(`%cGoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
			this.slowRequest = !this.resultsBack.status; this.resultsBack.status = false;
			super.goFetch(objUrl, this.resultsBack).then( async (result) => {
				this.slowRequest = false;
				if (this.fetchSkipped) { this.fetchSkipped = false; searchTimer.adjustTimer(0); }
				if (!result) {
					if (this.dError(1)) { console.error('Returned fetch result was a null.', JSON.stringify(objUrl)); }
				} else if (MySearchUI.searchGStats) {
					if (!dbId) MySearchUI.searchGStats.addTotalSearchFetched();
					MySearchUI.searchGStats.addFetchedElapsed(this.resultsBack.elapsed); this.resultsBack.elapsed = 0;
					if (!this.pausedPandaUI) myPanda.searchFetched(dbId);
					if (result.mode === 'logged out' && queueUnique !== null) this.nowLoggedOff();
					else if (result.mode === 'pre') {
						MySearchUI.searchGStats.addTotalSearchPRE(); if (extPandaUI) extPandaUI.pandaGStats.addSearchPRE(); // found a PRE while searching so increment search pre counter
					} else if (result.type === 'ok.json' || (result.type === 'ok.text' && dbId === null)) {
						let i = 0, tempString = '', tempNewHits = {}, resultsTarget = null, hitsAvailable = 0, stopNow = false, started = true;
						if ((result.type === 'ok.text')) {
							let reactProps = $(result.data).find('.row.m-b-md div:eq(1)').data('react-props'); resultsTarget = reactProps.bodyData;
							let countInfo = $(result.data).find('.result-count-info:first').text();
							if (countInfo) hitsAvailable = countInfo.split(' ')[2].replace(/\D/g, "");
						} else { resultsTarget = result.data.results; hitsAvailable = result.data.total_num_results; }
						MySearchUI.searchGStats.addTotalSearchResults(hitsAvailable);
						while (i < resultsTarget.length && !stopNow) {
							let thisItem = resultsTarget[i++]; if (!thisItem) continue;
							if (this.lastCreationTime > thisItem.last_updated_time) { stopNow = true; continue; };
							let hitPosId = thisItem.last_updated_time + '.' + thisItem.hit_set_id;
							if (!this.searchesString.includes(`[[${hitPosId}]]`)) {
								this.checkTriggers(thisItem, started);
								tempString += `[[${hitPosId}]]`; started = false;
								tempNewHits[thisItem.hit_set_id] = hitObject(thisItem.hit_set_id, thisItem.description, thisItem.title, thisItem.requester_id, thisItem.requester_name, thisItem.monetary_reward.amount_in_dollars, thisItem.assignable_hits_count, thisItem.assignment_duration_in_seconds, thisItem.latest_expiration_time);
							}
						}
						this.lastCreationTime = resultsTarget[0].last_updated_time;
						if (myHistory) myHistory.fillInHistory(tempNewHits, 'searchResults');
						this.searchesString = tempString + this.searchesString;
						this.searchesString = this.searchesString.substr(0,3700);
						tempString = ''; tempNewHits = {};
					} else if (result.type === 'ok.text') {
						let reactProps = $(result.data).find('.row.m-b-md div:eq(1)').data('react-props');
						if (reactProps) {
							let hitsData = reactProps.bodyData, rewardSort = {}, foundData = null, i = 0, tempString = '';
							if (dbId !== null && hitsData.length > 0) {
								if (this.triggers[dbId].setName === 'fromPanda' && this.triggers[dbId].reqSearch) {
									let lastTime = this.triggers[dbId].reqSLastCreated || 0, stopAt = hitsData.length;
									while (i < stopAt) {
										let thisItem = hitsData[i++]; if (!thisItem) continue;
										let hitPosId = thisItem.last_updated_time + '.' + thisItem.hit_set_id;
										if (lastTime > thisItem.last_updated_time || this.searchesString.includes(`[[${hitPosId}]]`)) { stopAt = i; continue; }
										else tempString += `[[${hitPosId}]]`;
									}
									hitsData.length = stopAt; i = 0;
								}
								this.triggers[dbId].reqSLastCreated = hitsData[0].last_updated_time;
								for (const hit of hitsData) {
									if (!lookGid) rewardSort[hit.monetary_reward.amount_in_dollars.toFixed(2) + i] = hit;
									else if (lookGid === hit.hit_set_id) foundData = hit;
								}
								if (!lookGid) {
									let sortArray = Object.keys(rewardSort).sort((a,b) => b - a), requesterName = $(result.data).find('h1.m-b-md').text(), started = true;
									if (requesterName !== '' && this.triggers[dbId].pDbId >= 0) myPanda.updateReqName(_, requesterName, this.triggers[dbId].pDbId);
									sortArray.slice(0,5);
									for (const key of sortArray) { this.checkTriggers(rewardSort[key], started, rewardSort[key].requester_id); started = false; }
									sortArray = null;
								} else if (foundData) this.sendToPanda(foundData, dbId, lookGid);
							}
							this.searchesString = tempString + this.searchesString;
							this.searchesString = this.searchesString.substr(0,3700);	
							tempString = ''; hitsData = null; rewardSort = null;
						}
						if (dbId !== null && (this.triggers[dbId].setName === 'fromSearch' || !this.triggers[dbId].reqSearch)) {
							searchTimer.deleteFromQueue(queueUnique); this.triggers[dbId].status = 'searching';
							await this.setDisabled(type, value, false, sUI);
							if (!lookGid && !this.timerUnique && MySearchUI.searchGStats.isSearchOn()) this.startSearching();
						}
					}
				}
				result = {};
				this.resultsBack.lastParsed = new Date() - this.resultsBack.parsedTime;
			});
		}
		else if (!this.resultsBack.status && this.slowRequest) { this.fetchSkipped = true; searchTimer.frontOfQueue(queueUnique); }
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
