/** This class takes care of the pandacrazy user interface.
 * @class PandaUI ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaUI {
  constructor () {
		this.cards = new PandaCards();					// Class that handles the job cards and the display of info on the cards.
		this.hitQueue = [];											// Array of panda's to add delayed when multiple panda's get added at once.
		this.lastAdded = null;									// The time the last HIT got added to delay adding HITs slowly.
		this.hamBtnBgColor = '';								// Default value for background color of the ham button from css file.
		this.hamBtnColor = '';									// Default value for color of the ham button from css file.
		this.pandaStats = {};										// Object of PandaStats Class object with stats for each panda.
		this.tabs = null;												// The tabbed area where the panda card will go to.
		this.logTabs = null;										// The log tabs on the bottom of the page with queue watch.
		this.pandaGStats = null;								// The global stats for all the panda's and display stats to status area.
		this.delayedTimeout = null;					    // Used to delay adding jobs externally to get control.
    this.tabPandaHeight = 0;								// Panda tab row's height.
		this.tabLogHeight = 0;									// Log tab row's height.
		this.windowHeight = 0;									// Window height.
		this.resizeObserver = null;							// Observer for window size changes so size of panels can be changed.
		this.listener = new ListenerClass();		// Listener class for any message listens.
		this.modalJob = null;										// Modal Job class.
		this.tabLogResized = false;
	}
	/** Gets the total HITs in the queue.
   * @return {number} - Total HITs in the queue. */
	getQueueTotal() { return this.logTabs.queueTotal; }
	/** Delete the panda stats from the stat database for this panda with this unique ID and database ID.
	 * @param  {number} myId - MyID  @param  {number} dbId - Database ID */
	deleteFromStats(myId, dbId) { this.pandaStats[myId].deleteIdFromDB(dbId); }
	/** Will send all stats to the function given.
	 * @param {function} sendResponse - Function to send the stats response. */
	sendStats(sendResponse) { if (this.pandaGStats) this.pandaGStats.sendStats(sendResponse); }
	/** Loads up any panda jobs that are saved or saves default panda jobs if database was just created.
	 * @async												- To wait for the tabs to completely load from the database.
	 * @param  {function} afterFunc - Function to call after done to send success array or error object. */
	async prepare(afterFunc) {
		let success = [], err = null;
		this.tabs = new TabbedClass($(`#pcm-pandaSection`), `pcm-pandaTabs`, `pcm-tabbedPandas`, `pcm-pandaTabContents`);
		this.cards.prepare(this.tabs); this.logTabs = new LogTabsClass(); this.logTabs.updateCaptcha(globalOpt.getCaptchaCount()); this.pandaGStats = new PandaGStats();
		[success[0], err] = await this.tabs.prepare();
		if (!err) {
			let oO = optObject(_,_,_,_,_,_,_,_, globalOpt.getHamDelayTimer()), savedLogHeight = globalOpt.theTabLogHeight();
			if (MYDB.useDefault('panda')) await this.addPanda(dataObject('3SHL2XNU5XNTJYNO5JDRKKP26VU0PY', 'Tell us if two receipts are the same', 'Tell us if two receipts are the same', 'AGVV5AWLJY7H2', 'Mechanical Turk', '0.01'), oO,_,_,_,_,_,true);
			else err = await bgPanda.getAllPanda(); // Not using initializing default value so load from database
			if (!err) {
				[success[1], err] = await this.logTabs.prepare();
				if (!err) {
					let tabUniques = this.tabs.getUniques(), dbIds = Object.keys(bgPanda.dbIds);
					for (const unique of tabUniques) {
						let positions = this.tabs.getPositions(unique);
						for (const dbId of positions) {
							let myId = bgPanda.getMyId(dbId);
							dbIds = arrayRemove(dbIds, dbId.toString());
							if (bgPanda.info.hasOwnProperty(myId)) this.addPandaToUI(myId, bgPanda.options(myId), null, true, true);
							else this.tabs.removePosition(unique, dbId);
							if (this.pandaStats[myId]) this.pandaStats[myId].updateAllStats(this.cards.get(myId));
						}
						this.cards.appendDoc(unique);
					}
					if (dbIds.length > 0) {
						for (const dbId of dbIds) {
							let myId = bgPanda.getMyId(dbId), info = bgPanda.options(myId); info.tabUnique = 1;
							this.addPandaToUI(myId, info, null, true); this.tabs.setPosition(1, Number(dbId));
						}
					}
					this.cards.cardButtons();
					if (bgPanda.pandaUniques > 0) {
						let firstPanda = bgPanda.pandaUniques[0];
						this.hamBtnBgColor = $(`#pcm-hamButton-${firstPanda}`).css('background-color'); this.hamBtnColor = $(`#pcm-hamButton-${firstPanda}`).css('color');
					}
					bgPanda.nullData();
				}
			}
			this.tabPandaHeight = $(`#pcm-pandaPanel`).height(); this.tabLogHeight = $(`#pcm-logPanel`).height(); this.windowHeight = window.innerHeight;
			if (savedLogHeight < 10) { savedLogHeight = this.tabLogHeight; globalOpt.theTabLogHeight(this.tabLogHeight); }
			this.pandaGStats.setPandaTimer(bgPanda.timerChange()); pandaUI.pandaGStats.setHamTimer(bgPanda.hamTimerChange());
			pandaUI.pandaGStats.setSearchTimer(MySearch.timerChange()); pandaUI.pandaGStats.setQueueTimer(bgQueue.timerChange());
			window.onresize = () => { this.resizeTabContents(); }
			this.resizeObserver = new ResizeObserver((entries) => this.panelResized(entries));
			let newPandaHeight = $(`#pcm-pandaUI`).innerHeight() - $(`.pcm-pandaTop:first`).outerHeight() - $(`.pcm-pandaQuickRow:first`).outerHeight() - savedLogHeight;
			$(`#pcm-pandaPanel`).height(newPandaHeight); this.panelResized([1])
			$('#pcm-pandaPanel').mousedown( () => { this.resizeObserver.observe($('#pcm-pandaPanel')[0]); } )
			$('#pcm-pandaPanel').mouseup( () => { this.resizeObserver.disconnect(); } )
		}
		afterFunc(success, err);
	}
	/** Removes all panda jobs from UI and stats. */
	removeAll() {
		if (this.cards) this.cards.removeAll(); if (this.tabs) this.tabs.wipeTabs(); if (this.logTabs) this.logTabs.removeAll();
		this.cards = null; this.pandaStats = {}; this.listener = null; this.hitQueue = []; this.lastAdded = null; this.tabs = null; this.logTabs = null;
		this.pandaGStats = null; this.delayedTimeout = null; this.resizeObserver = null; this.modalJob = null;
	}
  /** Resizes the tab contents according to window size changes. */
  resizeTabContents() {
    let windowChange = this.innerHeight - window.innerHeight;
    $('#pcm-pandaTabContents .pcm-tabs').height(`${this.tabs.tabContentsHeight - windowChange}px`);
		$('#pcm-pandaPanel').height(`${this.tabPandaHeight - windowChange}px`);
		this.tabs.tabContentsHeight = $('#pcm-pandaTabContents .pcm-tabs:first').height(); this.innerHeight = window.innerHeight;
    this.tabPandaHeight = $('#pcm-pandaPanel').height();
	}
	/** Resizes the panda and log panels when user is resizing them.
	 * @param  {array} entries - Number of entries resizeObserver finds that got resized. */
  panelResized(entries) {
		window.requestAnimationFrame( () => { // Stops loop limit exceeded for ResizeObserver.
			if (!Array.isArray(entries) || !entries.length) { return; }
			let changed = $('#pcm-pandaPanel').height() - this.tabPandaHeight;
			if (changed !== 0) {
				$('#pcm-pandaTabContents .pcm-tabs').height(this.tabs.tabContentsHeight + changed); $('#pcm-logTabContents .pcm-tabs').height(this.logTabs.tabContentsHeight - changed);
				this.tabs.tabContentsHeight = $('#pcm-pandaTabContents .pcm-tabs:first').height();
				this.logTabs.tabContentsHeight = $('#pcm-logTabContents .pcm-tabs:first').height();
				this.tabPandaHeight = $('#pcm-pandaPanel').height(); this.tabLogHeight = $(`#pcm-logPanel`).height(); this.tabLogResized = true;
			}
		});
	}
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. */
	resetCSSValues() {
		this.cards.resetCSSValues(); this.pandaGStats.resetCSSValues();
		for (const key of Object.keys(this.pandaStats)) { this.pandaStats[key].prepare(this.cards.acceptedStatusText, this.cards.fetchedStatusText); this.pandaStats[key].updateAllStats(); }
		menus.resetCSSValues(); this.logTabs.resetCSSValues();
	}
	/** Will toggle the paused value or force the paused value to a given value.
	 * @param {bool} [val] - Force Pause Value  */
	pauseToggle(val=null) { if (bgPanda) { if (bgPanda.pauseToggle(val)) $('#pcm-bqPandaPause').html('Unpause'); else $('#pcm-bqPandaPause').html('Pause'); }}
	/** Shows the logged off modal and after it will unpause the timer. */
	nowLoggedOff() {
		if (!modal) modal = new ModalClass(); modal.showLoggedOffModal( () => { if (modal.modals.length < 2) modal = null; bgPanda.unPauseTimer(); });
		if (!bgPanda.isLoggedOff()) { theAlarms.doLoggedOutAlarm(); if (globalOpt.isNotifications()) notify.showLoggedOff(); }
		dashboard.nowLoggedOff();
	}
	/** Shows the Captcha Found Modal and after it will unpause the timers.
	 * @param {string} [url] - Url of panda to use to fill in captcha. */
	captchaFound(url='') {
		globalOpt.resetCaptcha(); this.pauseToggle(true); document.title = 'Captcha Found - Panda Crazy Max'; this.captchaAlert();
		this.soundAlarm('Captcha'); console.info('captcha found');
		if (!modal) modal = new ModalClass(); modal.showCaptchaModal( () => {
			if (modal.modals.length < 2) modal = null; this.pauseToggle(false); document.title = 'Panda Crazy Max';
		}, url.replace('?format=json',''));
	}
  /** Closes the logged off modal if it's opened. */
	nowLoggedOn() { if (modal) modal.closeModal('Program Paused!'); dashboard.nowLoggedOn(); }
	/** Sets the mute value of the specific panda job with the unique number with the status value.
	 * @param {number} myId - Unique Number  @param {bool} value - Mute Status */
	pandaMute(myId, value) { this.cards.pandaMute(myId, value); }
	/** Informs the status of the SearchUI page to this page so SearchUI buttons can be enabled or disabled.
	 * @param {bool} [status] - Status of SearchUI */
	searchUIConnect(status=true) { if (this.modalJob) this.modalJob.searchUIConnect(status); }
  /** Gets the status from the timer and shows the status on the page.
   * @param  {bool} running - Running Status  @param  {bool} paused - Paused Timer */
  collectingStatus(running, paused) {
    if (!running) this.pandaGStats.collectingOff();
		if (paused) this.pandaGStats.collectingPaused(); else this.pandaGStats.collectingUnPaused();
  }
	/** Show the jobs modal for editing panda jobs or panda jobs in a grouping.
	 * @async													- To wait for all the data for panda's to be loaded from database.
	 * @param  {string} [type]			  - Type of data         @param  {number} [groupings]	   - Grouping ID          @param  {object} [thisObj]			- Grouping object
	 * @param  {function} [saveFunc]	- Save Function        @param  {function} [checkFunc]  - Check Function       @param  {function} [cancelFunc] - Cancel Function
	 * @param  {function} [afterShow] - After Show Function  @param  {function} [afterClose] - After Close Function */
	async showJobsModal(type='jobs', groupings=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null, afterClose=null) {
		let err = await bgPanda.getAllPanda(false); // Just loading all panda data into memory.
		if (err) { this.haltScript(err, 'Failed getting data from database for all pandas so had to end script.', 'Error getting panda data. Error:'); }
		if (!this.modalJob) this.modalJob = new ModalJobClass();
		this.modalJob.showJobsModal(type, groupings, thisObj, saveFunc, checkFunc, () => {
			if (cancelFunc !== null) cancelFunc();
			bgPanda.nullData(false);
		}, afterShow, () => { this.modalJob = null; if (afterClose) afterClose(); else modal = null; });
	}
	/** Shows the add job modal. */
	showJobAddModal() { this.modalJob = new ModalJobClass(); this.modalJob.showJobAddModal( () => { this.modalJob = null; } ); }
	/** Start panda job collecting with this unique ID and set the duration for collecting and go ham.
	 * @async												- To wait for the loading of the data from the database.
	 * @param  {number} myId 			  - Unique ID 				@param  {bool}   [goHamStart] - Ham Start  @param  {number} [tempDuration] - Temp duration
	 * @param  {number} [tempGoHam] - Temp ham duration @param  {number} [tF]         - Temp Fetches */
	async startCollecting(myId, goHamStart=false, tempDuration=0, tempGoHam=0, tF=0) {
		if (!bgPanda.checkUnique(myId)) return;
		let pandaStat = this.pandaStats[myId], alreadySearching = pandaStat.searching;
		if (!pandaStat.collecting) { // Make sure this panda is not collecting.
			let goodCollect = await bgPanda.startCollecting(myId, goHamStart, tempDuration, tempGoHam, tF);
			if (goodCollect) {
				let data = await bgPanda.dataObj(myId);
				this.logTabs.addToStatus(data, pandaStat, myId);
				if (!pandaStat.collecting && !alreadySearching) this.pandaGStats.addCollecting();
				this.pandaGStats.collectingOn(); pandaStat.startCollecting();
				$(`#pcm-collectButton-${myId}, #pcm-collectButton1-${myId}, #pcm-collectButton2-${myId}`).removeClass('pcm-buttonOff pcm-searchDisable').addClass('pcm-buttonOn');
			}
		}
	}
	/** Stop panda job collecting with this unique ID and delete from database if needed.
	 * @async											- To wait for the updating of the data to the database.
	 * @param  {number} myId      - Unique ID   @param  {string} [whyStop] - Stopped Reason  @param  {bool} [deleteData] - Delete Data?
	 * @param  {bool} [searching]	- Job Search? */
	async stopCollecting(myId, whyStop=null, deleteData=true, searching=false) {
		if (!bgPanda.checkUnique(myId)) return;
		let pandaStat = this.pandaStats[myId];
		if (pandaStat.collecting || pandaStat.searching) {
			let info = bgPanda.options(myId), classToo = ''; 
			if (!info.data) await bgPanda.getDbData(myId);
			if (whyStop === 'manual') this.cards.collectTipChange(myId, '');
			if (pandaStat.collecting && !pandaStat.searching && !searching) this.pandaGStats.subCollecting();
			let theStats = pandaStat.stopCollecting(); this.pandaGStats.collectingOff();
			info.data.totalSeconds += theStats.seconds; info.data.totalAccepted += theStats.accepted;
			let hitData = Object.assign({}, info.data); // Make a copy of data.
			bgPanda.stopCollecting(myId, hitData, whyStop);
			if ($(`#pcm-collectButton-${myId}`).is('.pcm-btnCollecting') && !searching) classToo = ' pcm-searchDisable';
			$(`#pcm-collectButton-${myId}, #pcm-collectButton1-${myId}, #pcm-collectButton2-${myId}`).removeClass('pcm-buttonOn pcm-btnCollecting').addClass(`pcm-buttonOff${classToo}`);
			$(`#pcm-hamButton-${myId}`).removeClass('pcm-delayedHam');
			let previousColor = $(`#pcm-pandaCard-${myId}`).data('previousColor');
			if (previousColor && !info.skipped) $(`#pcm-pandaCard-${myId}`).stop(true,true).removeData('previousColor').animate({'backgroundColor':previousColor},{'duration':1000});
			await bgPanda.updateDbData(myId, hitData); this.logTabs.removeFromStatus(myId);
			if (deleteData && !info.skipped) info.data = null;
			info.queueUnique = null; info.autoTGoHam = 'off';
		}
	}
	/** Removes a job from the UI.
	 * @async												 - To wait for removal of cards with animation on UI and panda job from database.
	 * @param  {Number} myId				 - Unique Number     @param  {function} [afterFunc] - After Function   @param  {function} [animate]	 - Animate Card?
	 * @param  {function} [deleteDB] - Database Delete?  @param  {string} [whyStop]     - Why Stopping? */
	async removeJob(myId, afterFunc=null, animate=true, deleteDB=true, whyStop=null) {
		this.cards.removeCard(myId, async () => {
			let options = bgPanda.options(myId), data = await bgPanda.dataObj(myId); this.tabs.removePosition(data.tabUnique, options.dbId);
			if (deleteDB) await this.stopCollecting(myId, null, false)
			await bgPanda.removePanda(myId, deleteDB, whyStop);
			delete this.pandaStats[myId];
			if (data.search) this.pandaGStats.subSearch(); else this.pandaGStats.subPanda();
			if (afterFunc !== null) await afterFunc('YES', myId);
		}, animate);
	}
	/** Remove job from an external script command and then send response back with the updated job list and removed job key equal to true;
	 * @param {number} dbId - Database ID  @param {function} sendResponse - Function to send response.  */
	extRemoveJob(dbId, sendResponse) {
		let myId = bgPanda.getMyId(dbId);
		if (myId >= 0) this.removeJob(myId, () => { this.getAllData( (data) => { data.for = 'removeJob'; data['removedJob'] = true; sendResponse(data); } )});
		else { sendResponse({'for':'removeJob', 'response':{}, 'removedJob':false}); }
	}
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr				 - Array of Deleted Jobs  @param  {function} [afterFunc] - After Function        @param  {string} [whyStop] - Why Stopping?
	 * @param  {function} [afterClose] - After Close Function   @param {string} [cancelText]   - Text on Cancel Button */
	removeJobs(jobsArr, afterFunc=null, whyStop=null, afterClose=null, cancelText='cancel') {
		let hitsList = '';
		for (const thisId of jobsArr) { hitsList += '( ' + $(`#pcm-hitReqName-${thisId}`).html() + ' ' + [$(`#pcm-hitPrice-${thisId}`).html()] + ' )<BR>'; }
		if (!modal) modal = new ModalClass();
		modal.showDeleteModal(hitsList, async (saved, theButton) => {
			$(theButton).prop('disabled', true);
			for (const myId of jobsArr) {
				let options = bgPanda.options(myId), info = bgPanda.options(myId);
				await MYDB.getFromDB('panda',_, options.dbId).then( async r => {
					info.data = r; await this.removeJob(myId, afterFunc,_,_, whyStop); await delay(15);
				}, rejected => console.error(rejected));
			}
			$(theButton).prop('disabled', false);
			modal.closeModal();
		}, () => { if (afterFunc) afterFunc('NO'); }, () => { if (afterFunc) afterFunc('CANCEL'); }, () => { if (afterClose) afterClose(); else modal = null; }, cancelText);
	}
	/** Shows that this ham button was clicked or went into go ham mode automatically.
	 * @param  {number} myId - Unique ID  @param  {object} targetBtn - Ham Button  @param  {bool} [autoGoHam] - Auto Go Ham?  @param {bool} [manual] - Added Manually? */
	hamButtonClicked(myId, targetBtn, autoGoHam=false, manual=false) {
		let options = bgPanda.options(myId);
		if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, !autoGoHam); }
		else if (targetBtn.hasClass('pcm-buttonOff') && targetBtn.hasClass('pcm-delayedHam') && !manual) bgPanda.timerGoHam(options.queueUnique);
		else if (targetBtn.hasClass('pcm-buttonOff') && manual) bgPanda.timerGoHam(options.queueUnique);
		else bgPanda.timerHamOff();
	}
	/** Shows that this panda search job is collecting in panda mode.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchCollecting(myId) { let pandaStat = this.pandaStats[myId]; pandaStat.doSearchCollecting(true); this.cards.pandaSearchCollectingNow(myId); }
	/** Shows that this panda search job is disabled and not being searched anymore.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchDisabled(myId) {
		let pandaStat = this.pandaStats[myId];
		if (pandaStat) {
			if (pandaStat.doSearching()) this.pandaGStats.subCollecting();
			if (this.pandaGStats.collectingTotal.value < 1) this.pandaGStats.collectingOff();
			pandaStat.doSearching(false); pandaStat.doCollecting(false); pandaStat.doSearchCollecting(false); this.cards.pandaSearchDisabled(myId);
		}
	}
	/** Shows that this panda search job is being searched on the search page by the search class.
	 * @param  {number} myId - The unique ID for a panda job. */
	searchingNow(myId) { let pandaStat = this.pandaStats[myId]; pandaStat.doSearching(true); this.cards.pandaSearchingNow(myId); }
	/** When panda's are coming in externally too fast they need to delay collecting for 1600 milliseconds each.
	 * @async 								 - To wait for panda data to be fully loaded.
	 * @param  {number} [diff] - The difference of time since the last panda was added. */
	async nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length > 0) {
			this.hitQueue.sort((a,b) => b.price - a.price);
			if (diff === null) diff = new Date().getTime() - this.lastAdded;
			if (diff === -1 || diff >= this.hitQueue[0].lowestDur) {
				let obj = this.hitQueue.shift(), info = bgPanda.options(obj.myId), data = await bgPanda.dataObj(obj.myId);
				this.lastAdded = new Date().getTime(); if (info.autoAdded !== false) info.autoAdded = true; data.hitsAvailable = obj.hitsAvailable;
				this.cards.updateAllCardInfo(obj.myId, info); this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam, obj.tF);
				if (this.hitQueue.length === 0) { this.lastAdded = null; this.delayedTimeout = null; }
				else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
			} else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
		} else this.delayedTimeout = null;
	}
	/** Run this panda after adding it to panda class with a temporary duration and temporary go ham duration.
	 * @param  {number} myId - Myid  @param  {number} tempDuration - Temporary duration  @param  {number} tempGoHam - Temporary goham duration
	 * @param  {number} [tF] - Temporary Fetches */
	runThisPanda(myId, tempDuration, tempGoHam, tF=0) {
		let hitInfo = bgPanda.options(myId), diff = null;
		bgPanda.checkIfLimited(myId, false, hitInfo.data);
		if (!this.pandaStats[myId].collecting) {
			let nowDate = new Date().getTime();
			this.hitQueue.push({'myId':myId, 'price':hitInfo.data.price, 'hitsAvailable':hitInfo.data.hitsAvailable, 'tempDuration': tempDuration, 'tempGoHam':tempGoHam, 'delayedAt':nowDate, 'lowestDur':Math.min(tempDuration, tempGoHam), 'tF':tF});
			if (this.lastAdded !== null) {
				diff = nowDate - this.lastAdded;
				if (diff < this.hitQueue[0].lowestDur) {
					if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
					bgPanda.sendStatusToSearch(hitInfo.data, true); 
					if (!this.delayedTimeout) this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500, diff);
				} else this.nextInDelayedQueue(diff);
			} else this.nextInDelayedQueue(-1);
		} else { this.cards.updateAllCardInfo(myId, hitInfo); }
	}
	/** Add panda job from an external source like forums, scripts or panda buttons on MTURK.
	 * @param  {object} msg - The message object from the external source. */
	addFromExternal(msg) {
		let myId = null, search = (msg.command === 'addSearchOnceJob') ? 'gid' : (msg.command === 'addSearchMultiJob') ? 'rid' : null;
		let once = (msg.command === 'addOnceJob' || msg.command === 'addSearchOnceJob'), run = (msg.command !== 'addOnlyJob');
		if (!msg.auto) msg.auto = false;
		let duration = ((search) ? 10000 : (msg.auto) ? 12000 : 0), hamD = (!msg.hamDuration) ? globalOpt.getHamDelayTimer() : msg.hamDuration;
		if (search === 'rid' && msg.reqId !== '' && bgPanda.searchesReqIds.hasOwnProperty(msg.reqId)) myId = bgPanda.searchesReqIds[msg.reqId][0];
		if (search === 'gid' && msg.groupId !== '' && bgPanda.searchesGroupIds.hasOwnProperty(msg.groupId)) myId = bgPanda.searchesGroupIds[msg.groupId][0];
		if (myId === null) {
			let data = dataObject(msg.groupId, msg.description, decodeURIComponent(msg.title), msg.reqId, decodeURIComponent(msg.reqName), msg.price);
			let opt = optObject(once, search,_,_,_,_,_,_, hamD);
			if (search && globalOpt.theToSearchUI() && MySearch.isSearchUI()) { data.id = -1; data.disabled = false; bgPanda.sendToSearch(-1, {...data, ...opt},_,_, true,_,_, true, true); }
			else this.addPanda(data, opt, (msg.auto) ? true : false, run, true, duration, 4000);
		} else if (search === 'rid') this.doSearching(myId);
		else this.startCollecting(myId)
	}
	/** Add panda from search triggers. Is used to use search jobs instead of adding a new HIT if not needed.
	 * @param  {object} data			- Data                 @param  {object} opt			   - Options         @param  {object} auto			    - Auto Added
	 * @param  {object} run			  - Run after?           @param  {bool} ext			     - From external?  @param  {number} tempDuration - Temp duration
	 * @param  {number} tempGoHam - Temp GoHam duration  @param  {number} searchType - Search type     @param  {string} [myId]       - MyId
	 * @param  {string} [from]    - from which UI?			 @param  {number} [tF] 			 - Temp fetches */
	addFromSearch(data, opt, auto, run, ext, tempDuration, tempGoHam, searchType, myId=-1, from='fromPanda', tF=0) {
		if (myId !== -1 && data.reqName !== '') bgPanda.updateReqName(myId, data.reqName);
		if (data.hamDuration === 0) data.hamDuration = globalOpt.getHamDelayTimer();
		this.addPanda(data, opt, auto, run, ext, tempDuration, tempGoHam,_,_,_,_, searchType, from, tF);
	}
	/** Add panda from the database.
	 * @async							- To wait for the process of adding data to the database.
	 * @param  {object} r - Panda Job Data  @param  {bool} [loaded] - Already Loaded? */
	async addPandaDB(r, loaded=true) { 
		let update = gNewVersion, tabUniques = this.tabs.getUniques();
		if (typeof r.dateAdded === 'string') { r.dateAdded = new Date(r.dateAdded).getTime(); update = true; }
		if (!r.hasOwnProperty('mute')) { r.mute = false; update = true; }
		if (!tabUniques.includes(r.tabUnique)) { r.tabUnique = tabUniques[0]; update = true; }
		let hamD = (r.hamDuration === 0) ? globalOpt.getHamDelayTimer() : r.hamDuration; if (r.hamDuration !== hamD) { update = true; r.hamDuration = hamD; }
		let dO = dataObject(r.groupId, r.description, r.title, r.reqId, r.reqName, r.price, r.hitsAvailable, r.assignedTime, r.expires, r.friendlyTitle, r.friendlyReqName);
		let oO = optObject(r.once, r.search, r.tabUnique, r.limitNumQueue, r.limitTotalQueue, r.limitFetches, r.duration, r.autoGoHam, hamD, r.acceptLimit, r.day, r.weight, r.dailyDone, r.disabled, r.mute);
		let dbInfo = {...dO, ...oO, 'dateAdded':r.dateAdded, 'totalSeconds':r.totalSeconds, 'totalAccepted':r.totalAccepted, 'tF':0};
		if (r.hasOwnProperty('id')) dbInfo.id = r.id;
		await bgPanda.addPanda(dbInfo, false, {},_,_, update, loaded, globalOpt.theSearchDuration(), globalOpt.getHamDelayTimer());
	}
	/** Add a new panda job with lot of information and options to the panda area and database.
	 * @async											- To wait for the data to be loaded from database if needed.
	 * @param  {object} [d]			  - Data            @param  {object} [opt]		 - Options         @param  {object} [add]		     - Auto Added?
	 * @param  {bool} [run]		  	- Run After?      @param  {bool} [ext]		   - From external?  @param  {number} [tDur]       - Temp duration
	 * @param  {number} [tGoH]		- GoHam duration  @param  {bool} [loaded]    - Loaded?         @param  {object} [addDate]    - Date
	 * @param  {number}	[seconds]	- Seconds         @param  {number} [accepts] - Accepted        @param  {number} [searchType] - Search Type
	 * @param  {string} [from]    - from which UI?  @param  {number} [tF]      - Temp fetches */
	async addPanda(d={}, opt={}, add=false, run=false, ext=false, tDur=0, tGoH=0, loaded=false, addDate=null, seconds=0, accepts=0, searchType='', from='fromPanda', tF=0) {
		let dated = (addDate) ? addDate : new Date().getTime(), myIdFound = bgPanda.checkExisting(d.groupId, searchType);
		if (ext && myIdFound !== null && !opt.search) {
			let info = bgPanda.options(myIdFound);
			if (!info.data) await bgPanda.getDbData(myIdFound);
			if (!info.data.once || (info.data.once && this.pandaStats[myIdFound].accepted.value === 0)) {
				info.data.hitsAvailable = d.hitsAvailable; info.data.reqName = d.reqName; info.data.reqId = d.reqId;
				info.data.title = d.title; info.data.description = d.description; info.data.price = d.price;
				this.runThisPanda(myIdFound, tDur, tGoH, tF);
			}
		} else {
			if (opt.tabUnique === -1) opt.tabUnique = this.tabs.getTabInfo(this.tabs.currentTab).id;
			let dbInfo = {...d, ...opt, 'dateAdded': dated, 'totalSeconds':seconds, 'totalAccepted':accepts, 'tF':tF}, newAddInfo = {'tempDuration':tDur, 'tempGoHam':tGoH, 'run':run};
			await bgPanda.addPanda(dbInfo, add, newAddInfo,_,_, false, loaded, globalOpt.theSearchDuration(), globalOpt.getHamDelayTimer());
		}
	}
	/** Add this panda job to the panda UI with a card and stats.
	 * @param  {number} myId 	 - Unique ID         @param  {object} pandaInfo	- Panda Info      @param  {object} newAddInfo - New Info
	 * @param  {bool} [loaded] - Database loaded?  @param  {bool} [multiple]  - Multiple jobs?  @param  {number} [tF]       - Temporary Fetches
	 * @return {number}				 - Panda Job Unique Number */
	addPandaToUI(myId, pandaInfo, newAddInfo, loaded=false, multiple=false, tF=0) {
		this.cards.addCard(myId, pandaInfo, loaded, multiple); this.pandaStats[myId] = new PandaStats(myId, pandaInfo.dbId, this.cards.acceptedStatusText, this.cards.fetchedStatusText);
		if (pandaInfo.data.dailyDone > 0) this.pandaStats[myId].setDailyStats(pandaInfo.data.dailyDone);
		if (pandaInfo.search && (loaded || (newAddInfo && !newAddInfo.run))) this.searchDisabled(myId);
		if (pandaInfo.search) this.pandaGStats.addSearch(); else this.pandaGStats.addPanda();
		if (pandaInfo.disabled) this.cards.pandaDisabled(myId);
		if (!multiple) {
			this.cards.appendDoc(pandaInfo.data.tabUnique); this.pandaStats[myId].updateAllStats(this.cards.get(myId));
			if (bgPanda.isTimerGoingHam()) $(`#pcm-hamButton-${myId}`).addClass('disabled');
			if (newAddInfo) {
				if ((pandaInfo.search === 'gid' || pandaInfo.search === null) && newAddInfo.run) this.runThisPanda(myId, newAddInfo.tempDuration, newAddInfo.tempGoHam, tF);
				else if (pandaInfo.search === 'rid' && newAddInfo.run) {
					this.pandaGStats.addCollecting(); this.pandaGStats.collectingOn(); bgPanda.doSearching(myId, pandaInfo.data);
				}
			}
			this.cards.cardButtons();
		}
    return myId;
  }
  /** When a HIT is accepted then set up the stats and display it on the card.
   * @param  {number} myId - Unique ID  @param  {number} queueUnique - Queue ID  @param  {object} html - Html object  @param  {object} url - URL */
	hitAccepted(myId, queueUnique, html, url) {
		this.logTabs.queueTotal++; this.logTabs.updateCaptcha(globalOpt.updateCaptcha());
    this.pandaGStats.addTotalAccepted(); this.cards.highlightEffect_card(myId);
		let pandaInfo = bgPanda.options(myId); this.pandaStats[myId].addAccepted(); pandaInfo.data.dailyDone++;
    if (pandaInfo.autoTGoHam !== 'disable' && (pandaInfo.data.autoGoHam || pandaInfo.autoTGoHam === 'on')) {
      bgPanda.timerGoHam(queueUnique, pandaInfo.data.hamDuration);
    }
    bgPanda.resetTimerStarted(queueUnique);
    let targetDiv = $(html).find('.project-detail-bar .task-project-title').next('div'), rawProps = targetDiv.find('span').attr('data-react-props');
		let auth_token = $(html).find(`input[name='authenticity_token']:first`), formUrl = auth_token.closest('form').attr('action');
		let formInfo = formUrl.match(/\/projects\/([^\/]*)\/tasks[\/?]([^\/?]*)/);
    bgPanda.authenticityToken = auth_token.val();
		let hitDetails = JSON.parse(rawProps).modalOptions; hitDetails.task_id = formInfo[2];
		hitDetails.assignment_id = bgPanda.parseHitDetails(hitDetails, myId, pandaInfo.data); bgPanda.queueAddAccepted(pandaInfo, hitDetails);
		this.logTabs.addIntoQueue(hitDetails, pandaInfo.data, url.replace('https://worker.mturk.com',''));
		this.logTabs.addToLog(pandaInfo.data); this.updateLogStatus(myId, 0, pandaInfo.data);
		if (globalOpt.isNotifications()) notify.showAcceptedHit(pandaInfo.data);
		if (!pandaInfo.data.mute) theAlarms.doAlarms(pandaInfo.data);
		bgPanda.checkIfLimited(myId, true, pandaInfo.data);
		targetDiv = null; rawProps = null; formInfo = null; hitDetails = null;
	}
	/** Does any resetting of any values needed when the new day happens?
	 * @async - To wait for all of the job data to be loaded from database. */
	async resetDailyStats() {
		await bgPanda.getAllPanda(false);
		for (const key of Object.keys(this.pandaStats)) {
			this.pandaStats[key].setDailyStats(); let data = bgPanda.data(key); data.day = new Date().getTime(); data.dailyDone = 0;
		}
		bgHistory.maintenance(); bgPanda.nullData(false, true);
	}
	/** Returns all panda jobs data after getting all data from database for sending back to another tab in a response send function.
	 * @async                         - To wait for all the data to be loaded.
	 * @param {function} sendResponse - Function to send the panda job data. */
	async getAllData(sendResponse) {
		await bgPanda.getAllPanda(false); let copiedData = JSON.parse(JSON.stringify(bgPanda.getData()));
		bgPanda.nullData(false, true); sendResponse({'for':'getJobs', 'response':copiedData});
	}
	/** Returns the total number recorded of HITs in queue.
	 * @param  {string} [gId] - Group ID to search for and count the HITs in queue.
	 * @return {number}       - Returns the number of group ID HITs or all HITs in queue. */
	totalResults(gId='') { return this.logTabs.totalResults(gId); }
	/** Sounds an alarm by the name parameter. Will check if the name is correct before calling alarm function.
	 * @param  {string} name - The name of an alarm to sound. */
	soundAlarm(name) { if (['Captcha','Queue','Full'].includes(name)) theAlarms[`do${name}Alarm`](); }
	/** Notifies the user that a captcha has been found. */
	captchaAlert() { if (globalOpt.isNotifications() && globalOpt.isCaptchaAlert()) notify.showCaptchaAlert(); }
	/** Notifies the user that they can't accept any more HITs for today. */
	mturkLimit() { if (globalOpt.isNotifications()) notify.showDailyLimit(); }
	/** Updates the status log tab on the bottom with relevant information.
	 * @param  {number} myId - The unique ID  @param  {number} milliseconds - Elapsed time  @param  {object} [changes] - Stat changes to make */
	updateLogStatus(myId, milliseconds, changes=null) { const stats = (changes) ? null : this.pandaStats[myId]; this.logTabs.updateLogStatus(stats, myId, milliseconds, changes); }
	/** Save the queue results received after making sure the groupings are checked for start times to start.
	 * @param  {object} queueResults - Object from the MTURK queue with all the HITs information. */
	async gotNewQueue(queueResults) {
		groupings.checkStartTimes();
		if (isNewDay()) await this.resetDailyStats();
		this.logTabs.updateQueue(queueResults);
		if (this.tabLogResized) { globalOpt.theTabLogHeight(this.tabLogHeight); this.tabLogResized = false; }
	}
	/** A HIT was submitted externally.
	 * @param  {object} request - The HIT data object with info. */
	submittedHit(request) { this.logTabs.removeFromQueue(request.taskId); this.pandaGStats.addSubmitted(); this.pandaGStats.thePotentialEarnings(null, request.price); }
	/** A HIT was returned externally.
	 * @param {object} request - The HIT data object with info. */
	returnedHit(request) { this.logTabs.removeFromQueue(request.taskId); }
	/** A HIT was accepted externally.
	 * @param {object} request - The HIT data object with info. */
	acceptedHit(request) {
		request.assignedTime = request.duration;
		this.logTabs.addIntoQueue(request.hitData, request, request.hitData.task_url.replace('https://worker.mturk.com',''));
	}
	/** Set the value of the potential earnings from MTURK.
	 * @param  {string} earnings - Earnings value from MTURK. */
	setEarnings(earnings) { this.pandaGStats.thePotentialEarnings(earnings); }
	/** Shows the page number for the earnings page on the status bar.
	 * @param {number} [page] Page # for Earning Page */
	waitEarningsPage(page=1) { this.pandaGStats.waitEarningsPage(page); }
	/** Resets any helper tooltips with the tooltip option value from user.
	 * @param {bool} [enabled] - Show Helper ToolTips? */
	resetToolTips(enabled=true) { if (enabled) $('.pcm-tooltipHelper').removeClass('pcm-tooltipDisable'); else $('.pcm-tooltipHelper').addClass('pcm-tooltipDisable'); }
	/** Halt this script with an error message.
	 * @param  {object} error - Error Object  @param  {string} alertMessage - Alert Message  @param  {string} title - Title. */
	haltScript(error, alertMessage, title) { haltScript(error, alertMessage, null, title); }
	/** New version detected so send a notification to user.
	 * @param  {string} version - New Version Number */
	newVersionAvailable(version) { if (notify) notify.showNewVersion(version); }
	queueAlertUpdate() { this.logTabs.queueAlertUpdate(); }
}
