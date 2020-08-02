/** A class dealing with the search UI so the user can more easily enable or disable triggers.
 * @class SearchUI
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class SearchUI {
  constructor () {
		this.ridRow = null;
		this.ridColumn1 = null;
		this.ridListGroup1 = null;
	}
  /** Stops the searching process. */
  stopSearching() {
		if (bgSearchClass.searchGStats.isSearchOn()) bgSearchClass.searchGStats.searchingOff();
		bgSearchClass.stopSearching();
	}
  /** Starts the searching prcoess. */
  startSearching() {
		bgSearchClass.searchGStats.searchingOn();
		bgSearchClass.startSearching();
	}
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
  prepareSearch() {
		bgSearchClass.prepareSearch();
		$("#pcm_saveToFile").click( (e) => { saveToFile(bgSearchClass.hitSearchObjects); });
		$("#pcm_searchNow").click( (e) => {
			if (bgSearchClass.searchGStats.isSearchOn()) this.stopSearching();
			else this.startSearching();
		});
		let ridRow = $(`<div class="row mx-0"></div>`).appendTo(`#pcm_requesterTriggers`);
		$(ridRow).append(`<div class="col-4 px-0 my-1"><div class="list-group list-group-flush" id="pcm_ridListTab" role="tablist"></div></div><div class="col-8 pl-1 mx-0"><div class="tab-content" id="nav-ridTabContent"></div></div>`);
		let gidRow = $(`<div class="row mx-0"></div>`).appendTo(`#pcm_groupTriggers`);
		$(gidRow).append(`<div class="col-4 px-0 my-1"><div class="list-group list-group-flush" id="pcm_gidListTab" role="tablist"></div></div><div class="col-8 pl-1 mx-0"><div class="tab-content" id="nav-gidTabContent"></div></div>`);
		if (bgSearchClass.isPandaUI()) bgQueue.startQueueMonitor();
		ridRow = null; gidRow = null;
  }
  /** Update the status bar with the hits found value or the search results value.
   * @param  {string} statusName - The status name to update with the status value.
   * @param  {string} status		 - The status value that should be display in the status bar. */
  updateStatus(statusName, status) {
    if (statusName === "hits found") $("#pcm_searchHitsFound").html(status);
    else if (statusName === "total results") $("#pcm_searchResults").html(status);
	}
	/** This method will update the passed element with the info from the passed trigger info.
	 * @param  {object} [thetrigger=null] - The jquery element where the updated data should be placed.
	 * @param  {object} [passInfo=null]	  - The info from the trigger that needs to display updates.
	 * @param  {bool} [toggle=true]				- Should this trigger be toggled? */
	updateTrigger(thetrigger=null, passInfo=null, toggle=true) {
		if (thetrigger===null && passInfo===null) return;
		let theTarget = (thetrigger) ? thetrigger : $(`#list-t${passInfo.key1}${passInfo.count}-list`);
		let key1 = $(theTarget).data('key1'), key2 = $(theTarget).data('key2'), status = $(theTarget).data('status'), count = $(theTarget).data('count');
		let newStatus = status;
		if (toggle) newStatus = bgSearchClass.toggleTrigger(key1, key2);
		$(theTarget).data('status', newStatus);
		if ($(theTarget).hasClass("pcm_disabled")) $(theTarget).removeClass("pcm_disabled"); else $(theTarget).addClass("pcm_disabled");
		const disabledText = (newStatus === 'disabled') ? ` <span class="text-danger pcm_disabledText">(Disabled)</span>` : ` <span class="text-success pcm_disabledText">(Enabled)</span>`;
		$(`#list-t${key1}${count} .pcm_disabledText`).html(disabledText);
	}
	/** Display the info for a trigger in the column 2 detail area.
	 * @param  {object} data  - The data about this trigger that is needed to be added to this column.
	 * @param  {object} info  - The info about this trigger that is needed to be added to this column.
	 * @param  {number} index - The unique index number for this trigger.
	 * @param  {number} dbid  - The unique database number for this trigger. */
	addToColumn1(data, info, index, dbId) {
		const disabledClass = (info.status === 'disabled') ? " pcm_disabled" : "";
		const active = (Number(index)===1) ? " show active" : "";
		const key1 = data.type, key2 = data.value, count = info.count;
		const label = $(`<a class="list-group-item list-group-item-action${active} py-0 px-1 mx-0 my-0 border-info text-nowrap text-truncate pcm_triggerItem${disabledClass}" id="list-t${key1}${info.count}-list" data-toggle="list" href="#list-t${key1}${info.count}" role="tab" aria-controls="t${key1}${info.count}">${info.name} [<span class="text-xs">${shortenGroupId(key2)}</span>]</a>`).data('key1', key1).data('key2', key2).data('count', info.count).data('status', info.status).data('dbId',dbId);
		$(label).appendTo(`#pcm_${key1}ListTab`);
		$(label).on('dblclick', (e) => {
			const theTarget = $(e.target).closest('a');
			this.updateTrigger(theTarget);
		});
	}
	/** Display the info for a trigger in the column 2 detail area.
	 * @param  {object} data    - The data about this trigger that is needed to be added to this column.
	 * @param  {object} info    - The info about this trigger that is needed to be added to this column.
	 * @param  {object} options - The options for this trigger that is needed to be added to this column.
	 * @param  {number} index   - The unique index number for this trigger. */
	addToColumn2(data, info, options, index) {
		const disabledText = (info.status === 'disabled') ? ` <span class="text-danger pr-2 pcm_disabledText">(Disabled)</span>` : ` <span class="text-success pr-2 pcm_disabledText">(Enabled)</span>`;
		const active = (Number(index)===1) ? " show active" : "";
		const key1 = data.type, key2 = data.value, count = info.count;
		const tabPane = $(`<div class="tab-pane fade${active}" id="list-t${key1}${count}" role="tabpanel" aria-labelledby="list-t${key1}${count}-list" data-key1=${key1} data-key2="${key2}"></div>`).appendTo(`#nav-${key1}TabContent`);
		displayObjectData([
			{ label:"", type:"string", string:`<span class="text-pcmInfo pl-1">${info.name}</span> - <span class="text-xs text-light">[${shortenGroupId(key2)}]</span>${disabledText}` },
			{ label:"Duration: ", type:"text", key:"duration" }, 
			{ label:"Once: ", type:"text", key:"once" }, 
			{ label:"Limit Group ID in Queue: ", type:"text", key:"limitNumQueue" }, 
			{ label:"Limit Total Hits in Queue: ", type:"text", key:"limitTotalQueue" }, 
			{ label:"Temporary GoHam Time on Auto: ", type:"text", key:"tempGoHam", disable:true } 
		], tabPane, options);
	}
	/** Add the trigger info to the page in column 1 and column 2.
	 * @param  {object} data    - The data about this trigger that is needed to be added to this column.
	 * @param  {object} info    - The info about this trigger that is needed to be added to this column.
	 * @param  {object} options - The options for this trigger that is needed to be added to this column.
	 * @param  {number} index   - The unique index number for this trigger.
	 * @param  {number} dbid    - The unique database number for this trigger. */
	addToUI(data, info, options, index, dbId) {
		this.addToColumn1(data, info, index, dbId); this.addToColumn2(data, info, options, index);
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
