/**
 * Class that handles all functions dealing with multiple modal dialogs.
 * @author JohnnyRS
 */
class ModalClass {
	constructor() {
    this.idName = "pcm_modal";
    this.modals = [];                             // Array of all modals being shown.
    this.classModalDialog = "modal-dialog";
    this.classModalHeader = "modal-header";
    this.classModalTitle = "modal-title";
    this.classModalBody = "modal-body";
    this.classModalFooter = "modal-footer";
    this.classSaveButton = "pcm_modalSave";
    this.classNoButton = "pcm_modalNo";
    this.classCancelButton = "pcm_modalCancel";
    this.modalLoggedOff = 0;
    this.buttonPressed = "Cancel";
    this.popup = null;
    this.tempObject =  [];
    this.theSpan = null;
  }
  /**
   * Create a modal with header and footer
   * @return {string}         Id name of the modal created.
   */
  createModal() {
    const count = this.modals.length, backdrop = (count>0) ? ` data-backdrop="static"` : ``;
    const style = ` style="z-index:${1051+(count*2)}"`;
    const idName = `${this.idName}_${count}`;
    this.modals.push(idName); // Push the id name of the modal on to the modals array for multiple modals.
    const modalHeader = $(`<div class="modal-header"><h4 class="modal-title"></h4><button type="button" class="close" data-dismiss="modal">&times;</button></div>`);
    const modalFooter = $(`<div class="modal-footer"><button type="button" class="btn btn-success pcm_modalSave">Save</button><button type="button" class="btn btn-info pcm_modalNo" data-dismiss="modal">No</button><button type="button" class="btn btn-danger pcm_modalCancel" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-default pcm_modalClose" data-dismiss="modal">Close</button></div>`);
    const modalContent = $(`<div class="modal-content"></div>`).append(modalHeader, `<div class="modal-body text-center py-2"></div>`, modalFooter);
    $(`<div id=${idName} class="modal pcm_modal fade" tabindex="-1" role="dialog"${backdrop}${style}></div>`).append($(`<div class="modal-dialog my-3"></div>`).append(modalContent)).appendTo("body");
    return idName;
  }
  /**
   * Show this modal dialog to user allowing multiple modals to be shown with zIndex.
   * @param {function} cancelFunc=null     Function to call when the cancel button is clicked.
   * @param {function} afterShow=null      Function to call after the modal dialog is shown with animations stopped.
   * @param {function} afterClose=null     Function to call when the modal dialog is about to close.
   */
  showModal(cancelFunc=null, afterShow=null, afterClose=null) {
    const idName = this.modals.slice(-1)[0]; // Get the last modal id name opened.
    $(`#${idName}`).modal({backdrop:"static", keyboard:false}); // Move last modal to background.
    $(`.modal-backdrop`).each( (index, element) => { $(element).css("zIndex",1050+(index*2)).css("opacity",0.8); } );
    $(`#${idName}`).on('hide.bs.modal', (e) => { // hide.bs.modal used when modal is about to be hidden or closed.
      this.tempObject = [];
      if ( (document.activeElement.innerText==="Cancel" || document.activeElement.innerText==="Close") && cancelFunc!==null ) cancelFunc.call();
      if (afterClose!==null) afterClose.call();
      $(e.target).remove(); // Remove the modal from document.
      this.modals.pop(); // Remove this modal from array of modals.
    });
    if (afterShow) $(`#${idName}`).on('shown.bs.modal', () => { afterShow.call(); });
  }
  /**
   * Will close a modal with the title name or the last modal shown.
   * @param {string} title=""    Close modal that has this title or the newest modal shown.
   */
  closeModal(title="") {
    let foundTitle = -1; // -1 used in slice to get the last item in modals array.
    if (title!=="") {
      this.modals.forEach( (idName, index) => {
        if ($(`#${idName} .modal-title:first`).text() === title) foundTitle=index;
      });
    }
    const idName = this.modals.slice(foundTitle)[0];
    $(`#${idName}`).modal("hide"); // Hiding is basically closing it.
    delete this.tempObject[idName]; // Delete the temporary cloned copy of object to be saved.
  }
  /**
   * Workaround for popup unload not working when crossed domains. (www.mturk.com vs worker.mturk.com)
   * Recursively will keep checking until popup window closes. Used for login popup window.
   * @param  {object} obj       Object popup window to check if it's null.
   * @param  {bool} again       True if it should check popup window again.
   */
  isPopup(obj, again) { 
    if (!obj.popup.window) { $(`#${obj.idName}`).modal('hide'); }
    else if (again) setTimeout(obj.isPopup, 500, obj, true);
  }
  /**
   * Prepare a modal dialog for showing data with different buttons.
   * @param {object} dataObject                 Cloned data so original won't get changed until save button clicked.
   * @param {number} width                      Width of the modal dialog.
   * @param {string} addHeaderClass             Class name used for the header class of modal.
   * @param {string} title                      The title for the modal.
   * @param {string} body                       Html code placed in the body of the modal.
   * @param {string} bodyClass                  Class name used for the body of the modal.
   * @param {string} footerClass                Class name used for the foot of the modal.
   * @param {string} saveButton='invisible'     Class name to be added to the save button. Invisible is default.
   * @param {string} saveText='Save'            Text to show on the save button.
   * @param {function} saveFunc=null            Function to be called when the save button is clicked.
   * @param {string} noButton='invisible'       Class name to be added to the no button. Invisible is default.
   * @param {string} noText='No'                Text to show on the no button.
   * @param {function} noFunc=null              Function to be called when the no button is clicked.
   * @param {string} cancelButton='invisible'   Class name to be added to the cancel button. Invisible is default.
   * @param {string} cancelText='Cancel'        Text to show on the cancel button.
   * @return {string}                           Id name of modal prepared.
   */
  prepareModal(dataObject, width, addHeaderClass, title, body, bodyClass, footerClass, saveButton='invisible', saveText='Save', saveFunc=null, noButton='invisible', noText='No', noFunc=null, cancelButton='invisible', cancelText='Cancel') {
    const idName = this.createModal();
    this.buttonPressed = 'Cancel'; this.tempObject[idName] = Object.assign({}, dataObject);
    $(`#${idName}`).unbind('hide.bs.modal').unbind('shown.bs.modal').unbind('hidden.bs.modal');
    $(`#${idName} .${this.classModalDialog}`).css('maxWidth',width);
    $(`#${idName} .${this.classModalHeader}`).css('maxWidth',width).addClass(addHeaderClass);
    $(`#${idName} .${this.classModalTitle}`).html(title);
    $(`#${idName} .${this.classModalBody}`).addClass(bodyClass).html(body);
    $(`#${idName} .${this.classModalFooter}`).addClass(footerClass);
    $(`#${idName} .${this.classSaveButton}`).removeClass('invisible visible').addClass(saveButton).html(saveText).unbind('click').click( () => { this.buttonPressed='save'; if (saveFunc!==null) saveFunc.apply(this, [this.tempObject[idName]]); });
    $(`#${idName} .${this.classNoButton}`).removeClass('invisible visible').addClass(noButton).html(noText).unbind('click').click( () => { this.buttonPressed='no'; if (noFunc) noFunc.apply();});
    $(`#${idName} .${this.classCancelButton}`).removeClass('invisible visible').addClass(cancelButton).html(cancelText);
    return idName;
  }
  /**
   * Shows a modal informing user that they are logged off from mturk.
   * @param  {function} afterClose=null   Function to call after close animation is completed.
   */
  showLoggedOffModal(afterClose=null) {
    if (this.modalLoggedOff === 0) {
      this.modalLoggedOff++;
      const idName = this.prepareModal(null, '600px', 'modal-header-warning', `Program Paused!`, '<h3>Not Logged In to Mturk!</h3><h4>Please log back in by clicking link below.</h4><h5><a href="https://worker.mturk.com/" target="_blank" title="https://worker.mturk.com/" class="pcm_mturkLink">https://worker.mturk.com/</a></h5>', 'text-center');
      this.showModal(null, null, () => { this.modalLoggedOff=0; if (afterClose) afterClose.call(); });
      $(`#${idName} .pcm_mturkLink`).click( {popup:this.popup, idName:idName}, (e) => {
        e.preventDefault();
        this.popup = window.open( $(e.target).attr('href'), '_blank', 'width=1000,height=800,scrollbars=yes,toolbar=yes,menubar=yes,location=yes' );
        setTimeout(this.isPopup, 500, this, true); // check if popup is null continously
      } )
    }
  }
  /**
   * Shows a modal to verify the jobs user wants to be deleted.
   * @param  {string} hitDetails      Short details of hit or hits to be deleted.
   * @param  {function} deleteFunc    Function to call after delete button is clicked.
   * @param  {function} noFunc        Function to call after the no button is clicked.
   * @param  {function} cancelFunc    Function to call after the cancel button is clicked.
   */
  showDeleteModal(hitDetails, deleteFunc, noFunc, cancelFunc) {
    const idName = this.prepareModal(null, "600px", "modal-header-danger modal-lg", "Deleting a Panda Hit!", `<h4>Are you sure you want me to delete this job?</h4><h5 class="text-primary">${hitDetails}</h5>`, "text-center", "", "visible", "Yes", deleteFunc, "visible", "No", noFunc, "visible", "Cancel");
    this.showModal(cancelFunc);
    $(`#${idName}`).on('keypress', e =>{ if (e.which == 13) { this.closeModal(); if (deleteFunc) deleteFunc.call(); } });
  }
  /**
   * Shows jobs in a table with a checkbox, collect button and details button.
   * @param  {object} modalBody             The Jquery element of the modal body to append to.
   * @param  {array} jobs                   An array of all the jobs to display.
   * @param  {function} checkboxFunc=null   Function to call when checkbox is clicked.
   */
  showJobsTable(modalBody, jobs, checkboxFunc=null) {
    const divContainer = $(`<table class="table table-dark table-hover table-sm table-moreCondensed pcm_jobTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([ { string:"", type:"string" }, {string:"Requester Name", type:"string", noBorder:true}, {string:"Title", type:"string", noBorder:true}, {string:"Pay", type:"string", noBorder:true}, {string:"", type:"string"}, {string:"", type:"string"} ], divContainer, bgPanda.info, true, true, "#0b716c");
    jobs.forEach(myId => {
      const status = (pandaUI.pandaStats[myId].collecting) ? "On" : "Off";
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
            pandaUI.pandaCard[myId].showDetailsModal( (changes) => {
              $(`#pcm_RQN_${myId}`).text( (changes.friendlyReqName!=="") ? changes.friendlyReqName : changes.reqName );
              $(`#pcm_TTL_${myId}`).text( (changes.friendlyTitle!=="") ? changes.friendlyTitle : changes.title );
              $(`#pcm_Pay_${myId}`).text(changes.price);
            });
          }}
      ], divContainer, bgPanda.info[myId].data, true, true);
    });
  }
  /**
   * Filters out jobs with the search term, collecting radio, search mode and once options.
   * @param  {string} search          Search term to find in title or requester name.
   * @param  {object} modalControl    Jquery element of modalControl to use for these jobs.
   * @return {bool}                   True if job should be shown.
   */
  jobsFilter(search, modalControl) {
    return bgPanda.pandaUniques.filter( (myId) => {
      const value = bgPanda.info[myId];
      const stats = pandaUI.pandaStats[myId];
      let good = false;
      const radioChecked = $(modalControl).find(`input[name='theJobs']:checked`).val();
      if (radioChecked==="0") good = true;
      else if (radioChecked==="1" && stats.collecting) good = true;
      else if (radioChecked==="2" && !stats.collecting) good = true;
      else if (radioChecked==="4" && value.once) good = true;
      if (good && search!=="" && (value.title.toLowerCase().includes(search) || value.reqName.toLowerCase().includes(search))) good = true;
      else if (good && search!=="") good = false;
      return good;
    } )
  }
  /**
   * Shows a modal to list jobs filtered by a search term, collecting, search mode or once options.
   * @param  {string} type='jobs'         Showing just jobs or jobs for grouping?
   * @param  {number} groupUnique=-1      Only used for editing grouping jobs with this unique number for grouping.       
   * @param  {object} thisObj=null        Only used for editing grouping jobs so it saves after save button clicked.
   * @param  {function} saveFunc=null     Function to call when save button clicked.
   * @param  {function} checkFunc=null    Function to call when checkbox clicked on a job.
   * @param  {function} cancelFunc=null   Function to call when cancel button clicked.
   * @param  {function} afterShow=null    Function to call when modal is shown after cnimations stopped.
   */
  showJobsModal(type='jobs', groupUnique=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null) {
    const theTitle = (type==='groupingEdit') ? 'Edit Groupings' : 'List Jobs';
    const saveBtnStatus = (type==='groupingEdit') ? 'visible btn-sm' : 'invisible';
    const idName = this.prepareModal(thisObj, '1000px', 'modal-header-info modal-lg', theTitle, '', 'text-right bg-dark text-light', 'modal-footer-info', saveBtnStatus, 'Save Groupings', saveFunc, 'invisible', 'No', null, 'invisible', 'Close');
    const addClass = (type === 'groupingEdit') ? 'pcm_groupingsEditModalBody' : 'pcm_jobsModalBody';
    const modalBody = $(`#${idName} .${this.classModalBody}`); $(modalBody).addClass(addClass);
    const modalControl = $('<div class="pcm_modalControl w-100"></div>').insertBefore(modalBody);
    if (type==='groupingEdit') {
      $('<div class="small text-warning font-weight-bold pl-1"></div>').append('Select the jobs you want in this grouping below:').append(`<span class="ml-2 text-info pcm_jobsInGroup">Jobs in Group: ${Object.keys(thisObj.pandas).length}</span>`).appendTo(modalControl);
      createInput(modalControl, '', 'pcm_groupingNameI', 'Grouping Name: ', `default: Grouping #${groupUnique}`, null, ' pl-5 text-warning', this.tempObject[idName].name).append(createTimeInput('Start Time', 'datetimepicker1'));
      createInput(modalControl, ' border-bottom', 'pcm_groupingDescI', 'Description: ', 'default: no description', null, ' pl-5 text-warning', this.tempObject[idName].description).append(createTimeElapse(thisObj.endHours, thisObj.endMinutes));
      if (thisObj.startTime) $('#datetimepicker1').datetimepicker({defaultDate: moment(thisObj.startTime,'hh:mm A'), format: 'LT'});
      else $('#datetimepicker1').datetimepicker({format: 'LT'});
      $('#pcm_clearTInput').on('click', e => { $('#datetimepicker1').datetimepicker('clear'); });
    }
    const radioGroup = $('<div class="text-center"></div>').appendTo(modalControl);
    radioButtons(radioGroup, 'theJobs', '0', 'All Jobs', true); 
    if (type === 'jobs') radioButtons(radioGroup, 'theJobs', '1', 'Collecting');
    if (type === 'jobs') radioButtons(radioGroup, 'theJobs', '2', 'Not Collecting');
    radioButtons(radioGroup, 'theJobs', '3', 'Searching Mode');
    radioButtons(radioGroup, 'theJobs', '4', 'Only Once');
    const inputControl = createInput(modalControl, '', 'pcm_searchJobs', 'Search phrase: ', 'example: receipts', (e) => {
      $(e.target).closest('.pcm_modalControl').find('.pcm_searchingJobs').click();
    }, ' pl-5');
    $('<button class="btn btn-xxs btn-primary ml-1 pcm_searchingJobs">Search</button>').on( 'click', (e) => {
      $(modalBody).find('.pcm_jobTable').remove();
      this.showJobsTable(modalBody, this.jobsFilter($('#pcm_searchJobs').val().toLowerCase(), modalControl), checkFunc);
      if (type==='groupingEdit') Object.keys(groupings.groups[groupUnique].pandas).forEach( (value) => { $(`#pcm_selection_${bgPanda.dbIds[value]}`).prop('checked', true); });
    }).appendTo(inputControl);
    if (type === 'jobs') $('<button class="btn btn-xxs btn-danger ml-1">Delete Selected</button>').click( (e) => {
      const selected = $(modalBody).find('.pcm_checkbox:checked').map((_,element) => { return Number($(element).val()); }).get();
      if (selected.length) pandaUI.removeJobs(selected, () => {
          $(modalBody).find('.pcm_jobTable').remove();
          this.showJobsTable(modalBody, this.jobsFilter($('#pcm_searchJobs').val().toLowerCase(), modalControl));
        });
    }).appendTo(inputControl);
    $(modalControl).find('input:radio[name="theJobs"]').click( (e) => {
      $(e.target).closest('.pcm_modalControl').find('.pcm_searchingJobs').click();
    } );
    this.showJobsTable(modalBody, this.jobsFilter('', modalControl), checkFunc);
    this.showModal(cancelFunc, afterShow);
  }
  /**
   * Shows a modal for adding panda or search jobs
   */
  showJobAddModal() {
    const idName = this.prepareModal(null, '900px', 'modal-header-info modal-lg', 'Add new Panda Info', '<h4>Enter New Panda Information. [GroupID is mandatory]</h4>', 'text-right bg-dark text-light', 'modal-footer-info', 'visible btn-sm', 'Add new Panda Info', () => {
        checkGroupID.apply(this);
      }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
      const div = $('<div><div class="pcm_inputError">&nbsp;</div></div>');
      createInput(div, ' pcm_inputDiv-url', 'pcm_formAddGroupID', '* Group ID or URL: ', 'example: 30B721SJLR5BYYBNQJ0CVKKCWQZ0OI');
      createCheckBox(div, 'Start Collecting', 'pcm_startCollecting', '', true);
      createCheckBox(div, 'Collect Only Once', 'pcm_onlyOnce', '');
      createInput(div, ' pt-3 border-top border-info', 'pcm_formReqName', 'Requester Name: ', 'default: group ID shown');
      createInput(div, '', 'pcm_formAddReqID', 'Requester ID: ', 'example: AGVV5AWLJY7H2');
      createInput(div, '', 'pcm_formAddTitle', 'Title: ', 'default: group ID shown');
      createInput(div, '', 'pcm_formAddDesc', 'Description: ', 'default: group ID shown');
      createInput(div, '', 'pcm_formAddPay', 'Pay Amount: ', 'default: 0.00');
      $(`#${idName} .${this.classModalBody}`).append(div);
      $('#pcm_formAddGroupID').keypress( (e) => {
        if((event.keyCode ? event.keyCode : event.which) == '13') checkGroupID.apply(this);
      }
    );
    this.showModal(null, () => { $('#pcm_formAddGroupID').focus(); });
    /**
     * Verifies that the groupID inputted is correct.
     */
    function checkGroupID() {
      const groupVal = $('#pcm_formAddGroupID').val();
      if (groupVal === '') {
        $('label[for="pcm_formAddGroupID"]').css('color', 'red');
        $(div).find('.pcm_inputError:first').html('Must fill in GroupID or URL!').data('gIdEmpty',true);
      } else if (bgPanda.pandaGroupIds.hasOwnProperty(groupVal) && 
          !$(div).find('.pcm_inputError:first').data('gIdDup')) {
        $('label[for="pcm_formAddGroupID"]').css('color', 'yellow');
        $(div).find('.pcm_inputError:first').html('GroupID already added. Still want to add?').data('gIdDup',true);
        $('.modal-footer .pcm_modalSave:first').html('YES! Add new Panda Info');
      } else if (groupVal.match(/^[0-9a-zA-Z]+$/) || groupVal.includes('://')) {
        let groupId = null, reqId = null;
        const groupVal = $('#pcm_formAddGroupID').val();
        if (groupVal.includes('://')) [groupId, reqId] = bgPanda.parsePandaUrl(groupVal);
        else groupId = groupVal;
        const reqName = ($('#pcm_formReqName').val()) ? $('#pcm_formReqName').val() : groupId;
        reqId = (reqId) ? reqId : $('#pcm_formAddReqID').val();
        const title = ($('#pcm_formAddTitle').val()) ? $('#pcm_formAddTitle').val() : groupId;
        const description = ($('#pcm_formAddDesc').val()) ? $('#pcm_formAddDesc').val() : groupId;
        const pay = ($('#pcm_formAddPay').val()) ? $('#pcm_formAddPay').val() : '0.00';
        const startNow = $('#pcm_startCollecting').is(':checked');
        const once = $('#pcm_onlyOnce').is(':checked'); 
        const currentTab = pandaUI.tabs.currentTab;
        this.closeModal();
        if (groupId) {
          pandaUI.addPanda(groupId, description, title, reqId, reqName, pay, once, null, 0, 0, 0, false, 4000, -1, 0, currentTab, false, '', '', startNow);
          } else if (reqId) console.log('Create Search Panda');
      } else {
        $('label[for="pcm_formAddGroupID"]').css('color', 'red');
        $(div).find('.pcm_inputError:first').html('Invalid Group ID or URL').data('gIdInvalid',true);
      }
    }
  }
  /**
   * Shows a modal dialog with a message or question with a yes and/or no button.
   * @param {number} width              Size of the modal dialog.
   * @param {string} title              Title of the modal dialog.
   * @param {string} body               Html to be displayed in the body section of dialog.
   * @param {function} addFunc          Function to call after yes button is pressed.
   * @param {bool} yesBtn               Show the yes button or not.
   * @param {bool} noBtn                Show the no button or not.
   * @param {string} question=''        Quesion to be asked before the input field as label.
   * @param {string} defAns=''          Default answer in input field initially.
   * @param {number} max=null           Maximum characters allowed in input field.
   * @param {function} afterShow=null   Function to run after the dialog is shown after animation is stopped. 
   */
  showDialogModal(width, title, body, addFunc, yesBtn, noBtn, question='', defAns='', max=null, afterShow=null) {
    const yesClass = (yesBtn) ? 'visible btn-sm' : 'invisible';
    const noClass = (noBtn) ? 'visible btn-sm' : 'invisible';
    const idName = this.prepareModal(null, width, 'modal-header-info modal-lg', title, body, 'text-right bg-dark text-light', 'modal-footer-info', yesClass, 'Yes', addFunc, noClass, 'No');
    if (question!=='') { // Should an input field be shown with a question?
      createInput($(`#${idName} .${this.classModalBody}`), ' pcm_inputDiv-question', 'pcm_formQuestion', question, '', null, '', defAns, 100, false, max);
      $('#pcm_formQuestion').keypress( (e) => { // If enter key pressed then run the addFunc function.
        if ( (event.keyCode ? event.keyCode : event.which) == '13' ) addFunc.call(); // Return key pressed.
      });
    } 
    this.showModal(null, () => { $('#pcm_formQuestion').focus().select(); if (afterShow) afterShow.call(); });
  }
}