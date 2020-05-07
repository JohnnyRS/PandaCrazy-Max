class MturkPanda extends MturkClass {
	constructor(timer,hamTimer) {
    super();
    this.uniqueIndex = 0;								// unique number for a panda
		this.pandaUniques = [];							// Array of all unique numbers being used now
		this.pandaGroupIds = {};						// Object of all groupId's for easy searching
		this.info = {};											// Object of panda info
    this.pandaUrls = {};								// Object of panda urls for a panda with preview and accept links
		this.pandaSkipped = [];							// List of all panda's being skipped because of limits
		this.queueAdds = {};								// Object of panda accepted hits so it can limit number of accepts
		this.queueResults = [];							// The real queue with hits from mturk
		this.loggedOff = false;							// Are we logged off from mturk?
		this.authenticityToken = null;			// The authenticity token from mturk so hits can be returned from queue
		pandaTimer.setMyClass(this);				// Tell timer what class is using it so it can send information back
		pandaTimer.setTimer(timer);         // Set timer for this timer
    pandaTimer.setHamTimer(hamTimer);   // Set hamTimer for this timer
	}
	createPandaUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	createPreviewUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks`; }
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
	removeAll() {
		this.pandaUniques.forEach( key => { this.removePanda(key); });
		console.log(JSON.stringify(this.pandaUniques),JSON.stringify(this.info),this.uniqueIndex);
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
		mySearch.pandaStatus(this.info[myId].groupId,status)
	}
	startCollecting(myId, goHamStart, tempDuration, tempGoHam) {
		let limits = this.checkIfLimited(myId,false, true); // Check if there are any limits for this panda
		if (limits.stopped===null) { // If there was a limit to stop then don't add to queue.
			const data = this.info[myId];
			data.queueUnique = pandaTimer.addToQueue(myId, this, (timerUnique, elapsed, myId) => {
				this.goFetch(this.pandaUrls[myId].urlObj, timerUnique, elapsed, myId); // Do this function every cycle
			}, (myId) => {
				extPandaUI.stopCollecting(myId); // Do after when timer is removed from queue
				if (data.search!==null && (
						(data.once && extPandaUI.pandaStats[myId].accepted.value==0) || !data.once)) {
					extPandaUI.searchingNow(myId);
					mySearch.startSearching();
					let value = (data.search === "gid") ? data.groupId : data.reqId;
					mySearch.addTrigger(data.search, value, {"name":data.title, "duration":tempDuration, "once":data.once, "limitNumQueue":data.limitNumQueue, "limitTotalQueue":data.limitTotalQueue, "tempGoHam":tempGoHam, "disabled":false, "from":"pandaUI"});
				}
			}, goHamStart, data.duration, tempDuration, tempGoHam, limits.skipped);
			if (data.search!==null) extPandaUI.searchCollecting(myId);
			this.sendStatusToSearch(myId,true);
		} else { extPandaUI.stopCollecting(myId); }
	}
	stopCollecting(myId, deleteFromQueue=false, whyStop=null) {
		let info = this.info[myId], queueUnique = info.queueUnique;
		if (deleteFromQueue) pandaTimer.deleteFromQueue(queueUnique);
		if (this.pandaSkipped.includes(myId)) this.pandaSkipped = this.pandaSkipped.filter( (value) => value !== myId );
		info.skipped = false;
		if (info.search!==null) {
			if (whyStop==="once" || whyStop==="acceptLimit" || whyStop==="manual") {
				let value = (info.search === "gid") ? info.groupId : info.reqId; console.log(value);
				mySearch.disableTrigger(info.search,value);
				extPandaUI.searchDisabled(myId);
			}
		}
		this.sendStatusToSearch(myId,false);
	}
	addPanda(groupId, description, title, reqId, reqName, price, once, search, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable, tabUnique, autoAdded, friendlyTitle, friendlyReqName) {
		const myId = this.uniqueIndex++; // get the next unique ID for this new panda
    this.pandaUniques.push(myId); // put unique ID on the panda unique array
    // if group ID has been added before then just add the unique ID to the panda Group ID array collection
		if (this.pandaGroupIds.hasOwnProperty(groupId)) { this.pandaGroupIds[groupId].push(myId); }
    else this.pandaGroupIds[groupId] = [myId]; // if new group ID then create new panda Group ID with unique ID
    // add panda information into the info array
    this.info[myId] = { groupId:groupId, description:description, title:title, reqId:reqId, reqName:reqName, price:price, limitNumQueue:limitNumQueue, limitTotalQueue:limitTotalQueue, once:once, search:search, autoGoHam:autoGoHam, autoTGoHam:"off", hamDuration:hamDuration, duration:duration, acceptLimit:acceptLimit, friendlyTitle:friendlyTitle, friendlyReqName:friendlyReqName, autoAdded:autoAdded, tempGroupId:null, queueUnique:null, skipped:false, hitsAvailable:hitsAvailable, assignedTime:null, expires:null, dateAdded: new Date().getTime(), tabUnique:tabUnique, positionNum:null };
		const pandaUrl = this.createPandaUrl(groupId); // create the panda url for this panda
		this.pandaUrls[myId] = { preview: this.createPreviewUrl(groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json") }; // set up this panda list of urls with preview url too.
		return myId;
	}
	removePanda(myId) {
		const pandaInfo = this.info[myId];
		const gId = pandaInfo.groupId;
		this.stopCollecting(myId, true);
		this.pandaUniques = arrayRemove(this.pandaUniques,myId);
		if (this.pandaGroupIds[gId].length > 1) { this.pandaGroupIds[gId] = arrayRemove(this.pandaGroupIds[gId],myId); }
		else delete this.pandaGroupIds[gId];
		if (pandaInfo.search!==null) {
			const value = (pandaInfo.search==="gid") ? pandaInfo.groupId : pandaInfo.reqId;
			mySearch.removeTrigger(pandaInfo.search, value);
		}
		delete this.info[myId]; delete this.pandaUrls[myId];
}
	parseHitDetails(thisHit, details, myId) {
		if (thisHit.limitNumQueue>0) this.queueAdds[myId] = (this.queueAdds.hasOwnProperty(myId)) ? this.queueAdds[myId]+1 : 1;
		if (details.contactRequesterUrl!=="") {
			const regex = /assignment_id=([^&]*)&.*requester_id\%5D=([^&]*)&.*Type%29\+(.*)$/;
			let [all, assignId, reqId, groupId] = details.contactRequesterUrl.match(regex);
			thisHit.reqId = reqId; thisHit.groupId = groupId; thisHit.taskId = assignId;
		}
		thisHit.reqName = details.requesterName; thisHit.title = details.projectTitle;
		thisHit.description = details.description; thisHit.price = details.monetaryReward.amountInDollars;
		thisHit.hitsAvailable = details.assignableHitsCount; thisHit.assignedTime = details.assignmentDurationInSeconds;
		thisHit.expires = details.expirationTime; extPandaUI.pandaCard[myId].updateAllCardInfo();
	}
	checkIfLimited(myId, accepted, newQueue=false) {
		const thisHit = this.info[myId]; let addedHits = 0, unskip=false, skipIt=false, stopIt=null;
		if (accepted && thisHit.once) stopIt = "once"; // Panda is limited to collecting only once so stop it.
			// If panda got a hit and was auto added externally and only one hit is available then stop it.
		else if (accepted && thisHit.autoAdded && thisHit.hitsAvailable===1) stopIt = "oneHitAvailable";
			// If panda got a hit and has gone over the limits for accepted hits then stop it.
		else if (accepted && thisHit.acceptLimit>0 && 
			thisHit.acceptLimit<=extPandaUI.pandaStats[myId].accepted.value) stopIt = "acceptLimit";
		else {
				// If hit accepted and may have multiple hits not in queue yet
			if (accepted && this.queueAdds.hasOwnProperty(myId)) addedHits = this.queueAdds[myId];
			let hits = myQueue.totalResults(null, thisHit.groupId); // Get how many hits from this panda is in queue
			hits += ((accepted) ? addedHits : 0); // Add on the hits just accepted and may not be in queue yet
			if (thisHit.skipped) { // This panda is being skipped so check if it should be unskipped.
					// Unskip if number of hits from this panda group in queue is under the limit for this panda.
				if (thisHit.limitNumQueue>0 && hits<thisHit.limitNumQueue) unskip=true;
					// Unskip if the total number of hits in queue is under the limit for this panda.
				if (thisHit.limitTotalQueue>0 && this.queueResults.length<thisHit.limitTotalQueue) unskip=true;
					// Even if previous limits are good but total number in queue is limited then still skip.
				else if (thisHit.limitTotalQueue>0) unskip=false;
				if (unskip) { // If panda doesn't need to be skipped anymore.
					extPandaUI.cardEffectPreviousColor(myId,false); // Go back to previous background color.
					pandaTimer.unSkipThis(thisHit.queueUnique); // Unskip this panda in timer.
					this.pandaSkipped = arrayRemove(this.pandaSkipped, myId); thisHit.skipped = false; // This hit not skipped
				}
			} else { // if panda not being skipped
					// Skip if number of hits from this panda group in queue is over the limit for this panda.
				if (thisHit.limitTotalQueue>0 && thisHit.limitTotalQueue<=this.queueResults.length) skipIt=true;
					// Skip if the total number of hits in queue is over the limit for this panda.
				else if (thisHit.limitNumQueue>0 && thisHit.limitNumQueue<=response.hits) skipIt=true;
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
			if (extPandaUI===null) return
			extPandaUI.pandaStats[myId].addFetched(); extPandaUI.pandaGStats.addTotalPandaFetched();
			extPandaUI.highlightEffect_gid(myId);
			let limits = this.checkIfLimited(myId, false);
			if (result.mode === "logged out" && queueUnique !== null) { this.nowLoggedOff(); }
			else if (result.mode === "pre") { extPandaUI.pandaGStats.addPandaPRE(); }
			else if (result.mode === "maxxedOut") { console.log("Maxxed out dude"); }
			else if (result.mode === "noMoreHits") { extPandaUI.pandaGStats.addTotalPandaNoMore(); extPandaUI.pandaStats[myId].addNoMore(); }
			else if (result.mode === "noQual" && limits.stopIt===null) { console.log("Not qualified"); extPandaUI.stopItNow(myId, true, limits.stopIt, "#DDA0DD"); }
			else if (result.mode === "blocked") { console.log("You are blocked"); extPandaUI.stopItNow(myId, true, limits.stopIt, "#575b6f"); }
			else if (result.mode === "notValid") { console.log("Group ID not found"); extPandaUI.stopItNow(myId, true, limits.stopIt, "#575b6f"); }
			else if (result.mode === "unknown") { console.log("unknown message: ",result.data.message); }
			else if (result.type === "ok.text" && result.url.includes("assignment_id=")) {
				extPandaUI.hitAccepted(myId, queueUnique, result);
			} else if (result.type === "ok.text") { console.log("captcha found"); globalOpt.resetCaptcha(); }
		});
	}
}
