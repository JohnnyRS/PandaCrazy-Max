class MturkPanda extends MturkClass {
	constructor() {
		super();
		this.index = 1;												// Unique number for panda
		this.searchObj = null;								// Search object to communicate with
		this.pandaUniques = [];								// Array of all unique numbers being used
		this.pandaGroupIds = [];							// Array of all groupId's for easy searching
		this.pandaObjs = {};									// Object of panda info
		this.PandaStats = {};									// Object of PandaStats Class object
		this.pandaCard = {};									// Object of PandaCard Class object
		this.pandaUrls = {};									// Object of panda urls
		this.pandaSkipped = [];
		this.queueAdds = {};
		this.ctrlDelete = [];
		this.hitQueue = [];										// Array of panda's to add but delayed
		this.hitsDelayed = false;
		this.lastAdded = null;
	}
	static _init_Timer(timer) { MturkPanda._this_Timer = new TimerClass(timer); }
	static _init_GStats(timer) { MturkPanda._this_GStats = new PandaGStats(); }
	isSearching() { return this.PandaGStats.collecting.value; }
	connectToSearch(searchObj) { this.searchObj = searchObj; }
	isThisCollecting(gId) {
		let returnValue = false;
		if (gId in this.pandaGroupIds) returnValue = this.PandaStats[this.pandaGroupIds[gId]].collecting;
		return returnValue; }
	createPandaUrl(groupId) {
		return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	createPreviewUrl(groupId) {
		return `https://worker.mturk.com/projects/${groupId}/tasks`; }
	goodToFetch(myId) {
		return true;
	}
	modalClosed() { MturkPanda._this_Timer.unPauseTimer(); }
	addToQueue(myId, tempDuration=-1, tempGoHam=-1) {
		this.pandaObjs[myId].queueUnique = MturkPanda._this_Timer.addToQueue(myId, this, (unique, elapsed, myId, obj) => {
			if (this.goodToFetch(myId)) obj.goFetch(obj.pandaUrls[myId].urlObj, unique, elapsed, myId);
		}, (myId, obj, test) => {
			obj.stopCollecting(myId);
		}, this.pandaObjs[myId].duration, tempDuration, tempGoHam );
}
	startCollecting(myId, tempDuration=-1, tempGoHam=-1) {
		MturkPanda._this_GStats.addCollecting(); MturkPanda._this_GStats.collectingOn();
		this.PandaStats[myId].collecting = true;
		localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.pandaObjs[myId].groupId, status:true}));
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		this.addToQueue(myId, tempDuration, tempGoHam);
		this.checkIfLimited(myId,false, true);
	}
	stopCollecting(myId, deleteFromQueue=false) {
		if (deleteFromQueue) MturkPanda._this_Timer.deleteFromQueue(this.pandaObjs[myId].queueUnique);
		MturkPanda._this_GStats.subCollecting();
		if (!MturkPanda._this_Timer.running) MturkPanda._this_GStats.collectingOff();
		console.log("Global Stats: " + MturkPanda._this_GStats.collectingTotal.value);
		this.PandaStats[myId].collecting = false;
		this.pandaSkipped = this.pandaSkipped.filter( (value) => value !== myId ); this.pandaObjs[myId].skipped = false;
		localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.pandaObjs[myId].groupId, status:false}));
		if (MturkPanda._this_Timer.isGoingHam(this.pandaObjs[myId].queueUnique)) enableAllHamButtons();
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		this.pandaObjs[myId].queueUnique = null; }
	nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length===0) return null;
		if (diff===null) diff = new Date().getTime() - this.lastAdded;
		if (diff>=2000) {
			const obj = this.hitQueue.shift();
			this.lastAdded = new Date().getTime();
			this.pandaObjs[obj.myId].autoAdded = true;
			this.pandaObjs[obj.myId].hitsAvailable = obj.hitsAvailable;
			this.pandaCard[obj.myId].updateAllCardInfo();
			this.startCollecting(obj.myId, obj.tempDuration, obj.tempGoHam);
			if (this.hitsDelayed) {
				if (this.hitQueue.length===0) this.hitsDelayed = false;
				if (this.hitsDelayed) setTimeout(this.nextInDelayedQueue.bind(this), 1000);
			}
		} else setTimeout(this.nextInDelayedQueue.bind(this), 1000);
	}
	addAndRunPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, hitsAvailable, tempDuration=-1, tempGoHam=-1, friendlyTitle = "", friendlyReqName = "" ) {
		let myId = null, diff = 0;
		if (groupId in this.pandaGroupIds && once) { return null; }
		else if (groupId in this.pandaGroupIds) { myId = this.pandaGroupIds[groupId] }
		else myId = this.addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, false, -1, -1, 0, hitsAvailable, true, friendlyTitle, friendlyReqName);
		if (!this.PandaStats[myId].collecting) {
			const nowDate = new Date().getTime();
			this.hitQueue.push({myId:myId, price:price, hitsAvailable:hitsAvailable, tempDuration:tempDuration, tempGoHam:tempGoHam, delayedAt:nowDate});
			if (this.lastAdded!==null) diff = nowDate - this.lastAdded;
			else diff = 10000;
			if (diff<2000) {
				if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
				this.hitsDelayed = true;
				localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.pandaObjs[myId].groupId, status:true}));
				setTimeout(this.nextInDelayedQueue.bind(this), 1000, diff);
				return null;
			}
			this.nextInDelayedQueue(diff);
		} else {
			this.pandaObjs[myId].hitsAvailable = hitsAvailable; this.pandaObjs[myId].reqName = reqName;
			this.pandaObjs[myId].reqId = reqId; this.pandaObjs[myId].title = title;
			this.pandaObjs[myId].description = description; this.pandaObjs[myId].price = price;
			this.pandaCard[myId].updateAllCardInfo();
		}
	}
	addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable, autoAdded=false, friendlyTitle = "", friendlyReqName = "") {
		if (groupId in this.pandaGroupIds) { return null; }
		const myId = this.index++;
		this.pandaUniques.push(myId);
		this.pandaGroupIds[groupId] = myId;
		this.pandaObjs[myId] = { groupId:groupId, description:description, title:title, reqId:reqId, reqName:reqName, price:price, limitNumQueue:limitNumQueue, limitTotalQueue:limitTotalQueue, once:once, autoGoHam:autoGoHam, hamDuration:hamDuration, duration:duration, acceptLimit:acceptLimit, friendlyTitle:friendlyTitle, friendlyReqName:friendlyReqName, autoAdded:autoAdded, queueUnique:null, skipped:false, hitsAvailable:hitsAvailable, assignedTime:null, expires:null, dateAdded: new Date().getTime() };
		this.pandaCard[myId] = new PandaCard(myId, this.pandaObjs[myId], this.PandaStats[myId]);
		this.PandaStats[myId] = new PandaStats(myId);
		if (MturkPanda._this_Timer.isHamOn()) $(`#pcm_hamButton_${myId}`).addClass("disabled");
		const pandaUrl = this.createPandaUrl(groupId);
		this.pandaUrls[myId] = { preview: this.createPreviewUrl(groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json") };
		MturkPanda._this_GStats.addPanda();
		$(`#pcm_collectButton_${myId}`).click((e) => {
			if ($(e.target).closest(".btn").hasClass("pcm_buttonOff")) { this.pandaObjs[myId].autoAdded = false; this.startCollecting(myId); }
			else this.stopCollecting(myId, true);
		});
		$(`#pcm_hamButton_${myId}`).click((e) => {
			const targetBtn = $(e.target).closest(".btn");
			if (!this.PandaStats[myId].collecting) { this.startCollecting(myId); }
			if ($(targetBtn).hasClass("pcm_buttonOff")) {
				MturkPanda._this_Timer.goHam(this.pandaObjs[myId].queueUnique);
				$(targetBtn).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
				disableOtherHamButtons();
			} else {
				MturkPanda._this_Timer.hamOff(this.pandaObjs[myId].queueUnique);
				$(targetBtn).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
				enableAllHamButtons();
			}
		});
		$(`#pcm_deleteButton_${myId}`).click((e) => {
			const targetBtn = $(e.target).closest(".btn");
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(myId)) { $(targetBtn).css("background-color", ""); this.ctrlDelete = arrayRemove(this.ctrlDelete,myId); }
				else { $(targetBtn).css("background-color", "red"); this.ctrlDelete.push(myId); }
			} else if (e.altKey) { this.ctrlDelete = []; $(".pcm_deleteButton").css("background-color", ""); }
			else {
				if (!this.ctrlDelete.includes(myId)) this.ctrlDelete.push(myId);
				let modalBody = "";
				this.ctrlDelete.forEach( (thisId) => { 
					modalBody += `( ${this.pandaObjs[thisId].reqName} [${this.pandaObjs[thisId].price}] )`;
					modalBody += "<BR>";
				});
				modal.showDeleteModal(modalBody, () => {
						this.ctrlDelete.forEach( (thisId) => { 
							this.pandaCard[thisId].removeCard( () => {
								this.pandaUniques = arrayRemove(this.pandaUniques,thisId);
								delete this.pandaGroupIds[this.pandaObjs[thisId].groupId]; delete this.pandaObjs[thisId];
								delete this.pandaCard[thisId]; delete this.PandaStats[thisId]; delete this.pandaUrls[thisId];
								MturkPanda._this_GStats.subPanda();
							});
						});
						this.ctrlDelete = [];
					}, () => {}, () => {  this.ctrlDelete = []; $(".pcm_deleteButton").css("background-color", ""); }
				);
			}
		});
		$(`#pcm_detailsButton_${myId}`).click((e) => {
			modal.showDetailsModal( this.pandaObjs[myId], (changedDetails) => {
				this.pandaObjs[myId] = Object.assign(this.pandaObjs[myId], changedDetails);
				this.pandaCard[myId].updateAllCardInfo();
			} );
		});
		return myId;
	}
	changeFriendlyNames(myId) {
		this.pandaObjs[myId].friendlyTitle = friendlyTitle;
		this.pandaObjs[myId].friendlyReqName = friendlyReqName;
	 }
	parseHitDetails(thisHit, details, myId) {
		if (thisHit.limitNumQueue>0) this.queueAdds[myId] = (myId in this.queueAdds) ? this.queueAdds[myId]+1 : 1;
		if (details.contactRequesterUrl!=="") {
			const regex = /assignment_id=([^&]*)&.*requester_id\%5D=([^&]*)&.*Type%29\+(.*)$/;
			var [all, assignId, reqId, groupId] = details.contactRequesterUrl.match(regex);
			thisHit.reqId = reqId; thisHit.groupId = groupId;
		}
		thisHit.reqName = details.requesterName; thisHit.title = details.projectTitle;
		thisHit.description = details.description; thisHit.price = details.monetaryReward.amountInDollars;
		thisHit.hitsAvailable = details.assignableHitsCount; thisHit.assignedTime = details.assignmentDurationInSeconds;
		thisHit.expires = details.expirationTime; this.pandaCard[myId].updateAllCardInfo();
	}
	checkIfLimited(myId, accepted, newQueue=false) {
		const thisHit = this.pandaObjs[myId]; let addedHits = 0, unskip=false, skipIt=false;
		if (accepted && thisHit.once) this.stopCollecting(myId, true);
		else if (accepted && thisHit.autoAdded && thisHit.hitsAvailable===1) { console.log("It Worked!"); this.stopCollecting(myId, true); }
		else if (accepted && thisHit.acceptLimit>0 && thisHit.acceptLimit<=this.PandaStats[myId].accepted) this.stopCollecting(myId, true);
		else {
			if (accepted && myId in this.queueAdds) addedHits = this.queueAdds[myId];
			const hitsInQueue = queue.totalResults("", thisHit.groupId) + ((accepted) ? addedHits : 0);
			if (thisHit.skipped) {
				if (thisHit.limitTotalQueue>0 && queue.queueResults.length<thisHit.limitTotalQueue) unskip=true;
				if (thisHit.limitNumQueue>0 && hitsInQueue<thisHit.limitNumQueue) unskip=true;
				else if (thisHit.limitNumQueue>0) unskip=false;
				if (unskip) {
					this.pandaSkipped = arrayRemove( this.pandaSkipped, myId ); thisHit.skipped = false; this.addToQueue(myId);
				}
			} else {
				if (thisHit.limitTotalQueue>0 && thisHit.limitTotalQueue<=queue.queueResults.length) skipIt=true;
				else if (thisHit.limitNumQueue>0 && thisHit.limitNumQueue<=hitsInQueue) skipIt=true;
				if (skipIt) {
					console.log("checkIfLimited: delete " + thisHit.queueUnique);
					MturkPanda._this_Timer.deleteFromQueue(thisHit.queueUnique); this.pandaSkipped.push(myId); thisHit.skipped = true;
				}
			}
		}
	}
	gotNewQueue() {
		this.queueAdds = {};
		if (this.pandaSkipped.length) this.pandaSkipped.forEach( item => this.checkIfLimited(item,false, true) );
	}
	goFetch(objUrl, queueUnique, elapsed, myId) {
		// Can deal with grabbing a hit and getting no more hits.
		MturkPanda._this_GStats.setPandaElapsed(elapsed);
		super.goFetch(objUrl).then(result => {
			this.PandaStats[myId].addFetched(); MturkPanda._this_GStats.addTotalPandaFetched();
			$(`#pcm_groupId_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 );
			this.checkIfLimited(myId, false);
			if (result.mode === "logged out" && queueUnique !== null) {
				MturkPanda._this_Timer.pauseTimer();
				modal.showLoggedOffModal();
			}
			else if (result.mode === "pre") {
				MturkPanda._this_GStats.addPandaPRE();
			 }
			else if (result.mode === "maxxedOut") {
				
			 }
			else if (result.type === "ok.json" && result.data.message === "There are no more of these HITs available.") {
				MturkPanda._this_GStats.addTotalPandaNoMore();
				this.PandaStats[myId].addNoMore();
			 }
			else if (result.type === "ok.text") {
				MturkPanda._this_GStats.addTotalAccepted();
				$(`#pcm_pandaCard_${myId}`).effect( "highlight", {}, 15000 );
				this.PandaStats[myId].addAccepted();
				if (this.pandaObjs[myId].autoGoHam) {
					MturkPanda._this_Timer.goHam(queueUnique, this.pandaObjs[myId].hamDuration);
					disableOtherHamButtons(myId);
				}
				MturkPanda._this_Timer.resetTimeStarted(queueUnique);
				const html = $.parseHTML( result.data );
				const targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div");
				const rawProps = $(targetDiv).find("span").attr("data-react-props");
				const hitDetails = JSON.parse(rawProps).modalOptions;
				this.parseHitDetails(this.pandaObjs[myId], hitDetails, myId);
				this.checkIfLimited(myId, true);
			}
		 });
	 }
 }
