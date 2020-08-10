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
		this.scanTab = {};
		this.multiple = {'rid':[], 'gid':[], 'scan':[]};
	}
  /** Stops the searching process. */
  stopSearching() {
		if (bgSearchClass.searchGStats.isSearchOn()) bgSearchClass.searchGStats.searchingOff();
		bgSearchClass.stopSearching();
	}
  /** Starts the searching prcoess. */
  startSearching() { bgSearchClass.searchGStats.searchingOn(); bgSearchClass.startSearching(); }
  /** Shows logged off modal and will unpause the timer when logged off modal closes. */
	nowLoggedOff() {
		modal = new ModalClass();
		modal.showLoggedOffModal( () => { modal = null; bgSearchClass.unPauseTimer(); } );
	}
  /** Closes any loggedoff modal because it's now logged on. */
	nowLoggedOn() { if (modal) modal.closeModal('Program Paused!'); }
	/** Updates the stat object with the text provided or the stat value.
	 * @param  {object} statObj - The object of the stat that needs to be updated.
	 * @param  {string} text		- The text to display in the stat area. */
	updateStatNav(statObj, text) {
		if (text==="") {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled===true) return null;
			$(statObj.id).html(statObj.value);
		} else $(statObj.id).html(text);
		if (statObj.addClass && statObj.value) $(statObj.id).addClass(statObj.addClass);
		else if (statObj.addClass) $(statObj.id).removeClass(statObj.addClass);
	}
  /** Prepare the search page with button events and set up the columns for triggers to use. */
  async prepareSearch() {
		bgSearchClass.prepareSearch();
		$("#pcm_searchNow").click( (e) => {
			if (bgSearchClass.searchGStats.isSearchOn()) this.stopSearching();
			else this.startSearching();
			$(e.target).blur();
		});
		this.tabs = new TabbedClass($(`#pcm_searchTriggers`), `pcm_triggerTabs`, `pcm_tabbedTriggers`, `pcm_triggerContents`, false);
    let [_, err] = await this.tabs.prepare();
    if (!err) {
			this.reqIDTab = await this.tabs.addTab("Requester ID", true);
			this.groupIDTab = await this.tabs.addTab("Group ID");
			this.scanTab = await this.tabs.addTab("Scan Search");
			this.ridContent = $(`<div class='pcm_ridTriggers card-deck'></div>`).appendTo(`#${this.reqIDTab.tabContent}`);
			this.gidContent = $(`<div class='pcm_gidTriggers card-deck'></div>`).appendTo(`#${this.groupIDTab.tabContent}`);
			this.scanContent = $(`<div class='pcm_scanTriggers card-deck'></div>`).appendTo(`#${this.scanTab.tabContent}`);
		}
  }
  /** Update the status bar with the hits found value or the search results value.
   * @param  {string} statusName - The status name to update with the status value.
   * @param  {string} status		 - The status value that should be display in the status bar. */
  updateStatus(statusName, status) {
    if (statusName === 'hits found') $('#pcm_searchHitsFound').html(status);
    else if (statusName === 'total results') $('#pcm_searchResults').html(status);
	}
	/** This method will update the passed element with the info from the passed trigger info.
	 * @param  {object} [thetrigger=null] - The jquery element where the updated data should be placed.
	 * @param  {object} [passInfo=null]	  - The info from the trigger that needs to display updates.
	 * @param  {bool} [toggle=true]				- Should this trigger be toggled? */
	updateTrigger(thetrigger=null, passInfo=null, toggle=true) {
		let status = $(thetrigger).data('status'), unique = $(thetrigger).data('unique'), newStatus = status;
		newStatus = bgSearchClass.toggleTrigger(unique);
		$(thetrigger).data('status', newStatus);
		if (newStatus === 'disabled') $(thetrigger).addClass("pcm_disabled"); else $(thetrigger).removeClass("pcm_disabled");
	}
	cardEvents(card=null) {
		let element = (card) ? $(card).find('.pcm_triggerCard') : $('.pcm_triggerCard');
		element.unbind('dblclick').on('dblclick', (e) => {
			this.updateTrigger($(e.target).closest('.card'));
		});
	}
	/** Add the trigger info to the specific tabs for trigger.
	 * @param  {object} data    - The data about this trigger that is needed to be added to this column.
	 * @param  {object} info    - The info about this trigger that is needed to be added to this column.
	 * @param  {object} options - The options for this trigger that is needed to be added to this column.
	 * @param  {number} index   - The unique index number for this trigger.
	 * @param  {number} dbid    - The unique database number for this trigger. */
	addToUI(data, status, name, unique) {
		let disabledClass = (status === 'disabled') ? ' pcm_disabled' : '';
		let card = $(`<div class='card border pcm_triggerCard${disabledClass}' id='pcm_triggerCard_${unique}'></div>`).data('unique',unique).data('status', status);
		let body = $(`<div class='card-body p-0'></div>`).appendTo(card);
		let text = $(`<div class='card-text p-0' id='output_${unique}'>`).appendTo(body);
		$(text).html(name);
		this.multiple[data.type].push(card);
	}
	appendFragments() {
		for (const key of Object.keys(this.multiple)) {
			let df = $(document.createDocumentFragment());
			for (const card of this.multiple[key]) { df.append(card); }
			$(this[`${key}Content`]).append(df); df = null;
		}
		this.cardEvents();
		this.multiple = {'rid':[], 'gid':[], 'scan':[]};
	}
	/** Remove the trigger with the type and group ID or requester ID from the search UI.
	 * @param  {string} type  - Type of the trigger [group ID or requester ID].
	 * @param  {number} value - Group ID or Requester ID for value depending on type. */
	removeTrigger(type, value) {
		const active = $(`#nav-${type}TabContent div.active`);
		if ($(active).get(0).id === `list-t${type}${value}`) {
			if ($(active).next().length>0) { 
				$(active).next().tab('show');
				$(`#pcm_${type}ListTab a.active`).next().tab('show');
			} else if ($(active).prev().length>0) {
				$(active).prev().tab('show');
				$(`#pcm_${type}ListTab a.active`).prev().tab('show');
			}
		}
		$(`#list-t${type}${value}-list`).remove(); $(`#list-t${type}${value}`).remove();
	}
}
