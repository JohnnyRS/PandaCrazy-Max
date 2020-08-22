/** A class that deals with the basic cards for panda jobs to show on tab UI.
 * @class UrlClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaCards {
  constructor() {
    this.cards = {};
    this.tabs = null;
    this.multiple = [];
		this.ctrlDelete = [];								// List of panda's selected for deletion by using ctrl key
    this.values = {
      'reqName':{'valueName':'reqName', 'id':'#pcm_hitReqName', 'class':'.pcm_reqName', 'label':''},
      'reqName1Line':{'valueName':'reqName', 'id':'#pcm_hitReqName1', 'class':'.pcm_reqName1', 'label':''},
      'friendlyReqName':{'valueName':'friendlyReqName', 'id':'#pcm_hitReqName', 'class':'.pcm_reqName', 'label':''},
      'groupId':{'valueName':'groupId', 'id':'#pcm_groupId', 'class':'.pcm_groupId', 'label':''},
      'price':{'valueName':'price', 'id':'#pcm_hitPrice', 'class':'.pcm_price', 'label':''},
      'numbers':{'valueName':'hitsAvailable', 'id':'#pcm_numbers', 'class':'.pcm_numbers', 'label':''},
      'title':{'valueName':'title', 'id':'#pcm_hitTitle', 'class':'.pcm_title', 'label':''},
      'reqId':{'valueName':'reqId'},
      'friendlyTitle':{'valueName':'friendlyTitle', 'id':'#pcm_hitTitle', 'label':''},
      'collectBtn':{'class':'.pcm_collectButton'},
      'collectTip':'Start Collecting this Panda Hit',
      'details':'Display and edit all options for this Panda.',
      'delete':'Delete this Panda hit. [CTRL] click cards to delete multiple hits.',
      'hamTip':'Collect hits from this Panda only! Delayed ham mode can be turned on by clicking and holding this button.'
    }
  }
  /** Prepare cards by assigning the tabs object to variable.
   * @param  {object} tabs - The tab object with tab information. */
  prepare(tabs) { this.tabs = tabs; }
  /** Add card to the tab content area.
   * @param  {number} myId           - The unique ID for a panda job.
   * @param  {object} info           - The information from a panda hit to update to card.
   * @param  {bool} [fromDB=false]   - Are these cards being created from jobs loaded from database? */
  addCard(myId, info, fromDB=false) {
    this.cards[myId] = new PandaCard(myId, info.dbId);
    this.appendCard(myId, info, fromDB);
    this.cards[myId].updateAllCardInfo(info, this.values);
  }
  /** Updates the card information shown with the unique ID for job.
   * @param  {number} myId - The unique ID for a panda job.
   * @param  {object} info - The information from a panda hit to update to card. */
  updateAllCardInfo(myId, info) { this.cards[myId].updateAllCardInfo(info, this.values); }
  /** Get the card element with the unique number ID.
   * @param  {number} myId - The unique ID for a panda job.
   * @return {object}      - The card element for the unique number. */
  get(myId) { return this.cards[myId]; }
  /** Remove all cards from the tab UI. */
  async removeAll() {
		for (const key of Object.keys(this.cards)) { this.cards[key].df = null; }
		this.cards = {}; this.multiple = []; this.ctrlDelete = []; this.tabs = null;
  }
  /** Append all the document fragments for this tab with unique number.
   * @param  {number} tabUnique - The unique number for the tab for cards to be added. */
  appendDoc(tabUnique) {
    let df = $(document.createDocumentFragment());
    for (const myId of this.multiple) { df.append(this.cards[myId].document); }
    this.tabs.appendTo(df, tabUnique); this.multiple = []; df = null;
  }
  /** Change the information displayed on all the panda cards to normal, minimal or one liner.
   * @param  {number} display - The number representing the info displayed in the panda card. */
  changeDisplay(display) {
		globalOpt.setCardDisplay(display);
		for (const myId of Object.keys(this.cards)) { this.cards[myId].updateCardDisplay(this.values); }
	}
  /** Create the status area for the panda card.
   * @param  {number} myId            - The unique ID for a panda job.
   * @param  {object} info            - The information from a panda hit to update to card.
   * @param  {string} [oneLine=false] - Should this card only show one line info? */
  createCardStatus(myId, info, oneLine=false) {
    let element = (oneLine) ? 'span' : 'div', one = (oneLine) ? '1' : '', searchText = (oneLine) ? '' : ' search';
    let search = (info.search) ? ` (<span class='${info.search}search'>${info.search.toUpperCase()}${searchText}</span>)` : '';
    return `<${element} class="pcm_hitStats mr-auto" id="pcm_hitStats${one}_${myId}">[ <span class="pcm_hitAccepted" id="pcm_hitAccepted${one}_${myId}"></span> | <span class="pcm_hitFetched" id="pcm_hitFetched${one}_${myId}"></span> ]${search}</${element}>`;
  }
  /** Create the button group area for the panda card.
   * @param  {number} myId - The unique ID for a panda job.
   * @param  {object} info - The information from a panda hit to update to card. */
  createCardButtonGroup(myId, info) {
    const textCollect = (info.search) ? "-Collecting-" : "Collect";
    let group = `<div class="card-text" id="pcm_buttonGroup_${myId}"><button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_collectButton pcm_buttonOff shadow-none" id="pcm_collectButton_${myId}" data-toggle="tooltip" data-html="true" data-placement="bottom" title="${this.values.collectTip}"><span>${textCollect}</span></button>`;
    if (!info.search) group += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_hamButton pcm_buttonOff shadow-none" id="pcm_hamButton_${myId}" data-toggle="tooltip" data-html="true" data-placement="bottom" title="${this.values.hamTip}"><span>GoHam</span></button>`;
    group += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_detailsButton pcm_buttonOff shadow-none" id="pcm_detailsButton_${myId}" data-toggle="tooltip" data-html="true" data-placement="bottom" title="${this.values.details}"><span>Details</span></button>`;
    group += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_deleteButton pcm_buttonOff shadow-none" id="pcm_deleteButton_${myId}" data-toggle="tooltip" data-html="true" data-placement="bottom" title="${this.values.delete}"><span>X</span></button>`;
    group += `</div>`;
    return group;
  }
  /** Used to display a card with only one line for display purposes.
   * @param  {number} myId - The unique ID for a panda job.
   * @param  {object} info - The information from a panda hit to update to card. */
  oneLineCard(myId, info) {
    const nameGroup = $(`<div class="pcm_nameGroup row w-90"></div>`).css('cursor', 'default').hide().append(`<span class="pcm_reqName1 col mr-auto px-1 text-truncate" id="pcm_hitReqName1_${myId}"></span>`);
    $(this.createCardStatus(myId, info, true)).appendTo(nameGroup);
    let buttonGroup = $(`<span class="d-flex pl-1 pcm_buttonGroup1" id="pcm_buttonGroup1_${myId}"></span>`).appendTo(nameGroup);
    buttonGroup.append(`<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_collectButton1 pcm_buttonOff shadow-none" type="button" id="pcm_collectButton1_${myId}"><span>C</span></button>`);
    buttonGroup.append(`<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_hamButton pcm_buttonOff shadow-none" type="button" id="pcm_hamButton1_${myId}"><span>H</span></button>`);
    buttonGroup.append(`<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_detailsButton pcm_buttonOff shadow-none" type="button" id="pcm_detailsButton1_${myId}"><span>D</span></button>`);
    buttonGroup.append(`<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_deleteButton pcm_buttonOff shadow-none" type="button" id="pcm_deleteButton1_${myId}"><span>X</span></button>`);
    buttonGroup = null;
    return nameGroup;
  }
  /** Create the card and add it to the multiple array for appending later.
   * @param  {number} myId       - The unique ID for a panda job.
   * @param  {object} info       - The information from a panda hit to update to card. */
  createCard(myId, info) {
    const searchCard = (info.data.search) ? " pcm_searching" : "";
    let card = $(`<div class="card text-light border pcm_pandaCard${searchCard}" id="pcm_pandaCard_${myId}"></div>`).data("myId",myId);
    let cardBody = $(`<div class="card-body"></div>`).appendTo(card);
    let cardText = $(`<div class="card-text" id="output_${myId}">`).appendTo(cardBody);
    $(`<div class="pcm_nameGroup row w-100 px-0"></div>`).append($(`<span class="pcm_reqName col mr-auto px-0 text-truncate" id="pcm_hitReqName_${myId}" data-toggle="tooltip" data-html="true" data-placement="bottom" title=""></span>`).css('cursor', 'default')).append($(`<span class="pcm_groupId col col-auto text-right px-0" id="pcm_groupId_${myId}"></span>`).css('cursor', 'pointer').data('myId',myId).data('double',0)).appendTo(cardText);
    this.oneLineCard(myId, info).appendTo(cardText);
    $(`<div class="pcm_priceGroup"></div>`).append($(`<span class="pcm_price text-truncate" id="pcm_hitPrice_${myId}"></span>`).css('cursor', 'default')).append($(`<span class="pcm_numbers text-truncate pl-1" id="pcm_numbers_${myId}"></span>`)).appendTo(cardText);
    $(`<div class="pcm_title text-truncate" id="pcm_hitTitle_${myId}" data-toggle="tooltip" data-html="true" data-placement="bottom" title=""></div>`).css('cursor', 'default').appendTo(cardText);
    $(this.createCardStatus(myId, info)).appendTo(cardText);
    $(this.createCardButtonGroup(myId, info)).appendTo(cardText);
    this.cards[myId].document = card;
    this.multiple.push(myId);
    card = null; cardBody = null; cardText = null;
  }
  /** Append this card to the panda tab.
   * @param  {number} myId             - The unique ID for a panda job.
   * @param  {object} info             - Data for the panda connected to this card.
   * @param  {bool} [fromDB=false]     - Did this panda come from the database or a default value? */
  appendCard(myId, info, fromDB=false) {
    let thisTabUnique = (info.data.tabUnique !== null) ? info.data.tabUnique : this.tabs.currentTab; this.df = $('');
    if (!this.tabs.getUniques().includes(thisTabUnique)) thisTabUnique = this.tabs.currentTab;
    if (info.data.tabUnique != thisTabUnique) { info.data.tabUnique = thisTabUnique; bgPanda.updateDbData(this.myId); }
    if (!fromDB) this.tabs.setPosition(thisTabUnique, info.dbId, !fromDB);
    this.createCard(myId, info);
    this.cards[myId].updateCardDisplay(this.values);
  }
  /** Remove this panda card from UI.
   * @param  {number} myId         - The unique ID for a panda job.
   * @param  {function} removeFunc - Function to call after remove card animation is done.
   * @param  {bool} [animate=true] - Should remove show an animation effect? */
  removeCard(myId, removeFunc, animate=true) {
    let doRemoval = (removeFunc) => {
      $(`#pcm_pandaCard_${myId}`).stop(true, true).remove();
      this.cards[myId].removeCard();
      delete this.cards[myId];
      removeFunc();
    }
    if (animate) $(`#pcm_pandaCard_${myId}`).effect('slide', { direction:'left', mode:'hide' }, 250, async () => {
      doRemoval(removeFunc);
    });
    else { doRemoval(removeFunc); }
  }
	/** Show that this ham button with this unique ID is in auto go ham mode.
	 * @param  {number} myId - The unique ID for a panda job. */
	startAutoGoHam(myId) { $(`#pcm_hamButton_${myId}`).addClass("pcm_delayedHam"); }
	/** Disable all other ham buttons which don't use the unique ID for the panda job.
	 * @param  {number} [myId=null] - The unique ID for a panda job. */
	disableOtherHamButtons(myId=null) {
		if (myId!==null) $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		$(".pcm_hamButton.pcm_buttonOff").addClass("disabled");
	}
	/** Turn on the ham button for this panda job with the unique ID.
	 * @param  {number} myId - The unique ID for a panda job. */
	hamButtonOn(myId) {
		$(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
		this.disableOtherHamButtons(myId);
	}
	/** Turn off all the ham buttons on the page. */
	hamButtonsOff() { this.enableAllHamButtons(); }
	/** Enable all the ham buttons on the page. */
	enableAllHamButtons() { $(".pcm_hamButton").removeClass("disabled").removeClass("pcm_buttonOn").addClass("pcm_buttonOff"); }
  /** Make the color of the panda card with this unique ID to the previous color in the card data.
   * @param  {number} myId - The unique ID for a panda job. */
  cardPreviousColor(myId) { return $(`#pcm_pandaCard_${myId}`).data("previousColor"); }
  /** Highlight the panda card's gid number with this unique ID.
   * @param  {number} myId - The unique ID for a panda job. */
  highlightEffect_gid(myId) { $(`#pcm_groupId_${myId}, #pcm_buttonGroup1_${myId}`).effect( "highlight", {color:"#E6E6FA"}, 300 ); }
  /** Highlight the panda card according to the action and duration.
   * @param  {number} myId 						 - The unique ID for a panda job.
   * @param  {string} [action=""] 		 - The action that will be causing the highlight effect.
   * @param  {number} [duration=15000] - The duration the highlight effect should last. */
  highlightEffect_card(myId, action="", duration=15000) {
    let theColor = (action==="stop") ? "#FFA691" : "#ffff99";
    $(`#pcm_pandaCard_${myId}`).stop(true,true).effect( "highlight", {color:theColor}, duration );
  }
  /** Show that this panda is not collecting anymore and show effect or a new background color.
   * @param  {number} myId 						 - The unique ID for a panda job.
   * @param  {bool} [stopEffect=false] - Should any card effect be stopped?
   * @param  {string} [whyStop=null]	 - The reason why this panda is stopping.
   * @param  {string} [newBgColor=""]	 - The new background color of the panda card. */
  stopItNow(myId, stopEffect=false, whyStop=null, newBgColor="") {
    if (stopEffect) this.stopEffect_card(myId); 
    if (newBgColor!=="") {
      $(`#pcm_pandaCard_${myId}`).data("previousColor1", $(`#pcm_pandaCard_${myId}`).data('stopped',whyStop)
      .css("background-color")).css("background-color", newBgColor);
    }
		if (stopEffect) this.highlightEffect_card(myId,"stop",7500);
		pandaUI.stopCollecting(myId, whyStop);
  }
  /** Either change background color to provided color and save the previous color or change the
	 * background color to the previous color saved in data and remove the previous color data.
   * @param  {number} myId 				 - The unique ID for a panda job.
   * @param  {bool} addPrev				 - Add previous color data to the panda card.
   * @param  {string} [bgColor=""] - The new background color or leave it as is. */
  cardEffectPreviousColor(myId, addPrev, bgColor="") {
    this.stopEffect_card(myId);
    if (addPrev) $(`#pcm_pandaCard_${myId}`).data("previousColor", $(`#pcm_pandaCard_${myId}`)
      .css("background-color")).css("background-color", bgColor);
    else {
      const prevColor = $(`#pcm_pandaCard_${myId}`).data("previousColor");
      $(`#pcm_pandaCard_${myId}`).removeData("previousColor").animate({"backgroundColor":prevColor},{duration:1000});
    }
  }
  /** Stop any effect for the card with the unique ID.
   * @param  {number} myId - The unique ID for a panda job. */
  stopEffect_card(myId) { $(`#pcm_pandaCard_${myId}`).stop(true,true); }
  /** Changes the help tip of the collect button to the value or adds value to current tip.
   * @param  {number} myId        - The unique ID for a panda job.
   * @param  {string} [change=''] - The string to change the tip to or add to.
   * @param  {bool} [add=false]   - Will the change be added to tip or replaces it? */
  collectTipChange(myId, change='', add=false) { this.cards[myId].collectTipChange(this.values, change, add); }
  /** Show that the card is searching for hits.
   * @param  {number} myId - The unique ID for a panda job. */
  pandaSearchingNow(myId) { this.cards[myId].pandaSearchingNow(this.values); }
  /** Show that the card is disabled now.
   * @param  {number} myId - The unique ID for a panda job. */
  pandaSearchDisabled(myId) { this.cards[myId].pandaSearchDisabled(this.values); }
  /** Show that the card is collecting now.
   * @param  {number} myId - The unique ID for a panda job. */
  pandaSearchCollectingNow(myId) { this.cards[myId].pandaSearchCollectingNow(this.values); }
  /** Show that the card is collecting now.
   * @param  {number} myId - The unique ID for a panda job. */
  async pandaEnabled(myId) {
    this.cards[myId].pandaEnabled(this.values); let info = bgPanda.options(myId), data = await bgPanda.dataObj(myId);
    info.disabled = false; data.disabled = false; bgPanda.updateDbData(null, data);
  }
  /** Show that the card is disabled now.
   * @param  {number} myId - The unique ID for a panda job. */
  async pandaDisabled(myId) {
    this.cards[myId].pandaDisabled(this.values); let info = bgPanda.options(myId), data = await bgPanda.dataObj(myId);
    info.disabled = true; data.disabled = true; bgPanda.updateDbData(null, data);
  }
	/** Binds events to all cards on page. Will unbind any events too so won't double events. */
	cardButtons() {
		$(`.pcm_pandaCard`).unbind('click').click( e => {
			let card = $(e.target).closest('.card'), theButton = card.find(".pcm_deleteButton"), myId = card.data('myId');
			theButton.css("background-color", "");
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(myId)) { theButton.css('background-color', ''); this.ctrlDelete = arrayRemove(this.ctrlDelete,myId); }
				else { theButton.css('background-color', 'red'); this.ctrlDelete.push(myId); }
			} else if (e.altKey) { this.ctrlDelete.length = 0; $('.pcm_deleteButton').css('background-color', ''); }
			theButton = null; card = null;
		})
		$(`.pcm_collectButton, .pcm_collectButton1`).unbind('click').click( async (e) => {
      let theButton = $(e.target).closest('.btn'), card = $(e.target).closest('.card');
      if (theButton.data('longClicked')) theButton.removeData('longClicked');
      else {
        let myId = card.data('myId'), stopped = card.data('stopped'), info = bgPanda.options(myId);
        if (stopped === 'noQual' || stopped === 'blocked') {
          if (pandaUI.pandaStats[myId].collecting) await pandaUI.stopCollecting(myId, 'manual');
        } else if (theButton.is('.pcm_buttonOff:not(.pcm_searchOn), .pcm_searchDisable')) {
          info.autoAdded = false;
          if (info.search !== 'rid') await pandaUI.startCollecting(myId, false, (info.search === 'gid') ? 10000 : 0);
          else if (info.search === 'rid') {
            $(`#pcm_collectButton_${myId}`).removeClass('pcm_buttonOff').removeClass('pcm_searchDisable').addClass('pcm_buttonOn');
            $(`#pcm_collectButton1_${myId}`).removeClass('pcm_buttonOff').removeClass('pcm_searchDisable').addClass('pcm_buttonOn');
            pandaUI.pandaGStats.addCollecting(); pandaUI.pandaGStats.collectingOn();
            bgPanda.doSearching(myId, null, 10000);
          }
        } else if (info.search === 'rid') bgPanda.disableSearching(myId);
        else pandaUI.stopCollecting(myId, 'manual');
        theButton = card = null;
      }
		}).mayTriggerLongClicks({ delay: 500 }).unbind('longClick').on('longClick', async (e) => {
      let theButton = $(e.target).closest('.btn'), card = $(e.target).closest('.card');
      if (!card.is('.pcm_searchOn')) {
        let myId = card.data('myId'); theButton.data('longClicked', true);
        if (theButton.is('.pcm_collectDisable')) this.pandaEnabled(myId); else this.pandaDisabled(myId);
        theButton = null; card = null;
      }
    });
		$(`.pcm_hamButton , .pcm_hamButton1`).unbind('click').click( async(e) => { 
			let theButton = $(e.target).closest('.btn'), myId = $(e.target).closest('.card').data('myId');
			if (theButton.data('longClicked')) { theButton.removeData('longClicked'); theButton.css({'background-color': '', 'color': ''});}
			else { pandaUI.hamButtonClicked(myId, theButton); }
			theButton = null;
		}).mayTriggerLongClicks({ delay: 900 }).unbind('longClick').on('longClick', async (e) => {
			let theButton = $(e.target).closest('.btn'), myId = $(e.target).closest('.card').data('myId');
			let info = bgPanda.options(myId), data = await bgPanda.dataObj(myId);
			theButton.data('longClicked', true);
			if (theButton.hasClass('pcm_delayedHam')) {
				theButton.css({"background-color":this.hamBtnBgColor, "color":this.hamBtnColor}).removeClass("pcm_delayedHam");
				info.autoTGoHam = (data.autoGoHam) ? "disable" : "off";
			} else { 
				info.autoTGoHam = "on";
				theButton.css({"background-color": "#097e9b", "color":"#FFFFFF"}).addClass("pcm_delayedHam");
				pandaUI.hamButtonClicked(myId, theButton, true);
			}
			theButton = null;
		});
		$(`.pcm_deleteButton , .pcm_deleteButton1`).unbind('click').click((e) => {
			let myId = $(e.target).closest('.card').data('myId');
			if (!this.ctrlDelete.includes(myId)) this.ctrlDelete.push(myId);
			pandaUI.removeJobs(this.ctrlDelete);
		});
		$(`.pcm_detailsButton , .pcm_detailsButton1`).unbind('click').click( async (e) => {
			let myId = $(e.target).closest('.card').data('myId');
			pandaUI.modalJob = new ModalJobClass();
			pandaUI.modalJob.showDetailsModal(myId,_, () => { pandaUI.modalJob = null; modal = null; });
		});
		$(`.pcm_groupId`).unbind('click').click( (e) => {
			const double = parseInt( $(e.target).data('double'), 10 );
			if (double === 2) $(e.target).data('double', 0);
			setTimeout( () => {
				const double = parseInt( $(e.target).data('double'), 10 );
				if (double !== 2) {
					let myId = $(e.target).data('myId');
					navigator.clipboard.writeText(bgPanda.pandaUrls[myId].accept);
				}
			}, 250);
		});
    $(`.pcm_groupId`).unbind('dblclick').on('dblclick', (e) => {
			let myId = $(e.target).closest('.card').data('myId');
			$(e.target).data('double', 2);
		});
		$(`.pcm_reqName1`).unbind('click').click( (e) => {
			let myId = $(e.target).closest('.card').data('myId');
			$(e.target).hide(); $(`#pcm_hitStats1_${myId}`).show();
		});
		$(`.pcm_hitStats1`).unbind('click').click( (e) => {
			let myId = $(e.target).closest('.card').data('myId');
			$(e.target).hide(); $(`#pcm_hitReqName1_${myId}`).show();
    });
    $(`.pcm_pandaCard`).find('[data-toggle="tooltip"]').tooltip({delay: {show:1300}, trigger:'hover'}).tooltip('enable');
	}
}
/** This class deals with showing panda information on a card and sorts them in the panda area.
 * @class MenuClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaCard {
  /**
   * @param  {number} myId             - The unique id of the panda for this card.
   * @param  {object} info             - The data information for this panda.
   */
  constructor(myId, dbId) {
    this.myId = myId;
    this.dbId = dbId;
    this.df = null;
  }
  /** Returns the document fragment of this card.
   * @return  {object} - The jquery document fragment to return for this card. */
  get document() { return this.df; }
  /** Sets the document fragment of this card.
   * @param  {object} doc - The jquery document fragment to set for this card. */
  set document(doc) { this.df = doc; }
  /** Updates the information in the panda card with the newer information.
   * @param  {object} info - The information from a panda hit to update to card.
   * @param  {object} val  - The object with the values for classes and text for this card. */
  updateAllCardInfo(info, val) {
    if (info) {
      let titleSelect = this.df.find(`${val.title.class}`);
      const titlePre = (titleSelect.attr('data-original-title')!==undefined) ? "data-original-" : "";
      const shortenThis = (info.data[val.groupId.valueName]) ? info.data[val.groupId.valueName] : info.data[val.reqId.valueName];
      let reqName = (info.data[val.friendlyReqName.valueName]!=="") ? info.data[val.friendlyReqName.valueName] : info.data[val.reqName.valueName];
      this.df.find(`${val.reqName.class}`).html(reqName);
      this.df.find(`${val.reqName.class}`).attr(`${titlePre}title`, `${reqName}<br>${info.data[val.groupId.valueName]}`).html(`${reqName}`);
      this.df.find(`${val.reqName1Line.class}`).attr(`${titlePre}title`, `${reqName}<br>${info.data[val.groupId.valueName]}`).html(`${reqName}`);
      this.df.find(`${val.groupId.class}`).html(`${shortenGroupId(shortenThis)}`);
      this.df.find(`${val.price.class}`).html(`${parseFloat(info.data[val.price.valueName]).toFixed(2)}`);
      if (info.data[val.numbers.valueName]>1) this.df.find(`${val.numbers.class}`).html(`[${info.data[val.numbers.valueName]}]`);
      let title = (info.data[val.friendlyTitle.valueName]!=="") ? info.data[val.friendlyTitle.valueName] : info.data[val.title.valueName];
      titleSelect.attr(`${titlePre}title`, `${title}`).html(`${title}`); titleSelect = null;
    }
  }
  /** Hides or shows the element with the ID value and using closest if needed.
   * @param  {number} id      - The id value to use for the element.
   * @param  {string} closest - A string representing the selector for closest method to use.
   * @param  {bool} show      - Should this element be shown or hidden?
   */
  hideShow(id, closest, show) {
    let ele = (closest!=="") ? $(`${id}_${this.myId}`).closest(closest) : $(`${id}_${this.myId}`);
    if (show) $(ele).show(); else $(ele).hide(); ele = null;
  }
  /** Update the card display by showing or hiding different elements in the card.
   * @param  {object} val - The object with the values for classes and text for this card. */
  updateCardDisplay(val) {
    const oneLine = (globalOpt.getCardDisplay()===0), min = (globalOpt.getCardDisplay()===1);
    this.hideShow(val.reqName.id, ".pcm_nameGroup", (!oneLine));
    this.hideShow(val.reqName1Line.id, ".pcm_nameGroup", (oneLine));
    this.hideShow(val.price.id, ".pcm_priceGroup", (!oneLine && !min));
    this.hideShow(val.groupId.id, "", (!oneLine));
    this.hideShow(val.title.id, "", (!oneLine && !min));
    this.hideShow("#pcm_hitStats", "", (!oneLine));
    this.hideShow("#pcm_buttonGroup", "", (!oneLine));
    const addThis = (oneLine) ? "pcm_oneLine" : "";
    const removeThis = (!oneLine) ? "pcm_oneLine" : "";
    $(`#pcm_pandaCard_${this.myId}`).addClass(addThis).removeClass(removeThis);
  }
  /** Remove this panda card from UI. */
  removeCard() { this.df = null; }
  /** Move this card to the tab with the tab unique number.
   * @param  {object} tabs      - Tab object to use when moving card.
   * @param  {number} tabUnique - Tab unique number to use for the tab when moving card. */
  moveCard(tabs, tabUnique) { this.df.detach(); tabs.appendTo(this.df, tabUnique); }
  /** Mark this search panda as searching in the search class.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaSearchingNow(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html("-Searching-");
    this.df.find(cl, cl + '1').removeClass("pcm_searchCollect pcm_searchDisable").addClass("pcm_searchOn");
  }
  /** Disable this search panda.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaSearchDisabled(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html("-Disabled-");
    this.df.find(cl, cl + '1').removeClass("pcm_searchOn pcm_buttonOn pcm_searchCollect").addClass("pcm_searchDisable pcm_buttonOff");
  }
  /** Mark this search panda as collecting as a regular panda.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaSearchCollectingNow(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html("-Collecting-");
    this.df.find(cl, cl + '1').removeClass("pcm_searchOn pcm_searchDisable").addClass("pcm_searchCollect");
  }
  pandaDisabled(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html("-Disabled-");
    this.df.find(cl, cl + '1').addClass('pcm_collectDisable');
  }
  pandaEnabled(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html("Collect");
    this.df.find(cl, cl + '1').removeClass("pcm_collectDisable");
  }
  /** Adds a string to or changes the collect help tip.
   * @param  {object} val         - The object with the values for classes and text for this card.
   * @param  {string} [change=''] - The string to add to or change the collect help tip.
   * @param  {bool} [add=false]   - Should string be added to original help tip? */
  collectTipChange(val, change='', add=false) {
    let newTitle = (change !== '') ? ((add) ? val.collectTip + change : change) : val.collectTip;
    $(`#pcm_collectButton_${this.myId}`).attr('data-original-title', newTitle).tooltip('update');
  }
}