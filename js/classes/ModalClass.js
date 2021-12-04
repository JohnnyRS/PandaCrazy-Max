/** Class that handles all functions dealing with multiple modal dialogs.
 * @class ModalClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ModalClass {
	constructor() {
    this.idName = 'pcm-modal';                    // Id name of the main modal element.
    this.modals = [];                             // Array of all modals being shown.
    this.classModalDialog = 'modal-dialog';       // The class name for the dialog section of modal.
    this.classModalHeader = 'modal-header';       // The class name for the header section of modal.
    this.classModalTitle = 'modal-title';         // The class name for the title in header section of modal.
    this.classModalBody = 'modal-body';           // The class name for the body section of modal.
    this.classModalFooter = 'modal-footer';       // The class name for the footer section of modal.
    this.classSaveButton = 'pcm-modalSave';       // The class name for the save button of modal.
    this.classNoButton = 'pcm-modalNo';           // The class name for the no button of modal.
    this.classCancelButton = 'pcm-modalCancel';   // The class name for the cancel button of modal.
    this.modalLoggedOff = 0;                      // A counter for how many logged off modals are opened.
    this.modalCaptcha = 0;                        // A counter for how many Captcha Found modals are opened.
    this.popup = null;                            // A window object of the popup window opened from a modal.
    this.tempObject =  [];                        // A place to keep data changes before the save button clicked.
  }
  /** Create a modal with header and footer
<<<<<<< HEAD
   * @param  {string} [addModalClass] - pcm-modal class name.
   * @return {string}                 - Id name of the modal created.
  **/
=======
   * @return {string} [addModalClass] - pcm-modal class name. */
>>>>>>> d88f37734cd1d7a2ca83aab0b7bd6f253aded9ee
  createModal(addModalClass=null) {
    let count = this.modals.length, backdrop = (count>0) ? ` data-backdrop='static'` : ``, style = ` style='z-index:${1051+(count*2)}'`, idName = `${this.idName}-${count}`;
    this.modals.push(idName); // Push the id name of the modal on to the modals array for multiple modals.
    let modalHeader = $(`<div class='modal-header'><h4 class='modal-title'></h4><button type='button' class='close pcm-modalXClose' data-dismiss='modal'>&times;</button></div>`);
    let modalFooter = $(`<div class='modal-footer'><button type='button' class='btn pcm-modalSave'>Save</button><button type='button' class='btn pcm-modalNo' data-dismiss='modal'>No</button><button type='button' class='btn pcm-modalCancel' data-dismiss='modal'>Cancel</button><button type='button' class='btn pcm-modalClose' data-dismiss='modal'>Close</button></div>`);
    let modalContent = $(`<div class='modal-content'></div>`).append(modalHeader, `<div class='modal-body'></div>`, modalFooter);
    $(`<div id=${idName} class='modal pcm-modal${(addModalClass) ? ' ' + addModalClass : ''} fade' role='dialog'${backdrop}${style}></div>`).append($(`<div class='modal-dialog modal-dialog-scrollable'></div>`).append(modalContent)).appendTo('body');
    modalHeader = null; modalFooter = null; modalContent = null;
    return idName;
  }
  /** Show this modal dialog allowing multiple modals to be shown with zIndex.
<<<<<<< HEAD
   * @param  {function} [cancelFunc] - Cancel function.  @param  {function} [afterShow] - After show function.  @param  {function} [afterClose] - After close function.
   * @param  {string} [cancelText]   - Text used for cancel.
  **/
=======
   * @param {function} [cancelFunc] - Cancel Function      @param {function} [afterShow] - After Show Function @param {function} [afterClose] - After Close Function
   * @param {string} [cancelText] - Text Used for Cancel */
>>>>>>> d88f37734cd1d7a2ca83aab0b7bd6f253aded9ee
  showModal(cancelFunc=null, afterShow=null, afterClose=null, cancelText='Cancel') {
    const idName = this.modals.slice(-1)[0]; // Get the last modal id name opened.
    $(`#${idName}`).modal({backdrop:'static', keyboard:false}); // Move last modal to background.
    $(`.modal-backdrop`).each( (index, element) => { $(element).css('zIndex',1050+(index*2)).css('opacity',0.8); } );
    $(`#${idName}`).on('hide.bs.modal', e => { // hide.bs.modal used when modal is about to be hidden or closed.
      if (document.activeElement.innerText === cancelText && cancelFunc) cancelFunc();
      if (afterClose !== null) afterClose();
      $(e.target).remove(); this.modals.pop();
      $(e.target).data('bs.modal', null).remove();
    });
    if (afterShow) $(`#${idName}`).on('shown.bs.modal', () => { afterShow(); });
  }
  /** Will close a modal with the title name or the last modal shown.
   * @param {string} [title] - Close modal that has this title or the newest modal shown.
  **/
  closeModal(title='') {
    let foundTitle = -1; // -1 used in slice to get the last item in modals array.
    if (title !== '') {
      this.modals.forEach( (idName, index) => { if ($(`#${idName} .modal-title:first`).text() === title) foundTitle = index; });
    }
    if (title === '' || (title !== '' && foundTitle !== -1)) {
      const idName = this.modals.slice(foundTitle)[0];
      $(`#${idName}`).modal('hide'); // Hiding is basically closing it.
      $(`#${idName}`).unbind('hide.bs.modal').unbind('shown.bs.modal').unbind('hidden.bs.modal');
      delete this.tempObject[idName]; // Delete the temporary cloned copy of object to be saved.
    }
  }
  /** Workaround for popup unload not working when crossed domains. (www.mturk.com vs worker.mturk.com)
   * Recursively will keep checking until popup window closes. Used for login popup window.
  **/
  isPopup() {
    if (!this.popup.closed && (typeof MyQueue !== 'undefined') && MyQueue.isLoggedOff()) setTimeout(this.isPopup.bind(this), 500);
    else if (typeof MyQueue !== 'undefined') MyQueue.nowLoggedOn();
  }
  /** Prepare a modal dialog for showing data with different buttons.
   * @param  {object} dataObject     - Cloned data.   @param  {number} width        - The width.      @param  {string} addModalClass  - Modal class.
   * @param  {string} addHeaderClass - Header class.  @param  {string} title        - The title.      @param  {string} body           - Body html.
   * @param  {string} bodyClass      - Body class.    @param  {string} footerClass  - Footer class.   @param  {string} [saveButton]   - Save class.
   * @param  {string} [saveText]     - Save text.     @param  {function} [saveFunc] - Save function.  @param  {string} [noButton]     - No class.
   * @param  {string} [noText]       - No text.       @param  {function} [noFunc]   - No function.    @param  {string} [cancelButton] - Cancel class.
   * @param  {string} [cancelText]   - Cancel text.
   * @return {string}                - Id name.
  **/
  prepareModal(dataObject, width, addModalClass, addHeaderClass, title, body, bodyClass, footerClass, saveButton='invisible', saveText='Save', saveFunc=null, noButton='invisible', noText='No', noFunc=null, cancelButton='invisible', cancelText='Cancel') {
    const idName = this.createModal(addModalClass);
    this.tempObject[idName] = Object.assign({}, dataObject);
    $(`#${idName}`).unbind('hide.bs.modal').unbind('shown.bs.modal').unbind('hidden.bs.modal');
    $(`#${idName} .${this.classModalDialog}`).css('maxWidth',width);
    $(`#${idName} .${this.classModalHeader}`).css('maxWidth',width).addClass(addHeaderClass);
    $(`#${idName} .${this.classModalTitle}`).html(title);
    $(`#${idName} .${this.classModalBody}`).addClass(bodyClass).html(body);
    $(`#${idName} .${this.classModalFooter}`).addClass(footerClass);
    $(`#${idName} .${this.classSaveButton}`).removeClass('invisible visible').addClass(saveButton).html(saveText).unbind('click').click( (e) => {
      let theButton = $(e.target).closest('button');
      if (saveFunc !== null) saveFunc(this.tempObject[idName], theButton);
    });
    $(`#${idName} .${this.classNoButton}`).removeClass('invisible visible').addClass(noButton).html(noText).unbind('click').click( () => { if (noFunc) noFunc(); });
    $(`#${idName} .${this.classCancelButton}`).removeClass('invisible visible').addClass(cancelButton).html(cancelText);
    return idName;
  }
  /** Shows a modal informing user that they are logged off from MTURK.
   * @param  {function} [afterClose] - Function to call after close animation is completed.
  **/
  showLoggedOffModal(afterClose=null) {
    if (this.modalLoggedOff === 0) {
      this.modalLoggedOff++;
      const idName = this.prepareModal(null, '600px', 'pcm-logOffModal', 'pcm-warning', `Program Paused!`, `<h3>Not Logged In to Mturk!</h3><h4>Please log back in by clicking link below.</h4><h5><a href='https://worker.mturk.com/' target='_blank' title='https://worker.mturk.com/' class='pcm-mturkLink'>https://worker.mturk.com/</a></h5>`, 'pcm-warning', 'pcm-warning');
      this.showModal(null, null, () => {
        this.modalLoggedOff = 0;
        if (afterClose) afterClose();
        else if (this && this.modals.length < 2) MyModal = null;
      });
      $(`#${idName} .pcm-mturkLink`).click( {'popup':this.popup, 'idName':idName}, e => {
        e.preventDefault();
        this.popup = window.open( $(e.target).attr('href'), '_blank', 'width=1000,height=800,scrollbars=yes,toolbar=yes,menubar=yes,location=yes' );
        setTimeout(this.isPopup.bind(this), 500); // check if popup is null continuously
      });
    }
  }
  /** Shows a modal informing user that a captcha was found and displays a link for user to clear the captcha.
   * @param  {function} [afterClose] - Function to call after close animation is completed.  @param  {string} [url] - URL to use to clear the captcha.
  **/
   showCaptchaModal(afterClose=null, url='') {
    if (this.modalCaptcha === 0) {
      this.modalCaptcha++;
      let theUrl = (url) ? url : 'https://worker.mturk.com/';
      const idName = this.prepareModal(null, '600px', 'pcm-captchaModal', 'pcm-warning', `Program Paused!`, `<h3>Found a possible Captcha!</h3><h4>Please clear it by clicking link below.</h4><h5><a href='${theUrl}' target='_blank' title='${theUrl}' class='pcm-mturkLink'>${theUrl}</a></h5>`, 'pcm-warning', 'pcm-warning');
      this.showModal(null, null, () => {
        this.modalCaptcha = 0;
        if (afterClose) afterClose();
        else if (this && this.modals.length < 2) MyModal = null;
      });
      $(`#${idName} .pcm-mturkLink`).click( {'popup':this.popup, 'idName':idName}, e => {
        e.preventDefault();
        this.popup = window.open( $(e.target).attr('href'), '_blank', 'width=1000,height=800,scrollbars=yes,toolbar=yes,menubar=yes,location=yes' );
        let checkPopup = () => { if (!this.popup.closed) { setTimeout( () => { checkPopup(); }, 500); } else MyModal.closeModal(); }
        checkPopup(); // check if popup is still opened until it is closed.
      });
    }
  }
  /** Shows a modal to verify the jobs user wants to be deleted.
   * @param  {string} hitsList     - HIT details.      @param  {function} deleteFunc   - Delete function.      @param  {function} noFunc       - No function.
   * @param  {function} cancelFunc - Cancel function.  @param  {function} [afterClose] - After show function.  @param  {function} [cancelText] - Cancel text.
  **/
  showDeleteModal(hitsList, deleteFunc, noFunc, cancelFunc, afterClose=null, cancelText='Cancel') {
    const idName = this.prepareModal(null, '800px', 'pcm-deleteModal', 'pcm-danger modal-lg', 'Deleting a Panda HIT!', `<h4>Are you sure you want me to delete this job?</h4><h5 class='pcm-myPrimary'>${hitsList}</h5>`, 'pcm-danger', 'pcm-danger', 'visible', 'Yes', deleteFunc, 'visible', 'No', noFunc, 'visible', cancelText);
    this.showModal(cancelFunc, () => {
      $(`#${idName}`).find(`.pcm-modalSave`).focus();
    }, () => { if (afterClose) afterClose(); else MyModal = null; }, cancelText);
  }
  /** Shows a modal dialog with a message or question with a yes and/or no button.
<<<<<<< HEAD
   * @param  {number} width         - The width.           @param  {string} title          - The title.            @param  {string} body            - Body html.
   * @param  {function} yesFunc     - Yes function.        @param  {bool} yesBtn           - Show yes button?      @param  {bool} noBtn             - Show no button?
   * @param  {string} [question]    - The question.        @param  {string} [defAns]       - Default answer.       @param  {number} [max]           - Max characters.
   * @param  {function} [afterShow] - AfterShow function.  @param  {function} [afterClose] - AfterClose function.  @param  {string} [yesTxt]        - Yes text.
   * @param  {string} [noTxt]       - No text.             @param  {function} [noFunc]     - No function.          @param  {function} [placeHolder] - The placeholder.
  **/
=======
   * @param {number} width         - Width               @param {string} title          - Title                @param {string} body            - Body Html
   * @param {function} yesFunc     - Yes Function        @param {bool} yesBtn           - Show Yes             @param {bool} noBtn             - Show No
   * @param {string} [question]    - Question            @param {string} [defAns]       - Default Answer       @param {number} [max]           - Max Characters
   * @param {function} [afterShow] - AfterShow Function  @param {function} [afterClose] - AfterClose Function  @param {string} [yesTxt]      - Yes Text
   * @param {string} [noTxt]     - No Text             @param {function} [noFunc]     - No Function          @param {function} [placeHolder] - PlaceHolder */
>>>>>>> d88f37734cd1d7a2ca83aab0b7bd6f253aded9ee
  showDialogModal(width, title, body, yesFunc, yesBtn, noBtn, question='', defAns='', max=null, afterShow=null, afterClose=null, yesTxt='Yes', noTxt='No', noFunc=null, placeHolder='') {
    const yesClass = (yesBtn) ? 'visible btn-sm' : 'invisible', noClass = (noBtn) ? 'visible btn-sm' : 'invisible';
    let idName = this.prepareModal(null, width, 'pcm-messageModal', 'modal-lg', title, body, '', '', yesClass, yesTxt, () => { if (yesFunc) yesFunc(idName); }, noClass, noTxt, noFunc);
    this.showModal(null, () => {
      let docKeys = '';
      if (question !== '') { // Should an input field be shown with a question?
        createInput($(`#${idName} .${this.classModalBody}`), ' pcm-inputDiv-question', 'pcm-formQuestion', question, placeHolder, null, '', defAns, 95, false, max).append(`<span class='pcm-inputError small'></span>`);
        docKeys = '#pcm-formQuestion,';
      }
      $(`${docKeys}#${idName}`).keypress( e => { if (yesFunc && (e.keyCode ? e.keyCode : e.which) == '13') yesFunc(idName); });
      $('#pcm-formQuestion').focus().select();
      if (afterShow) afterShow(idName);
    }, () => { if (afterClose) afterClose(); else MyModal = null; });
  }
}
