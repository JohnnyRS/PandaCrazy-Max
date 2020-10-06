/** A class dealing with the search UI so the user can more easily enable or disable triggers.
 * @class SearchUI
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class SearchUI {
  constructor () {
		this.ridRow = null;
		this.ridColumn1 = null;
		this.ridListGroup1 = null;
		this.tabs = null;
		this.reqIDTab = {};
		this.groupIDTab = {};
		this.customTab = {};
		this.triggeredTab = {};
		this.ridContent = {};
		this.gidContent = {};
		this.customContent = {};
		this.triggeredContent = {};
		this.modalSearch = null;
		this.ctrlDelete = [];
		this.wasImporting = false;
		this.filters = {'sEnabled':true, 'sDisabled':true};
		this.sortingValues = ['none', 'added', 'numFound', 'lastFound', 'alphabetical'];
		this.sorting = 0;
		this.sortAscending = [true, true, true, true, true];
		this.multiple = {'rid':[], 'gid':[], 'custom':[]};
		this.clickTimer = null;
		this.hitsTabInactive = true;
		this.triggeredHits = [];
		this.triggeredUnique = 0;
	}
  /** Stops the searching process. */
  stopSearching() {
		if (bgSearch.searchGStats.isSearchOn()) bgSearch.searchGStats.searchingOff();
		bgSearch.stopSearching(); $('.pcm_top').css('background-color','#400a0a');
	}
  /** Starts the searching prcoess. */
  startSearching() { if (bgSearch.startSearching()) { bgSearch.searchGStats.searchingOn(); $('.pcm_top').css('background-color','#0b3e0b'); }}
  /** Shows logged off modal and will unpause the timer when logged off modal closes. */
	nowLoggedOff() { modal = new ModalClass(); modal.showLoggedOffModal( () => { modal = null; bgSearch.unPauseTimer(); }); }
  /** Closes any loggedoff modal because it's now logged on. */
	nowLoggedOn() { if (modal) modal.closeModal('Program Paused!'); }
	importing() {
		this.stopSearching(); modal = new ModalClass(); modal.showDialogModal('700px', 'Importing Data', 'Please Wait. Loading up all data for you.', null , false, false, '', '', null);
	}
	importingDone() { this.wasImporting = true; bgPage.searchUIImporting(); }
	pandaUILoaded() { if (this.wasImporting) window.location.reload(); }
	/** Updates the stat object with the text provided or the stat value.
	 * @param  {object} statObj - Stat object @param  {string} text - The text to display in the stat area. */
	updateStatNav(statObj, text) {
		if (text==="") {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled===true) return null;
			$(statObj.id).html(statObj.value);
		} else $(statObj.id).html(text);
		if (statObj.addClass && statObj.value) $(statObj.id).addClass(statObj.addClass);
		else if (statObj.addClass) $(statObj.id).removeClass(statObj.addClass);
	}
  addMenu(appendHere, label, btnFunc, tooltip='', className='pcm-quickBtn') {
    const addtip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' title='${tooltip}'` : ``;
    $(`<button type='button' class='btn text-dark btn-xs border-danger dropdown-toggle dropdown-toggle-split ${className}'${addtip}  data-toggle='dropdown'>${label}</button>`).click( (e) => {
      btnFunc.apply(this, [e]);
    } ).appendTo(appendHere);
  }
  addSubMenu(appendHere, label, dropdownStyle, dropdownInfo, noClick=false, onClosed=null) {
    let btnGroup = $(`<div class='btn-group py-0'></div>`).appendTo(appendHere);
    $(`<button type='button' class='btn btn-primary btn-xs dropdown-toggle dropdown-toggle-split' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>${label}</button>`).append($(`<span class='sr-only'>Toggle Dropdown</span>`)).appendTo(btnGroup);
    let dropdownMenu = $(`<div class='dropdown-menu pcm_dropdownMenu' style='${dropdownStyle}'></div>`).appendTo(btnGroup);
    if (noClick) dropdownMenu.click( (e) => { e.stopPropagation(); } );
    if (onClosed) dropdownMenu.parent().on('hidden.bs.dropdown', (e) => { onClosed(); });
    dropdownInfo.forEach( (info) => {
      const addtip = (info.tooltip && info.tooltip!=='') ? ` data-toggle='tooltip' data-placement='right' title='${info.tooltip}'` : ``;
      if (info.type === 'item') {
        const classAdd = (info.class) ? ` ${info.class}` : '';
        const item = $(`<a class='dropdown-item${classAdd}' href='#' ${addtip}>${info.label}</a>`).appendTo(dropdownMenu);
        if (info.menuFunc) $(item).click( (e) => { info.menuFunc.apply(this, [e]) });
      } else if (info.type === 'rangeMax') $(`<label for='max'>${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type === 'rangeMin') $(`<label for='min'>${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type === 'slider') $(`<div id='${info.id}' class='text-center'></div>`).slider({orientation:'vertical', range:'min', min:info.min, max:info.max, value:info.value, step:info.step, create: (e, ui) => { info.createFunc.apply(this, [e, ui]); }, slide: (e, ui) => { info.slideFunc.apply(this, [e, ui]); }}).appendTo(dropdownMenu);
      else if (info.type === 'divider') $(`<div class='dropdown-divider'></div>`).appendTo(dropdownMenu);
    });
    btnGroup = null; dropdownMenu = null;
	}
	enableShowAll() {
		$('#pcm_filterDropDown .dropdown-item').each( (i, ele) => { $(ele).html($(ele).html().replace('fa-square','fa-check-square')); } );
		for (const key of Object.keys(this.filters)) this.filters[key] = true;
	}
	disableShowAll() { let allElem = $('#pcm_filterDropDown .sub_showAll:first'); allElem.html(allElem.html().replace('fa-check-square','fa-square')); }
	async filterMe(e, prop, all=false) {
		if (all) this.enableShowAll();
		else {
			let html = $(e.target).html(), disabled = html.includes('fa-square'); if (prop) this.filters[prop] = disabled;
			$(e.target).html( (disabled) ? html.replace('fa-square','fa-check-square') : html.replace('fa-check-square','fa-square') );
			if (this.filters.sEnabled && this.filters.sDisabled) this.enableShowAll(); else this.disableShowAll();
		}
		this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); this.appendFragments();
	}
	sortMe(e, sorting) {
		let html = $(e.target).html();
		if (sorting !== 0 && this.sorting === sorting) this.sortAscending[sorting] = !this.sortAscending[sorting];
		else this.sortAscending[sorting] = true;
		html = (this.sortAscending[sorting]) ? html.replace('sort-up', 'sort-down') : html.replace('sort-down', 'sort-up');
		this.sorting = sorting; $(e.target).html(html);
		$('#pcm_sortingDropDown .dropdown-item').removeClass('selectedItem'); $(e.target).addClass('selectedItem');
		this.redoFilters('rid'); this.redoFilters('gid'); this.redoFilters('custom'); this.appendFragments();
	}
  /** Prepare the search page with button events and set up the columns for triggers to use.
	 * @async - To wait for created tabs to be completed. */
	async prepareSearch() {
		bgSearch.prepareSearch();
		let controls = $('#pcm_uiSearchControls');
		controls.append(`<span>Add: <button class='btn btn-primary btn-xxs' id='pcm_addTriggers'>Triggers</button> <button class='btn btn-primary btn-xxs' id='pcm_addCustomTriggers'>Custom</button></span> | `);
		let filters = $(`<span id='pcm_filterDropDown'></span>`).appendTo(controls);
    this.addSubMenu(filters, 'Filters ', '', 
      [{'type':'item', 'label':'<i class="far fa-check-square"></i> Show All', 'menuFunc': (e) => { this.filterMe(e, '', true); }, class:'sub_showAll', 'tooltip':'Add a new Panda or Search Job'},
       {'type':'item', 'label':'<i class="far fa-check-square"></i> Show Enabled', 'menuFunc': (e) => { this.filterMe(e, 'sEnabled'); }, class:'sub_showEnabled', 'tooltip':'Stop All Collecting Panda or Search Jobs'},
       {'type':'item', 'label':'<i class="far fa-check-square"></i> Show Disabled', 'menuFunc': (e) => { this.filterMe(e, 'sDisabled'); }, class:'sub_showDisabled', 'tooltip':'Stop All Collecting Panda or Search Jobs'},
			]);
		let sorting = $(`<span id='pcm_sortingDropDown' class='pl-2'></span>`).appendTo(controls);
    this.addSubMenu(sorting, 'Sorting ', '', 
      [{'type':'item', 'label':'<span><i class="fas fa-minus"></i> None</span>', 'menuFunc': (e) => { this.sortMe(e, 0); }, class:'sub_sortNone', 'tooltip':'No Sorting. Uses unique Database ID to sort.'},
       {'type':'item', 'label':'<i class="fas fa-sort-down"></i> Sort by Added', 'menuFunc': (e) => { this.sortMe(e, 1); }, class:'sub_sortAdded', 'tooltip':'Sort by trigger was added.'},
       {'type':'item', 'label':'<i class="fas fa-sort-down"></i> Sort by Found Hits', 'menuFunc': (e) => { this.sortMe(e, 2); }, class:'sub_sortFound', 'tooltip':'Sort by Number of Found Hits.'},
       {'type':'item', 'label':'<i class="fas fa-sort-down"></i> Sort by Last Found', 'menuFunc': (e) => { this.sortMe(e, 3); }, class:'sub_sortLast', 'tooltip':'Sort by Last Time Hits Found.'},
			]);
		$(`#pcm_sortingDropDown .dropdown-item`).eq(this.sorting).addClass('selectedItem');
		$("#pcm_searchNow").click( (e) => {
			if (bgSearch.searchGStats.isSearchOn()) this.stopSearching();
			else if (bgSearch.isPandaUI()) this.startSearching();
			else { if (!modal) modal = new ModalClass();
				modal.showDialogModal('700px', 'Open PandaCrazyMax First', 'PandaCrazyMax must be opened before search triggers can start collecting hits.',
				null , false, false, '', '', null );
			}
			$(e.target).blur();
		});
		$('#pcm_addTriggers').click( () => { this.showSearchAddModal(); } );
		$('#pcm_addCustomTriggers').click( () => { this.showSearchAddModal(true); } );
		this.tabs = new TabbedClass($(`#pcm_searchTriggers`), `pcm_triggerTabs`, `pcm_tabbedTriggers`, `pcm_triggerContents`, false);
    let [_, err] = await this.tabs.prepare();
    if (!err) {
			this.reqIDTab = await this.tabs.addTab("Requester ID", true);
			this.groupIDTab = await this.tabs.addTab("Group ID");
			this.customTab = await this.tabs.addTab("Custom Search");
			this.triggeredTab = await this.tabs.addTab("Custom Triggered Hits");
			this.ridContent = $(`<div class='pcm_ridTriggers card-deck'></div>`).appendTo(`#${this.reqIDTab.tabContent}`);
			this.gidContent = $(`<div class='pcm_gidTriggers card-deck'></div>`).appendTo(`#${this.groupIDTab.tabContent}`);
			this.customContent = $(`<div class='pcm_customTriggers card-deck'></div>`).appendTo(`#${this.customTab.tabContent}`);
			this.triggeredContent = $(`<div class='pcm_triggeredHits card-deck'></div>`).appendTo(`#${this.triggeredTab.tabContent}`);
			this.triggeredContent.hover( (e) => { this.hitsTabInactive = false; }, (e) => { this.hitsTabInactive = true; this.displayTriggeredHits(); } );
			$(`<table class='table table-dark table-sm table-moreCondensed pcm_foundHitsTable table-bordered w-100'></table>`)
				.append(`<thead><tr><td style='width:25px; max-width:25px;'></td><td style='width:120px; max-width:120px;'>Requester Name</td><td>Title</td><td style='width:45px; max-width:45px;'>Pays</td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td></tr></thead>`).append($(`<tbody></tbody>`)).appendTo(this.triggeredContent);
		}

	}
  /** Update the status bar with the hits found value or the search results value.
   * @param  {string} statusName - The status name @param  {string} status		 - The status value */
  updateStatus(statusName, status) {
    if (statusName === 'hits found') $('#pcm_searchHitsFound').html(status);
    else if (statusName === 'total results') $('#pcm_searchResults').html(status);
	}
	/** This method will update the passed element with the info from the passed trigger info.
	 * @param  {object} [thetrigger=null] - The jquery element  @param  {bool} [toggle=true] - Toggled? */
	updateTrigger(thetrigger, theStatus=null, tempDisabled=false) {
		let unique = $(thetrigger).data('unique'), newStatus = (theStatus) ? theStatus : bgSearch.toggleTrigger(unique);
		$(thetrigger).stop(true,true).data('status', newStatus);
		if (newStatus === 'disabled') $(thetrigger).addClass('pcm_disabled'); else $(thetrigger).removeClass('pcm_disabled');
		if (tempDisabled) $(thetrigger).addClass('pcm_tempDisabled'); else $(thetrigger).removeClass('pcm_tempDisabled');
	}
	disableMe(unique, theStatus=null) { this.updateTrigger($(`#pcm_triggerCard_${unique}`), theStatus); }
	/**
	 * @param  {object} [card=null] - Jquery element to find cards. */
	cardEvents(card=null) {
		let element = (card) ? $(card).find('.pcm_triggerCard') : $('.pcm_triggerCard');
		element.find(`.pcm_foundHitsButton`).click( (e) => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggerFound(unique);
		});
	}
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
	updateFilters(enabled=true, disabled=true) {
		this.filters.enabled = enabled; this.filters.disabled = disabled;
	}
	/** Add the trigger info to the specific tabs for trigger.
	 * @param  {object} data   - Trigger data         @param  {object} status - Trigger status @param  {string} name - Trigger name
	 * @param  {number} unique - Trigger unique ID */
	addToUI(data, status, name, unique) {
		if ($(`#pcm_triggerCard_${unique}`).length) return;
		let disabledClass = (status === 'disabled') ? ' pcm_disabled' : '', clicks = 0;
		let card = $(`<div class='card border pcm_triggerCard${disabledClass}' id='pcm_triggerCard_${unique}'></div>`)
			.data('unique',unique).data('status', status).data('clicks',0).click( async e => {
				let theCard = $(e.target).closest('.card'), theButton = theCard.find('.pcm_deleteButton'), unique = theCard.data('unique');
				theButton.css({'backgroundColor':'', 'color':'', 'borderColor':''});
				if (e.ctrlKey) {
					if (this.ctrlDelete.includes(unique)) { this.ctrlDelete = arrayRemove(this.ctrlDelete, unique); }
					else { theButton.css({'backgroundColor':'darkred', 'color':'yellow', 'borderColor':'yellow'}); this.ctrlDelete.push(unique); }
				} else if (e.altKey) { this.ctrlDelete.length = 0; $('.pcm_deleteButton').css({'backgroundColor':'', 'color':'', 'borderColor':''}); }
				else {
					if (++clicks === 1) {
						this.clickTimer = setTimeout( async (theCard) => {
							clicks = 0; theCard.find(`.pcm_tooltipData`).tooltip('hide');
							theCard.find(`.pcm_triggerName`).toggle(); theCard.find(`.pcm_triggerStats`).toggle();
						}, 400, theCard );
					} else { clearTimeout(this.clickTimer); clicks = 0; this.updateTrigger($(e.target).closest('.card')); }
				}
				theButton = null; theCard = null;
			});
		let body = $(`<div class='card-body p-0'></div>`).css('cursor', 'default').appendTo(card);
		let text = $(`<div class='card-text' id='output_${unique}'></div>`).appendTo(body);
		let nameGroup = $(`<div class='pcm_triggerGroup row w-100 px-0 pcm_tooltipData' data-toggle='tooltip' data-html='true' data-placement='bottom' data-trigger='hover' title='${name}<br><small>Single click for stats. Double click to enable or disable.</small>'></div>`).appendTo(text);
		nameGroup.append($(`<span class='pcm_triggerName col mr-auto px-0 text-truncate unSelectable' id='pcm_triggerName_${unique}'>${name}</span>`).css('cursor', 'default'));
		nameGroup.append($(`<span class='pcm_triggerStats col mr-auto px-0 text-truncate unSelectable small' id='pcm_triggerStats_${unique}'><button class='pcm_foundHitsButton btn btn-light btn-xxs'>Found Hits</button>: <span>${data.numHits} | Total: ${data.numFound}</span></span>`).hide());
		let buttonGroup = $(`<span class='pcm_tButtonGroup col col-auto text-right px-0' id='pcm_tButtons_${unique}'></span>`).css('cursor', 'pointer').appendTo(nameGroup);
		$(`<i class='fas fa-caret-square-down pcm_optionsMenu'></i>`).click( (e) => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			this.modalSearch = new ModalSearchClass(); this.modalSearch.showDetailsModal(unique);
		}).data('unique',unique).appendTo(buttonGroup);
		$(`<i class='fas fa-times pcm_deleteButton'></i>`).click( (e) => {
			let unique = $(e.target).closest('.card').data('unique'); e.stopPropagation(); clearTimeout(this.clickTimer);
			if (!this.ctrlDelete.includes(unique)) this.ctrlDelete.push(unique);
			this.removeJobs(this.ctrlDelete);
		} ).data('unique',unique).appendTo(buttonGroup);
		// if (data.type === 'custom') { text.append(`<div>Status</div>`); }
		this.multiple[data.type].push(card);
	}
	redoFilters(type, filter={}) {
		$(this[`${type}Content`]).find('.card').each( (i, ele) => {
			let filteredOut = false, disabledStr = (!this.filters.sDisabled) ? 'disabled' : '', enabledStr = (!this.filters.sEnabled) ? 'searching' : '';
			if (disabledStr && disabledStr === $(ele).data('status')) filteredOut = true;
			if (enabledStr && enabledStr === $(ele).data('status')) filteredOut = true;
			if (filter && filter.term && !$(ele).find('.pcm_triggerName').text().toLowerCase().includes(filter.term)) filteredOut = true;
			if (!filteredOut) $(ele).show(); else $(ele).hide();
		});
		this.sortCards(type);
	}
	/** Appends any cards created in the document fragment to the card deck to show cards faster. */
	appendFragments() {
		for (const type of Object.keys(this.multiple)) {
			let df = $(document.createDocumentFragment());
			for (const card of this.multiple[type]) { df.append(card); }
			$(this[`${type}Content`]).append(df); df = null; this.multiple[type] = [];
			this.redoFilters(type); this.sortCards(type);
		}
		this.cardEvents();
	}
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
	displayTriggeredHits(trigger=null, hit=null, term=null) {
		if (hit !== null) this.triggeredHits.push({'trigger':trigger, 'hit':hit});
		while (this.triggeredHits.length && this.hitsTabInactive) {
			let found = this.triggeredHits.pop(), hitData = found.hit, df = document.createDocumentFragment();
			let markedTitle = (term) ? markInPlace(term, hitData.title) : hitData.title;
			if (term) markedTitle = `<small>[${term}]</small> ` + markedTitle;
			let foundData = {'reqName':hitData.requester_name, 'title':markedTitle, 'price':`$${hitData.monetary_reward.amount_in_dollars.toFixed(2)}`};
			let rInfo = hitData.requesterInfo, unique = this.triggeredUnique++;
			displayObjectData([
				{'type':'string', 'string':'TV', 'link':`https://turkerview.com/requesters/${hitData.requester_id}`, 'linkClass':'pcm_tvLink', 'tooltip':`Turkerview Requester Link`},
				{'type':'keyValue', 'key':'reqName', 'maxWidth':'120px', 'tooltip':`${foundData.reqName}<br>Activity Level: ${rInfo.activityLevel}<br>Approval Rate: ${rInfo.taskApprovalRate}<br>Review Time: ${rInfo.taskReviewTime}`},
				{'type':'keyValue', 'key':'title', 'maxWidth':'460px', 'tooltip':`${hitData.title}`},
				{'type':'keyValue', 'key':'price', 'maxWidth':'45px', 'tooltip':`Amount hit pays.`},
				{'type':'button', 'btnLabel':'P', 'btnColor':'primary', 'addClass':" btn-xxs", 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm_customPanda_', 'unique':unique, 'tooltip':`Collect panda on Panda UI page.`, 'btnFunc': () => { bgSearch.sendToPanda(hitData, found.trigger.id,_,_, 0, 1400); }},
				{'type':'button', 'btnLabel':'O', 'btnColor':'primary', 'addClass':" btn-xxs", 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm_customOnce_', 'unique':unique, 'tooltip':`Collect Only ONE panda on Panda UI page.`, 'btnFunc': () => { bgSearch.sendToPanda(hitData, found.trigger.id,_, true, 0, 1400); }},
				{'type':'button', 'btnLabel':'S', 'btnColor':'primary', 'addClass':" btn-xxs", 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm_customSearch1_', 'unique':unique, 'tooltip':`Create search trigger to collect once for this hit.`, 'btnFunc': async (e) => { $(e.target).removeClass('btn-primary').addClass('btn-pcmUsed'); this.addTrigger(hitData); }},
				{'type':'button', 'btnLabel':'*', 'btnColor':'primary', 'addClass':" btn-xxs", 'maxWidth':'18px', 'minWidth':'15px', 'idStart':'pcm_customSearch_', 'unique':unique, 'tooltip':`Create search trigger for this hit.`, 'btnFunc': async (e) => { $(e.target).removeClass('btn-primary').addClass('btn-pcmUsed'); this.addTrigger(hitData, false); }},
			], df, foundData, true, true, '#0b716c');
			$(df).find('.pcm_tvLink').click( (e) => { e.preventDefault(); e.stopPropagation(); window.open($(e.target).attr('href'), '_blank', 'width=800,height=600'); });
			this.triggeredContent.find(`tbody`).prepend(df);
		}
	}
	triggeredHit(unique, triggerData, hitData=null, term=null) {
		$(`#pcm_triggerCard_${unique}`).stop(true,true).effect( 'highlight', {'color':'green'}, 6000 );
		$(`#pcm_triggerStats_${unique} span`).html(`${triggerData.numHits} | Total: ${triggerData.numFound}`);
		if (hitData !== null && triggerData.type === 'custom') this.displayTriggeredHits(triggerData, hitData, term);
	}
	/** Shows the add search trigger modal. */
	showSearchAddModal(doCustom=false) { this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggerAddModal( () => this.modalSearch = null, doCustom ); }
	/** Remove the trigger with the type and group ID or requester ID from the search UI.
	 * @param  {string} type  - Type of the trigger @param  {number} value - Group ID or Requester ID for value depending on type. */
	removeTrigger(unique) { const theTrigger = $(`#pcm_triggerCard_${unique}`); if (theTrigger.length) theTrigger.remove(); }
	/** Remove the list of jobs in the array and call function after remove animation effect is finished.
	 * @param  {array} jobsArr						 - The array of jobs unique ID's to delete.
	 * @param  {function} [afterFunc=null] - The function to call after remove animation effects are finished. */
	removeJobs(jobsArr, afterFunc=null) {
		let bodyText = '';
		jobsArr.forEach( (thisId) => { bodyText += '( ' + $(`#pcm_triggerName_${thisId}`).html() + ' )<BR>'; });
		if (!modal) modal = new ModalClass();
		modal.showDeleteModal(bodyText, () => {
			jobsArr.forEach( async (unique) => { if (unique) bgSearch.removeTrigger(_,_, unique, true, true); });
			modal.closeModal(); jobsArr.length = 0;
		}, null, () => { jobsArr.length = 0; $('.pcm_deleteButton').css({'backgroundColor':'', 'color':'', 'borderColor':''}); });
	}
}
