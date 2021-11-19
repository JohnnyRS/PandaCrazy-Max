/** This class deals with any showing of modals for search triggers.
 * @class ModalSearchClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalSearchClass {
	constructor() {
    this.pandaDur = {'min':0, 'max':360};            // The minimum and maximum duration for panda jobs in minutes. (6 hours max)
    this.pandaDurSeconds = {'min':0, 'max':21600};   // The minimum and maximum duration for panda jobs in seconds. (6 hours max)
    this.hamDur = {'min':2, 'max':120};              // The minimum and maximum duration for panda ham duration in seconds. (2 minutes max)
    this.pandaHamDur = {'min':0, 'max':120};         // The minimum and maximum duration for panda ham duration in seconds. (2 minutes max)
    this.dailyLimitRange = {'min':0, 'max':5000};    // The minimum and maximum number of HITs allowed in a day for a panda job.
    this.fetchesTempDur = {'min':0, 'max':21600};    // The minimum and maximum number of fetches allowed. (6 hour max approximately)
    this.fetchesDur = {'min':0, 'max':21600};        // The minimum and maximum number of fetches allowed. (6 hour max approximately)
    this.pageSize = {'min':20, 'max':100};           // The minimum and maximum amount of HITs for MTURK to show on one search page.
    this.queueSize = {'min':20, 'max':600};          // The minimum and maximum amount of triggers to keep in memory for faster operation vs larger memory used.
    this.triggerHistDays = {'min':2, 'max':120};     // The minimum and maximum amount of days allowed to keep HIT and requester info in database.
    this.customHistDays = {'min':2, 'max':60};       // The minimum and maximum amount of days allowed to keep HIT and requester info in database from custom triggers.
    this.autoRange = {'min':1, 'max':5};             // The minimum and maximum amount of panda's to try to grab from an automatic custom trigger.
    this.minPayRange = {'min':0.00, 'max':300.00};   // The minimum and maximum amount of pay for MTURK to filter on the search page.
  }
  /** Shows a modal for adding panda or search jobs.
   * @param  {function} [afterClose] - After Function  @param {bool} [doCustom] - Custom Trigger? */
  showTriggerAddModal(afterClose=null, doCustom=false) {
    /** Displays an error string and adds an error class to the label given.
     * @param {object} doc - Document Fragment  @param {string} [errorStr] - Error String  @param {object} - Label Element */
    let wrongInput = (doc, errorStr=null, theProblem=null) => {
      if (theProblem) { $(`label`).removeClass(`pcm-inputError`); theProblem.addClass('pcm-inputError'); }
      $(doc).find('.pcm-checkStatus.pcm-inputError').html((errorStr) ? errorStr : `Invalid ID or URL. Must fill in GroupID, Requester ID or URL!`).data('gIdEmpty',true);
    }
    /** Verifies that the groupID inputted is correct.
     * @async                 - To wait until trigger is added.
     * @param {bool} doCustom - Custom Trigger?  @param {object} idName - Modal ID Name */
    let checkTrigger = async (doCustom, idName, data) => {
      let modalBody = $(`#${idName} .${modal.classModalBody}`);
      let groupVal = $('#pcm-formAddGroupID').val(), trigName = $('#pcm-formTriggerName').val(), minPay = parseFloat($('#pcm-formMinPay').val());
      if (doCustom && groupVal.length <= 3) wrongInput(modalBody, 'All custom Triggers MUST have a word or phrase to search for with more than 3 characters!', $(`label[for='pcm-formAddGroupID']`));
      else if (doCustom && trigName.length <= 3) wrongInput(modalBody, 'You must fill in a Unique Trigger Name with more than 3 letters!', $(`label[for='pcm-formTriggerName']`));
      else if (doCustom && (isNaN(minPay))) wrongInput(modalBody, 'All custom Triggers need to have a minimum pay filled in with numbers and a decimal only!', $(`label[for='pcm-formMinPay']`));
      else if ((doCustom) || testGidRid(groupVal)) {
        let groupId = null, reqId = null;
        if (!doCustom) { if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal); else if (groupVal.match(/^[^Aa]/)) groupId = groupVal; else { reqId = groupVal;} }
        if (!doCustom && !reqId && !groupId) wrongInput(modalBody, _, $(`label[for='pcm-formAddGroupID']`));
        else {
          let type = (reqId) ? 'rid' : (groupId) ? 'gid' : 'custom', enabled = ($('#pcm-triggerEnabled').is(':checked') ? 'searching' : 'disabled');
          let theName = (trigName) ? trigName : (reqId) ? reqId : groupId;
          let theRules = (doCustom) ? {'terms':true, 'include':new Set([groupVal]), 'payRange': true, 'minPay':minPay} : {};
          let addSuccess = await MySearch.addTrigger(type, {'name':theName, 'reqId':reqId, 'groupId':groupId, 'title':data.hitTitle, 'reqName':data.reqName, 'pay':data.price, 'status':enabled}, {'tempDuration': data.duration, 'once':$('#pcm-onlyOnce').is(':checked'), 'limitNumQueue':data.limitNumQueue, 'limitTotalQueue':data.limitTotalQueue, 'tempFetches':data.limitFetches, 'autoGoHam':data.autoGoHam, 'tempGoHam':data.hamDuration, 'acceptLimit':data.acceptLimit, 'auto':data.auto}, theRules);
          if (addSuccess) { MySearchUI.appendFragments(); modal.closeModal(); }
          else wrongInput(modalBody, 'There is already a trigger with this name. Sorry. Please try again.', $(`label[for='pcm-formTriggerName']`));
          theRules = null;
        }
      } else wrongInput(modalBody, _, $(`label[for='pcm-formAddGroupID']`));
    }
    if (!modal) modal = new ModalClass();
    let df = document.createDocumentFragment(), input1Text = '* Enter info for new Job: ', searchOpt = MyOptions.doSearch();
    let data = {'reqName':'', 'hitTitle':'', 'price':0.01, 'limitNumQueue':0, 'limitTotalQueue':0, 'duration':searchOpt.defaultDur, 'limitFetches':searchOpt.defaultFetches, 'autoGoHam':true, 'hamDuration':(doCustom) ? searchOpt.defaultCustHamDur : searchOpt.defaultHamDur, 'acceptLimit':0, 'auto':false};
    let idName = modal.prepareModal(null, '920px', 'pcm-addTriggersModal', 'modal-lg', 'Add new Search Trigger', '<h4>Enter New Search Trigger Information.</h4>', 'pcm-searchModal', '', 'visible btn-sm', 'Add new Search Trigger', async () => { await checkTrigger(doCustom, idName, data); }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    modal.showModal(null, () => {
      let example1Text = 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY', example2Text = 'example: Receipt Processing receipts';
      if (doCustom) {
        $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Enter a word or phrase to search for in titles and descriptions of a HIT:</div></div>`).appendTo(df);
        input1Text = '* Enter custom search word or phrase: '; example1Text = 'example: survey'; example2Text = 'example: Surveys paying over $1.00';
      } else $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Enter a Group ID, Requester ID, Preview URL or accept URL.</div></div>`).appendTo(df);
      createInput(df, ' pcm-inputDiv-url', 'pcm-formAddGroupID', input1Text, example1Text,_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Group ID, Requester ID, Preview URL or Accept URL. This is a required input.');
      createInput(df, ' pcm-inputDiv-name', 'pcm-formTriggerName', `${(doCustom) ? '* ' : ''}Name of the Trigger: `, example2Text,_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Enter in a unique name of the trigger. This is a required input.');
      if (doCustom) createInput(df, ' pcm-inputDiv-pay', 'pcm-formMinPay', '* Pay Min Amount: ', 'example: 1.00',_, ' pcm-tooltipData pcm-tooltipHelper', data.price,_,_,_, 'Enter in the minimum pay amount for this trigger. This is a required input. Default is at 0.01 and can be set at 0.00 but Search Main Option for minReward must be set to 0.00 also for it to work.');
      createCheckBox(df, 'Enabled: ', 'pcm-triggerEnabled', '', true,_,_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Set trigger as enabled after it is added.');
      createCheckBox(df, 'Collect Only One HIT', 'pcm-onlyOnce', '',_,_,_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Any Panda jobs created will only accept one HIT and then stop.');
      $(`<div class='pcm-horizontalRow'></div>`).appendTo(df);
      if (!doCustom) {
        let table1 = $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered pcm-topDetails'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
        displayObjectData([
          {'label':'Requester Name:', 'type':'text', 'key':'reqName', 'tooltip':'Optional Field. The requester name for this job.'},
          {'label':'HIT Title:', 'type':'text', 'key':'hitTitle', 'tooltip':'Optional Field. The HIT title for this job.'},
          {'label':'Pay Amount:', 'type':'text', 'key':'price', 'money':true, 'tooltip':'Optional Field. The payment reward for this job.', 'minMax':this.minPayRange},
        ], table1, data, true);
        table1 = null;
      }
      $(`<div class='pcm-autoCollectOptions'>Panda HITs auto collecting options (optional):</div>`).appendTo(df);
      let table2 = $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
      displayObjectData([
        {'label':'Limit # of GroupID in Queue:', 'type':'range', 'key':'limitNumQueue', 'tooltip':'Optional Field. Limit number of HITs in queue by this group ID. Great way to do batches slowly.', 'minMax':{'min':0, 'max':24}},
        {'label':'Limit # of Total HITs in Queue:', 'type':'range', 'key':'limitTotalQueue', 'tooltip':'Optional Field. Limit number of HITs allowed in queue. Good when you want to leave room in queue for better HITs.', 'minMax':{'min':0, 'max':24}},
        {'label':'Temporary Duration (Seconds):', 'type':'number', 'key':'duration', 'seconds':true, 'default':data.duration, 'tooltip':'Optional Field. The TEMPORARY number of seconds for HITs found to collect before stopping. Resets time if a HIT gets collected. This value can not be 0 if Temporary Fetches is 0 and will revert back to previous value.', 'minMax':this.pandaDurSeconds},
        {'label':'Temporary Number of Fetches:', 'type':'number', 'key':'limitFetches', 'default':data.limitFetches, 'tooltip':'Optional Field. Number of tries to catch a HIT to do before stopping. This value can not be 0 if Temporary Duration is 0 and will go back to previous value.', 'minMax':this.fetchesTempDur},
        {'label':'Force Delayed Ham Duration (Seconds):', 'type':'number', 'key':'hamDuration', 'seconds':true, 'default':data.hamDuration, 'tooltip':'Optional Field. The duration in seconds to use to go in ham mode after collecting a HIT and then go back to normal collecting mode. Every panda job created by a trigger will go into Ham mode at beginning.', 'minMax':this.hamDur},
        {'label':'Auto Collect Hits:', 'type':'trueFalse', 'key':'auto', 'tooltip':'Optional Field. Should Hits be auto collected when a HIT is found?', 'skip':!doCustom},
      ], table2, data, true);
      let modalBody = $(`#${idName} .${modal.classModalBody}`);
      modalBody.append(df);
      modalBody.find('.pcm-inputText-md').keypress( async e => { if ((e.keyCode ? e.keyCode : e.which) == '13') await checkTrigger(doCustom, idName, data); });
      $('#pcm-triggerEnabled').click( () => $('#pcm-formAddGroupID').focus() );
      $('#pcm-onlyOnce').click( () => $('#pcm-formAddGroupID').focus() );
      $('#pcm-formAddGroupID').focus();
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      df = null; searchOpt = null; table2 = null; modalBody = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** This creates a string out of a rule Set
   * @param  {object} rules - Trigger Rule Set  @param {object} [placeHere] - Jquery Element
   * @return {string}       - String with rules spread out. */
  rulesToStr(ruleSets, placeHere=null) {
    let setStr = ''; for (const value of ruleSets.values()) { setStr += `${value}, `; }
    if (setStr.length > 2) setStr = setStr.slice(0, -2);
    if (placeHere) placeHere.html((setStr) ? setStr: '{Empty}');
    return setStr;
  }
  /** Will create an object with search data using a search database or panda database ID.
   * @async                - To wait for loading of search data.
   * @param  {number} [dbId] - Database ID @param {number} [pDbId] - Panda Database ID
   * @return {object}      - Object with search data filled in. */
  async fillInData(dbId=null, pDbId=null) {
    if (dbId === null && pDbId === null) return null;
    let searchDbId = (dbId !== null) ? dbId : await MySearch.pandaToDbId(pDbId), triggerData = await MySearch.getData(searchDbId);
    let changes = {'details':Object.assign({}, triggerData), 'rules':null, 'options':null, 'searchDbId':searchDbId}
    if (typeof changes.details.disabled === 'undefined') changes.details.disabled = true;
    if (typeof changes.details.name === 'undefined') changes.details.name = changes.details.value;
    changes.rules = await MySearch.rulesCopy(changes.searchDbId); changes.options = await MySearch.optionsCopy(changes.searchDbId);
    return changes;
  }
  /** Shows a modal to allow adding or removing values into a set with a select input box.
   * @param {set} editSet       - Edit Set       @param {string} text - Type Text 1   @param {string} text2    - Type Text 2     @param {function} validFunc - Valid Function
   * @param {function} saveFunc - Save Function  @param {string} type - Trigger Type  @param {bool} [notEmpty] - Empty Allowed? */
  editTriggerOptions(editSet, text, text2, validFunc, saveFunc, type, notEmpty=false) {
    if (!modal) modal = new ModalClass();
    let idName = modal.prepareModal(null, '640px', 'pcm-triggerEditModal', 'modal-lg', 'Edit Search Options', '', '', '', 'visible btn-sm', 'Done', saveFunc, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(null, () => {
      let values = Array.from(editSet), df = document.createDocumentFragment();
      $(`#${idName} .${modal.classModalBody}`).addClass('pcm-triggerSelectModalBody')
      $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Add a ${text} or remove others.</div></div>`).appendTo(df);
      if (type === 'custom') $(`<div class='small pcm-customRules'>All Custom Searches must have one 3 character Accepted word or phrase.<br>Adding more include or exclude words may cause script to find HITs slower.</div>`).appendTo(df);
      let form = $(`<div class='form-group row'></div>`).appendTo(df);
      let selectBox = $(`<select class='form-control input-sm col-5' id='pcm-selectedBox' multiple size='10'></select>`).appendTo(form);
      this.selectBoxAdd(values, $(selectBox));
      $(`<button class='btn btn-xs pcm-addToSelect pcm-tooltipData pcm-tooltipHelper' data-original-title='Add ${text2} to the selection box above.'>Add ${text2}</button>`).on( 'click', () => {
        modal.showDialogModal('750px', `Add New ${text}`, `<div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Type in a ${text2}.</div>`, (idName) => {
          let newValue = $('#pcm-formQuestion').val(); $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('');
          if (newValue && validFunc(newValue)) {
            editSet.add(newValue); values = Array.from(editSet); this.selectBoxAdd(values, $(`#pcm-selectedBox`));
            $(`#pcm-tdLabel-acceptWords1, #pcm-tdLabel-acceptWords2`).removeClass('pcm-optionLabelError'); modal.closeModal();
          } else $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('Invalid Group ID. Try again.');
        }, true, false, `${text2}: `, ``, 35,_, () => { $(`#${idName}`).focus(); }, `Add ${text2}`,_,_,(text2 === 'Group ID') ? 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY' : 'example: survey');
      }).appendTo(df);
      $(`<button class='btn btn-xs pcm-removeFromSelect pcm-tooltipData pcm-tooltipHelper' data-original-title='Remove the selected items in the selection box above.'>Remove Selected</button>`).on( 'click', () => {
        let removeList = $(`#pcm-selectedBox`).val();
        if (type !== 'custom' || !notEmpty || (type === 'custom' && values.length > 0)) {
          for (const index of removeList) { editSet.delete(values[index]); }
          values = Array.from(editSet); this.selectBoxAdd(values, $(`#pcm-selectedBox`)); $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('');
        } else { $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('Must have 1 Accepted word or phrase in list!'); }
      }).appendTo(df);
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunc(); });
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      df = null; form = null; selectBox = null;
    }, () => { });
  }
  /** Appends the option editing info for a search trigger or search job.
   * @param {object} appendHere - Jquery Object  @param {object} changes - Trigger Data Object  @param {bool} [searchUI] - SearchUI? */
  triggerOptions(appendHere, changes, searchUI=true) {
    $(`<div class='pcm-detailsHeading unSelectable'>Options: Click on the details or buttons to edit.</div><div class='pcm-editTrigWarning'></div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered'></table>`).appendTo(appendHere), prependOpt = [], customOpt = [];
    let bGStr = this.rulesToStr(changes.rules.blockGid), eTStr = this.rulesToStr(changes.rules.exclude), iTStr = this.rulesToStr(changes.rules.include);
    if (searchUI) {
      prependOpt = [
        {'label':'Group or Requester ID', 'type':'text', 'key1':'details', 'key':'value', 'keyCheck':'type', 'keyCheckNot':'custom', 'disable':true, 'default':0, 'tooltip':'ID of this trigger'},
        {'label':'Unique Trigger Name:', 'type':'text', 'key1':'details', 'key':'name', 'tooltip':'The unique name for this trigger.'},
        {'label':'Disabled?:', 'type':'trueFalse', 'key1':'details', 'key':'disabled', 'tooltip':'Should trigger be disabled?'},
      ];
      if (changes.details.type === 'custom') customOpt = [
        {'label':'Automatic Collect HITs:', 'type':'trueFalse', 'key1':'options', 'key':'auto', 'tooltip':'Start collecting HITs automatically up to limit.'},
        {'label':'Auto Collect HITs Limit:', 'type':'number', 'key1':'options', 'key':'autoLimit', 'tooltip':'Number of HITs to collect at once automatically.', 'minMax':this.autoRange},
      ];
    }
    displayObjectData([
      ...prependOpt,
      {'label':'Minimum Pay:', 'type':'number', 'key':'minPay', 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The minimum pay for a HIT to start collecting.', 'minMax': this.minPayRange},
      {'label':'Maximum Pay:', 'type':'number', 'key':'maxPay', 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The maximum pay for a HIT to start collecting.', 'minMax': this.minPayRange},
      {'label':'Words or phrases Accepted Only:', 'id':'pcm-string-include', 'type':'string', 'string':iTStr, 'key':'acceptWords1', 'disable':true, 'default':0, 'tooltip':'HITs with these words or phrases only will try to be collected.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Accepted Words or Phrases', 'addClass':' btn-xxs pcm-myPrimary', 'key':'acceptWords2', 'width':'165px', 'unique':1, 'btnFunc': e => {
        this.editTriggerOptions(changes.rules.include, 'Word or phrase to watch for', 'Word or phrase', () => { return true; }, () => {
          iTStr = this.rulesToStr(changes.rules.include, $('#pcm-string-include')); modal.closeModal(); $(e.target).closest(`.pcm-modal`).focus();
        }, changes.details.type, true);
      }, 'tooltip': 'Add or delete Accepted Words or Phrases.'},
      {'label':'Excluded Words or Phrases:', 'id':'pcm-string-exclude', 'type':'string', 'string':eTStr, 'disable':true, 'default':0, 'tooltip':'HITs with these words or phrases will be ignored.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Excluded Words or Phrases', 'addClass':' btn-xxs pcm-myPrimary', 'idStart':'pcm-excludeWord-', 'width':'175px', 'unique':1, 'btnFunc': e => {
        this.editTriggerOptions(changes.rules.exclude, 'Word or phrase to exclude', 'Word or phrase', () => { return true; }, () => {
          eTStr = this.rulesToStr(changes.rules.exclude, $('#pcm-string-exclude')); modal.closeModal(); $(e.target).closest(`.pcm-modal`).focus();
        }, changes.details.type);
      }, 'tooltip': 'Add or delete Excluded Words or Phrases which will be ignored.'},
      {'label':'Excluded Group IDs', 'id':'pcm-string-blockGid', 'type':'string', 'string':bGStr, 'disable':true, 'default':0, 'tooltip':'HITs with these group IDs will be ignored.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Excluded Group IDs', 'addClass':' btn-xxs pcm-myPrimary', 'idStart':'pcm-excludeGid-', 'width':'175px', 'unique':1, 'btnFunc': e => {
        this.editTriggerOptions(changes.rules.blockGid, 'Group ID to block', 'Group ID', (value) => { return value.match(/^[3][0-9a-zA-Z]{15,35}$/); }, () => {
          bGStr = this.rulesToStr(changes.rules.blockGid, $('#pcm-string-blockGid')); modal.closeModal(); $(e.target).closest(`.pcm-modal`).focus();
        }, changes.details.type);
      }, 'tooltip': 'Add or delete Excluded Group IDs Which will be ignored.'},
      {'label':'Temporary Duration (Seconds):', 'type':'number', 'key1':'options', 'key':'tempDuration', 'seconds':true, 'default':18, 'tooltip':'The TEMPORARY number of seconds for HITs found to collect before stopping. Resets time if a HIT gets collected. This value can not be 0 if Temporary Fetches is 0 and will revert back to previous value.', 'minMax':this.pandaDurSeconds, 'minFunc': () => {
        let otherValue = $(`#pcm-tempFetchesDetailS`).html() || $(`#pcm-tempFetchesDetailI`).val();
        return (Number(otherValue) === this.fetchesTempDur.min);
      }},
      {'label':'Temporary Number of Fetches:', 'type':'number', 'key1':'options', 'key':'tempFetches', 'default':12, 'tooltip':'The TEMPORARY Number of tries to catch a HIT to do before stopping. This value can not be 0 if Temporary Duration is 0 and will go back to previous value.', 'minMax':this.fetchesTempDur, 'minFunc': () => {
        let otherValue = $(`#pcm-tempDurationDetailS`).html() || $(`#pcm-tempDurationDetailI`).val();
        return (Number(otherValue) === this.pandaDurSeconds.min);
      }},
      {'label':'Temporary Start Ham Duration (Seconds):', 'type':'number', 'key1':'options', 'key':'tempGoHam', 'seconds':true, 'default':MyOptions.doSearch().defaultHamDur, 'tooltip':'The TEMPORARY duration in seconds to use to go in ham mode after starting to collect a HIT and then go back to normal collecting mode. Every panda job created by a trigger will go into Ham mode at beginning.', 'minMax':this.hamDur},
      ...customOpt,
    ], theTable, changes, true);
    theTable = null; prependOpt = null; customOpt = null;
  }
  /** Appends the panda job options editing info for a search trigger or search job.
   * @param {object} appendHere - Jquery Object  @param {object} changes - Trigger Data Object  @param {bool} searchUI - SearchUI? */
  triggerPandaOptions(appendHere, changes, searchUI=true) {
    $(`<div class='pcm-detailsHeading unSelectable'>These options will be used for any created panda jobs from this ${(searchUI) ? 'trigger.' : 'search job.'}<br>Click on the options or sliders to change.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered'></table>`).appendTo(appendHere);
    displayObjectData([
      {'label':'Limit # of GroupID in queue:', 'type':'range', 'key1':'options', 'key':'limitNumQueue', 'tooltip':'Limit number of HITs in queue by this group ID. Great way to do batches slowly.', 'minMax':{'min':0, 'max':24}},
      {'label':'Limit # of Total HITs in Queue:', 'type':'range', 'key1':'options', 'key':'limitTotalQueue', 'tooltip':'Limit number of HITs allowed in queue. Good when you want to leave room in queue for better HITs.', 'minMax':{'min':0, 'max':24}},
      {'label':'Accept Only Once:', 'type':'trueFalse', 'key1':'options', 'key':'once', 'tooltip':'Should only one HIT be accepted and then stop collecting? Great for surveys.'},
      {'label':'Daily Accepted HIT Limit:', 'type':'number', 'key1':'options', 'key':'acceptLimit', 'default':0, 'tooltip':'How many HITs a day should be accepted for this job?', 'minMax':this.dailyLimitRange},
      {'label':'Stop Collecting After (Minutes):', 'type':'number', 'key1':'options', 'key':'duration', 'minutes':true, 'default':0, 'tooltip':'The number of minutes for HITs found to collect before stopping. Resets time if a HIT gets collected.', 'minMax':this.pandaDur},
      {'label':'Stop Collecting After # of Fetches:', 'type':'number', 'key1':'options', 'key':'limitFetches', 'default':0, 'tooltip':'Number of tries to catch a HIT to do before stopping.', 'minMax':this.fetchesDur},
      {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key1':'options', 'key':'autoGoHam', 'tooltip':'Should this job go ham when it finds a HIT and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
      {'label':'Delayed Ham Duration (Seconds):', 'type':'number', 'key1':'options', 'key':'goHamDuration', 'seconds':true, 'default':MyOptions.getHamDelayTimer(), 'tooltip':'If forcing delayed ham mode then go ham for this amount of seconds for each panda job.', 'minMax':this.pandaHamDur},
    ], theTable, changes, true);
    theTable = null;
  }
  /** Show the details for a search trigger.
   * @param {number} unique - Trigger Unique Number  @param {function} [afterClose] - After Close Function  */
  async showDetailsModal(unique, afterClose=null) {
    if (!modal) modal = new ModalClass();
    let dbId = await MySearch.uniqueToDbId(unique), sChanges = await this.fillInData(dbId);
    let oldMinPay = sChanges.rules.minPay, oldTempDuration = sChanges.options.tempDuration, oldTempFetches = sChanges.options.tempFetches;
    let idName = modal.prepareModal(sChanges, '700px', 'pcm-triggerDetailsModal', 'modal-lg', 'Details for a Trigger', '', '', '', 'visible btn-sm', 'Save New Details', async (changes) => {
      $(`.pcm-eleLabel`).removeClass('pcm-optionLabelError'); let newOpt = changes.options;
      if (newOpt.autoGoHam && newOpt.goHamDuration === 0) newOpt.goHamDuration = MyOptions.getHamDelayTimer();
      if (newOpt.tempGoHam === 0) newOpt.tempGoHam = MyOptions.doSearch().defaultHamDur;
      if (newOpt.tempDuration === 0 && newOpt.tempFetches === 0) {
        newOpt.tempDuration = (newOpt.tempDuration !== oldTempDuration) ? oldTempDuration : newOpt.tempDuration;
        newOpt.tempFetches = (newOpt.tempFetches !== oldTempFetches) ? oldTempFetches : newOpt.tempFetches;
      }
      if (changes.details.type === 'custom' && changes.rules.include.size === 0) {
        $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('Custom searches MUST have 1 Accepted word or phrase!');
        $(`#pcm-tdLabel-acceptWords1, #pcm-tdLabel-acceptWords2`).addClass('pcm-optionLabelError');
      } else {
        let closeDetailsModal = async () => {
          await MySearch.optionsChanged(changes, changes.searchDbId);
          $(`#pcm-triggerName-${unique}`).html(changes.details.name);
          modal.closeModal();
        }
        if (changes.rules.minPay === 0.00 && (oldMinPay !== changes.rules.minPay) && MyOptions.doSearch().minReward !== 0) modal.showDialogModal('700px', 'Remember to change minReward in General Options', 'For the minReward at 0.00 to work you must set the General Search Options minReward to 0.00 so it will use it on MTURK search page.', null, false, false,_,_,_,_, () => { closeDetailsModal(); });
        else closeDetailsModal();
      }
    }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    modal.showModal(null, async () => {
      let detailsDiv = $(`<div id='pcm-modalBody'></div>`).appendTo(`#${idName} .${modal.classModalBody}`);
      let detailsTabs = new TabbedClass(detailsDiv, `pcm-detailTabs`, `pcm-tabbedDetails`, `pcm-detailsContents`, false, 'Srch');
      let [, err] = await detailsTabs.prepare();
      if (!err) {
        let optionTab = await detailsTabs.addTab(`Trigger Options`, true), optionsContents = $(`<div class='pcm-optionCont card-deck'></div>`).appendTo(`#${optionTab.tabContent}`);
        let detailTab = await detailsTabs.addTab(`Panda Job Options`), detailsContents = $(`<div class='pcm-detailsCont card-deck'></div>`).appendTo(`#${detailTab.tabContent}`);
        let df1 = document.createDocumentFragment(), df2 = document.createDocumentFragment();
        this.triggerOptions(df1, modal.tempObject[idName]);  this.triggerPandaOptions(df2, modal.tempObject[idName]); optionsContents.append(df1); detailsContents.append(df2);
        if (sChanges.rules.minPay === 0.00) {
          if (MyOptions.doSearch().minReward !== 0) $('.pcm-editTrigWarning').html('The minPay at $0.00 will only work if the main search option minPay is at $0.00 also.');
        }
        optionTab = null; optionsContents = null; detailTab = null; detailsContents = null; df1 = null; df2 = null;
      }
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      detailsDiv = null; detailsTabs = null;
    }, () => { modal = null; sChanges = null; if (afterClose) afterClose(); });
  }
  /** Fills in a select input with options from an array.
   * @param {array} values - Values  @param {object} appendHere - Jquery Element */
  selectBoxAdd(values, appendHere) { appendHere.html(''); for (let i=0, len=values.length; i < len; i++) { appendHere.append(`<option value='${i}'>${values[i]}</option>`); }}
  /** Shows a modal with all the found HITs in a table.
   * @param {number} unique - Trigger Unique  @param {function} [afterClose] After Close Function */
  async showTriggerFound(unique, afterClose=null) {
    if (!modal) modal = new ModalClass(); let dbId = await MySearch.uniqueToDbId(unique);
    const idName = modal.prepareModal(null, '860px', 'pcm-triggerFoundModal', 'modal-lg', 'Show HITs found by Trigger.', '', 'pcm-modalHitsFound', '', 'visible btn-sm', 'Done', () => { modal.closeModal(); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(null, async () => {
      $('.modal-body').html(`<h4 class='pcm-pleaseWaitData pcm-myWarning'>Loading data... Please Wait!</h4>`);
      let returnedData = await MySearch.getFromDBData('history', dbId, 'dbId', true, false, 80, 'rules');
      if (returnedData === null) {
        $('.modal-body').html(`<h4 class='pcm-myWarning'>Sorry. The data took to long to load due to high activity.<br>Please wait a few seconds and try again.</h4>`); return;
      }
      let groupHist = returnedData[0], rules = returnedData[1];
      let gidsValues = [], gidsData = {}, blocked = rules.blockGid, df = document.createDocumentFragment();
      arrayCount(groupHist, (value) => { gidsValues.push(value.gid); gidsData[value.gid] = value; return true; }, true);
      let gidsHistory = await MyHistory.findValues(gidsValues);
      let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-moreCondensed table-bordered'></table>`)
        .append(`<thead><tr><td style='width:75px; max-width:75px; text-align:left;'>Date</td><td style='width:82px; max-width:82px; text-align:left;'>Gid</td><td style='width:120px; max-width:120px; text-align:left;'>Title</td><td style='width:440px; max-width:440px; text-align:left;'>Descriptions</td><td style='width:52px; max-width:52px; text-align:left;'>Pays</td><td style='width: 70px; max-width:70px; text-align:left;'>Block?</td></tr></thead>`).append(`<tbody></tbody>`).appendTo(df);
      for (const key of gidsValues) {
        let dateString = '----', title = '----', description = '----', pays = '----';
        let theDate = new Date(gidsData[key].date); dateString = theDate.toLocaleDateString('en-US', {'month':'short', 'day':'2-digit'}).replace(' ','');
        dateString += ' ' + theDate.toLocaleTimeString('en-GB', {'hour':'2-digit', 'minute':'2-digit'});
        if (gidsHistory[key]) {
          if (checkString(gidsHistory[key].pay)) gidsHistory[key].pay = parseFloat(gidsHistory[key].pay);
          title = gidsHistory[key].title; description = gidsHistory[key].description; pays = gidsHistory[key].pay.toFixed(2);
        }
        let tempObj = {'date':dateString,'gid':shortenGroupId(key, 4, 4), 'title':title, 'desc':description, 'pays':'$' + pays};
        let btnLabel = (blocked.has(key)) ? 'Unblock' : 'Block HIT', statusClass = (blocked.has(key)) ? ' pcm-hitBlocked' : '';
        displayObjectData([
          {'type':'keyValue', 'key':'date', 'maxWidth':'75px'}, {'type':'keyValue', 'key':'gid', 'maxWidth':'82px', 'tooltip': `GroupID: ${key}`},
          {'type':'keyValue', 'key':'title', 'maxWidth':'120px', 'tooltip': `Title: ${tempObj.title}`},
          {'type':'keyValue', 'key':'desc', 'maxWidth':'440px', 'tooltip': `Description: ${tempObj.desc}`}, {'type':'keyValue', 'key':'pays', 'maxWidth':'52px'},
          {'label':'block', 'type':'button', 'btnLabel':btnLabel, 'addClass':` btn-xxs${statusClass}`, 'maxWidth':'70px', 'btnFunc': e => {
            if (blocked.has(key)) { blocked.delete(key); $(e.target).removeClass(`pcm-hitBlocked`).html('Block HIT'); }
            else { blocked.add(key); $(e.target).addClass(`pcm-hitBlocked`).html('Unblock'); }
            rules.blockGid = blocked; MySearch.theData(dbId, 'rules', rules);
          }, 'idStart': 'pcm-blockThis', 'unique': key, 'tooltip': 'Block or unblock this HIT for this trigger ONLY.'}
        ], theTable.find(`tbody`), tempObj, true, true, true, 'pcm-modalTriggeredhit',_, gidsHistory[key], gidsData[key]);
        tempObj = null;
      }
      $(df).find('tr.pcm-modalTriggeredhit').dblclick( async (e) => {
        let data = $(e.target).closest('tr').data('theData'), data2 = $(e.target).closest('tr').data('data2'), cData = null, reqData = null;
        cData = hConverterObject(data);
        if (cData.requester_id) reqData = await MyHistory.findValues([cData.requester_id]);
        else { cData.hit_set_id = data2.gid; cData.date = data2.date; }
        if (reqData) cData.requester_name = reqData[cData.requester_id].reqName;
        this.showTriggeredHit(cData, () => {},_, false);
      });
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $('.pcm-pleaseWaitData').remove();
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      groupHist = null; df = null; gidsHistory = null; theTable = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with all search options that can be changed by the user.
   * @param {function} [afterClose] - After Close Function */
  showSearchOptions(afterClose=null) {
    let searchOptions = MyOptions.doSearch(), oldMinReward = searchOptions.minReward, oldTempDuration = searchOptions.defaultDur, oldTempFetches = searchOptions.defaultFetches;
    let oldCustTempDuration = searchOptions.defaultCustDur, oldCustTempFetches = searchOptions.defaultCustFetches;
    let saveFunction = (changes) => {
      let closeAndSave = async () => {
        MyOptions.theToSearchUI(changes.toSearchUI, false); MyOptions.theSearchTimer(changes.searchTimer, false); MyOptions.doGeneral(changes.general);
        MyOptions.doSearch(changes.options); await MySearch.timerChange(changes.searchTimer); await MySearch.prepareSearch();
        if (changes.options.displayApproval) $('.pcm-approvalRateCol').show(); else $('.pcm-approvalRateCol').hide();
        setTimeout( () => modal.closeModal(), 0);
      } 
      if (changes.options.defaultDur === 0 && changes.options.defaultFetches === 0) {
        changes.options.defaultDur = (changes.options.defaultDur !== oldTempDuration) ? oldTempDuration : changes.options.defaultDur;
        changes.options.defaultFetches = (changes.options.defaultFetches !== oldTempFetches) ? oldTempFetches : changes.options.defaultFetches;
      }
      if (changes.options.defaultCustDur === 0 && changes.options.defaultCustFetches === 0) {
        changes.options.defaultCustDur = (changes.options.defaultCustDur !== oldCustTempDuration) ? oldCustTempDuration : changes.options.defaultCustDur;
        changes.options.defaultCustFetches = (changes.options.defaultCustFetches !== oldCustTempFetches) ? oldCustTempFetches : changes.options.defaultCustFetches;
      }
      if (changes.options.minReward === 0 && oldMinReward !== changes.options.minReward) modal.showDialogModal('700px', 'Minimum Reward at $0.00 Warning.', 'When setting Minimum Reward for MTURK search page to $0.00 there may be better HITs missed if there are a lot of HITs at $0.00.', null, false, false,_,_,_,_, () => { closeAndSave(); } );
      else closeAndSave();
    }
    if (!modal) modal = new ModalClass();
    let theData = {'toSearchUI':MyOptions.theToSearchUI(), 'searchTimer':MyOptions.theSearchTimer(), 'options':MyOptions.doSearch(), 'general':MyOptions.doGeneral()};
    const idName = modal.prepareModal(theData, '860px', 'pcm-triggerOptModal', 'modal-lg', 'Edit Search General Options', '', '', '', 'visible btn-sm', 'Save Options', (changes) => { saveFunction(changes); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      if (searchOptions.minReward === 0) $(`<div class='pcm-optionEditWarning'>Having the Minimum Reward at $0.00 may cause better HITs to slip by if there are many HITs at $0.00.</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Show Help Tooltips:', 'type':'trueFalse', 'key1':'general', 'key':'showHelpTooltips', 'tooltip':'Should help tooltips be shown for buttons and options? What you are reading is a tooltip.'}, 
        {'label':'Search Job Buttons Create Search UI Triggers:', 'type':'trueFalse', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'}, 
        {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':`Change the search timer duration for HITs to be searched and found in milliseconds.`, 'minMax':MyOptions.getTimerSearch()},
        {'label':'Default Trigger Temporary Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultDur', 'tooltip':`The TEMPORARY default duration for new triggers to use on panda jobs. This value can not be 0 if Temporary Fetches is 0 and will revert back to previous value.`, 'minMax':this.pandaDurSeconds, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultFetchesDetailS`).html() || $(`#pcm-defaultFetchesDetailI`).val();
          return (Number(otherValue) === this.pandaDurSeconds.min);
        }},
        {'label':'Default Trigger Temporary Fetches Limit:', 'type':'number', 'key1':'options', 'key':'defaultFetches', 'tooltip':`The TEMPORARY default number of fetches for new triggers to use on panda jobs. This value can not be 0 if Temporary Duration is 0 and will go back to previous value.`, 'minMax':this.fetchesTempDur, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultDurDetailS`).html() || $(`#pcm-defaultDurDetailI`).val();
          return (Number(otherValue) === this.fetchesTempDur.min);
        }},
        {'label':'Default Trigger Temporary Ham Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultHamDur', 'tooltip':`The default ham duration for new triggers to use on panda jobs. Every panda job created by a trigger will go into Ham mode at beginning.`, 'minMax':this.hamDur},
        {'label':'Default Custom Temporary Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultCustDur', 'tooltip':`The TEMPORARY default duration for new custom triggers to use on panda jobs. This value can not be 0 if Temporary Fetches is 0 and will revert back to previous value.`, 'minMax':this.pandaDurSeconds, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultFetchesDetailS`).html() || $(`#pcm-defaultFetchesDetailI`).val();
          return (Number(otherValue) === this.pandaDurSeconds.min);
        }},
        {'label':'Default Custom Temporary Fetches Limit:', 'type':'number', 'key1':'options', 'key':'defaultCustFetches', 'tooltip':`The TEMPORARY default number of fetches for new custom triggers to use on panda jobs. This value can not be 0 if Temporary Duration is 0 and will go back to previous value.`, 'minMax':this.fetchesTempDur, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultDurDetailS`).html() || $(`#pcm-defaultDurDetailI`).val();
          return (Number(otherValue) === this.fetchesTempDur.min);
        }},
        {'label':'Default Custom Temporary Ham Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultCustHamDur', 'tooltip':`The default ham duration for new custom triggers to use on panda jobs. Every panda job created by a trigger will go into Ham mode at beginning.`, 'minMax':this.hamDur},
        {'label':'Page Size for MTURK Search Page:', 'type':'number', 'key1':'options', 'key':'pageSize', 'tooltip':`Number of HITs used on MTURK first search page. The higher the number can slow searching but also can give a better chance of finding HITs you want.`, 'minMax':this.pageSize},
        {'label':'Minimum Reward for MTURK Search Page:', 'type':'number', 'key1':'options', 'key':'minReward', 'money':true, 'default':0, 'tooltip':`The minimum reward to show on the search page. The default value is $0.01 but there may be some HITs at $0.00 which are qualifications. Most HITs at $0.00 are no good. Be sure to change this back after getting any qualifications you were looking for.`, 'minMax':this.minPayRange},
        {'label':'Display MTURK Approval Rate For Requesters:', 'type':'trueFalse', 'key1':'options', 'key':'displayApproval', 'tooltip':`Should Approval Rate from MTURK be shown on the Custom Triggered Hits Tab or only shown on mouse over requester name?`},
        {'label':'Search Page JSON Format:', 'type':'trueFalse', 'key1':'options', 'key':'useJSON', 'tooltip':`Should MTURK return the search results in JSON or HTML format? JSON should be the fastest.`},
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunction(modal.tempObject[idName]); });
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      theData = null; df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with all search advanced options that can be changed by the user.
   * @param {function} [afterClose] - After Close Function */
  showSearchAdvanced(afterClose=null) {
    let saveFunction = (changes) => { MyOptions.doSearch(changes); modal.closeModal(); }
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(MyOptions.doSearch(), '860px', 'pcm-advancedOptModal', 'modal-lg', 'Edit Search Advanced Options', '', '', '', 'visible btn-sm', 'Save Options', (changes) => { saveFunction(changes); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment();
      $(`#${idName} .${modal.classModalBody}`).addClass('pcm-searchOptionsModalBody')
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Number of Trigger Data to Keep in Memory:', 'type':'number', 'key':'queueSize', 'tooltip':`To save memory the script will only keep this number of most active trigger data in memory. Loading from database can be slower.`, 'minMax':this.queueSize},
        {'label':'Trigger HITs History Days Expiration:', 'type':'number', 'key':'triggerHistDays', 'tooltip':`HITs found by trigger is saved in the database and this number represents the days to keep those HITs saved.`, 'minMax':this.triggerHistDays},
        {'label':'Custom HITs History Days Expiration:', 'type':'number', 'key':'customHistDays', 'tooltip':`Custom triggered HITs can find a large amount of HITs so this number limit how many days to save HITs.`, 'minMax':this.customHistDays},
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunction(modal.tempObject[idName]); });
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal where a user can add or remove blocked group or requester ID's
   * @param {function} [afterClose] - After Close Function */
  showSearchBlocked(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(MyOptions.doSearch(), '860px', 'pcm-blockedModal', 'modal-lg', `Edit Blocked Group and Requester ID's`, '', '', '', 'visible btn-sm', 'Done', () => { modal.closeModal(); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let blockingDiv = $(`<div id='pcm-blockDetails'></div>`).appendTo(`#${idName} .${modal.classModalBody}`);
      let blockTabs = new TabbedClass(blockingDiv, `pcm-blockingTabs`, `pcm-gidBlock`, `pcm-ridBlock`, false, 'Block');
      let [, err] = await blockTabs.prepare();
      if (!err) {
        $('#pcm-gidBlock').append(`<h4 class='pcm-pleaseWaitData pcm-myWarning' style='padding-left:10px;'>Loading data... Please Wait!</h4>`);
        let [gidvals, ridvals] = await MySearch.getBothBlocked();
        /** Changes the status displayed to a given text and will change class if an error.
         * @param {string} tab - Tab Class Name  @param {String} [resultStr] - Html text  @param {bool} [error] - Error? */
        let statusInput = (tab, resultStr=null, error=true) => {
          let theClass = (error) ? 'pcm-optionLabelError' : 'pcm-statusSuccess', theBody = $(`#${idName} .${modal.classModalBody}`);
          theBody.find(`.${tab} .pcm-inputResult:first`).removeClass('pcm-optionLabelError pcm-statusSuccess').addClass(theClass).html(resultStr);
          theBody.find(`.${tab} input:first`).focus();
        }
        /** Checks if the input values are correct according to the rules. Uses boolean value to know if it's removing or adding.
         * @async            - To wait for data from the history database.
         * @param {object} e - Event Object  @param {bool} remove - Value Removed? */
        let checkInput = async (e, remove) => {
          let thisTab = $(e.target).data('tab'), gid = null, rid = null, theResult = null, groupId = $(e.target).data('gid');
          let theBody = $(`#${idName} .${modal.classModalBody}`), value = theBody.find(`.${thisTab} input`).val();
          if (!value) { statusInput(thisTab, 'Enter in an ID in the input below.'); return; }
          else if (groupId && value.match(/^3[0-9a-zA-Z]{14,38}$/)) gid = value; else if (!groupId && value.match(/^[Aa][0-9a-zA-Z]{6,25}$/)) rid = value;
          if (gid || rid) {
            theResult = await MySearch.theBlocked(gid, rid, !remove, remove);
            if (theResult[(groupId) ? 0 : 1]) {
              statusInput(thisTab, `SUCCESS: ID ${(remove) ? 'Removed from' : 'added to'} blocked HITs.`, false);
              if (!remove) {
                let valInfo = await MyHistory.findValues((groupId) ? [gid] : [rid]);
                if (groupId) gidvals.push(gid + ((valInfo[gid]) ? ` - ${valInfo[gid].title}` : ` -`));
                else ridvals.push(rid + ((valInfo[rid]) ? ` - ${valInfo[rid].reqName}` : ` -`));
                valInfo = null;
              }
              else if (groupId) gidvals = gidvals.filter( (item) => !item.includes(gid) );
              else ridvals = ridvals.filter((item) => !item.includes(rid));
              this.selectBoxAdd((groupId) ? gidvals : ridvals, theBody.find(`.${thisTab} select`));
              theBody.find(`.${thisTab} input`).val('');
            }
            else statusInput(thisTab, `ERROR: ID ${(remove) ? 'not being blocked so removal failed' : 'is already being blocked'}.`);
            theResult = null;
          } else statusInput(thisTab, `Not a valid ID. Please enter in the ${(groupId) ? 'Group ID' : 'Requester ID'} again.`);
          theBody = null;
        }
        let gidTab = await blockTabs.addTab(`Group ID Blocked`, true), gidContents = $(`<div class='pcm-gidCont'></div>`).appendTo(`#${gidTab.tabContent}`);
        let ridTab = await blockTabs.addTab(`Requester ID Blocked`), ridContents = $(`<div class='pcm-ridCont'></div>`).appendTo(`#${ridTab.tabContent}`);
        let exampleGid = 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY', exampleRid = 'example: AGVV5AWLJY7H2', df = document.createDocumentFragment();
        let typeGid = true, thisTab = 'pcm-gidCont', thisFrag = df, typeExample = exampleGid, df2 = document.createDocumentFragment();
        let gidsHistory = await MyHistory.findValues(gidvals), ridsHistory = await MyHistory.findValues(ridvals), values = gidvals; 
        for (let j=0, len=gidvals.length; j < len; j++) { gidvals[j] += (gidsHistory[gidvals[j]]) ? ` - ${gidsHistory[gidvals[j]].title}` : ` -`; }
        for (let j=0, len=ridvals.length; j < len; j++) { ridvals[j] += (ridsHistory[ridvals[j]]) ? ` - ${ridsHistory[ridvals[j]].reqName}` : ` -`; }
        for (let i=0; i < 2; i++) {
          $(`<div><div class='pcm-inputResult'>&nbsp;</div><div class='pcm-modalInfo'>Enter an ID to add or remove from being blocked.</div></div>`).appendTo(thisFrag);
          createInput(thisFrag, ' pcm-inputDiv-url', 'pcm-formAddTheID', `Enter in ${(typeGid) ? 'Group' : 'Requester'} ID:`, typeExample,_, 'pcm-tooltipData pcm-tooltipHelper','',90,_,_, `Enter the ${(typeGid) ? 'Group' : 'Requester'} ID that you would like to be blocked or unblocked.`);
          $(`<button class='btn btn-xs pcm-addBlocked pcm-tooltipData pcm-tooltipHelper' data-original-title='Add the ID in the text input above to be blocked.'>Add ID</button>`).data('tab',thisTab).data('gid',typeGid)
            .on('click', e => { checkInput(e, false, this); }).appendTo(thisFrag);
          $(`<button class='btn btn-xs pcm-removeBlocked pcm-tooltipData pcm-tooltipHelper' data-original-title='Remove the ID in the text input above to be unblocked.'>Remove ID</button>`).data('tab',thisTab).data('gid',typeGid)
            .on('click', e => { checkInput(e, true, this); }).appendTo(thisFrag);
          let form = $(`<div class='form-group pcm-inputBoxForm'></div>`).appendTo(thisFrag);
          let selectBox = $(`<select class='form-control input-sm col-8' id='pcm-selectedBox' multiple size='12'></select>`).appendTo(form);
          this.selectBoxAdd(values, $(selectBox));
          $(`<button class='btn btn-xs btn-primary pcm-removeFromSelect pcm-tooltipData pcm-tooltipHelper' data-original-title='Remove the selected IDs in the selection box above to unblock them.'>Remove selected ID</button>`).data('tab',thisTab).data('gid',typeGid).on( 'click', async (e) => {
            let theBody = $(`#${idName} .${modal.classModalBody}`), thisTab = $(e.target).data('tab'), selected = theBody.find(`.${thisTab} option:selected`)
            let isgid = $(e.target).data('gid'), valArray = (isgid) ? gidvals : ridvals, gid = null, rid = null;
            if (selected.length) {
              for (const ele of selected) {
                let text = $(ele).text(), value = text.split(' ')[0]; if (isgid) gid = value; else rid = value; let theResult = await MySearch.theBlocked(gid, rid, false, true);
                if (theResult[(isgid) ? 0 : 1]) valArray = arrayRemove(valArray, text); theResult = null;
              }
              this.selectBoxAdd(valArray, theBody.find(`.${thisTab} select`));
            }
            if (isgid) gidvals = valArray; else ridvals = valArray;
            theBody.find(`.${thisTab} input`).focus();
            selected = null; valArray = null; theBody = null;
          }).appendTo(thisFrag);
          typeGid = false, thisTab = 'pcm-ridCont', thisFrag = df2, typeExample = exampleRid, values = ridvals;
          form = null; selectBox = null;
        }
        $('.pcm-pleaseWaitData').remove();
        gidContents.append(df); ridContents.append(df2);
        $(`#${blockTabs.ulId} .nav-link`).click( e => {
          let content = $(e.target).closest('a').attr('href'); setTimeout(() => { $(content).find('input').focus(); }, 1);
        });
        gidContents.find('input').focus();
        df = null; df2 = null; gidContents = null; ridContents = null; thisFrag = null; gidsHistory = null; ridsHistory = null; values = null;
      }
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      blockingDiv = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with data from a HIT that was triggered. Double clicked on the HIT on the Custom Triggered HITs tab.
   * @param {object} theData - HIT data  @param {function} [afterClose] - After Close Function  @param {object} [e] - Event Object */
  showTriggeredHit(theData, afterClose=null, e=null, blocking=true) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(MyOptions.doSearch(), '860px', 'pcm-triggeredHitModal', 'modal-lg', 'Triggered HIT Details', '', '', '', 'visible btn-sm', 'Done', async () => {
      let check = await MySearch.theBlocked(theData.gid, theData.rid), tr = (e) ? $(e.target).closest('tr') : null;
      if (e && (check[0] || check[1])) tr.addClass('pcm-blockedHit'); else if (tr) tr.removeClass('pcm-blockedHit');
      modal.closeModal(); check = null; tr = null
    }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment(), blocked = await MySearch.theBlocked(theData.hit_set_id, theData.requester_id);
      $(`<div class='pcm-detailsEdit'>Details of this HIT:</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Date Found:', 'type':'keyValue', 'key':'date', 'disable':true, 'format':'date', 'skip':(!theData.date), 'tooltip':`The date HIT was found last.`},
        {'label':'Requester Name:', 'type':'keyValue', 'key':'requester_name', 'disable':true, 'tooltip':`Requester Name for this HIT.`},
        {'label':'Title:', 'type':'keyValue', 'key':'title', 'disable':true, 'tooltip':`Title of this HIT.`},
        {'label':'Description:', 'type':'keyValue', 'key':'description', 'disable':true, 'tooltip':`Description of this HIT.`},
        {'label':'Price:', 'type':'keyValue', 'key1':'monetary_reward', 'key':'amount_in_dollars', 'money':true, 'disable':true, 'pre':'$', 'tooltip':`Price for this HIT.`},
        {'label':'Requester ID:', 'type':'keyValue', 'key':'requester_id', 'disable':true, 'tooltip':`Requester ID for this HIT.`},
        {'label':'Group ID:', 'type':'keyValue', 'key':'hit_set_id', 'disable':true, 'tooltip':`Group ID for this HIT.`},
      ], df, theData, true);
      if (blocking) {
        $(`<div class='pcm-buttonArea '></div>`).append($(`<button class='btn btn-xs pcm-blockGid pcm-tooltipData pcm-tooltipHelper' data-original-title='Block or unblock this Group ID globally.'>${(blocked[0]) ? 'UNBLOCK' : 'Block'} this Group ID</button>`).click( async (e) => {
          let check = await MySearch.theBlocked(theData.hit_set_id, null, true, false, true);
          $(e.target).text(`${(check[2]) ? 'UNBLOCK' : 'Block'} this Group ID`); check = null;
        })).append($(`<button class='btn btn-xs pcm-blockRid pcm-tooltipData pcm-tooltipHelper' data-original-title='Block or unblock this Requester ID globally.'>${(blocked[1]) ? 'UNBLOCK' : 'Block'} this Requester</button>`).click( async (e) => {
          let check = await MySearch.theBlocked(null, theData.requester_id, true, false, true);
          $(e.target).text(`${(check[2]) ? 'UNBLOCK' : 'Block'} this Requester`); check = null;
        })).appendTo(df);
      }
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      df = null; blocked = null;
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
  /** Creates a table for the triggers cards in the triggers array.
   * @async                    - To wait for search trigger data from database.
   * @param {object} modalBody - Jquery Element  @param {array} triggers - Trigger ID's  @param {function} checkboxFunc - Checkbox Function */
  async showTriggersTable(modalBody, triggers, checkboxFunc=null) {
    let divContainer = $(`<table class='table table-dark table-sm table-moreCondensed pcm-jobTable table-bordered w-auto'></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      {'string':'', 'type':'checkbox', 'btnFunc': e => { $(`.modal-body input[type='checkbox']`).prop('checked', $(e.target).is(':checked')); }, 'tooltip':'Click here to select all triggers displayed.'},
      {'string':'Type', 'type':'string', 'noBorder':true}, {'string':'Trigger Name', 'type':'string', 'noBorder':true}, {'string':'Trigger ID or Term', 'type':'string', 'noBorder':true},
      {'string':'Status', 'type':'string'}
    ], divContainer, {}, true, true, true, 'pcm-triggeredhit');
    for (const dbId of triggers) {
      let retVal = await MySearch.getTrigData(dbId, 'rules'); if (!retVal) continue;
      let trigger = retVal[0], data = retVal[1], rules = retVal[2];
      let statusClass = (data.disabled) ? ' pcm-hitDisabled' : '';
      if (rules.terms) { data.term = rules.include.values().next().value; } else data.term = '';
      data.status = (data.disabled) ? 'Disabled' : 'Enabled&nbsp;';
      displayObjectData([
        {'string':'', 'type':'checkbox', 'width':'25px', 'maxWidth':'25px', 'unique':dbId, 'inputClass':' pcm-checkbox', 'btnFunc':checkboxFunc, 'tooltip':'Click here to select this trigger.'},
        {'string':'Trigger Type', 'type':'keyValue', 'key':'type', 'width':'50px', 'maxWidth':'50px', id:`pcm-TRT-${dbId}`},
        {'string':'Trigger Name', 'type':'keyValue', 'key':'name', 'width':'420px', 'maxWidth':'420px', id:`pcm-TRN-${dbId}`},
        {'string':'Trigger ID or Term', 'type':'keyValue', 'key':'value', 'orKey': 'term', 'width':'350px', 'maxWidth':'350px', 'id':`pcm-TRID-${dbId}`},
        {'label':'Status', 'type':'button', 'btnLabel':data.status, 'addClass':` btn-xxs${statusClass}`, 'maxWidth':'70px', 'btnFunc': async (e) => {
          let dbId = e.data.unique, retVal = await MySearch.getTrigData(dbId);
          if (retVal) {
            let unique = retVal[0].count, data = retVal[1];
            let newStatus = await MySearchUI.updateTrigger($(`#pcm-triggerCard-${unique}`).closest('.card'));
            if (newStatus === 'disabled') { $(e.target).addClass('pcm-hitDisabled'); $(e.target).html('Disabled'); }
            else { $(e.target).removeClass('pcm-hitDisabled'); $(e.target).html('Enabled&nbsp;'); }
          }
        }, 'idStart': 'pcm-statusThis', 'unique': dbId, 'tooltip':'Enable or Disable this trigger.'}
      ], divContainer, data, true, true,_,_, `pcm-jobRow-${trigger.count}`);
    }
    divContainer = null;
  }
  /** Filters out jobs with the search term, collecting radio, search mode and once options.
   * @param  {string} searchTerm - Search Term  @param  {object} modalControl - Jquery element
   * @return {array}         - Array of job ID's filtered. */
  async triggersFilter(searchTerm, modalControl) {
    let newArray = [], fromSearch = await MySearch.getFrom('Search');
    for (const dbId of fromSearch) {
      let good = false, data = await MySearch.getData(dbId), theValue = (data.type !== 'custom') ? data.value : '';
      const radioChecked = $(modalControl).find(`input[name='theTriggers']:checked`).val();
      if (radioChecked === '0') good = true;
      else if (radioChecked === '1' && !data.disabled) good = true;
      else if (radioChecked === '2' && data.disabled) good = true;
      else if (radioChecked === '3' && data.type === 'rid') good = true;
      else if (radioChecked === '4' && data.type === 'gid') good = true;
      else if (radioChecked === '5' && data.type === 'custom') good = true;
      if (good && searchTerm !== '' && (data.name.toLowerCase().includes(searchTerm) || theValue.toLowerCase().includes(searchTerm))) good = true;
      else if (good && searchTerm !== '') good = false;
      if (good) newArray.push(dbId);
    }
    return newArray;
  }
  /** Shows a modal listing all the triggers added or in a specified grouping.
   * @param {string} [type]        - Trigger Type         @param {number} [groupUnique]   - Grouping Unique      @param {object} [thisObj]      - Grouping Data
   * @param {function} [saveFunc]  - Save Function        @param {function} [checkFunc]   - Check Function       @param {function} [cancelFunc] - Cancel Function
   * @param {function} [afterShow] - After Show Function  @param {function} [afterClose] - After Close Function  */
  showTriggersModal(type='triggers', groupUnique=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null, afterClose=null) {
    if (!modal) modal = new ModalClass();
    let theTitle = (type === 'groupingEdit') ? 'Edit Groupings' : 'List Triggers', saveBtnStatus = (type === 'groupingEdit') ? 'visible btn-sm' : 'invisible';
    const idName = modal.prepareModal(thisObj, '1000px', 'pcm-showTriggersModal', 'modal-lg', theTitle, '', '', '', saveBtnStatus, 'Save Groupings', saveFunc, 'invisible', 'No', null, 'invisible', 'Close');
    modal.showModal(cancelFunc, async () => {
      let df = document.createDocumentFragment(), modalControl = $(`<div class='pcm-modal-${type} pcm-modalJobControl'></div>`).appendTo(df);
      $(`#${idName} .${modal.classModalBody}`).addClass('pcm-triggerModalBody');
      if (type === 'groupingEdit') {
        $(`<div class='small pcm-selectTriggers'></div>`).append('Select the triggers you want in this grouping below:').append(`<span class='pcm-triggersInGroup'>Triggers in Group: ${Object.keys(thisObj.triggers).length}</span>`).appendTo(modalControl);
        createInput(modalControl, ' pcm-groupingNameDiv', 'pcm-groupingNameI', 'Grouping Name: ', `default: Grouping #${groupUnique}`, null, '', modal.tempObject[idName].name).append(createTimeInput('Start Time', 'pcm-timepicker1', thisObj.startTime));
        createInput(modalControl, ' pcm-groupingDescDiv', 'pcm-groupingDescI', 'Description: ', 'default: no description', null, '', modal.tempObject[idName].description).append(createTimeElapse(thisObj.endHours, thisObj.endMinutes));
      }
      let radioGroup = $(`<div class='pcm-groupingsControl'></div>`).appendTo(modalControl);
      radioButtons(radioGroup, 'theTriggers', '0', 'All Triggers', true, 'pcm-tooltipData pcm-tooltipHelper', 'Display all triggers in the list below.');
      radioButtons(radioGroup, 'theTriggers', '1', 'Enabled',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display all Enabled triggers in the list below.');
      radioButtons(radioGroup, 'theTriggers', '2', 'Disabled',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display all triggers Disabled in the list below.');
      radioButtons(radioGroup, 'theTriggers', '3', 'Requester ID',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display all RID triggers in the list below.');
      radioButtons(radioGroup, 'theTriggers', '4', 'Group Id',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display all GID triggers in the list below.');
      radioButtons(radioGroup, 'theTriggers', '5', 'Custom',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display all Custom triggers in the list below.');
      let inputControl = createInput(modalControl, ' pcm-searchInputDiv', 'pcm-searchinput', 'Search phrase: ', 'example: receipts', e => {
        $(e.target).closest('.pcm-modalControl').find('.pcm-searchingTriggers').click();
      }, 'pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Enter text in the input field to search for in the requester name or HIT title.');
      $(`<button class='btn btn-xxs pcm-searchingTriggers pcm-tooltipData pcm-tooltipHelper' data-original-title='Display only the triggers in the list below with the input text in the trigger name or trigger ID.'>Search</button>`).on( 'click', async () => {
        let theDialog = $(`#${idName} .${modal.classModalDialog}:first`); $(theDialog).find('.pcm-jobTable').remove();
        let filtered = await this.triggersFilter($('#pcm-searchinput').val().toLowerCase(), $(theDialog).find(`.pcm-modalJobControl:first`));
        await this.showTriggersTable(theDialog.find(`.${modal.classModalBody}:first`), filtered, checkFunc, () => {}); if (afterShow) afterShow(this);
        theDialog = null;
      }).appendTo(inputControl);
      if (type === 'triggers') $(`<button class='btn btn-xxs pcm-deleteSelected pcm-tooltipData pcm-tooltipHelper' data-original-title='Delete all the triggers which are selected in the list below.'>Delete Selected</button>`).click( async () => {
        let dbSelected = $(`#${idName} .${modal.classModalDialog}:first`).find('.pcm-checkbox:checked');
        let theDbids = dbSelected.map((_,element) => { return Number($(element).val()); }).get();
        let theUniques = await MySearch.getUniquesDbIds(theDbids);
        if (theUniques.length) MySearchUI.removeJobs(theUniques, async (response, unique) => {
          if (response !== 'NO') $(`#pcm-jobRow-${unique}`).remove();
        }, () => { theUniques = null; theDbids = null; MySearchUI.redoAllTabs(); MySearchUI.redoAllTabTitles(); }, 'Unselect All');
      }).appendTo(inputControl);
      let df2 = document.createDocumentFragment(), filtered = await this.triggersFilter('', modalControl);
      $(df).find(`input:radio[name='theTriggers']`).click( e => { $(e.target).closest('.pcm-modalControl').find('.pcm-searchingTriggers').click(); });
      $(`<div class='pcm-modalControl'></div>`).append(df).insertBefore($(`#${idName} .${modal.classModalBody}`));
      await this.showTriggersTable(df2, filtered, checkFunc, () => {});
      $(df2).appendTo(`#${idName} .${modal.classModalBody}`);
      $(`#pcm-timepicker1`).timepicker({ hourGrid: 4, minuteGrid: 10, timeFormat: 'hh:mm tt' });
      $(`#pcm-timepicker1`).on('change', e => {
        if ($(e.target).val() === '') { $('#pcm-endHours').val('0'); $('#pcm-endMinutes').val('0'); }
        else if ($('#pcm-endHours').val() === '0' && $('#pcm-endMinutes').val() === '0') $('#pcm-endMinutes').val('30');
      });
      $('#pcm-clearTInput').on('click', () => { $('#pcm-timepicker1').val(''); $('#pcm-endHours').val('0'); $('#pcm-endMinutes').val('0'); });
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      if (afterShow) afterShow(this);
      df = null; df2 = null; modalControl = null; radioGroup = null; inputControl = null; filtered = null;
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
}