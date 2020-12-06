/** This class deals with any showing of modals for search triggers.
 * @class ModalSearchClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalSearchClass {
	constructor() {
    this.pandaDur = {'min':0, 'max':3600};
    this.defaultPandaDur = {'min':5, 'max':3600};
    this.hamDur = {'min':0, 'max':120};
    this.fetchesDur = {'min':0, 'max':3600};
    this.pageSize = {'min':20, 'max':100};
    this.queueSize = {'min':20, 'max':600};
    this.triggerHistDays = {'min':2, 'max':120};
    this.customHistDays = {'min':2, 'max':60};
    this.autoRange = {'min':1, 'max':5};
    this.minPayRange = {'min':0.00, 'max':300.00};
  }
  /** Shows a modal for adding panda or search jobs.
   * @param  {function} [afterClose] - Afer Function  @param {bool} [doCustom] - Custom Trigger? */
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
      else if (doCustom && (isNaN(minPay) || minPay === 0)) wrongInput(modalBody, 'All custom Triggers need to have a minimum pay rate at $0.01 or above!', $(`label[for='pcm-formMinPay']`));
      else if ((doCustom) || testGidRid(groupVal)) {
        let groupId = null, reqId = null;
        if (!doCustom) { if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal); else if (groupVal.match(/^[^Aa]/)) groupId = groupVal; else { reqId = groupVal;} }
        if (!doCustom && !reqId && !groupId) wrongInput(modalBody, _, $(`label[for='pcm-formAddGroupID']`));
        else {
          let type = (reqId) ? 'rid' : (groupId) ? 'gid' : 'custom', enabled = ($('#pcm-triggerEnabled').is(':checked') ? 'searching' : 'disabled');
          let theName = (trigName) ? trigName : (reqId) ? reqId : groupId;
          let theRules = (doCustom) ? {'terms':true, 'include':new Set([groupVal]), 'payRange': true, 'minPay':minPay} : {};
          let addSuccess = await bgSearch.addTrigger(type, {'name':theName, 'reqId':reqId, 'groupId':groupId, 'title':data.hitTitle, 'reqName':data.reqName, 'pay':data.price, 'status':enabled}, {'duration': data.duration, 'once':$('#pcm-onlyOnce').is(':checked'), 'limitNumQueue':data.limitNumQueue, 'limitTotalQueue':data.limitTotalQueue, 'limitFetches':data.limitFetches, 'autoGoHam':data.autoGoHam, 'tempGoHam':data.hamDuration, 'acceptLimit':data.acceptLimit}, theRules);
          if (addSuccess) { search.appendFragments(); modal.closeModal(); }
          else wrongInput(modalBody, 'There is already a trigger with this name. Sorry. Please try again.', $(`label[for='pcm-formTriggerName']`));
          theRules = null;
        }
      } else wrongInput(modalBody, _, $(`label[for='pcm-formAddGroupID']`));
    }
    if (!modal) modal = new ModalClass();
    let df = document.createDocumentFragment(), input1Text = '* Enter info for new Job: ', searchOpt = globalOpt.doSearch();
    let data = {'reqName':'', 'hitTitle':'', 'price':0, 'limitNumQueue':0, 'limitTotalQueue':0, 'duration':(doCustom) ? searchOpt.defaultCustDur : searchOpt.defaultDur, 'limitFetches':(doCustom) ? searchOpt.defaultCustFetches : searchOpt.defaultFetches, 'autoGoHam':true, 'hamDuration':(doCustom) ? searchOpt.defaultCustHamDur : searchOpt.defaultHamDur, 'acceptLimit':0};
    let idName = modal.prepareModal(null, '920px', 'pcm-addTriggersModal', 'modal-lg', 'Add new Search Trigger', '<h4>Enter New Search Trigger Information.</h4>', 'pcm-searchModal', '', 'visible btn-sm', 'Add new Search Trigger', async () => { await checkTrigger(doCustom, idName, data); }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    modal.showModal(null, () => {
      let example1Text = 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY', example2Text = 'example: Mechanical Turk receipts';
      if (doCustom) {
        $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Enter a word or phrase to search for in titles and descriptions of a HIT:</div></div>`).appendTo(df);
        input1Text = '* Enter custom search word or phrase: '; example1Text = 'example: survey'; example2Text = 'example: Surveys paying over $1.00';
      } else $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Enter a Group ID, Requester ID, Preview URL or accept URL.</div></div>`).appendTo(df);
      createInput(df, ' pcm-inputDiv-url', 'pcm-formAddGroupID', input1Text, example1Text);
      createInput(df, ' pcm-inputDiv-name', 'pcm-formTriggerName', `${(doCustom) ? '* ' : ''}Name of the Trigger: `, example2Text);
      if (doCustom) createInput(df, ' pcm-inputDiv-pay', 'pcm-formMinPay', '* Pay Min Amount: ', 'example: 1.00');
      createCheckBox(df, 'Enabled: ', 'pcm-triggerEnabled', '', true);
      createCheckBox(df, 'Collect Only One HIT', 'pcm-onlyOnce', '');
      $(`<div class='pcm-horizontalRow'></div>`).appendTo(df);
      if (!doCustom) {
        let table1 = $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered pcm-topDetails'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
        displayObjectData([
          {'label':'Requester Name:', 'type':'text', 'key':'reqName', 'tooltip':'The requester name for this job.'},
          {'label':'HIT Title:', 'type':'text', 'key':'hitTitle', 'tooltip':'The requester name for this job.'},
          {'label':'Pay Amount:', 'type':'text', 'key':'price', 'money':true, 'tooltip':'The payment reward for this job.'},
        ], table1, data, true);
        table1 = null;
      }
      $(`<div class='pcm-autoCollectOptions'>Panda HITs auto collecting options (optional):</div>`).appendTo(df);
      let table2 = $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).appendTo(df);
      displayObjectData([
        {'label':'Limit # of GroupID in Queue:', 'type':'range', 'key':'limitNumQueue', 'tooltip':'Limit number of HITs in queue by this group ID. Great way to do batches slowly.', 'minMax':{'min':0, 'max':24}},
        {'label':'Limit # of Total HITs in Queue:', 'type':'range', 'key':'limitTotalQueue', 'tooltip':'Limit number of HITs allowed in queue. Good when you want to leave room in queue for better HITs.', 'minMax':{'min':0, 'max':24}},
        {'label':'Stop Collecting After (Seconds):', 'type':'number', 'key':'duration', 'seconds':true, 'default':data.duration, 'tooltip':'The number of seconds for this job to collect before stopping. Resets time if a HIT gets collected.', 'minMax':this.pandaDur},
        {'label':'Stop Collecting After # of Fetches:', 'type':'number', 'key':'limitFetches', 'default':data.limitFetches, 'tooltip':'Number of tries to catch a HIT to do before stopping.', 'minMax':this.fetchesDur},
        {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key':'autoGoHam', 'tooltip':'Should this job go ham when it finds a HIT and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
        {'label':'Force Delayed Ham Duration (Seconds):', 'type':'number', 'key':'hamDuration', 'seconds':true, 'default':data.hamDuration, 'tooltip':'The duration in seconds to use to go in ham mode after collecting a HIT and then go back to normal collecting mode.', 'minMax':this.hamDur},
        {'label':'Daily Accepted HIT Limit:', 'type':'number', 'key':'acceptLimit', 'default':0, 'tooltip':'How many HITs a day should be accepted for this job?'},
      ], table2, data, true);
      let modalBody = $(`#${idName} .${modal.classModalBody}`);
      modalBody.append(df);
      modalBody.find('.pcm-inputText-md').keypress( async e => { if ((e.keyCode ? e.keyCode : e.which) == '13') await checkTrigger(doCustom, idName, data); });
      $('#pcm-triggerEnabled').click( () => $('#pcm-formAddGroupID').focus() );
      $('#pcm-onlyOnce').click( () => $('#pcm-formAddGroupID').focus() );
      $('#pcm-formAddGroupID').focus();
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
    let searchDbId = (dbId !== null) ? dbId : bgSearch.pandaToDbId(pDbId);
    let changes = {'details':Object.assign({}, bgSearch.getData(searchDbId)), 'rules':null, 'options':null, 'searchDbId':searchDbId}
    if (typeof changes.details.disabled === 'undefined') changes.details.disabled = true;
    if (typeof changes.details.name === 'undefined') changes.details.name = changes.details.value;
    changes.rules = await bgSearch.rulesCopy(changes.searchDbId); changes.options = await bgSearch.optionsCopy(changes.searchDbId);
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
      $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Add a ${text} or remove others.</div></div>`).appendTo(df);
      if (type === 'custom') $(`<div class='small pcm-customRules'>All Custom Searches must have one 3 character Accepted word or phrase.<br>Adding more include or exclude words may cause script to find HITs slower.</div>`).appendTo(df);
      let form = $(`<div class='form-group row'></div>`).appendTo(df);
      let selectBox = $(`<select class='form-control input-sm col-5' id='pcm-selectedBox' multiple size='10'></select>`).appendTo(form);
      this.selectBoxAdd(values, $(selectBox));
      $(`<button class='btn btn-xs pcm-addToSelect'>Add ${text2}</button>`).on( 'click', () => {
        modal.showDialogModal('750px', `Add New ${text}`, `<div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-modalInfo'>Type in a ${text2}.</div>`, (idName) => {
          let newValue = $('#pcm-formQuestion').val(); $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('');
          if (newValue && validFunc(newValue)) {
            editSet.add(newValue); values = Array.from(editSet); this.selectBoxAdd(values, $(`#pcm-selectedBox`));
            $(`#pcm-tdLabel-acceptWords1, #pcm-tdLabel-acceptWords2`).removeClass('pcm-optionLabelError'); modal.closeModal();
          } else $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('Invalid Group ID. Try again.');
        }, true, false, `${text2}: `, ``, 35,_, () => { $(`#${idName}`).focus(); }, `Add ${text2}`,_,_,(text2 === 'Group ID') ? 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY' : 'example: survey');
      }).appendTo(df);
      $(`<button class='btn btn-xs pcm-removeFromSelect'>Remove Selected</button>`).on( 'click', () => {
        let removeList = $(`#pcm-selectedBox`).val();
        if (type !== 'custom' || !notEmpty || (type === 'custom' && values.length > 0)) {
          for (const index of removeList) { editSet.delete(values[index]); }
          values = Array.from(editSet); this.selectBoxAdd(values, $(`#pcm-selectedBox`)); $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('');
        } else { $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('Must have 1 Accepted word or phrase in list!'); }
      }).appendTo(df);
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunc(); });
      df = null; form = null; selectBox = null;
    }, () => { });
  }
  /** Appends the option editing info for a search trigger or search job.
   * @param {object} appendHere - Jquery Object  @param {object} changes - Trigger Data Object  @param {bool} [searchUI] - SearchUI? */
  triggerOptions(appendHere, changes, searchUI=true) {
    $(`<div class='pcm-detailsHeading unSelectable'>Options: Click on the details or buttons to edit.</div>`).appendTo(appendHere);
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
      {'label':'Maximum Pay:', 'type':'number', 'key':'maxPay', 'key1':'rules', 'money':true, 'default':0, 'tooltip':'The maximum pay for a HIT to start collecting.'},
      {'label':'Words or phrases Accepted Only:', 'id':'pcm-string-include', 'type':'string', 'string':iTStr, 'key':'acceptWords1', 'disable':true, 'default':0, 'tooltip':'HITs with these words or phrases only will try to be collected.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Accepted Words or Phrases', 'addClass':' btn-xxs pcm-myPrimary', 'key':'acceptWords2', 'width':'165px', 'unique':1, 'btnFunc': e => {
        this.editTriggerOptions(changes.rules.include, 'Word or phrase to watch for', 'Word or phrase', () => { return true; }, () => {
          iTStr = this.rulesToStr(changes.rules.include, $('#pcm-string-include')); modal.closeModal(); $(e.target).closest(`.pcm-modal`).focus();
        }, changes.details.type, true);
      }},
      {'label':'Excluded Words or Phrases:', 'id':'pcm-string-exclude', 'type':'string', 'string':eTStr, 'disable':true, 'default':0, 'tooltip':'HITs with these words or phrases will be ignored.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Excluded Words or Phrases', 'addClass':' btn-xxs pcm-myPrimary', 'idStart':'pcm-excludeWord-', 'width':'175px', 'unique':1, 'btnFunc': e => {
        this.editTriggerOptions(changes.rules.exclude, 'Word or phrase to exclude', 'Word or phrase', () => { return true; }, () => {
          eTStr = this.rulesToStr(changes.rules.exclude, $('#pcm-string-exclude')); modal.closeModal(); $(e.target).closest(`.pcm-modal`).focus();
        }, changes.details.type);
      }},
      {'label':'Excluded Group IDs', 'id':'pcm-string-blockGid', 'type':'string', 'string':bGStr, 'disable':true, 'default':0, 'tooltip':'HITs with these group IDs will try to be collected only.'},
      {'label':'Edit', 'type':'button', 'btnLabel':'Excluded Group IDs', 'addClass':' btn-xxs pcm-myPrimary', 'idStart':'pcm-excludeGid-', 'width':'175px', 'unique':1, 'btnFunc': e => {
        this.editTriggerOptions(changes.rules.blockGid, 'Group ID to block', 'Group ID', (value) => { return value.match(/^[3][0-9a-zA-Z]{15,35}$/); }, () => {
          bGStr = this.rulesToStr(changes.rules.blockGid, $('#pcm-string-blockGid')); modal.closeModal(); $(e.target).closest(`.pcm-modal`).focus();
        }, changes.details.type);
      }},
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
      {'label':'Daily Accepted HIT Limit:', 'type':'number', 'key1':'options', 'key':'acceptLimit', 'default':0, 'tooltip':'How many HITs a day should be accepted for this job?'},
      {'label':'Stop Collecting After (Seconds):', 'type':'number', 'key1':'options', 'key':'duration', 'seconds':true, 'default':0, 'tooltip':'The number of seconds for HITs found to collect before stopping. Resets time if a HIT gets collected.', 'minMax':this.pandaDur},
      {'label':'Stop Collecting After # of Fetches:', 'type':'number', 'key1':'options', 'key':'limitFetches', 'default':0, 'tooltip':'Number of tries to catch a HIT to do before stopping.', 'minMax':this.fetchesDur},
      {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key1':'options', 'key':'autoGoHam', 'tooltip':'Should this job go ham when it finds a HIT and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
      {'label':'Temporary Start Ham Duration (Seconds):', 'type':'number', 'key1':'options', 'key':'tempGoHam', 'seconds':true, 'default':0, 'tooltip':'The duration in seconds to use to go in ham mode after starting to collect a HIT and then go back to normal collecting mode.', 'minMax':this.hamDur},
    ], theTable, changes, true);
    theTable = null;
  }
  /** Show the details for a search trigger.
   * @param {number} unique - Trigger Unique Number  @param {function} [afterClose] - After Close Function  */
  async showDetailsModal(unique, afterClose=null) {
    if (!modal) modal = new ModalClass();
    let dbId = bgSearch.uniqueToDbId(unique), sChanges = await this.fillInData(dbId);
    let idName = modal.prepareModal(sChanges, '700px', 'pcm-triggerDetailsModal', 'modal-lg', 'Details for a Trigger', '', '', '', 'visible btn-sm', 'Save New Details', async (changes) => {
      $(`.pcm-eleLabel`).removeClass('pcm-optionLabelError');
      if (changes.details.type === 'custom' && changes.rules.include.size === 0) {
        $(`#${idName} .pcm-checkStatus.pcm-inputError`).html('Custom searches MUST have 1 Accepted word or phrase!');
        $(`#pcm-tdLabel-acceptWords1, #pcm-tdLabel-acceptWords2`).addClass('pcm-optionLabelError');
      } else {
        await bgSearch.optionsChanged(changes, changes.searchDbId);
        $(`#pcm-triggerName-${unique}`).html(changes.details.name);
        modal.closeModal();
      }
    }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    modal.showModal(null, async () => {
      let detailsDiv = $(`<div id='pcm-modalBody'></div>`).appendTo(`#${idName} .${modal.classModalBody}`);
      let detailsTabs = new TabbedClass(detailsDiv, `pcm-detailTabs`, `pcm-tabbedDetails`, `pcm-detailsContents`, false, 'Srch');
      let [, err] = await detailsTabs.prepare();
      if (!err) {
        let optionTab = await detailsTabs.addTab(`Trigger Options`, true), optionsContents = $(`<div class='pcm-optionCont card-deck'></div>`).appendTo(`#${optionTab.tabContent}`);
        let detailTab = await detailsTabs.addTab(`Panda Job Options`), detailsContents = $(`<div class='pcm-detailsCont card-deck'></div>`).appendTo(`#${detailTab.tabContent}`);
        let df = document.createDocumentFragment(), df2 = document.createDocumentFragment();
        this.triggerOptions(df, modal.tempObject[idName]); optionsContents.append(df);
        this.triggerPandaOptions(df2, modal.tempObject[idName]); detailsContents.append(df2);
        optionTab = null; optionsContents = null; detailTab = null; detailsContents = null; df = null; df2 = null;
      }
      detailsDiv = null; detailsTabs = null;
    }, () => { modal = null; sChanges = null; if (afterClose) afterClose(); });
  }
  /** Fills in a select input with options from an array.
   * @param {array} values - Values  @param {object} appendHere - Jquery Element */
  selectBoxAdd(values, appendHere) { appendHere.html(''); for (let i=0, len=values.length; i < len; i++) { appendHere.append(`<option value='${i}'>${values[i]}</option>`); }}
  /** Shows a modal with all the found HITs in a table.
   * @param {number} unique - Trigger Unique  @param {function} [afterClose] After Close Function */
  showTriggerFound(unique, afterClose=null) {
    if (!modal) modal = new ModalClass(); let dbId = bgSearch.uniqueToDbId(unique);
    const idName = modal.prepareModal(null, '860px', 'pcm-triggerFoundModal', 'modal-lg', 'Show triggers found by Trigger.', '', 'pcm-modalHitsFound', '', 'visible btn-sm', 'Done', () => { modal.closeModal(); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(null, async () => {
      let groupHist = await bgSearch.getFromDB('history', dbId, 'dbId', true, false, 80), rules = await bgSearch.theData(dbId, 'rules');
      let gidsValues = [], gidsData = {}, blocked = rules.blockGid, df = document.createDocumentFragment();
      arrayCount(groupHist, (value) => { gidsValues.push(value.gid); gidsData[value.gid] = value; return true; }, true);
      let gidsHistory = await bgHistory.findValues(gidsValues);
      let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-moreCondensed table-bordered'></table>`)
        .append(`<thead><tr><td style='width:75px; max-width:75px;'>date</td><td style='width:82px; max-width:82px;'>Gid</td><td style='width:120px; max-width:120px;'>Title</td><td style='width:440px; max-width:440px'>Descriptions</td><td style='width:52px; max-width:52px;'>Pays</td><td style='width: 70px; max-width:70px;'></td></tr></thead>`).append(`<tbody></tbody>`).appendTo(df);
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
          {'type':'keyValue', 'key':'date', 'maxWidth':'75px'}, {'type':'keyValue', 'key':'gid', 'maxWidth':'82px'},
          {'type':'keyValue', 'key':'title', 'maxWidth':'120px'}, {'type':'keyValue', 'key':'desc', 'maxWidth':'440px'}, {'type':'keyValue', 'key':'pays', 'maxWidth':'52px'},
          {'label':'block', 'type':'button', 'btnLabel':btnLabel, 'addClass':` btn-xxs${statusClass}`, 'maxWidth':'70px', 'btnFunc': e => {
            if (blocked.has(key)) { blocked.delete(key); $(e.target).removeClass(`pcm-hitBlocked`).html('Block HIT'); }
            else { blocked.add(key); $(e.target).addClass(`pcm-hitBlocked`).html('Unblock'); }
            rules.blockGid = blocked; bgSearch.theData(dbId, 'rules', rules)
          }, 'idStart': 'pcm-blockThis', 'unique': key}
        ], theTable.find(`tbody`), tempObj, true, true, true, 'pcm-modalTriggeredhit');
        tempObj = null;
      }
      $(`#${idName} .${modal.classModalBody}`).append(df);
      groupHist = null; df = null; gidsHistory = null; theTable = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with all search options that can be changed by the user.
   * @param {function} [afterClose] - After Close Function */
  showSearchOptions(afterClose=null) {
    let saveFunction = (changes) => {
      globalOpt.theToSearchUI(changes.toSearchUI, false); globalOpt.theSearchTimer(changes.searchTimer, false);
      globalOpt.doSearch(changes.options); bgSearch.timerChange(changes.searchTimer);
      modal.closeModal();
    }
    if (!modal) modal = new ModalClass();
    let theData = {'toSearchUI':globalOpt.theToSearchUI(), 'searchTimer':globalOpt.theSearchTimer(), 'options':globalOpt.doSearch()};
    const idName = modal.prepareModal(theData, '860px', 'pcm-triggerOptModal', 'modal-lg', 'Edit Search General Options', '', '', '', 'visible btn-sm', 'Save Options', (changes) => { saveFunction(changes); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Search Job Buttons Create Search UI Triggers:', 'type':'trueFalse', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'}, 
        {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':`Change the search timer duration for HITs to be searched and found in milliseconds.`, 'minMax':globalOpt.getTimerSearch()},
        {'label':'Default Trigger Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultDur', 'tooltip':`The default duration for new triggers to use on panda jobs.`, 'minMax':this.defaultPandaDur},
        {'label':'Default Trigger Ham Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultHamDur', 'tooltip':`The default ham duration for new triggers to use on panda jobs.`, 'minMax':this.hamDur},
        {'label':'Default Trigger Limit Fetches:', 'type':'number', 'key1':'options', 'key':'defaultFetches', 'tooltip':`The default number of fetches for new triggers to use on panda jobs.`, 'minMax':this.fetchesDur},
        {'label':'Default Custom Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultCustDur', 'tooltip':`The default duration for new custom triggers to use on panda jobs.`, 'minMax':this.pandaDur},
        {'label':'Default Custom Ham Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultCustHamDur', 'tooltip':`The default ham duration for new custom triggers to use on panda jobs.`, 'minMax':this.hamDur},
        {'label':'Default Custom Limit Fetches:', 'type':'number', 'key1':'options', 'key':'defaultCustFetches', 'tooltip':`The default number of fetches for new custom triggers to use on panda jobs.`, 'minMax':this.fetchesDur},
        {'label':'Page Size for MTURK Search Page:', 'type':'number', 'key1':'options', 'key':'pageSize', 'tooltip':`Number of HITs used on mturk first search page. The higher the number can slow searching but also can give a better chance of finding HITs you want.`, 'minMax':this.pageSize},
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunction(modal.tempObject[idName]); });
      theData = null; df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with all search advanced options that can be changed by the user.
   * @param {function} [afterClose] - After Close Function */
  showSearchAdvanced(afterClose=null) {
    let saveFunction = (changes) => { globalOpt.doSearch(changes); modal.closeModal(); }
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doSearch(), '860px', 'pcm-advancedOptModal', 'modal-lg', 'Edit Search Advanced Options', '', '', '', 'visible btn-sm', 'Save Options', (changes) => { saveFunction(changes); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Number of Trigger Data to Keep in Memory:', 'type':'number', 'key':'queueSize', 'tooltip':`To save memory the script will only keep this number of most active trigger data in memory and the rest in the database. Loading from database can be slower.`, 'minMax':this.queueSize},
        {'label':'Trigger HITs History Days Expiriration:', 'type':'number', 'key':'triggerHistDays', 'tooltip':`HITs found by trigger is saved in the database and this number represents the days to keep those HITs saved.`, 'minMax':this.triggerHistDays},
        {'label':'Custom HITs History Days Expiration:', 'type':'number', 'key':'customHistDays', 'tooltip':`Custom triggered HITs can find a large amount of HITs so this number represents how many days to save these found HITs. Should be lower than regular triggers.`, 'minMax':this.customHistDays},
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunction(modal.tempObject[idName]); });
      df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal where a user can add or remove blocked group or requester ID's
   * @param {function} [afterClose] - After Close Function */
  showSearchBlocked(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doSearch(), '860px', 'pcm-blockedModal', 'modal-lg', `Edit Blocked Group and Requester ID's`, '', '', '', 'visible btn-sm', 'Done', () => { modal.closeModal(); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let blockingDiv = $(`<div id='pcm-blockDetails'></div>`).appendTo(`#${idName} .${modal.classModalBody}`);
      let blockTabs = new TabbedClass(blockingDiv, `pcm-blockingTabs`, `pcm-gidBlock`, `pcm-ridBlock`, false, 'Block');
      let [, err] = await blockTabs.prepare();
      if (!err) {
        let gidvals = bgSearch.getBlocked(), ridvals = bgSearch.getBlocked(false);
        /** Changes the status displayed to a given text and will change class if an error.
         * @param {string} tab - Tab Class Name  @param {String} [resultStr] - Html text  @param {bool} [error] - Error? */
        let statusInput = (tab, resultStr=null, error=true) => {
          let theClass = (error) ? 'pcm-optionLabelError' : 'pcm-statusSuccess', theBody = $(`#${idName} .${modal.classModalBody}`);
          theBody.find(`.${tab} .pcm-inputResult:first`).removeClass('pcm-optionLabelError pcm-statusSuccess').addClass(theClass).html(resultStr);
          theBody.find(`.${tab} input:first`).focus();
        }
        /** Checks if the input values are correct according to the rules. Uses booleon value to know if it's removing or adding.
         * @async            - To wait for data from the history database.
         * @param {object} e - Event Object  @param {bool} remove - Value Removed? */
        let checkInput = async (e, remove) => {
          let thisTab = $(e.target).data('tab'), gid = null, rid = null, theResult = null, groupId = $(e.target).data('gid');
          let theBody = $(`#${idName} .${modal.classModalBody}`), value = theBody.find(`.${thisTab} input`).val();
          if (!value) { statusInput(thisTab, 'Enter in an ID in the input below.'); return; }
          else if (groupId && value.match(/^3[0-9a-zA-Z]{14,38}$/)) gid = value; else if (!groupId && value.match(/^[Aa][0-9a-zA-Z]{6,25}$/)) rid = value;
          if (gid || rid) {
            theResult = bgSearch.theBlocked(gid, rid, !remove, remove);
            if (theResult[(groupId) ? 0 : 1]) {
              statusInput(thisTab, `SUCCESS: ID ${(remove) ? 'Removed from' : 'added to'} blocked HITs.`, false);
              if (!remove) {
                let valInfo = await bgHistory.findValues((groupId) ? [gid] : [rid]);
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
        let gidsHistory = await bgHistory.findValues(gidvals), ridsHistory = await bgHistory.findValues(ridvals), values = gidvals; 
        for (let j=0, len=gidvals.length; j < len; j++) { gidvals[j] += (gidsHistory[gidvals[j]]) ? ` - ${gidsHistory[gidvals[j]].title}` : ` -`; }
        for (let j=0, len=ridvals.length; j < len; j++) { ridvals[j] += (ridsHistory[ridvals[j]]) ? ` - ${ridsHistory[ridvals[j]].reqName}` : ` -`; }
        for (let i=0; i < 2; i++) {
          $(`<div><div class='pcm-inputResult'>&nbsp;</div><div class='pcm-modalInfo'>Enter an ID to add or remove from being blocked.</div></div>`).appendTo(thisFrag);
          createInput(thisFrag, ' pcm-inputDiv-url', 'pcm-formAddTheID', `Enter in ${(typeGid) ? 'Group' : 'Requester'} ID:`, typeExample,_, '','',90);
          $(`<button class='btn btn-xs pcm-addBlocked'>Add ID</button>`).data('tab',thisTab).data('gid',typeGid)
            .on('click', e => { checkInput(e, false, this); }).appendTo(thisFrag);
          $(`<button class='btn btn-xs pcm-removeBlocked'>Remove ID</button>`).data('tab',thisTab).data('gid',typeGid)
            .on('click', e => { checkInput(e, true, this); }).appendTo(thisFrag);
          let form = $(`<div class='form-group pcm-inputBoxForm'></div>`).appendTo(thisFrag);
          let selectBox = $(`<select class='form-control input-sm col-8' id='pcm-selectedBox' multiple size='12'></select>`).appendTo(form);
          this.selectBoxAdd(values, $(selectBox));
          $(`<button class='btn btn-xs btn-primary pcm-removeFromSelect'>Remove selected ID</button>`).data('tab',thisTab).data('gid',typeGid).on( 'click', e => {
            let theBody = $(`#${idName} .${modal.classModalBody}`), thisTab = $(e.target).data('tab'), selected = theBody.find(`.${thisTab} option:selected`)
            let isgid = $(e.target).data('gid'), valArray = (isgid) ? gidvals : ridvals, gid = null, rid = null;
            if (selected.length) {
              for (const ele of selected) {
                let text = $(ele).text(), value = text.split(' ')[0]; if (isgid) gid = value; else rid = value; let theResult = bgSearch.theBlocked(gid, rid, false, true);
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
        gidContents.append(df); ridContents.append(df2);
        $(`#${blockTabs.ulId} .nav-link`).click( e => {
          let content = $(e.target).closest('a').attr('href'); setTimeout(() => { $(content).find('input').focus(); }, 1);
        });
        gidContents.find('input').focus();
        df = null; df2 = null; gidContents = null; ridContents = null; thisFrag = null; gidsHistory = null; ridsHistory = null; values = null;
      }
      blockingDiv = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with data from a HIT that was triggered. Double clicked on the HIT on the Custom Triggered HITs tab.
   * @param {object} theData - HIT data  @param {function} [afterClose] - After Close Function  @param {object} [e] - Event Object */
  showTriggeredHit(theData, afterClose=null, e=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doSearch(), '860px', 'pcm-triggeredHitModal', 'modal-lg', 'Triggered HIT Details', '', '', '', 'visible btn-sm', 'Done', () => {
      let check = bgSearch.theBlocked(theData.gid, theData.rid), tr = $(e.target).closest('tr');
      if (e && (check[0] || check[1])) tr.addClass('pcm-blockedHit'); else tr.removeClass('pcm-blockedHit');
      modal.closeModal(); check = null; tr = null
    }, 'invisible', 'No', null, 'invisible', 'Cancel');
    modal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment(), blocked = bgSearch.theBlocked(theData.hit_set_id, theData.requester_id);
      $(`<div class='pcm-detailsEdit'>Details of this HIT:</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Requester Name:', 'type':'keyValue', 'key':'requester_name', 'disable':true, 'tooltip':`Requester Name for this HIT.`},
        {'label':'Title:', 'type':'keyValue', 'key':'title', 'disable':true, 'tooltip':`Title of this HIT.`},
        {'label':'Description:', 'type':'keyValue', 'key':'description', 'disable':true, 'tooltip':`Description of this HIT.`},
        {'label':'Price:', 'type':'number', 'key1':'monetary_reward', 'key':'amount_in_dollars', 'money':true, 'disable':true, 'tooltip':`Price for this HIT.`},
        {'label':'Requester ID:', 'type':'keyValue', 'key':'requester_id', 'disable':true, 'tooltip':`Requester ID for this HIT.`},
        {'label':'Group ID:', 'type':'keyValue', 'key':'hit_set_id', 'disable':true, 'tooltip':`Group ID for this HIT.`},
      ], df, theData, true);
      $(`<div class='pcm-buttonArea'></div>`).append($(`<button class='btn btn-xs pcm-blockGid'>${(blocked[0]) ? 'UNBLOCK' : 'Block'} this Group ID</button>`).click( e => {
          bgSearch.theBlocked(theData.hit_set_id, null, true, false, true); let check = bgSearch.theBlocked(theData.hit_set_id, null);
          $(e.target).text(`${(check[0]) ? 'UNBLOCK' : 'Block'} this Group ID`); check = null;
        })).append($(`<button class='btn btn-xs pcm-blockRid'>${(blocked[1]) ? 'UNBLOCK' : 'Block'} this Requester</button>`).click( e => {
          bgSearch.theBlocked(null, theData.requester_id, true, false, true); let check = bgSearch.theBlocked(null, theData.requester_id);
          $(e.target).text(`${(check[1]) ? 'UNBLOCK' : 'Block'} this Requester`); check = null;
        })).appendTo(df);
        $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
        df = null; blocked = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Creates a table for the triggers cards in the triggers array.
   * @async                    - To wait for search trigger data from database.
   * @param {object} modalBody - Jquery Element  @param {array} triggers - Trigger ID's  @param {function} checkboxFunc - Checkbox Function */
  async showTriggersTable(modalBody, triggers, checkboxFunc=null) {
    let divContainer = $(`<table class='table table-dark table-sm table-moreCondensed pcm-jobTable table-bordered w-auto'></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      {'string':'', 'type':'checkbox', 'btnFunc': e => { $(`.modal-body input[type='checkbox']`).prop('checked', $(e.target).is(':checked')); }},
      {'string':'Type', 'type':'string', 'noBorder':true}, {'string':'Trigger Name', 'type':'string', 'noBorder':true}, {'string':'Trigger ID or Term', 'type':'string', 'noBorder':true},
      {'string':'Status', 'type':'string'}
    ], divContainer, {}, true, true, true, 'pcm-triggeredhit');
    for (const dbId of triggers) {
      let trigger = bgSearch.getTrigger(dbId), data = bgSearch.getData(dbId), rules = await bgSearch.theData(dbId, 'rules');
      let statusClass = (data.disabled) ? ' pcm-hitDisabled' : '';
      if (rules.terms) { data.term = rules.include.values().next().value; } else data.term = '';
      data.status = (data.disabled) ? 'Disabled' : 'Enabled&nbsp;';
      displayObjectData([
        {'string':'', 'type':'checkbox', 'width':'25px', 'maxWidth':'25px', 'unique':dbId, 'inputClass':' pcm-checkbox', 'btnFunc':checkboxFunc},
        {'string':'Trigger Type', 'type':'keyValue', 'key':'type', 'width':'50px', 'maxWidth':'50px', id:`pcm-TRT-${dbId}`},
        {'string':'Trigger Name', 'type':'keyValue', 'key':'name', 'width':'420px', 'maxWidth':'420px', id:`pcm-TRN-${dbId}`},
        {'string':'Trigger ID or Term', 'type':'keyValue', 'key':'value', 'orKey': 'term', 'width':'350px', 'maxWidth':'350px', 'id':`pcm-TRID-${dbId}`},
        {'label':'Status', 'type':'button', 'btnLabel':data.status, 'addClass':` btn-xxs${statusClass}`, 'maxWidth':'70px', 'btnFunc': e => {
          let dbId = e.data.unique, unique = bgSearch.getTrigger(dbId).count, data = bgSearch.getData(dbId);
          search.updateTrigger($(`#pcm-triggerCard-${unique}`).closest('.card'));
          if (data.disabled) { $(e.target).addClass('pcm-hitDisabled'); $(e.target).html('Disabled'); }
          else { $(e.target).removeClass('pcm-hitDisabled'); $(e.target).html('Enabled&nbsp;'); }
        }, 'idStart': 'pcm-statusThis', 'unique': dbId}
      ], divContainer, data, true, true,_,_, `pcm-jobRow-${trigger.count}`);
    }
    divContainer = null;
  }
  /** Filters out jobs with the search term, collecting radio, search mode and once options.
   * @param  {string} search - Search Term  @param  {object} modalControl - Jquery element
   * @return {array}         - Array of job ID's filtered. */
  triggersFilter(search, modalControl) {
    let newArray = [];
    for (const dbId of bgSearch.getFrom('Search')) {
      let good = false, data = bgSearch.getData(dbId);
      const radioChecked = $(modalControl).find(`input[name='theTriggers']:checked`).val();
      if (radioChecked === '0') good = true;
      else if (radioChecked === '1' && !data.disabled) good = true;
      else if (radioChecked === '2' && data.disabled) good = true;
      else if (radioChecked === '3' && data.type === 'rid') good = true;
      else if (radioChecked === '4' && data.type === 'gid') good = true;
      else if (radioChecked === '5' && data.type === 'custom') good = true;
      if (good && search !== '' && data.name.toLowerCase().includes(search)) good = true;
      else if (good && search !== '') good = false;
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
      if (type === 'groupingEdit') {
        $(`<div class='small pcm-selectTriggers'></div>`).append('Select the triggers you want in this grouping below:').append(`<span class='pcm-triggersInGroup'>Triggers in Group: ${Object.keys(thisObj.triggers).length}</span>`).appendTo(modalControl);
        createInput(modalControl, ' pcm-groupingNameDiv', 'pcm-groupingNameI', 'Grouping Name: ', `default: Grouping #${groupUnique}`, null, '', modal.tempObject[idName].name).append(createTimeInput('Start Time', 'pcm-timepicker1', thisObj.startTime));
        createInput(modalControl, ' pcm-groupingDescDiv', 'pcm-groupingDescI', 'Description: ', 'default: no description', null, '', modal.tempObject[idName].description).append(createTimeElapse(thisObj.endHours, thisObj.endMinutes));
      }
      let radioGroup = $(`<div class='pcm-groupingsControl'></div>`).appendTo(modalControl);
      radioButtons(radioGroup, 'theTriggers', '0', 'All Triggers', true);  radioButtons(radioGroup, 'theTriggers', '1', 'Enabled');
      radioButtons(radioGroup, 'theTriggers', '2', 'Disabled'); radioButtons(radioGroup, 'theTriggers', '3', 'Requester ID');
      radioButtons(radioGroup, 'theTriggers', '4', 'Group Id'); radioButtons(radioGroup, 'theTriggers', '5', 'Custom');
      let inputControl = createInput(modalControl, ' pcm-searchInputDiv', 'pcm-searchinput', 'Search phrase: ', 'example: receipts', e => {
        $(e.target).closest('.pcm-modalControl').find('.pcm-searchingTriggers').click();
      });
      $(`<button class='btn btn-xxs pcm-searchingTriggers'>Search</button>`).on( 'click', async () => {
        let theDialog = $(`#${idName} .${modal.classModalDialog}:first`); $(theDialog).find('.pcm-jobTable').remove();
        let filtered = this.triggersFilter($('#pcm-searchinput').val().toLowerCase(), $(theDialog).find(`.pcm-modalJobControl:first`));
        await this.showTriggersTable(theDialog.find(`.${modal.classModalBody}:first`), filtered, checkFunc, () => {}); if (afterShow) afterShow(this);
        theDialog = null;
      }).appendTo(inputControl);
      if (type === 'triggers') $(`<button class='btn btn-xxs pcm-deleteSelected'>Delete Selected</button>`).click( async () => {
        let dbSelected = $(`#${idName} .${modal.classModalDialog}:first`).find('.pcm-checkbox:checked');
        let selected = dbSelected.map((_,element) => { return Number(bgSearch.getTrigger($(element).val()).count); }).get();
        if (selected.length) search.removeJobs(selected, async (response, unique) => {
          if (response !== 'NO') $(`#pcm-jobRow-${unique}`).remove();
        }, () => { selected = null; }, 'Unselect All');
      }).appendTo(inputControl);
      let df2 = document.createDocumentFragment(), filtered = this.triggersFilter('', modalControl);
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
      if (afterShow) afterShow(this);
      df = null; df2 = null; modalControl = null; radioGroup = null; inputControl = null; filtered = null;
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
}