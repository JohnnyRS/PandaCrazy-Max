/** This class takes care of the pandacrazy user interface.
 * @class PandaUI
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaUI {
  constructor () {
		this.cards = new PandaCards();					// Class that handles the job cards and the display of info on the cards.
		this.hitQueue = [];											// Array of panda's to add delayed when multiple panda's get added at once.
		this.lastAdded = null;									// The time the last hit got added to delay adding hits slowly.
		this.hamBtnBgColor = "";								// Default value for background color of the ham button from css file.
		this.hamBtnColor = "";									// Default value for color of the ham button from css file.
		this.pandaStats = {};										// Object of PandaStats Class object with stats for each panda.
		this.tabs = null;												// The tabbed area where the panda card will go to.
		this.logTabs = null;										// The log tabs on the bottom of the page with queue watch.
		this.pandaGStats = null;								// The global stats for all the panda's and display stats to status area.
		this.delayedTimeout = null;					    // Used to delay adding jobs externally to get control.
    this.tabPandaHeight = 0;								// Panda tab row's height.
		this.tabLogHeight = 0;									// Log tab row's height.
		this.windowHeight = 0;									// Window height.
		this.resizeObserver = null;							// Observer for window size changes so size of panels can be changed.
		this.listener = new ListenerClass();									  // Listener class for any message listens.
		this.modalJob = null;																		// Modal Job class.
	}
	/** Gets the total hits in the queue.
   * @return {number} - Total hits in the queue. */
	getQueueTotal() { return this.logTabs.queueTotal; }
	/** Delete the panda stats from the stat database for this panda with this unique ID and database ID.
	 * @param  {number} myId - MyID @param  {number} dbId - Database ID */
	deleteFromStats(myId, dbId) { this.pandaStats[myId].deleteIdFromDB(dbId); }
	/** Loads up any panda jobs that are saved or saves default panda jobs if database was just created.
	 * @async												- To wait for the tabs to completely load from the database.
	 * @param  {function} afterFunc - Function to call after done to send success array or error object. */
	async prepare(afterFunc) {
		let success = [], err = null;
		this.tabs = new TabbedClass($(`#pcm_pandaSection`), `pcm_pandaTabs`, `pcm_tabbedPandas`, `pcm_pandaTabContents`);
		this.cards.prepare(this.tabs); this.logTabs = new LogTabsClass(); this.logTabs.updateCaptcha(globalOpt.getCaptchaCount()); this.pandaGStats = new PandaGStats();
		[success[0], err] = await this.tabs.prepare();
		if (!err) {
			let oO = optObject(_,_,_,_,_,_,_,_, globalOpt.getHamDelayTimer());
			if (MYDB.useDefault('panda')) await this.addPanda(dataObject("3SHL2XNU5XNTJYNO5JDRKKP26VU0PY", "Tell us if two receipts are the same", "Tell us if two receipts are the same", "AGVV5AWLJY7H2", "Ibotta, Inc.", "0.01"), oO,_,_,_,_,_,true);
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
							if (bgPanda.info.hasOwnProperty(myId)) this.addPandaToUI(myId, bgPanda.options(myId), null, true, true);
							else this.tabs.removePosition(unique, dbId);
							this.pandaStats[myId].updateAllStats(this.cards.get(myId));
						}
						this.cards.appendDoc(unique);
					}
					if (dbIds.length>0) {
						for (const dbId of dbIds) {
							const myId = bgPanda.getMyId(dbId), info = bgPanda.options(myId); info.tabUnique = 1;
							this.addPandaToUI(myId, info, null, true); this.tabs.setPosition(1, Number(dbId));
						}
					}
					this.cards.cardButtons();
					if (bgPanda.pandaUniques > 0) {
						let firstPanda = bgPanda.pandaUniques[0];
						this.hamBtnBgColor = $(`#pcm_hamButton_${firstPanda}`).css("background-color"); this.hamBtnColor = $(`#pcm_hamButton_${firstPanda}`).css("color");
					}
					bgPanda.nullData();
				}
			}
			this.tabPandaHeight = $(`#pcm_pandaPanel`).height(); this.tabLogHeight = $(`#pcm_logPanel`).height(); this.windowHeight = window.innerHeight;
			this.pandaGStats.setPandaTimer(bgPanda.timerChange()); pandaUI.pandaGStats.setHamTimer(bgPanda.hamTimerChange());
			pandaUI.pandaGStats.setSearchTimer(bgSearch.timerChange()); pandaUI.pandaGStats.setQueueTimer(bgQueue.timerChange());
		}
		window.onresize = async (e) => { this.resizeTabContents(); }
		this.resizeObserver = new ResizeObserver((entries) => this.panelResized(entries));
		$('#pcm_pandaPanel').mousedown( () => { this.resizeObserver.observe($('#pcm_pandaPanel')[0]); } )
		$('#pcm_pandaPanel').mouseup( () => { this.resizeObserver.disconnect(); } )
		afterFunc(success, err);
	}
	/** Removes all panda jobs from UI and stats. */
	async removeAll() {
		this.cards.removeAll(); this.tabs.wipeTabs(); this.logTabs.removeAll();
		this.cards = null; this.pandaStats = {}; this.listener = null; this.hitQueue = []; this.lastAdded = null; this.tabs = null; this.logTabs = null;
		this.pandaGStats = null; this.delayedTimeout = null; this.resizeObserver = null; this.modalJob = null;
	}
  /** Resizes the tab contents according to window size changes. */
  resizeTabContents() {
    let windowChange = this.innerHeight - window.innerHeight;
    $('#pcm_pandaTabContents .pcm_tabs').height(`${this.tabs.tabContentsHeight - windowChange}px`);
		$('#pcm_pandaPanel').height(`${this.tabPandaHeight - windowChange}px`);
		this.tabs.tabContentsHeight = $('#pcm_pandaTabContents .pcm_tabs:first').height(); this.innerHeight = window.innerHeight;
    this.tabPandaHeight = $('#pcm_pandaPanel').height();
	}
	/** Resizes the panda and log panels when user is resizing them.
	 * @param  {array} entries - Number of entries resizeObserver finds that got resized. */
  panelResized(entries) {
		window.requestAnimationFrame(() => { // Stops loop limit exceeded for ResizeObserver.
			if (!Array.isArray(entries) || !entries.length) { return; }
			let changed = $('#pcm_pandaPanel').height() - this.tabPandaHeight;
			if (changed !== 0) {
				$('#pcm_pandaTabContents .pcm_tabs').height(this.tabs.tabContentsHeight + changed); $('#pcm_logTabContents .pcm_tabs').height(this.logTabs.tabContentsHeight - changed);
				this.tabs.tabContentsHeight = $('#pcm_pandaTabContents .pcm_tabs:first').height();
				this.logTabs.tabContentsHeight = $('#pcm_logTabContents .pcm_tabs:first').height();
				this.tabPandaHeight = $('#pcm_pandaPanel').height(); this.tabLogHeight = $(`#pcm_logPanel`).height();
			}
		});
  }
	/** Shows the logged off modal and after it will unpause the timer. */
	nowLoggedOff() {
		modal = new ModalClass(); modal.showLoggedOffModal( () => { modal = null; bgPanda.unPauseTimer(); } );
		if (globalOpt.isNotifications() && !bgPanda.isLoggedOff()) notify.showLoggedOff();
	}
  /** Closes the logged off modal if it's opened. */
  nowLoggedOn() { if (modal) modal.closeModal('Program Paused!'); }
	searchUIConnect(status=true) { if (this.modalJob) this.modalJob.searchUIConnect(status); }
  /** Gets the status from the timer and shows the status on the page.
   * @param  {bool} running - Running Status @param  {bool} paused - Paused Timer */
  collectingStatus(running, paused) {
    if (!running) this.pandaGStats.collectingOff();
		if (paused) this.pandaGStats.collectingPaused(); else this.pandaGStats.collectingUnPaused();
  }
	/** Show the jobs modal for editing panda jobs or panda jobs in a grouping.
	 * It will also load all panda's from the database and wait for successful load.
	 * @async															 - To wait for all the data for panda's to be loaded from database.
	 * @param  {string} [type="jobs"]			 - Type of data        @param  {number} [groupings=-1]			- Grouping ID    @param  {object} [thisObj=null]			- Grouping object
	 * @param  {function} [saveFunc=null]	 - Save Function       @param  {function} [checkFunc=null]  - Check Function @param  {function} [cancelFunc=null] - Cancel Function
	 * @param  {function} [afterShow=null] - After Show Function @param  {function} [afterClose=null] - After Close Function */
	async showJobsModal(type="jobs", groupings=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null, afterClose=null) {
		let err = await bgPanda.getAllPanda(false); // Just loading all panda data into memory.
		if (err) {
			this.haltScript(err, 'Failed getting data from database for all pandas so had to end script.', 'Error getting panda data. Error:');
		}
		if (!this.modalJob) this.modalJob = new ModalJobClass();
		this.modalJob.showJobsModal(type, groupings, thisObj, saveFunc, checkFunc, () => {
			if (cancelFunc !== null) cancelFunc();
			bgPanda.nullData(false);
		}, afterShow, () => { this.modalJob = null; if (afterClose) afterClose(); else modal = null; });
	}
	/** Shows the add job modal. */
	showJobAddModal() { this.modalJob = new ModalJobClass(); this.modalJob.showJobAddModal( () => { this.modalJob = null; } ); }
	/** Start panda job collecting with this unique ID and set the duration for collecting and go ham.
	 * Also starts the goham at start if neccesary.
	 * @async														 - To wait for the loading of the data from the database.
	 * @param  {number} myId 						 - Unique ID @param  {bool} [goHamStart=false] - Ham Start @param  {number} [tempDuration=0] - Temp duration
	 * @param  {number} [tempGoHam=0]		 - Temp ham duration */
	async startCollecting(myId, goHamStart=false, tempDuration=0, tempGoHam=0) {
		let pandaStat = this.pandaStats[myId], alreadySearching = pandaStat.searching;
		if (!pandaStat.collecting) { // Make sure this panda is not collecting.
			let goodCollect = await bgPanda.startCollecting(myId, goHamStart, tempDuration, tempGoHam);
			if (goodCollect) {
				let data = await bgPanda.dataObj(myId);
				this.logTabs.addToStatus(data, pandaStat, myId);
				if (!pandaStat.collecting && !alreadySearching) this.pandaGStats.addCollecting();
				this.pandaGStats.collectingOn(); pandaStat.startCollecting();
				$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
				$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOff").removeClass("pcm_searchDisable").addClass("pcm_buttonOn");
			}
		}
	}
	/** Stop panda job collecting with this unique ID and delete from database if needed.
	 * @async														- To wait for the updating of the data to the database.
	 * @param  {number} myId            - Unique ID @param  {string} [whyStop=null] - Stopped Reason @param  {bool} [deleteData=true] - Delete Data?
	 * @param  {bool} [searching=false]	- Job Search? */
	async stopCollecting(myId, whyStop=null, deleteData=true, searching=false) {
		let info = bgPanda.options(myId), classToo = '', pandaStat = this.pandaStats[myId];
		if (whyStop === 'manual') this.cards.collectTipChange(myId, '');
		if (pandaStat.collecting && !pandaStat.searching && !searching) this.pandaGStats.subCollecting();
		let theStats = pandaStat.stopCollecting(); this.pandaGStats.collectingOff();
		info.data.totalSeconds += theStats.seconds; info.data.totalAccepted += theStats.accepted;
		let hitData = Object.assign({}, info.data); // Make a copy of data.
		bgPanda.stopCollecting(myId, hitData, whyStop);
		if ($(`#pcm_collectButton_${myId}`).is('.pcm_searchCollect')) classToo = ' pcm_searchDisable';
		$(`#pcm_collectButton_${myId}`).removeClass("pcm_buttonOn pcm_searchCollect").addClass(`pcm_buttonOff${classToo}`);
		$(`#pcm_collectButton1_${myId}`).removeClass("pcm_buttonOn pcm_searchCollect").addClass(`pcm_buttonOff${classToo}`);
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_delayedHam");
		const previousColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
		if (previousColor && !info.skipped) $(`#pcm_pandaCard_${myId}`).stop(true,true).removeData("previousColor").animate({"backgroundColor":previousColor},{duration:1000});
		await bgPanda.updateDbData(myId, hitData); this.logTabs.removeFromStatus(myId);
		if (deleteData && !info.skipped) info.data = null;
		info.queueUnique = null; info.autoTGoHam = "off";
	}
	/** Removes a job from the UI.
	 * @param  {Number} myId							 - The unique ID for a panda job.
	 * @param  {function} [afterFunc=null] - The function to run when card is removed completely.
	 * @param  {function} [animate=true]	 - Should animation be used when removing a card?
	 * @param  {function} [deleteDB=true]	 - Should the database be deleted too? */
	async removeJob(myId, afterFunc=null, animate=true, deleteDB=true, whyStop=null) {
		this.cards.removeCard(myId, async () => {
			let options = bgPanda.options(myId), data = await bgPanda.dataObj(myId); this.tabs.removePosition(data.tabUnique, options.dbId);
			if (deleteDB) await this.stopCollecting(myId, null, false)
			await bgPanda.removePanda(myId, deleteDB, whyStop);
			delete this.pandaStats[myId];
			if (data.search) this.pandaGStats.subSearch(); else this.pandaGStats.subPanda();
			if (afterFunc!==null) afterFunc();
		}, animate);
	}
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr						 - The array of jobs unique ID's to delete.
	 * @param  {function} [afterFunc=null] - The function to call after remove animation effects are finished. */
	async removeJobs(jobsArr, afterFunc=null, whyStop=null, afterClose=null) {
		let bodyText = "";
		jobsArr.forEach( (thisId) => { bodyText += '( ' + $(`#pcm_hitReqName_${thisId}`).html()+' '+[$(`#pcm_hitPrice_${thisId}`).html()]+' )<BR>'; });
		if (!modal) modal = new ModalClass();
		modal.showDeleteModal(bodyText, () => {
			jobsArr.forEach( async (myId) => {
				let options = bgPanda.options(myId);
				MYDB.getFromDB('panda',_, options.dbId).then( (r) => { let info = bgPanda.options(myId); info.data = r; this.removeJob(myId, afterFunc,_,_, whyStop); },
					rejected => console.error(rejected));
			});
			modal.closeModal(); jobsArr.length = 0;
		}, () => { if (afterFunc) afterFunc('NO'); },
			 () => { jobsArr.length = 0; $('.pcm_deleteButton').css('background-color', ''); },
			 () => { if (afterClose) afterClose(); else modal = null; });
	}
	/** Show that this ham button was clicked or went into go ham mode automatically.
	 * @async														- So it waits to get the queueUnique before using it.
	 * @param  {number} myId - Unique ID @param  {object} targetBtn - Ham button @param  {bool} [autoGoHam=false] - Auto Go Ham? */
	hamButtonClicked(myId, targetBtn, autoGoHam=false) {
		let options = bgPanda.options(myId);
		if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, !autoGoHam); }
		else if (targetBtn.hasClass("pcm_buttonOff") && targetBtn.hasClass("pcm_delayedHam")) bgPanda.timerGoHam(options.queueUnique);
		else bgPanda.timerHamOff();
	}
	/** Show that this panda search job is collecting in panda mode.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchCollecting(myId) {
		let pandaStat = this.pandaStats[myId]; pandaStat.doSearchCollecting(true); this.cards.pandaSearchCollectingNow(myId);
	}
	/** Show that this panda search job is disabled and not being searched anymore.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchDisabled(myId) {
		let pandaStat = this.pandaStats[myId];
		if (pandaStat) {
			if (pandaStat.doSearching()) this.pandaGStats.subCollecting();
			if (this.pandaGStats.collectingTotal.value < 1) this.pandaGStats.collectingOff();
			pandaStat.doSearching(false); pandaStat.doCollecting(false); pandaStat.doSearchCollecting(false); this.cards.pandaSearchDisabled(myId);
		}
	}
	/** Show that this panda search job is being searched on the search page by the search class.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchingNow(myId) { let pandaStat = this.pandaStats[myId]; pandaStat.doSearching(true); this.cards.pandaSearchingNow(myId); }
	/** When panda's are coming in externally too fast they need to delay collecting for 1600 milliseconds each.
	 * @param  {number} [diff=null] - The difference of time since the last panda was added. */
	async nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length>0) {
			this.hitQueue.sort((a,b) => b.price - a.price);
			if (diff === null) diff = new Date().getTime() - this.lastAdded;
			if (diff === -1 || diff >= this.hitQueue[0].lowestDur) {
				const obj = this.hitQueue.shift(); this.lastAdded = new Date().getTime();
				let info = bgPanda.options(obj.myId), data = await bgPanda.dataObj(obj.myId);
				info.autoAdded = true; data.hitsAvailable = obj.hitsAvailable;
				this.cards.updateAllCardInfo(obj.myId, info); this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam);
				if (this.hitQueue.length===0) { this.lastAdded = null; this.delayedTimeout = null; }
				else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
			} else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
		} else this.delayedTimeout = null;
	}
	/** Run this panda after adding it to panda class with a temporary duration and temporary go ham duration.
	 * @param  {number} myId - Myid @param  {number} tempDuration - Temporary duration @param  {number} tempGoHam - Temporary go ham duration */
	runThisPanda(myId, tempDuration, tempGoHam) {
		let hitInfo = bgPanda.options(myId), diff = null;
		bgPanda.checkIfLimited(myId, false, hitInfo.data);
		if (!this.pandaStats[myId].collecting) {
			const nowDate = new Date().getTime();
			this.hitQueue.push({'myId':myId, 'price':hitInfo.data.price, 'hitsAvailable':hitInfo.data.hitsAvailable, 'tempDuration': tempDuration, 'tempGoHam':tempGoHam, 'delayedAt':nowDate, 'lowestDur':Math.min(tempDuration, tempGoHam)});
			if (this.lastAdded!==null) {
				diff = nowDate - this.lastAdded;
				if (diff < this.hitQueue[0].lowestDur) {
					if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
					bgPanda.sendStatusToSearch(hitInfo.data, true); 
					if (!this.delayedTimeout) this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500, diff);
				} else this.nextInDelayedQueue(diff);
			} else this.nextInDelayedQueue(-1);
		} else { this.cards.updateAllCardInfo(myId, hitInfo); }
	}
	/** Add panda job from an external source like forums, script or panda buttons on mturk.
	 * @param  {object} msg - The message object from the external source. */
	addFromExternal(msg) {
		if (msg.groupId !== '' && msg.reqId !== '') {
			let myId = null;
			if (msg.command.slice(-7) === 'collect') {
				if (msg.groupId != '' && bgPanda.pandaGroupIds.hasOwnProperty(msg.groupId)) myId = bgPanda.pandaGroupIds[msg.groupId][0];
				if (msg.groupId != '' && bgPanda.searchesGroupIds.hasOwnProperty(msg.groupId)) myId = bgPanda.searchesGroupIds[msg.groupId][0];
				if (myId && msg.command.includes('stop')) this.stopCollecting(myId);
				else if (myId) this.startCollecting(myId);
			} else {
				const search = (msg.command === 'addSearchOnceJob') ? 'gid' : (msg.command === 'addSearchMultiJob') ? 'rid' : null;
				const once = (msg.command === 'addOnceJob' || msg.command === 'addSearchOnceJob'); // Accept only 1
				const run = (msg.command !== 'addOnlyJob'); // Run this job after adding
				if (!msg.auto) msg.auto = false;
				const duration = ((search) ? 10000 : (msg.auto) ? 12000 : 0); // Searches collect for 10 seconds and then searches. Automatic adds stops after 2 minutes.
				let hamD = (msg.hamDuration === 0) ? globalOpt.getHamDelayTimer() : msg.hamDuration;
				if (search === 'rid' && msg.reqId !== '' && bgPanda.searchesReqIds.hasOwnProperty(msg.reqId)) myId = bgPanda.searchesReqIds[msg.reqId][0];
				if (search === 'gid' && msg.groupId !== '' && bgPanda.searchesGroupIds.hasOwnProperty(msg.groupId)) myId = bgPanda.searchesGroupIds[msg.groupId][0];
				if (myId === null) {
					let data = dataObject(msg.groupId, msg.description, decodeURIComponent(msg.title), msg.reqId, decodeURIComponent(msg.reqName), msg.price);
					let opt = optObject(once, search,_,_,_,_,_,_, hamD);
					if (search && globalOpt.theToSearchUI() && bgSearch.isSearchUI()) { data.id = -1; data.disabled = false; bgPanda.sendToSearch(-1, {...data, ...opt},_,_, true,_,_, true, true); }
					else this.addPanda(data, opt, (msg.auto) ? true : false, run, true, duration, 4000);
				} else if (search === 'rid') this.doSearching(myId);
				else this.startCollecting(myId)
			}
		}
	}
	/** Add panda from search triggers. Is used to use search jobs instead of adding a new hit if not needed.
	 * @param  {object} data			         - Data                @param  {object} opt			  - Options        @param  {object} auto			    - Auto Added
	 * @param  {object} run			           - Run after?          @param  {bool} ext			    - From external? @param  {number} tempDuration  - Temp duration
	 * @param  {number} tempGoHam          - Temp GoHam duration @param  {number} searchType - Search type    @param  {string} [myId=-1]     - MyId
	 * @param  {string} [from='fromPanda'] - from which UI? */
	addFromSearch(data, opt, auto, run, ext, tempDuration, tempGoHam, searchType, myId=-1, from='fromPanda') {
		if (myId !== -1 && data.reqName !== '') bgPanda.updateReqName(myId, data.reqName);
		if (data.hamDuration === 0) data.hamDuration = globalOpt.getHamDelayTimer();
		this.addPanda(data, opt, auto, run, ext, tempDuration, tempGoHam,_,_,_,_, searchType, from);
	}
	/** Add panda from the database.
	 * @async							- To wait for the process of adding data to the database.
	 * @param  {object} r - The object of the panda job that needs to be added. */
	async addPandaDB(r, loaded=true) { 
		let update = gNewVersion, tabUniques = this.tabs.getUniques();
		if (typeof r.dateAdded === 'string') { r.dateAdded = new Date(r.dateAdded).getTime(); update = true; }
		if (!tabUniques.includes(r.tabUnique)) { r.tabUnique = tabUniques[0]; update = true; }
		let hamD = (r.hamDuration === 0) ? globalOpt.getHamDelayTimer() : r.hamDuration;
		let dO = dataObject(r.groupId, r.description, r.title, r.reqId, r.reqName, r.price, r.hitsAvailable, r.assignedTime, r.expires, r.friendlyTitle, r.friendlyReqName);
		let oO = optObject(r.once, r.search, r.tabUnique, r.limitNumQueue, r.limitTotalQueue, r.limitFetches, r.duration, r.autoGoHam, hamD, r.acceptLimit, r.day, r.weight, r.dailyDone, r.disabled);
		let dbInfo = {...dO, ...oO, 'dateAdded':r.dateAdded, 'totalSeconds':r.totalSeconds, 'totalAccepted':r.totalAccepted};
		if (r.hasOwnProperty("id")) dbInfo.id = r.id;
		await bgPanda.addPanda(dbInfo, false, {},_,_, update, loaded, globalOpt.theSearchDuration(), globalOpt.getHamDelayTimer());
	}
	/** Add a new panda job with lot of information and options to the panda area and database.
	 * @async														   - To wait for the data to be loaded from database if needed.
	 * @param  {object} [d={}]			  	   - Data           @param  {object} [opt={}]			 - Options        @param  {object} [add=false]		 - Auto Added?
	 * @param  {bool} [run=false]		  	   - Run After?     @param  {bool} [ext=false]		 - From external? @param  {number} [tDur=0]      	 - Temp duration
	 * @param  {number} [tGoH=0]		       - GoHam duration @param  {bool}	[loaded=false] - Loaded?        @param  {object}	[addDate=null] - Date
	 * @param  {number}	[seconds=0]			   - Seconds        @param  {number}	[accepts=0]	 - Accepted       @param  {number} [searchType=''] - Search Type
	 * @param  {string} [from='fromPanda'] - from which UI? */
	async addPanda(d={}, opt={}, add=false, run=false, ext=false, tDur=0, tGoH=0, loaded=false, addDate=null, seconds=0, accepts=0, searchType='', from='fromPanda') {
		const dated = (addDate) ? addDate : new Date().getTime(); // get the date that this job was added.
		let gidFound = bgPanda.checkExisting(d.groupId, searchType, from);
		if (ext && gidFound !== null && !opt.search) {
			const info = bgPanda.options(gidFound);
			if (!info.data) await bgPanda.getDbData(gidFound);
			info.data.hitsAvailable = d.hitsAvailable; info.data.reqName = d.reqName; info.data.reqId = d.reqId;
			info.data.title = d.title; info.data.description = d.description; info.data.price = d.price;
			this.runThisPanda(gidFound, tDur, tGoH);
		} else {
			if (opt.tabUnique === -1) opt.tabUnique = this.tabs.getTabInfo(this.tabs.currentTab).id;
			let dbInfo = {...d, ...opt, 'dateAdded': dated, totalSeconds:seconds, totalAccepted:accepts};
			let newAddInfo = {'tempDuration':tDur, 'tempGoHam':tGoH, 'run':run};
			await bgPanda.addPanda(dbInfo, add, newAddInfo,_,_, false, loaded, globalOpt.theSearchDuration(), globalOpt.getHamDelayTimer());
		}
	}
	/** Add this panda job to the panda UI with a card and stats.
	 * @param  {number} myId 				 - Unique ID        @param  {object} pandaInfo		  - Panda Info     @param  {object} newAddInfo - New Info
	 * @param  {bool} [loaded=false] - Database loaded? @param  {bool} [multiple=false] - Multiple jobs?
	 * @return {number}							 - The unique ID for this panda job. */
	addPandaToUI(myId, pandaInfo, newAddInfo, loaded=false, multiple=false) {
		this.cards.addCard(myId, pandaInfo, loaded, multiple); this.pandaStats[myId] = new PandaStats(myId, pandaInfo.dbId);
		if (pandaInfo.data.dailyDone > 0) this.pandaStats[myId].setDailyStats(pandaInfo.data.dailyDone);
		if (pandaInfo.search && (loaded || (newAddInfo && !newAddInfo.run))) this.searchDisabled(myId);
		if (pandaInfo.search) this.pandaGStats.addSearch(); else this.pandaGStats.addPanda();
		if (pandaInfo.disabled) this.cards.pandaDisabled(myId);
		if (!multiple) {
			this.cards.appendDoc(pandaInfo.data.tabUnique); this.pandaStats[myId].updateAllStats(this.cards.get(myId));
			if (bgPanda.isTimerGoingHam()) $(`#pcm_hamButton_${myId}`).addClass("disabled");
			if (newAddInfo) {
				if ((pandaInfo.search === 'gid' || pandaInfo.search === null) && newAddInfo.run) this.runThisPanda(myId, newAddInfo.tempDuration, newAddInfo.tempGoHam);
				else if (pandaInfo.search === 'rid' && newAddInfo.run) {
					this.pandaGStats.addCollecting(); this.pandaGStats.collectingOn(); bgPanda.doSearching(myId, pandaInfo.data, 10000);
				}
			}
			this.cards.cardButtons();
		}
    return myId;
  }
  /** When a hit accepted set up the stats and display it on the card.
   * @param  {number} myId - Unique ID @param  {number} queueUnique - Queue ID @param  {object} html - Html object @param  {object} url - url */
	hitAccepted(myId, queueUnique, html, url) {
		this.logTabs.queueTotal++; this.logTabs.updateCaptcha(globalOpt.updateCaptcha());
    this.pandaGStats.addTotalAccepted(); this.cards.highlightEffect_card(myId);
		let pandaInfo = bgPanda.options(myId); this.pandaStats[myId].addAccepted(); pandaInfo.data.dailyDone++;
    if (pandaInfo.autoTGoHam !== "disable" && (pandaInfo.data.autoGoHam || pandaInfo.autoTGoHam === "on")) {
      bgPanda.timerGoHam(queueUnique, pandaInfo.data.hamDuration);
    }
    bgPanda.resetTimerStarted(queueUnique);
    let targetDiv = $(html).find(".project-detail-bar .task-project-title").next("div"), rawProps = targetDiv.find("span").attr("data-react-props");
		let auth_token = $(html).find(`input[name="authenticity_token"]:first`), formUrl = auth_token.closest('form').attr('action');
		let formInfo = formUrl.match(/\/projects\/([^\/]*)\/tasks[\/?]([^\/?]*)/);
    bgPanda.authenticityToken = auth_token.val();
		let hitDetails = JSON.parse(rawProps).modalOptions;
		hitDetails.task_id = formInfo[2]; hitDetails.assignment_id = bgPanda.parseHitDetails(hitDetails, myId, pandaInfo.data);
		bgPanda.queueAddAccepted(pandaInfo, hitDetails);
		this.logTabs.addIntoQueue(pandaInfo, hitDetails, pandaInfo.data, url.replace("https://worker.mturk.com",''));
		this.logTabs.addToLog(pandaInfo.data); this.updateLogStatus(myId, 0, pandaInfo.data); bgPanda.checkIfLimited(myId, true, pandaInfo.data);
		if (globalOpt.isNotifications()) notify.showAcceptedHit(pandaInfo.data);
		alarms.doAlarms(pandaInfo.data);
		targetDiv = rawProps = auth_token = formUrl = formInfo = hitDetails = null;
	}
	/** Does any resetting of any values needed when the new day happens.
	 * @async - To wait for all of the job data to be loaded from database. */
	async resetDailyStats() {
		await bgPanda.getAllPanda(false);
		for (const key of Object.keys(this.pandaStats)) {
			this.pandaStats[key].setDailyStats(); let data = bgPanda.data(key); data.day = new Date().getTime(); data.dailyDone = 0;
		}
		bgHistory.maintenance(); bgPanda.nullData(false, true);
	}
	/** Returns the total number recorded of hits in queue.
	 * @param  {string} gId='' - Group ID to search for and count the hits in queue.
	 * @return {number}        - Returns the number of group ID hits or all hits in queue. */
	totalResults(gId='') { return this.logTabs.totalResults(gId); }
	/** Sounds an alarm by the name parameter. Will check if the name is correct before calling alarm function.
	 * @param  {string} name - The name of an alarm to sound. */
	soundAlarm(name) { if (['Captcha','Queue','Full'].includes(name)) alarms[`do${name}Alarm`](); }
	/** Notifies the user that a captcha has been found. */
	captchaAlert() { if (globalOpt.isNotifications() && globalOpt.isCaptchaAlert()) notify.showCaptchaAlert(); }
	/** Notifies the user that they can't accept any more hits for today. */
	mturkLimit() { if (globalOpt.isNotifications()) notify.showDailyLimit(); }
	/** Updates the status log tab on the bottom with relevant information.
	 * @param  {number} myId - The unique ID @param  {number} milliseconds - Elapsed time @param  {object} [changes=null] - Stat changes to make */
	updateLogStatus(myId, milliseconds, changes=null) { const stats = (changes) ? null : this.pandaStats[myId]; this.logTabs.updateLogStatus(stats, myId, milliseconds, changes); }
	/** Save the queue results received after making sure the groupings are checked for start times to start.
	 * @param  {object} queueResults - Object from the mturk queue with all the hits information. */
	async gotNewQueue(queueResults) {
		groupings.checkStartTimes();
		if (isNewDay()) await this.resetDailyStats();
		this.logTabs.updateQueue(queueResults);
	}
	/** A hit was submitted.
	 * @param  {string} taskId - The task ID of hit submitted. */
	submittedHit(taskId) { this.logTabs.removeFromQueue(taskId); this.pandaGStats.addSubmitted(); }
	/** Set the value of the potential earnings from mturk.
	 * @param  {string} earnings - Earnings value from mturk. */
	setEarnings(earnings) { this.pandaGStats.thePotentialEarnings(earnings); }
	/** Halt this script with an error message.
	 * @param  {object} error - Error Object @param  {string} alertMessage - Alert Message @param  {string} title - Title. */
	haltScript(error, alertMessage, title) { haltScript(error, alertMessage, null, title); }
}
