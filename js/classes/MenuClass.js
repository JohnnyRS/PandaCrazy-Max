class MenuClass {
  constructor(id, pandaObj) {
    this.quickMenuId = id;
    this.pandaObj = pandaObj;

    this.createQuickMenu();
    this.showQuickMenu();
  }
  menuAddJob() {

  }
  addMenu(appendHere, label, btnFunc) {
    $(`<button type="button" class="btn text-dark btn-xs border-danger ml-1 pcm-quickBtn">${label}</button>`).click( (e) => {
      btnFunc.apply(this);
    } ).appendTo(appendHere);
  }
  addSeparator(appendHere, text) { $(`<span class="mx-2">${text}</span>`).appendTo(appendHere); }
  createQuickMenu() {
    const quickMenu = $(`<div class="btn-group text-left w-100 py-1" role="group"></div>`).appendTo($(`#${this.quickMenuId}`));
    const group = $(`<div class="btn-group py-0 my-0"></div>`).appendTo(quickMenu);
    this.addMenu(group, "Pause", (e) => {} );
    this.addMenu(group, "Start Group", (e) => {} );
    this.addMenu(group, "Stop All", (e) => {} );
    this.addMenu(group, "Add Job", (e) => {
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
        } else if (gId in this.pandaObj.pandaGroupIds && !$(div).find('.pcm_inputError:first').data("gIdDup")) {
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
          const currentTab = this.pandaObj.tabsObj.currentTab;
          modal.closeModal();
          const myId = this.pandaObj.addPanda(groupId, description, title, reqId, reqName, pay, once, 0, 0, false, 4000, -1, 0, 0, currentTab);
          if (startNow) this.pandaObj.startCollecting(myId);
        }
      }, () => { $(`#pcm_formAddGroupID`).focus(); });
    });
    this.addSeparator(group, " - ");
    this.addMenu(group, "Reset Timer", (e) => {} );
    this.addMenu(group, "Search Jobs", (e) => {} );
    this.addMenu(group, "Search Mturk", (e) => {} );
  }
  showQuickMenu() { $(`#${this.quickMenuId}`).show(); }
  hideQuickMenu() { $(`#${this.quickMenuId}`).hide(); }
}