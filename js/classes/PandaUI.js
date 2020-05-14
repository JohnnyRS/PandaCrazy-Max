class PandaUI {
  constructor () {
		this.pandaCard = {};					// Object of PandaCard Class object for panda display in UI
		this.ctrlDelete = [];					// List of panda's selected for deletion by using ctrl key
		this.hitQueue = [];						// Array of panda's to add but delayed when multiple panda's get added at once
		this.hitsDelayed = false;			// Have adding hits been delayed because multiple panda's getting added at once?
		this.lastAdded = null;				// The time the last hit got added to delay adding hits slowly
		this.hamBtnBgColor = "";			// Default value for background color of the ham button from css file
		this.hamBtnColor = "";				// Default value for color of the ham button from css file
		this.newAddInfo = {};					// Temporary storage for new panda adds
		this.pandaStats = {};					// Object of PandaStats Class object with stats for each panda
		this.dbStatsName = "Pcm_PandaStats";		// Name for panda stats database
		this.collectStore = "collectionStore";	// Name for collection times storage in database
		this.acceptedStore = "acceptedStore";		// Name for accepted times storage in database
    this.dbStats = new DatabaseClass( this.dbStatsName, 1);
		this.tabs = new TabbedClass(			// Add in all the panda tabbed ID's for easy access to UI
			$(`#pcm_pandaSection`), `pcm_pandaTabs`, `pcm_tabbedPandas`, `pcm_pandaTabContents`);
		this.logTabs = new LogTabsClass(); 														// Functions dealing with the tabs in UI
		this.logTabs.updateCaptcha(globalOpt.getCaptchaCount());			// Show captcha count on bottom tabs
    this.pandaGStats =  new PandaGStats();												// Global stats for panda's
		chrome.runtime.onMessage.addListener( (request, sender) => { 	// used for external add buttons
			if (request.command.substring(0, 3)==="add") { this.addFromExternal(request); }
		});
		this.openStatsDB();
  }
	openStatsDB() { // Open or create database in the background first.
    return new Promise( (resolve, reject) => { // using a promise to make opening database synchronous so it waits
      this.dbStats.openDB( false, (e) => {
        if (e.oldVersion == 0) { // Had no database so let's initialise it.
          e.target.result.createObjectStore(this.collectStore, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("dbId", "dbId", {unique:false}); // dbId is an index to search faster
          e.target.result.createObjectStore(this.acceptedStore, {keyPath:"id", autoIncrement:"true"})
          	.createIndex("dbId", "dbId", {unique:false}); // dbId is an index to search faster
        }
      } ).then( response => resolve(response) ).catch( error => reject(error) );
    });
	}
	deleteFromStats(myId, dbId) {
		this.pandaStats[myId].deleteIdFromDB(dbId);
	}
	prepare(afterFunc) {
		this.tabs.prepare( ()  => {
			bgPanda.getAllPanda( () => { this.logTabs.prepare(); afterFunc.apply(this); bgQueue.startQueueMonitor(); } );
		});
	}
	nowLoggedOff() { modal.showLoggedOffModal( () => { bgPanda.unPauseTimer(); } ); }
  nowLoggedOn() { modal.closeModal("Program Paused!"); }
  cardPreviousColor(myId) { return $(`#pcm_pandaCard_${myId}`).data("previousColor"); }
  highlightEffect_gid(myId) { $(`#pcm_groupId_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 ); }
  highlightEffect_card(myId, action="", duration=15000) {
    let theColor = (action==="stop") ? "#FFA691" : "#ffff99";
    $(`#pcm_pandaCard_${myId}`).stop(true,true).effect( "highlight", {color:theColor}, duration );
  }
	enableAllHamButtons() { $(".pcm_hamButton").removeClass("disabled").addClass("pcm_buttonOff"); }
	disableOtherHamButtons(myId=null) {
		if (myId!==null) $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		$(".pcm_hamButton.pcm_buttonOff").addClass("disabled");
	}
	hamButtonOn(myId) { $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn"); this.disableOtherHamButtons(myId); }
	hamButtonsOff() { this.enableAllHamButtons(); }
	startAutoGoHam(myId) { $(`#pcm_hamButton_${myId}`).addClass("pcm_delayedHam"); }
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
		this.stopCollecting(myId, whyStop);
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
	showJobsModal(type="jobs", unique=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null) {
		bgPanda.getAllPanda( () => {
			modal.showJobsModal(type, unique, thisObj, saveFunc, checkFunc, cancelFunc, afterShow);
		}, false);
	}
	startCollecting(myId, goHamStart=false, tempDuration=-1, tempGoHam=-1) {
		if (this.pandaStats[myId].collecting) return;
		this.pandaGStats.addCollecting(); this.pandaGStats.collectingOn();
		this.pandaStats[myId].startCollecting();
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
    bgPanda.startCollecting(myId, goHamStart, tempDuration, tempGoHam);
	}
	stopCollecting(myId, whyStop=null, deleteData=true) {
		const hitInfo = bgPanda.info[myId];
    bgPanda.stopCollecting(myId, whyStop);
		if (this.pandaStats[myId].collecting) this.pandaGStats.subCollecting();
		const theStats = this.pandaStats[myId].stopCollecting();
		hitInfo.data.totalSeconds += theStats.seconds; hitInfo.data.totalAccepted += theStats.accepted;
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_delayedHam");
		const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
		if (previousColor) $(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
		bgPanda.updateDbData(myId, hitInfo.data);
		if (deleteData) bgPanda.info[myId].data = null;
		hitInfo.queueUnique = null; hitInfo.autoTGoHam = "off";
	}
	removeJobs(jobsArr, afterFunc=null) {
		let bodyText = "";
		jobsArr.forEach( (thisId) => {
			bodyText += "( "+$(`#pcm_hitReqName_${thisId}`).html()+" "+[$(`#pcm_hitPrice_${thisId}`).html()]+" )<BR>";
		});
		modal.showDeleteModal(bodyText, () => {
			jobsArr.forEach( (myId) => {
				bgPanda.db.getFromDB(bgPanda.storeName, "get", bgPanda.info[myId].dbId).then( (r) => {
					bgPanda.info[myId].data = r;
					this.stopCollecting(myId,null,false)
					this.pandaCard[myId].removeCard( () => {
						bgPanda.removePanda(myId, true);
						delete this.pandaCard[myId]; delete this.pandaStats[myId];
						this.pandaGStats.subPanda();
						if (afterFunc!==null) afterFunc.apply(this);
					});
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
			bgPanda.info[obj.myId].data.autoAdded = true;
			bgPanda.info[obj.myId].hitsAvailable = obj.hitsAvailable;
			this.pandaCard[obj.myId].updateAllCardInfo(bgPanda.info[obj.myId]);
			this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam);
			if (this.hitsDelayed) {
				if (this.hitQueue.length===0) this.hitsDelayed = false;
				if (this.hitsDelayed) setTimeout(this.nextInDelayedQueue.bind(this), 1000);
			}
		} else setTimeout(this.nextInDelayedQueue.bind(this), 1000);
	}
	hamButtonClicked(myId, targetBtn, autoGoHam=false) {
		if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, !autoGoHam); }
		if (!autoGoHam && $(targetBtn).hasClass("pcm_buttonOff")) bgPanda.timerGoHam(bgPanda.info[myId].queueUnique);
		else if (!autoGoHam) bgPanda.timerHamOff();
	}
	searchCollecting(myId) { this.pandaCard[myId].pandaCollectingNow(); }
	searchDisabled(myId) { this.pandaCard[myId].pandaDisabled(); }
	searchingNow(myId) { this.pandaCard[myId].pandaSearchingNow(); }
	runThisPanda(myId, tempDuration, tempGoHam) {
		let hitInfo = bgPanda.info[myId], diff = 0;
		if (hitInfo.data.once && this.pandaStats[myId].accepted.value>0) return null;
		if (!this.pandaStats[myId].collecting) {
			const nowDate = new Date().getTime();
			this.hitQueue.push({myId:myId, price:hitInfo.data.price, hitsAvailable:hitInfo.hitsAvailable, tempDuration:tempDuration, tempGoHam:tempGoHam, delayedAt:nowDate});
			if (this.lastAdded!==null) diff = nowDate - this.lastAdded;
			else diff = 10000;
			if (diff<2000) {
				if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
				this.hitsDelayed = true;
				bgPanda.sendStatusToSearch(myId,true);
				setTimeout(this.nextInDelayedQueue.bind(this), 1000, diff);
				return null;
			}
			this.nextInDelayedQueue(diff);
		} else { this.pandaCard[myId].updateAllCardInfo(hitInfo); }
		this.newAddInfo = {};
	}
	addFromExternal(msg) {
		// msg = object data for a panda job from external scripts
		const search = (msg.command==="addSearchJob" || msg.command==="addSearchOnceJob") ? "gid" : null; // Search Job
		const once = (msg.command==="addOnceJob" || msg.command==="addSearchOnceJob"); // Accept only 1
		const run = (msg.command!=="addOnlyJob"); // Run this job after adding
		const duration = ((search) ? 10000 : 120000); // Searches stops after 10 seconds. All others 2 minutes
		this.addPanda(msg.groupId, msg.description, decodeURIComponent(msg.title), msg.reqId, decodeURIComponent(msg.reqName), msg.price, once, search, 0, 0, 0, false, -1, -1, 0, 0, false, "", "", run, true, duration, 4000);
	}
	addPandaDB(r) { bgPanda.addPanda(r, 0, false); }
	addPanda(groupId, description, title, reqId, reqName, price, once, search, hitsAvailable=0, limitNumQueue=0, limitTotalQueue=0, autoGoHam=false, hamDuration=-1, duration=-1, acceptLimit=0, tabUnique=0, autoAdded=false, friendlyTitle="", friendlyReqName="", run=false, external=false, tempDuration=-1, tempGoHam=-1) {
		const dated = new Date().getTime(); // get the date that this job was added.
		if (external && bgPanda.pandaGroupIds.hasOwnProperty(groupId)) {
			function fillNewInfo(hitInfo, myId, tempDuration, tempGoHam) {
				hitInfo.hitsAvailable = hitsAvailable; hitInfo.data.reqName = reqName; hitInfo.data.reqId = reqId;
				hitInfo.data.title = title; hitInfo.data.description = description; hitInfo.data.price = price;
				this.runThisPanda(myId, tempDuration, tempGoHam);
			}
			const myId=bgPanda.pandaGroupIds[groupId][0], hitInfo=bgPanda.info[myId];
			if (hitInfo.data) fillNewInfo.call(this, hitInfo, myId, tempDuration, tempGoHam);
			else bgPanda.getDbData(myId, (r) => { 
				hitInfo.data = r; fillNewInfo.call(this, hitInfo, myId, tempDuration, tempGoHam); });
		} else {
			let dbInfo = { groupId:groupId, description:description, title:title, reqId:reqId, reqName:reqName, price:price, limitNumQueue:limitNumQueue, limitTotalQueue:limitTotalQueue, autoGoHam:autoGoHam, hamDuration:hamDuration, duration:duration, friendlyTitle:friendlyTitle, friendlyReqName:friendlyReqName, assignedTime:null, expires:null, dateAdded: dated, tabUnique:tabUnique, positionNum:null, once:once, search:search, acceptLimit:acceptLimit, totalSeconds:0, totalAccepted:0 };
			// save these values in a temporary array to come back to them after adding panda info in panda class
			this.newAddInfo.tempDuration = tempDuration; this.newAddInfo.tempGoHam = tempGoHam;
			this.newAddInfo.run = run;
			// Add panda info in panda class and databse and then call addPandaToUI
			bgPanda.addPanda(dbInfo, hitsAvailable, autoAdded);
		}
	}
	addPandaToUI(myId, pandaInfo, loaded=false) {
		this.pandaCard[myId] = new PandaCard(myId, pandaInfo, this.tabs, pandaInfo.tabUnique);
		this.hamBtnBgColor = $(`#pcm_hamButton_${myId}`).css("background-color");
    this.hamBtnColor = $(`#pcm_hamButton_${myId}`).css("color");
		this.pandaStats[myId] = new PandaStats(myId, pandaInfo.dbId);
    if (bgPanda.isTimerGoingHam()) $(`#pcm_hamButton_${myId}`).addClass("disabled");
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
			if (theButton.is(".pcm_buttonOff:not(.pcm_searchOn), .pcm_searchDisable")) {
				pandaInfo.autoAdded = false; this.startCollecting(myId); }
			else this.stopCollecting(myId, "manual");
		});
		if (pandaInfo.data.search && loaded) this.searchDisabled(myId);
		$(`#pcm_hamButton_${myId}`).click((e) => { 
			const targetBtn = $(e.target).closest(".btn");
			if ($(targetBtn).data("longClicked")) { $(targetBtn).removeData("longClicked"); $(targetBtn).css({"background-color": "", "color": ""});}
			else { this.hamButtonClicked(myId, targetBtn); }
		}).mayTriggerLongClicks( { delay: 1200 }).on('longClick', (e) => {
				const targetBtn = $(e.target).closest(".btn");
				$(targetBtn).data("longClicked",true);
				if ($(targetBtn).hasClass("pcm_delayedHam")) {
					$(targetBtn).css({"background-color":this.hamBtnBgColor, "color":this.hamBtnColor}).removeClass("pcm_delayedHam");
					pandaInfo.autoTGoHam = (pandaInfo.data.autoGoHam) ? "disable" : "off";
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
		$(`#pcm_detailsButton_${myId}`).click(() => { this.pandaCard[myId].showDetailsModal(); });
		if (this.newAddInfo.run) this.runThisPanda(myId, this.newAddInfo.tempDuration, this.newAddInfo.tempGoHam);
    return myId;
  }
  hitAccepted(myId, queueUnique, result, data) {
    this.logTabs.updateCaptcha(globalOpt.updateCaptcha());
    this.pandaGStats.addTotalAccepted();
    this.highlightEffect_card(myId);
    this.pandaStats[myId].addAccepted();
		let pandaInfo = bgPanda.info[myId];
    if (pandaInfo.autoTGoHam !== "disable" &&
       (pandaInfo.data.autoGoHam || pandaInfo.autoTGoHam == "on")) {
      bgPanda.timerGoHam(queueUnique, pandaInfo.data.hamDuration);
    }
    bgPanda.resetTimerStarted(queueUnique);
    const html = $.parseHTML( result.data );
    const targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div");
    const rawProps = $(targetDiv).find("span").attr("data-react-props");
    bgPanda.authenticityToken = $(html).find(`input[name="authenticity_token"]:first`).val();
    const hitDetails = JSON.parse(rawProps).modalOptions;
    bgPanda.parseHitDetails(hitDetails, myId);
    bgPanda.checkIfLimited(myId, true);
    alarms.doAlarms(pandaInfo);
    this.logTabs.addIntoQueue(this, pandaInfo, hitDetails, data, result.url.replace("https://worker.mturk.com",""));
	}
	gotNewQueue(queueResults) { this.logTabs.updateQueue(this, queueResults); }
}
