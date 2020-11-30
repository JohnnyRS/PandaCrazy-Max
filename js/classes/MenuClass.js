/** This class deals with the different menus and which methods to call.
 * @class MenuClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class MenuClass {
  /**
   * @param  {string} quickMenuId    The id name of the quick menu on the UI to use to append.
   */
  constructor() {
    this.topMenuRow1 = 'pcm-menuRow1';       // The top menu id name to add menu's to.
    this.topMenuRow2 = 'pcm-menuRow2';       // The top menu id name to add menu's to.
    this.quickMenu = 'pcm-quickMenu';           // The id name of the quick menu element to add menu's to.
    this.modalAlarms = null;
    this.modalOptions = null;
		this.modalSearch = null;
  }
  /** Prepares the page with all the menus on the page shown. */
  preparePanda() { this.createPandaTopMenu(); this.createPandaStats(); this.createPandaQuickMenu(); this.showQuickMenu(); }
  /** This will add a separator span with a character to the provided element.
   * @param  {object} appendHere - The element to add the separator to.
   * @param  {string} text       - The character used for the separator. */
  addSeparator(appendHere, text) { $(`<span class='pcm-separator'>${text}</span>`).appendTo(appendHere); }
  /** Change the panda timer and turn all other timer buttons off. */
  changeTheTimer(e, timer) {
    $('.pcm-timerButton').removeClass('pcm-buttonOn');
    if (e) $(e.target).addClass('pcm-buttonOn');
    this.timerChange(timer);
  }
  timerChange(timer=null, addThis=0, delThis=0) { let newTimer = bgPanda.timerChange(timer, addThis, delThis); pandaUI.pandaGStats.setPandaTimer(newTimer); }
  /** Change the numbers on the timer buttons according to the global options being changed.
   * @param  {number} increase - New number to change on the increase timer button.
   * @param  {number} decrease - New number to change on the decrease timer button.
   * @param  {number} addMore  - New number to change on the add more to timer button. */
  updateTimerMenu(increase, decrease, addMore) {
    $('.pcm-timerIncrease').html(`Increase timer by ${increase}ms`).attr('data-original-title', `Increase the current timer by ${increase}ms`);
    $('.pcm-timerDecrease').html(`Decrease timer by ${decrease}ms`).attr('data-original-title', `Decrease the current timer by ${decrease}ms`);
    $('.pcm-timerAddMore').html(`Add ${addMore}ms to timer`).attr('data-original-title', `Add ${addMore}ms to the current timer`);
  }
  /** This method will add a menu with a label and the function to use when button clicked.
   * @param  {object} appendHere - Append to element @param  {string} label       - Menu label @param  {function} btnFunc  - Button Function
   * @param  {string} [tooltip]  - Tooltip String     @param  {string} [className] - Class name */
  addMenu(appendHere, label, btnFunc, tooltip='', className='', idName='') {
    const addtip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' title='${tooltip}'` : ``;
    let idAdd = (idName !== '') ? `id='${idName}' ` : '', classAdd = (tooltip !== '') ? 'pcm-tooltipData ' : '';
    let theButton = $(`<button type='button' ${idAdd}class='${classAdd} ${className}'${addtip}></button>`).click( e => btnFunc.apply(this, [e]) ).appendTo(appendHere);
    let cssVar = getCSSVar(idName.replace('pcm-', ''), label); theButton.html(cssVar);
  }
  /** Adds a sub menu to a menu with dropdownstyle allowing for 3 submenus under the main menu.
   * @param  {object} appendHere    - Append submenu to an added menu element.
   * @param  {string} dropdownStyle - The css style of the dropdown when submenu arrow clicked.
   * @param  {array} dropdownInfo   - The dropdown information for the rest of the submenus. */
  addSubMenu(appendHere, label, theClass, btnGroupID, dropdownInfo, tooltip='', buttonId='', dropdownClass='', noClick=false, onClosed=null) {
    const addtip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' title='${tooltip}'` : ``;
    let btnGroup = $(`<div class='btn-group' id=${btnGroupID}></div>`).appendTo(appendHere), idAdd = (buttonId !== '') ? `id='${buttonId}' ` : '';
    let classAdd = (tooltip !== '') ? 'pcm-tooltipData' : '';
    let theButton = $(`<button type='button' ${idAdd}class='${theClass} ${classAdd} dropdown-toggle dropdown-toggle-split' data-toggle='dropdown'${addtip} aria-haspopup='true' aria-expanded='false'></button>`)
      .append($(`<span class='sr-only'>Toggle Dropdown</span>`)).appendTo(btnGroup);
    let cssVar = getCSSVar(buttonId.replace('pcm-', ''), label); theButton.html(cssVar);
    let dropdownMenu = $(`<div class='dropdown-menu pcm-dropdownMenu ${dropdownClass}'></div>`).appendTo(btnGroup);
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
      else if (info.type === 'slider') $(`<div id='${info.id}' class='pcm-myCenter'></div>`).slider({orientation:'vertical', range:'min', min:info.min, max:info.max, value:info.value, step:info.step, create: (e, ui) => { info.createFunc.apply(this, [e, ui]); }, slide: (e, ui) => { info.slideFunc.apply(this, [e, ui]); }}).appendTo(dropdownMenu);
      else if (info.type === 'divider') $(`<div class='dropdown-divider'></div>`).appendTo(dropdownMenu);
    });
    btnGroup = null; dropdownMenu = null;
  }
  /** Create the top menu using addMenu and addSubMenu Methods. */
  createPandaTopMenu() {
    let topMenu = $(`<div class='btn-group pcm-btnGroup' role='group'></div>`).appendTo($(`.${this.topMenuRow1}:first`));
    let vol = globalOpt.theVolume();
    this.addSubMenu(topMenu, 'Vol: ', 'pcm-btn-dropDown', '', [
      {'type':'rangeMax', 'label':'100'},
      {'type':'slider', id:'pcm-volumeVertical', 'min':0, 'max':100, 'value':vol, 'step':5, 'slideFunc': (e, ui) => { $(ui.handle).text(ui.value); alarms.setVolume(ui.value) }, 'createFunc': (e, ui) => { $(e.target).find('.ui-slider-handle').text(vol).css({'left': '-0.6em', 'width': '25px', 'fontSize':'12px', 'lineHeight':'1', 'height':'18px', 'paddingTop':'2px'}); }},
      {'type':'rangeMin', 'label':'0'}
    ], 'Change the global volume level for alarms.', 'pcm-volumeDropDownBtn', 'pcm-dropdownVolume', true, () => {});
    this.addMenu(topMenu, 'Jobs', () => { pandaUI.showJobsModal(); }, 'List all Panda Jobs Added', 'pcm-btn-menu', 'pcm-bListJobs');
    this.addSubMenu(topMenu, '', 'pcm-btn-dropDown', '', [
      {'type':'item', 'label':'Add', 'menuFunc': () => { pandaUI.showJobAddModal(); }, 'tooltip':'Add a new Panda or Search Job'},
      {'type':'item', 'label':'Stop All', 'menuFunc': () => { bgPanda.stopAll(); }, 'tooltip':'Stop All Collecting Panda or Search Jobs'},
      {'type':'item', 'label':'Search Jobs', 'menuFunc': () => { pandaUI.showJobsModal(); }, 'tooltip':'Search the Panda Jobs Added'},
      // {'type':'item', 'label':'Search Mturk'},
      {'type':'divider'},
      {'type':'item', 'label':'Export', 'menuFunc': () => { new EximClass().exportModal(); }},
      {'type':'item', 'label':'Import', 'menuFunc': () => { new EximClass().importModal(); }}
    ]);
    this.addMenu(topMenu, 'Display', () => { pandaUI.cards.changeDisplay(2) }, 'Change how information is displayed on the jobs to Normal.', 'pcm-btn-menu', 'pcm-bCardsDisplay');
    this.addSubMenu(topMenu, ' ', 'pcm-btn-dropDown', '', [
      {'type':'item', 'label':'Normal', 'menuFunc': () => { pandaUI.cards.changeDisplay(2) }, 'tooltip':'Change how information is displayed on the jobs to Normal.'},
      {'type':'item', 'label':'Minimal Info', 'menuFunc': () => { pandaUI.cards.changeDisplay(1) }, 'tooltip':'Change how information is displayed on the jobs to minimal 3 lines.'},
      {'type':'item', 'label':'One Line Info', 'menuFunc': () => { pandaUI.cards.changeDisplay(0) }, 'tooltip':'Change how information is displayed on the jobs to only one line.'}
    ]);
    this.addMenu(topMenu, 'Groupings', () => { groupings.showGroupingsModal(); }, 'Start, stop or edit groupings you have added', 'pcm-btn-menu', 'pcm-bPandaGroupings');
    this.addSubMenu(topMenu, ' ', 'pcm-btn-dropDown', '', [
      {'type':'item', 'label':'Start/Stop', 'menuFunc': () => { groupings.showGroupingsModal(); }, 'tooltip':'Start, stop or edit groupings you have added'},
      {'type':'item', 'label':'Create by Selection', 'menuFunc': () => { groupings.createInstant(true); }, 'tooltip':'Create a grouping by selecting the jobs you want to start at same time.'},
      {'type':'item', 'label':'Create Instantly', 'menuFunc': () => { groupings.createInstant(); }, 'tooltip':'Create a grouping with any jobs running now with default name and description'},
      {'type':'item', 'label':'Edit', 'menuFunc': () => { groupings.showGroupingsModal(); }, 'tooltip':'Start, stop or edit groupings you have added'}
    ]);
    this.addMenu(topMenu, '1', e => { this.changeTheTimer(e, globalOpt.useTimer1()); }, 'Change timer to the Main Timer', 'pcm-btn-menu pcm-timerButton pcm-buttonOn mainTimer');
    this.addMenu(topMenu, '2', e => { this.changeTheTimer(e, globalOpt.useTimer2()); }, 'Change timer to the Second Timer', 'pcm-btn-menu pcm-timerButton secondTimer');
    this.addMenu(topMenu, '3', e => { this.changeTheTimer(e, globalOpt.useTimer3()); }, 'Change timer to the Third Timer', 'pcm-btn-menu pcm-timerButton thirdTimer');
    this.addSubMenu(topMenu, '', 'pcm-btn-dropDown', '', [
      {'type':'item', 'label':'Edit Timers', 'menuFunc': () => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showTimerOptions(); }, 'tooltip':'Change options for the timers'},
      {'type':'item', 'menuFunc': () => { this.timerChange(null, globalOpt.getTimerIncrease()); }, 'label':`Increase timer by ${globalOpt.getTimerIncrease()}ms`, class:'pcm-timerIncrease', 'tooltip':`Increase the current timer by ${globalOpt.getTimerIncrease()}ms`},
      {'type':'item', 'menuFunc': () => { this.timerChange(null, 0, globalOpt.getTimerDecrease()); }, 'label':`Decrease timer by ${globalOpt.getTimerDecrease()}ms`, class:'pcm-timerDecrease', 'tooltip':`Decrease the current timer by ${globalOpt.getTimerDecrease()}ms`},
      {'type':'item', 'menuFunc': () => { this.timerChange(null, globalOpt.getTimerAddMore()); }, 'label':`Add ${globalOpt.getTimerAddMore()}ms to timer`, class:'pcm-timerAddMore', 'tooltip':`Add ${globalOpt.getTimerAddMore()}ms to the current timer`},
      {'type':'item', 'menuFunc': () => { let currentTimer = globalOpt.timerUsed; $(`.pcm-timerButton.${currentTimer}:first`).click(); }, 'label':'Reset Timer', 'tooltip':'Reset the current timer to the original time.'}
    ]);
    this.addMenu(topMenu, 'Options', () => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showGeneralOptions( () => this.modalOptions = null ); }, 'Change Global, Alarms or timer Options', 'pcm-btn-menu', 'pcm-bPandaOptions');
    this.addSubMenu(topMenu, ' ', 'pcm-btn-dropDown', '', [
      {'type':'item', 'label':'General', 'menuFunc':() => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showGeneralOptions( () => this.modalOptions = null ); }, 'tooltip':'Change the general options'},
      {'type':'item', 'label':'Edit Timers', 'menuFunc':function() { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showTimerOptions( () => this.modalOptions = null ); }, 'tooltip':'Change options for the timers'},
      {'type':'item', 'label':'Edit Alarms', 'menuFunc':() => { if (!this.modalAlarms) this.modalAlarms = new ModalAlarmClass(); this.modalAlarms.showAlarmsModal( () => this.modalAlarms = null ); }, 'tooltip':'Change the options and sounds for the alarms'}
    ]);
    topMenu = null;
  }
  createPandaStats() {
    let pandaStats = $(`<small class='pcm-pandaStats'></small>`).appendTo($(`.${this.topMenuRow2}:first`));
    pandaStats.append(`<span class='pcm-span-off' id='pcm-collecting'></span> -  <span id='pcm-collectingTotal'></span> `);
    let statArea = $(`<span class='pcm-statArea'></span>`).appendTo($(`.${this.topMenuRow2}:first`));
    statArea.append(`[ <span id='pcm-timerStats' class='toggle'></span> | <span id='pcm-jobFetchStats' class='toggle'></span> | `);
    statArea.append(`<span id='pcm-preStats' class='toggle'></span> | <span id='pcm-jobStats' class='toggle'></span> | <span id='pcm-earningsStats' class='toggle'></span> ]`);
    pandaStats = null; statArea = null;
  }
  /** Create the quick menu buttons under the stats area. */
  createPandaQuickMenu() {
    let quickMenu = $(`<div class='btn-group w-100' role='group'></div>`).appendTo($(`.${this.quickMenu}:first`));
    let group = $(`<div class='btn-group'></div>`).appendTo(quickMenu);
    this.addMenu(group, 'Pause', (e) => { if (bgPanda.pauseToggle()) $(e.target).html('Unpause'); else $(e.target).html('Pause'); }, 'Pause Timer.', 'pcm-btn-menu', 'pcm-bqPandaPause');
    this.addMenu(group, 'Start Group', () => { groupings.showGroupingsModal(pandaUI); }, 'Start groupings', 'pcm-btn-menu', 'pcm-bqPandaGroupings');
    this.addMenu(group, 'Stop All', () => { bgPanda.stopAll(); }, 'Stop All Collecting Panda and Search Jobs.', 'pcm-btn-menu', 'pcm-bqPandaStopAll');
    this.addMenu(group, 'Add Job', () => { pandaUI.showJobAddModal(); }, 'Add a Panda or Search Job.', 'pcm-btn-menu', 'pcm-bqPandaAddJobs');
    this.addSeparator(group, ' - ');
    this.addMenu(group, 'Reset Timer', () => { let currentTimer = globalOpt.timerUsed; $(`.pcm-timerButton.${currentTimer}:first`).click(); }, 'Reset the current timer to the original time.', 'pcm-btn-menu', 'pcm-bqPandaReset');
    this.addMenu(group, 'Search Jobs', () => { pandaUI.showJobsModal(); }, 'Search the Panda Jobs Added', 'pcm-btn-menu', 'pcm-bqPandaSearchJobs');
    // this.addMenu(group, 'Search Mturk', () => {}, 'Search Mturk for hits', 'pcm-btn-menu' );
    quickMenu = null; group = null;
  }
  /** This will show the quickMenu buttons. */
  showQuickMenu() { $(`.${this.quickMenu}`).show(); }
  /** This will hide the quickMenu buttons. */
  hideQuickMenu() { $(`.${this.quickMenu}`).hide(); }
  async createSearchTopMenu() {
		let topBar = $(`.pcm-menuRow1:first`);
    this.addMenu(topBar, ' ', e => {
			if (bgSearch.searchGStats.isSearchOn()) search.stopSearching();
			else if (bgSearch.isPandaUI()) {
				if (!search.startSearching()) search.showModalMessage('Nothing to search for.','There are no search triggers enabled to search for so searching cancelled.');
			} else search.showModalMessage('Open PandaCrazyMax First', 'PandaCrazyMax must be opened before search triggers can start collecting hits.');
			$(e.target).blur();
		}, 'Start searching for trigger jobs.', 'pcm-btn-toggle pcm-btn-menu pcm-searchingOff', 'pcm-searchNow');
		topBar.append(` <small id='pcm-text-searchStatus'>[<span class='pcm-span-toggle pcm-span-off' id='pcm-searching'></span>]</small> `);
    this.addMenu(topBar, 'Options', () => { if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showSearchOptions(() => this.modalSearch = null); }, 'Change General Search Options', 'pcm-btn-menu', 'pcm-bSearchOptions');
		let options = $(`<span class='pcm-dropDown-section'></span>`).appendTo(topBar);
    this.addSubMenu(options, '', 'pcm-btn-dropDown pcm-btn-menu', '', [
			{'type':'item', 'label':`General`, 'menuFunc': () => {
        if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showSearchOptions(() => this.modalSearch = null);
				}, class:'pcm-searchGeneral', 'tooltip':'Change search general options'},
      {'type':'item', 'label':`Advanced`, 'menuFunc': () => {
        if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showSearchAdvanced(() => this.modalSearch = null);
        }, class:'pcm-searchAdvanced', 'tooltip':'Change search advanced options'},
			{'type':'item', 'label':`Alarms`, 'menuFunc': () => {
					this.modalAlarms = new ModalAlarmClass(); this.modalAlarms.showAlarmsModal( () => this.modalAlarms = null, true );
				}, class:'pcm-searchAlarms', 'tooltip':'Change alarms for search triggers'},
			{'type':'item', 'label':`Blocked Id's`, 'menuFunc': () => {
        if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showSearchBlocked(() => this.modalSearch = null);
				}, class:'pcm-searchBlocked', 'tooltip':`Add or remove blocked group or requester ID's used in all search triggers.`},
		], '', 'pcm-bSearchOptions-dropdown');
		let stats = $(`<span id='pcm-searchStats'></span>`).appendTo(topBar);
		stats.append(` - [ <small class='pcm-elapsedStat'><span id='pcm-searchElapsed'></span></small> | `);
		stats.append(`<small class='pcm-fetchedStat'><span id='pcm-searchTotalFetched'></span></small> | `);
		stats.append(`<small class='pcm-searchPreStat'><span id='pcm-totalSearchPREs'></span></small> | `);
		stats.append(`<small class='pcm-hitsAvailableStat'><span id='pcm-searchResults'></span></small> ]`);
		let controls = $('.pcm-menuRow2:first');
		controls.append(`<span class='pcm-text-triggers'></span>`);
    this.addMenu(controls, 'List', () => {
      if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggersModal(_,_,_,_,_,_,_, () => this.modalSearch = null);
    }, 'List all search triggers.', 'pcm-btn-menu pcm-btn-listing', 'pcm-bListTriggers');
    this.addMenu(controls, 'Add', () => { search.showSearchAddModal(); }, 'Add a GID or RID trigger.', 'pcm-btn-menu pcm-btn-addTo', 'pcm-bAddTriggers');
    this.addMenu(controls, 'Add Custom', () => { search.showSearchAddModal(true); }, 'Add a custom trigger with search terms.', 'pcm-btn-menu pcm-btn-addTo', 'pcm-bAddTriggersC');
		controls.append(' | ');
    this.addMenu(controls, 'Groupings', () => { sGroupings.showGroupingsModal(); }, 'Start, stop or edit groups you created.', 'pcm-btn-menu', 'pcm-bSearchGroupings');
		let groupDrop = $(`<span class='pcm-dropDown-section'></span>`).appendTo(controls);
    this.addSubMenu(groupDrop, '', 'pcm-btn-dropDown pcm-btn-menu', '', [
			{'type':'item', 'label':`Start/Stop`, 'menuFunc': () => { sGroupings.showGroupingsModal(); }, 'class':'pcm-groupStart', 'tooltip':'Start, stop or edit groups you created.'},
			{'type':'item', 'label':`Create by Selection`, 'menuFunc': () => { sGroupings.createInstant(true); }, 'class':'pcm-groupCreate', 'tooltip':'Create a group by selecting triggers.'},
			{'type':'item', 'label':`Create Instantly`, 'menuFunc': () => { sGroupings.createInstant(); }, 'class':'pcm-groupInstant', 'tooltip':'Create a group of all enabled or disabled triggers.'},
			{'type':'item', 'label':`Edit`, 'menuFunc': () => { sGroupings.showGroupingsModal(); }, 'class':'pcm-groupEdit', 'tooltip':'Edit the groups you created.'},
		], '', 'pcm-bSearchGroupings-dropdown');
		controls.append(' | ');
		let filters = $(`<span class='pcm-dropDown-section'></span>`).appendTo(controls);
    this.addSubMenu(filters, 'Filters ', 'pcm-btn-dropDown pcm-btn-menu', 'pcm-filterDropDown', [
			{'type':'item', 'label':`<i class='far fa-check-square'></i> Show All`, 'menuFunc': e => { search.filterMe(e, '', true); }, 'class':'pcm-subShowAll', 'tooltip':'Add a new Panda or Search Job'},
			{'type':'item', 'label':`<i class='far fa-check-square'></i> Show Enabled`, 'menuFunc': e => { search.filterMe(e, 'sEnabled'); }, 'class':'pcm-subShowEnabled', 'tooltip':'Stop All Collecting Panda or Search Jobs'},
			{'type':'item', 'label':`<i class='far fa-check-square'></i> Show Disabled`, 'menuFunc': e => { search.filterMe(e, 'sDisabled'); }, 'class':'pcm-subShowDisabled', 'tooltip':'Stop All Collecting Panda or Search Jobs'},
		], '', 'pcm-bSearchFilters');
		let sorting = $(`<span class='pcm-dropDown-section'></span>`).appendTo(controls);
    this.addSubMenu(sorting, 'Sorting ', 'pcm-btn-dropDown pcm-btn-menu', 'pcm-sortingDropDown', [
			{'type':'item', 'label':`<span><i class='fas fa-minus'></i> None</span>`, 'menuFunc': e => { search.sortMe(e, 0); }, 'class':'pcm-subSortNone', 'tooltip':'No Sorting. Uses unique Database ID to sort.'},
			{'type':'item', 'label':`<i class='fas fa-sort-down'></i> Sort by Added`, 'menuFunc': e => { search.sortMe(e, 1); }, 'class':'pcm-subSortAdded', 'tooltip':'Sort by trigger was added.'},
			{'type':'item', 'label':`<i class='fas fa-sort-down'></i> Sort by Found Hits`, 'menuFunc': e => { search.sortMe(e, 2); }, 'class':'pcm-subSortFound', 'tooltip':'Sort by Number of Found Hits.'},
			{'type':'item', 'label':`<i class='fas fa-sort-down'></i> Sort by Last Found`, 'menuFunc': e => { search.sortMe(e, 3); }, 'class':'pcm-subSortLast', 'tooltip':'Sort by Last Time Hits Found.'},
		], '', 'pcm-bSearchSorting');
		$(`#pcm-sortingDropDown .dropdown-item`).eq(search.sorting).addClass('pcm-selectedItem');
		controls.append(' | ');
    this.addMenu(controls, 'Allow Auto', e => {
			let autoAllow = bgSearch.autoHitsAllow(!bgSearch.autoHitsAllow()), buttonText = (autoAllow) ? 'Turn Auto Off' : 'Allow Auto';
			$(e.target).html(buttonText).removeClass('pcm-autoOn pcm-autoOff').addClass((autoAllow) ? 'pcm-autoOn' : 'pcm-autoOff'); $(e.target).blur();
		}, 'Add gid or rid triggers.', 'pcm-btn-menu pcm-btn-toggle pcm-autoOff', 'pcm-bAutoAllow');
		bgSearch.searchGStats.prepare();
		search.tabs = new TabbedClass($(`#pcm-searchTriggers`), `pcm-triggerTabs`, `pcm-tabbedTriggers`, `pcm-triggerContents`, false);
    let [, err] = await search.tabs.prepare();
    if (!err) {
			search.ridTab = await search.tabs.addTab('Requester ID', true);
			search.gidTab = await search.tabs.addTab('Group ID');
			search.customTab = await search.tabs.addTab('Custom Search');
			search.triggeredTab = await search.tabs.addTab('Custom Triggered Hits');
			search.ridContent = $(`<div class='pcm-ridTriggers card-deck'></div>`).appendTo(`#${search.ridTab.tabContent}`);
			search.gidContent = $(`<div class='pcm-gidTriggers card-deck'></div>`).appendTo(`#${search.gidTab.tabContent}`);
			search.customContent = $(`<div class='pcm-customTriggers card-deck'></div>`).appendTo(`#${search.customTab.tabContent}`);
			search.triggeredContent = $(`<div class='pcm-triggeredHits card-deck'></div>`).appendTo(`#${search.triggeredTab.tabContent}`);
			search.triggeredContent.hover( (e) => { search.hitsTabInactive = false; }, (e) => { search.hitsTabInactive = true; search.displayTriggeredHits(); } );
			$(`<table class='table table-dark table-sm table-moreCondensed pcm-foundHitsTable table-bordered w-100'></table>`)
				.append(`<thead><tr><td style='width:25px; max-width:25px;'></td><td style='width:120px; max-width:120px;'>Requester Name</td><td>Title</td><td style='width:45px; max-width:45px;'>Pays</td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td><td style='width:16px; max-width:16px;'></td></tr></thead>`).append($(`<tbody></tbody>`)).appendTo(search.triggeredContent);
		}
		topBar = null, options = null, stats = null, controls = null, groupDrop = null, filters = null, sorting = null;
  }
}