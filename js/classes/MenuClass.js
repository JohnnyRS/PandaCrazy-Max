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
    this.topMenuId = "pcm_topMenu";       // The top menu id name to add menu's to.
  }
  /**
   * Prepares the page with all the menus on the page shown.
   */
  prepare() {
    this.createTopMenu();
    this.createQuickMenu();
    this.showQuickMenu();
  }
  /**
   * This method will add a menu with a label and the function to use when button clicked.
   * @param  {object} appendHere               - The element that this menu will append to.
   * @param  {string} label                    - This is the name of the menu button to use.
   * @param  {function} btnFunc                - Function to call when menu button is clicked.
   * @param  {string} tooltip=""               - The message for a tooltip for this menu button.
   * @param  {string} className="pcm-quickBtn" - Class name to use for the button.
   */
  addMenu(appendHere, label, btnFunc, tooltip="", className="pcm-quickBtn") {
    const addtip = (tooltip!=="") ? ` data-toggle="tooltip" data-placement="bottom" title="${tooltip}"` : ``;
    $(`<button type="button" class="btn text-dark btn-xs border-danger ${className}"${addtip}>${label}</button>`).click( (e) => {
      btnFunc.apply(this, [e]);
    } ).appendTo(appendHere);
  }
  /**
   * This will add a separator span with a character to the provided element.
   * @param  {object} appendHere - The element to add the separator to.
   * @param  {string} text       - The character used for the separator.
   */
  addSeparator(appendHere, text) { $(`<span class="mx-2">${text}</span>`).appendTo(appendHere); }
  /**
   * Adds a sub menu to a menu with dropdownstyle allowing for 3 submenus under the main menu.
   * @param  {object} appendHere    - Append submenu to an added menu element.
   * @param  {string} dropdownStyle - The css style of the dropdown when submenu arrow clicked.
   * @param  {array} dropdownInfo   - The dropdown information for the rest of the submenus.
   */
  addSubMenu(appendHere, dropdownStyle, dropdownInfo) {
    const btnGroup = $(`<div class="btn-group py-0"></div>`).appendTo(appendHere);
    $(`<button type="button" class="btn btn-primary-dark btn-xs dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>`).append($(`<span class="sr-only">Toggle Dropdown</span>`)).appendTo(btnGroup);
    const dropdownMenu = $(`<div class="dropdown-menu pcm_dropdownMenu" style="${dropdownStyle}"></div>`).appendTo(btnGroup);
    dropdownInfo.forEach( (info) => {
      const addtip = (info.tooltip && info.tooltip!=="") ? ` data-toggle="tooltip" data-placement="right" title="${info.tooltip}"` : ``;
      if (info.type==="item") {
        const item = $(`<a class="dropdown-item" href="#" ${addtip}>${info.label}</a>`).appendTo(dropdownMenu);
        if (info.menuFunc) $(item).click( (e) => { info.menuFunc.apply(this, [e]) });
      } else if (info.type==="rangeMax") $(`<label for="max">${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type==="rangeMin") $(`<label for="min">${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type==="slider") $(`<div id="${info.id}" class="text-center"></div>`).slider({orientation:"vertical", range:"min", min:info.min, max:info.max, value:info.value, step:info.step, create: (e, ui) => { info.createFunc.apply(this, [e, ui]); }, slide: (e, ui) => { info.slideFunc.apply(this, [e, ui]); }}).appendTo(dropdownMenu);
      else if (info.type==="divider") $(`<div class="dropdown-divider"></div>`).appendTo(dropdownMenu);
    });
  }
  /**
   * Create the top menu using addMenu and addSubMenu Methods.
   */
  createTopMenu() {
    const topMenu = $(`<div class="btn-group text-left border border-info" id="pcm_topMenuGroup" role="group"></div>`).appendTo($(`#${this.topMenuId}`));
    this.addMenu(topMenu, "Vol:", () => {}, "", "pcm-topMenuBtn");
    this.addSubMenu(topMenu, "min-width:3rem; text-align:center;", 
      [{type:"rangeMax", label:"100"},
       {type:"slider", id:"pcm_volumeVertical", min:0, max:100, value:50, step:10, slideFunc: (e, ui) => { $(e.target).find(".ui-slider-handle").text(ui.value); }, createFunc: (e, ui) => { $(e.target).find(".ui-slider-handle").text(50).css({left: "-.5em", width: "30px"}); }},
       {type:"rangeMin", label:"0"}]);
    this.addMenu(topMenu, "Jobs", () => { pandaUI.showJobsModal(); }, "List all Panda Jobs Added", "pcm-topMenuBtn");
    this.addSubMenu(topMenu, "", 
      [{type:"item", label:"Add", menuFunc: () => { modal.showJobAddModal(); }, tooltip:"Add a new Panda Job"},
       {type:"item", label:"Stop All", menuFunc: () => { bgPanda.stopAll(); }, tooltip:"Stop All Collecting Panda's"},
       {type:"item", label:"Search Jobs", menuFunc: () => { pandaUI.showJobsModal(); }, tooltip:"Search the Panda Jobs Added"},
       {type:"item", label:"Search Mturk"},
       {type:"divider"},
       {type:"item", label:"Export"}, {type:"item", label:"Import"}]);
    this.addMenu(topMenu, "Display", () => {}, "", "pcm-topMenuBtn");
    this.addSubMenu(topMenu, "",
      [{type:"item", label:"Normal"},
       {type:"item", label:"Minimal Info"},
       {type:"item", label:"One Line Info"}]);
    this.addMenu(topMenu, "Grouping", () => { groupings.showGroupingsModal(pandaUI); }, "List all Groupings Added", "pcm-topMenuBtn");
    this.addSubMenu(topMenu, "",
      [{type:"item", label:"Start/Stop", menuFunc: () => { groupings.showGroupingsModal(pandaUI); } },
       {type:"item", label:"Create by Selection", menuFunc: () => { groupings.createInstant(true); } },
       {type:"item", label:"Create Instantly", menuFunc: () => { groupings.createInstant(); } },
       {type:"item", label:"Edit", menuFunc: () => { groupings.showGroupingsModal(pandaUI); } }]);
    this.addMenu(topMenu, "1", () => { bgPanda.timerChange(globalOpt.getTimer1()); }, "Change timer to the Main Timer", "pcm-topMenuBtn");
    this.addMenu(topMenu, "2", () => { bgPanda.timerChange(globalOpt.getTimer2()); }, "Change timer to the Main Timer", "pcm-topMenuBtn");
    this.addMenu(topMenu, "3", () => { bgPanda.timerChange(globalOpt.getTimer3()); }, "Change timer to the Main Timer", "pcm-topMenuBtn");
    this.addSubMenu(topMenu, "",
      [{type:"item", label:"Edit Timers", menuFunc: () => { globalOpt.showTimerOptions(); } },
       {type:"item", label:"Increase by 5ms"}, {type:"item", label:"Decrease by 5ms"}, {type:"item", label:"Reset Timers"}]);
      this.addMenu(topMenu, "Options", () => { globalOpt.showGeneralOptions(); }, "Change Global, Alarms or timer Options", "pcm-topMenuBtn");
      this.addSubMenu(topMenu, "",
      [{type:"item", label:"General", menuFunc:() => { globalOpt.showGeneralOptions(); }},
       {type:"item", label:"Edit Timers", menuFunc:function() { globalOpt.showTimerOptions(); }},
       {type:"item", label:"Edit Alarms", menuFunc:() => { modal.showAlarmOptions(); }}]);
  }
  /**
   * Create the quick menu buttons under the stats area.
   */
  createQuickMenu() {
    const quickMenu = $(`<div class="btn-group text-left w-100 py-1" role="group"></div>`).appendTo($(`#${this.quickMenuId}`));
    const group = $(`<div class="btn-group py-0 my-0"></div>`).appendTo(quickMenu);
    this.addMenu(group, "Pause", (e) => { if (bgPanda.pauseToggle()) $(e.target).html("Unpause"); else $(e.target).html("Pause"); }, "Pause Timer.");
    this.addMenu(group, "Start Group", () => { groupings.showGroupingsModal(pandaUI); } );
    this.addMenu(group, "Stop All", () => { bgPanda.stopAll(); }, "Stop All Collecting Panda's");
    this.addMenu(group, "Add Job", () => { modal.showJobAddModal(); }, "Add a Panda Job");
    this.addSeparator(group, " - ");
    this.addMenu(group, "Reset Timer", () => {} );
    this.addMenu(group, "Search Jobs", () => { pandaUI.showJobsModal(); }, "Search the Panda Jobs Added" );
    this.addMenu(group, "Search Mturk", () => {} );
  }
  /**
   * This will show the quickMenu buttons.
   */
  showQuickMenu() { $(`#${this.quickMenuId}`).show(); }
  /**
   * This will hide the quickMenu buttons.
   */
  hideQuickMenu() { $(`#${this.quickMenuId}`).hide(); }
}