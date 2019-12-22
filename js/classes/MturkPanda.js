class MturkPanda extends MturkClass {
	constructor() {
		super();
		this.index = 1;												// Unique number for panda
		this.searchObj = null;								// Search object to communicate with
		this.pandaUniques = [];								// Array of all unique numbers being used
		this.pandaGroupIds = [];							// Array of all groupId's for easy searching
		this.pandaObjs = {};									// Object of panda info
		this.pandaStats = {};									// Object of PandaStats Class object
		this.pandaCard = {};									// Object of PandaCard Class object
		this.pandaUrls = {};									// Object of panda urls
		this.pandaSkipped = [];
		this.queueAdds = {};
		this.queueResults = [];
		this.ctrlDelete = [];
		this.hitQueue = [];										// Array of panda's to add but delayed
		this.hitsDelayed = false;
		this.lastAdded = null;
		this.tabsObj = null;
		this.loggedOff = false;
		this.timerInfo = {goingHam:null, running:false, queueTotal:0};

		this.portPanda = chrome.runtime.connect({name:"pandaTimer"}); // connect a port to timerClass
		this.portPanda.postMessage({command:"setTimer", timer:995}); // little lower than 1s panda timer by default
		this.portPanda.postMessage({command:"setHamTimer", timer:970}); // little lower than 1s panda timer by default
		this.portPanda.onMessage.addListener(function(msg) {
			if (msg.return === "doThis") {
				if (panda.goodToFetch(msg.myId)) panda.goFetch(panda.pandaUrls[msg.myId].urlObj, msg.queueUnique, msg.elapsed, msg.myId);
			}
			else if (msg.return === "doAfter") { panda.stopCollecting(msg.myId); }
			else if (msg.return === "addToQueue") { panda.pandaObjs[msg.myId].queueUnique = msg.value; }
			else if (msg.return === "timerInfo") { 
				panda.timerInfo.goingHam = msg.goingHam; panda.timerInfo.running = msg.running; panda.timerInfo.queueTotal = msg.queueTotal;
				panda.timerInfo.paused = msg.paused;
				if (msg.goingHam!==null) {
					$(`#pcm_hamButton_${msg.myIdHam}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
					disableOtherHamButtons(msg.myIdHam);
				} else { enableAllHamButtons(); }
				if (!msg.running) MturkPanda._this_GStats.collectingOff();
				if (msg.paused) MturkPanda._this_GStats.collectingPaused(); else MturkPanda._this_GStats.collectingUnPaused();
			}
		});
		chrome.runtime.onMessage.addListener( (request, sender) => {
			if (request.command==="gotNewQueue") {
				if (this.loggedOff) { modal.closeModal(); this.portPanda.postMessage({command:"unPauseTimer"}); this.loggedOff = false; }
				this.queueResults = request.queueResults; this.gotNewQueue();
			}
		});
		chrome.runtime.sendMessage( {command:"startQueueMonitor"} );
	}
	static _init_GStats(timer) { MturkPanda._this_GStats = new PandaGStats(); }
	isSearching() { return this.PandaGStats.collecting.value; }
	connectToSearch(searchObj) { this.searchObj = searchObj; }
	createPandaUrl(groupId) {
		return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	createPreviewUrl(groupId) {
		return `https://worker.mturk.com/projects/${groupId}/tasks`; }
	goodToFetch(myId) {
		return true;
	}
	modalClosed() { this.portPanda.postMessage({command:"unPauseTimer"}); }
	sendToQueue(myId, goHamStart=false, tempDuration=-1, tempGoHam=-1) {
		this.portPanda.postMessage({command:"addToQueue", myId:myId, thisObj:this, duration:this.pandaObjs[myId].duration, tempDuration:tempDuration, tempGoHam:tempGoHam, goHamStart:goHamStart, doThis:"doThis", doAfter:"doAfter"});
	}
	addTabsObj(obj) { this.tabsObj = obj; }
	startCollecting(myId, goHamStart=false, tempDuration=-1, tempGoHam=-1) {
		MturkPanda._this_GStats.addCollecting(); MturkPanda._this_GStats.collectingOn();
		this.pandaStats[myId].collecting = true;
		localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.pandaObjs[myId].groupId, status:true}));
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		this.sendToQueue(myId, goHamStart, tempDuration, tempGoHam);
		this.checkIfLimited(myId,false, true);
	}
	stopCollecting(myId, deleteFromQueue=false) {
		if (deleteFromQueue) this.portPanda.postMessage({command:"deleteFromQueue", queueUnique:this.pandaObjs[myId].queueUnique});
		MturkPanda._this_GStats.subCollecting();
		this.pandaStats[myId].collecting = false;
		this.pandaSkipped = this.pandaSkipped.filter( (value) => value !== myId ); this.pandaObjs[myId].skipped = false;
		localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.pandaObjs[myId].groupId, status:false}));
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
		if (previousColor) $(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
		this.pandaObjs[myId].queueUnique = null;
	}
	removeJobs(jobsArr, afterFunc=null) {
		let bodyText = ""; const info = this.pandaObjs;
		jobsArr.forEach( (thisId) => {  bodyText += `( ${info[thisId].reqName} [${info[thisId].price}] )<BR>`; });
		modal.showDeleteModal(bodyText, () => {
				jobsArr.forEach( (thisId) => {
					this.pandaCard[thisId].removeCard( () => {
						const gId = this.pandaObjs[thisId].groupId;
						this.pandaUniques = arrayRemove(this.pandaUniques,thisId);
						if (this.pandaGroupIds[gId].length > 1) { this.pandaGroupIds[gId] = arrayRemove(this.pandaGroupIds[gId],thisId); }
						else delete this.pandaGroupIds[gId]; 
						delete this.pandaObjs[thisId]; delete this.pandaCard[thisId]; delete this.pandaStats[thisId]; delete this.pandaUrls[thisId];
						MturkPanda._this_GStats.subPanda();
						if (afterFunc!==null) afterFunc.apply(this);
					});
				});
				modal.closeModal();
				jobsArr.length = 0;
			}, () => {}, () => { jobsArr.length = 0; $(".pcm_deleteButton").css("background-color", ""); }
		);
	}
	nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length===0) return null;
		if (diff===null) diff = new Date().getTime() - this.lastAdded;
		if (diff>=2000) {
			const obj = this.hitQueue.shift();
			this.lastAdded = new Date().getTime();
			this.pandaObjs[obj.myId].autoAdded = true;
			this.pandaObjs[obj.myId].hitsAvailable = obj.hitsAvailable;
			this.pandaCard[obj.myId].updateAllCardInfo();
			this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam);
			if (this.hitsDelayed) {
				if (this.hitQueue.length===0) this.hitsDelayed = false;
				if (this.hitsDelayed) setTimeout(this.nextInDelayedQueue.bind(this), 1000);
			}
		} else setTimeout(this.nextInDelayedQueue.bind(this), 1000);
	}
	addAndRunPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, hitsAvailable, tempDuration=-1, tempGoHam=-1, friendlyTitle = "", friendlyReqName = "" ) {
		let myId = null, diff = 0;
		if (groupId in this.pandaGroupIds && once) { return null; }
		else if (groupId in this.pandaGroupIds) { myId = this.pandaGroupIds[groupId][0] }
		else myId = this.addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, false, -1, -1, 0, hitsAvailable, 0, true, friendlyTitle, friendlyReqName);
		if (!this.pandaStats[myId].collecting) {
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
	addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle = "", friendlyReqName = "") {
		const myId = this.index++;
		this.pandaUniques.push(myId);
		if (groupId in this.pandaGroupIds) { this.pandaGroupIds[groupId].push(myId); }
		else this.pandaGroupIds[groupId] = [myId];
		this.pandaObjs[myId] = { groupId:groupId, description:description, title:title, reqId:reqId, reqName:reqName, price:price, limitNumQueue:limitNumQueue, limitTotalQueue:limitTotalQueue, once:once, autoGoHam:autoGoHam, hamDuration:hamDuration, duration:duration, acceptLimit:acceptLimit, friendlyTitle:friendlyTitle, friendlyReqName:friendlyReqName, autoAdded:autoAdded, tempGroupId:null, queueUnique:null, skipped:false, hitsAvailable:hitsAvailable, assignedTime:null, expires:null, dateAdded: new Date().getTime(), tabUnique:tabUnique, positionNum:null };
		this.pandaCard[myId] = new PandaCard(myId, this.pandaObjs[myId], this.tabsObj, tabUnique);
		this.pandaStats[myId] = new PandaStats(myId);
		if (this.timerInfo.goingHam!==null) $(`#pcm_hamButton_${myId}`).addClass("disabled");
		const pandaUrl = this.createPandaUrl(groupId);
		this.pandaUrls[myId] = { preview: this.createPreviewUrl(groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json") };
		MturkPanda._this_GStats.addPanda();
		$(`#pcm_collectButton_${myId}`).click((e) => {
			if ($(e.target).closest(".btn").hasClass("pcm_buttonOff")) { this.pandaObjs[myId].autoAdded = false; this.startCollecting(myId); }
			else this.stopCollecting(myId, true);
		});
		$(`#pcm_hamButton_${myId}`).click((e) => {
			const targetBtn = $(e.target).closest(".btn");
			if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, true); }
			if ($(targetBtn).hasClass("pcm_buttonOff")) this.portPanda.postMessage({command:"goHam", queueUnique:this.pandaObjs[myId].queueUnique});
			else this.portPanda.postMessage({command:"hamOff"});
		});
		$(`#pcm_deleteButton_${myId}`).click((e) => {
			const targetBtn = $(e.target).closest(".btn");
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(myId)) { $(targetBtn).css("background-color", ""); this.ctrlDelete = arrayRemove(this.ctrlDelete,myId); }
				else { $(targetBtn).css("background-color", "red"); this.ctrlDelete.push(myId); }
			} else if (e.altKey) { this.ctrlDelete.length = 0; $(".pcm_deleteButton").css("background-color", ""); }
			else {
				if (!this.ctrlDelete.includes(myId)) this.ctrlDelete.push(myId);
				this.removeJobs(this.ctrlDelete);
			}
		});
		$(`#pcm_detailsButton_${myId}`).click((e) => {
			modal.showDetailsModal( this.pandaObjs[myId], (changedDetails) => {
				this.pandaObjs[myId] = Object.assign(this.pandaObjs[myId], changedDetails);
				this.pandaCard[myId].updateAllCardInfo();
				modal.closeModal();
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
		const thisHit = this.pandaObjs[myId]; let addedHits = 0, unskip=false, skipIt=false, stopIt=false;
		if (accepted && thisHit.once) stopIt = true;
		else if (accepted && thisHit.autoAdded && thisHit.hitsAvailable===1) stopIt = true;
		else if (accepted && thisHit.acceptLimit>0 && thisHit.acceptLimit<=this.pandaStats[myId].accepted) stopIt = true;
		else {
			if (accepted && myId in this.queueAdds) addedHits = this.queueAdds[myId];
			chrome.runtime.sendMessage( {command:"totalResults", gId:thisHit.groupId}, (response) => {
				response.hits += ((accepted) ? addedHits : 0);
				if (thisHit.skipped) {
					if (thisHit.limitNumQueue>0 && response.hits<thisHit.limitNumQueue) unskip=true;
					if (thisHit.limitTotalQueue>0 && this.queueResults.length<thisHit.limitTotalQueue) unskip=true;
					else if (thisHit.limitTotalQueue>0) unskip=false;
					if (unskip) {
						const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
						$(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
						this.portPanda.postMessage({command:"unSkipThis", queueUnique:thisHit.queueUnique});
						this.pandaSkipped = arrayRemove( this.pandaSkipped, myId ); thisHit.skipped = false;
					}
				} else {
					if (thisHit.limitTotalQueue>0 && thisHit.limitTotalQueue<=this.queueResults.length) skipIt=true;
					else if (thisHit.limitNumQueue>0 && thisHit.limitNumQueue<=response.hits) skipIt=true;
					if (skipIt) {
						console.log("checkIfLimited: delete " + thisHit.queueUnique);
						$(`#pcm_pandaCard_${myId}`).stop(true,true).data("previousColor", $(`#pcm_pandaCard_${myId}`).css("background-color")).css("background-color", "#ffa691");
						this.portPanda.postMessage({command:"hamOff"});
						this.pandaSkipped.push(myId); thisHit.skipped = true;
						this.portPanda.postMessage({command:"skipThis", queueUnique:thisHit.queueUnique});
					}
				}
			});
		}
		if (stopIt) {
			$(`#pcm_pandaCard_${myId}`).stop(true,true);
			this.stopCollecting(myId, true);
		}
	}
	gotNewQueue() {
		this.queueAdds = {};
		if (this.pandaSkipped.length) this.pandaSkipped.forEach( item => this.checkIfLimited(item,false, true) );
	}
	doAlarms(myId) {
		const thisHit = this.pandaObjs[myId];
		const minutes = Math.floor(thisHit.assignedTime / 60);
		if ( thisHit.price < parseFloat(alarms.myAlarms.lessThan2.payRate) ) {
			if (minutes <= alarms.myAlarms.lessThan2.lessMinutes) alarms.playSound("lessThan2Short"); else alarms.playSound("lessThan2");
		} else if ( thisHit.price <= parseFloat(alarms.myAlarms.lessThan5.payRate) ) {
			if (minutes <= alarms.myAlarms.lessThan5.lessMinutes) alarms.playSound("lessThan5Short"); else alarms.playSound("lessThan5");
		} else if ( thisHit.price <= parseFloat(alarms.myAlarms.lessThan15.payRate) ) {
			if (minutes <= alarms.myAlarms.lessThan15.lessMinutes) alarms.playSound("lessThan15Short"); else alarms.playSound("lessThan15");
		} else if ( thisHit.price < parseFloat(alarms.myAlarms.moreThan15.payRate) ) { alarms.playSound("moreThan15"); }
}
	goFetch(objUrl, queueUnique, elapsed, myId) {
		// Can deal with grabbing a hit and getting no more hits.
		MturkPanda._this_GStats.setPandaElapsed(elapsed);
		super.goFetch(objUrl).then(result => {
			this.pandaStats[myId].addFetched(); MturkPanda._this_GStats.addTotalPandaFetched();
			$(`#pcm_groupId_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 );
			this.checkIfLimited(myId, false);
			if (result.mode === "logged out" && queueUnique !== null) {
				this.portPanda.postMessage({command:"pauseTimer"}); this.loggedOff = true;
				modal.showLoggedOffModal();
			}
			else if (result.mode === "pre") {
				MturkPanda._this_GStats.addPandaPRE();
			 }
			else if (result.mode === "maxxedOut") {
				
			 }
			else if (result.type === "ok.json" && result.data.message === "There are no more of these HITs available.") {
				MturkPanda._this_GStats.addTotalPandaNoMore();
				this.pandaStats[myId].addNoMore();
			 }
			else if (result.type === "ok.text") {
				MturkPanda._this_GStats.addTotalAccepted();
				$(`#pcm_pandaCard_${myId}`).stop(true,true).effect( "highlight", {}, 15000 );
				this.pandaStats[myId].addAccepted();
				if (this.pandaObjs[myId].autoGoHam) {
					this.portPanda.postMessage({command:"goHam", queueUnique:queueUnique, tGoHam:this.pandaObjs[myId].hamDuration});
				}
				this.portPanda.postMessage({command:"resetTimeStarted", queueUnique:queueUnique});
				const html = $.parseHTML( result.data );
				const targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div");
				const rawProps = $(targetDiv).find("span").attr("data-react-props");
				const hitDetails = JSON.parse(rawProps).modalOptions;
				this.parseHitDetails(this.pandaObjs[myId], hitDetails, myId);
				this.checkIfLimited(myId, true);
				this.doAlarms(myId);
			}
		 });
	 }
 }
