/** A class dealing with the search UI so the user can more easily enable or disable triggers.
 * @class SearchUI ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class SearchUI {
  constructor () {
		this.ridRow = null;
		this.ridColumn1 = null;
		this.ridListGroup1 = null;
		this.tabs = null;
		this.ridTab = {};
		this.gidTab = {};
		this.customTab = {};
		this.triggeredTab = {};
		this.ridContent = {};
		this.gidContent = {};
		this.customContent = {};
		this.triggeredContent = {};
		this.modalSearch = null;
		this.modalAlarms = null;
		this.ctrlDelete = [];
		this.wasImporting = false;
		this.filters = {'sEnabled':true, 'sDisabled':true};
		this.sortingValues = ['none', 'added', 'numFound', 'lastFound', 'alphabetical'];
		this.sorting = 0;
		this.sortAscending = [true, true, true, true, true];
		this.multiple = {'rid':[], 'gid':[], 'custom':[]};
		this.totals = {'rid':0, 'gid':0, 'custom':0};
		this.clickTimer = null;
		this.hitsTabInactive = true;
		this.triggeredHits = [];
		this.triggeredUnique = 0;
	}
	/** Shows a message on a modal dialog with a title.
	 * @param {string} theTitle - Title for Modal  @param {string} theMessage - Message to Show */
	showModalMessage(theTitle, theMessage) { if (!modal) modal = new ModalClass(); modal.showDialogModal('700px', theTitle, theMessage, null , false, false, '', '', null ); }
  /** Stops the searching process. */
  stopSearching() {
		if (bgSearch.searchGStats.isSearchOn()) bgSearch.searchGStats.searchingOff();
		bgSearch.stopSearching(); $('.pcm-top').removeClass('pcm-searchingOn').addClass('pcm-searchingOff');
	}
  /** Starts the searching prcoess. */
  startSearching() {
		if (bgSearch.startSearching()) { bgSearch.searchGStats.searchingOn(); $('.pcm-top').removeClass('pcm-searchingOff').addClass('pcm-searchingOn'); return true; }
		else return false;
	}
  /** Shows logged off modal and will unpause the timer when logged off modal closes. */
	nowLoggedOff() {
		if (!modal) modal = new ModalClass(); modal.showLoggedOffModal( () => { if (modal && modal.modals.length < 2) modal = null; bgSearch.unPauseTimer(); });
		if (!bgSearch.isLoggedOff()) { alarms.doLoggedOutAlarm(); if (globalOpt.isNotifications()) notify.showLoggedOff(); }
	}
  /** Closes any loggedoff modal because it's now logged on. */
	nowLoggedOn() { if (modal) modal.closeModal('Program Paused!'); }
	/** Show message that it is now importing data so please wait. */
	importing() { this.stopSearching(); modal = new ModalClass(); this.showModalMessage('Importing Data', 'Please Wait. Loading up all data for you.'); }
	/** Importing finished so set variable so this page can be reloaded. */
	importingDone() { this.wasImporting = true; bgPage.searchUIImporting(); }
	/** After importing data this page should reload when pandaUI finishes reloading. */
	pandaUILoaded() { if (this.wasImporting) window.location.reload(); }
	/** Updates the stat object with the text provided or the stat value.
	 * @param  {object} statObj - Stat object @param  {string} [text] - The text to display in the stat area. */
	updateStatNav(statObj, text='') {
		if (text === '') {
			if (statObj.disabled === null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled === true) return null;
			let cssVar = (statObj.tempStr) ? statObj.tempStr : getCSSVar(statObj.id.replace('#pcm-', ''), statObj.string), newValue = `${cssVar} ${statObj.value}`;
			statObj.tempStr = cssVar; $(statObj.id).html(newValue);
		} else if (text) $(statObj.id).html(text);
		if (statObj.onClass && statObj.offClass && statObj.value) $(statObj.id).removeClass(statObj.offClass).addClass(statObj.onClass);
		else if (statObj.onClass && statObj.offClass) $(statObj.id).removeClass(statObj.onClass).addClass(statObj.offClass);
	}
	/** Filter is set to show all triggers. */
	enableShowAll() {
		$('#pcm-filterDropDown .dropdown-item i').each( (_, ele) => { $(ele).removeClass('fa-square'); $(ele).addClass('fa-check-square'); });
		for (const key of Object.keys(this.filters)) this.filters[key] = true;
	}
	/** Filter is set to not show all. */
	disableShowAll() { let allElem = $('#pcm-filterDropDown .pcm-subShowAll:first i'); allElem.removeClass('fa-check-square'); allElem.addClass('fa-square'); }
	/** A method to set up the filters for triggers to show by the user.
	 * @param {object} e - Target Event  @param {string} prop - Filter Property  @param {bool} [all] - Enable All? */
	filterMe(e, prop, all=false) {
		if (all) this.enableShowAll();
		else {
			let icon = $(e.target).closest('a').find('i'), disabled = icon.hasClass('fa-square'); if (prop) this.filters[prop] = disabled;
			icon.removeClass('fa-check-square fa-square'); if (disabled) icon.addClass('fa-check-square'); else icon.addClass('fa-square');
			if (this.filters.sEnabled && this.filters.sDisabled) this.enableShowAll(); else this.disableShowAll();
			icon = null;
		}
		this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); this.appendFragments();
	}
	/** This will sort the triggers according to the users input and also sets the direction for the sort.
	 * @param {object} e - Target Event  @param {string} sorting - Sort Direction Data */
	sortMe(e, sorting) {
		let html = $(e.target).html();
		if (sorting !== 0 && this.sorting === sorting) this.sortAscending[sorting] = !this.sortAscending[sorting];
		else this.sortAscending[sorting] = true;
		html = (this.sortAscending[sorting]) ? html.replace('sort-up', 'sort-down') : html.replace('sort-down', 'sort-up');
		this.sorting = sorting; $(e.target).html(html);
		$('#pcm-sortingDropDown .dropdown-item').removeClass('pcm-selectedItem'); $(e.target).closest('.dropdown-item').addClass('pcm-selectedItem');
		this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); this.appendFragments(); html = null;
	}
  /** Prepare the search page with button events and set up the columns for triggers to use.
	 * @async - To wait for tabs to be created. */
	async prepareSearch() {
		bgSearch.prepareSearch(); menus.createSearchTopMenu();
		this.tabs = new TabbedClass($(`#pcm-searchTriggers`), `pcm-triggerTabs`, `pcm-tabbedTriggers`, `pcm-triggerContents`, false);
    let [, err] = await this.tabs.prepare();
    if (!err) {
			this.ridTab = await this.tabs.addTab('Requester ID', true);
			this.gidTab = await this.tabs.addTab('Group ID');
			this.customTab = await this.tabs.addTab('Custom Search');
			this.triggeredTab = await this.tabs.addTab('Custom Triggered Hits');
			this.ridContent = $(`<div class='pcm-ridTriggers card-deck'></div>`).appendTo(`#${this.ridTab.tabContent}`);
			this.gidContent = $(`<div class='pcm-gidTriggers card-deck'></div>`).appendTo(`#${this.gidTab.tabContent}`);
			this.customContent = $(`<div class='pcm-customTriggers card-deck'></div>`).appendTo(`#${this.customTab.tabContent}`);
			this.triggeredContent = $(`<div class='pcm-triggeredHits card-deck'></div>`).appendTo(`#${this.triggeredTab.tabContent}`);
			this.triggeredContent.hover( (e) => { this.hitsTabInactive = false; }, (e) => { this.hitsTabInactive = true; this.displayTriggeredHits(); } );
			$(`<table class='table table-dark table-sm table-moreCondensed pcm-foundHitsTable table-bordered w-100'></table>`)
				.append(`<thead><tr><td style='width:25px; max-width:25px;'></td><td style='width:120px; max-width:120px;'>Requester Name</td><td>Title</td><td style='width:45px; max-width:45px;'>Pays</td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td></tr></thead>`).append($(`<tbody></tbody>`)).appendTo(this.triggeredContent);
		}
	}
	/** Informs the searchUI that the theme has changed on pandaUI so needs to change the theme here too. */
	themeChanged() {
		themes.prepareThemes(); menus.resetCSSValues();
		let setTempStr = (statObj) => { statObj.tempStr = getCSSVar(statObj.id.replace('#pcm-', ''), statObj.string); this.updateStatNav(statObj); }
		let properties = ['searchElapsed', 'totalSearchFetched', 'totalSearchPREs', 'totalSearchHits', 'totalSearchResults'];
		for (const prop of properties) { setTempStr(bgSearch.searchGStats[prop]); }
	}
	/** This method will update the passed element with the info from the passed trigger info.
	 * @param  {object} thetrigger - Jquery element  @param {string} [theStatus] - Status  @param  {bool} [tempDisabled] - Only Temporary? */
	updateTrigger(thetrigger, theStatus=null, tempDisabled=false) {
		let unique = $(thetrigger).data('unique'), newStatus = (theStatus !== null) ? theStatus : bgSearch.toggleTrigger(unique), info = bgSearch.getData(bgSearch.uniqueToDbId(unique));
		$(thetrigger).stop(true,true).data('status', newStatus);
		if (newStatus === 'disabled') $(thetrigger).addClass('pcm-disabled'); else $(thetrigger).removeClass('pcm-disabled');
		if (tempDisabled) $(thetrigger).addClass('pcm-tempDisabled'); else $(thetrigger).removeClass('pcm-tempDisabled');
		this.redoTabTitle(info.type);
	}
	/** Changes the status of the trigger with the unique number.
	 * @param {number} unique - Unique Number  @param {string} [theStatus] - Trigger Status */
	statusMe(unique, theStatus=null) { this.updateTrigger($(`#pcm-triggerCard-${unique}`), theStatus); this.redoAllTabTitles(); }
	/** Set up the card events for a click.
	 * @param  {object} [card] - Jquery element to find cards. */
	cardEvents(card=null) {
		let element = (card) ? $(card).find('.pcm-triggerCard') : $('.pcm-triggerCard');
		element.find(`.pcm-foundHitsButton`).click( e => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggerFound(unique, () => this.modalSearch = null);
		});
		element = null;
	}
	/** Sort the cards according to the user specified sort options.
	 * @param {string} type - Type of Trigger Card */
	sortCards(type) {
		let sortBy = this.sortingValues[this.sorting];
		$(this[`${type}Content`]).find('.card').sort( (a, b) => {
			let unique1 = $(a).data('unique'), unique2 = $(b).data('unique'), dbId1 = bgSearch.uniqueToDbId(unique1), dbId2 = bgSearch.uniqueToDbId(unique2);
			let compare = unique1 - unique2, temp = 0;
			if (sortBy !== 'none') temp = bgSearch.data[dbId2][sortBy] - bgSearch.data[dbId1][sortBy];
			if (temp !== 0) compare = temp;
			if (!this.sortAscending[this.sorting]) compare = compare * -1;
			return compare;
		}).appendTo($(this[`${type}Content`]));
	}
	/** Updates values so it knows if it should show enabled or disabled triggers.
	 * @param {bool} [enabled] - Is it Enabled?  @param {bool} [disabled] - Is it Disabled? */
	updateFilters(enabled=true, disabled=true) { this.filters.enabled = enabled; this.filters.disabled = disabled; }
	/** Add the trigger info to the specific tabs for trigger.
	 * @param  {object} data   - Trigger data      @param  {object} status - Trigger status  @param  {string} name - Trigger name
	 * @param  {number} unique - Trigger unique ID */
	addToUI(data, status, name, unique) {
		if ($(`#pcm-triggerCard-${unique}`).length) return;
		let disabledClass = (status === 'disabled') ? ' pcm-disabled' : '', clicks = 0;
		let card = $(`<div class='card border pcm-triggerCard${disabledClass}' id='pcm-triggerCard-${unique}'></div>`)
			.data('unique',unique).data('status', status).data('clicks',0).click( e => {
				let theCard = $(e.target).closest('.card'), theButton = theCard.find('.pcm-deleteButton'), unique = theCard.data('unique');
				if (e.ctrlKey) {
					if (this.ctrlDelete.includes(unique)) { theButton.removeClass('pcm-btn-selected'); this.ctrlDelete = arrayRemove(this.ctrlDelete, unique); }
					else { theButton.addClass('pcm-btn-selected'); this.ctrlDelete.push(unique); }
				} else if (e.altKey) { this.ctrlDelete.length = 0; $('.pcm-deleteButton').removeClass('pcm-btn-selected'); }
				else {
					if (++clicks === 1) {
						this.clickTimer = setTimeout( (theCard) => {
							clicks = 0; theCard.find(`.pcm-tooltipData`).tooltip('hide');
							theCard.find(`.pcm-triggerName`).toggle(); theCard.find(`.pcm-triggerStats`).toggle();
						}, 400, theCard );
					} else { clearTimeout(this.clickTimer); clicks = 0; this.updateTrigger($(e.target).closest('.card')); }
				}
				theButton = null; theCard = null;
			});
		let body = $(`<div class='card-body'></div>`).appendTo(card), text = $(`<div class='card-text' id='pcm-cardText-${unique}'></div>`).appendTo(body); name = name.replace(/'/g, `&#39;`);
		let nameGroup = $(`<div class='pcm-triggerGroup row w-100'></div>`).appendTo(text);
		nameGroup.append($(`<span class='pcm-triggerName col text-truncate unSelectable pcm-tooltipData' id='pcm-triggerName-${unique}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-trigger='hover' data-original-title='${name}<br><small>Single click for stats. Double click to enable or disable.</small>'>${name}</span>`));
		nameGroup.append($(`<span class='pcm-triggerStats col text-truncate unSelectable small' id='pcm-triggerStats-${unique}'><button class='pcm-foundHitsButton btn pcm-tooltipData pcm-tooltipHelper' data-original-title='Display all the HITs found from this trigger.'>Found HITs</button>: <span class='pcm-stats-numHits'>${data.numHits}</span> | Total: <span class='pcm-stats-totalFound'>${data.numFound}</span></span>`).hide());
		let buttonGroup = $(`<span class='pcm-tButtonGroup col col-auto' id='pcm-tButtons-${unique}'></span>`).css('cursor', 'pointer').appendTo(nameGroup);
		$(`<i class='fas fa-caret-square-down pcm-optionsMenu pcm-tooltipData pcm-tooltipHelper' data-original-title='Display and edit all options for this trigger.'></i>`).click( e => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			this.modalSearch = new ModalSearchClass(); this.modalSearch.showDetailsModal(unique, () => this.modalSearch = null);
		}).data('unique',unique).appendTo(buttonGroup);
		$(`<i class='fas fa-times pcm-deleteButton pcm-tooltipData pcm-tooltipHelper' data-original-title='Delete this trigger. [CTRL] click cards to delete multiple triggers.'></i>`).click( e => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			if (!this.ctrlDelete.includes(unique)) this.ctrlDelete.push(unique);
			this.removeJobs(this.ctrlDelete, response => {
				if ((response === 'NO' && this.ctrlDelete.length === 1) || response === 'CANCEL' ) { this.ctrlDelete = []; $('.pcm-deleteButton').removeClass('pcm-btn-selected'); }
			}, () => {}, 'Unselect All');
		} ).data('unique',unique).appendTo(buttonGroup);
		this.multiple[data.type].push(card);
		card = null; body = null; nameGroup = null; buttonGroup = null;
	}
	/** Updates the stats on the trigger card status.
	 * @param {number} unique - Unique Number  @param {object} data - The data for Trigger */
	updateStats(unique, data) {
		$(`#pcm-triggerStats-${unique}`).find('.pcm-stats-numHits').html(data.numHits);
		$(`#pcm-triggerStats-${unique}`).find('.pcm-stats-totalFound').html(data.numFound);
	}
	/** Rechecks the filters for the triggers to show or hide.
	 * @param {string} type - Trigger Type  @param {object} filter - Filter Data */
	redoFilters(type, filter={}) {
		let allCards = $(this[`${type}Content`]).find('.card'); this.totals[type] = allCards.length;
		$(allCards).each( (_, ele) => {
			let filteredOut = false, disabledStr = (!this.filters.sDisabled) ? 'disabled' : '', enabledStr = (!this.filters.sEnabled) ? 'searching' : '';
			if (disabledStr && disabledStr === $(ele).data('status')) filteredOut = true;
			if (enabledStr && enabledStr === $(ele).data('status')) filteredOut = true;
			if (filter && filter.term && !$(ele).find('.pcm-triggerName').text().toLowerCase().includes(filter.term)) filteredOut = true;
			if (!filteredOut) $(ele).show(); else $(ele).hide();
		});
		this.sortCards(type); allCards = null;
	}
	/**	Resets the tab title according to any new data changed.
	 * @param {string} type - Trigger Type */
	redoTabTitle(type) {
		let disabled = $(this[`${type}Content`]).find(`.pcm-disabled`).length;
		$(`#` + this[`${type}Tab`].tabId).html(this[`${type}Tab`].tabTitle + ` (${this.totals[type] - disabled}/${this.totals[type]})`);
	}
	/** Resets all the titles of the trigger type tabs. */
	redoAllTabTitles() { this.redoTabTitle('gid'); this.redoTabTitle('rid'); this.redoTabTitle('custom'); }
	/** Appends any cards created in the document fragment to the card deck to show cards faster. */
	appendFragments() {
		for (const type of Object.keys(this.multiple)) {
			let df = $(document.createDocumentFragment());
			for (const card of this.multiple[type]) { df.append(card); }
			$(this[`${type}Content`]).append(df); df = null; this.multiple[type] = [];
			this.redoFilters(type); this.redoTabTitle(type);
		}
		this.cardEvents();
	}
	/** Adds a trigger to the database and the UI.
	 * @async 								 - To wait for triggers to be added and fetched.
	 * @param {object} hitData - HIT Data  @param {bool} [once] - Only Acceot Once? */
	async addTrigger(hitData, once=true) {
		let gId = hitData.hit_set_id, rId = hitData.requester_id;
		bgSearch.setTempBlockGid(gId, true);
		let unique = await bgSearch.addTrigger('gid', {'name':hitData.title, 'reqId':hitData.requester_id, 'groupId':gId, 'title':hitData.title, 'reqName':hitData.requester_name, 'pay':hitData.monetary_reward.amount_in_dollars, 'status':'finding'}, {'duration': 12000, 'once':once, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':true, 'tempGoHam':5000, 'acceptLimit':0});
		if (unique) {
			search.appendFragments();
			bgSearch.doRidSearch(rId, async (timerUnique, elapsed, rId) => {
				await bgSearch.goFetch(bgSearch.createReqUrl(rId), timerUnique, elapsed, rId, bgSearch.uniqueToDbId(unique), 'gid', gId, true, gId);
			});
		}
	}
	/** This will display all the triggered HITs found in a modal dialog.
	 * @param  {object} [trigger] - Trigger Data  @param  {object} [hit] - HIT Data  @param {string} [term] - Term Found  @param {bool} [auto] - Automatic Collected? */
	displayTriggeredHits(trigger=null, hit=null, term=null, auto=false) {
		if (hit !== null) this.triggeredHits.push({'trigger':trigger, 'hit':hit});
		while (this.triggeredHits.length && this.hitsTabInactive) {
			let found = this.triggeredHits.pop(), hitData = found.hit, df = document.createDocumentFragment();
			let markedTitle = (term) ? markInPlace(term, hitData.title) : hitData.title, priceFloat = hitData.monetary_reward.amount_in_dollars.toFixed(2);
			if (term) markedTitle = `<small>[${term}]</small> ` + markedTitle;
			let foundData = {'gid':hitData.hit_set_id, 'rid':hitData.requester_id, 'reqName':hitData.requester_name, 'desc':hitData.description, 'title':markedTitle, 'price':`$${priceFloat}`};
			let rInfo = hitData.requesterInfo, unique = this.triggeredUnique++, reqName = foundData.reqName.replace(/'/g, `&#39;`);
			let trClass = (auto) ? 'pcm-autoHit' : 'pcm-triggeredhit';
			displayObjectData( [
				{'type':'string', 'string':'TV', 'link':`https://turkerview.com/requesters/${hitData.requester_id}`, 'linkClass':'pcm-tvLink', 'tooltip':`Turkerview Requester Link`},
				{'type':'keyValue', 'key':'reqName', 'maxWidth':'120px', 'tooltip':`${reqName}<br>Activity Level: ${rInfo.activityLevel}<br>Approval Rate: ${rInfo.taskApprovalRate}<br>Review Time: ${rInfo.taskReviewTime}`, 'notHelper':true},
				{'type':'keyValue', 'key':'title', 'maxWidth':'460px', 'tooltip':`${hitData.title.replace(/'/g, `&#39;`)}`},
				{'type':'keyValue', 'key':'price', 'maxWidth':'45px', 'tooltip':`Amount HIT pays.`},
				{'type':'button', 'btnLabel':'P', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customPanda', 'unique':unique, 'tooltip':`Collect panda on Panda UI page.`, 'btnFunc': () => { bgSearch.sendToPanda(hitData, found.trigger.id,_,_, 0, 1400); }},
				{'type':'button', 'btnLabel':'O', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customOnce', 'unique':unique, 'tooltip':`Collect Only ONE panda on Panda UI page.`, 'btnFunc': () => { bgSearch.sendToPanda(hitData, found.trigger.id,_, true, 0, 1400); }},
				{'type':'button', 'btnLabel':'S', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customSearch1', 'unique':unique, 'tooltip':`Create search trigger to collect once for this HIT.`, 'btnFunc': e => { $(e.target).addClass('btn-pcmUsed'); this.addTrigger(hitData); }},
				{'type':'button', 'btnLabel':'*', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customSearch', 'unique':unique, 'tooltip':`Create search trigger for this HIT.`, 'btnFunc': e => { $(e.target).addClass('btn-pcmUsed'); this.addTrigger(hitData, false); }},
			], df, foundData, true, true, true, trClass);
			$(df).find('.pcm-tvLink').click( e => { window.open($(e.target).attr('href'), '_blank', 'width=800,height=600'); return false; });
			$(df).find('td').data('hitData',hitData).dblclick( e => {
				this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggeredHit($(e.target).closest('td').data('hitData'), () => this.modalSearch = null, e);
			});
			this.triggeredContent.find(`tbody`).prepend(df);
			df = null;
		}
		$(`#` + this.triggeredTab.tabId).html(this.triggeredTab.tabTitle + ` (${this.triggeredContent.find('tbody tr').length})`);
	}
	/**
	 * 
	 * @param {number} unique   - Unique Number        @param {object} triggerData - Trigger Data     @param {object} [hitData] - HIT Data  @param {string} [term] - Term Found
	 * @param {bool} [started]  - Started Collecting?  @param {bool} [auto]        - Auto Collecting? */
	triggeredHit(unique, triggerData, hitData=null, term=null, started=true, auto=false) {
		$(`#pcm-triggerCard-${unique}`).stop(true,true).effect( 'highlight', {'color':'green'}, 6000 );
		$(`#pcm-triggerStats-${unique} span`).html(`${triggerData.numHits} | Total: ${triggerData.numFound}`);
		if (hitData !== null && triggerData.type === 'custom') this.displayTriggeredHits(triggerData, hitData, term, auto);
		if (term && started) alarms.playSound('triggeredAlarm');
	}
	/** Shows the add search trigger modal for normal and custom triggers.
	 * @param  {bool} [doCustom] - Adding Custom Trigger? */
	showSearchAddModal(doCustom=false) { this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggerAddModal( () => this.modalSearch = null, doCustom ); }
	/** Remove the trigger with the unique number from the search UI.
	 * @param  {string} unique - Unique Number of Trigger */
	removeTrigger(unique) { let theTrigger = $(`#pcm-triggerCard-${unique}`); if (theTrigger.length) theTrigger.remove(); theTrigger = null; }
	/** Resets any helper tooltips with the tooltip option value from user.
	 * @param {bool} [enabled] - Show Helper ToolTips? */
	resetToolTips(enabled=true) { console.log(enabled); if (enabled) $('.pcm-tooltipHelper').removeClass('pcm-tooltipDisable'); else $('.pcm-tooltipHelper').addClass('pcm-tooltipDisable'); }
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr				 - Jobs to Delete     @param  {function} [afterFunc] - After Function  @param  {function} [afterClose] - After Close Function
	 * @param  {function} [cancelText] - Cancel Button Text */
	removeJobs(jobsArr, afterFunc=null, afterClose=null, cancelText='cancel') {
		let bodyText = '';
		for (const thisId of jobsArr) { bodyText += '( ' + $(`#pcm-triggerName-${thisId}`).html() + ' )<BR>'; }
		if (!modal) modal = new ModalClass();
		modal.showDeleteModal(bodyText, async () => {
			for (const unique of jobsArr) { await bgSearch.removeTrigger(_,_, unique, true, true); await afterFunc('YES', unique); }
			modal.closeModal(); jobsArr.length = 0;
		}, () => { if (afterFunc) afterFunc('NO'); }, () => { if (afterFunc) afterFunc('CANCEL'); }, () => { if (afterClose) afterClose(); else modal = null; }, cancelText);
	}
}
