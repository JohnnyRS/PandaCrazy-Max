class MenuClass {
  constructor(id) {
    this.quickMenuId = id;
    this.topMenuId = "pcm_topMenu";

    this.createTopMenu();
    this.createQuickMenu();
    this.showQuickMenu();
  }
  addMenu(appendHere, label, btnFunc, tooltip="") {
    const addtip = (tooltip!=="") ? ` data-toggle="tooltip" data-placement="bottom" title="${tooltip}"` : ``;
    $(`<button type="button" class="btn text-dark btn-xs border-danger ml-1 pcm-quickBtn"${addtip}>${label}</button>`).click( (e) => {
      btnFunc.apply(this, e);
    } ).appendTo(appendHere);
  }
  addSeparator(appendHere, text) { $(`<span class="mx-2">${text}</span>`).appendTo(appendHere); }
  addSubMenu(appendHere, label, tooltip, labelFunc, dropdownStyle, dropdownInfo, label2=null, label2Func, label3=null, label3Func) {
    const addtip = (tooltip!=="") ? ` data-toggle="tooltip" data-placement="bottom" title="${tooltip}"` : ``;
    const btnGroup = $(`<div class="btn-group py-0"></div>`).appendTo(appendHere);
    $(`<button type="button" class="btn text-dark border-danger btn-xs pcm-topMenuBtn"${addtip}>${label}</button>`).click( (e) => { labelFunc.apply(this, [e]); } ).appendTo(btnGroup);
    if (label2) $(`<button type="button" class="btn text-dark border-danger btn-xs pcm-topMenuBtn">${label2}</button>`).click( (e) => { label2Func.apply(this, [e]); } ).appendTo(btnGroup);
    if (label3) $(`<button type="button" class="btn text-dark border-danger btn-xs pcm-topMenuBtn">${label3}</button>`).click( (e) => { label3Func.apply(this, [e]); } ).appendTo(btnGroup);
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
  createTopMenu() {
    const topMenu = $(`<div class="btn-group text-left border border-info" id="pcm_topMenuGroup" role="group"></div>`).appendTo($(`#${this.topMenuId}`));
    this.addSubMenu(topMenu, "Vol:", "Change Volume of Alarms", () => {}, "min-width:3rem; text-align:center;", [{type:"rangeMax", label:"100"}, {type:"slider", id:"pcm_volumeVertical", min:0, max:100, value:50, step:10, slideFunc: (e, ui) => { $(e.target).find(".ui-slider-handle").text(ui.value); }, createFunc: (e, ui) => { $(e.target).find(".ui-slider-handle").text(50).css({left: "-.5em", width: "30px"}); }}, {type:"rangeMin", label:"0"}]);
    this.addSubMenu(topMenu, "Jobs", "List all Panda Jobs Added", () => { panda.showJobsModal(); }, "", 
      [{type:"item", label:"Add", menuFunc: () => { panda.modal.showJobAddModal(panda); }, tooltip:"Add a new Panda Job"},
       {type:"item", label:"Stop All", menuFunc: () => { panda.portPanda.postMessage({command:"stopAll"}); }, tooltip:"Stop All Collecting Panda's"},
       {type:"item", label:"Search Jobs", menuFunc: () => { panda.showJobsModal(); }, tooltip:"Search the Panda Jobs Added"},
       {type:"item", label:"Search Mturk"},
       {type:"divider"}, {type:"item", label:"Export"}, {type:"item", label:"Import"}]);
    this.addSubMenu(topMenu, "Display", "Change Panda Display Size", () => {}, "", [{type:"item", label:"Normal"}, {type:"item", label:"Minimal Info"}, {type:"item", label:"One Line Info"}]);
    this.addSubMenu(topMenu, "Grouping", "List all Groupings Added", () => { groupings.showGroupingsModal(panda); }, "",
      [{type:"item", label:"Start/Stop", menuFunc: () => { groupings.showGroupingsModal(panda); } },
       {type:"item", label:"Create by Selection", menuFunc: () => { groupings.createInstant(panda,true); } },
       {type:"item", label:"Create Instantly", menuFunc: () => { groupings.createInstant(panda); } },
       {type:"item", label:"Edit", menuFunc: () => { groupings.showGroupingsModal(panda); } }]);
    this.addSubMenu(topMenu, "1", "Change timer to the Main Timer", () => { panda.portPanda.postMessage({command:"setTimer", timer:globalOpt.getTimer1()}); }, "",
      [{type:"item", label:"Edit Timers", menuFunc: () => { globalOpt.showTimerOptions(); } }, {type:"item", label:"Increase by 5ms"}, {type:"item", label:"Decrease by 5ms"}, {type:"item", label:"Reset Timers"}],
      "2", () => { panda.portPanda.postMessage({command:"setTimer", timer:globalOpt.getTimer2()}); },
      "3", () => { panda.portPanda.postMessage({command:"setTimer", timer:globalOpt.getTimer3()}); });
    this.addSubMenu(topMenu, "Options", "Change Global, Alarms or timer Options ", function() { globalOpt.showGeneralOptions(); }, "", [{type:"item", label:"General", menuFunc:() => { globalOpt.showGeneralOptions(); }}, {type:"item", label:"Edit Timers", menuFunc:function() { globalOpt.showTimerOptions(); }}, {type:"item", label:"Edit Alarms", menuFunc:() => { panda.modal.showAlarmOptions(); }}]);
  }
  createQuickMenu() {
    const quickMenu = $(`<div class="btn-group text-left w-100 py-1" role="group"></div>`).appendTo($(`#${this.quickMenuId}`));
    const group = $(`<div class="btn-group py-0 my-0"></div>`).appendTo(quickMenu);
    this.addMenu(group, "Pause", () => { panda.portPanda.postMessage({command:"pauseToggle"}); }, "Pause Timer.");
    this.addMenu(group, "Start Group", () => { groupings.showGroupingsModal(panda); } );
    this.addMenu(group, "Stop All", () => { panda.portPanda.postMessage({command:"stopAll"}); }, "Stop All Collecting Panda's");
    this.addMenu(group, "Add Job", () => { panda.modal.showJobAddModal(panda); }, "Add a Panda Job");
    this.addSeparator(group, " - ");
    this.addMenu(group, "Reset Timer", () => {} );
    this.addMenu(group, "Search Jobs", () => { panda.showJobsModal(); }, "Search the Panda Jobs Added" );
    this.addMenu(group, "Search Mturk", () => {} );
  }
  showQuickMenu() { $(`#${this.quickMenuId}`).show(); }
  hideQuickMenu() { $(`#${this.quickMenuId}`).hide(); }
}