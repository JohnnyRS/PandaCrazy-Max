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
    let data = {'reqName':'', 'hitTitle':'', 'price':0, 'limitNumQueue':0, 'limitTotalQueue':0, 'duration':12000, 'limitFetches':0, 'autoGoHam':true, 'hamDuration':4000, 'acceptLimit':0};
    if (!doCustom) {
      let table1 = $(`<table class='table table-dark table-hover table-sm pcm_detailsTable table-bordered mb-0'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
      displayObjectData([
        {'label':'Requester Name:', 'type':'text', 'key':'reqName', 'tooltip':'The requester name for this job. May not be changed by user.'},
        {'label':'Hit Title:', 'type':'text', 'key':'hitTitle', 'tooltip':'The requester name for this job. May not be changed by user.'},
        {'label':'Pay Amount:', 'type':'text', 'key':'price', 'tooltip':'The payment reward for this job. May not be changed by user.'},
      ], table1, data, true);
    }
    $(`<div class='text-left pl-5' style='color:aqua'>Panda hits auto collecting options (optional):</div>`).appendTo(df);
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
        let groupId = null, reqId = null;
        if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal); else if (groupVal.match(/^[^Aa]/)) groupId = groupVal; else { reqId = groupVal;}
        if (!reqId && !groupId) wrongInput();
        else {
          $(`#${idName} .modal-content`).css('background-color', 'black'); $(`#${idName} .${modal.classModalBody}`).css('opacity', '0.1');
          let type = (reqId) ? 'rid' : 'gid', enabled = ($('#pcm_triggerEnabled').is(':checked') ? 'searching' : 'disabled');
          let theName = $('#pcm_formTriggerName').val(); if (theName === '') theName = (reqId) ? reqId : groupId;
          let addSuccess = await bgSearch.addTrigger(type, {'name':theName, 'reqId':reqId, 'groupId':groupId, 'title':data.hitTitle, 'reqName':data.reqName, 'pay':data.price, 'status':enabled}, {'duration': data.duration, 'once':$('#pcm_onlyOnce').is(':checked'), 'limitNumQueue':data.limitNumQueue, 'limitTotalQueue':data.limitTotalQueue, 'limitFetches':data.limitFetches, 'autoGoHam':data.autoGoHam, 'tempGoHam':data.hamDuration, 'acceptLimit':data.acceptLimit});
          if (addSuccess) { search.appendFragments(); modal.closeModal(); }
          else wrongInput('There is already a trigger with this value. Sorry. Please try again.');
        }
      } else wrongInput();
    }
  }
  async showDetailsModal(unique, afterClose=null) {
    if (!modal) modal = new ModalClass(); let dbId = bgSearch.uniqueToDbId(unique);
    await bgSearch.pingTriggers(dbId).then( () => { return; } );
    let searchChanges = {'details':Object.assign({}, bgSearch.data[dbId]), 'rules':null, 'options':null, 'searchDbId':null};
    const idName = modal.prepareModal(searchChanges, "700px", "modal-header-info modal-lg", "Details for a Trigger", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save New Details", async (changes) => {
      bgSearch.optionsChanged(changes, changes.searchDbId);
      $(`#pcm_triggerName_${unique}`).html(changes.details.name);
      modal.closeModal();
    }, "invisible", "No", null, "visible btn-sm", "Cancel");
    const modalBody = $(`#${idName} .${modal.classModalBody}`); modalBody.css({'padding':'1rem 0.3rem'});
    let df = document.createDocumentFragment(), detailContents = null;
    detailContents = $(`<div class='pcm_detailCont card-deck'></div>`).appendTo(modalBody);
    this.triggerOptions(df, dbId, null, modal.tempObject[idName]);
    modal.showModal(null, () => {
      $(`<table class='table table-dark table-sm pcm_detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).append(df).appendTo(detailContents);
      modalBody.find(`[data-toggle='tooltip']`).tooltip({delay: {show:1200}, trigger:'hover'});
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
  rulesToStr(rules, placeHere=null) {
    let ruleStr = ''; for (const value of rules.values()) { ruleStr += `${value}, `; }
    if (placeHere) placeHere.html(ruleStr.slice(0, -2));
    return ruleStr;
  }
  selectBoxAdd(values, appendHere) {
    appendHere.html('');
    for (let i=0, len=values.length; i < len; i++) { appendHere.append(`<option value='${i}'>${values[i]}</option>`); }
  }
  editTriggerOptions(editSet, text, text2, validFunc, saveFunc) {
    if (!modal) modal = new ModalClass();
    let values = Array.from(editSet);
    const idName = modal.prepareModal(null, '640px', 'modal-header-info modal-lg', 'Edit Search Options', '', 'text-right bg-dark text-light', 'modal-footer-info', 'visible btn-sm', 'Done', saveFunc, 'invisible', 'No', null, 'invisible', 'Cancel');
    let df = document.createDocumentFragment();
    let div = $(`<div><div class='pcm_inputError'></div><div style='color:aqua'>Add a ${text} or remove others.</div></div>`).appendTo(df);
    let form = $(`<div class='form-group row'></div>`).appendTo(df);
    let selectBox = $(`<select class='form-control input-sm col-5 mx-auto' id='pcm_selectedBox' multiple size='10'></select>`).appendTo(form);
    this.selectBoxAdd(values, $(selectBox));
    $(`<button class="btn btn-xs btn-primary ml-1 pcm_addToSelect">Add ${text2}</button>`).on( 'click', (e) => {
      modal.showDialogModal('700px', `Add New ${text}`, `Type in a ${text2}.`, () => {
        const newValue = $('#pcm_formQuestion').val();
        if (newValue && validFunc(newValue)) { editSet.add(newValue); values = Array.from(editSet); this.selectBoxAdd(values, $(selectBox)); modal.closeModal(); }
      }, true, false, `${text2}: `, ``, 35,_, () => {}, `Add ${text2}`,_,_,'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY');
    }).appendTo(df);
    $('<button class="btn btn-xs btn-primary ml-1 pcm_addToSelect">Remove Selected</button>').on( 'click', (e) => {
      let removeList = $(selectBox).val();
      for (const index of removeList) { editSet.delete(values[index]); }
      values = Array.from(editSet); this.selectBoxAdd(values, $(selectBox));
    }).appendTo(df);
    modal.showModal(null, () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $(`#${idName}`).keypress( (e) => {
        if((e.keyCode ? e.keyCode : e.which) == '13') saveFunc();
      });
    }, () => { });
  }
  /** Shows the options for search jobs and allows users to change or add rules.
   * @param  {object} appendHere - Jquery object @param  {number} dbId - The dbId of the panda job to be shown. */
  async triggerOptions(appendHere, dbId, pdbId, changes) {
    let bGStr = '', eTStr = '', iTStr = '';
    changes.searchDbId = await bgSearch.pingTriggers(dbId, pdbId).then( (d) => { return d; } );
    $(`<div class='pcm_optionsEdit text-center mb-2 w-100'>Options: Click on the details or buttons to edit.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm_detailsTable table-bordered w-100'></table>`).appendTo(appendHere);
    changes.rules = bgSearch.rulesCopy(changes.searchDbId); changes.options = bgSearch.optionsCopy(changes.searchDbId);
    bGStr = this.rulesToStr(changes.rules.blockGid); eTStr = this.rulesToStr(changes.rules.exclude); iTStr = this.rulesToStr(changes.rules.include);
    displayObjectData([
      {'label':'Unique Trigger Name:', 'type':'text', 'key1':'details', 'key':'name', 'tooltip':'The unique name for this trigger.'},
      {'label':'Disabled?:', 'type':'trueFalse', 'key1':'details', 'key':'disabled', 'tooltip':'Should trigger be disabled?'},
      {'label':"Minimum Pay:", 'type':"number", 'key':"minPay", 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The minimum pay for hit to start collecting.'},
      {'label':"Maximum Pay:", 'type':"number", 'key':"maxPay", 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The maximum pay for hit to start collecting.'},
      {'label':'Words or phrases Accepted only:', 'id':'pcm_string_include', 'type':'string', 'string':iTStr.slice(0, -2), 'disable':true, 'default':0, 'tooltip':'Hits with these words or phrases only will try to be collected.'},
      {'label':"Edit", 'type':"button", 'btnLabel':'Accepted Words or Phrases', 'addClass':" btn-xxs", 'idStart':"pcm_includeWord_", 'width':"165px", 'unique':1, 'btnFunc': (e) => {
        this.editTriggerOptions(changes.rules.include, 'Word or phrase to watch for', 'Word or phrase', () => { return true; }, () => {
          iTStr = this.rulesToStr(changes.rules.include, $('#pcm_string_include')); modal.closeModal();
        });
      }},
      {'label':'Excluded words or phrases:', 'id':'pcm_string_exclude', 'type':'string', 'string':eTStr.slice(0, -2), 'disable':true, 'default':0, 'tooltip':'Hits with these words or phrases will be ignored.'},
      {'label':"Edit", 'type':"button", 'btnLabel':'Excluded Words or Phrases', 'addClass':" btn-xxs", 'idStart':"pcm_excludeWord_", 'width':"175px", 'unique':1, 'btnFunc': (e) => {
        this.editTriggerOptions(changes.rules.exclude, 'Word or phrase to exclude', 'Word or phrase', () => { return true; }, () => {
          eTStr = this.rulesToStr(changes.rules.exclude, $('#pcm_string_exclude')); modal.closeModal();
        });
      }},
      {'label':'Excluded Group IDs', 'id':'pcm_string_blockGid', 'type':'string', 'string':bGStr.slice(0, -2), 'disable':true, 'default':0, 'tooltip':'Hits with these group IDs will try to be collected only.'},
      {'label':"Edit", 'type':"button", 'btnLabel':'Excluded Group IDs', 'addClass':" btn-xxs", 'idStart':"pcm_excludeGid_", 'width':"175px", 'unique':1, 'btnFunc': (e) => {
        this.editTriggerOptions(changes.rules.blockGid, 'Group ID to block', 'Group ID', (value) => { return value.match(/^[^Aa][0-9a-zA-Z]{15,35}$/); }, () => {
          bGStr = this.rulesToStr(changes.rules.blockGid, $('#pcm_string_blockGid')); modal.closeModal();
        });
      }},
      {'label':'Limit # of GroupID in queue:', 'type':'range', 'key1':'options', 'key':'limitNumQueue', 'min':0, 'max':24, 'tooltip':'Limit number of hits in queue by this group ID. Great way to do batches slowly.'},
      {'label':'Limit # of total Hits in queue:', 'type':'range', 'key1':'options', 'key':'limitTotalQueue', 'min':0, 'max':24, 'tooltip':'Limit number of hits allowed in queue. Good when you want to leave room in queue for better hits.'},
      {'label':'Accept Only Once:', 'type':'trueFalse', 'key1':'options', 'key':'once', 'tooltip':'Should only one hit be accepted and then stop collecting? Great for surveys.'},
      {'label':'Daily Accepted Hit Limit:', 'type':'number', 'key1':'options', 'key':'acceptLimit', 'default':0, 'tooltip':'How many hits a day should be accepted for this job?'},
      {'label':'Stop Collecting After (seconds):', 'type':'number', 'key1':'options', 'key':'duration', 'seconds':true, 'min':0, 'max':120, 'default':0, 'tooltip':'The number of seconds for hits found to collect before stopping. Resets time if a hit gets collected.'},
      {'label':'Stop Collecting After # of fetches:', 'type':'number', 'key1':'options', 'key':'limitFetches', 'default':0, 'tooltip':'Number of tries to catch a hit to do before stopping.'},
      {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key1':'options', 'key':'autoGoHam', 'tooltip':'Should this job go ham when it finds a hit and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
      {'label':'Temporary Start Ham Duration (seconds):', 'type':'number', 'key1':'options', 'key':'tempGoHam', 'seconds':true, 'min':0, 'max':120, 'default':0, 'tooltip':'The duration in seconds to use to go in ham mode after starting to collect a hit and then go back to normal collecting mode.'},
    ], theTable, changes, true);
  }
  showTriggerFound() {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(null, '640px', 'modal-header-info modal-lg', 'Edit Search Options', '', 'text-right bg-dark text-light', 'modal-footer-info', 'visible btn-sm', 'Done', saveFunc, 'invisible', 'No', null, 'invisible', 'Cancel');
    let df = document.createDocumentFragment();
    modal.showModal(null, () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
    }, () => { });
  }
}