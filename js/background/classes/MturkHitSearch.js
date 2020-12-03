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
		this.searchesString = '';									// Temporary id's of hits to find new hits in results. Limited to 100 hits remembered.
		this.livePandaUIStr = '';									// Live search triggers from pandaUI
		this.liveSearchUIStr = '';								// Live search triggers from searchUI
		this.liveTermStr = ''; this.liveTermReg = null; this.liveTermData = {}; this.liveTermArr = []; this.liveCounter = 0; this.termCounter = 0;
		this.triggersAdded = 0;										// The number of triggers added. Also used for a unique number for each trigger.
		this.pandaCollecting = [];								// Array of all panda gId's collecting now from pandaUI.
		this.searchGStats = null;									// global search stats.
		this.searchUrl = null;          					// Url class for search url.
		this.onlyQualified = true;      					// Show only qualified hits in search results.
		this.onlyMasters = false;       					// Show only master hits in search results.
		this.minReward = 0.01;          					// The minimum reward will be $0.01 by default.
		this.resultsBack = true;									// Used to make sure the last results from mturk has been processed.
		this.loggedOff = false;         					// Are we logged off from mturk?
		this.queueDbIds = [];											// Array of dbid's in memory which is limited by size to save memory use.
		this.triggers = {};												// Object with info in memory for triggers. Stays in memory.
		this.data = {};														// Object with all the data for triggers. Stays in memory.
		this.options = {};												// Object with all the options for triggers. Memory limits enforced.
		this.rules = {};													// Object with all the rules for triggers. Memory limits enforced.
		this.fromPanda = new Set();								// A set with dbID's of triggers coming from pandaUI.
		this.fromSearch = new Set();
		this.pausedPandaUI = false;
		this.pausedSearchUI = false;
		this.tempBlockGid = new Set(); this.blockedRids = null; this.blockedGids = null; this.customGidSkip = [];
    this.sort = "updated_desc";     					// Sort by updated_desc by default.
    this.pandaDur = {min:0, max:60} 					// Limits for the panda duration in minutes.
		this.loaded = false;											// Has data been loaded from database?
		if (timer) {
			searchTimer.setMyClass(this);							// Tell timer what class is using it so it can send information back.
			searchTimer.theTimer(timer);    					// Set timer for this timer.
		}
		this.temps = 1;
		this.autoTaskIds = {}, this.autoGids = {}, this.autoCollected = [], this.autoAllow = false;
    this.sorting = ["updated_desc", "updated_asc", "reward_asc", "reward_desc", "hits_asc", "hits_desc"];
		this.dbIds = {'pDbId':{}, 'values':{}, 'unique':{}};
		this.optionDef = {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'tempGoHam':4000, 'acceptLimit':0, 'auto': false, 'autoLimit': 2};
		this.ruleSet = {'blockGid': new Set(), 'blockRid': new Set(), 'onlyGid': new Set(), 'terms': false, 'exclude': new Set(), 'include': new Set(), 'payRange': false, 'minPay': 0.00, 'maxPay': 0.00};
		if (timer) this.prepareSearch();						// Prepare all the search data.
	}
	isSearchUI() { return (extSearchUI !== null); }
	/** Find out if a trigger has been added with type, value and SUI values.
	 * @param  {string} type     - Trigger type @param  {string} value - Trigger value @param  {bool} [sUI=true] - From searchUI?
	 * @return {bool}				     - True if trigger has been added. */
	is(type, value, sUI=true) { return this.dbIds.values.hasOwnProperty(`${type}:${value}:${sUI}`); }
	/** Checks to see if a trigger with type and value has been added from any UI.
	 * @param  {string} type - Trigger type @param  {string} value - Trigger value @return {bool} - True if trigger has been added. */
	isAll(type, value) { return (this.is(type, value, true) || this.is(type, value, false)); }
	uniqueName(name) {
		let returnValue = true;
		for (const key of Object.keys(this.data)) { console.log(this.data[key].name, name); if (this.data[key].name === name) { returnValue = false; break; } }
		return returnValue;
	}
	/** returns the dbid from a type and value given from any UI.
	 * @param  {string} type  - Trigger type @param  {string} value - Trigger value
	 * @return {number}	      - The dbID for this trigger to use for all other data. */
	theDbId(type, value) { return (this.dbIds.values[`${type}:${value}:true`] || this.dbIds.values[`${type}:${value}:false`]) }
	getFrom(type='Panda') { return Array.from(this[`from${type}`]); }
	isEnabled(dbId) { return this.triggers[dbId].status !== 'disabled'; }
	isDisabled(dbId) { return this.triggers[dbId].status === 'disabled'; }
	getTrigger(dbId) { return this.triggers[dbId]; }
	getData(dbId) { return this.data[dbId]; }
	isLiveSearches() { return this.liveCounter || this.termCounter; }
	/** Passes the database id from the unique id for trigger given.
	 * @param  {number} unique - The unique id number for the trigger.
	 * @return {number}	       - The dbID for this trigger to use for all other data. */
	uniqueToDbId(unique) { return this.dbIds.unique[unique]; }
	pandaToDbId(pDbId) { return this.dbIds.pDbId[pDbId]; }
	autoHitsAllow(status=null) { if (status !== null) this.autoAllow = status; return this.autoAllow; }
	async wipeData() { await MYDB.openSearching().then( async () => { await MYDB.deleteDB('searching'); }); }
	/** Updates the database with new data.
	 * @async 										 - So the data gets added or updated to the database.
	 * @param  {string} storeName  - Storage name @param  {object} newData - New Data @param  {bool} [onlyNew=false] - Only new data saved? 
	 * @param  {string} [key=null] - Key name */
	async updateToDB(name, newData, onlyNew=false, key=null) {
		if (MYDB) {
			await MYDB.addToDB('searching', name, newData, onlyNew, key)
			.then(_, rejected => { console.error(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database usually for importing or UI closing. */
	closeDB() { MYDB.closeDB('searching'); this.db = null; }
	/** Loads data from database into memory using restrictions and adds to UI.
	 * @async  - So the data can be loaded into memory. */
	async loadFromDB() {
		let success = [], err = null, optionsUpdated = [], triggersUpdated = [];
		await MYDB.getFromDB('searching').then( async result => {
			for (const trigger of result) {
				let dbId = trigger.id, status = (trigger.disabled) ? 'disabled' : 'searching';
				await MYDB.getFromDB('searching', 'options', dbId).then( async options => {
					await MYDB.getFromDB('searching', 'rules', dbId).then( async ruleData => {
						await MYDB.getFromDB('searching', 'history', dbId,_, 'dbId', true).then( historyNum => {
							if (this.loaded && extSearchUI && trigger.searchUI) {
								extSearchUI.addToUI(trigger, status, trigger.name, this.triggers[dbId].count);
								if (!trigger.disabled) this.setDisabled(trigger.type, trigger.value, false, trigger.searchUI, false);
							} else if (!this.loaded) {
								let valueString = `${trigger.type}:${trigger.value}:${trigger.searchUI}`;
								if (!this.dbIds.values.hasOwnProperty(valueString)) {
									let numHits = historyNum, stats = Object.assign({'numFound':numHits, 'added':new Date().getTime(), 'lastFound':null},trigger); stats.numHits = numHits;
									this.options[dbId] = Object.assign({}, this.optionDef, options);
									this.data[dbId] = {...trigger, ...stats}; this.rules[dbId] = ruleData.rules[ruleData.ruleSet];
									if (!options.hasOwnProperty('autoLimit')) optionsUpdated.push(this.options[dbId]);
									if (!trigger.hasOwnProperty('numHits') || trigger.numHits !== stats.numHits) triggersUpdated.push(this.data[dbId]);
									this.fillInObjects(this.triggersAdded++, dbId, this.data[dbId], status, valueString, this.data[dbId].searchUI); stats = {};
								}
							}
							success[0] = "Loaded all search triggers from database";
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
			await this.addTrigger('rid', {'name':'Ibotta, Inc. Requester Trigger', 'reqId':'AGVV5AWLJY7H2', 'groupId':'', 'title':'', 'reqName':'Ibotta, Inc.', 'pay':0.01, 'duration':'6 minutes', 'status':'disabled'}, {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'tempGoHam':4000, 'acceptLimit':0});
			await this.addTrigger('gid', {'name':'Ibotta, Inc. GroupID Trigger', 'reqId':'', 'groupId':'30B721SJLR5BYYBNQJ0CVKKCWQZ0OI', 'title':'', 'reqName':'Ibotta, Inc.', 'pay':0.01, 'duration':'6 minutes', 'status':'disabled'}, {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'tempGoHam':4000, 'acceptLimit':0});
		}
		if (optionsUpdated.length) { this.updateToDB('options', optionsUpdated); }
		if (triggersUpdated.length) { this.updateToDB(_, triggersUpdated); }
		optionsUpdated = null; triggersUpdated = null;
	}
	async getDBData(name, dbId, indexName=null, cursor=false, asc=true, limit=0) {
		let returnValue = null;
		await MYDB.getFromDB('searching', name, dbId,_, indexName,_, cursor, asc, limit).then( result => { returnValue = result; },
			() => { delete this[name][dbId]; returnValue = null; });
		return returnValue;
	}
	/** Gets data according to the storage name and loads it into memory.
	 * @param  {string} name - Database storage name to save in @param  {number} dbId - Database ID */
	async getFromDB(name, dbId, indexName=null, cursor=false, asc=true, limit=0) {
		let storeName = (name === 'rulesets') ? 'rules' : name;
		let returnValue = await this.getDBData(storeName, dbId, indexName, cursor, asc, limit); if (!returnValue) return null;
		if (name === 'rules') { let ruleSet = returnValue.ruleSet; returnValue = returnValue.rules[ruleSet]; }
		return returnValue;
	}
	/** Prepare the search URL with many options.
	 * @param  {bool} [json=true]					- JSON         @param  {number} [pageSize=35]					- Page size  @param  {bool} [onlyQual=true]			 - Only qualified
	 * @param  {bool} [onlyMasters=false]	- Only Masters @param  {string} [sort="updated_desc"] - Sort value @param  {string} [minReward="0.01"] - Minimum reward */
	async prepareSearch(json=true, pageSize=35, onlyQual=true, onlyMasters=false, sort="updated_desc", minReward="0.01") {
		sort = (this.sorting.includes(sort)) ? sort : this.sorting[0];// set up sorting with passed value or default
		pageSize = (MyOptions.doSearch()) ? MyOptions.doSearch().pageSize : pageSize;
		const formatJson = (json) ? "&format=json" : ""; // add format json or not?
		this.searchUrl = new UrlClass(`https://worker.mturk.com/?page_size=${pageSize}&filters%5Bqualified%5D=${onlyQual}&filters%5Bmasters%5D=${onlyMasters}&sort=${this.sort}&filters%5Bmin_reward%5D=${minReward}${formatJson}`);
		this.searchGStats =  new SearchGStats();
	}
	timerChange(timer=null) { if (timer) return searchTimer.theTimer(timer); else return searchTimer.theTimer(); }
	/** Removes all data from class to clear out memory as much as possible on exit.
	 * @async - Just so things get cleared out before a restart. */
	async removeAll() {
		this.searchesString = ''; this.livePandaUIStr = ''; this.liveSearchUIStr = ''; this.liveCounter = 0; this.pandaCollecting = [];
		this.searchGStats = null; this.options = {}; this.data = {}; this.rules = {}; this.dbIds.pDbId = {}; this.termCounter = 0;
		this.fromPanda.clear(); this.fromSearch.clear(); this.tempBlockGid.clear(); this.dbIds.values = {}; this.dbIds.unique = {}; this.loaded = false;
	}
	/** Add database ID to a queue of data allowed in memory. Deletes data which isn't used much.
	 * @param  {number} item - Database ID */
	addToQueueMem(item) {
		if (this.queueDbIds.unshift(item) > MyOptions.doSearch().queueSize) { let deleteThis = this.queueDbIds.pop(); delete this.options[deleteThis]; delete this.rules[deleteThis]; }
	}
	/**
	 * @param  {number} dbId - Database ID    @param  {number} [pDbId=null]  - Panda database ID
	 * @return {array} - Returns data in format [info, data, options, rules] */
	async pingTriggers(dbId) {
		if (!this.rules[dbId]) this.rules[dbId]= await this.getFromDB('rules', dbId); if (!this.options[dbId]) this.options[dbId] = await this.getFromDB('options', dbId);
		this.queueDbIds = arrayRemove(this.queueDbIds, dbId); this.addToQueueMem(dbId);
	}
	rulesChanged(dbId, newRules) { this.updateToDB('rules', {rules:[newRules], 'dbId':dbId, 'ruleSet':0}, false); }
	async theData(dbId, name, changed=null) {
		let returnValue = null;
		if (changed && name !== 'rules') this.updateToDB(name, changed, false); else if (changed) this.rulesChanged(dbId, changed);
		if (!this[name][dbId]) await this.pingTriggers(dbId); else if (changed) this[name][dbId] = changed; returnValue = this[name][dbId];
		return returnValue;
	}
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
	async exportSearchGroupings() { let groupings = await this.getFromDB('grouping'); return groupings; }
	/** Find out if panda UI has been opened.
	 * @return {bool} - True if the panda UI has been opened. */
	isPandaUI() { return (extPandaUI!==null); }
	/** Unpause the search timer. */
	unPauseTimer() { searchTimer.paused = false; }
	/** This method gets called when the queue gets a new result from mturk so it has to be logged on. */
	gotNewQueue(results) {
		if (Object.keys(this.autoTaskIds).length) {
			for (const dbId of Object.keys(this.autoTaskIds)) {
				for (const taskId of this.autoTaskIds[dbId]) {
					let count = arrayCount(results, (item) => { if (item.task_id === taskId) return true; else return false; }, true);
					if (count === 0) flattenSortObject(this.autoTaskIds, dbId, taskId); this.triggers[dbId].auto--;
				}
			}
		}
		this.nowLoggedOn();
	}
	/** We are logged off so pause the timer and tell the search UI that it's logged off. */
	nowLoggedOff() { searchTimer.paused = true; this.loggedOff = true; if (extSearchUI) extSearchUI.nowLoggedOff(); }
	/** We are logged on so unpause timer and tell the search UI that it's logged back in. */
	nowLoggedOn() { this.unPauseTimer(); this.loggedOff = false; if (extSearchUI) extSearchUI.nowLoggedOn(); }
	isLoggedOff() { return this.loggedOff; }
	importing() { if (extSearchUI) { extSearchUI.importing(); } }
	importingDone() { if (extSearchUI) extSearchUI.importingDone(); }
	/** This method will start the searching of the mturk queue.
	 * @param  {number} dbId - The database ID of the trigger that is starting. */
	startSearching() {
		this.termCounter = Object.keys(this.liveTermData).length;
		let liveLength = this.livePandaUIStr.length + this.liveSearchUIStr.length;
		this.liveCounter = liveLength;
		if (!this.timerUnique && (this.liveCounter || this.termCounter)) { // Make sure it's not already searching.
			this.timerUnique = searchTimer.addToQueue(-1, (timerUnique, elapsed, theId) => {
				if (this.liveCounter || this.termCounter) this.goFetch(this.searchUrl, timerUnique, elapsed, theId);
				else { if (this.searchGStats && this.searchGStats.isSearchOn()) extSearchUI.stopSearching(); else this.stopSearching(); }
			});
			return true;
		}
		else return false;
	}
	doRidSearch(unique, doThis=null) { return searchTimer.addToQueue(unique, (timerUnique, elapsed, rId) => { if (doThis) doThis(timerUnique, elapsed, rId); }); }
	/** Mark a trigger as searching now.
	 * @param  {number} pDbId - The panda ID @param  {bool} [sUI=true] - do search from search UI or panda UI? */
	doSearching(pDbId, sUI=true) {
		let dbId = this.dbIds.pDbId[pDbId];
		if (this.data[dbId].type === 'rid') {
			this.triggers[dbId].status = 'finding';
			this.triggers[dbId].timerUnique = searchTimer.addToQueue(this.data[dbId].value, (timerUnique, elapsed, rId) => {
				this.goFetch(this.triggers[dbId].reqUrl, timerUnique, elapsed, rId, dbId, this.data[dbId].type, this.data[dbId].value, sUI);
			});
		} else {
			if (!this.triggers[dbId].tempDisabled) this.setDisabled(this.data[dbId].type, this.data[dbId].value, false, sUI);
			else this.triggers[dbId].tempDisabled = false;
		}
	}
	/** Mark a trigger as disabled now.
	 * @param  {string} type - Trigger type @param  {string} value - Trigger value @param  {bool} [sUI=true] - From searchUI? */
	doDisabled(type, value, sUI=true) {
		if (this.is(type, value, sUI)) {
			let dbId = this.dbIds.values[`${type}:${value}:${sUI}`];
			this.setDisabled(type, value, true, sUI); this.triggers[dbId].tempDisabled = false;
		}
	}
	/** This method will stop the searching of the mturk queue. */
	stopSearching() {
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats && this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
		if (this.timerUnique && this.liveCounter === 0) {
			if (searchTimer) searchTimer.deleteFromQueue(this.timerUnique);
			this.timerUnique = null;
		}
	}
	/** Gets the status from panda UI of this particular panda job.
	 * @param  {string} gId	 - The group ID @param  {bool} status - The status of the panda in panda UI. */
	async pandaStatus(gId, status, collected=false, url) {
		let autoGid = this.autoGids.hasOwnProperty(gId), disabled = false;
		let dbId = (this.isAll('gid', gId)) ? this.theDbId('gid', gId) : (autoGid) ? this.autoGids[gId] : null, trigger = this.triggers[dbId];
		if (dbId) {
			if (collected && !autoGid) {
				let options = await this.theData(dbId, 'options'), unique = trigger.count;
				if (options.once) { this.toggleTrigger(unique); disabled = true; if (extSearchUI) extSearchUI.disableMe(unique, trigger.status); }
			} else if (collected && autoGid) {
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
		if (!status) this.setTempBlockGid(gId, false);
	}
	async maintainGidHistory(dbId, key, sent, doUpdate=false) {
		let limitDays = (this.data[dbId].type === 'custom') ? MyOptions.doSearch().customHistDays : MyOptions.doSearch().triggerHistDays;
		let beforeDate = new Date(), thisTrigger = this.triggers[dbId]; beforeDate.setDate( beforeDate.getDate() - limitDays );
		let keyRange = IDBKeyRange.bound([dbId, 0], [dbId, beforeDate.getTime()]);
		await MYDB.getFromDB('searching', 'history', [dbId, key],_, 'dbIdGid').then( async history => {
			if (history.length !== 0) MYDB.deleteFromDB('searching', 'history', history[0].id);
			this.updateToDB('history', {'dbId':dbId, 'gid':key, 'date':new Date().getTime(), 'sent':sent}, false);
			if (!thisTrigger.histDaily) MYDB.deleteFromDB('searching', 'history', keyRange, 'dbIdDate').then( null, (rejected) => console.error(rejected));
			this.triggers[dbId].histDaily = true;
		});
		await MYDB.getFromDB('searching', 'history', dbId,_, 'dbId', true).then( async historyNum => {
			this.data[dbId].numHits = historyNum; if (doUpdate) this.updateToDB(_, this.data[dbId]);
			extSearchUI.updateStats(this.triggers[dbId].count, this.data[dbId]);
		});
	}
	/** Temporarily block trigger from detecting this group ID in the search results.
	 * @param  {object} trigger	- The trigger  @param  {string} gId - Blocked group ID */
	setTempBlockGid(gId, block=null) {
		let blocked = (this.tempBlockGid.has(gId));
		if (block === null) block = !blocked;
		if ((block && !blocked) || (!block && blocked)) { if (block) this.tempBlockGid.add(gId); else this.tempBlockGid.delete(gId); }
	}
	setCustomGidSkip(gId, skip) {
		let gidSkipped = this.customGidSkip.includes(gId);
		if (skip && !gidSkipped) this.customGidSkip.push(gId);
		else if (!skip && gidSkipped) this.customGidSkip = arrayRemove(this.customGidSkip, gId);
		if (this.customGidSkip.length > 600) this.customGidSkip.shift();
	}
	createReqUrl(rId) { return new UrlClass(`https://worker.mturk.com/requesters/${rId}/projects`); }
	/** Find out if this group ID or requester ID is temporarily blocked.
	 * @param  {object} trigger	- The trigger @param  {string} gId - The group ID
	 * @return {bool}						- True if gId is blocked on this trigger. */
	checkBlocked() { if (this.blockedGids === null) { let theOptions = MyOptions.doSearch(); this.blockedGids = theOptions.blockedGids; this.blockedRids = theOptions.blockedRids; } }
	getBlocked(gId=true) {
		this.checkBlocked(); let value = (gId) ? this.blockedGids : this.blockedRids;
		if (value.length === 0) return [];
		return value.replace(/\|\|/g,',').replace(/\|/g,'').split(',');
	}
	theBlocked(gId, rId, add=false, remove=false, toggle=false) {
		this.checkBlocked();
		let blockData = {'rid':{'found':false, 'srch':`|${rId}|`, 'block':'blockedRids', 'ret':true}, 'gid':{'found':false, 'srch':`|${gId}|`, 'block':'blockedGids', 'ret':true}};
		for (const key of Object.keys(blockData)) {
			if ( (key === 'rid' && rId) || (key === 'gid' && gId)) {
				let thisBlock = blockData[key]; thisBlock.found = this[thisBlock.block].includes(thisBlock.srch);
				if (!thisBlock.found && add) this[thisBlock.block] += thisBlock.srch;
				else if (thisBlock.found && (remove || (toggle && add))) this[thisBlock.block] = this[thisBlock.block].replace(thisBlock.srch, '');
				else if (add || remove) thisBlock.ret = false;
				else thisBlock.ret = thisBlock.found;
			} else blockData[key].ret = false;
		}
		if ((add || remove) && (blockData.gid.ret || blockData.rid.ret)) {
			let opt = MyOptions.doSearch(); opt.blockedRids = this.blockedRids; opt.blockedGids = this.blockedGids; MyOptions.doSearch(opt);
		}
		return [blockData.gid.ret, blockData.rid.ret];
	}
	isIdsBlocked(gId, rId) {
		this.checkBlocked();
		if (this.tempBlockGid.has(gId) || this.blockedGids.includes(`|${gId}|`) || this.blockedRids.includes(`|${rId}|`)) return true; else return false;
	}
	/** Does this hit have a pay rate in the triggers pay range rules?
	 * @param  {object} rules - The rules object from a trigger. @param  {number} pay   - The pay rate of the hit to check.
	 * @return {bool}					- True if pay rate is good or not. */
	isPayRange(rules, pay) {
		if (pay < rules.minPay) return false;
		if (rules.maxPay !== 0 && pay > rules.maxPay) return false;
		return true;
	}
	/** Does this hit have a term in the title or description that is in the triggers rules?
	 * @param  {object} rules - The rules @param  {string} title - Title of this hit. @param  {string} desc	- Description of this hit.
	 * @return {bool}					- True if term rules is in the hit. */
	isTermCheck(rules, searchStr, orLogic=true) {
		let good = (orLogic) ? false : true;
		if (rules.include.size === 0) good = true;
		else for (const term of rules.include) { if (searchStr.includes(term)) good = (orLogic) ? true : good & true; else if (!orLogic) good = false; }
		if (rules.exclude.size > 0 && good) for (const term of rules.exclude) { if (searchStr.includes(term)) good = false; }
		return good;
	}
	/** Send the panda information to panda UI for collecting with a duration and go ham duration in data.
	 * @param  {object} item - Hit item @param  {object} info - Trigger info @param  {object} options - Trigger options @param  {object} type - Trigger type */
	async sendToPanda(item, dbId, type='', useOnce=null, useDur=null, useFetches=null) {
		let info = this.triggers[dbId], options = await this.theData(dbId, 'options');
		let pandaId = myPanda.getMyId(info.pDbId), tempDur = (options.duration >= 0) ? options.duration : MyOptions.doSearch().defaultDur;
		if (tempDur < 0 || tempDur > 3600000) { tempDur = options.duration = MyOptions.doSearch().defaultDur; this.updateToDB('options', options, false); }
		let goOnce = (useOnce) ? useOnce : options.once, goDur = (useDur !== null) ? useDur : tempDur, useFetch = (useFetches !== null) ? useFetches : options.limitFetches;
		let dO = dataObject(item.hit_set_id, item.description, item.title, item.requester_id, item.requester_name, item.monetary_reward.amount_in_dollars, item.assignable_hits_count);
		let oO = optObject(goOnce,_,_, options.limitNumQueue, options.limitTotalQueue, useFetch,_, options.autoGoHam, options.goHamDuration);
		if (extPandaUI) extPandaUI.addFromSearch(dO, oO, true, true, true, goDur, (options.autoGoHam) ? options.tempGoHam: 0, type, pandaId, info.setName);
	}
	/** Check all live triggers for this item.
	 * @param  {object} item - The hit item that needs to be checked for any trigger detection. */
	async checkTriggers(item, started=true) {
		let temps = this.temps++, termsFound = [];
		// console.time(`checkTriggers${temps}`);
		let liveStr = ((!this.pausedPandaUI) ? this.livePandaUIStr : '') + ((this.searchGStats.isSearchOn() && !this.pausedSearchUI) ? this.liveSearchUIStr : '');
		if (this.isIdsBlocked(item.hit_set_id, item.requester_id)) return;
		let gidFound = liveStr.includes(`[gid:${item.hit_set_id}]]`);
		let ridFound = liveStr.includes(`[rid:${item.requester_id}]]`);
		let titleDescription = item.title.toLowerCase() + ' , ' + item.description.toLowerCase();
		if (this.searchGStats && this.searchGStats.isSearchOn() && Object.keys(this.liveTermData).length) {
			for (const key of Object.keys(this.liveTermData)) { if (titleDescription.includes(key.toLowerCase())) termsFound.push(key); }
		}
		if (gidFound || ridFound || termsFound.length) {
			let key1 = (gidFound) ? 'gid' : (ridFound) ? 'rid' : 'terms', key2 = (gidFound) ? item.hit_set_id : item.requester_id;
			if (key1 !== 'terms') termsFound = [key1];
			for (const term of termsFound) {
				let dbIdArr = (key1 === 'terms') ? this.liveTermData[term] : [this.theDbId(key1, key2)];
				for (const dbId of dbIdArr) {
					let triggered = true, thisTrigger = this.triggers[dbId], gId = item.hit_set_id, auto = false, doUpdate = false;
					let options = await this.theData(dbId, 'options'), rules = await this.theData(dbId, 'rules');
					if (rules.payRange) triggered = this.isPayRange(rules, item.monetary_reward.amount_in_dollars);
					if (rules.terms) triggered = triggered & this.isTermCheck(rules, titleDescription, (key1 !== 'terms'));
					if (triggered && !thisTrigger.tempDisabled && !this.pandaCollecting.includes(gId)) {
						console.log(`Found a trigger: ${this.data[dbId].name} - ${item.assignable_hits_count} - ${gId} - ${item.monetary_reward.amount_in_dollars}`);
						this.data[dbId].numFound++; this.data[dbId].lastFound = new Date().getTime();
						if ((key1 === 'rid' && !rules.blockGid.has(gId)) || key1 === 'gid') {
							if (extSearchUI) extSearchUI.triggeredHit(thisTrigger.count, this.data[dbId]);
							this.sendToPanda(item, dbId, key1);
							if (options.once && key1 === 'rid') this.setTempBlockGid(gId, true);
							if (key1 === 'gid') { thisTrigger.tempDisabled = true; thisTrigger.status = 'collecting'; }
							doUpdate = true;
						} else if (key1 === 'terms' && !this.customGidSkip.includes(gId)) {
							if (options.auto && this.autoAllow && thisTrigger.auto < options.autoLimit) {
								thisTrigger.auto++; this.autoGids[gId] = dbId; auto = true; this.sendToPanda(item, dbId, key1, true, 10000); this.setTempBlockGid(gId, true);
							}
							if (extSearchUI) extSearchUI.triggeredHit(thisTrigger.count, this.data[dbId], item, term, started, auto);
							this.setCustomGidSkip(gId, true); started = false; doUpdate = true;
						}
						this.maintainGidHistory(dbId, gId, true, doUpdate);
						break;
					}	
				}
			}
			return started;
		}
		// console.timeEnd(`checkTriggers${temps}`);
		liveStr = ''; item = {}; termsFound = [];
	}
	pauseSearch(pandaUI=false, searchUI=false) { this.pausedPandaUI = pandaUI; }
	/**	Creates the live trigger string which holds all trigger info for faster searching.
	 * @param  {string} type - Type  @param  {string} value - Trigger Value  @param  {bool} enable - Enabled?  @param  {bool} [sUI=true] - Search UI? */
	liveString(type, value, enable, sUI=true, remove=true) {
		let liveStr = (sUI) ? 'liveSearchUIStr' : 'livePandaUIStr', triggerString = `[[${type}:${value}]]`;
		if (enable && !this[liveStr].includes(triggerString)) this[liveStr] += triggerString;
		else if (remove) this[liveStr] = this[liveStr].replace(triggerString, '');
		this.termCounter = Object.keys(this.liveTermData).length;
		this.liveCounter = this.livePandaUIStr.length + ((this.searchGStats && this.searchGStats.isSearchOn()) ? this.liveSearchUIStr.length : 0);
	}
	/** Sets up the live terms data for faster searching of terms.
	 * @param  {bool} enable - Enabled? @param  {object} rules - Rules object @param  {number} dbId - Database ID */
	termData(enable, rules, dbId) {
		if (rules.terms && rules.include.size) {
			let thisTermStr = rules.include.values().next().value;
			if (enable && thisTermStr) { buildSortObject(this.liveTermData, thisTermStr, dbId); }
			else if (thisTermStr) flattenSortObject(this.liveTermData, thisTermStr, dbId);
		}
	}
	/** Sets the disabled status of trigger and redoes the live string if needed.
	 * @param  {string} type	   - Type of trigger@param  {string} value - Group ID or requester ID @param  {bool} enable - Enabled or disabled?
	 * @param  {bool} [sUI=true] - Search UI or panda UI. */
	async setDisabled(type, value, disabled, sUI=true, remove=true) {
		let dbId = this.theDbId(type, value), rules = await this.theData(dbId, 'rules');
		if (type === 'custom') this.termData(!disabled, rules, dbId);
		else this.liveString(type, value, !disabled, sUI, remove);
		if (this.searchGStats && this.searchGStats.isSearchOn()) { if (this.liveCounter === 0 && this.termCounter === 0) this.stopSearching(); }
		else if (this.liveCounter > 0) this.startSearching();
		else this.stopSearching();
	}
	/** Toggles the status of the trigger.
	 * @param  {string} type  - Type of trigger @param  {string} value - Group ID or requester ID
	 * @return {bool}         - Status of the trigger. */
	toggleTrigger(unique, passdbId=null, forceEnabled=null) {
		let dbId = (passdbId) ? passdbId : this.dbIds.unique[unique];
		if (dbId) {
			let oldStatus = this.triggers[dbId].status, disabled = (forceEnabled !== null) ? forceEnabled : (oldStatus === 'disabled') ? true : false;
			this.setDisabled(this.data[dbId].type, this.data[dbId].value, !disabled);
			this.triggers[dbId].status = (disabled) ? 'searching' : 'disabled'; this.data[dbId].disabled = !disabled;
			this.updateToDB(_, this.data[dbId]);
			return this.triggers[dbId].status;
		} else return null;
	}
	/** Copy the changes to the options and rules for trigger with the database id.
	 * @param  {object} changes - Changes for trigger @param  {number} dbId - Database id for trigger. */
	async optionsChanged(changes, dbId) {
		changes.rules.payRange = (changes.rules.minPay > 0 || changes.rules.maxPay > 0);
		await this.theData(dbId, 'rules', changes.rules); await this.theData(dbId, 'options', changes.options);
		if (changes.hasOwnProperty('details') && changes.details) {
			this.data[dbId].name = changes.details.name; this.data[dbId].disabled = changes.details.disabled;
			this.updateToDB(_, this.data[dbId], false);
		}
	}
	/** Returns a copy of the options object using the database ID.
	 * @param  {number} dbId - Database ID number.
	 * @return {object}      - The object of the copied options data. */
	async optionsCopy(dbId) { let options = await this.theData(dbId, 'options'); return Object.assign({}, options); }
	/** Returns a deep copy of the rules for trigger.
	 * @param  {number} dbId - Database id for trigger.
	 * @return {object}			 - The deep copy of the rules for trigger. */
	async rulesCopy(dbId) {
		let rules = await this.theData(dbId, 'rules'), rulescopy = Object.assign({}, rules);
		rulescopy.blockGid = new Set(rules.blockGid); rulescopy.exclude = new Set(rules.exclude);
		rulescopy.include = new Set(rules.include); rulescopy.onlyGid = new Set(rules.onlyGid);
		return rulescopy;
	}
	/** Loads trigger information to database from import file or user trigger adds.
	 * @param  {object} triggers - Trigger Object @param  {object} options - Trigger options @param  {object} rules - Trigger rules @param  {bool} multiple - Save object is array.*/
	async saveToDatabase(data, options=null, rules=null, history=null, multiple=false) {
		let dbId = null;
		await this.updateToDB(_, data, false);
		if (multiple) {
			for (let i = 0, len = data.length; i < len; i++) {
				options[i].dbId = data[i].id; rules[i].dbId = data[i].id;
				if (history && history[i]) {
					for (const key of Object.keys(history[i])) { history[i][key].dbId = data[i].id; }
					await this.updateToDB('history', Object.values(history[i]), !multiple);
				}
			}
		} else { dbId = data.id; if (options !== null) options.dbId = dbId; if (rules !== null) rules.dbId = dbId;}
		if (options !== null) await this.updateToDB('options', options, !multiple, dbId);
		if (rules !== null) await this.updateToDB('rules', rules, !multiple, dbId);
	}
	/** Fills objects in memory used when searching for hits. Used for adding from database or from user.
	 * @param  {number} count	- Unique ID      @param  {number} dbId				 - Database ID    @param  {object} data - Trigger data
	 * @param  {bool} status	- Trigger status @param  {string} valueString - Unique string 	@param  {bool} SUI 		- From searchUI? */
	async fillInObjects(count, dbId, data, status, valueString, sUI) {
		let reqUrl = (data.type === 'rid') ? this.createReqUrl(data.value) : null;
		let setName = (data.searchUI) ? 'fromSearch' : 'fromPanda'; this[setName].add(dbId);
		this.triggers[dbId] = {'count':count, 'pDbId':data.pDbId, 'setName':setName, 'status':status, 'tempDisabled':false, 'timerUnique':-1, 'reqUrl':reqUrl, 'histDaily':false, auto: 0};
		if (data.pDbId !== -1) this.dbIds.pDbId[data.pDbId] = dbId; this.dbIds.values[valueString] = dbId; this.dbIds.unique[count] = dbId;
		this.addToQueueMem(dbId);
		if (extSearchUI && sUI) {
			extSearchUI.addToUI(data, status, data.name, count);
			if (status === 'searching') this.setDisabled(data.type, data.value, false, data.searchUI);
		}
	}
	async moveToSearch(pDbId, status) {
		let dbId = this.dbIds.pDbId[pDbId];
		let theData = this.data[dbId], valueString = `${theData.type}:${theData.value}:`;
		this.triggers[dbId].status = (status) ? 'searching' : 'disabled'; theData.status = status;
		if (theData.searchUI) return false; else theData.searchUI = true;
		if (this.dbIds.values[valueString + 'true']) return false;
		delete this.dbIds.values[valueString + 'false']; this.dbIds.values[valueString + 'true'] = dbId; delete this.dbIds.pDbId[pDbId];
		this.triggers[dbId].setName = 'fromSearch'; this.fromPanda.delete(dbId); this.fromSearch.add(dbId); this.triggers[dbId].pDbId = -1; theData.pDbId = -1;
		extSearchUI.addToUI(theData, this.triggers[dbId].status, theData.name, this.triggers[dbId].count);
		extSearchUI.redoFilters(theData.type); extSearchUI.appendFragments();
		await this.saveToDatabase(theData,_,_,_, false);
		return true;
	}
	/** Adds a new trigger with the type of it and the value for group ID or requester ID.
	 * @param  {string} type	     - Type         @param  {object} info	        - Info object     @param  {object} options	- Options object
	 * @param  {object} [rules={}] - Rules object @param  {object} [history={}] - History object  @param  {bool} [sUI=true] - From searchUI?
	 * @return {number}				- Returns the unique id of this trigger. */
	async addTrigger(type, info, options, rules={}, history={}, sUI=true) { 
		let key2 = (type === 'rid') ? info.reqId : (info.idNum) ? info.idNum : info.groupId, valueString = `${type}:${key2}:${sUI}`;
		if (!key2 && type !== 'custom') return null; // No value set for search type.
		if (type === 'custom' && !this.uniqueName(info.name)) return null; // No value set for search type.
		if (this.dbIds.values[valueString]) return null; // Cannot accept any duplicates.
		if (!info.pDbId) info.pDbId = -1; this.triggersAdded++;
		if (type === 'custom' && !info.idNum) { key2 = this.triggersAdded; valueString = `${type}:${key2}:${sUI}`; }
		let theObject = {'type':type, 'value':key2, 'pDbId':info.pDbId, 'searchUI':sUI, 'name':info.name, 'disabled':(info.status === 'disabled'), 'numFound':0, 'added':new Date().getTime(), 'lastFound':null, 'numHits':0};
		let theOptions = Object.assign({}, this.optionDef, options);
		let theRule = Object.assign({}, this.ruleSet, rules), theRules = {'rules':[theRule], 'ruleSet':0};
		let theHistory = history; theObject.numHits = Object.keys(theHistory).length;
		await this.saveToDatabase(theObject, theOptions, theRules,_, false);
		let dbId = theObject.id; this.data[dbId] = theObject;
		await this.theData(dbId, 'options'); await this.theData(dbId, 'rules');
		await this.fillInObjects(this.triggersAdded, dbId, theObject, info.status, valueString, sUI);
		if (myHistory) myHistory.fillInHistory(history, 'triggers');
		myPanda.searchUIConnect(true);
		return this.triggersAdded;
	}
	appendFragments() { if (extSearchUI) extSearchUI.appendFragments(); }
	/** Remove the trigger with the type and value from the class.
	 * @param  {number} [dbId=null]	- Database ID @param  {number} [pDbId=null] - Panda Database ID. @param  {bool} [sUI=true] - Search UI or panda UI. */
	async removeTrigger(dbId=null, pDbId=null, unique=null, sUI=true, removeDB=false) {
		dbId = (dbId) ? dbId : (unique !== null) ? this.dbIds.unique[unique] : this.dbIds.pDbId[pDbId];
		if (dbId) {
			let tempData = Object.assign({}, this.data[dbId]);
			await this.setDisabled(tempData.type, tempData.value, true); // Remove trigger from live strings.
			if (sUI && extSearchUI) extSearchUI.removeTrigger(this.triggers[dbId].count);
			this.fromPanda.delete(dbId); this.fromSearch.delete(dbId);
			delete this.options[dbId]; delete this.rules[dbId]; delete this.triggers[dbId];
			delete this.dbIds.pDbId[pDbId]; delete this.dbIds.values[`${tempData.type}:${tempData.value}:${sUI}`];
			if (removeDB) {
				MYDB.deleteFromDB('searching',_, dbId); MYDB.deleteFromDB('searching', 'rules', dbId);
				MYDB.deleteFromDB('searching', 'options', dbId); MYDB.deleteFromDB('searching', 'history', dbId, 'dbId');
			}
			if (this.searchGStats && this.searchGStats.isSearchOn() && this.liveCounter === 0 && this.termCounter === 0) this.stopSearching();
			myPanda.searchUIConnect(true);
		}
	}
	/** When a UI is closed then this method will remove any triggers added from that UI.
	 * @param  {bool} [sUI=true] - The UI that is being closed. */
	async originRemove(sUI=true) {
		let setName = (sUI) ? 'fromSearch' : 'fromPanda';
		for (const dbId of this[setName]) { await this.removeTrigger(dbId,_,_, sUI); }
		if (sUI) this.loaded = false;
	}
  /** Fetches the url for this search after timer class tells it to do so and handles mturk results.
	 * Can detect logged out, pre's and good search results.
   * @param  {object} objUrl	   - Url object        @param  {number} queueUnique - Queue Unique ID @param  {number} elapsed	 - Elapsed Time
	 * @param  {number} rId    		 - Requester ID      @param  {number} dbId 				- Database ID     @param  {string} [type=''] - Type for trigger
	 * @param  {string} [value=''] - Value for trigger @param  {bool} [sUI=true]		- From UI */
  async goFetch(objUrl, queueUnique, elapsed, rId, dbId, type='', value='', sUI=true, lookGid=null) {
		if (this.searchGStats) this.searchGStats.setSearchElapsed(elapsed); // Pass elapsed time to global search stats
		if (this.searchGStats && (rId === -1 || this.resultsBack)) {
			if (rId !== -1) this.resultsBack = false;
			if (this.dLog(4)) console.debug(`%cgoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
			let result = await super.goFetch(objUrl);
			if (!result) {
				if (this.dError(1)) { console.error('Returned fetch result was a null.', JSON.stringify(objUrl)); }
			} else if (this.searchGStats) {
				this.searchGStats.addTotalSearchFetched();
				if (!this.pausedPandaUI) myPanda.searchFetched();
				if (result.mode === "logged out" && queueUnique !== null) this.nowLoggedOff();
				else if (result.type === "ok.json") {
					if (result.mode === "pre") {
						this.searchGStats.addTotalSearchPRE(); // found a PRE while searching so increment search pre counter
					} else {
						this.searchGStats.addTotalSearchResults(result.data.total_num_results);
						let i = 0, thisItem = {}, hitPosId = null, tempString = '', tempNewHits = {}, rewardSort = {};
						do {
							thisItem = result.data.results[i++];
							// hitPosId represents a signature for this particular hit using creation time and hit set ID
							hitPosId = new Date(thisItem.creation_time).getTime() + "" +  thisItem.hit_set_id;
							tempString += `[[${hitPosId}]]`;
							if (!this.searchesString.includes(`[[${hitPosId}]]`)) {
								let dO = hitObject(thisItem.hit_set_id, thisItem.description, thisItem.title, thisItem.requester_id, thisItem.requester_name, thisItem.monetary_reward.amount_in_dollars, thisItem.assignable_hits_count, thisItem.assignment_duration_in_seconds, thisItem.latest_expiration_time);
								tempNewHits[dO.groupId] = dO; rewardSort[thisItem.monetary_reward.amount_in_dollars] = thisItem;
							}
						} while (i < result.data.results.length);
						let sortArray = Object.keys(rewardSort).sort((a,b) => b - a), started = true;
						for (const key of sortArray) { if (this.liveCounter || this.termCounter) started = this.checkTriggers(rewardSort[key], started); }
						myHistory.fillInHistory(tempNewHits, 'searchResults');
						this.searchesString = tempString + this.searchesString;
						this.searchesString = this.searchesString.substr(0,4700);
						thisItem = {}; tempString = ''; tempNewHits = {};
					}
				} else if (result.type === "ok.text") {
					let reactProps = $(result.data).find('.row.m-b-md div:eq(1)').data('react-props');
					if (reactProps) {
						let hitsData = reactProps.bodyData, rewardSort = {}, foundData = null;
						if (hitsData.length > 0) {
							for (const hit of hitsData) {
								if (!lookGid) rewardSort[hit.monetary_reward.amount_in_dollars] = hit;
								else if (lookGid === hit.hit_set_id) foundData = hit;
							}
							if (!lookGid) {
								let sortArray = Object.keys(rewardSort).sort((a,b) => b - a), requesterName = $(result.data).find('h1.m-b-md').text(), started = true;
								if (requesterName !== '') myPanda.updateReqName(_, requesterName, this.triggers[dbId].pDbId);
								for (const key of sortArray) { started = this.checkTriggers(rewardSort[key], started); }
							} else if (foundData) this.sendToPanda(foundData, dbId, lookGid);
						}
						hitsData = null;
					}
					searchTimer.deleteFromQueue(queueUnique); this.triggers[dbId].status = 'searching';
					this.setDisabled(type, value, false, sUI);
					if (!lookGid && !this.timerUnique) this.startSearching(dbId);
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
