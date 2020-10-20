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
    const idName = modal.prepareModal(null, '920px', 'modal-header-info modal-lg', 'Add new Search Trigger', '<h4>Enter New Search Trigger Information.</h4>', 'text-right bg-dark text-light pcm_searchModal', 'modal-footer-info', 'visible btn-sm', 'Add new Search Trigger', () => { checkTrigger(doCustom); }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
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
    let data = {'reqName':'', 'hitTitle':'', 'price':0, 'limitNumQueue':0, 'limitTotalQueue':0, 'duration':(doCustom) ? 0 : 12, 'limitFetches':(doCustom) ? 1800 : 0, 'autoGoHam':true, 'hamDuration':(doCustom) ? 8000 : 4000, 'acceptLimit':0};
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
        if((e.keyCode ? e.keyCode : e.which) == '13') checkTrigger.call(this);
      });
      $('#pcm_triggerEnabled').click( e => $('#pcm_formAddGroupID').focus() );
      $('#pcm_onlyOnce').click( e => $('#pcm_formAddGroupID').focus() );
      $('#pcm_formAddGroupID').focus();
    }, () => { modal = null; if (afterClose) afterClose(); });
    function wrongInput(errorStr=null, theProblem=null) {
      $(`#${idName} .modal-content`).css('background-color', 'white'); $(`#${idName} .${modal.classModalBody}`).css('opacity', '1.0');
      if (theProblem) { $(`label`).css('color', ''); theProblem.css('color', '#f78976'); }
      $(div).find('.pcm_inputError:first').html((errorStr) ? errorStr : 'Must fill in GroupID, Requester ID or URL!').data('gIdEmpty',true);
    }
    /** Verifies that the groupID inputted is correct. */
    async function checkTrigger(doCustom) {
      let groupVal = $('#pcm_formAddGroupID').val(), trigName = $('#pcm_formTriggerName').val(), minPay = parseFloat($('#pcm_formMinPay').val());
      if (doCustom && groupVal.length <= 3) wrongInput('All custom Triggers MUST have a term to search for with more than 3 characters!', $(`label[for='pcm_formAddGroupID']`));
      else if (doCustom && trigName.length <= 3) wrongInput('You must fill in the Unique Trigger Name!', $(`label[for='pcm_formTriggerName']`));
      else if (doCustom && (isNaN(minPay) || minPay === 0)) wrongInput('All custom Triggers need to have a minimum pay rate!', $(`label[for='pcm_formMinPay']`));
      else if ((doCustom) || /(^http[s]{0,1}\:\/\/[^\s]*\/(projects|requesters)\/[^\s]*\/(tasks|projects)|^[Aa][^\s]{5,20}|^[^\s]{10,50})/.test(groupVal)) {
        let groupId = null, reqId = null;
        if (!doCustom) { if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal); else if (groupVal.match(/^[^Aa]/)) groupId = groupVal; else { reqId = groupVal;} }
        if (!doCustom && !reqId && !groupId) wrongInput(_, $(`label[for='pcm_formAddGroupID']`));
        else {
          $(`#${idName} .modal-content`).css('background-color', 'black'); $(`#${idName} .${modal.classModalBody}`).css('opacity', '0.1');
          let type = (reqId) ? 'rid' : (groupId) ? 'gid' : 'custom', enabled = ($('#pcm_triggerEnabled').is(':checked') ? 'searching' : 'disabled');
          let theName = (trigName) ? trigName : (reqId) ? reqId : groupId;
          let theRules = (doCustom) ? {'terms':true, 'include':new Set([groupVal]), 'payRange': true, 'minPay':minPay} : {};
          let addSuccess = await bgSearch.addTrigger(type, {'name':theName, 'reqId':reqId, 'groupId':groupId, 'title':data.hitTitle, 'reqName':data.reqName, 'pay':data.price, 'status':enabled}, {'duration': data.duration, 'once':$('#pcm_onlyOnce').is(':checked'), 'limitNumQueue':data.limitNumQueue, 'limitTotalQueue':data.limitTotalQueue, 'limitFetches':data.limitFetches, 'autoGoHam':data.autoGoHam, 'tempGoHam':data.hamDuration, 'acceptLimit':data.acceptLimit}, theRules);
          if (addSuccess) { search.appendFragments(); modal.closeModal(); }
          else wrongInput('There is already a trigger with this value. Sorry. Please try again.', $(`label[for='pcm_formAddGroupID']`));
        }
      } else wrongInput(_, $(`label[for='pcm_formAddGroupID']`));
    }
  }
  async showDetailsModal(unique, afterClose=null) {
    if (!modal) modal = new ModalClass(); let dbId = bgSearch.uniqueToDbId(unique);
    let searchChanges = {'details':Object.assign({}, bgSearch.data[dbId]), 'rules':null, 'options':null, 'searchDbId':null};
    const idName = modal.prepareModal(searchChanges, "700px", "modal-header-info modal-lg", "Details for a Trigger", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save New Details", async (changes) => {
      $(`.pcm_eleLabel`).css('color', '');
      if (changes.details.type === 'custom' && changes.rules.include.size === 0) {
        $(`#${idName} .pcm_inputError`).html('Custom searches MUST have 1 Accepted term or word!');
        $(`#pcm_tdLabel_acceptWords1, #pcm_tdLabel_acceptWords2`).css('color', 'red');
      } else {
        await bgSearch.optionsChanged(changes, changes.searchDbId);
        $(`#pcm_triggerName_${unique}`).html(changes.details.name);
        modal.closeModal();
      }
    }, "invisible", "No", null, "visible btn-sm", "Cancel");
    const modalBody = $(`#${idName} .${modal.classModalBody}`); modalBody.css({'padding':'1rem 0.3rem'});
    let df = document.createDocumentFragment(), detailContents = null;
    detailContents = $(`<div class='pcm_detailCont card-deck'></div>`).appendTo(modalBody);
    this.triggerOptions(df, dbId, null, modal.tempObject[idName]);
    modal.showModal(null, () => {
      $(`<table class='table table-dark table-sm pcm_detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).append(df).appendTo(detailContents);
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
  rulesToStr(rules, placeHere=null) {
    let ruleStr = ''; for (const value of rules.values()) { ruleStr += `${value}, `; }
    ruleStr = ruleStr.slice(0, -2);
    if (placeHere) placeHere.html((ruleStr) ? ruleStr: '{Empty}');
    return ruleStr;
  }
  selectBoxAdd(values, appendHere) {
    appendHere.html('');
    for (let i=0, len=values.length; i < len; i++) { appendHere.append(`<option value='${i}'>${values[i]}</option>`); }
  }
  editTriggerOptions(editSet, text, text2, validFunc, saveFunc, type, notEmpty=false) {
    if (!modal) modal = new ModalClass();
    let values = Array.from(editSet);
    const idName = modal.prepareModal(null, '640px', 'modal-header-info modal-lg', 'Edit Search Options', '', 'text-right bg-dark text-light', 'modal-footer-info', 'visible btn-sm', 'Done', saveFunc, 'invisible', 'No', null, 'invisible', 'Cancel');
    let df = document.createDocumentFragment();
    $(`<div><div class='pcm_inputError'></div><div style='color:aqua'>Add a ${text} or remove others.</div></div>`).appendTo(df);
    if (type === 'custom') $(`<div style='color:khaki' class='small'>All Custom Searches must have one 3 character Accepted term or word.<br>Adding more include or exclude words may cause script to find hits slower.</div>`).appendTo(df);
    let form = $(`<div class='form-group row'></div>`).appendTo(df);
    let selectBox = $(`<select class='form-control input-sm col-5 mx-auto' id='pcm_selectedBox' multiple size='10'></select>`).appendTo(form);
    this.selectBoxAdd(values, $(selectBox));
    $(`<button class="btn btn-xs btn-primary ml-1 pcm_addToSelect">Add ${text2}</button>`).on( 'click', (e) => {
      modal.showDialogModal('750px', `Add New ${text}`, `Type in a ${text2}.`, () => {
        const newValue = $('#pcm_formQuestion').val();
        if (newValue && validFunc(newValue)) { editSet.add(newValue); values = Array.from(editSet); this.selectBoxAdd(values, $(selectBox)); modal.closeModal(); }
      }, true, false, `${text2}: `, ``, 35,_, () => {}, `Add ${text2}`,_,_,(text2 === 'Group ID') ? 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY' : 'example: survey');
    }).appendTo(df);
    $('<button class="btn btn-xs btn-primary ml-1 pcm_addToSelect">Remove Selected</button>').on( 'click', (e) => {
      let removeList = $(selectBox).val();
      if (type !== 'custom' || !notEmpty || (type === 'custom' && values.length > 1)) {
        for (const index of removeList) { editSet.delete(values[index]); }
        values = Array.from(editSet); this.selectBoxAdd(values, $(selectBox));
      }
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
  async triggerOptions(appendHere, dbId, pDbId, changes) {
    let bGStr = '', eTStr = '', iTStr = ''; changes.searchDbId = (dbId !== null) ? dbId : bgSearch.pandaToDbId(pDbId);
    $(`<div class='pcm_inputError'></div><div class='pcm_optionsEdit text-center mb-2 w-100'>Options: Click on the details or buttons to edit.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm_detailsTable table-bordered w-100'></table>`).appendTo(appendHere);
    changes.rules = await bgSearch.rulesCopy(changes.searchDbId); changes.options = await bgSearch.optionsCopy(changes.searchDbId);
    bGStr = this.rulesToStr(changes.rules.blockGid); eTStr = this.rulesToStr(changes.rules.exclude); iTStr = this.rulesToStr(changes.rules.include);
    displayObjectData([
      {'label':'Group or Requester ID', 'type':'text', 'key1':'details', 'key':'value', 'keyCheck':'type', 'keyCheckNot':'custom', 'disable':true, 'default':0, 'tooltip':'Value of this trigger'},
      {'label':'Unique Trigger Name:', 'type':'text', 'key1':'details', 'key':'name', 'tooltip':'The unique name for this trigger.'},
      {'label':'Disabled?:', 'type':'trueFalse', 'key1':'details', 'key':'disabled', 'tooltip':'Should trigger be disabled?'},
      {'label':'Minimum Pay:', 'type':'number', 'key':'minPay', 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The minimum pay for hit to start collecting.'},
      {'label':'Maximum Pay:', 'type':'number', 'key':'maxPay', 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The maximum pay for hit to start collecting.'},
      {'label':'Words or phrases Accepted only:', 'id':'pcm_string_include', 'type':'string', 'string':iTStr, 'disable':true, 'default':0, 'tooltip':'Hits with these words or phrases only will try to be collected.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Accepted Words or Phrases', 'addClass':' btn-xxs', 'key':'acceptWords2', 'width':'165px', 'unique':1, 'btnFunc': (e) => {
        this.editTriggerOptions(changes.rules.include, 'Word or phrase to watch for', 'Word or phrase', () => { return true; }, () => {
          iTStr = this.rulesToStr(changes.rules.include, $('#pcm_string_include')); modal.closeModal();
        }, changes.details.type, true);
      }},
      {'label':'Excluded words or phrases:', 'id':'pcm_string_exclude', 'type':'string', 'string':eTStr, 'disable':true, 'default':0, 'tooltip':'Hits with these words or phrases will be ignored.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Excluded Words or Phrases', 'addClass':' btn-xxs', 'idStart':'pcm_excludeWord_', 'width':'175px', 'unique':1, 'btnFunc': (e) => {
        this.editTriggerOptions(changes.rules.exclude, 'Word or phrase to exclude', 'Word or phrase', () => { return true; }, () => {
          eTStr = this.rulesToStr(changes.rules.exclude, $('#pcm_string_exclude')); modal.closeModal();
        }, changes.details.type);
      }},
      {'label':'Excluded Group IDs', 'id':'pcm_string_blockGid', 'type':'string', 'string':bGStr, 'disable':true, 'default':0, 'tooltip':'Hits with these group IDs will try to be collected only.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Excluded Group IDs', 'addClass':' btn-xxs', 'idStart':'pcm_excludeGid_', 'width':'175px', 'unique':1, 'btnFunc': (e) => {
        this.editTriggerOptions(changes.rules.blockGid, 'Group ID to block', 'Group ID', (value) => { return value.match(/^[^Aa][0-9a-zA-Z]{15,35}$/); }, () => {
          bGStr = this.rulesToStr(changes.rules.blockGid, $('#pcm_string_blockGid')); modal.closeModal();
        }, changes.details.type);
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
  async showTriggerFound(unique) {
    if (!modal) modal = new ModalClass(); let dbId = bgSearch.uniqueToDbId(unique);
    const idName = modal.prepareModal(null, '860px', 'modal-header-info modal-lg', 'Edit Search Options', '', 'text-right bg-dark text-light m-0 p-1', 'modal-footer-info', 'visible btn-sm', 'Done', () => { modal.closeModal(); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    let df = document.createDocumentFragment();
    modal.showModal(null, async () => {
      let groupHist = await bgSearch.getFromDB('history', dbId), rules = await bgSearch.theData(dbId, 'rules'), blocked = rules.blockGid;
      let gidsHistory = await bgHistory.findValues(Object.keys(groupHist.gids));
      let theTable = $(`<table class='table table-dark table-sm pcm_detailsTable table-moreCondensed table-bordered m-0'></table>`)
        .append(`<thead><tr><td style='width:75px; max-width:75px;'>date</td><td style='width:82px; max-width:82px;'>Gid</td><td style='width:130px; max-width:130px;'>Title</td><td style='width:440px; max-width:440px'>Descriptions</td><td style='width:52px; max-width:52px;'>Pays</td><td style='width: 70px; max-width:70px;'></td></tr></thead>`).append(`<tbody></tbody>`).appendTo(df);
      for (const key of Object.keys(groupHist.gids)) {
        let dateString = '----', title = '----', description = '----', pays = '----';
        if (gidsHistory[key]) {
          let theDate = new Date(gidsHistory[key].date); dateString = theDate.toLocaleDateString('en-US', {'month':'short', 'day':'2-digit'}).replace(' ','');
          dateString += ' ' + theDate.toLocaleTimeString('en-GB', {'hour':'2-digit', 'minute':'2-digit'});
          title = gidsHistory[key].title; description = gidsHistory[key].description; pays = gidsHistory[key].pay.toFixed(2);
        }
        let tempObj = {'date':dateString,'gid':shortenGroupId(key, 4, 4), 'title':title, 'desc':description, 'pays':'$' + pays};
        let btnLabel = (blocked.has(key)) ? 'Unblock' : 'Block Hit', btnColor = (blocked.has(key)) ? 'danger' : 'primary';
        displayObjectData([
          {'type':'keyValue', 'key':'date', 'maxWidth':'75px'}, {'type':'keyValue', 'key':'gid', 'maxWidth':'82px'},
          {'type':'keyValue', 'key':'title', 'maxWidth':'130px'}, {'type':'keyValue', 'key':'desc', 'maxWidth':'440px'}, {'type':'keyValue', 'key':'pays', 'maxWidth':'52px'},
          {'label':'block', 'type':'button', 'btnLabel':btnLabel, 'btnColor':btnColor, 'addClass':" btn-xxs", 'maxWidth':'70px', 'btnFunc': (e) => {
            if (blocked.has(key)) { blocked.delete(key); $(e.target).removeClass(`btn-danger`).addClass(`btn-primary`).html('Block Hit'); }
            else { blocked.add(key); $(e.target).removeClass(`btn-primary`).addClass(`btn-danger`).html('Unblock'); }
            rules.blockGid = blocked; bgSearch.theData(dbId, 'rules', rules)
          }}
        ], theTable.find(`tbody`), tempObj, true, true, '#0b716c');
      }
      $(`#${idName} .${modal.classModalBody}`).append(df);
    });
  }
  showSearchAlarms() { let modalAlarms = new ModalAlarmClass(); modalAlarms.showAlarmsModal( () => modalAlarms = null, true ); }
  showSearchOptions() {
    if (!modal) modal = new ModalClass();
    let theData = {'toSearchUI':globalOpt.theToSearchUI(), 'searchTimer':globalOpt.theSearchTimer(), 'options':globalOpt.doSearch()}
    const idName = modal.prepareModal(theData, '860px', 'modal-header-info modal-lg', 'Edit Search General Options', '', 'text-right bg-dark text-light m-0 p-1', 'modal-footer-info', 'visible btn-sm', 'Save Options', (changes) => { console.log(changes);
      globalOpt.theToSearchUI(changes.toSearchUI, false); globalOpt.theSearchTimer(changes.searchTimer, false);
      globalOpt.doSearch(changes.options); bgSearch.timerChange(changes.searchTimer);
      modal.closeModal();
    }, 'invisible', 'No', null, 'invisible', 'Cancel');
    let df = document.createDocumentFragment();
    $(`<div class='pcm_detailsEdit text-center mb-2'>Click on the options you would like to change below:</div>`).appendTo(df);
    displayObjectData( [
      {'label':'Search job buttons create search UI triggers:', 'type':'trueFalse', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'}, 
      {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':`Change the search timer duration for hits to be searched and found in milliseconds. Minimum is ok.`},
      {'label':'Default trigger duration in seconds:', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultDuration', 'tooltip':`The default duration for new triggers to use on panda jobs.`},
      {'label':'Page size for mturk search page:', 'type':'number', 'key1':'options', 'key':'pageSize', 'tooltip':`Number of hits used on mturk first search page. The higher the number can slow searching but also can give a better chance of finding hits you want.`},
    ], df, modal.tempObject[idName], true);
    modal.showModal(() => {}, async () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
    }, () => { modal = null; });
  }
  showSearchAdvanced() {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doSearch(), '860px', 'modal-header-info modal-lg', 'Edit Search Advanced Options', '', 'text-right bg-dark text-light m-0 p-1', 'modal-footer-info', 'visible btn-sm', 'Save Options', () => {
      globalOpt.doSearch(changes); modal.closeModal();
    }, 'invisible', 'No', null, 'invisible', 'Cancel');
    let df = document.createDocumentFragment();
    $(`<div class='pcm_detailsEdit text-center mb-2'>Click on the options you would like to change below:</div>`).appendTo(df);
    displayObjectData( [
      {'label':'Number of trigger data to keep in memory:', 'type':'number', 'key':'queueSize', 'tooltip':`To save memory the script will only keep this number of most active trigger data in memory and the rest in the database. Loading from database can be slower.`},
      {'label':'Trigger hits history days expiriration:', 'type':'number', 'key':'triggerHistDays', 'tooltip':`Hits found by trigger is saved in the database and this number represents the days to keep those hits saved.`},
      {'label':'CUSTOM hits history days expiration:', 'type':'number', 'key':'customHistDays', 'tooltip':`Custom triggered hits can find a large amount of hits so this number represents how many days to save these found hits. Should be lower than regular triggers.`},
    ], df, modal.tempObject[idName], true);
    modal.showModal(() => {}, async () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
    }, () => { modal = null; });
  }
}