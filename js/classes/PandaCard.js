/** A class that deals with the basic cards for panda jobs to show on tab UI.
 * @class PandaCards ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaCards {
  constructor() {
    this.cards = {};
    this.tabs = null;
    this.multiple = [];
    this.ctrlDelete = [];								// List of panda's selected for deletion by using ctrl key
    this.bgHighlighterDef = '#E6E6FA'; this.bgHighlighter = null;
    this.collectTextDef = 'Collect'; this.collectText = null;
    this.goHamTextDef = 'GoHam'; this.goHamText = null;
    this.detailsTextDef = 'Details'; this.detailsText = null;
    this.deleteTextDef = 'X'; this.deleteText = null;
    this.acceptedStatusTextDef = 'Acc'; this.acceptedStatusText = null;
    this.fetchedStatusTextDef = 'Fetched'; this.fetchedStatusText = null;
    this.values = {
      'reqName':{'valueName':'reqName', 'id':'#pcm-hitReqName', 'class':'.pcm-reqName', 'label':''},
      'reqName1Line':{'valueName':'reqName', 'id':'#pcm-hitReqName1', 'class':'.pcm-reqName1', 'label':''},
      'friendlyReqName':{'valueName':'friendlyReqName', 'id':'#pcm-hitReqName', 'class':'.pcm-reqName', 'label':''},
      'groupId':{'valueName':'groupId', 'id':'#pcm-groupId', 'class':'.pcm-groupId', 'label':''},
      'price':{'valueName':'price', 'id':'#pcm-hitPrice', 'class':'.pcm-price', 'label':''},
      'numbers':{'valueName':'hitsAvailable', 'id':'#pcm-numbers', 'class':'.pcm-numbers', 'label':''},
      'title':{'valueName':'title', 'id':'#pcm-hitTitle', 'class':'.pcm-title', 'label':''},
      'reqId':{'valueName':'reqId'},
      'friendlyTitle':{'valueName':'friendlyTitle', 'id':'#pcm-hitTitle', 'label':''},
      'collectBtn':{'class':'.pcm-collectButton'},
      'collectTip':'Start Collecting this Panda HIT',
      'details':'Display and edit all options for this Panda.',
      'delete':'Delete this Panda HIT. [CTRL] click cards to delete multiple HITs.',
      'hamTip':'Collect HITs from this Panda only! Delayed ham mode can be turned on by clicking and holding this button.'
    }
  }
  getCSSValues() {
    this.collectText = getCSSVar('collectButton', this.collectTextDef); this.goHamText = getCSSVar('hamButton', this.goHamTextDef);
    this.detailsText = getCSSVar('detailsButton', this.detailsTextDef); this.deleteText = getCSSVar('deleteButton', this.deleteTextDef);
    this.acceptedStatusText = getCSSVar('hitAccepted', this.acceptedStatusTextDef); this.fetchedStatusText = getCSSVar('hitFetched', this.fetchedStatusTextDef);
    this.bgHighlighter = (highlighterBGColor) ? highlighterBGColor : this.bgHighlighterDef;
  }
  /** Prepare cards by getting CSS variable Values and assigning the tabs object.
   * @param  {object} tabs - The tab object with tab information. */
  prepare(tabs) { this.getCSSValues(); this.tabs = tabs; }
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. */
  resetCSSValues() {
    highlighterBGColor = getCSSVar('bgHighlighter'); this.getCSSValues();
    $('.pcm-collectButton').html(this.collectText); $('.pcm-hamButton').html(this.goHamText);
    $('.pcm-detailsButton').html(this.detailsText); $('.pcm-deleteButton').html(this.deleteText);
    $('.pcm-hitAccepted').html(this.acceptedStatusText); $('.pcm-hitFetched').html(this.fetchedStatusTextDef);
  }
  /** Add card to the tab content area.
   * @param  {number} myId - Unique ID  @param  {object} info - Panda Info  @param  {bool} [fromDB] - From Database? */
  addCard(myId, info, fromDB=false) { this.cards[myId] = new PandaCard(myId, info.dbId); this.appendCard(myId, info, fromDB); this.cards[myId].updateAllCardInfo(info, this.values); }
  /** Updates the card information shown with the unique ID for job.
   * @param  {number} myId - Unique ID  @param  {object} info - Panda Info */
  updateAllCardInfo(myId, info) { this.cards[myId].updateAllCardInfo(info, this.values); }
  /** Get the card element with the unique number ID.
   * @param  {number} myId - Unique ID
   * @return {object}      - The card element for the unique number. */
  get(myId) { return this.cards[myId]; }
  /** Remove all cards from the tab UI. */
  removeAll() {
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
   * @param  {number} myId - Unique ID  @param  {object} info - Panda Info  @param  {string} [oneLine] - One Line?
   * @return {string}      - HTML of the card status area. */
  createCardStatus(myId, info, oneLine=false) {
    let element = (oneLine) ? 'span' : 'div', one = (oneLine) ? '1' : '', searchText = (oneLine) ? '' : ' search';
    let search = (info.search) ? ` (<span class='${info.search}search'>${info.search.toUpperCase()}${searchText}</span>)` : '';
    return `<${element} class='pcm-hitStats${one} text-truncate' id='pcm-hitStats${one}-${myId}'>[ <span class='pcm-hitAccepted' id='pcm-hitAccepted${one}-${myId}'></span> | <span class='pcm-hitFetched' id='pcm-hitFetched${one}-${myId}'></span> ]${search}</${element}>`;
  }
  /** Create the button group area for the panda card.
   * @param  {number} myId - Unique ID  @param  {object} info - Panda Info
   * @return {string}      - HTML of the card group area. */
  createCardButtonGroup(myId, info) {
    const textCollect = (info.search) ? '-Collecting-' : this.collectText;
    let group = `<div class='card-text pcm-buttonGroup' id='pcm-buttonGroup-${myId}'>`;
    group += `<button class='pcm-hitButton pcm-collectButton pcm-tooltipData pcm-buttonOff' id='pcm-collectButton-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-long-press-delay='600' data-original-title='${this.values.collectTip}'><span>${textCollect}</span></button>`;
    if (!info.search) group += `<button class='pcm-hitButton pcm-hamButton pcm-tooltipData pcm-tooltipHelper pcm-buttonOff' id='pcm-hamButton-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-long-press-delay='600' data-original-title='${this.values.hamTip}'><span>${this.goHamText}</span></button>`;
    group += `<button class='pcm-hitButton pcm-detailsButton pcm-tooltipData pcm-tooltipHelper pcm-buttonOff' id='pcm-detailsButton-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-original-title='${this.values.details}'><span>${this.detailsText}</span></button>`;
    group += `<button class='pcm-hitButton pcm-deleteButton pcm-tooltipData pcm-tooltipHelper pcm-buttonOff' id='pcm-deleteButton-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-original-title='${this.values.delete}'><span>${this.deleteText}</span></button>`;
    group += `</div>`;
    return group;
  }
  /** Used to display a card with only one line for display purposes.
   * @param  {number} myId - Unique ID @param  {object} info - Panda Info
   * @return {string}      - HTML of the card one line area. */
  oneLineCard(myId, info) {
    const nameGroup = $(`<div class='pcm-nameGroup1 row w-90'></div>`).css('cursor', 'default').hide().append(`<span class='pcm-reqName1 col text-truncate pcm-tooltipData' id='pcm-hitReqName1-${myId}' data-toggle='tooltip' data-html='true'></span>`);
    $(this.createCardStatus(myId, info, true)).hide().appendTo(nameGroup);
    let buttonGroup = $(`<span class='d-flex pcm-buttonGroup1' id='pcm-buttonGroup1-${myId}'></span>`).appendTo(nameGroup);
    buttonGroup.append(`<button class='pcm-hitButton pcm-collectButton1 pcm-buttonOff pcm-tooltipData' type='button' id='pcm-collectButton1-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-long-press-delay='600' data-original-title='${this.values.collectTip}'><span>C</span></button>`);
    buttonGroup.append(`<button class='pcm-hitButton pcm-hamButton1 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' type='button' id='pcm-hamButton1-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-long-press-delay='600' data-original-title='${this.values.hamTip}'><span>H</span></button>`);
    buttonGroup.append(`<button class='pcm-hitButton pcm-detailsButton1 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' type='button' id='pcm-detailsButton1-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-long-press-delay='600' data-original-title='${this.values.details}'><span>D</span></button>`);
    buttonGroup.append(`<button class='pcm-hitButton pcm-deleteButton1 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' type='button' id='pcm-deleteButton1-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-long-press-delay='600' data-original-title='${this.values.delete}'><span>X</span></button>`);
    buttonGroup = null;
    return nameGroup;
  }
  /** Create the card and add it to the multiple array for appending later.
   * @param  {number} myId - Unique ID  @param  {object} info - Panda Info */
  createCard(myId, info) {
    const searchCard = (info.data.search) ? ' pcm-jobSearch' : '', mutedCard = (info.data.mute) ? ' pcm-cardMuted' : '';
    let card = $(`<div class='pcm-pandaCard card${searchCard}${mutedCard}' id='pcm-pandaCard-${myId}'></div>`).data('myId',myId);
    let cardBody = $(`<div class='card-body'></div>`).appendTo(card), cardText = $(`<div class='card-text' id='pcm-cardText-${myId}'>`).appendTo(cardBody);
    $(`<div class='pcm-nameGroup row w-100'></div>`).append($(`<span class='pcm-reqName pcm-tooltipData col text-truncate' id='pcm-hitReqName-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' title=''></span>`).css('cursor', 'default')).append($(`<span class='pcm-groupId pcm-tooltipData pcm-tooltipHelper col col-auto' id='pcm-groupId-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' data-original-title='Click to copy preview page URL or double click to open preview page.'></span>`).css('cursor', 'pointer').data('myId',myId).data('double',0)).appendTo(cardText);
    this.oneLineCard(myId, info).appendTo(cardText);
    $(`<div class='pcm-priceGroup'></div>`).append($(`<span class='pcm-price text-truncate' id='pcm-hitPrice-${myId}'></span>`).css('cursor', 'default')).append($(`<span class='pcm-numbers text-truncate' id='pcm-numbers-${myId}'></span>`)).appendTo(cardText);
    $(`<div class='pcm-title pcm-tooltipData text-truncate' id='pcm-hitTitle-${myId}' data-toggle='tooltip' data-html='true' data-placement='bottom' title=''></div>`).css('cursor', 'default').appendTo(cardText);
    $(this.createCardStatus(myId, info)).appendTo(cardText); $(this.createCardButtonGroup(myId, info)).appendTo(cardText);
    this.cards[myId].document = card; this.multiple.push(myId);
    card = null; cardBody = null; cardText = null;
  }
  /** Append this card to the panda tab.
   * @param  {number} myId - Unique ID  @param  {object} info - Panda Info  @param  {bool} [fromDB] - From Database? */
  appendCard(myId, info, fromDB=false) {
    let thisTabUnique = (info.data.tabUnique !== null) ? info.data.tabUnique : this.tabs.currentTab; this.df = $('');
    if (!this.tabs.getUniques().includes(thisTabUnique)) thisTabUnique = this.tabs.currentTab;
    if (info.data.tabUnique != thisTabUnique) { info.data.tabUnique = thisTabUnique; bgPanda.updateDbData(myId); }
    if (!fromDB) this.tabs.setPosition(thisTabUnique, info.dbId, !fromDB);
    this.createCard(myId, info); this.cards[myId].updateCardDisplay(this.values);
  }
  /** Remove this panda card from UI.
   * @param  {number} myId - Unique ID  @param  {function} removeFunc - Removal Function  @param  {bool} [animate] - Show Animation? */
  removeCard(myId, removeFunc, animate=true) {
    $(`#pcm-pandaCard-${myId}`).stop(true, true);
    let doRemoval = (removeFunc) => { $(`#pcm-pandaCard-${myId}`).remove(); this.cards[myId].removeCard(); delete this.cards[myId]; removeFunc(); }
    if (animate) $(`#pcm-pandaCard-${myId}`).effect('slide', { direction:'left', mode:'hide' }, 250, async () => { doRemoval(removeFunc); });
    else { doRemoval(removeFunc); }
  }
	/** Show that this ham button with this unique ID is in auto go ham mode.
	 * @param  {number} myId - The unique ID for a panda job. */
	startAutoGoHam(myId) { $(`#pcm-hamButton-${myId}, #pcm-hamButton1-${myId}`).addClass('pcm-delayedHam'); }
	/** Disable all other ham buttons which don't use the unique ID for the panda job.
	 * @param  {number} [myId] - The unique ID for a panda job. */
	disableOtherHamButtons(myId=null) {
		if (myId !== null) $(`#pcm-hamButton-${myId}, #pcm-hamButton1-${myId}`).removeClass('pcm-buttonOff').addClass('pcm-buttonOn');
		$('.pcm-hamButton.pcm-buttonOff, .pcm-hamButton1.pcm-buttonOff').addClass('pcm-disabled');
	}
	/** Turn on the ham button for this panda job with the unique ID.
	 * @param  {number} myId - The unique ID for a panda job. */
	hamButtonOn(myId) {
		$(`#pcm-hamButton-${myId}, #pcm-hamButton1-${myId}`).removeClass('pcm-buttonOff').addClass('pcm-buttonOn');
		this.disableOtherHamButtons(myId);
	}
	/** Turn off all the ham buttons on the page. */
	hamButtonsOff() { this.enableAllHamButtons(); }
	/** Enable all the ham buttons on the page. */
	enableAllHamButtons() { $('.pcm-hamButton, .pcm-hamButton1').removeClass('pcm-disabled pcm-buttonOn').addClass('pcm-buttonOff'); }
  /** Make the color of the panda card with this unique ID to the previous color in the card data.
   * @param  {number} myId - The unique ID for a panda job.
   * @return {string}      - Returns the previous color. */
  cardPreviousColor(myId) { return $(`#pcm-pandaCard-${myId}`).data('previousColor'); }
  /** Highlight the panda card's gid number with this unique ID.
   * @param  {number} myId - The unique ID for a panda job. */
  highlightEffect_gid(myId) {
    if (globalOpt.doGeneral().fetchHighlight) $(`#pcm-groupId-${myId}, #pcm-buttonGroup1-${myId}`).stop(true, true).effect('highlight', {color:this.bgHighlighter}, 300);
  }
  /** Highlight the panda card according to the action and duration.
   * @param  {number} myId - Unique ID @param  {string} [action] - Effect Action @param  {number} [duration] - Effect Duration */
  highlightEffect_card(myId, action='', duration=15000) {
    let theColor = (action==='stop') ? '#FFA691' : '#ffff99';
    $(`#pcm-pandaCard-${myId}`).stop(true,true).effect('highlight', {color:theColor}, duration);
  }
  /** Show that this panda is not collecting anymore and show effect or a new background color.
   * @param  {number} myId - Unique ID  @param  {bool} [stopEffect] - Stop Effects?  @param  {string} [whyStop] - Stop Reason  @param  {string} [newBgColor] - Background color */
  stopItNow(myId, stopEffect=false, whyStop=null, newBgColor='') {
    if (stopEffect) this.stopEffect_card(myId); 
    if (newBgColor !== '') {
      $(`#pcm-pandaCard-${myId}`).data('previousColor1', $(`#pcm-pandaCard-${myId}`).data('stopped',whyStop).css('background-color')).css('background-color', newBgColor);
    }
    if (stopEffect) this.highlightEffect_card(myId, 'stop', 7500);
		pandaUI.stopCollecting(myId, whyStop);
  }
  /** Either change background color to provided color and save the previous color or change the
	 * background color to the previous color saved in data and remove the previous color data.
   * @param  {number} myId - Unique ID  @param  {bool} addPrev - Add Previous Color  @param  {string} [bgColor] - New Background Color */
  cardEffectPreviousColor(myId, addPrev, bgColor='') {
    this.stopEffect_card(myId);
    if (addPrev) $(`#pcm-pandaCard-${myId}`).data('previousColor', $(`#pcm-pandaCard-${myId}`).css('background-color')).css('background-color', bgColor);
    else {
      const prevColor = $(`#pcm-pandaCard-${myId}`).data('previousColor');
      $(`#pcm-pandaCard-${myId}`).removeData('previousColor').animate({'backgroundColor':prevColor},{'duration':1000});
    }
  }
  /** Stop any effect for the card with the unique ID.
   * @param  {number} myId - The unique ID for a panda job. */
  stopEffect_card(myId) { $(`#pcm-pandaCard-${myId}`).stop(true,true); }
  /** Changes the help tip of the collect button to the value or adds value to current tip.
   * @param  {number} myId - Unique ID  @param  {string} [change] - Tip String  @param  {bool} [add] - Add or Replace? */
  collectTipChange(myId, change='', add=false) { if (this.cards[myId]) this.cards[myId].collectTipChange(this.values, change, add); }
  /** Show that the card is searching for HITs.
   * @param  {number} myId - The unique ID for a panda job. */
  pandaSearchingNow(myId) { if (this.cards[myId]) this.cards[myId].pandaSearchingNow(this.values); }
  /** Show that the card is disabled now.
   * @param  {number} myId - The unique ID for a panda job. */
  pandaSearchDisabled(myId) { if (this.cards[myId]) this.cards[myId].pandaSearchDisabled(this.values); }
  /** Show that the card is collecting now.
   * @param  {number} myId - The unique ID for a panda job. */
  pandaSearchCollectingNow(myId) { if (this.cards[myId]) this.cards[myId].pandaSearchCollectingNow(this.values); }
  /** Show that the card is collecting now.
   * @async                - To wait for the data to be loaded from database.
   * @param  {number} myId - The unique ID for a panda job. */
  async pandaEnabled(myId) {
    this.cards[myId].pandaEnabled(this.values); let info = bgPanda.options(myId), data = await bgPanda.dataObj(myId);
    info.disabled = false; data.disabled = false; bgPanda.updateDbData(null, data);
  }
  /** Mutes this panda with the unique number.
   * @param {number} myId - Unique Number  @param {bool} value - Mute Status */
  pandaMute(myId, value) { this.cards[myId].pandaMute(value); }
  /** Show that the card is disabled now.
   * @async                - To wait for the data to be loaded from database.
   * @param  {number} myId - The unique ID for a panda job. */
  async pandaDisabled(myId) {
    this.cards[myId].pandaDisabled(this.values); let info = bgPanda.options(myId), data = await bgPanda.dataObj(myId);
    info.disabled = true; data.disabled = true; bgPanda.updateDbData(null, data);
  }
	/** Binds events to all cards on page. Will unbind any events too so won't do double events. */
	cardButtons() {
		$(`.pcm-pandaCard`).unbind('click').click( e => {
			let card = $(e.target).closest('.card'), theButton = card.find('.pcm-deleteButton'), myId = card.data('myId');
			if (e.ctrlKey) {
				if (this.ctrlDelete.includes(myId)) { theButton.removeClass('pcm-btn-selected'); this.ctrlDelete = arrayRemove(this.ctrlDelete,myId); }
				else { theButton.addClass('pcm-btn-selected'); this.ctrlDelete.push(myId); }
			} else if (e.altKey) { this.ctrlDelete.length = 0; $('.pcm-deleteButton').removeClass('pcm-btn-selected'); }
			theButton = null; card = null;
    }).unbind('contextmenu').contextmenu( async e => {      
      let card = $(e.target).closest('.card'), myId = card.data('myId'), data = await bgPanda.dataObj(myId); e.preventDefault();
      data.mute = !data.mute; bgPanda.updateDbData(myId, data); this.pandaMute(myId, data.mute); card = null; return false;
    }).mousedown( e => { $(`.pcm-tooltipData`).tooltip('dispose'); $(e.target).closest('.pcm-pandaCard').find('.pcm-tooltipData').addClass('pcm-tooltipDisable');
    }).mouseup( e => { $(e.target).closest('.pcm-pandaCard').find('.pcm-tooltipData').removeClass('pcm-tooltipDisable'); });
		$(`.pcm-collectButton, .pcm-collectButton1`).unbind('click').click( async e => {
      let theButton = $(e.target).closest('.pcm-hitButton'), card = $(e.target).closest('.card');
      if (theButton.data('longClicked')) theButton.removeData('longClicked');
      else {
        let myId = card.data('myId'), stopped = card.data('stopped'), info = bgPanda.options(myId);
        if (stopped === 'noQual' || stopped === 'blocked') { if (pandaUI.pandaStats[myId].collecting) await pandaUI.stopCollecting(myId, 'manual'); }
        else if (info.disabled) await this.pandaEnabled(myId);
        else if (theButton.is('.pcm-buttonOff:not(.pcm-btnSearching), .pcm-searchDisable')) {
          info.autoAdded = false; await this.pandaEnabled(myId);
          if (info.search !== 'rid') await pandaUI.startCollecting(myId, false, (info.search === 'gid') ? 10000 : 0);
          else if (info.search === 'rid') {
            $(`#pcm-collectButton-${myId}`).removeClass('pcm-buttonOff pcm-searchDisable').addClass('pcm-buttonOn');
            $(`#pcm-collectButton1-${myId}`).removeClass('pcm-buttonOff pcm-searchDisable').addClass('pcm-buttonOn');
            pandaUI.pandaGStats.addCollecting(); pandaUI.pandaGStats.collectingOn();
            bgPanda.doSearching(myId, null, 10000);
          }
        } else if (info.search === 'rid') bgPanda.disableSearching(myId);
        else pandaUI.stopCollecting(myId, 'manual');
      }
      e.preventDefault(); e.stopPropagation(); theButton = null, card = null;
		}).unbind('long-press').on('long-press', async e => {
      let theButton = $(e.target).closest('.pcm-hitButton'), card = $(e.target).closest('.card');
      if (!card.is('.jobSearch')) {
        let myId = card.data('myId'); theButton.data('longClicked', true);
        if (theButton.is('.pcm-collectDisable')) { this.pandaEnabled(myId); }
        else { if (pandaUI.pandaStats[myId].collecting) await pandaUI.stopCollecting(myId, 'manual'); this.pandaDisabled(myId); }
        e.preventDefault(); e.stopPropagation();
      }
      theButton = null; card = null;
    });
		$(`.pcm-hamButton, .pcm-hamButton1`).unbind('click').click( async e => {
			let theButton = $(e.target).closest('.pcm-hitButton'), myId = $(e.target).closest('.card').data('myId');
			if (theButton.data('longClicked')) theButton.removeData('longClicked');
			else { pandaUI.hamButtonClicked(myId, theButton,_, true); }
			e.preventDefault(); e.stopPropagation(); theButton = null; return false;
		}).unbind('long-press').on('long-press', async e => {
			let theButton = $(e.target).closest('.pcm-hitButton'), myId = $(e.target).closest('.card').data('myId');
			let info = bgPanda.options(myId), data = await bgPanda.dataObj(myId); theButton.data('longClicked', true);
			if (theButton.hasClass('pcm-delayedHam')) { theButton.removeClass('pcm-delayedHam').addClass('pcm-noDelay'); info.autoTGoHam = (data.autoGoHam) ? 'disable' : 'off'; }
			else { info.autoTGoHam = 'on'; theButton.removeClass('pcm-noDelay').addClass('pcm-delayedHam'); }
			e.preventDefault(); e.stopPropagation(); theButton = null; return false;
		});
		$(`.pcm-deleteButton, .pcm-deleteButton1`).unbind('click').click( e => {
      let card = $(e.target).closest('.card'), theButton = card.find('.pcm-deleteButton'), myId = card.data('myId');
      if (this.ctrlDelete.length > 0) theButton.addClass('pcm-btn-selected');
      if (!this.ctrlDelete.includes(myId)) this.ctrlDelete.push(myId);
			pandaUI.removeJobs(this.ctrlDelete, (response) => {
        if ((response === 'NO' && this.ctrlDelete.length === 1) || response === 'CANCEL' ) { this.ctrlDelete = []; $('.pcm-deleteButton').removeClass('pcm-btn-selected'); }
        else if (response === 'YES') this.ctrlDelete = [];
      }, 'manual', () => {}, 'Unselect All');
      e.preventDefault(); e.stopPropagation(); theButton = null; card = null;
		});
		$(`.pcm-detailsButton , .pcm-detailsButton1`).unbind('click').click( async e => {
			let myId = $(e.target).closest('.card').data('myId'); e.preventDefault(); e.stopPropagation();
      pandaUI.modalJob = new ModalJobClass(); pandaUI.modalJob.showDetailsModal(myId,_, () => { pandaUI.modalJob = null; modal = null; });
		});
		$(`.pcm-groupId`).unbind('click').click( e => {
			const double = parseInt( $(e.target).data('double'), 10 );
			if (double === 2) $(e.target).data('double', 0);
			setTimeout( () => {
				const double = parseInt( $(e.target).data('double'), 10 );
				if (double !== 2) {
					let myId = $(e.target).data('myId'), info = bgPanda.options(myId);
					navigator.clipboard.writeText((info.search === 'rid') ? bgPanda.pandaUrls[myId].reqUrl : bgPanda.pandaUrls[myId].accept);
				}
			}, 250);
		});
    $(`.pcm-groupId`).unbind('dblclick').on('dblclick', e => {
      $(e.target).data('double', 2);
      let myId = $(e.target).data('myId'), info = bgPanda.options(myId), theHeight = window.outerHeight-80, theWidth = window.outerWidth-10;
      let theUrl = (info.search === 'rid') ? bgPanda.pandaUrls[myId].reqUrl : bgPanda.pandaUrls[myId].accept;
      window.open(theUrl,'_blank','width=' + theWidth + ',height=' +  theHeight + ',scrollbars=yes,toolbar=yes,menubar=yes,location=yes');
    });
		$(`.pcm-nameGroup1`).unbind('click').click( e => {
      let myId = $(e.target).closest('.card').data('myId'), reqName = $(`#pcm-hitReqName1-${myId}`), stats = $(`#pcm-hitStats1-${myId}`);
      if (reqName.is(':visible')) { reqName.hide(); stats.show(); } else { stats.hide(); reqName.show(); }
    });
	}
}
/** This class deals with showing panda information on a card and sorts them in the panda area.
 * @class MenuClass ##
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
   * @param  {object} info - Information  @param  {object} val - Values object */
  updateAllCardInfo(info, val) {
    if (info) {
      let titleSelect = this.df.find(`${val.title.class}`);
      const titlePre = (titleSelect.attr('data-original-title')!==undefined) ? 'data-original-' : '';
      let shortenThis = (info.data[val.groupId.valueName] && info.search !== 'rid') ? info.data[val.groupId.valueName] : info.data[val.reqId.valueName];
      let reqName = (info.data[val.friendlyReqName.valueName] !== '') ? info.data[val.friendlyReqName.valueName] : info.data[val.reqName.valueName];
      this.df.find(`${val.reqName.class}`).html(reqName);
      this.df.find(`${val.reqName.class}`).attr(`${titlePre}title`, `${reqName}<br>${info.data[val.groupId.valueName]}`).html(`${reqName}`);
      this.df.find(`${val.reqName1Line.class}`).attr(`${titlePre}title`, `${reqName}<br>${info.data[val.groupId.valueName]}`).html(`${reqName}`);
      this.df.find(`${val.groupId.class}`).html(`${shortenGroupId(shortenThis)}`);
      this.df.find(`${val.price.class}`).html(`${parseFloat(info.data[val.price.valueName]).toFixed(2)}`);
      if (info.data[val.numbers.valueName]>1) this.df.find(`${val.numbers.class}`).html(`[${info.data[val.numbers.valueName]}]`);
      let title = (info.data[val.friendlyTitle.valueName]!=='') ? info.data[val.friendlyTitle.valueName] : info.data[val.title.valueName];
      titleSelect.attr(`${titlePre}title`, `${title}`).html(`${title}`); titleSelect = null;
    }
  }
  /** Hides or shows the element with the ID value and using closest if needed.
   * @param  {number} id - ID Name  @param  {string} closest - Closest Selector  @param  {bool} show - Shown or hidden? */
  hideShow(id, closest, show) {
    let ele = (closest !== '') ? this.df.find(`${id}-${this.myId}`).closest(closest) : this.df.find(`${id}-${this.myId}`);
    if (show) $(ele).show(); else $(ele).hide(); ele = null;
  }
  /** Update the card display by showing or hiding different elements in the card.
   * @param  {object} val - The object with the values for classes and text for this card. */
  updateCardDisplay(val) {
    const oneLine = (globalOpt.getCardDisplay() === 0), min = (globalOpt.getCardDisplay() === 1);
    this.hideShow(val.reqName.id, '.pcm-nameGroup', (!oneLine)); this.hideShow(val.reqName1Line.id, '.pcm-nameGroup1', (oneLine));
    this.hideShow(val.price.id, '.pcm-priceGroup', (!oneLine && !min)); this.hideShow(val.groupId.id, '', (!oneLine));
    this.hideShow(val.title.id, '', (!oneLine && !min)); this.hideShow('#pcm-hitStats', '', (!oneLine)); this.hideShow('#pcm-buttonGroup', '', (!oneLine));
    const addThis = (oneLine) ? 'pcm-oneLine' : '';
    const removeThis = (!oneLine) ? 'pcm-oneLine' : '';
    this.df.addClass(addThis).removeClass(removeThis);
  }
  /** Remove this panda card from UI. */
  removeCard() { this.df = null; }
  /** Move this card to the tab with the tab unique number.
   * @param  {object} tabs - Tab Object  @param  {number} tabUnique - Tab Unique Number */
  moveCard(tabs, tabUnique) { this.df.detach(); tabs.appendTo(this.df, tabUnique); }
  /** Mark this search panda as searching in the search class.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaSearchingNow(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html('-Searching-');
    this.df.removeClass('cardDisabled pcm-cardCollecting ').addClass('pcm-cardSearching');
    this.df.find(cl, cl + '1').removeClass('pcm-btnCollecting pcm-searchDisable').addClass('pcm-btnSearching');
  }
  /** Disable this search panda.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaSearchDisabled(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html('-Disabled-');
    this.df.removeClass('pcm-cardCollecting pcm-cardSearching').addClass('pcm-cardDisabled');
    this.df.find(cl, cl + '1').removeClass('pcm-btnSearching pcm-buttonOn pcm-btnCollecting').addClass('pcm-searchDisable pcm-buttonOff');
  }
  /** Mark this search panda as collecting as a regular panda.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaSearchCollectingNow(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html('-Collecting-');
    this.df.removeClass('pcm-cardDisabled pcm-cardSearching').addClass('pcm-cardCollecting');
    this.df.find(cl, cl + '1').removeClass('pcm-btnSearching pcm-searchDisable').addClass('pcm-btnCollecting');
  }
  /** Mark this panda as disabled.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaDisabled(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html('-Disabled-');
    this.df.addClass('pcm-cardDisabled');
    this.df.find(cl, cl + '1').addClass('pcm-collectDisable');
  }
  /** Mark this panda as enabled.
   * @param  {object} val - The object with the values for classes and text for this card. */
  pandaEnabled(val) {
    let cl = val.collectBtn.class; this.df.find(cl).html('Collect');
    this.df.removeClass('pcm-cardDisabled');
    this.df.find(cl, cl + '1').removeClass('pcm-collectDisable');
  }
  /** Shows that this panda job is muted.
   * @param {bool} value - Mute Status */
  pandaMute(value) { if (value) this.df.addClass('pcm-cardMuted'); else this.df.removeClass('pcm-cardMuted'); }
  /** Adds a string to or changes the collect help tip.
   * @param  {object} val - Values Object  @param  {string} [change] - New Tip Text  @param  {bool} [add] - Added or Replaced? */
  collectTipChange(val, change='', add=false) {
    let newTitle = (change !== '') ? ((add) ? val.collectTip + change : change) : val.collectTip, cl = val.collectBtn.class;
    this.df.find(cl, cl + '1').attr('data-original-title', newTitle).tooltip('update');
  }
}