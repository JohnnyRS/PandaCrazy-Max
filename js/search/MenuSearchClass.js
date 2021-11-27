/** This class deals with the different menus and which methods to call.
 * @class MenuClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
 class MenuSearchClass {
  constructor() {
    this.modalAlarms = null;
		this.modalSearch = null;
  }
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. */
  resetCSSValues() {
    let elements = '.pcm-searchTop .pcm-btn-menu';
    $(elements).each( (_, ele) => {
      let theId = $(ele).attr('id'), label = $(ele).data('label');
      if (theId) { let cssVar = getCSSVar(theId.replace('pcm-', ''), label); $(ele).html(cssVar); }
    });
  }
  /** This method will add a menu with a label and the function to use when button clicked.
   * @param  {object} appendHere - Jquery Element  @param  {string} label       - Menu label  @param  {function} btnFunc - Button Function
   * @param  {string} [tooltip]  - Tooltip String  @param  {string} [className] - Class name  @param  {string} [idName]    - Id Name */
  addMenu(appendHere, label, btnFunc, tooltip='', className='', idName='') {
    const addTip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' data-original-title='${tooltip}'` : ``;
    let idAdd = (idName !== '') ? `id='${idName}' ` : '', classAdd = (tooltip !== '') ? 'pcm-tooltipData pcm-tooltipHelper' : '';
    let theButton = $(`<button type='button' ${idAdd}class='${classAdd} ${className}'${addTip}></button>`).data('label',label).click( e => btnFunc.apply(this, [e]) ).appendTo(appendHere);
    let cssVar = getCSSVar(idName.replace('pcm-', ''), label); theButton.html(cssVar); theButton = null;
  }
  /** Adds a sub menu to a menu with dropdownstyle allowing for 3 submenus under the main menu.
   * @param  {object} appendHere    - Jquery Element      @param  {string} label      - SubMenu label    @param  {string} theClass        - Class Name
   * @param  {string} btnGroupClass - Button Group Class  @param  {string} btnGroupID - Button Group ID  @param  {array} dropdownInfo     - Dropdown Info
   * @param  {string} [tooltip]     - CSS style           @param  {string} [buttonId] - CSS style        @param  {string} [dropdownClass] - CSS style
   * @param  {bool} [noClick]       - should stop prop?   @param  {function} [onClosed] - Menu close function */
  addSubMenu(appendHere, label, theClass, btnGroupClass, btnGroupID, dropdownInfo, tooltip='', buttonId='', dropdownClass='', noClick=false, onClosed=null) {
    const addTip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' data-original-title='${tooltip}'` : ``, addId = (btnGroupID) ? ` id=${btnGroupID}` : '';
    let btnGroup = $(`<div class='btn-group ${btnGroupClass}'${addId}></div>`).appendTo(appendHere), idAdd = (buttonId !== '') ? `id='${buttonId}' ` : '';
    let classAdd = (tooltip !== '') ? 'pcm-tooltipData pcm-tooltipHelper' : '';
    let theButton = $(`<button type='button' ${idAdd}class='${theClass} ${classAdd} dropdown-toggle dropdown-toggle-split' data-toggle='dropdown'${addTip} aria-haspopup='true' aria-expanded='false'></button>`).data('label',label).append($(`<span class='sr-only'>Toggle Dropdown</span>`)).appendTo(btnGroup);
    let cssVar = getCSSVar(buttonId.replace('pcm-', ''), label); theButton.html(cssVar);
    let dropdownMenu = $(`<div class='dropdown-menu pcm-dropdownMenu ${dropdownClass}'></div>`).appendTo(btnGroup);
    if (noClick) dropdownMenu.click( e => { e.stopPropagation(); } );
    if (onClosed) dropdownMenu.parent().on('hidden.bs.dropdown', () => { onClosed(); });
    dropdownInfo.forEach( info => {
      const addTip = (info.tooltip && info.tooltip!=='') ? ` data-toggle='tooltip' data-placement='right' data-original-title='${info.tooltip}'` : ``;
      if (info.type === 'item') {
        const classAdd = (info.class) ? ` ${info.class}` : '';
        const item = $(`<a class='dropdown-item${classAdd} pcm-tooltipData pcm-tooltipHelper' href='#' ${addTip}>${info.label}</a>`).appendTo(dropdownMenu);
        if (info.menuFunc) $(item).click( e => { info.menuFunc.apply(this, [e]) });
      } else if (info.type === 'rangeMax') $(`<label for='max'>${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type === 'rangeMin') $(`<label for='min'>${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type === 'slider') $(`<div id='${info.id}' class='pcm-myCenter'></div>`).slider({'orientation':'vertical', 'range':'min', 'min':info.min, 'max':info.max, 'value':info.value, 'step':info.step, create: (e, ui) => { info.createFunc.apply(this, [e, ui]); }, slide: (e, ui) => { info.slideFunc.apply(this, [e, ui]); }}).appendTo(dropdownMenu);
      else if (info.type === 'divider') $(`<div class='dropdown-divider'></div>`).appendTo(dropdownMenu);
    });
    btnGroup = null; dropdownMenu = null; theButton = null;
  }
  /** Create the search top menu using addMenu and addSubMenu Methods. */
  createSearchTopMenu() {
		let topBar = $(`.pcm-menuRow1:first`);
    this.addMenu(topBar, ' ', async (e) => {
      let searchIsOn = await MySearch.searchGStats.isSearchOn();
			if (MySearchUI && searchIsOn) MySearchUI.stopSearching();
			else if (MySearch.isPandaUI()) {
        let doStart = await MySearchUI.startSearching();
				if (!doStart) MySearchUI.showModalMessage('Nothing to search for.','There are no search triggers enabled to search for so searching cancelled.');
			} else MySearchUI.showModalMessage('Open PandaCrazyMax First', 'PandaCrazyMax must be opened before search triggers can start collecting HITs.');
			$(e.target).blur();
		}, 'Start searching for trigger jobs.', 'pcm-btn-toggle pcm-btn-menu pcm-searchingOff', 'pcm-searchNow');
		topBar.append(` <small id='pcm-text-searchStatus'>[<span class='pcm-span-toggle pcm-span-off' id='pcm-searching'></span>]</small> `);
    this.addMenu(topBar, 'Options', () => { if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showSearchOptions(() => this.modalSearch = null); }, 'Change General Search Options', 'pcm-btn-menu', 'pcm-bSearchOptions');
		let options = $(`<span class='pcm-dropDown-section'></span>`).appendTo(topBar);
    this.addSubMenu(options, '', 'pcm-btn-dropDown pcm-btn-menu', '', '', [
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
		let stats = $(`<small class='pcm-searchStats'></span>`).appendTo(topBar);
		stats.append(` - [ <span id='pcm-timerStats' class='toggle'></span> | `);
		stats.append(`<span id='pcm-searchTotalFetched'></span> | `);
		stats.append(`<span id='pcm-totalSearchPREs'></span> | `);
		stats.append(`<span id='pcm-searchResults'></span> ]`);
		let controls = $('.pcm-menuRow2:first');
		controls.append(`<span class='pcm-text-triggers'></span>`);
    this.addMenu(controls, 'List', () => {
      if (!this.modalSearch) this.modalSearch = new ModalSearchClass(); this.modalSearch.showTriggersModal(_,_,_,_,_,_,_, () => this.modalSearch = null);
    }, 'List all search triggers.', 'pcm-btn-menu pcm-btn-listing', 'pcm-bListTriggers');
    this.addMenu(controls, 'Add', () => { MySearchUI.showSearchAddModal(); }, 'Add a GID or RID trigger.', 'pcm-btn-menu pcm-btn-addTo', 'pcm-bAddTriggers');
    this.addMenu(controls, 'Add Custom', () => { MySearchUI.showSearchAddModal(true); }, 'Add a custom trigger with search terms.', 'pcm-btn-menu pcm-btn-addTo', 'pcm-bAddTriggersC');
		controls.append(' | ');
    this.addMenu(controls, 'Groupings', () => { MyGroupings.showGroupingsModal(); }, 'Start, stop or edit groups you created.', 'pcm-btn-menu', 'pcm-bSearchGroupings');
		let groupDrop = $(`<span class='pcm-dropDown-section'></span>`).appendTo(controls);
    this.addSubMenu(groupDrop, '', 'pcm-btn-dropDown pcm-btn-menu', '', '', [
			{'type':'item', 'label':`Start/Stop`, 'menuFunc': () => { MyGroupings.showGroupingsModal(); }, 'class':'pcm-groupStart', 'tooltip':'Start, stop or edit groups you created.'},
			{'type':'item', 'label':`Create by Selection`, 'menuFunc': () => { MyGroupings.createInstant(true); }, 'class':'pcm-groupCreate', 'tooltip':'Create a group by selecting triggers.'},
			{'type':'item', 'label':`Create Instantly`, 'menuFunc': () => { MyGroupings.createInstant(); }, 'class':'pcm-groupInstant', 'tooltip':'Create a group of all enabled or disabled triggers.'},
			{'type':'item', 'label':`Edit`, 'menuFunc': () => { MyGroupings.showGroupingsModal(); }, 'class':'pcm-groupEdit', 'tooltip':'Edit the groups you created.'},
		], '', 'pcm-bSearchGroupings-dropdown');
		controls.append(' |');
		let filters = $(`<span class='pcm-dropDown-section'></span>`).appendTo(controls);
    this.addSubMenu(filters, 'Filters ', 'pcm-btn-dropDown pcm-btn-menu', '', 'pcm-filterDropDown', [
			{'type':'item', 'label':`<i class='far fa-check-square'></i> Show All`, 'menuFunc': e => { MySearchUI.filterMe(e, '', true); }, 'class':'pcm-subShowAll', 'tooltip':'Show all triggers in tabs below.'},
			{'type':'item', 'label':`<i class='far fa-check-square'></i> Show Enabled`, 'menuFunc': e => { MySearchUI.filterMe(e, 'sEnabled'); }, 'class':'pcm-subShowEnabled', 'tooltip':'Show only the Enabled triggers in tabs below.'},
			{'type':'item', 'label':`<i class='far fa-check-square'></i> Show Disabled`, 'menuFunc': e => { MySearchUI.filterMe(e, 'sDisabled'); }, 'class':'pcm-subShowDisabled', 'tooltip':'Show only the Disabled triggers in tabs below.'},
		], 'Filter the triggers shown in the tabs below.', 'pcm-bSearchFilters');
		let sorting = $(`<span class='pcm-dropDown-section'></span>`).appendTo(controls);
    this.addSubMenu(sorting, 'Sorting ', 'pcm-btn-dropDown pcm-btn-menu', '', 'pcm-sortingDropDown', [
			{'type':'item', 'label':`<span><i class='fas fa-minus'></i> None</span>`, 'menuFunc': e => { MySearchUI.sortMe(e, 0); }, 'class':'pcm-subSortNone', 'tooltip':'No Sorting. Uses unique Database ID to sort.'},
			{'type':'item', 'label':`<i class='fas fa-sort-down'></i> Sort by Added`, 'menuFunc': e => { MySearchUI.sortMe(e, 1); }, 'class':'pcm-subSortAdded', 'tooltip':'Sort by date added of triggers.'},
			{'type':'item', 'label':`<i class='fas fa-sort-down'></i> Sort by Found HITs`, 'menuFunc': e => { MySearchUI.sortMe(e, 2); }, 'class':'pcm-subSortFound', 'tooltip':'Sort by Number of Found HITs.'},
			{'type':'item', 'label':`<i class='fas fa-sort-down'></i> Sort by Last Found`, 'menuFunc': e => { MySearchUI.sortMe(e, 3); }, 'class':'pcm-subSortLast', 'tooltip':'Sort by Last Time HITs Found.'},
		], 'Sort the way the triggers are displayed in the tabs below.', 'pcm-bSearchSorting');
		$(`#pcm-sortingDropDown .dropdown-item`).eq(MySearchUI.sorting).addClass('pcm-selectedItem');
		controls.append(' | ');
    this.addMenu(controls, 'Allow Auto', async (e) => {
      let autoAllow = await MySearch.toggleAutoHits(), buttonText = (autoAllow) ? 'Turn Auto Off' : 'Allow Auto';
			$(e.target).html(buttonText).removeClass('pcm-autoOn pcm-autoOff').addClass((autoAllow) ? 'pcm-autoOn' : 'pcm-autoOff'); $(e.target).blur();
		}, 'Should triggers be allowed to automatically collect found HITs?', 'pcm-btn-menu pcm-btn-toggle pcm-autoOff', 'pcm-bAutoAllow');
		if (MySearch) MySearch.searchGStats.prepare();
		topBar = null, options = null, stats = null, controls = null, groupDrop = null, filters = null, sorting = null;
  }
}
