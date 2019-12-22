class ModalClass {
	constructor(attached) {
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
    this.attached = attached;
    this.tempObject =  null;
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
  showModal(cancelFunc=null, doAfter=null) {
    const idName = this.modals.slice(-1)[0];
    $(`#${idName}`).modal({backdrop:"static", keyboard:false});
    $(`.modal-backdrop`).each( (index, element) => { $(element).css("zIndex",1050+(index*2)).css("opacity",0.8); } );
    $(`#${idName}`).on('hide.bs.modal', {attached:this.attached}, (e) => {
      e.data.attached.modalClosed(); this.tempObject = {};
      if ( (document.activeElement.innerText==="Cancel" || document.activeElement.innerText==="Close") && cancelFunc!==null ) cancelFunc.apply();
      $(e.target).remove();
      this.modals.pop();
    });
    if (doAfter) $(`#${idName}`).on('shown.bs.modal', () => { doAfter.apply(); });
  }
  closeModal() { const idName = this.modals.slice(-1)[0]; $(`#${idName}`).modal("hide"); }
  isPopup(obj, again) { // workaround for popup unload not working when crossed domains
    if (!obj.popup.window) { $(`#${obj.idName}`).modal('hide'); }
    else if (again) setTimeout(obj.isPopup, 500, obj, true);
  }
  prepareModal(dataObject, width, addHeaderClass, title, body, bodyClass, footerClass, saveButton="invisible", saveText="Save", saveFunc=null, noButton="invisible", noText="No", noFunc=null, cancelButton="invisible", cancelText="Cancel") {
    const idName = this.createModal();
    this.buttonPressed = "Cancel"; this.tempObject = Object.assign({}, dataObject);
    $(`#${idName}`).unbind('hide.bs.modal').unbind('shown.bs.modal')
    $(`#${idName} .${this.classModalDialog}`).css("maxWidth",width);
    $(`#${idName} .${this.classModalHeader}`).css("maxWidth",width).addClass(addHeaderClass);
    $(`#${idName} .${this.classModalTitle}`).html(title);
    $(`#${idName} .${this.classModalBody}`).addClass(bodyClass).html(body);
    $(`#${idName} .${this.classModalFooter}`).addClass(footerClass);
    $(`#${idName} .${this.classSaveButton}`).removeClass("invisible visible").addClass(saveButton).html(saveText).unbind('click').click( () => { this.buttonPressed="save"; saveFunc.apply(this, [this.tempObject]); });
    $(`#${idName} .${this.classNoButton}`).removeClass("invisible visible").addClass(noButton).html(noText).unbind('click').click( () => { this.buttonPressed="no"; noFunc.apply();});
    $(`#${idName} .${this.classCancelButton}`).removeClass("invisible visible").addClass(cancelButton).html(cancelText);
    return idName;
  }
  showLoggedOffModal() {
    const idName = this.prepareModal(null, "600px", "modal-header-warning", "Program Paused!", "<h3>Not Logged In to Mturk!</h3><h4>Please log back in by clicking link below.</h4><h5><a href='https://worker.mturk.com/' target='_blank' title='https://worker.mturk.com/' class='pcm_mturkLink'>https://worker.mturk.com/</a></h5>", "text-center");
    this.showModal();
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
  showDetailsModal(hitDetails, successFunc) {
    const idName = this.prepareModal(hitDetails, "700px", "modal-header-info modal-lg", "Details for a hit", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save New Details", successFunc, "invisible", "No", null, "visible btn-sm", "Cancel");
    const modalBody = $(`#${idName} .${this.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Limit # of GroupID in queue:", type:"range", key:"limitNumQueue", min:0, max:24 }, 
      { label:"Limit # of total Hits in queue:", type:"range", key:"limitTotalQueue", min:0, max:24 }, 
      { label:"Accept Only Once:", type:"trueFalse", key:"once" }, 
      { label:"Hits # Accepted Limit:", type:"text", key:"acceptLimit" }, 
      { label:"Stop Collecting After Minutes:", type:"text", key:"duration" }, 
      { label:"Force Delayed Ham on Collect:", type:"trueFalse", key:"autoGoHam" }, 
      { label:"Force Delayed Ham Duration:", type:"text", key:"hamDuration" }, 
      { label:"Friendly Requester Name:", type:"text", key:"friendlyReqName" }, 
      { label:"Friendly Hit Title:", type:"text", key:"friendlyTitle" }, 
      { label:"Requester Name:", type:"text", key:"reqName" }, 
      { label:"Requester ID", type:"text", key:"reqId" }, 
      { label:"Group ID", type:"text", key:"groupId", disable:true }, 
      { label:"Title", type:"text", key:"title", disable:true }, 
      { label:"Description", type:"text", key:"description", disable:true }, 
      { label:"Price", type:"text", key:"price", disable:true }, 
      { label:"Assigned Time", type:"text", key:"assignedTime", disable:true }, 
      { label:"Expires", type:"text", key:"expires", disable:true }, 
      { label:"Date Added", type:"text", key:"dateAdded", disable:true, format:"date" }, 
      { label:"Number of Seconds Collecting", type:"text", key:"limitNumQueue", disable:true }
    ], divContainer, this.tempObject, true);
    this.showModal();
  }
  showJobsTable(modalBody, jobs) {
    const divContainer = $(`<table class="table table-dark table-hover table-sm table-moreCondensed pcm_jobTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    jobs.forEach(myId => {
      const status = (this.attached.pandaStats[myId].collecting) ? "On" : "Off";
      displayObjectData1([
        { string:"", type:"checkbox", width:"20px", unique:myId, inputClass:" pcm_checkbox"},
        { string:"Requester Name", type:"keyValue", key:"reqName", orKey:"friendlyReqName", width:"155px", id:`pcm_RQN_${myId}` },
        { string:"Hit Title", type:"keyValue", key:"title", orKey:"friendlyTitle", id:`pcm_TTL_${myId}` },
        { string:"Pay", type:"keyValue", key:"price", pre:"$", width:"45px", id:`pcm_Pay_${myId}` },
        { label:"Collect", type:"button", addClass:` btn-xxs pcm_button${status}`, width:"65px", unique:myId, btnFunc: (e) => {
            $(`#pcm_collectButton_${e.data.unique}`).click();
          }},
        { label:"Details", type:"button", addClass:" btn-xxs", width:"65px", unique:myId, btnFunc: (e) => { 
            const myId = e.data.unique;
            this.showDetailsModal(this.attached.pandaObjs[myId], (changedDetails) => {
              this.attached.pandaObjs[myId] = Object.assign(this.attached.pandaObjs[myId], changedDetails);
              this.attached.pandaCard[myId].updateAllCardInfo();
              modal.closeModal();
              $(`#pcm_RQN_${myId}`).text( (changedDetails.friendlyReqName!=="") ? changedDetails.friendlyReqName : changedDetails.reqName );
              $(`#pcm_TTL_${myId}`).text( (changedDetails.friendlyTitle!=="") ? changedDetails.friendlyTitle : changedDetails.title );
              $(`#pcm_Pay_${myId}`).text(changedDetails.price);
            });
          }}
      ], divContainer, this.attached.pandaObjs[myId], true, true);
    });
  }
  jobsFilter(search, modalControl) {
    return this.attached.pandaUniques.filter( (myId) => {
      const value = this.attached.pandaObjs[myId];
      const stats = this.attached.pandaStats[myId];
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
  showJobsModal() {
    const idName = this.prepareModal(null, "1000px", "modal-header-info modal-lg", "List Jobs", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "invisible", "Close");
    const modalBody = $(`#${idName} .${this.classModalBody}`); $(modalBody).addClass("pcm_jobsModalBody");
    const modalControl = $(`<div class="pcm_modalControl w-100"></div>`).insertBefore(modalBody);
    const radioGroup = $(`<div class="text-center"></div>`).appendTo(modalControl);
    radioButtons(radioGroup, "theJobs", "0", "All Jobs", true); radioButtons(radioGroup, "theJobs", "1", "Collecting");
    radioButtons(radioGroup, "theJobs", "2", "Not Collecting"); radioButtons(radioGroup, "theJobs", "3", "Searching Mode");
    radioButtons(radioGroup, "theJobs", "4", "Only Once");
    const inputControl = createInput(modalControl, "", "pcm_searchJobs", "Search phrase: ", "example: receipts", (e) => {
      $(e.target).closest(".pcm_modalControl").find(".pcm_searchingJobs").click();
    }, " pl-5");
    $(`<button class="btn btn-xxs btn-primary ml-1 pcm_searchingJobs">Search</button>`).click( (e) => {
      $(modalBody).find(".pcm_jobTable").remove();
      this.showJobsTable(modalBody, this.jobsFilter($("#pcm_searchJobs").val(), modalControl));
    }).appendTo(inputControl);
    $(`<button class="btn btn-xxs btn-danger ml-1">Delete Selected</button>`).click( (e) => {
      const selected = $(modalBody).find(`.pcm_checkbox:checked`).map((_,element) => { 
        return Number($(element).val()); }).get();
      if (selected.length) this.attached.removeJobs(selected, () => {
          $(modalBody).find(".pcm_jobTable").remove();
          this.showJobsTable(modalBody, this.jobsFilter($("#pcm_searchJobs").val(), modalControl));
        });
    }).appendTo(inputControl);
    $(modalControl).find("input:radio[name='theJobs']").click( (e) => {
      $(e.target).closest(".pcm_modalControl").find(".pcm_searchingJobs").click();
    } )
    this.showJobsTable(modalBody, this.jobsFilter("", modalControl));
    this.showModal();
  }
  showGroupingsModal(groupings) {
    const idName = this.prepareModal(null, "1000px", "modal-header-info modal-lg", "List Groupings", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "invisible", "Close");
    const modalBody = $(`#${idName} .${this.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    Object.keys(groupings).forEach(grouping => {
      displayObjectData1([
        { string:`Grouping Name and Description`, type:"keyValue", key:"name", andKey:"description" },
        { label:"Edit", type:"button", addClass:" btn-xxs", width:"45px", data:1, btnFunc: (e) => { console.log($(e.target).data("data1")); } },
        { label:"Del", type:"button", addClass:" btn-xxs", width:"45px", data:1, btnFunc: (e) => { console.log($(e.target).data("data1")); } }
      ], divContainer, groupings[grouping], true, true);
      });
    this.showModal();
  }
  showGeneralOptions() {
    const idName = this.prepareModal(null, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "visible btn-sm", "Close");
    const modalBody = $(`#${idName} .${this.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"range", key:"limitNumQueue", min:0, max:24 }, 
      { label:"Disable Captcha Alert:", type:"range", key:"limitTotalQueue", min:0, max:24 }, 
      { label:"Show Captcha Counter Text:", type:"trueFalse", key:"once" }, 
      { label:"Captcha shown after #hits:", type:"text", key:"acceptLimit" }, 
      { label:"Disable Queue Watch Alert:", type:"text", key:"duration" }, 
      { label:"Disable Dekstop Notifications:", type:"trueFalse", key:"autoGoHam" }, 
      { label:"Show Unfocused window warning:", type:"text", key:"hamDuration" }
    ], divContainer, this.tempObject, true);
    this.showModal();
  }
  showTimerOptions() {
    const idName = this.prepareModal(null, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "visible btn-sm", "Close");
    const modalBody = $(`#${idName} .${this.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"range", key:"limitNumQueue", min:0, max:24 }, 
      { label:"Disable Captcha Alert:", type:"range", key:"limitTotalQueue", min:0, max:24 }, 
      { label:"Show Captcha Counter Text:", type:"trueFalse", key:"once" }, 
      { label:"Captcha shown after #hits:", type:"text", key:"acceptLimit" }, 
      { label:"Disable Queue Watch Alert:", type:"text", key:"duration" }, 
      { label:"Disable Dekstop Notifications:", type:"trueFalse", key:"autoGoHam" }, 
      { label:"Show Unfocused window warning:", type:"text", key:"hamDuration" }
    ], divContainer, this.tempObject, true);
    this.showModal();
  }
  showAlarmOptions() {
    const idName = this.prepareModal(null, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "visible btn-sm", "Close");
    const modalBody = $(`#${idName} .${this.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"range", key:"limitNumQueue", min:0, max:24 }, 
      { label:"Disable Captcha Alert:", type:"range", key:"limitTotalQueue", min:0, max:24 }, 
      { label:"Show Captcha Counter Text:", type:"trueFalse", key:"once" }, 
      { label:"Captcha shown after #hits:", type:"text", key:"acceptLimit" }, 
      { label:"Disable Queue Watch Alert:", type:"text", key:"duration" }, 
      { label:"Disable Dekstop Notifications:", type:"trueFalse", key:"autoGoHam" }, 
      { label:"Show Unfocused window warning:", type:"text", key:"hamDuration" }
    ], divContainer, this.tempObject, true);
    this.showModal();
  }
  showInputModal(contents, addFunc, doAfter) {
    const idName = this.prepareModal(null, "700px", "modal-header-info modal-lg", "Add new Panda Info", "<h4>Enter New Panda Information. [GroupID is mandatory]</h4>", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Add new Panda Info", addFunc, "invisible", "No", null, "visible btn-sm", "Cancel");
    $(`#${idName} .${this.classModalBody}`).append(contents);
    this.showModal(null, doAfter);
  }
}