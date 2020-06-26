/** This class takes care of the panda jobs data. Also handles dealing with the database to get data.
 * Uses a unique number for each panda added. Remembers each groupID added and the database key.
 * Allows multiple group ID's to be added if needed. Will handle the limit options for each panda.
 * If a panda is not collecting the data is removed from memory and loads data when needed.
 * When a panda is going to collect or get edited then the data will load back into memory.
 * @class MturkPanda
 * @extends MturkClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class MturkPanda extends MturkClass {
	/**
	 * @param {number} timer		- Time to use for the timer to get next panda.
	 * @param {number} hamTimer - Time to use for the ham timer.
	 */
	constructor(timer,hamTimer) {
		super();																// Run the super extended constructor first.
		this.dbName = "PandaCrazyMax";					// Name of the database used for all storage.
		this.storeName = "pandaStore"; 					// Name of the store to be used for panda jobs.
		this.tabsStore = "tabsStore";						// Name of the store for panda tabs.
		this.optionsStore = "optionsStore";			// Name of the store for options.
		this.groupingStore = "groupingStore";		// Name of the store for saving groupings.
		this.alarmsStore = "alarmsStore";				// Name of the store for saving user selected alarms.
		this.uniqueIndex = 0;										// unique number for a panda.
		this.pandaUniques = [];									// Array of all unique numbers being used now.
		this.searchesUniques = [];							// Array of all search jobs being used now.
		this.dbIds = {};												// Object of all dbId's with myId value for easy searching.
		this.pandaGroupIds = {};								// Object of all groupId's with unique ID value for easy searching.
		this.info = {};													// Object of panda info.
    this.pandaUrls = [];										// Array of panda objects for a panda with preview and accept links.
		this.pandaSkipped = [];									// List of all panda's being skipped because of limits.
		this.pandaSkippedData = {};							// List of all panda data which are being skipped.
		this.queueAdds = {};										// Object of panda accepted hits so it can limit number of accepts.
		this.loggedOff = false;									// Are we logged off from mturk?
		this.resultsBack = true;								// Jobs using limits need to know when results come back from Mturk.
		this.tempPaused = false;								// Used to pause timer if queue is maxxed or a mturk problem.
		this.skippedDoNext = false;							// Used when checking skipped jobs in a recursive function.
		this.authenticityToken = null;					// The authenticity token from mturk so hits can be returned.
		pandaTimer.setMyClass(this, true);			// Tell timer what class is using it so it can send information back.
		pandaTimer.setTimer(timer);         		// Set timer for this timer.
		pandaTimer.pleaseSendBack();         		// Set timer for this timer.
    pandaTimer.setHamTimer(hamTimer);   		// Set hamTimer for this timer.
		this.useDefault = false;								// Should we be using default values because no data in database?
		this.db = new DatabaseClass(this.dbName, 1);  // Set up the database class.
	}
	/** If logged off then returns true.
	 * @return {bool} - True if logged off. */
	isLoggedOff() { return this.loggedOff; }
	/** Converts the unique database ID to the equivalent unique panda job ID.
	 * @param  {number} dbId - The unique database ID for a panda job.
	 * @return {number}			 - Returns the unique databse ID from a unique panda job ID. */
	getMyId(dbId) { return this.dbIds[dbId]; }
	/** Creates a panda accept url for groupid.
	 * @param  {string} groupId - The groupId of the panda to creat a url.
	 * @return {string}					- Returns the created string. */
	createPandaUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	/** Creates a preview url for groupid.
	 * @param  {string} groupId - The groupId of the panda to creat a url.
	 * @return {string}					- Returns the created string. */
	createPreviewUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks`; }
	/** Tests if the database can be opened and has all the storage created.
	 * @return {bool} - True if database is all ready. */
	async testDB() {
		let result = this.db.testDB().then( () => { return true; }, () => {
			return this.openDB(true).then( () => { return true; }, rejected => { dbError = rejected; return false; });
		});
		return result;
	}
  /** Open database or create it with all storage objects. This uses a promise so program will wait.
	 * @return {Promise<response|Error>} - Resolves with the response and rejects with the error. */
  openDB(del=false) {
    return new Promise( (resolve, reject) => {
      this.db.openDB( del, (e) => { console.log('opened');
        if (e.oldVersion == 0) { // Had no database so let's initialise it.
          e.target.result.createObjectStore(this.storeName, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("groupId", "groupId", {unique:false});
          e.target.result.createObjectStore(this.tabsStore, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("position", "position", {unique:false});
          e.target.result.createObjectStore(this.optionsStore, {keyPath:"category"});
					e.target.result.createObjectStore(this.alarmsStore, {keyPath:"id", autoIncrement:"true"})
						.createIndex("name", "name", {unique:false});
					e.target.result.createObjectStore(this.groupingStore, {keyPath:"id", autoIncrement:"true"});
					this.useDefault = true; // If data initialized then let other classes know to use default values.
        }
      } ).then( response => resolve(response), rejected => { console.error(rejected); reject(rejected); });
    });
	}
	/** Loads data for this particular job with unique ID in the info object.
	 * If database rejected then give error on console and on page before stopping script.
	 * @async 							 - To wait to get the data from the database.
	 * @param  {number} myId - The unique ID for a panda job. */
	async getDbData(myId) {
		await this.db.getFromDB(this.storeName, this.info[myId].dbId)
		.then( r => { this.info[myId].data = r; },
			rejected => { extPandaUI.haltScript(rejected, 'Failed loading data from database for a panda so had to end script.', `Error getting data for ${myId} Error:`); }
		);
	}
	/** Adds data to the database and sets the id in info to the key resolved from database.
	 * If database rejected then give error on console and on page before stopping script.
	 * @async										- To wait for the adding of data in the database.
	 * @param  {object} newData - The new data to be added to the database. */
	async addToDB(newData) {
		await this.db.addToDB(this.storeName, newData).then( id => newData.id = id,
			rejected => { extPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); }
		);
	}
	/** Updates the data for this panda using the unique ID. Key should already be in the data object.
	 * If database rejected then give error on console and on page before stopping script.
	 * @async													 - To wait for the updating of data in the database
	 * @param  {number} myId					 - The unique ID for a panda job.
	 * @param  {object} [newData=null] - Object to update panda with or use the data in the panda info object. */
	async updateDbData(myId, newData=null) {
		await this.db.updateDB(this.storeName, (newData) ? newData : this.info[myId].data).then( id => newData.id = id,
			rejected => { extPandaUI.haltScript(rejected, 'Failed updating data to database for a panda so had to end script.', 'Error adding panda data. Error:'); }
		);
		const dbId = (newData) ? newData.id : this.info[myId].id;
		if (this.dLog(3)) console.info(`%cUpdating data for dbId: ${dbId}.`,CONSOLE_INFO);
	}
	/** Delete the panda data and stats with this unique ID from the databases.
	 * If database rejected then give an error message in the console and move on.
	 * @async								 - To wait for the deletion of data from the database.
	 * @param  {number} myId - The unique ID for a panda job. */
	async deleteDbData(myId) {
		extPandaUI.deleteFromStats(myId, this.info[myId].dbId);
		await this.db.deleteFromDB(this.storeName, this.info[myId].dbId).then( () => {},
			() => { if (this.dError(1)) console.error('Got an error while trying to delete a panda from database.'); });
		if (this.dLog(3)) console.info(`%cDeleting panda ${myId} from Database.`,CONSOLE_INFO);
	}
	/** Load up data from the database for every panda added or add panda to the panda UI.
	 * @async													- To wait for all the data to be loaded into memory.
	 * @param  {bool} [addPanda=true] - Should the data be added to panda UI or just adding data to memory?
	 * @return {object}								- Returns rejected object on database error. */
	async getAllPanda(addPanda=true) {
		let err = null;
		await this.db.getFromDB( this.storeName, null, true, (cursor) => { return cursor.value; }) // Return object
		.then( result => {
			result.forEach( (r) => {
				if (addPanda) extPandaUI.addPandaDB(r); // Add panda straight from the database info.
				else if (this.dbIds.hasOwnProperty(r.id)) this.info[this.dbIds[r.id]].data = r; // Add the data to memory
			});
		}, rejected => err = rejected );
    if (this.dLog(3)) console.info('%cGetting all data for panda\'s.',CONSOLE_INFO);
		return err;
	}
	/** This will remove all panda data from memory to save memory space. */
	nullData() {
		for (let i=0, keys=Object.keys(this.info), len=keys.length; i<len; i++) { this.info[keys[i]].data = null; }
    if (this.dLog(3)) console.info('%cRemoving all data from memory.',CONSOLE_INFO);
	}
	/** Collects stats from timer and shows them on the panda UI.
	 * @param  {object} infoObj - The object with all the timer status. */
	timerInfo(infoObj) {
		if (extPandaUI) {
			if (infoObj.goingHam!==null) extPandaUI.hamButtonOn(infoObj.myIdHam);
			else extPandaUI.hamButtonsOff();
			extPandaUI.collectingStatus(infoObj.running, infoObj.paused);
		}
	}
	/** Changes the time for the panda timer and returns the time saved.
	 * @param  {number} timer - The time to change the panda timer to.
	 * @return {number}				- Returns the panda timer time that was set. */
	timerChange(timer, add=0, del=0) {
		let newTimer = null;
		if (timer) newTimer = pandaTimer.setTimer(timer, true);
		else if (add>0) newTimer = pandaTimer.addToTimer(add);
		else if (del>0) newTimer = pandaTimer.delFromTimer(del);
		return newTimer
	}
	/** Changes the ham time for the panda timer and returns the ham time saved.
	 * @param  {number} timer - The time to change the ham timer to.
	 * @return {number}				- Returns the ham timer time that was set. */
	hamTimerChange(timer) { return pandaTimer.setHamTimer(timer); }
	/** Changes the time for the queue timer and returns the time saved.
	 * @param  {number} timer - The time to change the queue timer to.
	 * @return {number}				- Returns the queue timer time that was set. */
	queueTimerChange(timer) { return myQueue.timerChange(timer); }
	/** Tells panda timer to stop all jobs in queue. */
	stopAll() { pandaTimer.stopAll(); }
	/** Toggle the panda timer pause status.
	 * @return {number} - Returns the status of the panda timer pause mode. */
	pauseToggle() { return pandaTimer.pauseToggle(); }
	/** Remove all panda jobs usually because panda UI is closing.
	 * On database rejected it will send error to console and page before stopping script.
	 * @async - To wait for all the data to be added first before removing the jobs. */
	async removeAll() {
		let err = await this.getAllPanda(false); // Add data into memory so it can be used to remove it from panda UI.
		if (!err) {
			while(this.pandaUniques.length) { const i = this.pandaUniques.shift(); this.removePanda(i, false); }
		}
	}
	/** Finds out if the panda timer is in go ham mode and returns status.
	 * @return {bool} - Returns true if timer is in ham mode. */
	isTimerGoingHam() { return pandaTimer.goingHam; }
	/** Tell panda timer to go ham on this panda with the queue unique id and use the temporary ham duration.
	 * @param  {number} queueUnique   - Unique number for the panda in timer queue.
	 * @param  {number} [tGoHam=null] - The temporary duration for the goHam timer. */
	timerGoHam(queueUnique, tGoHam=null) { if (queueUnique) pandaTimer.goHam(queueUnique, tGoHam) }
	/** Turn off the go ham in panda timer for this panda with the queue unique id.
	 * @param  {number} queueUnique - Unique number for the panda in timer queue. */
	timerHamOff(queueUnique=null) { pandaTimer.hamOff(queueUnique); }
	/** Tell panda timer to reset the time started for the temporary duration.
	 * @param  {number} queueUnique - Unique number for the panda in timer queue. */
	resetTimerStarted(queueUnique) { pandaTimer.resetTimeStarted(queueUnique); }
	/** Unpause the panda timer. */
	unPauseTimer() { pandaTimer.paused = false; }
	/** When logged off this will pause the panda timer and let panda UI know it's logged off. */
	nowLoggedOff() {
		if (extPandaUI) extPandaUI.nowLoggedOff();
		pandaTimer.paused = true; this.loggedOff = true;
	}
	/** When logged back in this will unpause the panda timer and let panda UI know it's logged back in. */
	nowLoggedOn() {
		this.unPauseTimer(); this.loggedOff = false;
		if (extPandaUI) extPandaUI.nowLoggedOn();
	}
	/** Send the collection status and group ID for this panda to the search class.
	 * @param  {number} myId - The unique ID for a panda job.
	 * @param  {bool} status - The collection status of this panda. */
	sendStatusToSearch(myId, status) { mySearch.pandaStatus(this.info[myId].data.groupId, status) }
	/** Stop searching for all search jobs. */
	searchingStopped() {
		for (const unique of this.searchesUniques) { this.disableSearching(unique, null, null, false); }
	}
	/** Add search trigger to search class and tell panda UI that this hit is searching now.
	 * @sync													 - To wait for the getting of the data if data isn't loaded.
	 * @param  {number} myId					 - The unique number ID for this job.
	 * @param  {object} hitData=null	 - The data object for this job.
	 * @param  {number} tempDuration=0 - Temporary duration for this job to use when found new hit.
	 * @param  {number} tempGoHam=0		 - Temporary goHam duration for this job to use when found new hit. */
	async doSearching(myId, hitData=null, tempDuration=0, tempGoHam=0 ) {
		if (!hitData) { await this.getDbData(myId); hitData = this.info[myId].data; }
		mySearch.addTrigger(hitData.search, {'name':hitData.title, 'rid':hitData.reqId, 'gid':hitData.groupId, 'duration':tempDuration, 'once':hitData.once, 'limitNumQueue':hitData.limitNumQueue, 'limitTotalQueue':hitData.limitTotalQueue, 'limitFetches':hitData.limitFetches, 'autoGoHam':false, goHamDuration:0, 'tempGoHam':tempGoHam, 'disabled':false, 'from':'pandaUI', 'myId':myId});
		if (extPandaUI) extPandaUI.searchingNow(myId);
	}
	/** Disables this search job as disabled on the panda UI and in the search class if needed.
	 * @param  {number} myId							- The unique number ID for this job.
	 * @param  {object} info=null					- The info object for this job.
	 * @param  {object} hitData=null			- The data object for this job.
	 * @param  {bool} disableTrigger=true - Should trigger be disabled in search class too? */
	disableSearching(myId, info=null, hitData=null, disableTrigger=true) {
		info = (info) ? info : this.info[myId]; hitData = (hitData) ? hitData : info.data;
		if (disableTrigger) {
			let value = (info.search === 'gid') ? hitData.groupId : hitData.reqId;
			mySearch.disableTrigger(info.search, value);
		}
		if (extPandaUI) extPandaUI.searchDisabled(myId); // Mark this search job as disabled here
	}
	checkSearches(gid) {
		console.log(this.pandaGroupIds.hasOwnProperty(gid));
		for (const searcher of this.searchesUniques) {
			//if 
		}
	}
	/** Starts collecting the panda with the unique ID and send info to the panda timer.
	 * @async												 - To wait for the data to be loaded for this job.
	 * @param  {number} myId				 - The unique ID for a panda job.
	 * @param  {bool} goHamStart		 - Go ham at start?
	 * @param  {number} tempDuration - Temporary duration for this job used for external panda adds.
	 * @param  {number} tempGoHam		 - Temporary go ham duration for this job used for external panda adds.
	 * @return {bool}								 - True if collection has started. */
	async startCollecting(myId, goHamStart, tempDuration, tempGoHam) {
		await this.getDbData(myId);
		const info = this.info[myId];
		const stopReason = this.checkIfLimited(myId, false, true);
		if (stopReason === null) { // If there was a limit to stop then don't add to queue.
			info.queueUnique = pandaTimer.addToQueue(myId, (timerUnique, elapsed, myId) => {
				this.goFetch(this.pandaUrls[myId].urlObj, timerUnique, elapsed, myId); // Do this function every cycle
			}, async (myId) => {
				const info = this.info[myId], hitData = Object.assign({}, info.data);
				await extPandaUI.stopCollecting(myId, null, false); // Do after when timer is removed from queue
				if (info.search!==null && (
						(hitData.once && extPandaUI.pandaStats[myId].accepted.value==0) || !hitData.once)) {
					extPandaUI.searchingNow(myId);
					mySearch.addTrigger(info.search, {'name':hitData.title, 'rid':hitData.reqId, 'gid':hitData.groupId, 'duration':tempDuration, 'once':hitData.once, 'limitNumQueue':hitData.limitNumQueue, 'limitTotalQueue':hitData.limitTotalQueue, 'limitFetches':hitData.limitFetches, 'autoGoHam':false, goHamDuration:0, 'tempGoHam':tempGoHam, 'disabled':false, 'from':'pandaUI', 'myId':myId});
				} else this.info[myId].data = null;
			}, goHamStart, info.data.duration, tempDuration, tempGoHam, info.skipped);
			if (info.search!==null) extPandaUI.searchCollecting(myId); // mark panda as a search job collecting
			this.sendStatusToSearch(myId,true);
			if (info.data.autoGoHam) extPandaUI.startAutoGoHam(myId);
			if (this.dLog(3)) console.info(`%cStarting to collect ${myId}.`,CONSOLE_INFO);
			return true;
		} else {
			if (this.dLog(2)) console.info(`%cStopping. Limit reached. Reason: ${stopReason} on ${myId}.`,CONSOLE_WARN);
			extPandaUI.stopCollecting(myId);
			return false;
		}
	}
	/** Stops collecting this panda with this unique ID.
	 * @param  {number} myId					 - The unique ID for a panda job.
	 * @param  {string} [whyStop=null] - Reason why collecting is stopping. */
	stopCollecting(myId, hitData, whyStop=null) {
		let info = this.info[myId], queueUnique = info.queueUnique;
		pandaTimer.deleteFromQueue(queueUnique); // delete from queue if it still has a timer
		if (info.search!==null) {
			if (["once","Daily Accept Limit","Fetched Limit","manual","noQual","blocked"].includes(whyStop)) {
				this.disableSearching(myId, info, hitData);
			}
		}
		this.sendStatusToSearch(myId,false); // Tell search page that this panda is not collecting.
	}
	/** Add a panda to the panda UI and save to database if it wasn't saved before.
	 * @async													- To wait for the process of adding data to the database.
	 * @param  {object} dbInfo				- Data info for panda to add.
	 * @param  {number} hitsAvailable - Number of hits available to collect.
	 * @param  {bool} autoAdded				- Is this panda auto added by a script or manually?
	 * @param  {object} passInfo			- Information being passed to next method in pandaUI.
	 * @param  {bool} [update=false]	- Should this panda be updated in database first?
	 * @param  {bool} [loaded=false]	- Was this panda loaded from database? */
	async addPanda(dbInfo, hitsAvailable, autoAdded, passInfo, update=false, loaded=false) {
		const myId = this.uniqueIndex++; // get the next unique ID for this new panda
		if (update) await this.updateDbData(null, dbInfo); // Updates panda if it was added by default.
		this.pandaUniques.push(myId); // put unique ID on the panda unique array
		if (dbInfo.groupId.charAt(0).toUpperCase() !== 'A') {
			if (this.pandaGroupIds.hasOwnProperty(dbInfo.groupId)) { this.pandaGroupIds[dbInfo.groupId].push(myId); }
			else this.pandaGroupIds[dbInfo.groupId] = [myId];
		}
		if (!dbInfo.hasOwnProperty("id")) await this.addToDB( dbInfo ); // Add to database if it has no database key.
		this.dbIds[dbInfo.id] = myId;
		this.info[myId] = {queueUnique:null, hitsAvailable:hitsAvailable, autoAdded:autoAdded, dbId:dbInfo.id, skipped:false, autoTGoHam:"off", data:dbInfo, lastTime:null, lastElapsed:0, search:dbInfo.search };
		if (dbInfo.search) this.searchesUniques.push(myId);
		const pandaUrl = this.createPandaUrl(dbInfo.groupId); // create the panda url for this panda
		this.pandaUrls[myId] = {preview: this.createPreviewUrl(dbInfo.groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json")}; // set up this panda list of urls with preview url too.
		if (!loaded) extPandaUI.addPandaToUI(myId, this.info[myId], passInfo, loaded);
	}
	/** Remove the panda with the unique ID and delete from database if necessary.
	 * @async									 - To wait for the complete deletion of the job from the database.
	 * @param  {number} myId	 - The unique ID for a panda job.
	 * @param  {bool} deleteDB - Should panda be deleted from database? */
	async removePanda(myId, deleteDB) {
		const hitInfo = this.info[myId], hitData = Object.assign({}, hitInfo.data), gId = hitData.groupId;
		this.stopCollecting(myId, hitData, null);
		this.pandaUniques = arrayRemove(this.pandaUniques,myId);
		if (hitInfo.search) this.searchesUniques = arrayRemove(this.searchesUniques,myId);
		if (this.pandaGroupIds.hasOwnProperty(gId)) {
			if (this.pandaGroupIds[gId].length > 1) this.pandaGroupIds[gId] = arrayRemove(this.pandaGroupIds[gId], myId);
			else delete this.pandaGroupIds[gId];
		}
		if (hitInfo.search!==null) {
			const value = (hitInfo.search==="gid") ? gId : hitData.reqId;
			mySearch.removeTrigger(hitInfo.search, value);
		}
		if (deleteDB) this.deleteDbData(myId);
		delete this.dbIds[hitInfo.dbId];
		this.info[myId].data = null; delete this.info[myId]; delete this.pandaUrls[myId];
	}
	/** Changes the duration on the panda timer for panda with myid.
	 * @param  {number} myId		 - The unique ID for a panda job. */
	timerDuration(myId) { pandaTimer.changeDuration(this.info[myId].queueUnique, this.info[myId].data.duration); }
	/** Gets data from mturk hit details and assigns them to the panda info object.
	 * @param  {object} details - Object with all the details from the hit.
	 * @param  {number} myId		- The unique ID for a panda job.
	 * @return {string}					- Returns the assignment ID for hit. */
	parseHitDetails(details, myId) {
		let thisHit = this.info[myId], assignment_id="";
		if (thisHit.data.limitNumQueue>0) 
			this.queueAdds[myId] = (this.queueAdds.hasOwnProperty(myId)) ? this.queueAdds[myId]+1 : 1;
		if (details.contactRequesterUrl!=="") {
			const regex = /assignment_id=([^&]*)&.*requester_id\%5D=([^&]*)&.*Type%29\+(.*)$/;
			let [all, assignId, reqId, groupId] = details.contactRequesterUrl.match(regex);
			thisHit.data.reqId = reqId; thisHit.data.groupId = groupId; assignment_id = assignId;
		}
		thisHit.data.reqName = details.requesterName; thisHit.data.title = details.projectTitle;
		thisHit.data.description = details.description; thisHit.data.price = details.monetaryReward.amountInDollars;
		thisHit.hitsAvailable = details.assignableHitsCount; thisHit.data.assignedTime = details.assignmentDurationInSeconds;
		thisHit.data.expires = details.expirationTime; extPandaUI.pandaCard[myId].updateAllCardInfo(thisHit);
		this.updateDbData(null, thisHit.data);
		return assignment_id;
	}
	/** Updates the requester name of this hit in the database.
	 * @async										- To wait for the data to be loaded from database if needed.
	 * @param  {number} myId 		- The unique ID for this job.
	 * @param  {string} reqName - The new name of this requester. */
	async updateReqName(myId, reqName) {
		const info = this.info[myId];
		if (info.data !== null) await this.getDbData(myId);
		info.data.reqName = reqName;
		extPandaUI.pandaCard[myId].updateAllCardInfo(info);
		this.updateDbData(null, info.data);
	}
	/** If there is a queue limit for this hit with the unique ID then skip it.
	 * @param  {number} myId - The unique ID for this job.
	 * @return {bool} 			 - True if there is a number hit or total queue limit. */
	checkQueueLimit(myId) {
		const thisHit = this.info[myId];
		if (!thisHit.skipped) {
			const data = thisHit.data, hits = myQueue.totalResults(null, data.groupId);
			let skipIt='';
			if (data.limitNumQueue>0 && data.limitNumQueue<=hits) skipIt='hit queue limit.';
			if (data.limitTotalQueue>0 && data.limitTotalQueue<=extPandaUI.getQueueTotal() ) skipIt='queue total limit.';
			if (skipIt !== '') {
				extPandaUI.cardEffectPreviousColor(myId, true, "#ffa691");
				pandaTimer.hamOff(thisHit.queueUnique); // Make sure go ham is off if this panda was going ham.
				this.pandaSkipped.push(myId); thisHit.skipped = true;
				this.pandaSkippedData[myId] = Object.assign({}, thisHit.data);
				pandaTimer.skipThis(thisHit.queueUnique);
				extPandaUI.pandaCard[myId].collectTipChange(`<br><strong>Skipping because ${skipIt}</strong>`, true);
				return true;
			} else return false;
		} else return true;
	}
	/** If this hit with unique ID was being skipped then check if it should be unskipped.
	 * @param  {number} myId    			 - The unique ID for this job.
	 * @param  {object} [newData=null] - Data object if needed. Only used when user changes job options.
	 * @return {bool}				   				 - True if this hit is being unskipped now. */
	checkSkipped(myId, newData=null) {
		if (newData) this.pandaSkippedData[myId] = newData;
		const thisHit = this.info[myId], data = this.pandaSkippedData[myId];
		const hits = myQueue.totalResults(null, data.groupId);
		let unskip = true;
		if (data.limitTotalQueue > 0 && extPandaUI.getQueueTotal() >= data.limitTotalQueue) unskip = false;
		if (unskip && data.limitNumQueue > 0 && hits >= data.limitNumQueue) unskip=false;
		if (unskip) {
			extPandaUI.cardEffectPreviousColor(myId,false);
			pandaTimer.unSkipThis(thisHit.queueUnique); // Unskip this panda in timer.
			if (this.pandaSkipped.includes(myId)) {
				this.pandaSkipped = arrayRemove(this.pandaSkipped, myId);
				delete this.pandaSkippedData[myId];
			}
			thisHit.skipped = false; // This hit not skipped
			extPandaUI.pandaCard[myId].collectTipChange('');
			if (!extPandaUI.pandaStats[myId].collecting) thisHit.data = null;
			return true;
		} else return false;
}
	/** Checks if this panda has any limits and returns any relevant info.
	 * @param  {number} myId   - The unique ID for a panda job.
	 * @param  {bool} accepted - Was a hit accepted right now?
	 * @return {string}				 - Reason for stopping as a string or null if not stopped. */
	checkIfLimited(myId, accepted) {
		const thisHit = this.info[myId], data = thisHit.data, totalInQueue = extPandaUI.getQueueTotal();
		let addedHits = 0, unskip=false, skipIt=false, stopIt=null;
		const hits = myQueue.totalResults(null, data.groupId), stats = extPandaUI.pandaStats[myId];
		if (data.limitFetches===undefined) { data.limitFetches = 0; this.updateDbData(null, data); }
		if (accepted && data.once) stopIt = "once"; // Panda is limited to collecting only once so stop it.
		else if (accepted && thisHit.autoAdded && thisHit.hitsAvailable===1) stopIt = "One Hit Available";
		else if (data.acceptLimit>0 && data.acceptLimit<=stats.getDailyAccepted()) stopIt = "Daily Accept Limit";
		else if (data.limitFetches>0 && data.limitFetches<=stats.getFetchedSession()) stopIt = "Fetched Limit";
		else {
			if (accepted && this.queueAdds.hasOwnProperty(myId)) addedHits = this.queueAdds[myId];
			let hits = myQueue.totalResults(null, data.groupId); // Get how many hits from this panda is in queue
			hits += ((accepted) ? addedHits : 0); // Add on the hits just accepted and may not be in queue yet
			if (thisHit.skipped) unskip = this.checkSkipped(myId);
			else skipIt = this.checkQueueLimit(myId);
		}
		if (stopIt!==null) {
			extPandaUI.stopItNow(myId, false, stopIt);
			extPandaUI.pandaCard[myId].collectTipChange(`<br><strong>Stopped for ${stopIt}</strong>`, true);
		}
		return stopIt;
	}
	/** Sends the panda job info and the hit details from mturk to the queue class so the queue is updated.
	 * @param  {object} pandaInfo	 - The panda job info that just got a hit accepted.
	 * @param  {object} hitDetails - The details from mturk about the hit that was accepted. */
	queueAddAccepted(pandaInfo, hitDetails) { myQueue.addAccepted(pandaInfo, hitDetails); }
	/** This method gets called when a new queue result from mturk was grabbed so variables can be updated.
	 * @param  {object} queueResults			- Object with all the jobs in mturk queue.
	 * @param  {string} authenticityToken - Token given by mturk so hits can be returned. */
	gotNewQueue(queueResults, authenticityToken) {
		if (extPandaUI) { // Make sure there is a panda UI opened.
			if (this.loggedOff) this.nowLoggedOn(); // If mturk gave queue results then user is logged on.
			this.authenticityToken = authenticityToken; this.queueAdds = {};
			extPandaUI.gotNewQueue(queueResults);
		}
	}
	/** When something new is in queue then check skipped hits to see if they can be unskipped. */
	doNewChecks() {
		if (this.pandaSkipped.length && !this.skippedDoNext) goNext(0, this.pandaSkipped.length, this);
		if (this.tempPaused && extPandaUI.getQueueTotal() < 25) {
			pandaTimer.paused = false; this.tempPaused = false;
		}
		/** Recursion function which checks the first hit in skipped array and then places it back in array
		 * if it needs to skip again. Uses a timeout to call the function again for each hit in skipped array.
		 * @param  {number} count    - The current counter for next skipped hit to check.
		 * @param  {number} length   - The length of the skipped hit array to limit recursion. */
		function goNext(count, length) {
			if (count<length) {
				const nextSkipped = myPanda.pandaSkipped.shift();
				myPanda.skippedDoNext = true;
				if (!myPanda.checkSkipped(nextSkipped)) myPanda.pandaSkipped.push(nextSkipped);
				if (myPanda.pandaSkipped.length>0) setTimeout( goNext, 200, ++count, length );
				else { myPanda.skippedDoNext = false; delete myPanda.pandaSkippedData[nextSkipped]; }
			} else { myPanda.skippedDoNext = false; }
		}
}
	/** Get the group id and requester id from the preview or accept url.
	 * @param  {string} url - The url to parse and return info from.
	 * @return {array}			- Group id is first in array. Requester Id is second in array. */
	parsePandaUrl(url) {
		let groupId=null, reqId=null;
		const groupInfo = url.match(/\/projects\/([^\/]*)\/tasks[\/?]([^\/?]*)/);
		const requesterInfo = url.match(/\/requesters\/([^\/]*)\/projects(\/|\?|$)/);
		if (groupInfo) groupId = groupInfo[1];
		if (requesterInfo) reqId = requesterInfo[1];
		return [groupId, reqId];
	}
	/** Fetches the url for this panda after timer class tells it to do so and handles mturk results.
	 * Can detect logged out, pre's, max hits, no more hits, no qual, blocked and accepted a hit.
	 * @async												- To wait for the fetch to get back the result from url.
	 * @param  {object} objUrl			- Url object to use when fetching.
	 * @param  {number} queueUnique - Unique number for the job in timer queue.
	 * @param  {number} elapsed			- Exact time it took for the panda timer to do next queue job.
	 * @param  {number} myId				- The unique ID for a panda job. */
	async goFetch(objUrl, queueUnique, elapsed, myId) {
		extPandaUI.pandaGStats.setPandaElapsed(elapsed);
		const hitInfo = this.info[myId];
		/** If this job has accepted or queue limit then be sure it received last fetch results. */
		let resultsBack = true;
		if ((hitInfo.data.once || hitInfo.data.limitTotalQueue>0 || hitInfo.data.limitNumQueue>0) && !this.resultsBack) resultsBack = false;
		if (!this.checkQueueLimit(myId) && resultsBack) {
			this.resultsBack = false;
			if (this.dLog(4)) console.debug(`%cgoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
			const result = await super.goFetch(objUrl);
			if (!result) {
				if (this.dError(1)) { console.error('Result from panda fetch was a null.', JSON.stringify(objUrl)); }
			} else if (extPandaUI!==null && hitInfo.data!==null) {
				const dateNow = new Date();
				hitInfo.lastElapsed = (hitInfo.lastTime) ? dateNow - hitInfo.lastTime : 0;
				hitInfo.lastTime = dateNow;
				extPandaUI.pandaStats[myId].addFetched(); extPandaUI.pandaGStats.addTotalPandaFetched();
				extPandaUI.highlightEffect_gid(myId);
				if (result.type === "ok.text" && result.url.includes("assignment_id=")) {
					extPandaUI.hitAccepted(myId, queueUnique, result);
				} else {
					const stopped = this.checkIfLimited(myId, false);
					if (result.mode === "logged out" && queueUnique !== null) { this.nowLoggedOff(); }
					else if (result.mode === "pre") {
						extPandaUI.pandaGStats.addPandaPRE();
					} else if (result.mode === "mturkLimit") {
						console.log("Mturk limit reached"); this.tempPaused = true; pandaTimer.paused = true;
						extPandaUI.mturkLimit();
					} else if (result.mode === "maxxedOut") {
						console.log("Maxxed out dude"); this.tempPaused = true; pandaTimer.paused = true;
					} else if (result.mode === "noMoreHits") {
						extPandaUI.pandaGStats.addTotalPandaNoMore(); extPandaUI.pandaStats[myId].addNoMore();
					} else if (result.mode === "noQual" && stopped===null) {
						console.log("Not qualified"); extPandaUI.stopItNow(myId, true, "noQual", "#DDA0DD");
					} else if (result.mode === "blocked") {
						console.log("You are blocked"); extPandaUI.stopItNow(myId, true, "blocked", "#575b6f");
					} else if (result.mode === "notValid") {
						console.log("Group ID not found"); extPandaUI.stopItNow(myId, true, "notValid", "#575b6f");
					} else if (result.mode === "unknown") {
						console.log("unknown message: ",result.data.message);
					} else if (result.mode === "cookies.large") {
						console.log("cookie large problem"); this.tempPaused = true; pandaTimer.paused = true;
					} else if (result.type === "ok.text") {
						extPandaUI.soundAlarm('Captcha'); extPandaUI.captchaAlert();
						console.log("captcha found"); globalOpt.resetCaptcha();
					}
				}
				extPandaUI.updateLogStatus(myId, hitInfo.lastElapsed);
			}
			this.resultsBack = true;
		} else if (!resultsBack) {
			if (this.dLog(2)) console.debug(`%cNo results from last fetch for job only accepting one hit.`,CONSOLE_WARN);
		}
}
	/** Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
	 * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}								- True if this error is permitted to show. */
	dError(levelNumber) { return dError(levelNumber, 'MturkPanda'); }
	/** Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}								- True if this message is permitted to show. */
	dLog(levelNumber) { return dLog(levelNumber, 'MturkPanda'); }
}
