/**
 * This class takes care of the panda jobs data. Also handles dealing with the database to get data.
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
		this.dbIds = {};												// Object of all dbId's with myId value for easy searching.
		this.pandaGroupIds = {};								// Object of all groupId's with unique ID value for easy searching.
		this.info = {};													// Object of panda info.
    this.pandaUrls = [];										// Array of panda objects for a panda with preview and accept links.
		this.pandaSkipped = [];									// List of all panda's being skipped because of limits.
		this.queueAdds = {};										// Object of panda accepted hits so it can limit number of accepts.
		this.queueResults = [];									// The real queue with hits from mturk.
		this.loggedOff = false;									// Are we logged off from mturk?
		this.authenticityToken = null;					// The authenticity token from mturk so hits can be returned.
		pandaTimer.setMyClass(this, true);			// Tell timer what class is using it so it can send information back.
		pandaTimer.setTimer(timer);         		// Set timer for this timer.
    pandaTimer.setHamTimer(hamTimer);   		// Set hamTimer for this timer.
		this.useDefault = false;								// Should we be using default values because no data in database?
		this.db = new DatabaseClass(this.dbName, 1);  // Set up the database class.
	}
	/**
	 * converts the unique database ID to the equivalent unique panda job ID.
	 * @param  {number} dbId - The unique database ID for a panda job.
	 * @return {number}			 - Returns the unique databse ID from a unique panda job ID.
	 */
	getMyId(dbId) { return this.dbIds[dbId]; }
	/**
	 * Creates a panda accept url for groupid.
	 * @param  {string} groupId - The groupId of the panda to creat a url.
	 * @return {string}					- Returns the created string.
	 */
	createPandaUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	/**
	 * Creates a preview url for groupid.
	 * @param  {string} groupId - The groupId of the panda to creat a url.
	 * @return {string}					- Returns the created string.
	 */
	createPreviewUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks`; }
  /**
	 * Open database or create it with all storage objects. This uses a promise so program will wait.
	 * @return {promise} - Resolves with the response and rejects with the error.
   */
  openDB() {
    return new Promise( (resolve, reject) => {
      this.db.openDB( false, (e) => {
        if (e.oldVersion == 0) { // Had no database so let's initialise it.
          e.target.result.createObjectStore(this.storeName, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("groupId", "groupId", {unique:false}); // GroupID is an index to search faster
          e.target.result.createObjectStore(this.tabsStore, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("position", "position", {unique:false}); // Position is an index to search faster
          e.target.result.createObjectStore(this.optionsStore, {keyPath:"category"});
					e.target.result.createObjectStore(this.alarmsStore, {keyPath:"id", autoIncrement:"true"})
						.createIndex("name", "name", {unique:false}); // Name is an index to search faster
					e.target.result.createObjectStore(this.groupingStore, {keyPath:"id", autoIncrement:"true"});
					this.useDefault = true; // If data initialized then let other classes know to use default values.
        }
      } ).then( response => resolve(response), rejected => console.error(rejected) );
    });
	}
	/**
	 * Loads data for this particular job with unique ID in the info object.
	 * If database rejected then give error on console and on page before stopping script.
	 * @param  {number} myId - The unique ID for a panda job.
	 */
	async getDbData(myId) {
		await this.db.getFromDB(this.storeName, this.info[myId].dbId)
		.then( r => { this.info[myId].data = r; },
			rejected => { extPandaUI.haltScript(rejected, 'Failed loading data from database for a panda so had to end script.', `Error getting data for ${myId} Error:`); }
		);
	}
	/**
	 * Adds data to the database and sets the id in info to the key resolved from database.
	 * If database rejected then give error on console and on page before stopping script.
	 * @param  {object} newData - The new data to be added to the database.
	 */
	async addToDB(newData) {
		await this.db.addToDB(this.storeName, newData).then( id => newData.id = id,
			rejected => { extPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); }
		);
	}
	/**
	 * Updates the data for this panda using the unique ID. Key should already be in the data object.
	 * If database rejected then give error on console and on page before stopping script.
	 * @param  {number} myId					 - The unique ID for a panda job.
	 * @param  {object} [newData=null] - Object to update panda with or use the data in the panda info object.
	 */
	async updateDbData(myId, newData=null) {
		await this.db.updateDB(this.storeName, (newData) ? newData : this.info[myId].data).then( id => newData.id = id,
			rejected => { extPandaUI.haltScript(rejected, 'Failed updating data to database for a panda so had to end script.', 'Error adding panda data. Error:'); }
		);
		if (this.dLog(3)) console.info(`%cUpdating data for ${myId}.`,CONSOLE_INFO);
	}
	/**
	 * Delete the panda data and stats with this unique ID from the databases.
	 * If database rejected then give an error message in the console and move on.
	 * @param  {number} myId - The unique ID for a panda job.
	 */
	async deleteDbData(myId) {
		extPandaUI.deleteFromStats(myId, this.info[myId].dbId);
		await this.db.deleteFromDB(this.storeName, this.info[myId].dbId).then( () => {},
			() => { if (this.dError(1)) console.error('Got an error while trying to delete a panda from database.'); }
		); // No need to halt script for trying to delete from database.
		if (this.dLog(3)) console.info(`%cDeleting panda ${myId} from Database.`,CONSOLE_INFO);
	}
	/**
	 * Load up data from the database for every panda added or add panda to the panda UI.
	 * @param  {bool} [addPanda=true] - Should the data be added to panda UI or just adding data to memory?
	 * @return {object}								- Returns rejected object on database error.
	 */
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
	/**
	 * This will remove all panda data from memory to save memory space.
	 */
	nullData() {
		for (let i=0, keys=Object.keys(this.info), len=keys.length; i<len; i++) { this.info[keys[i]].data = null; }
    if (this.dLog(3)) console.info('%cRemoving all data from memory.',CONSOLE_INFO);
	}
	/**
	 * Collects stats from timer and shows them on the panda UI.
	 * @param  {object} infoObj - The object with all the timer status.
	 */
	timerInfo(infoObj) {
		if (extPandaUI) {
			if (infoObj.goingHam!==null) extPandaUI.hamButtonOn(infoObj.myIdHam);
			else extPandaUI.hamButtonsOff();
			extPandaUI.collectingStatus(infoObj.running, infoObj.paused);
		}
	}
	/**
	 * Changes the time for the panda timer and returns the time saved.
	 * @param  {number} timer - The time to change the panda timer to.
	 * @return {number}				- Returns the panda timer time that was set.
	 */
	timerChange(timer) {
		return pandaTimer.setTimer(timer);
	}
	/**
	 * Tells panda timer to stop all jobs in queue.
	 */
	stopAll() { pandaTimer.stopAll(); }
	/**
	 * Toggle the panda timer pause status.
	 * @return {number} - Returns the status of the panda timer pause mode.
	 */
	pauseToggle() { return pandaTimer.pauseToggle(); }
	/**
	 * Remove all panda jobs usually because panda UI is closing.
	 * On database rejected it will send error to console and page before stopping script.
	 */
	async removeAll() {
		let err = await this.getAllPanda(false); // Add data into memory so it can be used to remove it from panda UI.
		if (!err) {
			while(this.pandaUniques.length) { const i = this.pandaUniques.shift(); this.removePanda(i, false); }
		}
	}
	/**
	 * Finds out if the panda timer is in go ham mode and returns status.
	 * @return {bool} - Returns true if timer is in ham mode.
	 */
	isTimerGoingHam() { return pandaTimer.goingHam; }
	/**
	 * Tell panda timer to go ham on this panda with the queue unique id and use the temporary ham duration.
	 * @param  {number} queueUnique - Unique number for the panda in timer queue.
	 * @param  {number} tGoHam			- The temporary duration for the goHam timer.
	 */
	timerGoHam(queueUnique, tGoHam) { pandaTimer.goHam(queueUnique, tGoHam) }
	/**
	 * Turn off the go ham in panda timer for this panda with the queue unique id.
	 * @param  {number} queueUnique - Unique number for the panda in timer queue.
	 */
	timerHamOff(queueUnique) { pandaTimer.hamOff(queueUnique); }
	/**
	 * Tell panda timer to reset the time started for the temporary duration.
	 * @param  {number} queueUnique - Unique number for the panda in timer queue.
	 */
	resetTimerStarted(queueUnique) { pandaTimer.resetTimeStarted(queueUnique); }
	/**
	 * Unpause the panda timer.
	 */
	unPauseTimer() { pandaTimer.paused = false; }
	/**
	 * When logged off this will pause the panda timer and let panda UI know it's logged off.
	 */
	nowLoggedOff() {
		pandaTimer.paused = true; this.loggedOff = true;
		if (extPandaUI) extPandaUI.nowLoggedOff();
	}
	/**
	 * When logged back in this will unpause the panda timer and let panda UI know it's logged back in.
	 */
	nowLoggedOn() {
		this.unPauseTimer(); this.loggedOff = false;
		if (extPandaUI) extPandaUI.nowLoggedOn();
	}
	/**
	 * Send the collection status and group ID for this panda to the search class.
	 * @param  {number} myId - The unique ID for a panda job.
	 * @param  {bool} status - The collection status of this panda.
	 */
	sendStatusToSearch(myId, status) {
		mySearch.pandaStatus(this.info[myId].data.groupId,status)
	}
	/**
	 * Starts collecting the panda with the unique ID and send info to the panda timer.
	 * @param  {number} myId				 - The unique ID for a panda job.
	 * @param  {bool} goHamStart		 - Go ham at start?
	 * @param  {number} tempDuration - Temporary duration for this job used for external panda adds.
	 * @param  {number} tempGoHam		 - Temporary go ham duration for this job used for external panda adds.
	 */
	async startCollecting(myId, goHamStart, tempDuration, tempGoHam) {
		await this.getDbData(myId);
		const info = this.info[myId];
		if (!this.checkIfLimited(myId,false, true)) { // If there was a limit to stop then don't add to queue.
			info.queueUnique = pandaTimer.addToQueue(myId, (timerUnique, elapsed, myId) => {
				this.goFetch(this.pandaUrls[myId].urlObj, timerUnique, elapsed, myId); // Do this function every cycle
			}, (myId) => {
				const info = this.info[myId];
				extPandaUI.stopCollecting(myId, null, false); // Do after when timer is removed from queue
				if (info.data.search!==null && (
						(info.data.once && extPandaUI.pandaStats[myId].accepted.value==0) || !info.data.once)) {
					extPandaUI.searchingNow(myId);
					mySearch.startSearching();
					let value = (info.data.search === "gid") ? info.data.groupId : info.data.reqId;
					mySearch.addTrigger(info.data.search, value, {"name":info.data.title, "duration":tempDuration, "once":info.data.once, "limitNumQueue":info.data.limitNumQueue, "limitTotalQueue":info.data.limitTotalQueue, "tempGoHam":tempGoHam, "disabled":false, "from":"pandaUI"});
				}
				this.info[myId].data = null;
			}, goHamStart, info.data.duration, tempDuration, tempGoHam, info.skipped);
			if (info.data.search!==null) extPandaUI.searchCollecting(myId); // mark panda as a search job collecting
			this.sendStatusToSearch(myId,true);
			if (info.data.autoGoHam) extPandaUI.startAutoGoHam(myId);
			if (this.dLog(3)) console.info(`%cStarting to collect ${myId}.`,CONSOLE_INFO);
		} else { extPandaUI.stopCollecting(myId); }
	}
	/**
	 * Stops collecting this panda with this unique ID.
	 * @param  {number} myId					 - The unique ID for a panda job.
	 * @param  {string} [whyStop=null] - Reason why collecting is stopping.
	 */
	stopCollecting(myId, whyStop=null) {
		let info = this.info[myId], queueUnique = info.queueUnique;
		pandaTimer.deleteFromQueue(queueUnique); // delete from queue if it still has a timer
		if (this.pandaSkipped.includes(myId)) this.pandaSkipped = this.pandaSkipped.filter( (value) => value !== myId );
		info.skipped = false;
		if (info.data.search!==null) {
			if (whyStop==="once" || whyStop==="acceptLimit" || whyStop==="manual") {
				let value = (info.data.search === "gid") ? info.data.groupId : info.data.reqId;
				mySearch.disableTrigger(info.data.search,value); // Mark this search trigger disabled on search page
				extPandaUI.searchDisabled(myId); // Mark this search job as disabled here
			}
		}
		this.sendStatusToSearch(myId,false); // Tell search page that this panda is not collecting
	}
	/**
	 * Add a panda to the panda UI and save to database if it wasn't saved before.
	 * @param  {object} dbInfo				- Data info for panda to add.
	 * @param  {number} hitsAvailable - Number of hits available to collect.
	 * @param  {bool} autoAdded				- Is this panda auto added by a script or manually?
	 * @param  {bool} [update=false]	- Should this panda be updated in database first?
	 * @param  {bool} [loaded=false]	- Was this panda loaded from database?
	 */
	async addPanda(dbInfo, hitsAvailable, autoAdded, update=false, loaded=false) {
		const myId = this.uniqueIndex++; // get the next unique ID for this new panda
		if (update) await this.updateDbData(null, dbInfo); // Updates panda if it was added by default.
    this.pandaUniques.push(myId); // put unique ID on the panda unique array
		if (this.pandaGroupIds.hasOwnProperty(dbInfo.groupId)) { this.pandaGroupIds[dbInfo.groupId].push(myId); }
		else this.pandaGroupIds[dbInfo.groupId] = [myId]; // if new group ID then create new panda Group ID with unique ID
		if (!dbInfo.hasOwnProperty("id")) await this.addToDB( dbInfo ); // Add to database if it has no database key.
		this.dbIds[dbInfo.id] = myId;
		this.info[myId] = {queueUnique:null, hitsAvailable:hitsAvailable, autoAdded:autoAdded, dbId:dbInfo.id, skipped:false, autoTGoHam:"off", data:dbInfo };
		const pandaUrl = this.createPandaUrl(dbInfo.groupId); // create the panda url for this panda
		this.pandaUrls[myId] = {preview: this.createPreviewUrl(dbInfo.groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json")}; // set up this panda list of urls with preview url too.
		extPandaUI.addPandaToUI(myId, this.info[myId], loaded);
	}
	/**
	 * Remove the panda with the unique ID and delete from database if necessary.
	 * @param  {number} myId	 - The unique ID for a panda job.
	 * @param  {bool} deleteDB - Should panda be deleted from database?
	 */
	async removePanda(myId, deleteDB) {
		this.stopCollecting(myId, null);
		const pandaInfo = this.info[myId], gId = pandaInfo.data.groupId;
		this.pandaUniques = arrayRemove(this.pandaUniques,myId);
		if (this.pandaGroupIds[gId].length > 1) { this.pandaGroupIds[gId] = arrayRemove(this.pandaGroupIds[gId],myId); }
		else delete this.pandaGroupIds[gId];
		if (pandaInfo.data.search!==null) {
			const value = (pandaInfo.data.search==="gid") ? pandaInfo.data.groupId : pandaInfo.data.reqId;
			mySearch.removeTrigger(pandaInfo.data.search, value);
		}
		if (deleteDB) await this.deleteDbData(myId);
		delete this.dbIds[pandaInfo.dbId];
		this.info[myId].data = null; delete this.info[myId]; delete this.pandaUrls[myId];
	}
	/**
	 * Changes the duration on the panda timer for panda with myid.
	 * @param  {number} myId		 - The unique ID for a panda job.
	 * @param  {number} duration - The new duration to be changed on the timer.
	 */
	timerDuration(myId) { pandaTimer.changeDuration(this.info[myId].queueUnique, this.info[myId].data.duration); }
	/**
	 * Gets data from mturk hit details and assigns them to the panda info object.
	 * @param  {object} details - Object with all the details from the hit.
	 * @param  {number} myId		- The unique ID for a panda job.
	 */
	parseHitDetails(details, myId) {
		let thisHit = this.info[myId];
		if (thisHit.data.limitNumQueue>0) 
			this.queueAdds[myId] = (this.queueAdds.hasOwnProperty(myId)) ? this.queueAdds[myId]+1 : 1;
		if (details.contactRequesterUrl!=="") {
			const regex = /assignment_id=([^&]*)&.*requester_id\%5D=([^&]*)&.*Type%29\+(.*)$/;
			let [all, assignId, reqId, groupId] = details.contactRequesterUrl.match(regex);
			thisHit.data.reqId = reqId; thisHit.data.groupId = groupId; thisHit.data.taskId = assignId;
		}
		thisHit.data.reqName = details.requesterName; thisHit.data.title = details.projectTitle;
		thisHit.data.description = details.description; thisHit.data.price = details.monetaryReward.amountInDollars;
		thisHit.hitsAvailable = details.assignableHitsCount; thisHit.data.assignedTime = details.assignmentDurationInSeconds;
		thisHit.data.expires = details.expirationTime; extPandaUI.pandaCard[myId].updateAllCardInfo(thisHit);
	}
	/**
	 * Checks if this panda has any limits and returns any relevant info.
	 * @param  {number} myId   - The unique ID for a panda job.
	 * @param  {bool} accepted - Was a hit accepted right now?
	 * @return {array}				 - Reason for stopping is first. If hit being skipped is second.
	 */
	checkIfLimited(myId, accepted) {
		const thisHit = this.info[myId]; let addedHits = 0, unskip=false, skipIt=false, stopIt=null;
		if (accepted && thisHit.data.once) stopIt = "once"; // Panda is limited to collecting only once so stop it.
		else if (accepted && thisHit.autoAdded && thisHit.hitsAvailable===1) stopIt = "oneHitAvailable";
		else if (accepted && thisHit.data.acceptLimit>0 && 
			thisHit.data.acceptLimit<=extPandaUI.pandaStats[myId].accepted.value) stopIt = "acceptLimit";
		else {
			if (accepted && this.queueAdds.hasOwnProperty(myId)) addedHits = this.queueAdds[myId];
			let hits = myQueue.totalResults(null, thisHit.data.groupId); // Get how many hits from this panda is in queue
			hits += ((accepted) ? addedHits : 0); // Add on the hits just accepted and may not be in queue yet
			if (thisHit.skipped) { // This panda is being skipped so check if it should be unskipped.
				if (thisHit.data.limitNumQueue>0 && hits<thisHit.data.limitNumQueue) unskip=true;
				if (thisHit.data.limitTotalQueue>0 && this.queueResults.length<thisHit.data.limitTotalQueue) unskip=true;
				else if (thisHit.data.limitTotalQueue>0) unskip=false;
				if (unskip) { // If panda doesn't need to be skipped anymore.
					extPandaUI.cardEffectPreviousColor(myId,false); // Go back to previous background color.
					pandaTimer.unSkipThis(thisHit.queueUnique); // Unskip this panda in timer.
					this.pandaSkipped = arrayRemove(this.pandaSkipped, myId); thisHit.skipped = false; // This hit not skipped
				}
			} else { // if panda not being skipped
				if (thisHit.data.limitNumQueue>0 && thisHit.data.limitNumQueue<=hits) skipIt=true;
				else if (thisHit.data.limitTotalQueue>0 && thisHit.data.limitTotalQueue<=this.queueResults.length) skipIt=true;
				if (skipIt) { // if panda needs to be skipped.
					console.log("checkIfLimited: delete " + thisHit.queueUnique);
					extPandaUI.cardEffectPreviousColor(myId, true, "#ffa691"); // Change color of panda background.
					pandaTimer.hamOff(thisHit.queueUnique); // Make sure go ham is off if this panda was going ham.
					this.pandaSkipped.push(myId); thisHit.skipped = true; // This hit skipped.
					pandaTimer.skipThis(thisHit.queueUnique); // Tell timer this panda is skipped.
				}
			}
		}
		if (stopIt!==null) { extPandaUI.stopItNow(myId,false,stopIt); } // Stop this panda if needs to be stopped by limits.
		return stopIt;
	}
	/**
	 * This method gets called when a new queue result from mturk was grabbed so variables can be updated.
	 * @param  {object} queueResults			- Object with all the jobs in mturk queue.
	 * @param  {string} authenticityToken - Token given by mturk so hits can be returned.
	 */
	gotNewQueue(queueResults, authenticityToken) {
		if (extPandaUI) { // Make sure there is a panda UI opened.
			if (this.loggedOff) this.nowLoggedOn(); // If mturk gave queue results then user is logged on.
			this.authenticityToken = authenticityToken;
			this.queueResults = queueResults;
			this.queueAdds = {};
			if (this.pandaSkipped.length) this.pandaSkipped.forEach( item => this.checkIfLimited(item,false) );
			extPandaUI.gotNewQueue(this.queueResults);
		}
	}
	/**
	 * Get the group id and requester id from the preview or accept url.
	 * @param  {string} url - The url to parse and return info from.
	 * @return {array}			- Group id is first in array. Requester Id is second in array.
	 */
	parsePandaUrl(url) {
		let groupId=null, reqId=null;
		const groupInfo = url.match(/\/projects\/([^\/]*)\/tasks[\/?]/);
		const requesterInfo = url.match(/\/requesters\/([^\/]*)\/projects[\/?]/);
		if (groupInfo) groupId = groupInfo[1];
		if (requesterInfo) reqId = requesterInfo[1];
		return [groupId, reqId];
	}
	/**
	 * Fetches the url for this panda after timer class tells it to do so and handles mturk results.
	 * Can detect logged out, pre's, max hits, no more hits, no qual, blocked and accepted a hit.
	 * @param  {object} objUrl			- Url object to use when fetching.
	 * @param  {number} queueUnique - Unique number for the job in timer queue.
	 * @param  {number} elapsed			- Exact time it took for the panda timer to do next queue job.
	 * @param  {number} myId				- The unique ID for a panda job.
	 */
	goFetch(objUrl, queueUnique, elapsed, myId) {
		extPandaUI.pandaGStats.setPandaElapsed(elapsed);
		if (this.dLog(4)) console.debug(`%cgoing to fetch ${JSON.stringify(objUrl)}`,CONSOLE_DEBUG);
		super.goFetch(objUrl).then(result => {
      if (!result) {
        if (this.dError(1)) { 
          console.error('Returned result from panda fetch was a null.', JSON.stringify(objUrl));
				}
			} else if (extPandaUI!==null && this.info[myId].data!==null) {
				extPandaUI.pandaStats[myId].addFetched(); extPandaUI.pandaGStats.addTotalPandaFetched();
				extPandaUI.highlightEffect_gid(myId);
				const savedData = this.info[myId].data; // Save data just in case it gets removed on stop.
				let stopped = this.checkIfLimited(myId, false);
				if (result.mode === "logged out" && queueUnique !== null) { this.nowLoggedOff(); }
				else if (result.mode === "pre") { extPandaUI.pandaGStats.addPandaPRE(); }
				else if (result.mode === "maxxedOut") { console.log("Maxxed out dude"); }
				else if (result.mode === "noMoreHits") { extPandaUI.pandaGStats.addTotalPandaNoMore(); extPandaUI.pandaStats[myId].addNoMore(); }
				else if (result.mode === "noQual" && stopped===null) { console.log("Not qualified"); extPandaUI.stopItNow(myId, true, stopped, "#DDA0DD"); }
				else if (result.mode === "blocked") { console.log("You are blocked"); extPandaUI.stopItNow(myId, true, stopped, "#575b6f"); }
				else if (result.mode === "notValid") { console.log("Group ID not found"); extPandaUI.stopItNow(myId, true, stopped, "#575b6f"); }
				else if (result.mode === "unknown") { console.log("unknown message: ",result.data.message); }
				else if (result.type === "ok.text" && result.url.includes("assignment_id=")) {
					extPandaUI.hitAccepted(myId, queueUnique, result, savedData);
				} else if (result.type === "ok.text") { console.log("captcha found"); globalOpt.resetCaptcha(); }
			}
		});
	}
	/**
	 * Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
	 * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}								- True if this error is permitted to show.
	 */
	dError(levelNumber) { return dError(levelNumber, 'MturkPanda'); }
	/**
	 * Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}								- True if this message is permitted to show.
	 */
	dLog(levelNumber) { return dLog(levelNumber, 'MturkPanda'); }
}
