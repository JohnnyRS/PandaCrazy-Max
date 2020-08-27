/** This class deals with any showing of modals for search triggers.
 * @class ModalSearchClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalSearchClass {
	constructor() {
    this.pandaDur = {min:0, max:60} // Limits for the panda duration in minutes.
  }
  /** Shows a modal for adding panda or search jobs.
   * @param  {function} [afterClose=null]  - Function to call after the modal is closed. */
  showTriggerAddModal(afterClose=null, doCustom=false) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(null, '920px', 'modal-header-info modal-lg', 'Add new Search Trigger', '<h4>Enter New Search Trigger Information.</h4>', 'text-right bg-dark text-light pcm_searchModal', 'modal-footer-info', 'visible btn-sm', 'Add new Search Trigger', checkTrigger.bind(this), 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    let df = document.createDocumentFragment(), div = null, input1Text = '* Enter info for new Job: '
    let example1Text = 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY', example2Text = 'example: Ibotta receipts';
    if (doCustom) {
      div = $(`<div><div class='pcm_inputError'></div><div style='color:aqua'>Enter a term or word to search for in titles and descriptions of a hit:</div></div>`).appendTo(df);
      input1Text = '* Enter custom search term: '; example1Text = 'example: survey'; example2Text = 'example: Surveys paying over $1.00';
    } else div = $(`<div><div class='pcm_inputError'></div><div style='color:aqua'>Enter a Group ID, Requester ID, Preview URL or accept URL.</div></div>`).appendTo(df);
    createInput(df, ' pcm_inputDiv-url', 'pcm_formAddGroupID', input1Text, example1Text);
    createInput(df, '', 'pcm_formTriggerName', '* Name of the Trigger: ', example2Text);
    if (doCustom) createInput(df, '', 'pcm_formMinPay', '* Pay Min Amount: ', 'example: 1.00');
    createCheckBox(df, 'Enabled: ', 'pcm_triggerEnabled', '', true);
    createCheckBox(df, 'Collect Only One Hit', 'pcm_onlyOnce', '');
    $(`<div class='pt-1 border-top border-info'></div>`).appendTo(df);
    let data = {'reqName':'', 'hitTitle':'', 'price':0, 'limitNumQueue':0, 'limitTotalQueue':0, 'duration':12, 'limitFetches':0, 'autoGoHam':true, 'hamDuration':4, 'acceptLimit':0};
    if (!doCustom) {
      let table1 = $(`<table class='table table-dark table-hover table-sm pcm_detailsTable table-bordered mb-0'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
      displayObjectData([
        {'label':'Requester Name:', 'type':'text', 'key':'reqName', 'tooltip':'The requester name for this job. May not be changed by user.'},
        {'label':'Hit Title:', 'type':'text', 'key':'hitTitle', 'tooltip':'The requester name for this job. May not be changed by user.'},
        {'label':'Pay Amount:', 'type':'text', 'key':'price', 'tooltip':'The payment reward for this job. May not be changed by user.'},
      ], table1, data, true);
    }
    $(`<div class='text-left pl-5' style='color:aqua'>Panda hits auto collecting options:</div>`).appendTo(df);
    let table2 = $(`<table class='table table-dark table-hover table-sm pcm_detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
    displayObjectData([
      {'label':'Limit # of GroupID in queue:', 'type':'range', 'key':'limitNumQueue', 'min':0, 'max':24, 'tooltip':'Limit number of hits in queue by this group ID. Great way to do batches slowly.'},
      {'label':'Limit # of total Hits in queue:', 'type':'range', 'key':'limitTotalQueue', 'min':0, 'max':24, 'tooltip':'Limit number of hits allowed in queue. Good when you want to leave room in queue for better hits.'},
      {'label':'Stop Collecting After (seconds):', 'type':'number', 'key':'duration', 'seconds':true, 'min':0, 'max':120, 'default':0, 'tooltip':'The number of minutes for this job to collect before stopping. Resets time if a hit gets collected.'},
      {'label':'Stop Collecting After # of fetches:', 'type':'number', 'key':'limitFetches', 'default':0, 'tooltip':'Number of tries to catch a hit to do before stopping.'},
      {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key':'autoGoHam', 'tooltip':'Should this job go ham when it finds a hit and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
      {'label':'Force Delayed Ham Duration (seconds):', 'type':'number', 'key':'hamDuration', 'seconds':true, 'min':0, 'max':60, 'default':0, 'tooltip':'The duration in seconds to use to go in ham mode after collecting a hit and then go back to normal collecting mode.'},
      {'label':'Daily Accepted Hit Limit:', 'type':'number', 'key':'acceptLimit', 'default':0, 'tooltip':'How many hits a day should be accepted for this job?'},
    ], table2, data, true);
    modal.showModal(null, () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $('#pcm_formAddGroupID').keypress( (e) => {
        if((event.keyCode ? event.keyCode : event.which) == '13') checkTrigger.call(this);
      });
      $('#pcm_triggerEnabled').click( e => $('#pcm_formAddGroupID').focus() );
      $('#pcm_onlyOnce').click( e => $('#pcm_formAddGroupID').focus() );
      $('#pcm_formAddGroupID').focus();
    }, () => { modal = null; if (afterClose) afterClose(); });
    function wrongInput(errorStr=null) {
      $(`#${idName} .modal-content`).css('background-color', 'white'); $(`#${idName} .${modal.classModalBody}`).css('opacity', '1.0');
      $(`label[for='pcm_formAddGroupID']`).css('color', '#f78976');
      $(div).find('.pcm_inputError:first').html((errorStr) ? errorStr : 'Must fill in GroupID, Requester ID or URL!').data('gIdEmpty',true);
    }
    /** Verifies that the groupID inputted is correct. */
    async function checkTrigger() {
      const groupVal = $('#pcm_formAddGroupID').val();
      if (/(^http[s]{0,1}\:\/\/[^\s]*\/(projects|requesters)\/[^\s]*\/(tasks|projects)|^[Aa][^\s]{5,20}|^[^\s]{10,50})/.test(groupVal)) {
        let groupId = null, reqId = null; console.log('data', data);
        if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal); else if (groupVal.match(/^[^Aa]/)) groupId = groupVal; else { reqId = groupVal;}
        if (!reqId && !groupId) wrongInput();
        else {
          $(`#${idName} .modal-content`).css('background-color', 'black'); $(`#${idName} .${modal.classModalBody}`).css('opacity', '0.1');
          let type = (reqId) ? 'rid' : 'gid', enabled = ($('#pcm_triggerEnabled').is(':checked') ? 'searching' : 'disabled');
          let theName = $('#pcm_formTriggerName').val(); if (theName === '') theName = (reqId) ? reqId : groupId;
          let addSuccess = await bgSearchClass.addTrigger(type, {'name':theName, 'reqId':reqId, 'groupId':groupId, 'title':data.hitTitle, 'reqName':data.reqName, 'pay':data.price, 'status':enabled}, {'duration': data.duration, 'once':$('#pcm_onlyOnce').is(':checked'), 'limitNumQueue':data.limitNumQueue, 'limitTotalQueue':data.limitTotalQueue, 'limitFetches':data.limitFetches, 'autoGoHam':data.autoGoHam, 'tempGoHam':data.hamDuration, 'acceptLimit':data.acceptLimit});
          if (addSuccess) { search.appendFragments(); modal.closeModal(); }
          else wrongInput('There is already a trigger with this value. Sorry. Please try again.');
        }
      } else wrongInput();
    }
  }
}