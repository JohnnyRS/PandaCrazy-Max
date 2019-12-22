class MenuClass {
  constructor(id, pandaClass) {
    this.quickMenuId = id;
    this.topMenuId = "pcm_topMenu";
    this.pandaClass = pandaClass;

    this.createTopMenu();
    this.createQuickMenu();
    this.showQuickMenu();
  }
  addJobAction() {
    const div = $(`<div><div class="pcm_inputError"></div></div>`);
    createInput(div, "", "pcm_formAddGroupID", "* Group ID: ", "example: 30B721SJLR5BYYBNQJ0CVKKCWQZ0OI");
    createCheckBox(div, "Start Collecting", "pcm_startCollecting", "", true);
    createCheckBox(div, "Collect Only Once", "pcm_onlyOnce", "");
    createInput(div, " pt-3 border-top border-info", "pcm_formReqName", "Requester Name: ", "default: group ID shown");
    createInput(div, "", "pcm_formAddReqID", "Requester ID: ", "example: AGVV5AWLJY7H2");
    createInput(div, "", "pcm_formAddTitle", "Title: ", "default: group ID shown");
    createInput(div, "", "pcm_formAddDesc", "Description: ", "default: group ID shown");
    createInput(div, "", "pcm_formAddPay", "Pay Amount: ", "default: 0.00");
    modal.showInputModal( div, () => {
      const gId = $(`#pcm_formAddGroupID`).val();
      if (gId === "") {
        $(`label[for='pcm_formAddGroupID'`).css('color', 'red');
        $(div).find('.pcm_inputError:first').html("Must fill in GroupID!").data("gIdEmpty",true);
      } else if (gId in this.pandaClass.pandaGroupIds && !$(div).find('.pcm_inputError:first').data("gIdDup")) {
        $(`label[for='pcm_formAddGroupID'`).css('color', 'yellow');
        $(div).find('.pcm_inputError:first').html("GroupID already added. Still want to add?").data("gIdDup",true);
      } else {
        const groupId = $(`#pcm_formAddGroupID`).val();
        const reqName = ($(`#pcm_formReqName`).val()) ? $(`#pcm_formReqName`).val() : groupId;
        const reqId = $(`#pcm_formAddReqID`).val();
        const title = ($(`#pcm_formAddTitle`).val()) ? $(`#pcm_formAddTitle`).val() : groupId;
        const description = ($(`#pcm_formAddDesc`).val()) ? $(`#pcm_formAddDesc`).val() : groupId;
        const pay = ($(`#pcm_formAddPay`).val()) ? $(`#pcm_formAddPay`).val() : "0.00";
        const startNow = $(`#pcm_startCollecting`).is(':checked');
        const once = $(`#pcm_onlyOnce`).is(':checked'); 
        const currentTab = this.pandaClass.tabsObj.currentTab;
        modal.closeModal();
        const myId = this.pandaClass.addPanda(groupId, description, title, reqId, reqName, pay, once, 0, 0, false, 4000, -1, 0, 0, currentTab);
        if (startNow) this.pandaClass.startCollecting(myId);
      }
    }, () => { $(`#pcm_formAddGroupID`).focus(); });
  }
  addMenu(appendHere, label, btnFunc) {
    $(`<button type="button" class="btn text-dark btn-xs border-danger ml-1 pcm-quickBtn">${label}</button>`).click( (e) => {
      btnFunc.apply(this, e);
    } ).appendTo(appendHere);
  }
  addSeparator(appendHere, text) { $(`<span class="mx-2">${text}</span>`).appendTo(appendHere); }
  addSubMenu(appendHere, label, labelFunc, dropdownStyle, dropdownInfo, label2=null, label2Func, label3=null, label3Func) {
    const btnGroup = $(`<div class="btn-group py-0"></div>`).appendTo(appendHere);
    $(`<button type="button" class="btn text-dark border-danger btn-xs pcm-topMenuBtn">${label}</button>`).click( (e) => { labelFunc.apply(this, [e]); } ).appendTo(btnGroup);
    if (label2) $(`<button type="button" class="btn text-dark border-danger btn-xs pcm-topMenuBtn">${label2}</button>`).appendTo(btnGroup);
    if (label3) $(`<button type="button" class="btn text-dark border-danger btn-xs pcm-topMenuBtn">${label3}</button>`).appendTo(btnGroup);
    $(`<button type="button" class="btn btn-primary-dark btn-xs dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>`).append($(`<span class="sr-only">Toggle Dropdown</span>`)).appendTo(btnGroup);
    const dropdownMenu = $(`<div class="dropdown-menu pcm_dropdownMenu" style="${dropdownStyle}"></div>`).appendTo(btnGroup);
    dropdownInfo.forEach( (info) => {
      if (info.type==="item") {
        const item = $(`<a class="dropdown-item" href="#">${info.label}</a>`).appendTo(dropdownMenu);
        if (info.menuFunc) $(item).click( (e) => { info.menuFunc.apply(this, [e]) });
      } else if (info.type==="rangeMax") $(`<label for="max">${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type==="rangeMin") $(`<label for="min">${info.label}</label>`).appendTo(dropdownMenu);
      else if (info.type==="slider") $(`<div id="${info.id}" class="text-center"></div>`).slider({orientation:"vertical", range:"min", min:info.min, max:info.max, value:info.value, step:info.step, create: (e, ui) => { info.createFunc.apply(this, [e, ui]); }, slide: (e, ui) => { info.slideFunc.apply(this, [e, ui]); }}).appendTo(dropdownMenu);
      else if (info.type==="divider") $(`<div class="dropdown-divider"></div>`).appendTo(dropdownMenu);
    });
  }
  createTopMenu() {
    const topMenu = $(`<div class="btn-group text-left border border-info" id="pcm_topMenuGroup" role="group"></div>`).appendTo($(`#${this.topMenuId}`));
    this.addSubMenu(topMenu, "Vol:", () => {}, "min-width:3rem; text-align:center;", [{type:"rangeMax", label:"100"}, {type:"slider", id:"pcm_volumeVertical", min:0, max:100, value:50, step:10, slideFunc: (e, ui) => { $(e.target).find(".ui-slider-handle").text(ui.value); }, createFunc: (e, ui) => { $(e.target).find(".ui-slider-handle").text(50).css({left: "-.5em", width: "30px"}); }}, {type:"rangeMin", label:"0"}]);
    this.addSubMenu(topMenu, "Jobs", function() { modal.showJobsModal(); }, "", 
      [{type:"item", label:"Add", menuFunc:this.addJobAction},
       {type:"item", label:"Stop All", menuFunc: () => { this.pandaClass.portPanda.postMessage({command:"stopAll"}); }},
       {type:"item", label:"Search Jobs", menuFunc: () =>{ modal.showJobsModal(); }},
       {type:"item", label:"Search Mturk"},
       {type:"divider"}, {type:"item", label:"Export"}, {type:"item", label:"Import"}]);
    this.addSubMenu(topMenu, "Display", () => {}, "", [{type:"item", label:"Normal"}, {type:"item", label:"Minimal Info"}, {type:"item", label:"One Line Info"}]);
    this.addSubMenu(topMenu, "Grouping", function() { modal.showGroupingsModal(groupings.groupings); }, "", [{type:"item", label:"Start/Stop"}, {type:"item", label:"Create by Selection"}, {type:"item", label:"Create Instantly"}, {type:"item", label:"Edit"}]);
    this.addSubMenu(topMenu, "1", () => {}, "", [{type:"item", label:"Edit Timers"}, {type:"item", label:"Increase by 5ms"}, {type:"item", label:"Decrease by 5ms"}, {type:"item", label:"Reset Timers"}], "2", null, "3", null);
    this.addSubMenu(topMenu, "Options", function() { modal.showGeneralOptions(); }, "", [{type:"item", label:"General", menuFunc:function() { modal.showGeneralOptions(); }}, {type:"item", label:"Edit Timers", menuFunc:function() { modal.showTimerOptions(); }}, {type:"item", label:"Edit Alarms", menuFunc:function() { modal.showAlarmOptions(); }}]);
  }
  createQuickMenu() {
    const quickMenu = $(`<div class="btn-group text-left w-100 py-1" role="group"></div>`).appendTo($(`#${this.quickMenuId}`));
    const group = $(`<div class="btn-group py-0 my-0"></div>`).appendTo(quickMenu);
    this.addMenu(group, "Pause", () => { this.pandaClass.portPanda.postMessage({command:"pauseToggle"}); });
    this.addMenu(group, "Start Group", (e) => {} );
    this.addMenu(group, "Stop All", () => { this.pandaClass.portPanda.postMessage({command:"stopAll"}); });
    this.addMenu(group, "Add Job", this.addJobAction);
    this.addSeparator(group, " - ");
    this.addMenu(group, "Reset Timer", (e) => {} );
    this.addMenu(group, "Search Jobs", (e) => {} );
    this.addMenu(group, "Search Mturk", (e) => {} );
  }
  showQuickMenu() { $(`#${this.quickMenuId}`).show(); }
  hideQuickMenu() { $(`#${this.quickMenuId}`).hide(); }
}