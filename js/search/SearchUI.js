/** A class dealing with the search UI so the user can more easily enable or disable triggers.
 * @class SearchUI ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class SearchUI {
  constructor () {
		this.ridTab = {};																				// Holds the tab class for the Requester ID tab.
		this.gidTab = {};																				// Holds the tab class for the Group ID tab.
		this.customTab = {};																		// Holds the tab class for the Custom Search tab.
		this.triggeredTab = {};																	// Holds the triggered tab class for easy access.
		this.ridContent = null;																	// Holds the contents of the Requester ID tab.
		this.gidContent = null;																	// Holds the contents of the Group ID tab.
		this.customContent = null;															// Holds the contents of the Custom Search tab.
		this.triggeredContent = {};															// Holds the triggered tab contents for easy access.
		this.modalSearch = null;																// Just a temporary variable for search modals.
		this.ctrlDelete = [];																		// An array of triggers wanted to be deleted by using ctrl mouse click on the delete button.
		this.sorting = 0;																				// The current sorting of triggers picked by the user.
		this.clickTimer = null;																	// A timeout ID used when someone clicks on a trigger to show the stats.
		this.hitsTabInactive = true;														// When a user hovers over the triggered HITs tab it will stop any updates until mouse isn't hovering.
		this.triggeredHits = [];																// An array holding all the triggered HITs found by custom triggers.
		this.triggeredUnique = 0;																// A unique number for a triggered HIT found.
		this.triggersData = {};																	// Keeps triggered data sorted in an object.
		this.holdTermAlarm = false;															// Puts a hold on the triggered alarm so the alarm isn't repeating when a lot of HITs are found at once.
		this.manualModalClose = true;														// When importing and a user tries to close the modal warning it will restart the page.
		this.totals = {'rid':0, 'gid':0, 'custom':0};						// An object holding all the total number of search triggers separated in type categories.
		this.multiple = {'rid':[], 'gid':[], 'custom':[]};			// An object holding all the trigger cards separated in type categories.
		this.filters = {'sEnabled':true, 'sDisabled':true};			// The current filter being used to show trigger cards.
		this.sortAscending = [true, true, true, true, true];		// An object that holds the order trigger cards are shown by ascending or descending.
		this.sortingValues = ['none', 'added', 'numFound', 'lastFound', 'alphabetical'];  // The sorting in text form for the user to choose.
	}
	/** Shows a message on a modal dialog with a title. Usually only used when importing is happening or PandaUI has closed.
	 * @param  {string} theTitle - Title for modal.  @param  {string} theMessage - Message to show.  @param  {bool} [manualCloseWatch] - Watch for user modal closing?
	**/
	showModalMessage(theTitle, theMessage, manualCloseWatch=true) {
		if (!MyModal) MyModal = new ModalClass();
		MyModal.showDialogModal('700px', theTitle, theMessage, null , false, false, '', '', null,_, () => { if (manualCloseWatch && this.manualModalClose) window.location.reload(); } );
	}
  /** Stops the searching process. **/
  stopSearching() {
		if (MySearch.searchGStats.isSearchOn()) { MySearch.searchGStats.searchingOff(); }
		MySearch.stopSearching(); $('.pcm-top').removeClass('pcm-searchingOn').addClass('pcm-searchingOff');
	}
  /** Starts the searching process.
	 * @async - To wait for the searching to fully stop.
	**/
  async startSearching() {
		let doStart = await MySearch.startSearching();
		if (doStart) { MySearch.searchGStats.searchingOn(); $('.pcm-top').removeClass('pcm-searchingOff').addClass('pcm-searchingOn'); return true; }
		else return false;
	}
	/** Will toggle the paused value or force the paused value to a given value.
	 * @async 							- To wait for the searching to be paused fully.
	 * @param  {bool} [val] - Force pause value.
	**/
	async pauseToggle(val=null) { if (MySearch) { await MySearch.pauseToggle(val); }}
	 /** Shows logged off modal and will unpause the timer when logged off modal closes. **/
	nowLoggedOff() {
		if (!MyModal) MyModal = new ModalClass(); MyModal.showLoggedOffModal( () => { if (MyModal && MyModal.modals.length < 2) MyModal = null; MySearch.unPauseTimer(); });
	}
  /** Closes any loggedoff modal because it's now logged on. **/
	nowLoggedOn() { if (MyModal) MyModal.closeModal('Program Paused!'); }
	/** Show message that it is now importing data so please wait. **/
	importing() {
		this.stopSearching(); MyModal = new ModalClass(); this.manualModalClose = true;
		this.showModalMessage('Importing Data', 'Please Wait. Stopping all searching until import is Finished.');
	}
	/** When PandaUI closes then this function will stop searching and shows a modal. Searching can not continue until page is refreshed after PandaUI starts back up. **/
	lostPandaUI() {
		this.stopSearching(); $('.pcm-searchTop').html(''); $('#pcm-searchTriggers').html(''); this.manualModalClose = true;
		MyModal = new ModalClass(); this.showModalMessage('Waiting for PandaUI', 'This search page can not run without the panda page so this page is now paused until you start up the panda page. If panda page is running now then just restart this page.');
	}
	/** Importing finished so clear out the html from the page because page can not operate until it refreshes. **/
	importingDone() { $('.pcm-searchTop').html(''); $('#pcm-searchTriggers').html(''); }
	/** Importing has completed and panda page is being restarted so close the waiting modal. **/
	importCompleted() { this.manualModalClose = false; if (MyModal) MyModal.closeModal(); MyModal = null; }
	/** When PandaUI page starts up it will try to run this function to have the SearchUI page restarted after 1.5 seconds. */
	goRestart() { setTimeout(() => { window.location.reload(); }, 1500); }
	/** Updates the stat object with the text provided or the stat value.
	 * @param  {object} statObj - Stat object.  @param  {string} [text] - The text to display in the stat area.
	**/
	updateStatNav(statObj, text='') {
		if (statObj.disabled) $(statObj.id).hide();
		else {
			if (text === '') {
				let cssVar = (statObj.tempStr) ? statObj.tempStr : getCSSVar(statObj.id.replace('#pcm-', ''), statObj.string), newValue = `${cssVar} ${statObj.value}`;
				statObj.tempStr = cssVar; $(statObj.id).html(newValue);
			} else if (text) $(statObj.id).html(text);
			if (statObj.onClass && statObj.offClass && statObj.value) $(statObj.id).removeClass(statObj.offClass).addClass(statObj.onClass);
			else if (statObj.onClass && statObj.offClass) $(statObj.id).removeClass(statObj.onClass).addClass(statObj.offClass);
		}
	}
	/** Filter is set to show all triggers. **/
	enableShowAll() {
		$('#pcm-filterDropDown .dropdown-item i').each( (_v, ele) => { $(ele).removeClass('fa-square'); $(ele).addClass('fa-check-square'); });
		for (const key of Object.keys(this.filters)) this.filters[key] = true;
	}
	/** Filter is set to not show all. **/
	disableShowAll() { let allElem = $('#pcm-filterDropDown .pcm-subShowAll:first i'); allElem.removeClass('fa-check-square'); allElem.addClass('fa-square'); }
	/** A method to set up the filters for triggers to show by the user.
	 * @async 						- To wait for the triggers to be sorted fully.
	 * @param  {object} e - Target event.  @param  {string} prop - Filter property.  @param  {bool} [all] - Enable all?
	**/
	async filterMe(e, prop, all=false) {
		if (all) this.enableShowAll();
		else {
			let icon = $(e.target).closest('a').find('i'), disabled = icon.hasClass('fa-square'); if (prop) this.filters[prop] = disabled;
			icon.removeClass('fa-check-square fa-square'); if (disabled) icon.addClass('fa-check-square'); else icon.addClass('fa-square');
			if (this.filters.sEnabled && this.filters.sDisabled) this.enableShowAll(); else this.disableShowAll();
			icon = null;
		}
		this.triggersData = await MySearch.sortingTriggers();
		this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); this.appendFragments(false); this.triggersData = {};
	}
	/** This will sort the triggers according to the users input and also sets the direction for the sort.
	 * @async 						- To wait for triggers to be sorted fully.
	 * @param  {object} e - Target event.  @param  {string} sorting - Sort direction data.
	**/
	async sortMe(e, sorting) {
		let html = $(e.target).html();
		if (sorting !== 0 && this.sorting === sorting) this.sortAscending[sorting] = !this.sortAscending[sorting];
		else this.sortAscending[sorting] = true;
		html = (this.sortAscending[sorting]) ? html.replace('sort-up', 'sort-down') : html.replace('sort-down', 'sort-up');
		this.sorting = sorting; $(e.target).html(html);
		$('#pcm-sortingDropDown .dropdown-item').removeClass('pcm-selectedItem'); $(e.target).closest('.dropdown-item').addClass('pcm-selectedItem');
		this.triggersData = await MySearch.sortingTriggers();
		this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); this.appendFragments(false); html = null; this.triggersData = {};
	}
  /** Prepare the search page with button events and set up the columns for triggers to use.
	 * @async - To wait for tabs to be created.
	 * @param  {function} afterFunc - Function to call after done to send success and error.
	**/
	async prepareSearch(afterFunc=null) {
		let success = [], err = null;
		await MySearch.resetSearch(); MyMenu.createSearchTopMenu();
		$('#pcm-timerStats').append(`<span id='pcm-searchElapsed' class='pcm-stat1 pcm-tooltipData pcm-tooltipHelper' data-original-title='The exact accurate elapsed time it took for search timer to send a fetch request to MTURK.'></span><span id='pcm-fetchedElapsed' class='pcm-stat2 pcm-tooltipData pcm-tooltipHelper' data-original-title='The time in ms for MTURK to respond to a search fetch request.'></span>`).data('toggled', 1).data('max',2).data('array', 'timerStats');
		$('.pcm-searchStats .toggle').click( e => {
			let theToggle = $(e.target).closest('.toggle'), toggled = theToggle.data('toggled'), max = theToggle.data('max'), theArray = theToggle.data('array');
			let beforeToggled = toggled; toggled = (++toggled > max) ? 1 : toggled; theToggle.data('toggled', toggled);
			let thisStat = theToggle.find(`.pcm-stat${toggled}`); theToggle.find('span').hide(); thisStat.show().stop(true,true);
			let oldColor = thisStat.css('color'); thisStat.css('color','Tomato').animate({'color':oldColor}, 3500);
			MySearch.searchGStats.toggleStat(beforeToggled, toggled, theArray);
		});
		MySearch.searchGStats.prepare();
		let thisTabs = new TabbedClass($(`#pcm-searchTriggers`), `pcm-triggerTabs`, `pcm-tabbedTriggers`, `pcm-triggerContents`, false);
    [success[0], err] = await thisTabs.prepare();
    if (!err) {
			let approvalRateDisplay = (MyOptions.doSearch().displayApproval) ? ' display:table-cell;' : ' display:none;';
			this.ridTab = await thisTabs.addTab('Requester ID', true); this.gidTab = await thisTabs.addTab('Group ID'); this.customTab = await thisTabs.addTab('Custom Search');
			this.triggeredTab = await thisTabs.addTab('Custom Triggered Hits');
			this.ridContent = $(`<div class='pcm-ridTriggers card-deck'></div>`).appendTo(`#${this.ridTab.tabContent}`);
			this.gidContent = $(`<div class='pcm-gidTriggers card-deck'></div>`).appendTo(`#${this.gidTab.tabContent}`);
			this.customContent = $(`<div class='pcm-customTriggers card-deck'></div>`).appendTo(`#${this.customTab.tabContent}`);
			this.triggeredContent = $(`<div class='pcm-triggeredHits card-deck'></div>`).appendTo(`#${this.triggeredTab.tabContent}`);
			this.triggeredContent.hover( (e) => { this.hitsTabInactive = false; }, (e) => { this.hitsTabInactive = true; this.displayTriggeredHits(); } );
			$(`<table class='table table-dark table-sm table-moreCondensed pcm-foundHitsTable table-bordered w-100'></table>`)
				.append(`<thead><tr><td style='width:25px; max-width:25px;'></td><td style='width:120px; max-width:120px;'>Requester Name</td><td class='pcm-approvalRateCol' style='width:32px; max-width:32px;${approvalRateDisplay}'>Rate</td></td><td>Title</td><td style='width:45px; max-width:45px;'>Pays</td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td></tr></thead>`).append($(`<tbody></tbody>`)).appendTo(this.triggeredContent);
		}
		if (afterFunc) afterFunc(success, err);
	}
	/** Informs the searchUI that the theme has changed on pandaUI so needs to change the theme here too.
	 * @async - To wait for the search stats to load up fully.
	**/
	async themeChanged() {
		MyThemes.prepareThemes(); MyMenu.resetCSSValues();
		let setTempStr = (statObj) => { statObj.tempStr = getCSSVar(statObj.id.replace('#pcm-', ''), statObj.string); this.updateStatNav(statObj); }
		let storeStats = await MySearch.searchGStats.getStats();
		for (let key of Object.keys(storeStats)) { setTempStr(storeStats[key]); }
	}
	/** This method will update the passed element with the info from the passed trigger info.
	 * @async 										 - To wait for the trigger data to fully load.
	 * @param  {object} thetrigger - Jquery element.  @param  {string} [theStatus] - The status.  @param  {bool} [tempDisabled] - Only temporary?
	**/
	async updateTrigger(thetrigger, theStatus=null, tempDisabled=false) {
		let unique = $(thetrigger).data('unique'), retValue = await MySearch.getDataTrigger(unique, theStatus);
		if (retValue) {
			let info = retValue[0], newStatus = retValue[1];
			$(thetrigger).stop(true,true).data('status', newStatus);
			if (newStatus === 'disabled') $(thetrigger).addClass('pcm-disabled'); else $(thetrigger).removeClass('pcm-disabled');
			if (tempDisabled) $(thetrigger).addClass('pcm-tempDisabled'); else $(thetrigger).removeClass('pcm-tempDisabled');
			this.redoTabTitle(info.type); return newStatus;
		}
	}
	/** Changes the status of the trigger with the unique number.
	 * @param  {number} unique - Unique number.  @param  {string} [theStatus] - Trigger status.
	**/
	statusMe(unique, theStatus=null) { this.updateTrigger($(`#pcm-triggerCard-${unique}`), theStatus); this.redoAllTabTitles(); }
	/** Sets the trigger status to the provided status value when it comes from an external command.
	 * @async 							 - To wait for the trigger to fully be toggled.
	 * @param  {number} dbId - Unique ID.  @param  {bool} status - the status.
	**/
	async externalSet(dbId, status) { if (dbId) { let itemCount = await MySearch.getToggleTrigger(dbId, status); this.statusMe(itemCount, (status) ? 'searching' : 'disabled'); }}
	/** Set up the card events for a click.
	 * @param  {object} [card] - Jquery element to find cards.
	**/
	cardEvents(card=null) {
		let element = (card) ? $(card).find('.pcm-triggerCard') : $('.pcm-triggerCard');
		element.find(`.pcm-foundHitsButton`).click( e => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggerFound(unique, () => this.modalSearch = null);
		});
		element = null;
	}
	/** Sort the cards according to the user specified sort options.
	 * @param  {string} type - Type of trigger card.
	**/
	sortCards(type) {
		let sortBy = this.sortingValues[this.sorting];
		$(this[`${type}Content`]).find('.card').sort( (a, b) => {
			let unique1 = $(a).data('unique'), unique2 = $(b).data('unique');
			let compare = unique1 - unique2, temp = 0;
			if (sortBy !== 'none') temp = this.triggersData[unique2][sortBy] - this.triggersData[unique1][sortBy];
			if (temp !== 0) compare = temp;
			if (!this.sortAscending[this.sorting]) compare = compare * -1;
			return compare;
		}).appendTo($(this[`${type}Content`]));
	}
	/** Updates values so it knows if it should show enabled or disabled triggers.
	 * @param  {bool} [enabled] - Is it enabled?  @param  {bool} [disabled] - Is it disabled?
	**/
	updateFilters(enabled=true, disabled=true) { this.filters.enabled = enabled; this.filters.disabled = disabled; }
	/** Add the trigger info to the specific tabs for trigger.
	 * @param  {object} data   - Trigger data.  @param  {object} status - Trigger status.  @param  {string} name - Trigger name.
	 * @param  {number} unique - Trigger unique ID.
	**/
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
		nameGroup.append($(`<span class='pcm-triggerStats col text-truncate unSelectable small' id='pcm-triggerStats-${unique}'><button class='pcm-foundHitsButton btn pcm-tooltipData pcm-tooltipHelper' data-original-title='Display all the HITs found from this trigger.'>Found</button>: <span class='pcm-stats-numHits'>${data.numHits}</span> | Acc: <span class='pcm-stats-Accepted'>0</span> | Total: <span class='pcm-stats-totalFound'>${data.numFound}</span></span>`).hide());
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
			}, () => { this.redoAllTabs(); this.redoAllTabTitles(); }, 'Unselect All');
		} ).data('unique',unique).appendTo(buttonGroup);
		this.multiple[data.type].push(card);
		card = null; body = null; nameGroup = null; buttonGroup = null;
	}
	/** Updates the stats on the trigger card status.
	 * @param {number} unique - Unique number.  @param  {object} data - The data for trigger.  @param  {number} [accepted] - Number of accepted HITs.
	**/
	updateStats(unique, data, accepted=null) {
		if (data) $(`#pcm-triggerStats-${unique}`).find('.pcm-stats-numHits').html(data.numHits);
		if (accepted !== null) $(`#pcm-triggerStats-${unique}`).find('.pcm-stats-Accepted').html(accepted);
		if (data) $(`#pcm-triggerStats-${unique}`).find('.pcm-stats-totalFound').html(data.numFound);
	}
	/** Rechecks the filters for the triggers to show or hide.
	 * @param  {string} type - Trigger type.  @param  {object} [filter] - Filter data.  @param  {object} [tData] - Trigger data passed to function.
	**/
	redoFilters(type, filter={}, tData=null) {
		let allCards = $(this[`${type}Content`]).find('.card'); this.totals[type] = allCards.length; if (tData) this.triggersData = tData;
		$(allCards).each( (_v, ele) => {
			let filteredOut = false, disabledStr = (!this.filters.sDisabled) ? 'disabled' : '', enabledStr = (!this.filters.sEnabled) ? 'searching' : '';
			if (disabledStr && disabledStr === $(ele).data('status')) filteredOut = true;
			if (enabledStr && enabledStr === $(ele).data('status')) filteredOut = true;
			if (filter && filter.term && !$(ele).find('.pcm-triggerName').text().toLowerCase().includes(filter.term)) filteredOut = true;
			if (!filteredOut) $(ele).show(); else $(ele).hide();
		});
		this.sortCards(type); allCards = null;
	}
	/** Redoes all the filters for each of the three tabs: rid, gid and custom. **/
	redoAllTabs() { this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); }
	/**	Resets the tab title according to any new data changed.
	 * @param  {string} type - Trigger type.
	**/
	redoTabTitle(type) {
		let disabled = $(this[`${type}Content`]).find(`.pcm-disabled`).length;
		$(`#` + this[`${type}Tab`].tabId).html(this[`${type}Tab`].tabTitle + ` (${this.totals[type] - disabled}/${this.totals[type]})`);
	}
	/** Resets all the titles for each of the three tabs: rid, gid and custom. **/
	redoAllTabTitles() { this.redoTabTitle('gid'); this.redoTabTitle('rid'); this.redoTabTitle('custom'); }
	/** Appends any cards created in the document fragment to the card deck to show cards faster.
	 * @async										   - To wait for the triggers to be sorted.
	 * @param  {bool} [filterRedo] - Should filters be redone?
	**/
	async appendFragments(filterRedo=true) {
		if (!this.triggersData) this.triggersData = await MySearch.sortingTriggers();
		for (const type of Object.keys(this.multiple)) {
			let df = $(document.createDocumentFragment());
			for (const card of this.multiple[type]) { df.append(card); }
			$(this[`${type}Content`]).append(df); df = null; this.multiple[type] = [];
			if (filterRedo) this.redoFilters(type);
			this.redoTabTitle(type);
		}
		this.cardEvents(); this.triggersData = {};
	}
	/** Adds a trigger to the database and the UI.
	 * @async 								  - To wait for triggers to be added fully.
	 * @param  {object} hitData - HIT data.  @param  {bool} [once] - Only accept once?
	**/
	async addTrigger(hitData, once=true) {
		let gId = hitData.hit_set_id, rId = hitData.requester_id;
		let unique = await MySearch.addTrigger('gid', {'name':hitData.title, 'reqId':hitData.requester_id, 'groupId':gId, 'title':hitData.title, 'reqName':hitData.requester_name, 'pay':hitData.monetary_reward.amount_in_dollars, 'status':'finding'}, {'duration': 12000, 'once':once, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':true, 'tempGoHam':5000, 'acceptLimit':0});
		if (unique) { this.appendFragments(); MySearch.doRidSearch(rId, unique, gId); }
	}
	/** This will display all the triggered HITs found in a modal dialog.
	 * @param  {object} [trigger] - Trigger data.  @param  {object} [hit] - HIT data.  @param  {string} [term] - Term found.  @param  {bool} [auto] - Automatic collected?
	**/
	displayTriggeredHits(trigger=null, hit=null, term=null, auto=false) {
		if (hit !== null) this.triggeredHits.push({'trigger':trigger, 'hit':hit});
		while (this.triggeredHits.length && this.hitsTabInactive) {
			let found = this.triggeredHits.pop(), hitData = found.hit, df = document.createDocumentFragment();
			let markedTitle = (term) ? markInPlace(term, hitData.title) : hitData.title, priceFloat = hitData.monetary_reward.amount_in_dollars.toFixed(2);
			if (term) markedTitle = `<small>[${term}]</small> ` + markedTitle;
			let rInfo = hitData.requesterInfo, cellRate = rInfo.taskApprovalRate.match(/\d+/);
			let foundData = {'gid':hitData.hit_set_id, 'rid':hitData.requester_id, 'reqName':hitData.requester_name, 'desc':hitData.description, 'title':markedTitle, 'price':`$${priceFloat}`, 'approval':(cellRate) ? cellRate + '%' : '--'};
			let unique = this.triggeredUnique++, reqName = foundData.reqName.replace(/'/g, `&#39;`);
			let trClass = (auto) ? 'pcm-autoHit' : 'pcm-triggeredhit';
			let trRate = (MyOptions.doSearch().displayApproval) ? 'table-cell' : 'none;';
			displayObjectData( [
				{'type':'string', 'string':'TV', 'link':`https://turkerview.com/requesters/${hitData.requester_id}`, 'linkClass':'pcm-tvLink', 'tooltip':`Turkerview Requester Link`},
				{'type':'keyValue', 'key':'reqName', 'maxWidth':'120px', 'tooltip':`${reqName}<br>Activity Level: ${rInfo.activityLevel}<br>Approval Rate: ${rInfo.taskApprovalRate}<br>Review Time: ${rInfo.taskReviewTime}`, 'notHelper':true},
				{'type':'keyValue', 'key':'approval', 'addTdClass':' pcm-approvalRateCol', 'maxWidth':'25px', 'tooltip':`See`, 'styleDisplay':trRate},
				{'type':'keyValue', 'key':'title', 'tooltip':`${hitData.title.replace(/'/g, `&#39;`)}`},
				{'type':'keyValue', 'key':'price', 'maxWidth':'45px', 'tooltip':`Amount HIT pays.`},
				{'type':'button', 'btnLabel':'P', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customPanda', 'unique':unique, 'tooltip':`Collect panda on Panda UI page.`, 'btnFunc': () => { MySearch.sendToPanda(hitData, found.trigger.id,_,_, 0, 1400); }},
				{'type':'button', 'btnLabel':'O', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customOnce', 'unique':unique, 'tooltip':`Collect Only ONE panda on Panda UI page.`, 'btnFunc': () => { MySearch.sendToPanda(hitData, found.trigger.id,_, true, 0, 1400); }},
				{'type':'button', 'btnLabel':'S', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customSearch1', 'unique':unique, 'tooltip':`Create search trigger to collect once for this HIT.`, 'btnFunc': e => { $(e.target).addClass('btn-pcmUsed'); this.addTrigger(hitData); }},
				{'type':'button', 'btnLabel':'*', 'addClass':' btn-xxs', 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm-customSearch', 'unique':unique, 'tooltip':`Create search trigger for this HIT.`, 'btnFunc': e => { $(e.target).addClass('btn-pcmUsed'); this.addTrigger(hitData, false); }},
			], df, foundData, true, true, true, trClass);
			$(df).find('.pcm-tvLink').click( e => { window.open($(e.target).attr('href'), '_blank', 'width=800,height=600'); return false; });
			$(df).find('td').data('hitData',hitData).dblclick( e => {
				this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggeredHit($(e.target).closest('td').data('hitData'), () => { MyModal = null; this.modalSearch = null; }, e);
			});
			this.triggeredContent.find(`tbody`).prepend(df);
			df = null;
		}
		$(`#` + this.triggeredTab.tabId).html(this.triggeredTab.tabTitle + ` (${this.triggeredContent.find('tbody tr').length})`);
	}
	/** Will fill in the triggered HIT found from a custom trigger to the Triggered HITs tab.
	 * @param  {number} unique - Unique number.  @param  {object} triggerData - Trigger data.  @param  {object} [hitData] - HIT data.
	 * @param  {string} [term] - Term found.     @param  {bool} [auto]   			- Auto collecting?
	**/
	triggeredHit(unique, triggerData, hitData=null, term=null, auto=false) {
		$(`#pcm-triggerCard-${unique}`).stop(true,true).effect( 'highlight', {'color':'green'}, 6000 );
		$(`#pcm-triggerStats-${unique} span`).html(`${triggerData.numHits} | Total: ${triggerData.numFound}`);
		if (hitData !== null && triggerData.type === 'custom') this.displayTriggeredHits(triggerData, hitData, term, auto);
		if (term && !this.holdTermAlarm) { MyAlarms.playSound('triggeredAlarm'); this.holdTermAlarm = true; }
	}
	/** Releases the hold on the triggered HITs alarm so it can sound the alarm again. */
	releaseHoldAlarm() { this.holdTermAlarm = false; }
	/** Shows the add search trigger modal for normal and custom triggers.
	 * @param  {bool} [doCustom] - Adding custom trigger?
	**/
	showSearchAddModal(doCustom=false) { this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggerAddModal( () => this.modalSearch = null, doCustom ); }
	/** Remove the trigger with the unique number from the search UI.
	 * @param  {string} unique - Unique number of trigger.
	**/
	removeTrigger(unique) { let theTrigger = $(`#pcm-triggerCard-${unique}`); if (theTrigger.length) theTrigger.remove(); theTrigger = null; }
	/** Resets any helper tooltips with the tooltip option value from user.
	 * @param  {bool} [enabled] - Show helper toolTips?
	**/
	resetToolTips(enabled=true) { if (enabled) $('.pcm-tooltipHelper').removeClass('pcm-tooltipDisable'); else $('.pcm-tooltipHelper').addClass('pcm-tooltipDisable'); }
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr			 - Jobs to delete.  @param  {function} [afterFunc] - After function.  @param  {function} [afterClose] - After close function.
	 * @param  {string} [cancelText] - Cancel button text.
	**/
	removeJobs(jobsArr, afterFunc=null, afterClose=null, cancelText='cancel') {
		let bodyText = '';
		for (const thisId of jobsArr) { bodyText += '( ' + $(`#pcm-triggerName-${thisId}`).html() + ' )<BR>'; }
		if (!MyModal) MyModal = new ModalClass();
		MyModal.showDeleteModal(bodyText, async (_saved, theButton) => {
			$(theButton).prop('disabled', true);
			for (const unique of jobsArr) { await MySearch.removeTrigger(_,_, unique, true, true); await afterFunc('YES', unique); }
			$(theButton).prop('disabled', false);
			MyModal.closeModal(); jobsArr.length = 0;
		}, () => { if (afterFunc) afterFunc('NO'); }, () => { if (afterFunc) afterFunc('CANCEL'); }, () => { if (afterClose) afterClose(); else MyModal = null; }, cancelText);
	}
}
