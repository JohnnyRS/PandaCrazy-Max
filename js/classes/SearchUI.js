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
		this.multiple = {'rid':[], 'gid':[], 'custom':[]};
	}
  /** Stops the searching process. */
  stopSearching() {
		if (bgSearchClass.searchGStats.isSearchOn()) bgSearchClass.searchGStats.searchingOff();
		bgSearchClass.stopSearching();
	}
  /** Starts the searching prcoess. */
  startSearching() { bgSearchClass.searchGStats.searchingOn(); bgSearchClass.startSearching(); }
  /** Shows logged off modal and will unpause the timer when logged off modal closes. */
	nowLoggedOff() { modal = new ModalClass(); modal.showLoggedOffModal( () => { modal = null; bgSearchClass.unPauseTimer(); } ); }
  /** Closes any loggedoff modal because it's now logged on. */
	nowLoggedOn() { if (modal) modal.closeModal('Program Paused!'); }
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
  /** Prepare the search page with button events and set up the columns for triggers to use.
	 * @async - To wait for created tabs to be completed. */
  async prepareSearch() {
		bgSearchClass.prepareSearch();
		$("#pcm_searchNow").click( (e) => {
			if (bgSearchClass.searchGStats.isSearchOn()) this.stopSearching(); else this.startSearching(); $(e.target).blur();
		});
		$('#pcm_addTriggers').click( () => { this.showSearchAddModal(); } );
		$('#pcm_addCustomTriggers').click( () => { this.showSearchAddModal(true); } );
		this.tabs = new TabbedClass($(`#pcm_searchTriggers`), `pcm_triggerTabs`, `pcm_tabbedTriggers`, `pcm_triggerContents`, false);
    let [_, err] = await this.tabs.prepare();
    if (!err) {
			this.reqIDTab = await this.tabs.addTab("Requester ID", true);
			this.groupIDTab = await this.tabs.addTab("Group ID");
			this.customTab = await this.tabs.addTab("Custom Search");
			this.triggeredTab = await this.tabs.addTab("Triggered Hits");
			this.ridContent = $(`<div class='pcm_ridTriggers card-deck'></div>`).appendTo(`#${this.reqIDTab.tabContent}`);
			this.gidContent = $(`<div class='pcm_gidTriggers card-deck'></div>`).appendTo(`#${this.groupIDTab.tabContent}`);
			this.customContent = $(`<div class='pcm_customTriggers card-deck'></div>`).appendTo(`#${this.customTab.tabContent}`);
			this.triggeredContent = $(`<div class='pcm_triggeredHits card-deck'></div>`).appendTo(`#${this.triggeredTab.tabContent}`);
		}
  }
  /** Update the status bar with the hits found value or the search results value.
   * @param  {string} statusName - The status name @param  {string} status		 - The status value */
  updateStatus(statusName, status) {
    if (statusName === 'hits found') $('#pcm_searchHitsFound').html(status);
    else if (statusName === 'total results') $('#pcm_searchResults').html(status);
	}
	/** This method will update the passed element with the info from the passed trigger info.
	 * @param  {object} [thetrigger=null] - The jquery element @param  {object} [passInfo=null]	- Pass info @param  {bool} [toggle=true] - Toggled? */
	updateTrigger(thetrigger=null, passInfo=null, toggle=true) {
		let status = $(thetrigger).data('status'), unique = $(thetrigger).data('unique'), newStatus = status;
		newStatus = bgSearchClass.toggleTrigger(unique);
		$(thetrigger).data('status', newStatus);
		if (newStatus === 'disabled') $(thetrigger).addClass("pcm_disabled"); else $(thetrigger).removeClass("pcm_disabled");
	}
	/**
	 * @param  {object} [card=null] - Jquery element to find cards. */
	cardEvents(card=null) {
		let element = (card) ? $(card).find('.pcm_triggerCard') : $('.pcm_triggerCard');
		element.unbind('dblclick').on('dblclick', (e) => { this.updateTrigger($(e.target).closest('.card')); });
	}
	/** Add the trigger info to the specific tabs for trigger.
	 * @param  {object} data   - Trigger data         @param  {object} status - Trigger status @param  {string} name - Trigger name
	 * @param  {number} unique - Trigger unique ID */
	addToUI(data, status, name, unique) {
		let disabledClass = (status === 'disabled') ? ' pcm_disabled' : '';
		let card = $(`<div class='card border pcm_triggerCard${disabledClass}' id='pcm_triggerCard_${unique}'></div>`).data('unique',unique).data('status', status).click( e => {
			let theCard = $(e.target).closest('.card'), theButton = theCard.find('.pcm_deleteButton'), unique = theCard.data('unique');
			theButton.css({'backgroundColor':'', 'color':'', 'borderColor':''});
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(unique)) { this.ctrlDelete = arrayRemove(this.ctrlDelete, unique); }
				else { theButton.css({'backgroundColor':'darkred', 'color':'yellow', 'borderColor':'yellow'}); this.ctrlDelete.push(unique); }
			} else if (e.altKey) { this.ctrlDelete.length = 0; $('.pcm_deleteButton').css({'backgroundColor':'', 'color':'', 'borderColor':''}); }
			theButton = null; theCard = null;
		});
		let body = $(`<div class='card-body p-0'></div>`).css('cursor', 'default').appendTo(card);
		let text = $(`<div class='card-text' id='output_${unique}'></div>`).appendTo(body);
		let nameGroup = $(`<div class='pcm_triggerGroup row w-100 px-0'></div>`).append($(`<span class='pcm_triggerName col mr-auto px-0 text-truncate' id='pcm_triggerName_${unique}' data-toggle='tooltip' data-html='true' data-placement='bottom' title='${name}'>${name}</span>`).css('cursor', 'default')).appendTo(text);
		let buttonGroup = $(`<span class='pcm_tButtonGroup col col-auto text-right px-0' id='pcm_tButtons_${unique}'></span>`).css('cursor', 'pointer').appendTo(nameGroup);
		$(`<i class='fas fa-caret-square-down pcm_optionsMenu'></i>`).click( () => console.log('what options?') ).data('unique',unique).appendTo(buttonGroup);
		$(`<i class='fas fa-times pcm_deleteButton'></i>`).click( (e) => {
			let unique = $(e.target).closest('.card').data('unique');
			if (!this.ctrlDelete.includes(unique)) this.ctrlDelete.push(unique);
			this.removeJobs(this.ctrlDelete);
		} ).data('unique',unique).appendTo(buttonGroup);
		// if (data.type === 'custom') { text.append(`<div>Status</div>`); }
		this.multiple[data.type].push(card);
	}
	/** Appends any cards created in the document fragment to the card deck to show cards faster. */
	appendFragments() {
		for (const key of Object.keys(this.multiple)) {
			let df = $(document.createDocumentFragment());
			for (const card of this.multiple[key]) { df.append(card); }
			$(this[`${key}Content`]).append(df); df = null;
		}
		this.cardEvents();
		this.multiple = {'rid':[], 'gid':[], 'custom':[]};
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
			jobsArr.forEach( async (unique) => { if (unique) bgSearchClass.removeTrigger(_,_, unique, true, true); });
			modal.closeModal(); jobsArr.length = 0;
		}, null, () => { jobsArr.length = 0; $('.pcm_deleteButton').css({'backgroundColor':'', 'color':'', 'borderColor':''}); });
	}
}
