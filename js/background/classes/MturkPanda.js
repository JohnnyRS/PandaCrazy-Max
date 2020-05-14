class MturkPanda extends MturkClass {
	constructor(timer,hamTimer) {
		super();
		this.dbName = "PandaCrazyMax";
    this.storeName = "pandaStore"; 						// Name of the store to be used for panda jobs
    this.tabsStore = "tabsStore";							// Name of the store for panda tabs
    this.optionsStore = "optionsStore";				// Name of the store for options
    this.groupingStore = "groupingStore";			// Name of the store for saving groupings
    this.alarmsStore = "alarmsStore";					// Name of the store for saving user selected alarms
    this.uniqueIndex = 0;											// unique number for a panda
		this.pandaUniques = [];										// Array of all unique numbers being used now
		this.dbIds = {};											// Object of all dbId's for easy searching
		this.pandaGroupIds = {};						// Object of all groupId's for easy searching
		this.info = {};											// Object of panda info
    this.pandaUrls = [];								// Array of panda objects for a panda with preview and accept links
		this.pandaSkipped = [];							// List of all panda's being skipped because of limits
		this.queueAdds = {};								// Object of panda accepted hits so it can limit number of accepts
		this.queueResults = [];							// The real queue with hits from mturk
		this.loggedOff = false;							// Are we logged off from mturk?
		this.authenticityToken = null;			// The authenticity token from mturk so hits can be returned from queue
		pandaTimer.setMyClass(this);				// Tell timer what class is using it so it can send information back
		pandaTimer.setTimer(timer);         // Set timer for this timer
    pandaTimer.setHamTimer(hamTimer);   // Set hamTimer for this timer
    this.db = new DatabaseClass(this.dbName, 1); //
	}
	createPandaUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	createPreviewUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks`; }
  openDB() { // Open or create database in the background first.
    return new Promise( (resolve, reject) => { // using a promise to make opening database synchronous so it waits
      this.db.openDB( false, (e) => {
        if (e.oldVersion == 0) { // Had no database so let's initialise it.
          e.target.result.createObjectStore(this.storeName, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("groupId", "groupId", {unique:false}); // groupID is an index to search faster
          e.target.result.createObjectStore(this.tabsStore, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("position", "position", {unique:false}); // position is an index to search faster
          e.target.result.createObjectStore(this.optionsStore, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("category", "category", {unique:false}); // category is an index to search faster
					e.target.result.createObjectStore(this.alarmsStore, {keyPath:"id", autoIncrement:"true"})
						.createIndex("name", "name", {unique:false}); // category is an index to search faster
					e.target.result.createObjectStore(this.groupingStore, {keyPath:"id", autoIncrement:"true"});
        }
      } ).then( response => resolve(response) ).catch( error => reject(error) );
    });
	}
	getDbData(myId, doThis) {
		this.db.getFromDB(this.storeName, "get", this.info[myId].dbId).then( (r) => { doThis.apply(this, [r]); });
	}
	updateDbData(myId, newData=null) {
		this.db.updateDB(this.storeName, (newData) ? newData : this.info[myId].data, this.info[myId].dbId);
	}
	deleteDbData(myId) {
		extPandaUI.deleteFromStats(myId, this.info[myId].dbId);
		this.db.deleteFromDB(this.storeName, this.info[myId].dbId);
	}
	getAllPanda(afterFunc, addPanda=true) {
		this.db.getFromDB( this.storeName, "cursor", null, (cursor) => { return cursor.value; })
			.then( result => {
				result.forEach( (r) => {
					if (addPanda) extPandaUI.addPandaDB(r); // Add panda straight from the database info.
					else if (this.dbIds[r.id]) this.info[this.dbIds[r.id]].data = r; // Add the data to memory info
				});
				afterFunc.apply(this);
			})
			.catch( error => console.log(error.message) );
	}
	timerInfo(infoObj) {
		if (extPandaUI) {
			if (infoObj.goingHam!==null) extPandaUI.hamButtonOn(infoObj.myIdHam);
			else extPandaUI.hamButtonsOff();
			extPandaUI.collectingStatus(infoObj.running, infoObj.paused);
		}
	}
	timerChange(timer) {
		let returnValue = pandaTimer.setTimer(timer); if (returnValue) this.timer = returnValue; return returnValue;
	}
	stopAll() { pandaTimer.stopAll(); }
	pauseToggle() { return pandaTimer.pauseToggle(); }
	removeAll() {
		this.getAllPanda(() => {
			this.pandaUniques.forEach( key => { this.stopCollecting(key, null); });
		}, false);
	}
	isTimerGoingHam() { pandaTimer.isHamOn(); }
	timerGoHam(queueUnique, tGoHam) { pandaTimer.goHam(queueUnique, tGoHam) }
	timerHamOff(queueUnique) { pandaTimer.hamOff(queueUnique); }
	resetTimerStarted(queueUnique) { pandaTimer.resetTimeStarted(queueUnique); }
	unPauseTimer() { pandaTimer.unPauseTimer(); }
	nowLoggedOff() {
		pandaTimer.pauseTimer(); this.loggedOff = true;
		if (extPandaUI) extPandaUI.nowLoggedOff();
	}
	nowLoggedOn() {
		this.unPauseTimer(); this.loggedOff = false;
		if (extPandaUI) extPandaUI.nowLoggedOn();
	}
	sendStatusToSearch(myId,status) {
		mySearch.pandaStatus(this.info[myId].data.groupId,status)
	}
	startCollecting(myId, goHamStart, tempDuration, tempGoHam) {
		this.db.getFromDB(this.storeName, "get", this.info[myId].dbId).then( (r) => {
			const info = this.info[myId]; info.data = r; // bring in data from database before starting to collect
			console.log(JSON.stringify(info));
			const limits = this.checkIfLimited(myId,false, true); // Check if there are any limits for this panda
			if (limits.stopped===null) { // If there was a limit to stop then don't add to queue.
				info.queueUnique = pandaTimer.addToQueue(myId, this, (timerUnique, elapsed, myId) => {
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
				}, goHamStart, info.data.duration, tempDuration, tempGoHam, limits.skipped);
				if (info.data.search!==null) extPandaUI.searchCollecting(myId); // mark panda as a search job collecting
				this.sendStatusToSearch(myId,true);
				if (info.data.autoGoHam) extPandaUI.startAutoGoHam(myId);
			} else { extPandaUI.stopCollecting(myId); }
		});
	}
	stopCollecting(myId, whyStop=null) {
		// myId = unique id of job, whyStop = Stopping for only once, limit accepted or manual stopped.
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
	addToDB(info, afterFunc, myId, hitsAvailable, autoAdded) {
  	this.db.addToDB( this.storeName, info )
        .then( id => { info.id = id; afterFunc.apply(this,[info, myId, hitsAvailable, autoAdded]); } )
				.catch( error => { console.log(error.message); } );
	}
	addPandaData(dbInfo, myId, hitsAvailable, autoAdded, loaded=false) {
		this.dbIds[dbInfo.id] = myId;
		this.info[myId] = {queueUnique:null, hitsAvailable:hitsAvailable, autoAdded:autoAdded, dbId:dbInfo.id, skipped:false, autoTGoHam:"off", data:dbInfo };
		const pandaUrl = this.createPandaUrl(dbInfo.groupId); // create the panda url for this panda
		this.pandaUrls[myId] = {preview: this.createPreviewUrl(dbInfo.groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json")}; // set up this panda list of urls with preview url too.
		extPandaUI.addPandaToUI(myId, this.info[myId], loaded);
	}
	addPanda(dbInfo, hitsAvailable, autoAdded) {
		const myId = this.uniqueIndex++; // get the next unique ID for this new panda
    this.pandaUniques.push(myId); // put unique ID on the panda unique array
    // if group ID has been added before then just add the unique ID to the panda Group ID array collection
		if (this.pandaGroupIds.hasOwnProperty(dbInfo.groupId)) { this.pandaGroupIds[dbInfo.groupId].push(myId); }
		else this.pandaGroupIds[dbInfo.groupId] = [myId]; // if new group ID then create new panda Group ID with unique ID
		if (!dbInfo.hasOwnProperty("id")) this.addToDB(dbInfo, this.addPandaData, myId, hitsAvailable, autoAdded);
		else this.addPandaData(dbInfo, myId, hitsAvailable, autoAdded, true);
	}
	removePanda(myId, deleteDB) {
		// get database info from database first and then delete it all.
			this.stopCollecting(myId, null);
			const pandaInfo = this.info[myId];
			const gId = pandaInfo.data.groupId;
			this.pandaUniques = arrayRemove(this.pandaUniques,myId);
			if (this.pandaGroupIds[gId].length > 1) { this.pandaGroupIds[gId] = arrayRemove(this.pandaGroupIds[gId],myId); }
			else delete this.pandaGroupIds[gId];
			if (pandaInfo.data.search!==null) {
				const value = (pandaInfo.data.search==="gid") ? pandaInfo.data.groupId : pandaInfo.data.reqId;
				mySearch.removeTrigger(pandaInfo.data.search, value);
			}
			if (deleteDB) this.deleteDbData(myId);
			this.info[myId].data = null; delete this.info[myId]; delete this.pandaUrls[myId];
}
	parseHitDetails(d, myId) {
		let thisHit = this.info[myId];
		if (thisHit.data.limitNumQueue>0) 
			this.queueAdds[myId] = (this.queueAdds.hasOwnProperty(myId)) ? this.queueAdds[myId]+1 : 1;
		if (d.contactRequesterUrl!=="") {
			const regex = /assignment_id=([^&]*)&.*requester_id\%5D=([^&]*)&.*Type%29\+(.*)$/;
			let [all, assignId, reqId, groupId] = d.contactRequesterUrl.match(regex);
			thisHit.data.reqId = reqId; thisHit.data.groupId = groupId; thisHit.data.taskId = assignId;
		}
		thisHit.data.reqName = d.requesterName; thisHit.data.title = d.projectTitle;
		thisHit.data.description = d.description; thisHit.data.price = d.monetaryReward.amountInDollars;
		thisHit.hitsAvailable = d.assignableHitsCount; thisHit.data.assignedTime = d.assignmentDurationInSeconds;
		thisHit.data.expires = d.expirationTime; extPandaUI.pandaCard[myId].updateAllCardInfo(thisHit);
	}
	checkIfLimited(myId, accepted, newQueue=false) {
		const thisHit = this.info[myId]; let addedHits = 0, unskip=false, skipIt=false, stopIt=null;
		if (accepted && thisHit.data.once) stopIt = "once"; // Panda is limited to collecting only once so stop it.
			// If panda got a hit and was auto added externally and only one hit is available then stop it.
		else if (accepted && thisHit.autoAdded && thisHit.hitsAvailable===1) stopIt = "oneHitAvailable";
			// If panda got a hit and has gone over the limits for accepted hits then stop it.
		else if (accepted && thisHit.data.acceptLimit>0 && 
			thisHit.data.acceptLimit<=extPandaUI.pandaStats[myId].accepted.value) stopIt = "acceptLimit";
		else {
				// If hit accepted and may have multiple hits not in queue yet
			if (accepted && this.queueAdds.hasOwnProperty(myId)) addedHits = this.queueAdds[myId];
			let hits = myQueue.totalResults(null, thisHit.data.groupId); // Get how many hits from this panda is in queue
			hits += ((accepted) ? addedHits : 0); // Add on the hits just accepted and may not be in queue yet
			if (thisHit.data.skipped) { // This panda is being skipped so check if it should be unskipped.
					// Unskip if number of hits from this panda group in queue is under the limit for this panda.
				if (thisHit.data.limitNumQueue>0 && hits<thisHit.data.limitNumQueue) unskip=true;
					// Unskip if the total number of hits in queue is under the limit for this panda.
				if (thisHit.data.limitTotalQueue>0 && this.queueResults.length<thisHit.data.limitTotalQueue) unskip=true;
					// Even if previous limits are good but total number in queue is limited then still skip.
				else if (thisHit.data.limitTotalQueue>0) unskip=false;
				if (unskip) { // If panda doesn't need to be skipped anymore.
					extPandaUI.cardEffectPreviousColor(myId,false); // Go back to previous background color.
					pandaTimer.unSkipThis(thisHit.queueUnique); // Unskip this panda in timer.
					this.pandaSkipped = arrayRemove(this.pandaSkipped, myId); thisHit.skipped = false; // This hit not skipped
				}
			} else { // if panda not being skipped
					// Skip if number of hits from this panda group in queue is over the limit for this panda.
				if (thisHit.data.limitNumQueue>0 && thisHit.data.limitNumQueue<=hits) skipIt=true;
					// Skip if the total number of hits in queue is over the limit for this panda.
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
		return {stopped:stopIt, skipped:thisHit.skipped};
	}
	gotNewQueue(queueResults, authenticityToken) {
		if (extPandaUI) {
			if (this.loggedOff) this.nowLoggedOn();
			this.authenticityToken = authenticityToken;
			this.queueResults = queueResults;
			this.queueAdds = {};
			if (this.pandaSkipped.length) this.pandaSkipped.forEach( item => this.checkIfLimited(item,false, true) );
			extPandaUI.gotNewQueue(this.queueResults);
		}
	}
	parsePandaUrl(url) {
		let groupId=null, reqId=null;
		const groupInfo = url.match(/\/projects\/([^\/]*)\/tasks[\/?]/);
		const requesterInfo = url.match(/\/requesters\/([^\/]*)\/projects[\/?]/);
		if (groupInfo) groupId = groupInfo[1];
		if (requesterInfo) reqId = requesterInfo[1];
		return [groupId, reqId];
	}
	goFetch(objUrl, queueUnique, elapsed, myId) {
		// Can deal with grabbing a hit and getting no more hits.
		extPandaUI.pandaGStats.setPandaElapsed(elapsed);
		super.goFetch(objUrl).then(result => {
			if (extPandaUI===null || this.info[myId].data===null) return
			extPandaUI.pandaStats[myId].addFetched(); extPandaUI.pandaGStats.addTotalPandaFetched();
			extPandaUI.highlightEffect_gid(myId);
			const savedData = this.info[myId].data;
			let limits = this.checkIfLimited(myId, false);
			if (result.mode === "logged out" && queueUnique !== null) { this.nowLoggedOff(); }
			else if (result.mode === "pre") { extPandaUI.pandaGStats.addPandaPRE(); }
			else if (result.mode === "maxxedOut") { console.log("Maxxed out dude"); }
			else if (result.mode === "noMoreHits") { extPandaUI.pandaGStats.addTotalPandaNoMore(); extPandaUI.pandaStats[myId].addNoMore(); }
			else if (result.mode === "noQual" && limits.stopped===null) { console.log("Not qualified"); extPandaUI.stopItNow(myId, true, limits.stopped, "#DDA0DD"); }
			else if (result.mode === "blocked") { console.log("You are blocked"); extPandaUI.stopItNow(myId, true, limits.stopped, "#575b6f"); }
			else if (result.mode === "notValid") { console.log("Group ID not found"); extPandaUI.stopItNow(myId, true, limits.stopped, "#575b6f"); }
			else if (result.mode === "unknown") { console.log("unknown message: ",result.data.message); }
			else if (result.type === "ok.text" && result.url.includes("assignment_id=")) {
				extPandaUI.hitAccepted(myId, queueUnique, result, savedData);
			} else if (result.type === "ok.text") { console.log("captcha found"); globalOpt.resetCaptcha(); }
		});
	}
}
