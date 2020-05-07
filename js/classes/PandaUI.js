class PandaUI {
  constructor () {
		this.pandaStats = {};							// Object of PandaStats Class object with stats for each panda
		this.pandaCard = {};							// Object of PandaCard Class object for panda display in UI
		this.ctrlDelete = [];							// List of panda's selected for deletion by using ctrl key
		this.hitQueue = [];								// Array of panda's to add but delayed when multiple panda's get added at once
		this.hitsDelayed = false;					// Have adding hits been delayed because multiple panda's getting added at once?
		this.lastAdded = null;						// The time the last hit got added to delay adding hits slowly
		this.hamBtnBgColor = "";					// Default value for background color of the ham button from css file
		this.hamBtnColor = "";						// Default value for color of the ham button from css file
		this.tabs = new TabbedClass(			// Add in all the panda tabbed ID's for easy access to UI
			$(`#pcm_pandaSection`), `pcm_pandaTabs`, `pcm_tabbedPandas`, `pcm_pandaTabContents`);
		this.logTabs = new LogTabsClass(); 														// Functions dealing with the tabs in UI
		this.logTabs.updateCaptcha(globalOpt.getCaptchaCount());			// Show captcha count on bottom tabs
    this.pandaGStats =  new PandaGStats();												// Global stats for panda's
		chrome.runtime.onMessage.addListener( (request, sender) => { 	// used for external add buttons
			if (request.command.substring(0, 3)==="add") { this.addFromExternal(request); }
		});
  }
  preparePanda() { bgQueueClass.startQueueMonitor(); }
	nowLoggedOff() { modal.showLoggedOffModal( () => { bgPandaClass.unPauseTimer(); } ); }
  nowLoggedOn() { modal.closeModal("Program Paused!"); }
  cardPreviousColor(myId) { return $(`#pcm_pandaCard_${myId}`).data("previousColor"); }
  highlightEffect_gid(myId) { $(`#pcm_groupId_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 ); }
  highlightEffect_card(myId, action="", duration=15000) {
    let theColor = (action==="stop") ? "#FFA691" : "#ffff99";
    $(`#pcm_pandaCard_${myId}`).stop(true,true).effect( "highlight", {color:theColor}, duration );
  }
	enableAllHamButtons() {
		$(".pcm_hamButton").removeClass("disabled").addClass("pcm_buttonOff");
	}
	disableOtherHamButtons(myId=null) {
		if (myId!==null) $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		$(".pcm_hamButton.pcm_buttonOff").addClass("disabled");
	}
		hamButtonOn(myId) { $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn"); this.disableOtherHamButtons(myId); }
  hamButtonsOff() { this.enableAllHamButtons(); }
  collectingStatus(running, paused) { 
    if (!running) this.pandaGStats.collectingOff();
		if (paused) this.pandaGStats.collectingPaused(); else this.pandaGStats.collectingUnPaused();
  }
  stopEffect_card(myId) { $(`#pcm_pandaCard_${myId}`).stop(true,true); }
  stopItNow(myId, stopEffect=false, whyStop=null, newBgColor="") {
    if (stopEffect) this.stopEffect_card(myId); 
    if (newBgColor!=="") {
      $(`#pcm_pandaCard_${myId}`).data("previousColor1", $(`#pcm_pandaCard_${myId}`)
      .css("background-color")).css("background-color", newBgColor);
    }
		if (stopEffect) this.highlightEffect_card(myId,"stop",7500);
		this.stopCollecting(myId, true, whyStop);
  }
  cardEffectPreviousColor(myId, addPrev, bgColor="") {
    this.stopEffect_card(myId);
    if (addPrev) $(`#pcm_pandaCard_${myId}`).data("previousColor", $(`#pcm_pandaCard_${myId}`)
      .css("background-color")).css("background-color", bgColor);
    else {
      const prevColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
      $(`#pcm_pandaCard_${myId}`).removeData("previousColor").animate({"backgroundColor":prevColor},{duration:1000});
    }
  }
	showJobsModal(type="jobs", unique=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null) {
		modal.showJobsModal(this, type, unique, thisObj, saveFunc, checkFunc, cancelFunc); }
	startCollecting(myId, goHamStart=false, tempDuration=-1, tempGoHam=-1) {
		this.pandaGStats.addCollecting(); this.pandaGStats.collectingOn();
		this.pandaStats[myId].collecting = true;
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
    if (bgPandaClass.info[myId].autoGoHam) $(`#pcm_hamButton_${myId}`).addClass("pcm_delayedHam");
    bgPandaClass.startCollecting(myId, goHamStart, tempDuration, tempGoHam);
	}
	stopCollecting(myId, deleteFromQueue=false, whyStop=null) {
    bgPandaClass.stopCollecting(myId, deleteFromQueue, whyStop);
		if (this.pandaStats[myId].collecting) this.pandaGStats.subCollecting();
		this.pandaStats[myId].collecting = false;
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_delayedHam");
		const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
		if (previousColor) $(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
		bgPandaClass.info[myId].queueUnique = null; bgPandaClass.info[myId].autoTGoHam = "off";
	}
	removeJobs(jobsArr, afterFunc=null) {
		let bodyText = ""; const pandaInfo = bgPandaClass.info;
		jobsArr.forEach( (thisId) => {  bodyText += `( ${pandaInfo[thisId].reqName} [${pandaInfo[thisId].price}] )<BR>`; });
		modal.showDeleteModal(bodyText, () => {
			jobsArr.forEach( (thisId) => {
				this.stopCollecting(thisId, true)
				this.pandaCard[thisId].removeCard( () => {
					bgPandaClass.removePanda(thisId);
					delete this.pandaCard[thisId]; delete this.pandaStats[thisId];
					this.pandaGStats.subPanda();
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
			bgPandaClass.info[obj.myId].autoAdded = true;
			bgPandaClass.info[obj.myId].hitsAvailable = obj.hitsAvailable;
			this.pandaCard[obj.myId].updateAllCardInfo();
			this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam);
			if (this.hitsDelayed) {
				if (this.hitQueue.length===0) this.hitsDelayed = false;
				if (this.hitsDelayed) setTimeout(this.nextInDelayedQueue.bind(this), 1000);
			}
		} else setTimeout(this.nextInDelayedQueue.bind(this), 1000);
	}
	addFromExternal(msg) {
		const search = (msg.command==="addSearchJob" || msg.command==="addSearchOnceJob") ? "gid" : null;
		const once = (msg.command==="addOnceJob" || msg.command==="addSearchOnceJob");
		const run = (msg.command!=="addOnlyJob");
		const duration = ((search) ? 5000 : 20000);
		if (run) this.addAndRunPanda(msg.groupId, msg.description, decodeURIComponent(msg.title), msg.reqId, decodeURIComponent(msg.reqName), msg.price, once, search, 0, 0, 0, duration, duration, 4000 );
	}
  addAndRunPanda(groupId, description, title, reqId, reqName, price, once, search, hitsAvailable, limitNumQueue=0, limitTotalQueue=0, duration, tempDuration=-1, tempGoHam=-1, friendlyTitle = "", friendlyReqName = "" ) {
		// (groupId, description, title, reqId, reqName, price, once, search, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle="", friendlyReqName="") {
			let myId = null, diff = 0;
		if (bgPandaClass.pandaGroupIds.hasOwnProperty(groupId)) { myId = bgPandaClass.pandaGroupIds[groupId][0] }
		else myId = this.addPanda(groupId, description, title, reqId, reqName, price, once, search, limitNumQueue, limitTotalQueue, false, -1, duration, 0, hitsAvailable, 0, true, friendlyTitle, friendlyReqName);
		if (once && this.pandaStats[myId].accepted.value>0) return null;
		if (!this.pandaStats[myId].collecting) {
			const nowDate = new Date().getTime();
			this.hitQueue.push({myId:myId, price:price, hitsAvailable:hitsAvailable, tempDuration:tempDuration, tempGoHam:tempGoHam, delayedAt:nowDate});
			if (this.lastAdded!==null) diff = nowDate - this.lastAdded;
			else diff = 10000;
			if (diff<2000) {
				if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
				this.hitsDelayed = true;
				bgPandaClass.sendStatusToSearch(myId,true);
				setTimeout(this.nextInDelayedQueue.bind(this), 1000, diff);
				return null;
			}
			this.nextInDelayedQueue(diff);
		} else {
			let hitInfo = bgPandaClass.info[myId];
			hitInfo.hitsAvailable = hitsAvailable; hitInfo.reqName = reqName; hitInfo.reqId = reqId;
			hitInfo.title = title; hitInfo.description = description; hitInfo.price = price;
			this.pandaCard[myId].updateAllCardInfo();
		}
	}
	hamButtonClicked(myId, targetBtn, autoGoHam=false) {
		if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, !autoGoHam); }
		if (!autoGoHam && $(targetBtn).hasClass("pcm_buttonOff")) bgPandaClass.timerGoHam(bgPandaClass.info[myId].queueUnique);
		else if (!autoGoHam) bgPandaClass.timerHamOff();
	}
	searchCollecting(myId) { this.pandaCard[myId].pandaCollectingNow(); }
	searchDisabled(myId) { this.pandaCard[myId].pandaDisabled(); }
	searchingNow(myId) { this.pandaCard[myId].pandaSearchingNow(); }
  addPanda(groupId, description, title, reqId, reqName, price, once, search, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle="", friendlyReqName="") {
		const myId = bgPandaClass.addPanda(groupId, description, title, reqId, reqName, price, once, search, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable, tabUnique, autoAdded, friendlyTitle, friendlyReqName);
		let pandaInfo = bgPandaClass.info[myId];
		this.pandaCard[myId] = new PandaCard(myId, pandaInfo, this.tabs, tabUnique);
		this.hamBtnBgColor = $(`#pcm_hamButton_${myId}`).css("background-color");
    this.hamBtnColor = $(`#pcm_hamButton_${myId}`).css("color");
		this.pandaStats[myId] = new PandaStats(myId);
    if (bgPandaClass.isTimerGoingHam()) $(`#pcm_hamButton_${myId}`).addClass("disabled");
    this.pandaGStats.addPanda();
		$(`#pcm_pandaCard_${myId}`).click( e => {
			const targetBtn = $(e.target).closest(".pcm_pandaCard").find(".pcm_deleteButton");
			$(targetBtn).css("background-color", "");
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(myId)) { $(targetBtn).css("background-color", ""); this.ctrlDelete = arrayRemove(this.ctrlDelete,myId); }
				else { $(targetBtn).css("background-color", "red"); this.ctrlDelete.push(myId); }
			} else if (e.altKey) { this.ctrlDelete.length = 0; $(".pcm_deleteButton").css("background-color", ""); }
		})
		$(`#pcm_collectButton_${myId}`).click((e) => {
			const theButton = $(e.target).closest(".btn");
			if (theButton.is(".pcm_buttonOff:not(.pcm_searchOn), .pcm_searchDisable")) { console.log("time to search");
				pandaInfo.autoAdded = false; this.startCollecting(myId); }
			else this.stopCollecting(myId, true, "manual");
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
					pandaInfo.autoTGoHam = (pandaInfo.autoGoHam) ? "disable" : "off";
				} else { 
					pandaInfo.autoTGoHam = "on";
					$(targetBtn).css({"background-color": "#097e9b", "color":"#FFFFFF"}).addClass("pcm_delayedHam");
					this.hamButtonClicked(myId, targetBtn, true);
				}
			});
		$(`#pcm_deleteButton_${myId}`).click((e) => {
			if (!this.ctrlDelete.includes(myId)) this.ctrlDelete.push(myId);
			this.removeJobs(this.ctrlDelete);
		});
    $(`#pcm_detailsButton_${myId}`).click(() => { this.pandaCard[myId].showDetailsModal(this); });
    return myId;
  }
  hitAccepted(myId, queueUnique, result) {
    this.logTabs.updateCaptcha(globalOpt.updateCaptcha());
    this.pandaGStats.addTotalAccepted();
    this.highlightEffect_card(myId);
    this.pandaStats[myId].addAccepted();
		let pandaInfo = bgPandaClass.info[myId];
    if (pandaInfo.autoTGoHam !== "disable" &&
       (pandaInfo.autoGoHam || pandaInfo.autoTGoHam == "on")) {
      bgPandaClass.timerGoHam(queueUnique, pandaInfo.hamDuration);
    }
    bgPandaClass.resetTimerStarted(queueUnique);
    const html = $.parseHTML( result.data );
    const targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div");
    const rawProps = $(targetDiv).find("span").attr("data-react-props");
    bgPandaClass.authenticityToken = $(html).find(`input[name="authenticity_token"]:first`).val();
    const hitDetails = JSON.parse(rawProps).modalOptions;
    bgPandaClass.parseHitDetails(pandaInfo, hitDetails, myId);
    bgPandaClass.checkIfLimited(myId, true);
    alarms.doAlarms(pandaInfo);
    this.logTabs.addIntoQueue(this, pandaInfo, hitDetails, result.url.replace("https://worker.mturk.com",""));
	}
	gotNewQueue(queueResults) { this.logTabs.updateQueue(this, queueResults); }
}
