class SearchUI {
  constructor () {
		this.ridRow = null; this.ridColumn1 = null; this.ridListGroup1 = null;
	}
  stopSearching() { bgSearchClass.stopSearching(); }
  startSearching() { bgSearchClass.startSearching(); }
	nowLoggedOff() {
		modal.showLoggedOffModal( () => { bgSearchClass.unPauseTimer(); } );
	}
	nowLoggedOn() { modal.closeModal(); }
	updateStatNav(statObj,text) {
		if (text==="") {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled===true) return null;
			$(statObj.id).html(statObj.value);
		} else $(statObj.id).html(text);
		if (statObj.addClass && statObj.value) $(statObj.id).addClass(statObj.addClass);
		else if (statObj.addClass) $(statObj.id).removeClass(statObj.addClass);
	}
  prepareSearch() {
		$("#pcm_saveToFile").click( (e) => { saveToFile(bgSearchClass.hitSearchObjects); });
		$("#pcm_searchNow").click( (e) => {
			if (!bgSearchClass.isPandaUI()) return false;
			if (bgSearchClass.searchGStats.isSearchNowOn()) {
				this.stopSearching(); bgSearchClass.searchGStats.searchNowOff();
			} else { this.startSearching(); }
		});
		let ridRow = $(`<div class="row mx-0"></div>`).appendTo(`#pcm_requesterTriggers`);
		$(ridRow).append(`<div class="col-4 px-0 my-1"><div class="list-group list-group-flush" id="pcm_ridListTab" role="tablist"></div></div><div class="col-8 pl-1 mx-0"><div class="tab-content" id="nav-ridTabContent"></div></div>`);
		let gidRow = $(`<div class="row mx-0"></div>`).appendTo(`#pcm_groupTriggers`);
		$(gidRow).append(`<div class="col-4 px-0 my-1"><div class="list-group list-group-flush" id="pcm_gidListTab" role="tablist"></div></div><div class="col-8 pl-1 mx-0"><div class="tab-content" id="nav-gidTabContent"></div></div>`);
		if (bgSearchClass.searchGStats.isSearchOn()) { bgSearchClass.openUI(); }
	if (bgSearchClass.isPandaUI()) bgQueueClass.startQueueMonitor();
  }
  updateStatus(statusName,status) {
    if (statusName === "hits found") $("#pcm_searchHitsFound").html(status);
    else if (statusName === "total results") $("#pcm_searchResults").html(status);
	}
	updateTrigger(thetrigger=null, passInfo=null, toggle=true) { console.log("passInfo", JSON.stringify(passInfo));
		if (thetrigger===null && passInfo===null) return;
		const theTarget = (thetrigger) ? thetrigger : $(`#list-t${passInfo.key1}${passInfo.count}-list`);
		const theInfo = $(theTarget).data("info"); console.log("theinfo", JSON.stringify(theInfo));
		if (toggle) bgSearchClass.toggleDisabled(theInfo.key2, theInfo, false)
		if ($(theTarget).hasClass("pcm_disabled")) $(theTarget).removeClass("pcm_disabled");
		else $(theTarget).addClass("pcm_disabled");
		const disabledText = (theInfo.disabled) ? ` <span class="text-danger pcm_disabledText">(Disabled)</span>` : ` <span class="text-success pcm_disabledText">(Enabled)</span>`;
		$(`#list-t${theInfo.key1}${theInfo.count} .pcm_disabledText`).html(disabledText);
	}
	addToColumn1(info,index) {
		const disabledClass = (info.disabled) ? " pcm_disabled" : "";
		const active = (Number(index)===1) ? " show active" : "";
		const key1 = info.key1, key2 = info.key2, count = info.count;
		const label = $(`<a class="list-group-item list-group-item-action${active} py-0 px-1 mx-0 my-0 border-info text-nowrap text-truncate pcm_triggerItem${disabledClass}" id="list-t${key1}${count}-list" data-toggle="list" href="#list-t${key1}${count}" role="tab" aria-controls="t${key1}${count}">${info.name} [<span class="text-xs">${shortenGroupId(key2)}</span>]</a>`).data("key1",key1).data("key2",key2).data("count",count).data("info",info);
		$(label).appendTo(`#pcm_${key1}ListTab`);
		$(label).on('dblclick', (e) => {
			const theTarget = $(e.target).closest('a');
			this.updateTrigger(theTarget);
		});
	}
	addToColumn2(info,index) {
		const disabledText = (info.disabled) ? ` <span class="text-danger pr-2 pcm_disabledText">(Disabled)</span>` : ` <span class="text-success pr-2 pcm_disabledText">(Enabled)</span>`;
		const active = (Number(index)===1) ? " show active" : "";
		const key1 = info.key1, key2 = info.key2, count = info.count;
		const tabPane = $(`<div class="tab-pane fade${active}" id="list-t${key1}${count}" role="tabpanel" aria-labelledby="list-t${key1}${count}-list" data-key1=${key1} data-key2="${key2}" data-test1="${info}"></div>`).data("info",info).data("search",this).appendTo(`#nav-${key1}TabContent`);
		displayObjectData([
			{ label:"", type:"string", string:`<span class="text-pcmInfo pl-1">${info.name}</span> - <span class="text-xs text-light">[${shortenGroupId(key2)}]</span>${disabledText}` },
			{ label:"Duration: ", type:"text", key:"duration" }, 
			{ label:"Once: ", type:"text", key:"once" }, 
			{ label:"Limit Group ID in Queue: ", type:"text", key:"limitNumQueue" }, 
			{ label:"Limit Total Hits in Queue: ", type:"text", key:"limitTotalQueue" }, 
			{ label:"Temporary GoHam Time on Auto: ", type:"text", key:"tempGoHam", disable:true } 
		], tabPane, bgSearchClass.triggerInfo[key1][key2]);
	}
	addToUI(info, index) {
		this.addToColumn1(info,index); this.addToColumn2(info,index);
	}
	removeTrigger(key1, count) {
		const active = $(`#nav-${key1}TabContent div.active`);
		if ($(active).get(0).id === `list-t${key1}${count}`) {
			if ($(active).next().length>0) { 
				$(active).next().tab('show');
				$(`#pcm_${key1}ListTab a.active`).next().tab('show');
			} else if ($(active).prev().length>0) {
				$(active).prev().tab('show');
				$(`#pcm_${key1}ListTab a.active`).prev().tab('show');
			}
		}
		$(`#list-t${key1}${count}-list`).remove(); $(`#list-t${key1}${count}`).remove();
	}
}
