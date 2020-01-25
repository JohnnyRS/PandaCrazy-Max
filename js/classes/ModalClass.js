class ModalClass {
	constructor() {
    this.idName = "pcm_modal";
    this.modals = [];
    this.classModalDialog = "modal-dialog";
    this.classModalHeader = "modal-header";
    this.classModalTitle = "modal-title";
    this.classModalBody = "modal-body";
    this.classModalFooter = "modal-footer";
    this.classSaveButton = "pcm_modalSave";
    this.classNoButton = "pcm_modalNo";
    this.classCancelButton = "pcm_modalCancel";
    this.buttonPressed = "Cancel";
    this.popup = null;
    this.tempObject =  [];
    this.theSpan = null;
  }
  createModal() {
    const count = this.modals.length, backdrop = (count>0) ? ` data-backdrop="static"` : ``;
    const style = ` style="z-index:${1051+(count*2)}"`;
    const idName = `${this.idName}_${count}`;
    this.modals.push(idName);
    const modalHeader = $(`<div class="modal-header"><h4 class="modal-title"></h4><button type="button" class="close" data-dismiss="modal">&times;</button></div>`);
    const modalFooter = $(`<div class="modal-footer"><button type="button" class="btn btn-success pcm_modalSave">Save</button><button type="button" class="btn btn-info pcm_modalNo" data-dismiss="modal">No</button><button type="button" class="btn btn-danger pcm_modalCancel" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-default pcm_modalClose" data-dismiss="modal">Close</button></div>`);
    const modalContent = $(`<div class="modal-content"></div>`).append(modalHeader, `<div class="modal-body text-center py-2"></div>`, modalFooter);
    $(`<div id=${idName} class="modal pcm_modal fade" tabindex="-1" role="dialog"${backdrop}${style}></div>`).append($(`<div class="modal-dialog my-3"></div>`).append(modalContent)).appendTo("body");
    return idName;
  }
  showModal(cancelFunc=null, doAfter=null, afterClose=null) {
    const idName = this.modals.slice(-1)[0];
    $(`#${idName}`).modal({backdrop:"static", keyboard:false});
    $(`.modal-backdrop`).each( (index, element) => { $(element).css("zIndex",1050+(index*2)).css("opacity",0.8); } );
    $(`#${idName}`).on('hide.bs.modal', (e) => {
      this.tempObject = [];
      if ( (document.activeElement.innerText==="Cancel" || document.activeElement.innerText==="Close") && cancelFunc!==null ) cancelFunc.apply();
      if (afterClose!==null) afterClose.apply();
      $(e.target).remove();
      this.modals.pop();
    });
    if (doAfter) $(`#${idName}`).on('shown.bs.modal', () => { doAfter.apply(); });
  }
  closeModal(title="") {
    let foundTitle = -1;
    if (title!=="") {
      this.modals.forEach( (idName, index) => { console.log($(`#${idName} .modal-title:first`).text());
        if ($(`#${idName} .modal-title:first`).text() === title) foundTitle=index;
      });
    }
    console.log(foundTitle);
    const idName = this.modals.slice(foundTitle)[0];
    $(`#${idName}`).modal("hide"); 
    delete this.tempObject[idName];
  }
  isPopup(obj, again) { // workaround for popup unload not working when crossed domains
    if (!obj.popup.window) { $(`#${obj.idName}`).modal('hide'); }
    else if (again) setTimeout(obj.isPopup, 500, obj, true);
  }
  prepareModal(dataObject, width, addHeaderClass, title, body, bodyClass, footerClass, saveButton="invisible", saveText="Save", saveFunc=null, noButton="invisible", noText="No", noFunc=null, cancelButton="invisible", cancelText="Cancel") {
    const idName = this.createModal();
    this.buttonPressed = "Cancel"; this.tempObject[idName] = Object.assign({}, dataObject);
    $(`#${idName}`).unbind('hide.bs.modal').unbind('shown.bs.modal').unbind('hidden.bs.modal');
    $(`#${idName} .${this.classModalDialog}`).css("maxWidth",width);
    $(`#${idName} .${this.classModalHeader}`).css("maxWidth",width).addClass(addHeaderClass);
    $(`#${idName} .${this.classModalTitle}`).html(title);
    $(`#${idName} .${this.classModalBody}`).addClass(bodyClass).html(body);
    $(`#${idName} .${this.classModalFooter}`).addClass(footerClass);
    $(`#${idName} .${this.classSaveButton}`).removeClass("invisible visible").addClass(saveButton).html(saveText).unbind('click').click( () => { this.buttonPressed="save"; if (saveFunc!==null) saveFunc.apply(this, [this.tempObject[idName]]); });
    $(`#${idName} .${this.classNoButton}`).removeClass("invisible visible").addClass(noButton).html(noText).unbind('click').click( () => { this.buttonPressed="no"; noFunc.apply();});
    $(`#${idName} .${this.classCancelButton}`).removeClass("invisible visible").addClass(cancelButton).html(cancelText);
    return idName;
  }
  showLoggedOffModal(afterClose=null) {
    const idName = this.prepareModal(null, "600px", "modal-header-warning", "Program Paused!", "<h3>Not Logged In to Mturk!</h3><h4>Please log back in by clicking link below.</h4><h5><a href='https://worker.mturk.com/' target='_blank' title='https://worker.mturk.com/' class='pcm_mturkLink'>https://worker.mturk.com/</a></h5>", "text-center");
    this.showModal(null, null, afterClose);
    $(`#${idName} .pcm_mturkLink`).click( {popup:this.popup, idName:idName}, (e) => {
      e.preventDefault();
      this.popup = window.open( $(e.target).attr('href'), "_blank", "width=" + 1000 + ",height=" +  800 + ",scrollbars=yes,toolbar=yes,menubar=yes,location=yes" );
      setTimeout(this.isPopup, 500, this, true); // check if popup is null continously
    } )
  }
  showDeleteModal(hitDetails, deleteFunc, noFunc, cancelFunc) {
    const idName = this.prepareModal(null, "600px", "modal-header-danger modal-lg", "Deleting a Panda Hit!", `<h4>Are you sure you want me to delete this job?</h4><h5 class="text-primary">${hitDetails}</h5>`, "text-center", "", "visible", "Yes", deleteFunc, "visible", "No", noFunc, "visible", "Cancel");
    this.showModal(cancelFunc);
    $(`#${idName}`).on("keypress", (e) => { if (e.which == 13) { this.closeModal(); deleteFunc.apply(); } })
  }
  showJobsTable(panda, modalBody, jobs, checkboxFunc=null) {
    const divContainer = $(`<table class="table table-dark table-hover table-sm table-moreCondensed pcm_jobTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([ { string:"", type:"string" }, {string:"Requester Name", type:"string", noBorder:true}, {string:"Title", type:"string", noBorder:true}, {string:"Pay", type:"string", noBorder:true}, {string:"", type:"string"}, {string:"", type:"string"} ], divContainer, panda.info, true, true, "#0b716c");
    jobs.forEach(myId => {
      const status = (panda.pandaStats[myId].collecting) ? "On" : "Off";
      displayObjectData([
        { string:"", type:"checkbox", width:"20px", unique:myId, inputClass:" pcm_checkbox", btnFunc:checkboxFunc },
        { string:"Requester Name", type:"keyValue", key:"reqName", orKey:"friendlyReqName", width:"155px", id:`pcm_RQN_${myId}` },
        { string:"Hit Title", type:"keyValue", key:"title", orKey:"friendlyTitle", id:`pcm_TTL_${myId}` },
        { string:"Pay", type:"keyValue", key:"price", pre:"$", width:"45px", id:`pcm_Pay_${myId}` },
        { label:"Collect", type:"button", addClass:` btn-xxs pcm_button${status}`, idStart:"pcm_collectButton1", width:"62px", unique:myId, btnFunc: (e) => {
            $(`#pcm_collectButton_${e.data.unique}`).click();
          }},
        { label:"Details", type:"button", addClass:" btn-xxs", idStart:"pcm_detailsButton1_", width:"62px", unique:myId, btnFunc: (e) => { 
            const myId = e.data.unique;
            panda.pandaCard[myId].showDetailsModal(panda, (changes) => {
              $(`#pcm_RQN_${myId}`).text( (changes.friendlyReqName!=="") ? changes.friendlyReqName : changes.reqName );
              $(`#pcm_TTL_${myId}`).text( (changes.friendlyTitle!=="") ? changes.friendlyTitle : changes.title );
              $(`#pcm_Pay_${myId}`).text(changes.price);
            });
          }}
      ], divContainer, panda.info[myId], true, true);
    });
  }
  jobsFilter(panda, search, modalControl) {
    return panda.pandaUniques.filter( (myId) => {
      const value = panda.info[myId];
      const stats = panda.pandaStats[myId];
      let good = false;
      const radioChecked = $(modalControl).find(`input[name='theJobs']:checked`).val();
      if (radioChecked==="0") good = true;
      else if (radioChecked==="1" && stats.collecting) good = true;
      else if (radioChecked==="2" && !stats.collecting) good = true;
      else if (radioChecked==="4" && value.once) good = true;
      if (good && search!=="" && (value.title.includes(search) || value.reqName.includes(search))) good = true;
      else if (good && search!=="") good = false;
      return good;
    } )
  }
  showJobsModal(panda, type="jobs", thisUnique=-1, thisObj=null, thisSaveFunc=null, thisCheckFunc=null, cancelFunc=null) {
    const theTitle = (type==="groupingEdit") ? "Edit Groupings" : "List Jobs";
    const saveBtnStatus = (type==="groupingEdit") ? "visible btn-sm" : "invisible";
    const idName = this.prepareModal(thisObj, "1000px", "modal-header-info modal-lg", theTitle, "", "text-right bg-dark text-light", "modal-footer-info", saveBtnStatus, "Save Groupings", thisSaveFunc, "invisible", "No", null, "invisible", "Close");
    const addClass = (type === "groupingEdit") ? "pcm_groupingsEditModalBody" : "pcm_jobsModalBody";
    const modalBody = $(`#${idName} .${this.classModalBody}`); $(modalBody).addClass(addClass);
    const modalControl = $(`<div class="pcm_modalControl w-100"></div>`).insertBefore(modalBody);
    if (type==="groupingEdit") {
      $(`<div class="small text-warning font-weight-bold"></div>`).append("Select the jobs you want in this grouping below:").appendTo(modalControl);
      createInput(modalControl, "", "pcm_groupingNameI", "Grouping Name: ", `default: Grouping #${thisUnique}`, null, " pl-5 text-warning", this.tempObject[idName].name).append(`<span class="ml-2 small text-info pcm_jobsInGroup">Jobs in Group: ${Object.keys(thisObj.group).length}</span>`);
      createInput(modalControl, " border-bottom", "pcm_groupingDescI", "Description: ", `default: no description`, null, " pl-5 text-warning", this.tempObject[idName].description);
    }
    const radioGroup = $(`<div class="text-center"></div>`).appendTo(modalControl);
    radioButtons(radioGroup, "theJobs", "0", "All Jobs", true); 
    if (type === "jobs") radioButtons(radioGroup, "theJobs", "1", "Collecting");
    if (type === "jobs") radioButtons(radioGroup, "theJobs", "2", "Not Collecting");
    radioButtons(radioGroup, "theJobs", "3", "Searching Mode");
    radioButtons(radioGroup, "theJobs", "4", "Only Once");
    const inputControl = createInput(modalControl, "", "pcm_searchJobs", "Search phrase: ", "example: receipts", (e) => {
      $(e.target).closest(".pcm_modalControl").find(".pcm_searchingJobs").click();
    }, " pl-5");
    $(`<button class="btn btn-xxs btn-primary ml-1 pcm_searchingJobs">Search</button>`).on( 'click', (e) => {
      $(modalBody).find(".pcm_jobTable").remove();
      this.showJobsTable(panda, modalBody, this.jobsFilter(panda, $("#pcm_searchJobs").val(), modalControl), thisCheckFunc);
      if (type==="groupingEdit") Object.keys(groupings.store[thisUnique].group).forEach( (value) => { $(`#pcm_selection_${value}`).prop('checked', true); });
    }).appendTo(inputControl);
    if (type === "jobs") $(`<button class="btn btn-xxs btn-danger ml-1">Delete Selected</button>`).click( (e) => {
      const selected = $(modalBody).find(`.pcm_checkbox:checked`).map((_,element) => { 
        return Number($(element).val()); }).get();
      if (selected.length) panda.removeJobs(selected, () => {
          $(modalBody).find(".pcm_jobTable").remove();
          this.showJobsTable(panda, modalBody, this.jobsFilter(panda, $("#pcm_searchJobs").val(), modalControl));
        });
    }).appendTo(inputControl);
    $(modalControl).find("input:radio[name='theJobs']").click( (e) => {
      $(e.target).closest(".pcm_modalControl").find(".pcm_searchingJobs").click();
    } );
    this.showJobsTable(panda, modalBody, this.jobsFilter(panda, "", modalControl), thisCheckFunc);
    this.showModal(cancelFunc);
  }
  showJobAddModal(panda) {
    const idName = this.prepareModal(null, "900px", "modal-header-info modal-lg", "Add new Panda Info", "<h4>Enter New Panda Information. [GroupID is mandatory]</h4>", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Add new Panda Info", () => {
      const gId = $(`#pcm_formAddGroupID`).val();
      if (gId === "") {
        $(`label[for='pcm_formAddGroupID'`).css('color', 'red');
        $(div).find('.pcm_inputError:first').html("Must fill in GroupID or URL!").data("gIdEmpty",true);
      } else if (gId in panda.pandaGroupIds && !$(div).find('.pcm_inputError:first').data("gIdDup")) {
        $(`label[for='pcm_formAddGroupID'`).css('color', 'yellow');
        $(div).find('.pcm_inputError:first').html("GroupID already added. Still want to add?").data("gIdDup",true);
      } else {
        let groupId = null, reqId = null;
        const groupVal = $(`#pcm_formAddGroupID`).val();
        if (groupVal.includes(`://`)) [groupId, reqId] = panda.parsePandaUrl(groupVal);
        else groupId = groupVal;
        const reqName = ($(`#pcm_formReqName`).val()) ? $(`#pcm_formReqName`).val() : groupId;
        reqId = (reqId) ? reqId : $(`#pcm_formAddReqID`).val();
        const title = ($(`#pcm_formAddTitle`).val()) ? $(`#pcm_formAddTitle`).val() : groupId;
        const description = ($(`#pcm_formAddDesc`).val()) ? $(`#pcm_formAddDesc`).val() : groupId;
        const pay = ($(`#pcm_formAddPay`).val()) ? $(`#pcm_formAddPay`).val() : "0.00";
        const startNow = $(`#pcm_startCollecting`).is(':checked');
        const once = $(`#pcm_onlyOnce`).is(':checked'); 
        const currentTab = panda.tabs.currentTab;
        panda.modal.closeModal();
        if (groupId) {
          const myId = panda.addPanda(groupId, description, title, reqId, reqName, pay, once, 0, 0, false, 4000, -1, 0, 0, currentTab);
          if (startNow) panda.startCollecting(myId);
        } else if (reqId) console.log("Create Search Panda");
      }
    }, "invisible", "No", null, "visible btn-sm", "Cancel");
    const div = $(`<div><div class="pcm_inputError"></div></div>`);
    createInput(div, " pcm_inputDiv-url", "pcm_formAddGroupID", "* Group ID or URL: ", "example: 30B721SJLR5BYYBNQJ0CVKKCWQZ0OI");
    createCheckBox(div, "Start Collecting", "pcm_startCollecting", "", true);
    createCheckBox(div, "Collect Only Once", "pcm_onlyOnce", "");
    createInput(div, " pt-3 border-top border-info", "pcm_formReqName", "Requester Name: ", "default: group ID shown");
    createInput(div, "", "pcm_formAddReqID", "Requester ID: ", "example: AGVV5AWLJY7H2");
    createInput(div, "", "pcm_formAddTitle", "Title: ", "default: group ID shown");
    createInput(div, "", "pcm_formAddDesc", "Description: ", "default: group ID shown");
    createInput(div, "", "pcm_formAddPay", "Pay Amount: ", "default: 0.00");
    $(`#${idName} .${this.classModalBody}`).append(div);
    this.showModal(null, () => { $(`#pcm_formAddGroupID`).focus(); });
  }
  showDialogModal(width, title, body, addFunc, yesBtn, noBtn, doAfter=null) {
    const yesClass = (yesBtn) ? "visible btn-sm" : "invisible";
    const noClass = (noBtn) ? "visible btn-sm" : "invisible";
    const idName = this.prepareModal(null, width, "modal-header-info modal-lg", title, body, "text-right bg-dark text-light", "modal-footer-info", yesClass, "Yes", addFunc, noClass, "No");
    this.showModal(null, doAfter);
  }
}