/**
 * @class PandaUI
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class PandaUI {
  constructor () {
		this.pandaCard = {};								// Object of PandaCard Class object for panda display in UI
		this.ctrlDelete = [];								// List of panda's selected for deletion by using ctrl key
		this.hitQueue = [];									// Array of panda's to add delayed when multiple panda's get added at once
		this.lastAdded = null;							// The time the last hit got added to delay adding hits slowly
		this.hamBtnBgColor = "";						// Default value for background color of the ham button from css file
		this.hamBtnColor = "";							// Default value for color of the ham button from css file
		this.pandaStats = {};								// Object of PandaStats Class object with stats for each panda
		this.tabs = null;										// The tabbed area where the panda card will go to.
		this.logTabs = null;								// The log tabs on the bottom of the page with queue watch.
		this.pandaGStats = null;						// The global stats for all the panda's and display stats to status area.
		this.delayedTimeout = null;
		this.dbStatsName = "Pcm_PandaStats";		// Name for panda stats database
		this.collectStore = "collectionStore";	// Name for collection times storage in database
		this.acceptedStore = "acceptedStore";		// Name for accepted times storage in database
		this.dbStats = new DatabaseClass(this.dbStatsName, 1); // The stat database for logging of panda stats.
		this.listener = new ListenerClass();
		this.modalJob = new ModalJobClass();
	}
	/** Gets the total hits in the queue.
   * @return {number} - Total hits in the queue. */
	getQueueTotal() { return this.logTabs.queueTotal; }
	/** Opens the stat database and creates the stores if needed.
	 * @return {Promise<response|Error>} -  */
	openStatsDB() { // Open or create database in the background first.
		return new Promise( (resolve, reject) => { // using a promise to make opening database synchronous so it waits
			this.dbStats.openDB( false, (e) => {
				if (e.oldVersion == 0) { // Had no database so let's initialise it.
					e.target.result.createObjectStore(this.collectStore, {keyPath:"id", autoIncrement:"true"})
					.createIndex("dbId", "dbId", {unique:false}); // dbId is an index to search faster
					e.target.result.createObjectStore(this.acceptedStore, {keyPath:"id", autoIncrement:"true"})
					.createIndex("dbId", "dbId", {unique:false}); // dbId is an index to search faster
				}
			} ).then( response => resolve(response), rejected => { console.error(rejected); reject(rejected); });
		});
	}
	/** Delete the panda stats from the stat database for this panda with this unique ID and database ID.
	 * @param  {number} myId - The unique ID for a panda job.
	 * @param  {number} dbId - The unique database ID for a panda job. */
	deleteFromStats(myId, dbId) {
		this.pandaStats[myId].deleteIdFromDB(dbId);
	}
	/** Loads up any panda jobs that are saved or saves default panda jobs if database was just created.
	 * If loaded up data is done then start queue monitor and removes panda data to save memory.
   * Saves any errors from trying to add to database and then sends a reject.
	 * @async												- To wait for the tabs to completely load from the database.
	 * @param  {function} afterFunc - Function to call after done to send success array or error object. */
	async prepare(afterFunc) {
		let success = [], err = null;
		this.openStatsDB();
		this.tabs = new TabbedClass(			// Add in all the panda tabbed ID's for easy access to UI
			$(`#pcm_pandaSection`), `pcm_pandaTabs`, `pcm_tabbedPandas`, `pcm_pandaTabContents`);
		this.logTabs = new LogTabsClass(); 		// Functions dealing with the tabs in UI
		this.logTabs.updateCaptcha(globalOpt.getCaptchaCount());			// Show captcha count on bottom tabs
		this.pandaGStats =  new PandaGStats();												// Global stats for panda's
		[success[0], err] = await this.tabs.prepare();
		if (!err) {
			// Use initializing default if database wasn't created yet.
			if (bgPanda.useDefault) await this.addPanda(dataObject("3SHL2XNU5XNTJYNO5JDRKKP26VU0PY", "Tell us if two receipts are the same", "Tell us if two receipts are the same", "AGVV5AWLJY7H2", "Ibotta, Inc.", "0.01"), optObject(),_,_,_,_,_,true);
			else err = await bgPanda.getAllPanda(); // Not using initializing default value so load from database
			if (!err) {
				[success[1], err] = await this.logTabs.prepare();
				if (!err) {
					let tabUniques = this.tabs.getUniques(), dbIds = Object.keys(bgPanda.dbIds);
					for (const unique of tabUniques) {
						let positions = this.tabs.getpositions(unique);
						for (const dbId of positions) {
							const myId = bgPanda.getMyId(dbId);
							dbIds = arrayRemove(dbIds, dbId.toString());
							if (bgPanda.info.hasOwnProperty(myId)) {
								this.addPandaToUI(myId, bgPanda.info[myId], null, true);
							} else  this.tabs.removePosition(unique, dbId);
						}
					}
					if (dbIds.length>0) {
						for (const dbId of dbIds) {
							const myId = bgPanda.getMyId(dbId);
							bgPanda.info[myId].tabUnique = 0;
							this.addPandaToUI(myId, bgPanda.info[myId], null, true);
						}
					}
					bgPanda.useDefault = false;
					bgPanda.nullData();
				}
			}
		}
		afterFunc(success, err);
	}
	/** Shows the logged off modal and after it will unpause the timer. */
	nowLoggedOff() {
		modal.showLoggedOffModal( () => { bgPanda.unPauseTimer(); } );
		if (globalOpt.isNotifications() && !bgPanda.isLoggedOff()) notify.showLoggedOff();
	}
  /** Closes the logged off modal if it's opened. */
  nowLoggedOn() { modal.closeModal("Program Paused!"); }
  /** Make the color of the panda card with this unique ID to the previous color in the card data.
   * @param  {number} myId - The unique ID for a panda job. */
  cardPreviousColor(myId) { return $(`#pcm_pandaCard_${myId}`).data("previousColor"); }
  /** Highlight the panda card's gid number with this unique ID.
   * @param  {number} myId - The unique ID for a panda job. */
  highlightEffect_gid(myId) { $(`#pcm_groupId_${myId}, #pcm_buttonGroup1_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 ); }
  /** Highlight the panda card according to the action and duration.
   * @param  {number} myId 						 - The unique ID for a panda job.
   * @param  {string} [action=""] 		 - The action that will be causing the highlight effect.
   * @param  {number} [duration=15000] - The duration the highlight effect should last. */
  highlightEffect_card(myId, action="", duration=15000) {
    let theColor = (action==="stop") ? "#FFA691" : "#ffff99";
    $(`#pcm_pandaCard_${myId}`).stop(true,true).effect( "highlight", {color:theColor}, duration );
  }
	/** Enable all the ham buttons on the page. */
	enableAllHamButtons() { $(".pcm_hamButton").removeClass("disabled").removeClass("pcm_buttonOn").addClass("pcm_buttonOff"); }
	/** Disable all other ham buttons which don't use the unique ID for the panda job.
	 * @param  {number} [myId=null] - The unique ID for a panda job. */
	disableOtherHamButtons(myId=null) {
		if (myId!==null) $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		$(".pcm_hamButton.pcm_buttonOff").addClass("disabled");
	}
	/** Turn on the ham button for this panda job with the unique ID.
	 * @param  {number} myId - The unique ID for a panda job. */
	hamButtonOn(myId) {
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		this.disableOtherHamButtons(myId);
	}
	/** Turn off all the ham buttons on the page. */
	hamButtonsOff() { this.enableAllHamButtons(); }
	/** Show that this ham button with this unique ID is in auto go ham mode.
	 * @param  {number} myId - The unique ID for a panda job. */
	startAutoGoHam(myId) { $(`#pcm_hamButton_${myId}`).addClass("pcm_delayedHam"); }
  /** Gets the status from the timer and shows the status on the page.
   * @param  {bool} running - Represents the running status of the panda timer.
   * @param  {bool} paused  - Represents if panda timer is paused or not. */
  collectingStatus(running, paused) { 
    if (!running) this.pandaGStats.collectingOff();
		if (paused) this.pandaGStats.collectingPaused(); else this.pandaGStats.collectingUnPaused();
  }
  /** Stop any effect for the card with the unique ID.
   * @param  {number} myId - The unique ID for a panda job. */
  stopEffect_card(myId) { $(`#pcm_pandaCard_${myId}`).stop(true,true); }
  /** Show that this panda is not collecting anymore and show effect or a new background color.
   * @param  {number} myId 						 - The unique ID for a panda job.
   * @param  {bool} [stopEffect=false] - Should any card effect be stopped?
   * @param  {string} [whyStop=null]	 - The reason why this panda is stopping.
   * @param  {string} [newBgColor=""]	 - The new background color of the panda card. */
  stopItNow(myId, stopEffect=false, whyStop=null, newBgColor="") {
    if (stopEffect) this.stopEffect_card(myId); 
    if (newBgColor!=="") {
      $(`#pcm_pandaCard_${myId}`).data("previousColor1", $(`#pcm_pandaCard_${myId}`).data('stopped',whyStop)
      .css("background-color")).css("background-color", newBgColor);
    }
		if (stopEffect) this.highlightEffect_card(myId,"stop",7500);
		this.stopCollecting(myId, whyStop);
  }
  /** Either change background color to provided color and save the previous color or change the
	 * background color to the previous color saved in data and remove the previous color data.
   * @param  {number} myId 				 - The unique ID for a panda job.
   * @param  {bool} addPrev				 - Add previous color data to the panda card.
   * @param  {string} [bgColor=""] - The new background color or leave it as is. */
  cardEffectPreviousColor(myId, addPrev, bgColor="") {
    this.stopEffect_card(myId);
    if (addPrev) $(`#pcm_pandaCard_${myId}`).data("previousColor", $(`#pcm_pandaCard_${myId}`)
      .css("background-color")).css("background-color", bgColor);
    else {
      const prevColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
      $(`#pcm_pandaCard_${myId}`).removeData("previousColor").animate({"backgroundColor":prevColor},{duration:1000});
    }
  }
  /** Change the information displayed on all the panda cards to normal, minimal or one liner.
   * @param  {number} display - The number representing the info displayed in the panda card. */
  changeDisplay(display) {
		globalOpt.setCardDisplay(display);
		for (const myId in Object.keys(this.pandaCard)) {
			this.pandaCard[myId].updateCardDisplay();
		}
	}
	/** Show the jobs modal for editing panda jobs or panda jobs in a grouping.
	 * It will also load all panda's from the database and wait for successful load.
	 * @async																- To wait for all the data for panda's to be loaded from database.
	 * @param  {string} [type="jobs"]				- The type of data that is being edited.
	 * @param  {number} [groupings=-1]			- The unique ID for the grouping that will be edited.
	 * @param  {object} [thisObj=null]			- The grouping object that is being edited.
	 * @param  {function} [saveFunc=null]		- Function to call when the save button is clicked.
	 * @param  {function} [checkFunc=null]  - Function to call when checkbox clicked on a job.
	 * @param  {function} [cancelFunc=null] - Function to call when the cancel button is clicked.
	 * @param  {function} [afterShow=null]  - Function to call when modal is shown after animation effects. */
	async showJobsModal(type="jobs", groupings=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null) {
		let err = await bgPanda.getAllPanda(false); // Just loading all panda data into memory.
		if (err) {
			this.haltScript(err, 'Failed getting data from database for all panda\'s so had to end script.', 'Error getting panda data. Error:');
		}
		this.modalJob.showJobsModal(type, groupings, thisObj, saveFunc, checkFunc, cancelFunc, afterShow);
	}
	/** Start panda job collecting with this unique ID and set the duration for collecting and go ham.
	 * Also starts the goham at start if neccesary.
	 * @async														 - To wait for the loading of the data from the database.
	 * @param  {number} myId 						 - The unique ID for a panda job.
	 * @param  {bool} [goHamStart=false] - Should the panda go ham at the start?
	 * @param  {number} [tempDuration=0] - The duration for this panda job to collect for.
	 * @param  {number} [tempGoHam=0]		 - The duration for the temporary go ham to stay on. */
	async startCollecting(myId, goHamStart=false, tempDuration=0, tempGoHam=0) {
		if (!this.pandaStats[myId].collecting) { // Make sure this panda is not collecting.
			let goodCollect = await bgPanda.startCollecting(myId, goHamStart, tempDuration, tempGoHam);
			if (goodCollect) {
				this.logTabs.addToStatus(bgPanda.info[myId].data, this.pandaStats[myId], myId);
				this.pandaGStats.addCollecting(); this.pandaGStats.collectingOn();
				this.pandaStats[myId].startCollecting();
				$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
				$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
			}
		}
	}
	/** Stop panda job collecting with this unique ID and delete from database if needed.
	 * @async														- To wait for the updating of the data to the database.
	 * @param  {number} myId 						- The unique ID for a panda job.
	 * @param  {string} [whyStop=null]	- The reason why the panda job is stopping.
	 * @param  {bool} [deleteData=true]	- Should the data in the database be deleted also? */
	async stopCollecting(myId, whyStop=null, deleteData=true) {
		const hitInfo = bgPanda.info[myId];
		if (whyStop === 'manual') this.pandaCard[myId].collectTipChange('');
		if (this.pandaStats[myId].collecting) this.pandaGStats.subCollecting();
		const theStats = this.pandaStats[myId].stopCollecting();
		hitInfo.data.totalSeconds += theStats.seconds; hitInfo.data.totalAccepted += theStats.accepted;
		const hitData = Object.assign({}, hitInfo.data);
    bgPanda.stopCollecting(myId, hitData, whyStop);
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOn").addClass("pcm_buttonOff");
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_delayedHam");
		const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
		if (previousColor && !hitInfo.skipped) $(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
		await bgPanda.updateDbData(myId, hitData);
		this.logTabs.removeFromStatus(myId);
		if (deleteData && !hitInfo.skipped) bgPanda.info[myId].data = null;
		hitInfo.queueUnique = null; hitInfo.autoTGoHam = "off";
	}
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr						 - The array of jobs unique ID's to delete.
	 * @param  {function} [afterFunc=null] - The function to call after remove animation effects are finished. */
	removeJobs(jobsArr, afterFunc=null) {
		let bodyText = "";
		jobsArr.forEach( (thisId) => {
			bodyText += "( "+$(`#pcm_hitReqName_${thisId}`).html()+" "+[$(`#pcm_hitPrice_${thisId}`).html()]+" )<BR>";
		});
		modal.showDeleteModal(bodyText, () => {
			jobsArr.forEach( (myId) => {
				bgPanda.db.getFromDB(bgPanda.storeName, bgPanda.info[myId].dbId).then( (r) => {
					bgPanda.info[myId].data = r;
					this.tabs.removePosition(bgPanda.info[myId].data.tabUnique, bgPanda.info[myId].dbId);
					this.stopCollecting(myId,null,false)
					this.pandaCard[myId].removeCard( () => {
						bgPanda.removePanda(myId, true);
						delete this.pandaCard[myId]; delete this.pandaStats[myId];
						this.pandaGStats.subPanda();
						if (afterFunc!==null) afterFunc();
					});
				}, rejected => console.error(rejected));
			});
			modal.closeModal();
			jobsArr.length = 0;
		}, null, () => { jobsArr.length = 0; $(".pcm_deleteButton").css("background-color", ""); });
	}
	/** Show that this ham button was clicked or went into go ham mode automatically.
	 * @async														- So it waits to get the queueUnique before using it.
	 * @param  {number} myId 						- The unique ID for a panda job.
	 * @param  {object} targetBtn				- The ham button that was clicked.
	 * @param  {bool} [autoGoHam=false] - Should this ham button show it started automatically? */
	async hamButtonClicked(myId, targetBtn, autoGoHam=false) {
		if (!this.pandaStats[myId].collecting) { await this.startCollecting(myId, !autoGoHam); }
		else if (targetBtn.hasClass("pcm_buttonOff") && targetBtn.hasClass("pcm_delayedHam")) bgPanda.timerGoHam(bgPanda.info[myId].queueUnique);
		else bgPanda.timerHamOff();
	}
	/** Show that this panda search job is collecting in panda mode.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchCollecting(myId) { this.pandaCard[myId].pandaCollectingNow(); }
	/** Show that this panda search job is disabled and not being searched anymore.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchDisabled(myId) { this.pandaCard[myId].pandaDisabled(); }
	/** Show that this panda search job is being searched on the search page by the search class.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchingNow(myId) { this.pandaCard[myId].pandaSearchingNow(); }
	/** When panda's are coming in externally too fast they need to delay collecting for 1600 milliseconds each.
	 * This is a recursive method which will go through the delayed hitqueue and began collecting one by one.
	 * @param  {number} [diff=null] - The difference of time since the last panda was added. */
	nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length>0) {
			if (diff === null) diff = new Date().getTime() - this.lastAdded;
			if (diff === -1 || diff >= this.hitQueue[0].lowestDur) {
				const obj = this.hitQueue.shift();
				this.lastAdded = new Date().getTime();
				bgPanda.info[obj.myId].data.autoAdded = true;
				bgPanda.info[obj.myId].hitsAvailable = obj.hitsAvailable;
				this.pandaCard[obj.myId].updateAllCardInfo(bgPanda.info[obj.myId]);
				this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam);
				if (this.hitQueue.length===0) { this.lastAdded = null; this.delayedTimeout = null; }
				else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
			} else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
		} else this.delayedTimeout = null;
	}
	/** Run this panda after adding it to panda class with a temporary duration and temporary go ham duration.
	 * @param  {number} myId 				 - The unique ID for a panda job.
	 * @param  {number} tempDuration - The temporary duration to use for this panda job.
	 * @param  {number} tempGoHam		 - The temporary go ham duration to use for this panda job. */
	runThisPanda(myId, tempDuration, tempGoHam, thisNew=true) {
		let hitInfo = bgPanda.info[myId], diff = null;
		bgPanda.checkIfLimited(myId,false, true);
		if (!this.pandaStats[myId].collecting) {
			const nowDate = new Date().getTime();
			this.hitQueue.push({myId:myId, price:hitInfo.data.price, hitsAvailable:hitInfo.hitsAvailable, tempDuration: tempDuration, tempGoHam:tempGoHam, delayedAt:nowDate, lowestDur:Math.min(tempDuration, tempGoHam)});
			if (this.lastAdded!==null) {
				diff = nowDate - this.lastAdded;
				if (diff < this.hitQueue[0].lowestDur) {
					if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
					bgPanda.sendStatusToSearch(myId,true); 
					if (!this.delayedTimeout) this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500, diff);
				} else this.nextInDelayedQueue(diff);
			} else this.nextInDelayedQueue(-1);
		} else { this.pandaCard[myId].updateAllCardInfo(hitInfo); }
	}
	/** Add panda job from an external source like forums, script or panda buttons on mturk.
	 * @param  {object} msg - The message object from the external source. */
	addFromExternal(msg) {
		if (msg.groupId !== '' && msg.reqId !== '') {
			const search = (msg.command==="addSearchJob" || msg.command==="addSearchOnceJob") ? "gid" : null;
			const once = (msg.command==="addOnceJob" || msg.command==="addSearchOnceJob"); // Accept only 1
			const run = (msg.command!=="addOnlyJob"); // Run this job after adding
			const duration = ((search) ? 10000 : 120000); // Searches stops after 10 seconds. All others 2 minutes
			let data = dataObject(msg.groupId, msg.description, decodeURIComponent(msg.title), msg.reqId, decodeURIComponent(msg.reqName), msg.price);
			let opt = optObject(once, search);
			this.addPanda(data, opt, true, run,_, duration, 4000);
		}
	}
	/** Add panda from search triggers. Is used to use search jobs instead of adding a new hit if not needed.
	 * @param  {object} data			   - Object with all data for hit filled in.
	 * @param  {object} opt			     - Object with all the options set for this hit.
	 * @param  {object} add			     - Was this hit auto added?
	 * @param  {object} run			     - Should this hit automatically run when added?
	 * @param  {bool} ext			       - Did this panda job get added from an external source?
	 * @param  {number} tempDuration - The temporary duration to collect on the first collection run.
	 * @param  {number} tempGoHam		 - The temporary duration to go ham for on the first collection run.
	 */
	addFromSearch(data, opt, add, run, ext, tempDuration, tempGoHam) {
		bgPanda.checkSearches(data.groupId);
		this.addPanda(data, opt, add, run, ext, tempDuration, tempGoHam);
	}
	/** Add panda from the database.
	 * @param  {object} r - The object of the panda job that needs to be added. */
	addPandaDB(r) {
		let update = false, tabUniques = this.tabs.getUniques();
		if (!tabUniques.includes(r.tabUnique)) { r.tabUnique = tabUniques[0]; update = true; }
		bgPanda.addPanda(r, 0, false, {}, update, true);
	}
	/** Add a new panda job with lot of information and options to the panda area and database.
	 * Search class uses this to add hits.
	 * @async														 - To wait for the data to be loaded from database if needed.
	 * @param  {object} [d={}]			     - Object with all data for hit filled in.
	 * @param  {object} [opt={}]			   - Object with all the options set for this hit.
	 * @param  {object} [add=false]			 - Was this hit auto added?
	 * @param  {object} [run=false]			 - Should this hit automatically run when added?
	 * @param  {bool} [run=false]				 - Should this panda job run after completely added?
	 * @param  {bool} [ext=false]			   - Did this panda job get added from an external source?
	 * @param  {number} [tempDuration=0] - The temporary duration to collect on the first collection run.
	 * @param  {number} [tempGoHam=0]		 - The temporary duration to go ham for on the first collection run.
	 * @param  {bool}	[loaded=false]		 - Was this panda loaded? Used for default values. */
	async addPanda(d={}, opt={}, add=false, run=false, ext=false, tempDuration=0, tempGoHam=0, loaded=false) {
		const dated = new Date().getTime(); // get the date that this job was added.
		if (ext && bgPanda.pandaGroupIds.hasOwnProperty(d.groupId)) {
			const myId=bgPanda.pandaGroupIds[d.groupId][0], hitInfo=bgPanda.info[myId];
			if (!hitInfo.data) await bgPanda.getDbData(myId);
			hitInfo.hitsAvailable = d.hitsAvailable; hitInfo.data.reqName = d.reqName; hitInfo.data.reqId = d.reqId;
			hitInfo.data.title = d.title; hitInfo.data.description = d.description; hitInfo.data.price = d.price;
			this.runThisPanda(myId, tempDuration, tempGoHam);
		} else {
			if (opt.tabUnique === -1) opt.tabUnique = this.tabs.getTabInfo(this.tabs.currentTab).id;
			let dbInfo = {...d, ...opt, 'dateAdded': dated, positionNum:null, totalSeconds:0, totalAccepted:0};
			let newAddInfo = {'tempDuration':tempDuration, 'tempGoHam':tempGoHam, 'run':run};
			await bgPanda.addPanda(dbInfo, d.hitsAvailable, add, newAddInfo, false, loaded);
		}
	}
	/** Add this panda job to the panda UI with a card and stats.
	 * @param  {number} myId 				 - The unique ID for a panda job.
	 * @param  {object} pandaInfo		 - The information data for this panda.
	 * @param  {bool} [loaded=false] - Was this loaded from the database or not?
	 * @return {number}							 - The unique ID for this panda job. */
	addPandaToUI(myId, pandaInfo, newAddInfo, loaded=false) {
		this.pandaCard[myId] = new PandaCard(myId, pandaInfo, this.tabs, pandaInfo.data.tabUnique, loaded);
		this.hamBtnBgColor = $(`#pcm_hamButton_${myId}`).css("background-color");
    this.hamBtnColor = $(`#pcm_hamButton_${myId}`).css("color");
		this.pandaStats[myId] = new PandaStats(myId, pandaInfo.dbId);
    if (bgPanda.isTimerGoingHam()) $(`#pcm_hamButton_${myId}`).addClass("disabled");
    this.pandaGStats.addPanda();
		$(`#pcm_pandaCard_${myId}`).click( e => {
			const targetBtn = $(e.target).closest(".pcm_pandaCard").find(".pcm_deleteButton");
			targetBtn.css("background-color", "");
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(myId)) { targetBtn.css("background-color", ""); this.ctrlDelete = arrayRemove(this.ctrlDelete,myId); }
				else { targetBtn.css("background-color", "red"); this.ctrlDelete.push(myId); }
			} else if (e.altKey) { this.ctrlDelete.length = 0; $(".pcm_deleteButton").css("background-color", ""); }
		})
		$(`#pcm_collectButton_${myId}, #pcm_collectButton1_${myId}`).click((e) => {
			const theButton = $(e.target).closest(".btn");
			let stopped = $(`#pcm_pandaCard_${myId}`).data('stopped');
			if (stopped === "noQual" || stopped === "blocked") {
				if (this.pandaStats[myId].collecting) this.stopCollecting(myId, "manual");
			} else if (theButton.is(".pcm_buttonOff:not(.pcm_searchOn), .pcm_searchDisable")) {
				pandaInfo.autoAdded = false;
				if (pandaInfo.search !== 'rid') this.startCollecting(myId, false, (pandaInfo.search === 'gid') ? 10000 : 0);
				else if (pandaInfo.search === 'rid') {
					$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
					$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
					bgPanda.doSearching(myId, null, 10000);
				}
			} else if (pandaInfo.search === 'rid') bgPanda.disableSearching(myId, pandaInfo);
			else this.stopCollecting(myId, "manual");
		});
		if (pandaInfo.search && (loaded || (newAddInfo && !newAddInfo.run))) this.searchDisabled(myId);
		$(`#pcm_hamButton_${myId}, #pcm_hamButton1_${myId}`).click((e) => { 
			const targetBtn = $(e.target).closest(".btn");
			if (targetBtn.data("longClicked")) { targetBtn.removeData("longClicked"); targetBtn.css({"background-color": "", "color": ""});}
			else { this.hamButtonClicked(myId, targetBtn); }
		}).mayTriggerLongClicks({ delay: 1200 }).on('longClick', (e) => {
				const targetBtn = $(e.target).closest(".btn");
				targetBtn.data("longClicked",true);
				if (targetBtn.hasClass("pcm_delayedHam")) {
					targetBtn.css({"background-color":this.hamBtnBgColor, "color":this.hamBtnColor}).removeClass("pcm_delayedHam");
					pandaInfo.autoTGoHam = (pandaInfo.data.autoGoHam) ? "disable" : "off";
				} else { 
					pandaInfo.autoTGoHam = "on";
					targetBtn.css({"background-color": "#097e9b", "color":"#FFFFFF"}).addClass("pcm_delayedHam");
					this.hamButtonClicked(myId, targetBtn, true);
				}
			});
		$(`#pcm_deleteButton_${myId}, #pcm_deleteButton1_${myId}`).click((e) => {
			if (!this.ctrlDelete.includes(myId)) this.ctrlDelete.push(myId);
			this.removeJobs(this.ctrlDelete);
		});
		$(`#pcm_detailsButton_${myId}, #pcm_detailsButton1_${myId}`).click(() => {
			this.modalJob.showDetailsModal(myId);
		});
		$(`#pcm_groupId_${myId}`).click((e) => {
			const double = parseInt( $(e.target).data('double'), 10 );
			if (double === 2) $(e.target).data('double', 0);
			setTimeout( () => {
				const double = parseInt( $(e.target).data('double'), 10 );
				if (double !== 2) {
					const myId = $(e.target).data('myId');
					navigator.clipboard.writeText(bgPanda.pandaUrls[myId].accept);
				}
			}, 250);
		});
		$(`#pcm_groupId_${myId}`).on('dblclick', (e) => {
			$(e.target).data('double', 2);
			console.log("OMG I am doubleclicked", $(e.target).data('myId'));
		});
		$(`#pcm_hitReqName1_${myId}`).click((e) => {
			$(`#pcm_hitReqName1_${myId}`).hide(); $(`#pcm_hitStats1_${myId}`).show();
		});
		$(`#pcm_hitStats1_${myId}`).click((e) => {
			$(`#pcm_hitStats1_${myId}`).hide(); $(`#pcm_hitReqName1_${myId}`).show();
		});
		if (newAddInfo) {
			if ((pandaInfo.search === 'gid' || pandaInfo.search === null) && newAddInfo.run)
				this.runThisPanda(myId, newAddInfo.tempDuration, newAddInfo.tempGoHam);
			else if (pandaInfo.search === 'rid' && newAddInfo.run) bgPanda.doSearching(myId, null, 10000);
		} 
    return myId;
  }
  /** When a hit accepted set up the stats and display it on the card.
   * @param  {number} myId 				- The unique ID for a panda job.
   * @param  {number} queueUnique - The timer unique ID that this hit was accepted from.
   * @param  {object} result			- The result brought back from the fetch method. */
  hitAccepted(myId, queueUnique, result) {
		this.logTabs.queueTotal++;
    this.logTabs.updateCaptcha(globalOpt.updateCaptcha());
    this.pandaGStats.addTotalAccepted();
    this.highlightEffect_card(myId);
    this.pandaStats[myId].addAccepted();
		let pandaInfo = bgPanda.info[myId];
    if (pandaInfo.autoTGoHam !== "disable" &&
       (pandaInfo.data.autoGoHam || pandaInfo.autoTGoHam === "on")) {
      bgPanda.timerGoHam(queueUnique, pandaInfo.data.hamDuration);
    }
    bgPanda.resetTimerStarted(queueUnique);
    const html = $.parseHTML( result.data );
    const targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div");
		const rawProps = targetDiv.find("span").attr("data-react-props");
		const auth_token = $(html).find(`input[name="authenticity_token"]:first`);
		const url = auth_token.closest('form').attr('action');
		const urlInfo = url.match(/\/projects\/([^\/]*)\/tasks[\/?]([^\/?]*)/);
    bgPanda.authenticityToken = auth_token.val();
		const hitDetails = JSON.parse(rawProps).modalOptions;
		hitDetails.task_id = urlInfo[2];
		hitDetails.assignment_id = bgPanda.parseHitDetails(hitDetails, myId);
		bgPanda.queueAddAccepted(pandaInfo, hitDetails);
		this.logTabs.addIntoQueue(pandaInfo, hitDetails, pandaInfo.data, result.url.replace("https://worker.mturk.com",''));
		this.logTabs.addToLog(pandaInfo.data);
		this.updateLogStatus(myId, 0, pandaInfo.data);
		bgPanda.checkIfLimited(myId, true);
		if (globalOpt.isNotifications()) notify.showAcceptedHit(pandaInfo.data);
    alarms.doAlarms(pandaInfo.data);
	}
	/** Does any resetting of any values needed when the new day happens. */
	resetDailyStats() { for (const key in this.pandaStats) { this.pandaStats[key].resetDailyStats(); } }
	/** Sounds an alarm by the name parameter. Will check if the name is correct before calling alarm function.
	 * @param  {string} name - The name of an alarm to sound. */
	soundAlarm(name) { if (['Captcha'].includes(name)) alarms[`do${name}Alarm`](); }
	/** Notifies the user that a captcha has been found. */
	captchaAlert() { if (globalOpt.isNotifications() && globalOpt.isCaptchaAlert()) notify.showCaptchaAlert(); }
	/** Notifies the user that they can't accept any more hits for today. */
	mturkLimit() { if (globalOpt.isNotifications()) notify.showDailyLimit(); }
	/** Updates the status log tab on the bottom with relevant information.
	 * @param  {number} myId					 - The unique ID for a panda job.
	 * @param  {number} milliseconds	 - The elapsed time since job last tried to get a hit.
	 * @param  {object} [changes=null] - Changes for this job that needs to be shown on the status log tab. */
	updateLogStatus(myId, milliseconds, changes=null) {
		const stats = (changes) ? null : this.pandaStats[myId];
		this.logTabs.updateLogStatus(stats, myId, milliseconds, changes);
	}
	/** Save the queue results received after making sure the groupings are checked for start times to start.
	 * Also detects if a new day happened and then will reset any daily values that need to be reset.
	 * @param  {object} queueResults - Object from the mturk queue with all the hits information. */
	gotNewQueue(queueResults) {
		groupings.checkStartTimes();
		if (isNewDay()) this.resetDailyStats();
		this.logTabs.updateQueue(queueResults);
	}
	/** Halt this script with an error message.
	 * @param  {object} error				 - The full Error object that gets displayed in the console.
	 * @param  {string} alertMessage - The message that gets displayed on the page and console.
	 * @param  {string} title				 - The title to display on the page for the error. */
	haltScript(error, alertMessage, title) {
		haltScript(error, alertMessage, null, title);
	}
}
