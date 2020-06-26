/**
 * Class that handles all functions dealing with multiple modal dialogs.
 * @class ModalClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ModalClass {
	constructor() {
    this.idName = "pcm_modal";                    // Id name of the main modal element.
    this.modals = [];                             // Array of all modals being shown.
    this.classModalDialog = "modal-dialog";       // The class name for the dialog section of modal.
    this.classModalHeader = "modal-header";       // The class name for the header section of modal.
    this.classModalTitle = "modal-title";         // The class name for the title in header section of modal.
    this.classModalBody = "modal-body";           // The class name for the body section of modal.
    this.classModalFooter = "modal-footer";       // The class name for the footer section of modal.
    this.classSaveButton = "pcm_modalSave";       // The class name for the save button of modal.
    this.classNoButton = "pcm_modalNo";           // The class name for the no button of modal.
    this.classCancelButton = "pcm_modalCancel";   // The class name for the cancel button of modal.
    this.modalLoggedOff = 0;                      // A counter for hoe many logged off modals are opened.
    this.popup = null;                            // A window object of the popup window opened from a modal.
    this.tempObject =  [];                        // A place to keep data changes before the save button clicked.
  }
  /** Create a modal with header and footer
   * @return {string} - Id name of the modal created. */
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
  /** Show this modal dialog to user allowing multiple modals to be shown with zIndex.
   * @param {function} [cancelFunc=null] - Function to call when the cancel button is clicked.
   * @param {function} [afterShow=null]  - Function to call after the modal dialog animations stopped.
   * @param {function} [afterClose=null] - Function to call when the modal dialog is about to close. */
  showModal(cancelFunc=null, afterShow=null, afterClose=null) {
    const idName = this.modals.slice(-1)[0]; // Get the last modal id name opened.
    $(`#${idName}`).modal({backdrop:"static", keyboard:false}); // Move last modal to background.
    $(`.modal-backdrop`).each( (index, element) => { $(element).css("zIndex",1050+(index*2)).css("opacity",0.8); } );
    $(`#${idName}`).on('hide.bs.modal', (e) => { // hide.bs.modal used when modal is about to be hidden or closed.
      this.tempObject = [];
      if ( (document.activeElement.innerText==="Cancel" || document.activeElement.innerText==="Close") && cancelFunc!==null ) cancelFunc();
      if (afterClose!==null) afterClose();
      $(e.target).remove(); // Remove the modal from document.
      this.modals.pop(); // Remove this modal from array of modals.
    });
    if (afterShow) $(`#${idName}`).on('shown.bs.modal', () => { afterShow(); });
  }
  /** Will close a modal with the title name or the last modal shown.
   * @param {string} [title=""] - Close modal that has this title or the newest modal shown. */
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
  /** Workaround for popup unload not working when crossed domains. (www.mturk.com vs worker.mturk.com)
   * Recursively will keep checking until popup window closes. Used for login popup window. */
  isPopup() {
    if (!this.popup.closed && bgQueue.isLoggedOff()) setTimeout(this.isPopup.bind(this), 500);
    else bgQueue.nowLoggedOn();
  }
  /** Prepare a modal dialog for showing data with different buttons.
   * @param {object} dataObject                 - Cloned data so original won't get changed until saved.
   * @param {number} width                      - Width of the modal dialog.
   * @param {string} addHeaderClass             - Class name used for the header class of modal.
   * @param {string} title                      - The title for the modal.
   * @param {string} body                       - Html code placed in the body of the modal.
   * @param {string} bodyClass                  - Class name used for the body of the modal.
   * @param {string} footerClass                - Class name used for the foot of the modal.
   * @param {string} [saveButton='invisible']   - Class name to be added to the save button. Invisible is default.
   * @param {string} [saveText='Save']          - Text to show on the save button.
   * @param {function} [saveFunc=null]      - Function to be called when the save button is clicked.
   * @param {string} [noButton='invisible']     - Class name to be added to the no button. Invisible is default.
   * @param {string} [noText='No']              - Text to show on the no button.
   * @param {function} [noFunc=null]          - Function to be called when the no button is clicked.
   * @param {string} [cancelButton='invisible'] - Class name to be added to the cancel button. Invisible is default.
   * @param {string} [cancelText='Cancel']      - Text to show on the cancel button.
   * @return {string}                           - Id name of modal prepared. */
  prepareModal(dataObject, width, addHeaderClass, title, body, bodyClass, footerClass, saveButton='invisible', saveText='Save', saveFunc=null, noButton='invisible', noText='No', noFunc=null, cancelButton='invisible', cancelText='Cancel') {
    const idName = this.createModal();
    this.tempObject[idName] = Object.assign({}, dataObject);
    $(`#${idName}`).unbind('hide.bs.modal').unbind('shown.bs.modal').unbind('hidden.bs.modal');
    $(`#${idName} .${this.classModalDialog}`).css('maxWidth',width);
    $(`#${idName} .${this.classModalHeader}`).css('maxWidth',width).addClass(addHeaderClass);
    $(`#${idName} .${this.classModalTitle}`).html(title);
    $(`#${idName} .${this.classModalBody}`).addClass(bodyClass).html(body);
    $(`#${idName} .${this.classModalFooter}`).addClass(footerClass);
    $(`#${idName} .${this.classSaveButton}`).removeClass('invisible visible').addClass(saveButton).html(saveText).unbind('click').click( () => { if (saveFunc!==null) saveFunc(this.tempObject[idName]); });
    $(`#${idName} .${this.classNoButton}`).removeClass('invisible visible').addClass(noButton).html(noText).unbind('click').click( () => { if (noFunc) noFunc(); });
    $(`#${idName} .${this.classCancelButton}`).removeClass('invisible visible').addClass(cancelButton).html(cancelText);
    return idName;
  }
  /** Shows a modal informing user that they are logged off from mturk.
   * @param  {closeCallBack} [afterClose=null] - Function to call after close animation is completed. */
  showLoggedOffModal(afterClose=null) {
    if (this.modalLoggedOff === 0) {
      this.modalLoggedOff++;
      const idName = this.prepareModal(null, '600px', 'modal-header-warning', `Program Paused!`, '<h3>Not Logged In to Mturk!</h3><h4>Please log back in by clicking link below.</h4><h5><a href="https://worker.mturk.com/" target="_blank" title="https://worker.mturk.com/" class="pcm_mturkLink">https://worker.mturk.com/</a></h5>', 'text-center');
      this.showModal(null, null, () => { this.modalLoggedOff=0; if (afterClose) afterClose(); });
      $(`#${idName} .pcm_mturkLink`).click( {popup:this.popup, idName:idName}, (e) => {
        e.preventDefault();
        this.popup = window.open( $(e.target).attr('href'), '_blank', 'width=1000,height=800,scrollbars=yes,toolbar=yes,menubar=yes,location=yes' );
        setTimeout(this.isPopup.bind(this), 500); // check if popup is null continously
      } )
    }
  }
  /** Shows a modal to verify the jobs user wants to be deleted.
   * @param  {string} hitDetails   - Short details of hit or hits to be deleted.
   * @param  {function} deleteFunc - Function to call after delete button is clicked.
   * @param  {function} noFunc     - Function to call after the no button is clicked.
   * @param  {function} cancelFunc - Function to call after the cancel button is clicked. */
  showDeleteModal(hitDetails, deleteFunc, noFunc, cancelFunc) {
    const idName = this.prepareModal(null, "600px", "modal-header-danger modal-lg", "Deleting a Panda Hit!", `<h4>Are you sure you want me to delete this job?</h4><h5 class="text-primary">${hitDetails}</h5>`, "text-center", "", "visible", "Yes", deleteFunc, "visible", "No", noFunc, "visible", "Cancel");
    this.showModal(cancelFunc);
    $(`#${idName}`).on('keypress', e =>{ if (e.which == 13) { this.closeModal(); if (deleteFunc) deleteFunc(); } });
  }
  /** Shows a modal dialog with a message or question with a yes and/or no button.
   * @param {number} width              - Size of the modal dialog.
   * @param {string} title              - Title of the modal dialog.
   * @param {string} body               - Html to be displayed in the body section of dialog.
   * @param {function} yesFunc          - Function to call after yes button is pressed.
   * @param {bool} yesBtn               - Show the yes button or not.
   * @param {bool} noBtn                - Show the no button or not.
   * @param {string} [question='']      - Quesion to be asked before the input field as label.
   * @param {string} [defAns='']        - Default answer in input field initially.
   * @param {number} [max=null]         - Maximum characters allowed in input field.
   * @param {function} [afterShow=null] - Function to run after the dialog is shown after animation is stopped.  */
  showDialogModal(width, title, body, yesFunc, yesBtn, noBtn, question='', defAns='', max=null, afterShow=null) {
    const yesClass = (yesBtn) ? 'visible btn-sm' : 'invisible';
    const noClass = (noBtn) ? 'visible btn-sm' : 'invisible';
    const idName = this.prepareModal(null, width, 'modal-header-info modal-lg', title, body, 'text-right bg-dark text-light', 'modal-footer-info', yesClass, 'Yes', yesFunc, noClass, 'No');
    this.showModal(null, () => {
      let docKeys = "";
      if (question!=='') { // Should an input field be shown with a question?
        createInput($(`#${idName} .${this.classModalBody}`), ' pcm_inputDiv-question', 'pcm_formQuestion', question, '', null, '', defAns, 100, false, max);
        docKeys = '#pcm_formQuestion,';
      }
      $(`${docKeys}#pcm_modal_0`).keypress( (e) => { // If enter key pressed then run the addFunc function.
        if ( (event.keyCode ? event.keyCode : event.which) == '13' ) yesFunc(); // Return key pressed.
      });
        $('#pcm_formQuestion').focus().select();
      if (afterShow) afterShow();
    });
  }
}