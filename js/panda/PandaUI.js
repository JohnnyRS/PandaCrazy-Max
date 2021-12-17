/** This class takes care of the pandacrazy user interface.
 * @class PandaUI ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
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
		this.tabLogResized = false;							// Did the log tab get resized?
	}
	/** Gets the total HITs in the queue.
   * @return {number} - Total HITs in the queue.
	**/
	getQueueTotal() { return this.logTabs.queueTotal; }
	/** Delete the panda stats from the stat database for this panda with this unique ID and database ID.
	 * @param  {number} myId - MyID number.  @param  {number} dbId - Database ID.
	**/
	deleteFromStats(myId, dbId) { this.pandaStats[myId].deleteIdFromDB(dbId); }
	/** Will send all stats to the function given.
	 * @return {object} - Returns object with stats.
	**/
	sendStats() { if (this.pandaGStats) return this.pandaGStats.sendStats(); }
	/** Loads up any panda jobs that are saved or saves default panda jobs if database was just created.
	 * @async												- To wait for the tabs to completely load from the database.
	 * @param  {function} afterFunc - Function to call after done to send success array or error object.
	**/
	async prepare(afterFunc) {
		let success = [], err = null;
		this.tabs = new TabbedClass($(`#pcm-pandaSection`), `pcm-pandaTabs`, `pcm-tabbedPandas`, `pcm-pandaTabContents`);
		this.cards.prepare(this.tabs); this.logTabs = new LogTabsClass(); this.logTabs.updateCaptcha(MyOptions.getCaptchaCount()); this.pandaGStats = new PandaGStats();
		[success[0], err] = await this.tabs.prepare();
		if (!err) {
			let oO = optObject(_,_,_,_,_,_,_,_, MyOptions.getHamDelayTimer()), savedLogHeight = MyOptions.theTabLogHeight();
			if (MYDB.useDefault('panda')) await this.addPanda(dataObject('3SHL2XNU5XNTJYNO5JDRKKP26VU0PY', 'Tell us if two receipts are the same', 'Tell us if two receipts are the same', 'AGVV5AWLJY7H2', 'Receipt Processing', '0.01'), oO,_,_,_,_,_,true);
			else err = await MyPanda.getAllPanda(); // Not using initializing default value so load from database
			if (!err) {
				[success[1], err] = await this.logTabs.prepare();
				if (!err) {
					let tabUniques = this.tabs.getUniques(), dbIds = Object.keys(MyPanda.dbIds);
					for (const unique of tabUniques) {
						let positions = this.tabs.getPositions(unique);
						for (const dbId of positions) {
							let myId = MyPanda.getMyId(dbId);
							dbIds = arrayRemove(dbIds, dbId.toString());
							if (MyPanda.info.hasOwnProperty(myId)) this.addPandaToUI(myId, MyPanda.options(myId), null, true, true);
							else this.tabs.removePosition(unique, dbId);
							if (this.pandaStats[myId]) this.pandaStats[myId].updateAllStats(this.cards.get(myId));
						}
						this.cards.appendDoc(unique);
					}
					if (dbIds.length > 0) {
						for (const dbId of dbIds) {
							let myId = MyPanda.getMyId(dbId), info = MyPanda.options(myId); info.tabUnique = 1;
							this.addPandaToUI(myId, info, null, true); this.tabs.setPosition(1, Number(dbId));
						}
					}
					this.cards.cardButtons();
					if (MyPanda.pandaUniques > 0) {
						let firstPanda = MyPanda.pandaUniques[0];
						this.hamBtnBgColor = $(`#pcm-hamButton-${firstPanda}`).css('background-color'); this.hamBtnColor = $(`#pcm-hamButton-${firstPanda}`).css('color');
					}
					MyPanda.nullData();
				}
			}
			this.tabPandaHeight = $(`#pcm-pandaPanel`).height(); this.tabLogHeight = $(`#pcm-logPanel`).height(); this.windowHeight = window.innerHeight;
			if (savedLogHeight < 10) { savedLogHeight = this.tabLogHeight; MyOptions.theTabLogHeight(this.tabLogHeight); }
			this.pandaGStats.setPandaTimer(MyPanda.timerChange()); this.pandaGStats.setHamTimer(MyPanda.hamTimerChange());
			this.pandaGStats.setSearchTimer(MySearch.timerChange()); this.pandaGStats.setQueueTimer(MyQueue.timerChange());
			window.onresize = () => { this.resizeTabContents(); }
			this.resizeObserver = new ResizeObserver((entries) => this.panelResized(entries));
			let newPandaHeight = $(`#pcm-pandaUI`).innerHeight() - $(`.pcm-pandaTop:first`).outerHeight() - $(`.pcm-pandaQuickRow:first`).outerHeight() - savedLogHeight;
			$(`#pcm-pandaPanel`).height(newPandaHeight); this.panelResized([1])
			$('#pcm-pandaPanel').mousedown( () => { this.resizeObserver.observe($('#pcm-pandaPanel')[0]); } )
			$('#pcm-pandaPanel').mouseup( () => { this.resizeObserver.disconnect(); } )
		}
		if (afterFunc) afterFunc(success, err);
	}
	/** Removes all panda jobs from UI and stats. **/
	removeAll() {
		if (this.cards) this.cards.removeAll(); if (this.tabs) this.tabs.wipeTabs(); if (this.logTabs) this.logTabs.removeAll();
		this.cards = null; this.pandaStats = {}; this.listener = null; this.hitQueue = []; this.lastAdded = null; this.tabs = null; this.logTabs = null;
		this.pandaGStats = null; this.delayedTimeout = null; this.resizeObserver = null; this.modalJob = null;
	}
  /** Resizes the tab contents according to window size changes. **/
  resizeTabContents() {
    let windowChange = this.innerHeight - window.innerHeight;
    $('#pcm-pandaTabContents .pcm-tabs').height(`${this.tabs.tabContentsHeight - windowChange}px`);
		$('#pcm-pandaPanel').height(`${this.tabPandaHeight - windowChange}px`);
		this.tabs.tabContentsHeight = $('#pcm-pandaTabContents .pcm-tabs:first').height(); this.innerHeight = window.innerHeight;
    this.tabPandaHeight = $('#pcm-pandaPanel').height();
	}
	/** Resizes the panda and log panels when user is resizing them.
	 * @param  {array} entries - Number of entries resizeObserver finds that got resized.
	**/
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
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. **/
	resetCSSValues() {
		this.cards.resetCSSValues(); this.pandaGStats.resetCSSValues();
		for (const key of Object.keys(this.pandaStats)) { this.pandaStats[key].prepare(this.cards.acceptedStatusText, this.cards.fetchedStatusText); this.pandaStats[key].updateAllStats(); }
		MyMenus.resetCSSValues(); this.logTabs.resetCSSValues();
	}
	/** Will toggle the paused value or force the paused value to a given value.
	 * @param  {bool} [val] - Force pause value.
	**/
	pauseToggle(val=null) { if (MyPanda) { if (MyPanda.pauseToggle(val)) $('#pcm-bqPandaPause').html('Unpause'); else $('#pcm-bqPandaPause').html('Pause'); }}
	/** Shows the logged off modal and after it will unpause the timer. **/
	nowLoggedOff() {
		if (!MyModal) MyModal = new ModalClass(); MyModal.showLoggedOffModal( () => { if (MyModal.modals.length < 2) MyModal = null; MyPanda.unPauseTimer(); });
		if (!MyPanda.isLoggedOff()) { MyAlarms.doLoggedOutAlarm(); if (MyOptions.isNotifications()) MyNotify.showLoggedOff(); }
		MyDash.nowLoggedOff();
	}
	/** Shows the Captcha Found Modal and after it will unpause the timers.
	 * @param  {string} [url] - Url of panda to use to fill in captcha.
	**/
	captchaFound(url='') {
		MyOptions.resetCaptcha(); this.pauseToggle(true); document.title = 'Captcha Found - Panda Crazy Max'; this.captchaAlert();
		this.soundAlarm('Captcha'); console.info('captcha found');
		if (!MyModal) MyModal = new ModalClass(); MyModal.showCaptchaModal( () => {
			if (MyModal.modals.length < 2) MyModal = null; this.pauseToggle(false); document.title = 'Panda Crazy Max';
		}, url.replace('?format=json',''));
	}
  /** Closes the logged off modal if it's opened. **/
	nowLoggedOn() { if (MyModal) MyModal.closeModal('Program Paused!'); MyDash.nowLoggedOn(); }
	/** Sets the mute value of the specific panda job with the unique number with the status value.
	 * @param  {number} myId - Unique number.  @param  {bool} value - Mute status.
	**/
	pandaMute(myId, value) { this.cards.pandaMute(myId, value); }
	/** Informs the status of the SearchUI page to this page so SearchUI buttons can be enabled or disabled.
	 * @param  {bool} [status] - Status of SearchUI.
	**/
	searchUIConnect(status=true) { if (this.modalJob) this.modalJob.searchUIConnect(status); }
  /** Gets the status from the timer and shows the status on the page.
   * @param  {bool} running - Running status.  @param  {bool} paused - Paused timer.
	**/
  collectingStatus(running, paused) {
    if (!running) this.pandaGStats.collectingOff();
		if (paused) this.pandaGStats.collectingPaused(); else this.pandaGStats.collectingUnPaused();
  }
	/** Show the jobs modal for editing panda jobs or panda jobs in a grouping.
	 * @async													- To wait for all the data for panda's to be loaded from database.
	 * @param  {string} [type]			  - Type of data.         @param  {number} [groupings]	  - Grouping ID number.  @param  {object} [thisObj]			 - Grouping object.
	 * @param  {function} [saveFunc]	- Save function.        @param  {function} [checkFunc]  - Check function.  		 @param  {function} [cancelFunc] - Cancel function.
	 * @param  {function} [afterShow] - After show function.  @param  {function} [afterClose] - After close function.
	**/
	async showJobsModal(type='jobs', groupings=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null, afterClose=null) {
		let err = await MyPanda.getAllPanda(false); // Just loading all panda data into memory.
		if (err) { this.haltScript(err, 'Failed getting data from database for all pandas so had to end script.', 'Error getting panda data. Error:'); }
		if (!this.modalJob) this.modalJob = new ModalJobClass();
		this.modalJob.showJobsModal(type, groupings, thisObj, saveFunc, checkFunc, () => {
			if (cancelFunc !== null) cancelFunc();
			MyPanda.nullData(false);
		}, afterShow, () => { this.modalJob = null; if (afterClose) afterClose(); else MyModal = null; });
	}
	/** Shows the add job modal. **/
	showJobAddModal() { this.modalJob = new ModalJobClass(); this.modalJob.showJobAddModal( () => { this.modalJob = null; } ); }
	/** Start panda job collecting with this unique ID and set the duration for collecting and go ham.
	 * @async												- To wait for the loading of the data from the database.
	 * @param  {number} myId 			  - Unique ID.  				@param  {bool}   [goHamStart] - Ham start.  @param  {number} [tempDuration] - Temp duration.
	 * @param  {number} [tempGoHam] - Temp ham duration.  @param  {number} [tF]         - Temp fetches.
	**/
	async startCollecting(myId, goHamStart=false, tempDuration=0, tempGoHam=0, tF=0, auto=false) {
		if (MyPanda.checkUnique(myId)) {
			let pandaStat = this.pandaStats[myId], alreadySearching = pandaStat.searching;
			if (!pandaStat.collecting) { // Make sure this panda is not collecting.
				let goodCollect = await MyPanda.startCollecting(myId, goHamStart, tempDuration, tempGoHam, tF);
				if (goodCollect) {
					let data = await MyPanda.dataObj(myId);
					this.logTabs.addToStatus(data, pandaStat, myId);
					if (!pandaStat.collecting && !alreadySearching) this.pandaGStats.addCollecting();
					this.pandaGStats.collectingOn(); pandaStat.startCollecting(auto);
					$(`#pcm-collectButton-${myId}, #pcm-collectButton1-${myId}, #pcm-collectButton2-${myId}`).removeClass('pcm-buttonOff pcm-searchDisable').addClass('pcm-buttonOn');
				}
			}
		}
	}
	/** Stop panda job collecting with this unique ID and delete from database if needed.
	 * @async											- To wait for the updating of the data to the database.
	 * @param  {number} myId      - Unique ID.   @param  {string} [whyStop] - Stopped reason.  @param  {bool} [deleteData] - Delete data?
	 * @param  {bool} [searching]	- Job Search?
	**/
	async stopCollecting(myId, whyStop=null, deleteData=true, searching=false) {
		if (!MyPanda.checkUnique(myId)) return;
		let pandaStat = this.pandaStats[myId];
		if (pandaStat.collecting || pandaStat.searching) {
			let info = MyPanda.options(myId), classToo = '';
			if (!info.data) await MyPanda.getDbData(myId);
			if (whyStop === 'manual') this.cards.collectTipChange(myId, '');
			if (pandaStat.collecting && !pandaStat.searching && !searching) this.pandaGStats.subCollecting();
			let theStats = pandaStat.stopCollecting(); this.pandaGStats.collectingOff();
			info.data.totalSeconds += theStats.seconds; info.data.totalAccepted += theStats.accepted;
			let hitData = Object.assign({}, info.data); // Make a copy of data.
			MyPanda.stopCollecting(myId, hitData, whyStop);
			if ($(`#pcm-collectButton-${myId}`).is('.pcm-btnCollecting') && !searching) classToo = ' pcm-searchDisable';
			$(`#pcm-collectButton-${myId}, #pcm-collectButton1-${myId}, #pcm-collectButton2-${myId}`).removeClass('pcm-buttonOn pcm-btnCollecting').addClass(`pcm-buttonOff${classToo}`);
			$(`#pcm-hamButton-${myId}`).removeClass('pcm-delayedHam');
			let previousColor = $(`#pcm-pandaCard-${myId}`).data('previousColor');
			if (previousColor && !info.skipped) $(`#pcm-pandaCard-${myId}`).stop(true,true).removeData('previousColor').animate({'backgroundColor':previousColor},{'duration':1000});
			await MyPanda.updateDbData(myId, hitData); this.logTabs.removeFromStatus(myId);
			if (deleteData && !info.skipped) info.data = null;
			info.queueUnique = null; info.autoTGoHam = 'off';
		}
	}
	/** Removes a job from the UI.
	 * @async										 - To wait for removal of cards with animation on UI and panda job from database.
	 * @param  {Number} myId		 - Unique number.    @param  {function} [afterFunc] - After function.  @param  {function} [animate] - Animate card?
	 * @param  {bool} [deleteDB] - Database delete?  @param  {string} [whyStop]     - Why stopping?
	**/
	async removeJob(myId, afterFunc=null, animate=true, deleteDB=true, whyStop=null) {
		this.cards.removeCard(myId, async () => {
			let options = MyPanda.options(myId), data = await MyPanda.dataObj(myId); this.tabs.removePosition(data.tabUnique, options.dbId);
			if (deleteDB) await this.stopCollecting(myId, null, false)
			await MyPanda.removePanda(myId, deleteDB, whyStop);
			delete this.pandaStats[myId];
			if (data.search) this.pandaGStats.subSearch(); else this.pandaGStats.subPanda();
			if (afterFunc !== null) await afterFunc('YES', myId);
		}, animate);
	}
	/** Remove job from an external script command and then send response back with the updated job list and removed job key equal to true;
	 * @async  							 - To wait for the job to be fully removed.
	 * @param  {number} dbId - Database ID.
	 * @return {object}			 - Returns the object with removed job status.
	**/
	async extRemoveJob(dbId) {
		let myId = MyPanda.getMyId(dbId);
		if (myId >= 0) await this.removeJob(myId, async () => {
			let retData = await this.getAllData(true); retData.for = 'removeJob'; retData['removedJob'] = true;
			return retData;
		});
		else { return {'for':'removeJob', 'response':{}, 'removedJob':false}; }
	}
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr				 - Array of deleted jobs.  @param  {function} [afterFunc] - After function.        @param  {string} [whyStop] - Why stopping?
	 * @param  {function} [afterClose] - After close function.   @param  {string} [cancelText]  - Text on cancel button.
	**/
	removeJobs(jobsArr, afterFunc=null, whyStop=null, afterClose=null, cancelText='cancel') {
		let hitsList = '';
		for (const thisId of jobsArr) { hitsList += '( ' + $(`#pcm-hitReqName-${thisId}`).html() + ' ' + [$(`#pcm-hitPrice-${thisId}`).html()] + ' )<BR>'; }
		if (!MyModal) MyModal = new ModalClass();
		MyModal.showDeleteModal(hitsList, async (saved, theButton) => {
			$(theButton).prop('disabled', true);
			for (const myId of jobsArr) {
				let options = MyPanda.options(myId), info = MyPanda.options(myId);
				await MYDB.getFromDB('panda',_, options.dbId).then( async r => {
					info.data = r; await this.removeJob(myId, afterFunc,_,_, whyStop); await delay(15);
				}, rejected => console.error(rejected));
			}
			$(theButton).prop('disabled', false);
			MyModal.closeModal();
		}, () => { if (afterFunc) afterFunc('NO'); }, () => { if (afterFunc) afterFunc('CANCEL'); }, () => { if (afterClose) afterClose(); else MyModal = null; }, cancelText);
	}
	/** Shows that this ham button was clicked or went into go ham mode automatically.
	 * @param  {number} myId - Unique ID.  @param  {object} targetBtn - Ham button.  @param  {bool} [autoGoHam] - Auto go ham?  @param  {bool} [manual] - Added manually?
	**/
	hamButtonClicked(myId, targetBtn, autoGoHam=false, manual=false) {
		let options = MyPanda.options(myId);
		if (!this.pandaStats[myId].collecting) { this.startCollecting(myId, !autoGoHam); }
		else if (targetBtn.hasClass('pcm-buttonOff') && targetBtn.hasClass('pcm-delayedHam') && !manual) MyPanda.timerGoHam(options.queueUnique);
		else if (targetBtn.hasClass('pcm-buttonOff') && manual) MyPanda.timerGoHam(options.queueUnique);
		else MyPanda.timerHamOff();
	}
	/** Shows that this panda search job is collecting in panda mode.
	 * @param  {number} myId - The unique ID for a panda job.
	**/
	searchCollecting(myId) { let pandaStat = this.pandaStats[myId]; pandaStat.doSearchCollecting(true); this.cards.pandaSearchCollectingNow(myId); }
	/** Shows that this panda search job is disabled and not being searched anymore.
	 * @param  {number} myId - The unique ID for a panda job.
	**/
	searchDisabled(myId) {
		let pandaStat = this.pandaStats[myId];
		if (pandaStat) {
			if (pandaStat.doSearching()) this.pandaGStats.subCollecting();
			if (this.pandaGStats.collectingTotal.value < 1) this.pandaGStats.collectingOff();
			pandaStat.doSearching(false); pandaStat.doCollecting(false); pandaStat.doSearchCollecting(false); this.cards.pandaSearchDisabled(myId);
		}
	}
	/** Shows that this panda search job is being searched on the search page by the search class.
	 * @param  {number} myId - The unique ID for a panda job.
	**/
	searchingNow(myId) { let pandaStat = this.pandaStats[myId]; pandaStat.doSearching(true); this.cards.pandaSearchingNow(myId); }
	/** When panda's are coming in externally too fast they need to delay collecting for 500 milliseconds each.
	 * @async 								 - To wait for panda data to be fully loaded.
	 * @param  {number} [diff] - The difference of time since the last panda was added.
	**/
	async nextInDelayedQueue(diff=null) {
		if (this.hitQueue.length > 0) {
			this.hitQueue.sort((a,b) => b.price - a.price);
			if (diff === null) diff = new Date().getTime() - this.lastAdded;
			if (diff === -1 || diff >= this.hitQueue[0].lowestDur) {
				let obj = this.hitQueue.shift(), info = MyPanda.options(obj.myId), data = await MyPanda.dataObj(obj.myId);
				this.lastAdded = new Date().getTime(); if (info.autoAdded !== false) info.autoAdded = true; data.hitsAvailable = obj.hitsAvailable;
				this.cards.updateAllCardInfo(obj.myId, info); this.startCollecting(obj.myId, false, obj.tempDuration, obj.tempGoHam, obj.tF, obj.auto);
				if (this.hitQueue.length === 0) { this.lastAdded = null; this.delayedTimeout = null; }
				else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
			} else this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500);
		} else this.delayedTimeout = null;
	}
	/** Run this panda after adding it to panda class with a temporary duration and temporary go ham duration.
	 * @param  {number} myId - Myid number.        @param  {number} tempDuration - Temporary duration.  @param  {number} tempGoHam - Temporary goham duration.
	 * @param  {number} [tF] - Temporary fetches.  @param  {bool} [auto] 				 - Automatically running?
	**/
	runThisPanda(myId, tempDuration, tempGoHam, tF=0, auto=false) {
		let hitInfo = MyPanda.options(myId), diff = null;
		MyPanda.checkIfLimited(myId, false, hitInfo.data);
		if (!this.pandaStats[myId].collecting) {
			let nowDate = new Date().getTime();
			this.hitQueue.push({'myId':myId, 'price':hitInfo.data.price, 'hitsAvailable':hitInfo.data.hitsAvailable, 'tempDuration': tempDuration, 'tempGoHam':tempGoHam, 'delayedAt':nowDate, 'lowestDur':Math.min(tempDuration, tempGoHam), 'tF':tF, 'auto':auto});
			if (this.lastAdded !== null) {
				diff = nowDate - this.lastAdded;
				if (diff < this.hitQueue[0].lowestDur) {
					if (this.hitQueue.length > 1) this.hitQueue.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
					MyPanda.sendStatusToSearch(hitInfo.data, true);
					if (!this.delayedTimeout) this.delayedTimeout = setTimeout(this.nextInDelayedQueue.bind(this), 500, diff);
				} else this.nextInDelayedQueue(diff);
			} else this.nextInDelayedQueue(-1);
		} else { this.cards.updateAllCardInfo(myId, hitInfo); }
	}
	/** Add panda job from an external source like forums, scripts or panda buttons on MTURK.
	 * @param  {object} msg - The message object from the external source.
	**/
	addFromExternal(msg) {
		let myId = null, search = (msg.command === 'addSearchOnceJob') ? 'gid' : (msg.command === 'addSearchMultiJob') ? 'rid' : null;
		let once = (msg.command === 'addOnceJob' || msg.command === 'addSearchOnceJob'), run = (msg.command !== 'addOnlyJob');
		if (!msg.auto) msg.auto = false;
		let duration = ((search) ? 10000 : (msg.auto) ? 12000 : 0), hamD = (!msg.hamDuration) ? MyOptions.getHamDelayTimer() : msg.hamDuration;
		if (search === 'rid' && msg.reqId !== '' && MyPanda.searchesReqIds.hasOwnProperty(msg.reqId)) myId = MyPanda.searchesReqIds[msg.reqId][0];
		if (search === 'gid' && msg.groupId !== '' && MyPanda.searchesGroupIds.hasOwnProperty(msg.groupId)) myId = MyPanda.searchesGroupIds[msg.groupId][0];
		if (myId === null) {
			let data = dataObject(msg.groupId, msg.description, decodeURIComponent(msg.title), msg.reqId, decodeURIComponent(msg.reqName), msg.price,_,_,_,_,_, true);
			let opt = optObject(once, search,_,_,_,_,_,_, hamD);
			if (search && MyOptions.theToSearchUI() && MySearch.isSearchUI()) { data.id = -1; data.disabled = false; MyPanda.sendToSearch(-1, {...data, ...opt},_,_, true,_,_, true, true); }
			else this.addPanda(data, opt, (msg.auto) ? true : false, run, true, duration, 4000);
		} else if (search === 'rid') this.doSearching(myId);
		else this.startCollecting(myId)
	}
	/** Add panda from search triggers. Is used to use search jobs instead of adding a new HIT if not needed.
	 * @param  {object} data			 - The data.     @param  {object} opt			  	 - The options.    @param  {object} auto			- Auto added.
	 * @param  {object} run			   - Run after?    @param  {number} tempDuration - Temp duration.  @param  {number} tempGoHam - Temp goHam duration.
	 * @param  {number} searchType - Search type.  @param  {string} [myId]       - MyId number.    @param  {string} [from]    - From which UI?
	 * @param  {number} [tF] 			 - Temp fetches.
	**/
	addFromSearch(data, opt, auto, run, tempDuration, tempGoHam, searchType, myId=-1, from='fromPanda', tF=0) {
		if (myId !== -1 && data.reqName !== '') MyPanda.updateReqName(myId, data.reqName);
		if (data.hamDuration === 0) data.hamDuration = MyOptions.getHamDelayTimer();
		this.addPanda(data, opt, auto, run, true, tempDuration, tempGoHam,_,_,_,_, searchType, from, tF);
	}
	/** Add panda from the database.
	 * @async							- To wait for the process of adding data to the database.
	 * @param  {object} r - Panda job data.  @param  {bool} [loaded] - Already loaded?
	**/
	async addPandaDB(r, loaded=true) {
		let update = gNewVersion, tabUniques = this.tabs.getUniques();
		if (typeof r.dateAdded === 'string') { r.dateAdded = new Date(r.dateAdded).getTime(); update = true; }
		if (!r.hasOwnProperty('mute')) { r.mute = false; update = true; }
		if (!tabUniques.includes(r.tabUnique)) { r.tabUnique = tabUniques[0]; update = true; }
		if (!r.hasOwnProperty('ext')) { r.ext = false; update = true; }
		if (!r.hasOwnProperty('created')) { r.created = 'manually'; update = true; }
		if (r.duration < 60000 && r.duration !== 0) { r.duration = 0; update = true; }
		let hamD = (r.hamDuration === 0) ? MyOptions.getHamDelayTimer() : r.hamDuration; if (r.hamDuration !== hamD) { update = true; r.hamDuration = hamD; }
		let dO = dataObject(r.groupId, r.description, r.title, r.reqId, r.reqName, r.price, r.hitsAvailable, r.assignedTime, r.expires, r.friendlyTitle, r.friendlyReqName, r.ext, r.created);
		let oO = optObject(r.once, r.search, r.tabUnique, r.limitNumQueue, r.limitTotalQueue, r.limitFetches, r.duration, r.autoGoHam, hamD, r.acceptLimit, r.day, r.weight, r.dailyDone, r.disabled, r.mute);
		let dbInfo = {...dO, ...oO, 'dateAdded':r.dateAdded, 'totalSeconds':r.totalSeconds, 'totalAccepted':r.totalAccepted, 'tF':0};
		if (r.hasOwnProperty('id')) dbInfo.id = r.id;
		await MyPanda.addPanda(dbInfo, false, {},_,_, update, loaded, MyOptions.theSearchDuration(), MyOptions.getHamDelayTimer());
	}
	/** Add a new panda job with lot of information and options to the panda area and database.
	 * @async											- To wait for the data to be loaded from database if needed.
	 * @param  {object} d			  	- The data.        @param  {object} opt		  	- The options.     				@param  {object} [add]		    - Auto added?
	 * @param  {bool} [run]		  	- Run After?       @param  {bool} [outside]		- From outside PandaUI?   @param  {number} [tDur]       - Temp duration.
	 * @param  {number} [tGoH]		- GoHam duration.  @param  {bool} [loaded]    - Loaded?          				@param  {object} [addDate]    - The date.
	 * @param  {number}	[seconds]	- Total seconds.   @param  {number} [accepts] - Total accepted.  				@param  {number} [searchType] - Search type.
	 * @param  {string} [from]    - From which UI?   @param  {number} [tF]      - Temp fetches.
	**/
	async addPanda(d, opt, add=false, run=false, outside=false, tDur=0, tGoH=0, loaded=false, addDate=null, seconds=0, accepts=0, searchType='', from='fromPanda', tF=0) {
		let dated = (addDate) ? addDate : new Date().getTime(), myIdFound = MyPanda.checkExisting(d.groupId, searchType);
		if (outside && myIdFound !== null && !opt.search) {
			let info = MyPanda.options(myIdFound);
			if (!info.data) await MyPanda.getDbData(myIdFound);
			if (!info.data.once || (info.data.once && this.pandaStats[myIdFound].accepted.value === 0)) {
				info.data.hitsAvailable = d.hitsAvailable; info.data.reqName = d.reqName; info.data.reqId = d.reqId;
				info.data.title = d.title; info.data.description = d.description; info.data.price = d.price;
				this.runThisPanda(myIdFound, tDur, tGoH, tF, (from === 'fromSearch'));
			}
		} else {
			if (opt.tabUnique === -1) opt.tabUnique = this.tabs.getTabInfo(this.tabs.currentTab).id;
			let dbInfo = {...d, ...opt, 'dateAdded': dated, 'totalSeconds':seconds, 'totalAccepted':accepts, 'tF':tF}, newAddInfo = {'tempDuration':tDur, 'tempGoHam':tGoH, 'run':run};
			await MyPanda.addPanda(dbInfo, add, newAddInfo,_,_, false, loaded, 0, MyOptions.getHamDelayTimer());
		}
	}
	/** Add this panda job to the panda UI with a card and stats.
	 * @param  {number} myId 	 - Unique ID.        @param  {object} pandaInfo	- Panda info.     @param  {object} newAddInfo - New info.
	 * @param  {bool} [loaded] - Database loaded?  @param  {bool} [multiple]  - Multiple jobs?  @param  {number} [tF]       - Temporary fetches.
	 * @return {number}				 - Panda job unique number.
	**/
	addPandaToUI(myId, pandaInfo, newAddInfo, loaded=false, multiple=false, tF=0) {
		this.cards.addCard(myId, pandaInfo, loaded, multiple);
		this.pandaStats[myId] = new PandaStats(myId, pandaInfo.dbId, this.cards.acceptedStatusText, this.cards.fetchedStatusText, this.cards.foundStatusText);
		if (pandaInfo.data.dailyDone > 0) this.pandaStats[myId].setDailyStats(pandaInfo.data.dailyDone);
		if (pandaInfo.search && (loaded || (newAddInfo && !newAddInfo.run))) this.searchDisabled(myId);
		if (pandaInfo.search) this.pandaGStats.addSearch(); else this.pandaGStats.addPanda();
		if (pandaInfo.disabled) this.cards.pandaDisabled(myId);
		if (!multiple) {
			this.cards.appendDoc(pandaInfo.data.tabUnique); this.pandaStats[myId].updateAllStats(this.cards.get(myId));
			if (MyPanda.isTimerGoingHam()) $(`#pcm-hamButton-${myId}`).addClass('disabled');
			if (newAddInfo) {
				if ((pandaInfo.search === 'gid' || pandaInfo.search === null) && newAddInfo.run)
					this.runThisPanda(myId, newAddInfo.tempDuration, newAddInfo.tempGoHam, tF, (pandaInfo.created === 'fromSearch'));
				else if (pandaInfo.search === 'rid' && newAddInfo.run) {
					this.pandaGStats.addCollecting(); this.pandaGStats.collectingOn(); MyPanda.doSearching(myId, pandaInfo.data);
				}
			}
			this.cards.cardButtons();
		}
    return myId;
  }
  /** When a HIT is accepted then set up the stats and display it on the card.
   * @param  {number} myId - Unique ID.  @param  {number} queueUnique - Queue ID.  @param  {object} html - Html object.  @param  {object} url - The URL.
	**/
	hitAccepted(myId, queueUnique, html, url) {
		this.logTabs.queueTotal++; this.logTabs.updateCaptcha(MyOptions.updateCaptcha());
    this.pandaGStats.addTotalAccepted(); this.cards.highlightEffect_card(myId);
		let pandaInfo = MyPanda.options(myId); this.pandaStats[myId].addAccepted(); pandaInfo.data.dailyDone++;
    if (pandaInfo.autoTGoHam !== 'disable' && (pandaInfo.data.autoGoHam || pandaInfo.autoTGoHam === 'on')) {
      MyPanda.timerGoHam(queueUnique, pandaInfo.data.hamDuration);
    }
    MyPanda.resetTimerStarted(queueUnique);
    let targetDiv = $(html).find('.project-detail-bar .task-project-title').next('div'), rawProps = targetDiv.find('span').attr('data-react-props');
		let auth_token = $(html).find(`input[name='authenticity_token']:first`), formUrl = auth_token.closest('form').attr('action');
		let formInfo = formUrl.match(/\/projects\/([^\/]*)\/tasks[\/?]([^\/?]*)/);
    MyPanda.authenticityToken = auth_token.val();
		let hitDetails = JSON.parse(rawProps).modalOptions; hitDetails.task_id = formInfo[2];
		hitDetails.assignment_id = MyPanda.parseHitDetails(hitDetails, myId, pandaInfo.data); MyPanda.queueAddAccepted(pandaInfo, hitDetails);
		this.logTabs.addIntoQueue(hitDetails, pandaInfo.data, url.replace('https://worker.mturk.com',''));
		this.logTabs.addToLog(pandaInfo.data); this.updateLogStatus(myId, 0, pandaInfo.data);
		if (MyOptions.isNotifications()) MyNotify.showAcceptedHit(pandaInfo.data);
		if (!pandaInfo.data.mute) MyAlarms.doAlarms(pandaInfo.data);
		MyPanda.checkIfLimited(myId, true, pandaInfo.data);
		targetDiv = null; rawProps = null; formInfo = null; hitDetails = null;
	}
	/** Does any resetting of any values needed when the new day happens?
	 * @async - To wait for all of the job data to be loaded from database.
	**/
	async resetDailyStats() {
		await MyPanda.getAllPanda(false);
		for (const key of Object.keys(this.pandaStats)) {
			this.pandaStats[key].setDailyStats(); let data = MyPanda.data(key); data.day = new Date().getTime(); data.dailyDone = 0;
		}
		MyHistory.maintenance(); MyPanda.nullData(false, true); MyDash.doDashEarns(true);
	}
	/** Returns all panda jobs data after getting all data from database for sending back to another tab in a response send function.
	 * @async           - To wait for all the data to be loaded.
	 * @return {object} - Returns the response from getting all panda data.
	**/
	async getAllData() {
		await MyPanda.getAllPanda(false);
		let copiedData = JSON.parse(JSON.stringify(MyPanda.getData())); MyPanda.nullData(false, true);
		return {'for':'getJobs', 'response':copiedData};
	}
	/** Returns the total number recorded of HITs in queue.
	 * @param  {string} [gId] - Group ID to search for and count the HITs in queue.
	 * @return {number}       - Returns the number of group ID HITs or all HITs in queue.
	**/
	totalResults(gId='') { return this.logTabs.totalResults(gId); }
	/** Sounds an alarm by the name parameter. Will check if the name is correct before calling alarm function.
	 * @param  {string} name - The name of an alarm to sound.
	**/
	soundAlarm(name) { if (['Captcha','Queue','Full'].includes(name)) MyAlarms[`do${name}Alarm`](); }
	/** Notifies the user that a captcha has been found. **/
	captchaAlert() { if (MyOptions.isNotifications() && MyOptions.isCaptchaAlert()) MyNotify.showCaptchaAlert(); }
	/** Notifies the user that they can't accept any more HITs for today. **/
	mturkLimit() { if (MyOptions.isNotifications()) MyNotify.showDailyLimit(); }
	/** Updates the status log tab on the bottom with relevant information.
	 * @param  {number} myId - The unique ID.  @param  {number} milliseconds - Elapsed time.  @param  {object} [changes] - Stat changes to make.
	**/
	updateLogStatus(myId, milliseconds, changes=null) { const stats = (changes) ? null : this.pandaStats[myId]; this.logTabs.updateLogStatus(stats, myId, milliseconds, changes); }
	/** Save the queue results received after making sure the groupings are checked for start times to start.
	 * @async 											 - To wait for daily stats to reset if needed.
	 * @param  {object} queueResults - Object from the MTURK queue with all the HITs information.
	**/
	async gotNewQueue(queueResults) {
		MyGroupings.checkStartTimes();
		if (isNewDay()) await this.resetDailyStats();
		this.logTabs.updateQueue(queueResults);
		if (this.tabLogResized) { this.tabLogResized = false; MyOptions.theTabLogHeight(this.tabLogHeight); }
	}
	/** A HIT was submitted externally.
	 * @param  {object} request - The HIT data object with info.
	**/
	submittedHit(request) { this.logTabs.removeFromQueue(request.taskId); this.pandaGStats.addSubmitted(); this.pandaGStats.thePotentialEarnings(null, request.price); }
	/** A HIT was returned externally.
	 * @param  {object} request - The HIT data object with info.
	**/
	returnedHit(request) { this.logTabs.removeFromQueue(request.taskId); }
	/** A HIT was accepted externally.
	 * @param  {object} request - The HIT data object with info.
	**/
	acceptedHit(request) {
		request.assignedTime = request.duration;
		this.logTabs.addIntoQueue(request.hitData, request, request.hitData.task_url.replace('https://worker.mturk.com',''));
	}
	/** Set the value of the potential earnings from MTURK.
	 * @param  {string} earnings - Earnings value from MTURK.
	**/
	setEarnings(earnings) { this.pandaGStats.thePotentialEarnings(earnings); }
	/** Shows the page number for the earnings page on the status bar.
	 * @param  {number} [page] - Page # for Earning Page.
	**/
	waitEarningsPage(page=1) { this.pandaGStats.waitEarningsPage(page); }
	/** Resets any helper tooltips with the tooltip option value from user.
	 * @param  {bool} [enabled] - Show Helper ToolTips?
	**/
	resetToolTips(enabled=true) { if (enabled) $('.pcm-tooltipHelper').removeClass('pcm-tooltipDisable'); else $('.pcm-tooltipHelper').addClass('pcm-tooltipDisable'); }
	/** Halt this script with an error message.
	 * @param  {object} error - Error object.  @param  {string} alertMessage - Alert message.  @param  {string} title - The title.
	**/
	haltScript(error, alertMessage, title) { haltScript(error, alertMessage, null, title); }
	/** New version detected so send a notification to user.
	 * @param  {string} version - New version number.
	**/
	newVersionAvailable(version) { if (MyNotify) MyNotify.showNewVersion(version); }
	/** Updates the mute checkbox in the log tabs. **/
	queueAlertUpdate() { this.logTabs.queueAlertUpdate(); }
	/** Will display a warning after the menu showing that it may be disconnected ot MTURK id down.
	 * @param  {bool} [status] - The status of being disconnected.
	**/
	disconnectedWarning(status=true) {
		if (status) $('.pcm-menuRow1 .pcm-myWarning').html('Internet may be disconnected or MTURK is down.'); else $('.pcm-menuRow1 .pcm-myWarning').html('');
	}
}
