/** This class deals with the different menus and which methods to call.
 * @class MenuClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class MenuClass {
  constructor() {
    this.topMenuRow1 = 'pcm-menuRow1';       // The top menu id name to add menu's to.
    this.topMenuRow2 = 'pcm-menuRow2';       // The top menu id name to add menu's to.
    this.quickMenu = 'pcm-quickMenu';        // The id name of the quick menu element to add menu's to.
    this.modalAlarms = null;                 // Temporary variable holding the modal alarms class.
    this.modalOptions = null;                // Temporary variable holding the modal options class.
		this.modalSearch = null;                 // Temporary variable holding the modal search class.
  }
  /** Prepares the page with all the menus on the page shown.
   * @param  {function} [afterFunc] - Function to send the success message after this is done.
  */
  preparePanda(afterFunc=null) {
    this.createPandaTopMenu(); this.createPandaStats(); this.createPandaQuickMenu(); this.showQuickMenu();
    if (afterFunc) afterFunc(['PandaUI Menus Have Been Set Up.']);
  }
  /** This will add a separator span with a character to the provided element.
   * @param  {object} appendHere - Jquery element.  @param  {string} text - Separator character.
  **/
  addSeparator(appendHere, text) { $(`<span class='pcm-separator'>${text}</span>`).appendTo(appendHere); }
  /** Change the panda timer and turn all other timer buttons off.
   * @param  {object} e - Target event.  @param  {number} timer - Timer value.
  **/
  changeTheTimer(e, timer) { $('.pcm-timerButton').removeClass('pcm-buttonOn'); if (e) $(e.target).addClass('pcm-buttonOn'); this.timerChange(timer); }
  /** Changes the timer with a value or time to add or remove from timer.
   * @param  {number} [timer] - New timer value.  @param  {number} [addThis] - Add to timer.  @param  {number} [delThis] - Delete from timer.
  **/
  timerChange(timer=null, addThis=0, delThis=0) { let newTimer = MyPanda.timerChange(timer, addThis, delThis); MyPandaUI.pandaGStats.setPandaTimer(newTimer); }
  /** Change the numbers on the timer buttons according to the global options being changed.
   * @param  {number} increase - Increase button value.  @param  {number} decrease - Decrease button value.  @param  {number} addMore - Add more button value.
  **/
  updateTimerMenu(increase, decrease, addMore) {
    $('.pcm-timerIncrease').html(`Increase Timer By ${increase}ms`).attr('data-original-title', `Increase the current timer by ${increase}ms`);
    $('.pcm-timerDecrease').html(`Decrease Timer By ${decrease}ms`).attr('data-original-title', `Decrease the current timer by ${decrease}ms`);
    $('.pcm-timerAddMore').html(`Add ${addMore}ms to Timer`).attr('data-original-title', `Add ${addMore}ms to the current timer`);
  }
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. **/
  resetCSSValues() {
    let elements = (MyPandaUI !== null) ? '.pcm-pandaTop .pcm-btn-menu, .pcm-quickMenu .pcm-btn-menu' : '.pcm-searchTop .pcm-btn-menu';
    $(elements).each( (_s, ele) => {
      let theId = $(ele).attr('id'), label = $(ele).data('label');
      if (theId) { let cssVar = getCSSVar(theId.replace('pcm-', ''), label); $(ele).html(cssVar); }
    });
  }
  /** This method will add a menu with a label and the function to use when button clicked.
   * @param  {object} appendHere - Jquery element.  @param  {string} label       - Menu label.  @param  {function} btnFunc - Button function.
   * @param  {string} [tooltip]  - Tooltip string.  @param  {string} [className] - Class name.  @param  {string} [idName]  - ID name.
  **/
  addMenu(appendHere, label, btnFunc, tooltip='', className='', idName='') {
    const addTip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' data-original-title='${tooltip}'` : ``;
    let idAdd = (idName !== '') ? `id='${idName}' ` : '', classAdd = (tooltip !== '') ? 'pcm-tooltipData pcm-tooltipHelper' : '';
    let theButton = $(`<button type='button' ${idAdd}class='${classAdd} ${className}'${addTip}></button>`).data('label',label).click( e => btnFunc.apply(this, [e]) ).appendTo(appendHere);
    let cssVar = getCSSVar(idName.replace('pcm-', ''), label); theButton.html(cssVar); theButton = null;
  }
  /** Adds a sub menu to a menu with dropdownstyle allowing for 3 submenus under the main menu.
   * @param  {object} appendHere    - Jquery element.      @param  {string} label      - SubMenu label.    @param  {string} theClass        - Class name.
   * @param  {string} btnGroupClass - Button group class.  @param  {string} btnGroupID - Button group ID.  @param  {array} dropdownInfo     - Dropdown info.
   * @param  {string} [tooltip]     - CSS style.           @param  {string} [buttonId] - CSS style.        @param  {string} [dropdownClass] - CSS style.
   * @param  {string} [noClick]     - CSS style.           @param  {string} [onClosed] - CSS style.
  **/
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
  /** Create the top menu using addMenu and addSubMenu Methods. **/
  createPandaTopMenu() {
    let topMenu = $(`<div class='btn-group pcm-btnGroup' role='group'></div>`).appendTo($(`.${this.topMenuRow1}:first`));
    let vol = MyOptions.theVolume(), volumeHoriz = MyOptions.theVolDir();
    $(`<span class='pcm-myWarning' style='font-size:11px; margin-left:13px;'></span>`).appendTo($(`.${this.topMenuRow1}:first`));
    let volumeSlider = $(`<span class='pcm-volumeHorizGroup'>Vol: </span>`).css('display',(volumeHoriz) ? 'block' : 'none').appendTo(topMenu);
    inputRange(volumeSlider, 0, 100, vol, 'vol', (value) => { MyAlarms.setVolume(value); }, false);
    this.addSubMenu(topMenu, 'Vol: ', 'pcm-btn-dropDown', 'pcm-volumeVertGroup', '', [
      {'type':'rangeMax', 'label':'100'},
      {'type':'slider', id:'pcm-volumeVertical', 'min':0, 'max':100, 'value':vol, 'step':5, 'slideFunc': (_s, ui) => { $(ui.handle).text(ui.value); MyAlarms.setVolume(ui.value); }, 'createFunc': (e) => { $(e.target).find('.ui-slider-handle').text(vol).css({'left': '-0.6em', 'width': '25px', 'fontSize':'12px', 'lineHeight':'1', 'height':'18px', 'paddingTop':'2px'}); }},
      {'type':'rangeMin', 'label':'0'}
    ], 'Change the global volume level for alarms.', 'pcm-volumeDropDownBtn', 'pcm-dropdownVolume', true, () => {});
    topMenu.find('.pcm-volumeVertGroup').css('display',(volumeHoriz) ? 'none' : 'flex')
    this.addMenu(topMenu, 'Jobs', () => { MyPandaUI.showJobsModal(); }, 'List all Panda Jobs Added', 'pcm-btn-menu', 'pcm-bListJobs');
    this.addSubMenu(topMenu, '', 'pcm-btn-dropDown', '', '', [
      {'type':'item', 'label':'Add', 'menuFunc': () => { MyPandaUI.showJobAddModal(); }, 'tooltip':'Add a new Panda or Search Job'},
      {'type':'item', 'label':'Stop All', 'menuFunc': () => { MyPanda.stopAll(); }, 'tooltip':'Stop All Collecting Panda or Search Jobs'},
      {'type':'item', 'label':'Search Jobs', 'menuFunc': () => { MyPandaUI.showJobsModal(); }, 'tooltip':'Search the Panda Jobs Added'},
      // {'type':'item', 'label':'Search Mturk'},
      {'type':'divider'},
      {'type':'item', 'label':'Export', 'menuFunc': () => { new EximClass().exportModal(); }, 'tooltip':'Export jobs, options, groupings, triggers and alarms to a file.'},
      {'type':'item', 'label':'Import', 'menuFunc': () => { new EximClass().importModal(); }, 'tooltip':'Import jobs, options, groupings, triggers and alarms from an exported file.'}
    ]);
    this.addMenu(topMenu, 'Display', () => { MyPandaUI.cards.changeDisplay(2) }, 'Change how information is displayed on the jobs to Normal.', 'pcm-btn-menu', 'pcm-bCardsDisplay');
    this.addSubMenu(topMenu, ' ', 'pcm-btn-dropDown', '', '', [
      {'type':'item', 'label':'Normal', 'menuFunc': () => { MyPandaUI.cards.changeDisplay(2) }, 'tooltip':'Change how information is displayed on the jobs to Normal.'},
      {'type':'item', 'label':'Minimal Info', 'menuFunc': () => { MyPandaUI.cards.changeDisplay(1) }, 'tooltip':'Change how information is displayed on the jobs to minimal 3 lines.'},
      {'type':'item', 'label':'One Line Info', 'menuFunc': () => { MyPandaUI.cards.changeDisplay(0) }, 'tooltip':'Change how information is displayed on the jobs to only one line.'}
    ]);
    this.addMenu(topMenu, 'Groupings', () => { MyGroupings.showGroupingsModal(); }, 'Start, stop or edit groupings you have added', 'pcm-btn-menu', 'pcm-bPandaGroupings');
    this.addSubMenu(topMenu, ' ', 'pcm-btn-dropDown', '', '', [
      {'type':'item', 'label':'Start/Stop', 'menuFunc': () => { MyGroupings.showGroupingsModal(); }, 'tooltip':'Start, stop or edit groupings you have added'},
      {'type':'item', 'label':'Create by Selection', 'menuFunc': () => { MyGroupings.createInstant(true); }, 'tooltip':'Create a grouping by selecting the jobs you want to start at same time.'},
      {'type':'item', 'label':'Create Instantly', 'menuFunc': () => { MyGroupings.createInstant(); }, 'tooltip':'Create a grouping with any jobs running now with default name and description'},
      {'type':'item', 'label':'Edit', 'menuFunc': () => { MyGroupings.showGroupingsModal(); }, 'tooltip':'Start, stop or edit groupings you have added'}
    ]);
    this.addMenu(topMenu, '1', e => { this.changeTheTimer(e, MyOptions.useTimer1()); }, 'Change timer to the Main Timer', 'pcm-btn-menu pcm-timerButton pcm-buttonOn mainTimer');
    this.addMenu(topMenu, '2', e => { this.changeTheTimer(e, MyOptions.useTimer2()); }, 'Change timer to the Second Timer', 'pcm-btn-menu pcm-timerButton secondTimer');
    this.addMenu(topMenu, '3', e => { this.changeTheTimer(e, MyOptions.useTimer3()); }, 'Change timer to the Third Timer', 'pcm-btn-menu pcm-timerButton thirdTimer');
    this.addSubMenu(topMenu, '', 'pcm-btn-dropDown', '', '', [
      {'type':'item', 'label':'Edit Timers', 'menuFunc': () => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showTimerOptions(); }, 'tooltip':'Change options for the timers'},
      {'type':'item', 'menuFunc': () => { this.timerChange(null, MyOptions.getTimerIncrease()); }, 'label':`Increase Timer By ${MyOptions.getTimerIncrease()}ms`, class:'pcm-timerIncrease', 'tooltip':`Increase the current timer by ${MyOptions.getTimerIncrease()}ms`},
      {'type':'item', 'menuFunc': () => { this.timerChange(null, 0, MyOptions.getTimerDecrease()); }, 'label':`Decrease Timer By ${MyOptions.getTimerDecrease()}ms`, class:'pcm-timerDecrease', 'tooltip':`Decrease the current timer by ${MyOptions.getTimerDecrease()}ms`},
      {'type':'item', 'menuFunc': () => { this.timerChange(null, MyOptions.getTimerAddMore()); }, 'label':`Add ${MyOptions.getTimerAddMore()}ms to Timer`, class:'pcm-timerAddMore', 'tooltip':`Add ${MyOptions.getTimerAddMore()}ms to the current timer`},
      {'type':'item', 'menuFunc': () => { let currentTimer = MyOptions.timerUsed; $(`.pcm-timerButton.${currentTimer}:first`).click(); }, 'label':'Reset Timer', 'tooltip':'Reset the current timer to the original time.'}
    ]);
    this.addMenu(topMenu, 'Options', () => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showGeneralOptions( () => this.modalOptions = null ); }, 'Change the general options', 'pcm-btn-menu', 'pcm-bPandaOptions');
    this.addSubMenu(topMenu, ' ', 'pcm-btn-dropDown', '', '', [
      {'type':'item', 'label':'General', 'menuFunc':() => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showGeneralOptions( () => this.modalOptions = null ); }, 'tooltip':'Change the general options'},
      {'type':'item', 'label':'Edit Timers', 'menuFunc':function() { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showTimerOptions( () => this.modalOptions = null ); }, 'tooltip':'Change options for the timers'},
      {'type':'item', 'label':'Edit Alarms', 'menuFunc':() => { if (!this.modalAlarms) this.modalAlarms = new ModalAlarmClass(); this.modalAlarms.showAlarmsModal( () => this.modalAlarms = null ); }, 'tooltip':'Change the options and sounds for the alarms'},
      {'type':'item', 'label':'Edit Search', 'menuFunc':() => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showSearchOptions( () => this.modalOptions = null ); }, 'tooltip':'Change the options for search jobs and search triggers on the search page.'},
      {'type':'item', 'label':'Change Themes', 'menuFunc':() => { MyThemes.showThemeModal(); }, 'tooltip':'Change the Themes CSS to use'},
      {'type':'item', 'label':'Advanced Options', 'menuFunc':() => { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showAdvancedOptions( () => this.modalOptions = null ); }, 'tooltip':'Change the advanced options'},
    ]);
    topMenu = null; volumeSlider = null;
  }
  /** Creates the panda stats row area. **/
  createPandaStats() {
    let pandaStats = $(`<small class='pcm-pandaStats'></small>`).appendTo($(`.${this.topMenuRow2}:first`));
    pandaStats.append(`<span class='pcm-span-off' id='pcm-collecting'></span> -  <span id='pcm-collectingTotal'></span> `);
    let statArea = $(`<span class='pcm-statArea'></span>`).appendTo($(`.${this.topMenuRow2}:first`));
    statArea.append(`[ <span id='pcm-timerStats' class='toggle'></span> | <span id='pcm-jobFetchStats' class='toggle'></span> | `);
    statArea.append(`<span id='pcm-preStats' class='toggle'></span> | <span id='pcm-jobStats' class='toggle'></span> | <span id='pcm-earningsStats' class='toggle'></span> ]`);
    pandaStats = null; statArea = null;
  }
  /** Create the quick menu buttons under the stats area. **/
  createPandaQuickMenu() {
    let quickMenu = $(`<div class='btn-group w-100' role='group'></div>`).appendTo($(`.${this.quickMenu}:first`));
    let group = $(`<div class='btn-group'></div>`).appendTo(quickMenu);
    this.addMenu(group, 'Pause', e => { MyPandaUI.pauseToggle(); }, 'Pause Timer.', 'pcm-btn-menu', 'pcm-bqPandaPause');
    this.addMenu(group, 'Start Group', () => { MyGroupings.showGroupingsModal(MyPandaUI); }, 'Start groupings', 'pcm-btn-menu', 'pcm-bqPandaStartGroup');
    this.addMenu(group, 'Stop All', () => { MyPanda.stopAll(); }, 'Stop All Collecting Panda and Search Jobs.', 'pcm-btn-menu', 'pcm-bqPandaStopAll');
    this.addMenu(group, 'Add Job', () => { MyPandaUI.showJobAddModal(); }, 'Add a Panda or Search Job.', 'pcm-btn-menu', 'pcm-bqPandaAddJobs');
    this.addSeparator(group, ' - ');
    this.addMenu(group, 'Reset Timer', () => { let currentTimer = MyOptions.timerUsed; $(`.pcm-timerButton.${currentTimer}:first`).click(); }, 'Reset the current timer to the original time.', 'pcm-btn-menu', 'pcm-bqPandaReset');
    this.addMenu(group, 'Search Jobs', () => { MyPandaUI.showJobsModal(); }, 'Search the Panda Jobs Added', 'pcm-btn-menu', 'pcm-bqPandaSearchJobs');
    // this.addMenu(group, 'Search Mturk', () => {}, 'Search Mturk for HITs', 'pcm-btn-menu' );
    quickMenu = null; group = null;
  }
  /** This will show the quickMenu buttons. **/
  showQuickMenu() { $(`.${this.quickMenu}`).show(); }
  /** This will hide the quickMenu buttons. **/
  hideQuickMenu() { $(`.${this.quickMenu}`).hide(); }
}