class ModalClass {
	constructor(attached) {
    this.idName = "pcm_modal";
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
  showModal(cancelFunc=null) {
    $(`#${this.idName}`).modal({backdrop:"static", keyboard:false});
    $(`#${this.idName}`).on('hide.bs.modal', {attached:this.attached,button:this.buttonPressed}, function (event) {
      event.data.attached.modalClosed(); this.tempObject = {};
      if ( (document.activeElement.innerText==="Cancel" || document.activeElement.innerText==="Close") && cancelFunc!==null ) cancelFunc.apply();
    });
  }
  closeModal() { $(`#${this.idName}`).modal("hide"); }
  isPopup(obj, again) { // workaround for popup unload not working when crossed domains
    if (!obj.popup.window) { $(`#${obj.idName}`).modal('hide'); }
    else if (again) setTimeout(obj.isPopup, 500, obj, true);
  }
  prepareModal(dataObject, width, addHeaderClass, title, body, bodyClass, footerClass, saveButton="invisible", saveText="Save", saveFunc=null, noButton="invisible", noText="No", noFunc=null, cancelButton="invisible", cancelText="Cancel") {
    this.buttonPressed = "Cancel"; this.tempObject = Object.assign({}, dataObject);
    $(`#${this.idName}`).unbind('hide.bs.modal')
    $(`#${this.idName} .${this.classModalDialog}`).css("maxWidth",width);
    $(`#${this.idName} .${this.classModalHeader}`).addClass(addHeaderClass);
    $(`#${this.idName} .${this.classModalTitle}`).html(title);
    $(`#${this.idName} .${this.classModalBody}`).addClass(bodyClass).html(body);
    $(`#${this.idName} .${this.classModalFooter}`).addClass(footerClass);
    $(`#${this.idName} .${this.classSaveButton}`).addClass(saveButton).html(saveText).unbind('click').click( () => { this.buttonPressed="save"; saveFunc.apply(this, [this.tempObject]); });
    $(`#${this.idName} .${this.classNoButton}`).addClass(noButton).html(noText).unbind('click').click( () => { this.buttonPressed="no"; noFunc.apply();});
    $(`#${this.idName} .${this.classCancelButton}`).addClass(cancelButton).html(cancelText);
  }
  showLoggedOffModal() {
    this.prepareModal(null, "600px", "modal-header-warning", "Program Paused!", "<h3>Not Logged In to Mturk!</h3><h4>Please log back in by clicking link below.</h4><h5><a href='https://worker.mturk.com/' target='_blank' title='https://worker.mturk.com/' class='pcm_mturkLink'>https://worker.mturk.com/</a></h5>", "text-center");
    this.showModal();
    $(`#${this.idName} .pcm_mturkLink`).click( {popup:this.popup, idName:this.idName}, (e) => {
      e.preventDefault();
      this.popup = window.open( $(e.target).attr('href'), "_blank", "width=" + 1000 + ",height=" +  800 + ",scrollbars=yes,toolbar=yes,menubar=yes,location=yes" );
      setTimeout(this.isPopup, 500, this, true); // check if popup is null continously
    } )
  }
  showDeleteModal(hitDetails, deleteFunc, noFunc, cancelFunc) {
    this.prepareModal(null, "600px", "modal-header-danger modal-lg", "Deleting a Panda Hit!", `<h4>Are you sure you want me to delete this job?</h4><h5 class="text-primary">${hitDetails}</h5>`, "text-center", "", "visible", "Yes", deleteFunc, "visible", "No", noFunc, "visible", "Cancel");
    this.showModal(cancelFunc);
    $(`#${this.idName}`).on("keypress", (e) => { if (e.which == 13) { this.closeModal(); deleteFunc.apply(); } })
  }
  editableSuccess(newValue, key) { modal.tempObject[key] = newValue; }
  displayObjectData(thisArrayObject, divContainer) {
    function textToggle(thisObject, target, element, theValue, textBorder, textColor) {
      let parent = $(target).parent();
      if (target.tagName==="SPAN") {
        $(parent).empty().append($(`<input class="pcm_inputText" id="pcm_${element.key}DetailI" type="text" value="${theValue}"></input>`).blur( (e) => textToggle(thisObject, e.target, element, theValue, textBorder, textColor)).focus( (e) => $(e.target).select() ) );
        $(`#pcm_${element.key}DetailI`).focus();
      } else if (target.tagName==="INPUT" || target.tagName==="TD") {
        if (target.tagName==="TD") parent = $(target);
        else thisObject.tempObject[element.key] = theValue = $(target).val();
        if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
        let theSpan = $(parent).empty().append($(`<span id="pcm_${element.key}DetailS" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`));
        if (!element.disable) $(theSpan).on('click', (e) => { textToggle(thisObject, e.target, element, theValue, textBorder, textColor); });
      }
    }
    thisArrayObject.forEach(element => {
      let textColor = "", textBorder = "bottom-dotted", theValue = this.tempObject[element.key];
      if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
      if (theValue===-1) { theValue = "0"; }
      if (element.format==="date") { theValue = formatAMPM("short",new Date(theValue)); }
      if (element.disable) { textColor = " text-warning"; textBorder = ""; }
      const row = $(`<tr class="d-flex"></tr>`).append($(`<td class="col-4">${element.label}</td>`)).appendTo(divContainer);
      const valueCol = $(`<td class="font-weight-bold col-8 text-left"></td>`).appendTo(row);
      if (element.type==="range") {
        $(`<input class="pcm_inputRange" type="range" min="${element.min}" max="${element.max}" value="${theValue}"></input>`).on('input', (e) => { $(`#pcm_${element.key}Detail`).val(($(e.target).val())); this.tempObject[element.key] = $(e.target).val(); } ).appendTo(valueCol);
        $(`<input class="pcm_inputRangeText" id="pcm_${element.key}Detail" type="text" value="${theValue}" size="2"></input>`).appendTo(valueCol);
      } else if (element.type==="text") {
          textToggle(this, valueCol[0], element, theValue, textBorder, textColor);
      } else if (element.type==="trueFalse") {
        $(`<span id="pcm_${element.key}Detail" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`).on('click', (e) => {
          $(e.target).html( ($(e.target).html() === "true") ? "false" : "true" ); this.tempObject[element.key] = $(e.target).html();
        }).appendTo(valueCol);
      }
    });
  }
  showDetailsModal(hitDetails, successFunc) {
    this.prepareModal(hitDetails, "700px", "modal-header-info modal-lg", "Details for a hit", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save New Details", successFunc, "invisible", "No", null, "visible btn-sm", "Cancel");
    const modalBody = $(`#${this.idName} .${this.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    this.displayObjectData([
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
      { label:"Price", type:"text", key:"price", disable:true }, 
      { label:"Assigned Time", type:"text", key:"assignedTime", disable:true }, 
      { label:"Expires", type:"text", key:"expires", disable:true }, 
      { label:"Date Added", type:"text", key:"dateAdded", disable:true, format:"date" }, 
      { label:"Number of Seconds Collecting", type:"text", key:"limitNumQueue", disable:true }
    ], divContainer);
    this.showModal();
  }
}