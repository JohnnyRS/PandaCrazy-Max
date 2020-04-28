class MturkPanda extends MturkClass {
	constructor() {
		super();
		this.index = 1;												// Unique number for panda
		this.searchObj = null;								// Search object to communicate with
		this.pandaUniques = [];								// Array of all unique numbers being used
		this.pandaGroupIds = [];							// Array of all groupId's for easy searching
		this.info = {};												// Object of panda info
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
		this.loggedOff = false;
		this.hamBtnBgColor = "";
		this.hamBtnColor = "";
		this.authenticityToken = null;
		this.timerInfo = {goingHam:null, running:false, queueTotal:0};
		this.tabs = new TabbedClass($(`#pcm_pandaSection`), `pcm_pandaTabs`, `pcm_tabbedPandas`, `pcm_pandaTabContents`);
		this.logTabs = new LogTabsClass();
		this.logTabs.updateCaptcha(globalOpt.getCaptchaCount());

		this.messagesPort = chrome.runtime.connect({name:"pandaMessages"});
		this.portPanda = chrome.runtime.connect({name:"pandaTimer"}); // connect a port to timerClass
		this.portPanda.postMessage({command:"setTimer", timer:995}); // little lower than 1s panda timer by default
		this.portPanda.postMessage({command:"setHamTimer", timer:970}); // little lower than 1s panda timer by default
		this.portPanda.onMessage.addListener( (msg) => {
			if (msg.return === "doThis") {
				if (this.goodToFetch(msg.myId)) this.goFetch(this.pandaUrls[msg.myId].urlObj, msg.queueUnique, msg.elapsed, msg.myId);
			}
			else if (msg.return === "doAfter") { this.stopCollecting(msg.myId); }
			else if (msg.return === "addToQueue") { this.info[msg.myId].queueUnique = msg.value; }
			else if (msg.return === "timerInfo") { 
				this.timerInfo.goingHam = msg.goingHam; this.timerInfo.running = msg.running; this.timerInfo.queueTotal = msg.queueTotal;
				this.timerInfo.paused = msg.paused;
				if (msg.goingHam!==null) {
					$(`#pcm_hamButton_${msg.myIdHam}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
					disableOtherHamButtons(msg.myIdHam);
				} else { enableAllHamButtons(); }
				if (!msg.running) MturkPanda._this_GStats.collectingOff();
				if (msg.paused) MturkPanda._this_GStats.collectingPaused(); else MturkPanda._this_GStats.collectingUnPaused();
			}
			else if (msg.return === "loggedOff") { this.nowLoggedOff(); }
			else if (msg.return === "loggedon") {}
		});
		chrome.runtime.onMessage.addListener( (request, sender) => {
			if (request.command==="gotNewQueue") {
				if (this.loggedOff) this.nowLoggedOn();
				if (!this.authenticityToken) this.authenticityToken = request.authenticityToken;
				this.queueResults = request.queueResults; this.gotNewQueue();
				this.logTabs.updateQueue(this, this.queueResults);
			}
			else if (request.command.substring(0, 3)==="add") { this.addFromExternal( request ); }
		});
		chrome.runtime.sendMessage( {command:"startQueueMonitor"} );
	}
	static _init_GStats(timer) { MturkPanda._this_GStats = new PandaGStats(); }
	isSearching() { return this.PandaGStats.collecting.value; }
	connectToSearch(searchObj) { this.searchObj = searchObj; }
	createPandaUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks/accept_random`; }
	createPreviewUrl(groupId) { return `https://worker.mturk.com/projects/${groupId}/tasks`; }
	goodToFetch(myId) { return true; }
	showJobsModal(type="jobs", thisUnique=-1, thisObj=null, thisSaveFunc=null, thisCheckFunc=null, cancelFunc=null) { modal.showJobsModal(this, type, thisUnique, thisObj, thisSaveFunc, thisCheckFunc, cancelFunc); }
	modalClosed() { this.portPanda.postMessage({command:"unPauseTimer"}); }
	nowLoggedOff() {
		this.portPanda.postMessage({command:"pauseTimer"}); this.loggedOff = true;
		modal.showLoggedOffModal( () => { this.portPanda.postMessage({command:"unPauseTimer"}); } );
	}
	nowLoggedOn() {
		modal.closeModal("Program Paused!"); this.portPanda.postMessage({command:"unPauseTimer"});
		this.loggedOff = false;
	}
	sendToQueue(myId, goHamStart=false, tempDuration=-1, tempGoHam=-1) {
		this.portPanda.postMessage({command:"addToQueue", myId:myId, thisObj:this, duration:this.info[myId].duration, tempDuration:tempDuration, tempGoHam:tempGoHam, goHamStart:goHamStart, doThis:"doThis", doAfter:"doAfter"});
	}
	startCollecting(myId, goHamStart=false, tempDuration=-1, tempGoHam=-1) {
		MturkPanda._this_GStats.addCollecting(); MturkPanda._this_GStats.collectingOn();
		this.pandaStats[myId].collecting = true;
		localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.info[myId].groupId, status:true}));
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		if (this.info[myId].autoGoHam) $(`#pcm_hamButton_${myId}`).addClass("pcm_delayedHam");
		this.sendToQueue(myId, goHamStart, tempDuration, tempGoHam);
		this.checkIfLimited(myId,false, true);
	}
	stopCollecting(myId, deleteFromQueue=false) {
		if (deleteFromQueue) this.portPanda.postMessage({command:"deleteFromQueue", queueUnique:this.info[myId].queueUnique});
		MturkPanda._this_GStats.subCollecting();
		this.pandaStats[myId].collecting = false;
		this.pandaSkipped = this.pandaSkipped.filter( (value) => value !== myId ); this.info[myId].skipped = false;
		localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.info[myId].groupId, status:false}));
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_delayedHam");
		const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
		if (previousColor) $(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
		this.info[myId].queueUnique = null; this.info[myId].autoTGoHam = "off";
	}
	removeJobs(jobsArr, afterFunc=null) {
		let bodyText = ""; const info = this.info;
		jobsArr.forEach( (thisId) => {  bodyText += `( ${info[thisId].reqName} [${info[thisId].price}] )<BR>`; });
		modal.showDeleteModal(bodyText, () => {
			jobsArr.forEach( (thisId) => {
				this.stopCollecting(thisId, true)
				this.pandaCard[thisId].removeCard( () => {
					const gId = this.info[thisId].groupId;
					this.pandaUniques = arrayRemove(this.pandaUniques,thisId);
					if (this.pandaGroupIds[gId].length > 1) { this.pandaGroupIds[gId] = arrayRemove(this.pandaGroupIds[gId],thisId); }
					else delete this.pandaGroupIds[gId]; 
					delete this.info[thisId]; delete this.pandaCard[thisId]; delete this.pandaStats[thisId]; delete this.pandaUrls[thisId];
					MturkPanda._this_GStats.subPanda();
					if (afterFunc!==null) afterFunc.apply(this);
				});
			});
			modal.closeModal();
			jobsArr.length = 0;
		}, () => {}, () => { jobsArr.length = 0; $(".pcm_deleteButton").css("background-color", ""); });
	}
	nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length===0) return null;
		if (diff===null) diff = new Date().getTime() - this.lastAdded;
		if (diff>=2000) {
			const obj = this.hitQueue.shift();
			this.lastAdded = new Date().getTime();
			this.info[obj.myId].autoAdded = true;
			this.info[obj.myId].hitsAvailable = obj.hitsAvailable;
			this.pandaCard[obj.myId].updateAllCardInfo();
			this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam);
			if (this.hitsDelayed) {
				if (this.hitQueue.length===0) this.hitsDelayed = false;
				if (this.hitsDelayed) setTimeout(this.nextInDelayedQueue.bind(this), 1000);
			}
		} else setTimeout(this.nextInDelayedQueue.bind(this), 1000);
	}
	addFromExternal( msg ) { //addAndRunPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, hitsAvailable, tempDuration=-1, tempGoHam=-1, friendlyTitle = "", friendlyReqName = "" )
		if (msg.command==="addSearchJob") return null;
		const once = (msg.command==="addOnceJob") ? true : false;
		const run = (msg.command==="addOnlyJob") ? false : true;
		if (run) this.addAndRunPanda(msg.groupId, msg.description, unescape(msg.title), msg.reqId, unescape(msg.reqName), msg.price, once, 0, 0, 0, 20000, 4000 )
	}
	addAndRunPanda(groupId, description, title, reqId, reqName, price, once, hitsAvailable, limitNumQueue=0, limitTotalQueue=0, tempDuration=-1, tempGoHam=-1, friendlyTitle = "", friendlyReqName = "" ) {
		let myId = null, diff = 0;
		if (groupId in this.pandaGroupIds) { myId = this.pandaGroupIds[groupId][0] }
		else myId = this.addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, false, -1, -1, 0, hitsAvailable, 0, true, friendlyTitle, friendlyReqName);
		if (once && this.pandaStats[myId].accepted.value>0) return null;
		if (!this.pandaStats[myId].collecting) {
			const nowDate = new Date().getTime();
			this.hitQueue.push({myId:myId, price:price, hitsAvailable:hitsAvailable, tempDuration:tempDuration, tempGoHam:tempGoHam, delayedAt:nowDate});
			if (this.lastAdded!==null) diff = nowDate - this.lastAdded;
			else diff = 10000;
			if (diff<2000) {
				if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
				this.hitsDelayed = true;
				localStorage.setItem("PCM_pandaStatus", JSON.stringify({gId:this.info[myId].groupId, status:true}));
				setTimeout(this.nextInDelayedQueue.bind(this), 1000, diff);
				return null;
			}
			this.nextInDelayedQueue(diff);
		} else {
			this.info[myId].hitsAvailable = hitsAvailable; this.info[myId].reqName = reqName;
			this.info[myId].reqId = reqId; this.info[myId].title = title;
			this.info[myId].description = description; this.info[myId].price = price;
			this.pandaCard[myId].updateAllCardInfo();
		}
	}
	hamButtonClicked(myId, targetBtn, autoGoHam=false) { console.log(autoGoHam);
		if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, !autoGoHam); }
		if (!autoGoHam && $(targetBtn).hasClass("pcm_buttonOff")) this.portPanda.postMessage({command:"goHam", queueUnique:this.info[myId].queueUnique});
		else if (!autoGoHam) this.portPanda.postMessage({command:"hamOff"});
	}
	addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle = "", friendlyReqName = "") {
		const myId = this.index++;
		this.pandaUniques.push(myId);
		if (groupId in this.pandaGroupIds) { this.pandaGroupIds[groupId].push(myId); }
		else this.pandaGroupIds[groupId] = [myId];
		this.info[myId] = { groupId:groupId, description:description, title:title, reqId:reqId, reqName:reqName, price:price, limitNumQueue:limitNumQueue, limitTotalQueue:limitTotalQueue, once:once, autoGoHam:autoGoHam, autoTGoHam:"off", hamDuration:hamDuration, duration:duration, acceptLimit:acceptLimit, friendlyTitle:friendlyTitle, friendlyReqName:friendlyReqName, autoAdded:autoAdded, tempGroupId:null, queueUnique:null, skipped:false, hitsAvailable:hitsAvailable, assignedTime:null, expires:null, dateAdded: new Date().getTime(), tabUnique:tabUnique, positionNum:null };
		this.pandaCard[myId] = new PandaCard(myId, this.info[myId], this.tabs, tabUnique);
		this.hamBtnBgColor = $(`#pcm_hamButton_${myId}`).css("background-color");
		this.hamBtnColor = $(`#pcm_hamButton_${myId}`).css("color");
		this.pandaStats[myId] = new PandaStats(myId);
		if (this.timerInfo.goingHam!==null) $(`#pcm_hamButton_${myId}`).addClass("disabled");
		const pandaUrl = this.createPandaUrl(groupId);
		this.pandaUrls[myId] = { preview: this.createPreviewUrl(groupId), accept: pandaUrl, urlObj: new UrlClass(pandaUrl + "?format=json") };
		MturkPanda._this_GStats.addPanda();
		$(`#pcm_pandaCard_${myId}`).click( e => {
			
		} )
		$(`#pcm_collectButton_${myId}`).click((e) => {
			if ($(e.target).closest(".btn").hasClass("pcm_buttonOff")) { this.info[myId].autoAdded = false; this.startCollecting(myId); }
			else this.stopCollecting(myId, true);
		});
		$(`#pcm_hamButton_${myId}`).click((e) => { 
			const targetBtn = $(e.target).closest(".btn");
			if ($(targetBtn).data("longClicked")) { $(targetBtn).removeData("longClicked"); $(targetBtn).css({"background-color": "", "color": ""});}
			else { this.hamButtonClicked(myId, targetBtn); }
		}).mayTriggerLongClicks( { delay: 1200 }).on('longClick', (e) => {
				const targetBtn = $(e.target).closest(".btn");
				$(targetBtn).data("longClicked",true);
				if ($(targetBtn).hasClass("pcm_delayedHam")) {
					$(targetBtn).css({"background-color":this.hamBtnBgColor, "color":this.hamBtnColor}).removeClass("pcm_delayedHam");
					this.info[myId].autoTGoHam = (this.info[myId].autoGoHam) ? "disable" : "off";
				} else { 
					this.info[myId].autoTGoHam = "on";
					$(targetBtn).css({"background-color": "#097e9b", "color":"#FFFFFF"}).addClass("pcm_delayedHam");
					this.hamButtonClicked(myId, targetBtn, true);
				}
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
		$(`#pcm_detailsButton_${myId}`).click(() => { this.pandaCard[myId].showDetailsModal(this); });
		return myId;
	}
	parseHitDetails(thisHit, details, myId) {
		if (thisHit.limitNumQueue>0) this.queueAdds[myId] = (myId in this.queueAdds) ? this.queueAdds[myId]+1 : 1;
		if (details.contactRequesterUrl!=="") {
			const regex = /assignment_id=([^&]*)&.*requester_id\%5D=([^&]*)&.*Type%29\+(.*)$/;
			let [all, assignId, reqId, groupId] = details.contactRequesterUrl.match(regex);
			thisHit.reqId = reqId; thisHit.groupId = groupId; thisHit.taskId = assignId;
		}
		thisHit.reqName = details.requesterName; thisHit.title = details.projectTitle;
		thisHit.description = details.description; thisHit.price = details.monetaryReward.amountInDollars;
		thisHit.hitsAvailable = details.assignableHitsCount; thisHit.assignedTime = details.assignmentDurationInSeconds;
		thisHit.expires = details.expirationTime; this.pandaCard[myId].updateAllCardInfo();
	}
	checkIfLimited(myId, accepted, newQueue=false) {
		const thisHit = this.info[myId]; let addedHits = 0, unskip=false, skipIt=false, stopIt=false;
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
		MturkPanda._this_GStats.setPandaElapsed(elapsed);
		super.goFetch(objUrl).then(result => {
			this.pandaStats[myId].addFetched(); MturkPanda._this_GStats.addTotalPandaFetched();
			$(`#pcm_groupId_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 );
			this.checkIfLimited(myId, false);
			if (result.mode === "logged out" && queueUnique !== null) { this.nowLoggedOff(); }
			else if (result.mode === "pre") { MturkPanda._this_GStats.addPandaPRE(); }
			else if (result.mode === "maxxedOut") { console.log("Maxxed out dude"); }
			else if (result.mode === "noMoreHits") { MturkPanda._this_GStats.addTotalPandaNoMore(); this.pandaStats[myId].addNoMore(); }
			else if (result.mode === "noQual") { console.log("Not qualified"); }
			else if (result.mode === "blocked") { console.log("You are blocked"); }
			else if (result.mode === "unknown") { console.log("unknown message: ",result.data.message); }
			else if (result.type === "ok.text" && result.url.includes("assignment_id=")) {
				this.logTabs.updateCaptcha(globalOpt.updateCaptcha());
				MturkPanda._this_GStats.addTotalAccepted();
				$(`#pcm_pandaCard_${myId}`).stop(true,true).effect( "highlight", {}, 15000 );
				this.pandaStats[myId].addAccepted();
				if (this.info[myId].autoTGoHam !== "disable" && (this.info[myId].autoGoHam || this.info[myId].autoTGoHam == "on")) {
					this.portPanda.postMessage({command:"goHam", queueUnique:queueUnique, tGoHam:this.info[myId].hamDuration});
				}
				this.portPanda.postMessage({command:"resetTimeStarted", queueUnique:queueUnique});
				const html = $.parseHTML( result.data );
				const targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div");
				const rawProps = $(targetDiv).find("span").attr("data-react-props");
				this.authenticityToken = $(html).find(`input[name="authenticity_token"]:first`).val();
				console.log(this.authenticityToken);
				const hitDetails = JSON.parse(rawProps).modalOptions;
				this.parseHitDetails(this.info[myId], hitDetails, myId);
				this.checkIfLimited(myId, true);
				alarms.doAlarms(this.info[myId]);
				this.logTabs.addIntoQueue(this, this.info[myId], hitDetails, result.url.replace("https://worker.mturk.com",""));
			} else if (result.type === "ok.text") { console.log("captcha found"); globalOpt.resetCaptcha(); }
		 });
	 }
 }
