/**
 * This class deals with the different menus and which methods to call.
 * @class MenuClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class MenuClass {
  /**
   * @param  {string} id    The id name of the quick menu on the UI to use to append.
   */
  constructor(id) {
    this.quickMenuId = id;                // The id name of the quick menu element to add menu's to.
    this.topMenuId = 'pcm_topMenu';       // The top menu id name to add menu's to.
  }
  /** Prepares the page with all the menus on the page shown. */
  prepare() { this.createTopMenu(); this.createQuickMenu(); this.showQuickMenu(); }
  /** This method will add a menu with a label and the function to use when button clicked.
   * @param  {object} appendHere               - The element that this menu will append to.
   * @param  {string} label                    - This is the name of the menu button to use.
   * @param  {function} btnFunc                - Function to call when menu button is clicked.
   * @param  {string} tooltip=''               - The message for a tooltip for this menu button.
   * @param  {string} className='pcm-quickBtn' - Class name to use for the button. */
  addMenu(appendHere, label, btnFunc, tooltip='', className='pcm-quickBtn') {
    const addtip = (tooltip !== '') ? ` data-toggle='tooltip' data-placement='bottom' title='${tooltip}'` : ``;
    $(`<button type='button' class='btn text-dark btn-xs border-danger ${className}'${addtip}>${label}</button>`).click( (e) => {
      btnFunc.apply(this, [e]);
    } ).appendTo(appendHere);
  }
  /** This will add a separator span with a character to the provided element.
   * @param  {object} appendHere - The element to add the separator to.
   * @param  {string} text       - The character used for the separator. */
  addSeparator(appendHere, text) { $(`<span class='mx-2'>${text}</span>`).appendTo(appendHere); }
  /** Adds a sub menu to a menu with dropdownstyle allowing for 3 submenus under the main menu.
   * @param  {object} appendHere    - Append submenu to an added menu element.
   * @param  {string} dropdownStyle - The css style of the dropdown when submenu arrow clicked.
   * @param  {array} dropdownInfo   - The dropdown information for the rest of the submenus. */
  addSubMenu(appendHere, dropdownStyle, dropdownInfo) {
    const btnGroup = $(`<div class='btn-group py-0'></div>`).appendTo(appendHere);
    $(`<button type='button' class='btn btn-primary-dark btn-xs dropdown-toggle dropdown-toggle-split' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'></button>`).append($(`<span class='sr-only'>Toggle Dropdown</span>`)).appendTo(btnGroup);
    const dropdownMenu = $(`<div class='dropdown-menu pcm_dropdownMenu' style='${dropdownStyle}'></div>`).appendTo(btnGroup);
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
  }
  /** Change the panda timer and turn all other timer buttons off. */
  changeTheTimer(e, timer) {
    $('.pcm_timerButton').removeClass('pcm_buttonOn');
    if (e) $(e.target).addClass('pcm_buttonOn');
    bgPanda.timerChange(timer);
  }
  /** Change the numbers on the timer buttons according to the global options being changed.
   * @param  {number} increase - New number to change on the increase timer button.
   * @param  {number} decrease - New number to change on the decrease timer button.
   * @param  {number} addMore  - New number to change on the add more to timer button. */
  updateTimerMenu(increase, decrease, addMore) {
    $('.pcm_timerIncrease').html(`Increase timer by ${increase}ms`).attr('data-original-title', `Increase the current timer by ${increase}ms`);
    $('.pcm_timerDecrease').html(`Decrease timer by ${decrease}ms`).attr('data-original-title', `Decrease the current timer by ${decrease}ms`);
    $('.pcm_timerAddMore').html(`Add ${addMore}ms to timer`).attr('data-original-title', `Add ${addMore}ms to the current timer`);
  }
  /** Create the top menu using addMenu and addSubMenu Methods. */
  createTopMenu() {
    const topMenu = $(`<div class='btn-group text-left border border-info' id='pcm_topMenuGroup' role='group'></div>`).appendTo($(`#${this.topMenuId}`));
    this.addMenu(topMenu, 'Vol:', () => {}, '', 'pcm-topMenuBtn');
    this.addSubMenu(topMenu, 'min-width:3rem; text-align:center;', 
      [{type:'rangeMax', label:'100'},
       {type:'slider', id:'pcm_volumeVertical', min:0, max:100, value:50, step:10, slideFunc: (e, ui) => { $(e.target).find('.ui-slider-handle').text(ui.value); }, createFunc: (e, ui) => { $(e.target).find('.ui-slider-handle').text(50).css({left: '-.5em', width: '30px'}); }},
       {type:'rangeMin', label:'0'}]);
    this.addMenu(topMenu, 'Jobs', () => { pandaUI.showJobsModal(); }, 'List all Panda Jobs Added', 'pcm-topMenuBtn');
    this.addSubMenu(topMenu, '', 
      [{type:'item', label:'Add', menuFunc: () => { pandaUI.modalJob.showJobAddModal(); }, tooltip:'Add a new Panda or Search Job'},
       {type:'item', label:'Stop All', menuFunc: () => { bgPanda.stopAll(); }, tooltip:'Stop All Collecting Panda or Search Jobs'},
       {type:'item', label:'Search Jobs', menuFunc: () => { pandaUI.showJobsModal(); }, tooltip:'Search the Panda Jobs Added'},
       {type:'item', label:'Search Mturk'},
       {type:'divider'},
       {type:'item', label:'Export'},
       {type:'item', label:'Import'}]);
    this.addMenu(topMenu, 'Display', () => { pandaUI.changeDisplay(2) }, 'Change how information is displayed on the jobs to Normal.', 'pcm-topMenuBtn');
    this.addSubMenu(topMenu, '',
      [{type:'item', label:'Normal', menuFunc: () => { pandaUI.changeDisplay(2) }, tooltip:'Change how information is displayed on the jobs to Normal.'},
       {type:'item', label:'Minimal Info', menuFunc: () => { pandaUI.changeDisplay(1) }, tooltip:'Change how information is displayed on the jobs to minimal 3 lines.'},
       {type:'item', label:'One Line Info', menuFunc: () => { pandaUI.changeDisplay(0) }, tooltip:'Change how information is displayed on the jobs to only one line.'}]);
    this.addMenu(topMenu, 'Grouping', () => { groupings.showGroupingsModal(pandaUI); }, 'Start, stop or edit groupings you have added', 'pcm-topMenuBtn');
    this.addSubMenu(topMenu, '',
      [{type:'item', label:'Start/Stop', menuFunc: () => { groupings.showGroupingsModal(pandaUI); }, tooltip:'Start, stop or edit groupings you have added'},
       {type:'item', label:'Create by Selection', menuFunc: () => { groupings.createInstant(true); }, tooltip:'Create a grouping by selecting the jobs you want to start at same time.'},
       {type:'item', label:'Create Instantly', menuFunc: () => { groupings.createInstant(); }, tooltip:'Create a grouping with any jobs running now with default name and description'},
       {type:'item', label:'Edit', menuFunc: () => { groupings.showGroupingsModal(pandaUI); }, tooltip:'Start, stop or edit groupings you have added'}]);
    this.addMenu(topMenu, '1', (e) => { this.changeTheTimer(e, globalOpt.useTimer1()); }, 'Change timer to the Main Timer', 'pcm-topMenuBtn pcm_timerButton pcm_buttonOn');
    this.addMenu(topMenu, '2', (e) => { this.changeTheTimer(e, globalOpt.useTimer2()); }, 'Change timer to the Second Timer', 'pcm-topMenuBtn pcm_timerButton');
    this.addMenu(topMenu, '3', (e) => { this.changeTheTimer(e, globalOpt.useTimer3()); }, 'Change timer to the Third Timer', 'pcm-topMenuBtn pcm_timerButton');
    this.addSubMenu(topMenu, '',
      [{type:'item', label:'Edit Timers', menuFunc: () => { globalOpt.showTimerOptions(); }, tooltip:'Change options for the timers'},
       {type:'item', menuFunc: () => { bgPanda.timerChange(null, globalOpt.getTimerIncrease()); }, label:`Increase timer by ${globalOpt.getTimerIncrease()}ms`, class:'pcm_timerIncrease', tooltip:`Increase the current timer by ${globalOpt.getTimerIncrease()}ms`},
       {type:'item', menuFunc: () => { bgPanda.timerChange(null, 0, globalOpt.getTimerDecrease()); }, label:`Decrease timer by ${globalOpt.getTimerDecrease()}ms`, class:'pcm_timerDecrease', tooltip:`Decrease the current timer by ${globalOpt.getTimerDecrease()}ms`},
       {type:'item', menuFunc: () => { bgPanda.timerChange(null, globalOpt.getTimerAddMore()); }, label:`Add ${globalOpt.getTimerAddMore()}ms to timer`, class:'pcm_timerAddMore', tooltip:`Add ${globalOpt.getTimerAddMore()}ms to the current timer`},
       {type:'item', menuFunc: () => { this.changeTheTimer(null, globalOpt.getCurrentTimer()); }, label:'Reset Timer', tooltip:'Reset the current timer to the original time.'}]);
      this.addMenu(topMenu, 'Options', () => { globalOpt.showGeneralOptions(); }, 'Change Global, Alarms or timer Options', 'pcm-topMenuBtn');
      this.addSubMenu(topMenu, '',
      [{type:'item', label:'General', menuFunc:() => { globalOpt.showGeneralOptions(); }, tooltip:'Change the general options'},
       {type:'item', label:'Edit Timers', menuFunc:function() { globalOpt.showTimerOptions(); }, tooltip:'Change options for the timers'},
       {type:'item', label:'Edit Alarms', menuFunc:() => { globalOpt.showAlarmOptions(); }, tooltip:'Change the options and sounds for the alarms'}]);
  }
  /** Create the quick menu buttons under the stats area. */
  createQuickMenu() {
    const quickMenu = $(`<div class='btn-group text-left w-100 py-1' role='group'></div>`).appendTo($(`#${this.quickMenuId}`));
    const group = $(`<div class='btn-group py-0 my-0'></div>`).appendTo(quickMenu);
    this.addMenu(group, 'Pause', (e) => { if (bgPanda.pauseToggle()) $(e.target).html('Unpause'); else $(e.target).html('Pause'); }, 'Pause Timer.');
    this.addMenu(group, 'Start Group', () => { groupings.showGroupingsModal(pandaUI); } );
    this.addMenu(group, 'Stop All', () => { bgPanda.stopAll(); }, 'Stop All Collecting Panda and Search Jobs.');
    this.addMenu(group, 'Add Job', () => { pandaUI.modalJob.showJobAddModal(); }, 'Add a Panda or Search Job.');
    this.addSeparator(group, ' - ');
    this.addMenu(group, 'Reset Timer', () => { this.changeTheTimer(null, globalOpt.getCurrentTimer()); }, 'Reset the current timer to the original time.' );
    this.addMenu(group, 'Search Jobs', () => { pandaUI.showJobsModal(); }, 'Search the Panda Jobs Added' );
    this.addMenu(group, 'Search Mturk', () => {} );
  }
  /** This will show the quickMenu buttons. */
  showQuickMenu() { $(`#${this.quickMenuId}`).show(); }
  /** This will hide the quickMenu buttons. */
  hideQuickMenu() { $(`#${this.quickMenuId}`).hide(); }
}