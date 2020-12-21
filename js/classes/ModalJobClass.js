/** This class deals with any showing of modals for jobs.
 * @class ModalJobClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalJobClass {
	constructor() {
    this.pandaDur = {'min':0, 'max':120} // Limits for the panda duration in minutes.
    this.modalSearch = null;
  }
  /** Will create a table with the panda options ready to be changed by user.
   * @param {object} appendHere - Jquery Element  @param {object} theData - Data to Change */
  pandaOptions(appendHere, theData) {
    $(`<div class='pcm-detailsHeading unSelectable'>Details of job: All can be edited except details in yellow. Click on the details to edit.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered w-100'></table>`).appendTo(appendHere);
    displayObjectData([
      {'label':'Limit # of GroupID in Queue:', 'type':'range', 'key':'limitNumQueue', 'min':0, 'max':24, 'ifNot':'search', 'tooltip':'Limit number of HITs in queue by this group ID. Great way to do batches slowly.'},
      {'label':'Limit # of Total HITs in Queue:', 'type':'range', 'key':'limitTotalQueue', 'min':0, 'max':24, 'ifNot':'search', 'tooltip':'Limit number of HITs allowed in queue. Good when you want to leave room in queue for better HITs.'},
      {'label':'Accept Only Once:', 'type':'trueFalse', 'key':'once', 'ifNot':'search', 'tooltip':'Should only one HIT be accepted and then stop collecting? Great for surveys.'},
      {'label':'Daily Accepted HIT Limit:', 'type':'number', 'key':'acceptLimit', 'default':0, 'ifNot':'search', 'tooltip':'How many HITs a day should be accepted for this job?'},
      {'label':'Stop Collecting After (Minutes):', 'type':'number', 'key':'duration', 'minutes':true, 'default':0, 'ifNot':'search', 'tooltip':'The number of minutes for this job to collect before stopping. Resets Time if a HIT Gets Collected.', 'minMax':this.pandaDur},
      {'label':'Stop Collecting After # of Fetches:', 'type':'number', 'key':'limitFetches', 'default':0, 'ifNot':'search', 'tooltip':'Number of tries to catch a HIT to do before stopping.'},
      {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key':'autoGoHam', 'ifNot':'search', 'tooltip':'Should this job go ham when it finds a HIT and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
      {'label':'Force Delayed Ham Duration (Seconds):', 'type':'number', 'key':'hamDuration', 'seconds':true, 'default':0, 'ifNot':'search', 'tooltip':'The duration in seconds to use to go in ham mode after collecting a HIT and then go back to normal collecting mode.', 'minMax':this.pandaDur},
      {'label':'Friendly Requester Name:', 'type':'text', 'key':'friendlyReqName', 'tooltip':'A user created requester name to make the name shorter or easier to remember.'},
      {'label':'Friendly HIT Title:', 'type':'text', 'key':'friendlyTitle', 'tooltip':'A user created HIT title to make the title shorter or easier to remember what it is.'},
    ], theTable, theData, true);
    theTable = null;
  }
  /** Will create a table with the panda details ready to show or be changed by the user.
   * @param {object} appendHere - Jquery Element  @param {object} theData Data to Change  @param {bool} [ridDisabled] - Disable RID Display? */
  pandaDetails(appendHere, theData, ridDisabled=false) {
    if (!ridDisabled) $(`<div class='pcm-detailsHeading unSelectable'>Details of job: All can be edited except details in yellow. Click on the details to edit.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered'></table>`).appendTo(appendHere);
    let ridDisableTip = (ridDisabled) ? ' May not be changed by user.' : '';
    displayObjectData([
      {'label':'Requester ID', 'type':'text', 'key':'reqId', 'disable':ridDisabled, 'tooltip':`The requester ID for this job.${ridDisableTip}`},
      {'label':'Requester Name:', 'type':'text', 'key':'reqName', 'disable':true, 'tooltip':'The requester name for this job. May not be changed by user.'},
      {'label':'Group ID', 'type':'text', 'key':'groupId', 'disable':true, 'tooltip':'The group ID for this job. May have multiple group ID jobs if wanted. May not be changed by user.'},
      {'label':'Title', 'type':'text', 'key':'title', 'disable':true, 'tooltip':'The title for this job. May not be changed by user.'},
      {'label':'Description', 'type':'text', 'key':'description', 'disable':true, 'tooltip':'The description for this job. May not be changed by user.'},
      {'label':'Price', 'type':'text', 'key':'price', 'money':true, 'disable':true, 'tooltip':'The payment reward for this job. May not be changed by user.'},
      {'label':'Assigned Time', 'type':'text', 'key':'assignedTime', 'disable':true, 'tooltip':'The assigned time in seconds that this has before expiration. May not be changed by user.'},
      {'label':'Expires', 'type':'text', 'key':'expires', 'disable':true, 'tooltip':'The day and time which this HIT will no longer be on MTURK. May not be changed by user.'},
      {'label':'Date Added', 'type':'keyValue', 'key':'dateAdded', 'disable':true, 'format':'date', 'tooltip':'The date which this HIT was added to PandaCrazy Max. May not be changed by user.'},
      {'label':'Total Seconds Collecting', 'type':'text', 'key':'totalSeconds', 'disable':true, 'tooltip':'The total amount of seconds which this job has tried to collect HITs since it was added. May not be changed by user.'},
      {'label':'Total Accepted HITs', 'type':'text', 'key':'totalAccepted', 'disable':true, 'tooltip':'The total amount of HITs collected by this job since it was added. May not be changed by user.'}
    ], theTable, theData, true);
    theTable = null;
  }
  /** Disables the create button by setting disable property to true and add disabled class.
   * @param {object} theButton - Jquery Element */
  disableCreateButton(theButton) { theButton.prop('disabled', true).addClass('pcm-disabled'); }
  /** Enables the create button by setting disable property to false and removing disabled class.
   * @param {object} theButton - Jquery Element */
  enableCreateButton(theButton) { theButton.prop('disabled', false).removeClass('pcm-disabled'); }
  /** Disables the to search button by setting disable property to true and add disabled class.
   * @param {object} modalB - Jquery Element */
  disableToSearchButton(modalB) { modalB.find('.toSearchUI > input').prop('disabled', true); modalB.find('.toSearchUI').addClass('pcm-disabled'); }
  /** Enables the to search button by setting disable property to false and removing disabled class.
   * @param {object} modalB - Jquery Element */
  enableToSearchButton(modalB) { modalB.find('.toSearchUI > input').prop('disabled', false); modalB.find('.toSearchUI').removeClass('pcm-disabled'); }
  /** Rechecks HIT data to disable or enable the create search buttons.
   * @param {object} modalB - Jquery Element  @param {object} data - Data of HIT */
  recheckButtons(modalB, data) {
    let toUI = Number(modalB.find(`input[name='toUI']:checked`).val());
    if (!data.groupId || (toUI === 0 && bgPanda.searchesGroupIds.hasOwnProperty(data.groupId)) ||
      (toUI === 1 && (!bgSearch.isSearchUI() || bgSearch.is('gid', data.groupId, true)))) this.disableCreateButton(modalB.find(`.pcm-createGidJob`));
    else this.enableCreateButton(modalB.find(`.pcm-createGidJob`));
    if (!data.reqId || (toUI === 0 && bgPanda.searchesReqIds.hasOwnProperty(data.reqId)) ||
      (toUI === 1 && (!bgSearch.isSearchUI() || bgSearch.is('rid', data.reqId, true)))) this.disableCreateButton(modalB.find(`.pcm-createRidJob`));
    else this.enableCreateButton(modalB.find(`.pcm-createRidJob`));
    if (!bgSearch.isSearchUI()) { modalB.find(`.pcm-toPandaUI > input`).prop('checked', true); this.disableToSearchButton(modalB); } else this.enableToSearchButton(modalB);
  }
  /** This will create a search job and show a dialog to user if successful or show an error.
   * @async                 - To wait for creation of search job.
   * @param {object} modalB - Jquery Element  @param {number} myId - Unique Number  @param {string} type - HIT Type  @param {object} data - HIT data */
  async createSearch(modalB, myId, type, data) {
    let toUI = Number(modalB.find(`input[name='toUI']:checked`).val()), result = null;
    if (toUI === 0) result = await bgPanda.copyToSearchJob(myId, type);
    else result = bgPanda.createSearchTrigger(myId, type);
    if (result) modal.showDialogModal('700px', 'Search Job Created!', 'Search Job has been created successfully.', null , false, false,_,_,_,_, () => { this.recheckButtons(modalB, data); });
    else modal.showDialogModal('700px', 'Search Job NOT Created!', 'Error creating search job. Maybe it was created before?', null , false, false);
  }
  /** Will enable or disable search buttons according to the HIT status.
   * @param {bool} [status] - The status of the HIT for search buttons. */
  searchUIConnect(status=true) {
    if (status) { this.enableToSearchButton($(`.modal-body`)); this.recheckSMoveButtons($(`.modal-body`)); }
    else { $(`.pcm-toPandaUI > input`).prop('checked', true); this.disableToSearchButton($(`.modal-body`)); this.disableCreateButton($(`.modal-body .pcm-toSearchUI`)); }
  }
  /** Rechecks the search move buttons for HIT.
   * @param {object} modalB - Jquery Element */
  recheckSMoveButtons(modalB) {
    let button = modalB.find(`.pcm-toSearchUI`), search = button.data('search'), value = button.data('value');
    if (!bgSearch.isSearchUI() || bgSearch.is(search, value, true)) this.disableCreateButton(modalB.find(`.pcm-toSearchUI`));
    else this.enableCreateButton(modalB.find(`.pcm-toSearchUI`));
    button = null;
  }
  /** This will move the search job to the searchUI and will show a dialog if successful.
   * @param {number} dbId - Database ID  @param {number} myId - Unique ID */
  moveToSearch(dbId, myId) {
    if (!modal) modal = new ModalClass();
    modal.showDialogModal('700px', 'Moving search job to search UI.', 'Do you really want to move this search job to a search trigger on search UI?<br>Any changes you made here for this job will not be saved.', async () => {
      let enabled = pandaUI.pandaStats[myId].searching || pandaUI.pandaStats[myId].collecting;
      await pandaUI.stopCollecting(myId, 'manual'); pandaUI.searchDisabled(myId); modal.closeModal();
      let result = await bgSearch.moveToSearch(dbId, enabled);
      if (result) {
        modal.closeModal();
        pandaUI.removeJob(myId, () => {
          if (!modal) modal = new ModalClass();
          modal.showDialogModal('700px', 'Search trigger created', 'The search job has been moved to the search UI successfully.',_,_, true,_,_,_, (idName) => {
            let checkboxDiv = $(`<div class='pcm-autoSearchUI small'></div>`).appendTo(`#${idName} .${modal.classModalBody}`);
            createCheckBox(checkboxDiv, 'Search job buttons should create search UI triggers by default.', 'searchUITriggers', 'autoSearchUI', globalOpt.theToSearchUI());
            checkboxDiv = null;
          }, () => { globalOpt.theToSearchUI($(`#searchUITriggers`).prop('checked')); },_, 'OK');
        });
      }
    }, true, true,_,_,_,_, () => {});
  }
  /** This will set up the changes and save it to the search database.
   * @async                  - To wait for search options to be saved.
   * @param {object} changes - Data Options  @param {object} sChanges - Search Data Options */
  async searchOptionsChanged(changes, sChanges) {
    let sOptions = sChanges.options;
    changes = Object.assign(changes, {'acceptLimit':sOptions.acceptLimit, 'autoGoHam':sOptions.autoGoHam, 'duration':sOptions.duration, 'limitFetches':sOptions.limitFetches, 'limitNumQueue':sOptions.limitNumQueue, 'limitTotalQueue':sOptions.limitTotalQueue, 'once':sOptions.once});
    await bgSearch.optionsChanged(sChanges, sChanges.searchDbId); sOptions = null;
  }
  /** Shows the modal for users to change the details of the HIT job with the unique ID.
   * @async                - To wait for the data to be loaded from the database.
   * @param  {number} myId - Unique ID  @param  {function} [successFunc] - Save Function  @param  {function} [afterClose]  - After Close function */
  async showDetailsModal(myId, successFunc=null, afterClose=null) {
    await bgPanda.getDbData(myId);
    let hitInfo = bgPanda.options(myId), searchChanges = {};
    let saveFunction = async changes => {
      if (!hitInfo.data) { await bgPanda.getDbData(myId); }
      if (hitInfo.search) await this.searchOptionsChanged(changes, searchChanges);
      changes.mute = hitInfo.data.mute; changes.disabled = (changes.disabled) ? changes.disabled : false;
      hitInfo.data = Object.assign(hitInfo.data, changes); bgPanda.timerDuration(myId);
      await bgPanda.updateDbData(myId, hitInfo.data); hitInfo.disabled = changes.disabled;
      pandaUI.cards.updateAllCardInfo(myId, hitInfo); pandaUI.logTabs.updateLogStatus(null, myId, 0, hitInfo.data); modal.closeModal();
      if (hitInfo.skipped) bgPanda.checkSkipped(myId, hitInfo.data);
      if (!pandaUI.pandaStats[myId].collecting) hitInfo.data = null;
      if (successFunc!==null) successFunc(changes);
    }
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(hitInfo.data, '800px', 'pcm-jobDetailsModal', 'modal-lg', 'Details for a HIT', '', '', '', 'visible btn-sm', 'Save New Details', async (changes) => { saveFunction(changes); }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    modal.showModal(null, async () => {
      let df = document.createDocumentFragment(), df2 = document.createDocumentFragment(), df3 = document.createDocumentFragment(), ridDisabled = false;
      let detailsDiv = $(`<div id='pcm-modalBody'></div>`).appendTo(`#${idName} .${modal.classModalBody}`);
      let detailsTabs = new TabbedClass(detailsDiv, `pcm-detailTabs`, `pcm-tabbedDetails`, `pcm-detailsContents`, false, 'Srch');
      let [, err] = await detailsTabs.prepare();
      if (!err) {
        let optionTab = await detailsTabs.addTab(`${(hitInfo.search) ? 'Search' : 'Panda'} Options`, true);
        let optionsContents = $(`<div class='pcm-optionCont card-deck'></div>`).appendTo(`#${optionTab.tabContent}`);
        if (hitInfo.search) {
          let optionTab1 = await detailsTabs.addTab(`Panda Job Options`), optionContents1 = $(`<div class='pcm-detailsCont card-deck'></div>`).appendTo(`#${optionTab1.tabContent}`);
          this.modalSearch = new ModalSearchClass(); searchChanges = await this.modalSearch.fillInData(null, hitInfo.data.id);
          this.modalSearch.triggerOptions(df, searchChanges, false); ridDisabled = true;
          this.modalSearch.triggerPandaOptions(df2, searchChanges, false); optionContents1.append(df2);
          optionTab1 = null;
        } else this.pandaOptions(df, modal.tempObject[idName]);
        let detailTab = await detailsTabs.addTab(`${(hitInfo.search) ? 'Search' : 'Panda'} Details`);
        let detailsContents = $(`<div class='pcm-detailsCont card-deck'></div>`).appendTo(`#${detailTab.tabContent}`);
        this.pandaDetails(df3, modal.tempObject[idName], ridDisabled);
        optionsContents.append(df); detailsContents.append(df3);
        let muteText = (hitInfo.data.mute) ? 'Unmute Job Alarms' : 'Mute Job Alarms';
        $(`<div class='pcm-detailsBtnArea1 w-100'></div>`).append(`<button class='btn btn-xs pcm-muteJob'>${muteText}</button> <button class='btn btn-xs pcm-deleteJob'>Delete Job</button>`).appendTo(detailsDiv);
        if (!hitInfo.search) {
          let radioGroup = $(`<span class='pcm-uiGroup'></span>`);
          radioButtons(radioGroup, 'toUI', '0', 'Panda UI', true, 'pcm-toPandaUI'); radioButtons(radioGroup, 'toUI', '1', 'Search UI', false, 'toSearchUI');
          $(`<div class='pcm-detailsBtnArea2 w-100'></div>`).append(`<button class='btn btn-xs pcm-createGidJob'>Create Gid Search Job</button> <button class='btn btn-xs pcm-createRidJob'>Create Rid Search Job</button> - To: `).append(radioGroup).appendTo(detailsDiv);
          this.recheckButtons(detailsDiv, hitInfo.data);
          detailsDiv.find(`.pcm-createGidJob`).click( async () => { this.createSearch($(`#${idName} .${modal.classModalBody}`), myId, 'gid', hitInfo.data); });
          detailsDiv.find(`.pcm-createRidJob`).click( async () => { this.createSearch($(`#${idName} .${modal.classModalBody}`), myId, 'rid', hitInfo.data); });
          detailsDiv.find(`input[name='toUI']`).on('change', () => { this.recheckButtons($(`#${idName} .${modal.classModalBody}`), hitInfo.data); });
          radioGroup = null;
        } else {
          let value = (hitInfo.search === 'gid') ? hitInfo.data.groupId : hitInfo.data.reqId;
          $(`<div class='pcm-detailsBtnArea2 w-100'></div>`).append($(`<button class='btn btn-xs pcm-toSearchUI'>Move to searchUI and create search trigger</button>`)
            .data('search',hitInfo.search).data('value',value)).appendTo(detailsDiv);
          this.recheckSMoveButtons(detailsDiv);
          detailsDiv.find(`.pcm-toSearchUI`).click( async () => { this.moveToSearch(hitInfo.dbId, myId); });
        }
        detailsDiv.find(`.pcm-muteJob`).click( async () => {
          hitInfo.data.mute = !hitInfo.data.mute; muteText = (hitInfo.data.mute) ? 'Unmute Job Alarms' : 'Mute Job Alarms';
          $(`button.pcm-muteJob`).text(muteText); await bgPanda.updateDbData(myId, hitInfo.data); pandaUI.pandaMute(myId, hitInfo.data.mute);
        });
        detailsDiv.find(`.pcm-deleteJob`).click( async () => { pandaUI.removeJobs([myId], (response) => { if (response === 'YES') { modal.closeModal(); } }, 'manual', () => {}); });
        $(`#${detailsTabs.ulId} .nav-item`).click( () => { $(`#${idName}`).focus(); } )
        $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunction(modal.tempObject[idName]); });
        optionTab = null; optionsContents = null; detailTab = null; detailsContents = null;
      }
      pandaUI.resetToolTips(globalOpt.doGeneral().showHelpTooltips);
      df = null; df2 = null, df3 = null; detailsDiv = null; detailsTabs = null;
    }, () => { if (afterClose) afterClose(); else modal = null; this.modalSearch = null; });
  }
  /** Shows a modal for adding panda or search jobs.
   * @param  {function} [afterClose] - Function to call after the modal is closed. */
  showJobAddModal(afterClose=null) {
    /** Verifies that the groupID inputted is correct. */
    let checkGroupID = (idName) => {
      let groupVal = $('#pcm-formAddGroupID').val(), theBody = $(`#${idName} .${modal.classModalBody}`);
      if (groupVal === '') {
        $(`label[for='pcm-formAddGroupID']`).addClass('pcm-inputError');
        theBody.find('.pcm-checkStatus.pcm-inputError').html('Must Fill in GroupID or URL!').data('gIdEmpty',true);
      } else if (testGidRid(groupVal)) {
        let groupId = null, reqId = null, reqSearch = false;
        if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal);
        else if (groupVal.match(/^[^Aa]/)) groupId = groupVal;
        else { reqId = groupVal; reqSearch = true; }
        if (reqId && !reqSearch) { groupId = reqId; reqSearch = true; }
        let title = ($('#pcm-formAddTitle').val()) ? $('#pcm-formAddTitle').val() : groupId, reqName = ($('#pcm-formReqName').val()) ? $('#pcm-formReqName').val() : groupId;
        let desc = ($('#pcm-formAddDesc').val()) ? $('#pcm-formAddDesc').val() : groupId, pay = ($('#pcm-formAddPay').val()) ? $('#pcm-formAddPay').val() : '0.00';
        let startNow = $('#pcm-startCollecting').is(':checked'), once = $('#pcm-onlyOnce').is(':checked');
        if (groupId && bgPanda.pandaGroupIds.hasOwnProperty(groupId) && !$('#pcm-formAddGroupID').data('gIdDup')) {
          $(`label[for='pcm-formAddGroupID']`).removeClass('pcm-inputError'); $('#pcm-formAddGroupID').data('gIdDup',true);
          theBody.find('.pcm-checkStatus.pcm-inputError').html('GroupID already added. Still want to add?');
          $('.modal-footer .pcm-modalSave:first').html('YES! Add new Panda Info');
        } else if ( (groupId && !reqSearch) || reqId) {
          title = (reqId) ? '--( Requester ID Search )--' : title;
          if (!reqName) reqName = reqId;
          let search = (reqId) ? 'rid' : ((groupId && $('#pcm-searchJob').is(':checked')) ? 'gid' : null);
          let data = dataObject(groupId, desc, title, reqId, reqName, pay,_,_,_);
          let opt = optObject(once, search,_,_,_,_, (search === 'gid') ? globalOpt.theSearchDuration() : 0,_, (search) ? 0 : globalOpt.getHamDelayTimer());
          pandaUI.addPanda(data, opt, false, startNow,_,_, (search) ? 0 : globalOpt.getHamDelayTimer());
          modal.closeModal();
        } else {
          $(`label[for='pcm-formAddGroupID']`).addClass('pcm-inputError');
          theBody.find('.pcm-checkStatus.pcm-inputError').html('Invalid Group ID or URL').data('gIdInvalid',true);
        }
      } else {
        $(`label[for='pcm-formAddGroupID']`).addClass('pcm-inputError');
        theBody.find('.pcm-checkStatus.pcm-inputError').html('Invalid Group ID or URL').data('gIdInvalid',true);
      }
      pandaUI.resetToolTips(globalOpt.doGeneral().showHelpTooltips);
      theBody = null;
    }
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(null, '920px', 'pcm-addJobsModal', 'modal-lg', 'Add new Panda Info', '<h4>Enter New Panda Information.</h4>', '', '', 'visible btn-sm', 'Add new Panda Info', () => { checkGroupID(idName); }, 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    modal.showModal(null, () => {
      let df = document.createDocumentFragment();
      $(`<div><div class='pcm-checkStatus pcm-inputError'></div><div class='pcm-myInfo'>Enter a Group ID, Requester ID, Preview URL or Accept URL.</div></div>`).appendTo(df);
      createInput(df, ' pcm-inputDiv-url', 'pcm-formAddGroupID', '* Enter info for new Job: ', 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY',_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Group ID, Requester ID, Preview URL or Accept URL. This is a required input.');
      createCheckBox(df, 'Start Collecting', 'pcm-startCollecting', '', true,_,_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Start to collect after job is added.');
      createCheckBox(df, 'Collect Only Once', 'pcm-onlyOnce', '', false,_,_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Only allow one HIT to be collected and then stop collecting.');
      createCheckBox(df, 'Search Job', 'pcm-searchJob', '', false,_,_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Create a search GID or RID search job instead of a normal panda job.');
      createInput(df, 'pcm-topBorder', 'pcm-formReqName', 'Requester Name: ', 'default: group ID shown',_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Optional Field. Enter in Requester Name if known. Will be replaced when the HIT is found.');
      createInput(df, 'pcm-tooltipData pcm-tooltipHelper', 'pcm-formAddReqID', 'Requester ID: ', 'example: AGVV5AWLJY7H2',_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Optional Field. Enter in Requester ID if known. Will be replaced when the HIT is found.');
      createInput(df, 'pcm-tooltipData pcm-tooltipHelper', 'pcm-formAddTitle', 'Title: ', 'default: group ID shown',_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Optional Field. Enter in the title of the HIT if known. Will be replaced when the HIT is found.');
      createInput(df, 'pcm-tooltipData pcm-tooltipHelper', 'pcm-formAddDesc', 'Description: ', 'default: group ID shown',_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Optional Field. Enter in the description of the HIT if known. Will be replaced when the HIT is found.');
      createInput(df, 'pcm-tooltipData pcm-tooltipHelper', 'pcm-formAddPay', 'Pay Amount: ', 'default: 0.00',_, ' pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Optional Field. Enter in the pay reward of the HIT if known. Will be replaced when the HIT is found.');
      let modalBody = $(`#${idName} .${modal.classModalBody}`);
      modalBody.append(df);
      modalBody.find('.pcm-inputText-md').keypress( e => { if((e.keyCode ? e.keyCode : e.which) == '13') checkGroupID(idName); });
      $('#pcm-formAddGroupID').on('input', e => {
        let theDialog = $(`#${idName} .${modal.classModalDialog}`)
        if (!$(e.target).data('gIdDup')) return;
        $(e.target).data('gIdDup',false); theDialog.find('.modal-footer .pcm-modalSave:first').html('Add new Panda Info');
        theDialog.find(`.pcm-checkStatus.pcm-inputError`).html(''); theDialog = null;
      });
      $('#pcm-startCollecting').click( () => $('#pcm-formAddGroupID').focus() ); $('#pcm-onlyOnce').click( () => $('#pcm-formAddGroupID').focus() );
      $('#pcm-formAddGroupID').focus();
      df = null; modalBody = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Show jobs in a table with a checkbox, collect button and details button.
   * @async                     - To load in the data object if needed.
   * @param  {object} modalBody - Jquery Element  @param  {array} jobs - Jobs Array  @param  {string} type - job Type @param  {function} [checkboxFunc] - Checkbox Function
   * @param  {function} [afterClose] - After Close Function */
  async showJobsTable(modalBody, jobs, type, checkboxFunc=null, afterClose=null) {
    let divContainer = $(`<table class='table table-dark table-sm table-moreCondensed pcm-jobTable table-bordered w-auto'></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      {'string':'', 'type':'checkbox', 'btnFunc': e => { $(`.modal-body input[type='checkbox']`).prop('checked', $(e.target).is(':checked')); }, 'tooltip':'Click here to select all jobs displayed.'},
      {'string':'Requester Name', 'type':'string', 'noBorder':false}, {'string':'HIT Title', 'type':'string', 'noBorder':true}, {'string':'Pay', 'type':'string', 'noBorder':true},
      {'string':' ', 'type':'string'}, {'string':' ', 'type':'string'}
    ], divContainer, bgPanda.info, true, true, true, 'pcm-jobsListHeader');
    for (const myId of jobs) {
      let status = (pandaUI.pandaStats[myId].collecting) ? 'On' : 'Off', data = await bgPanda.dataObj(myId);
      displayObjectData([
        {'string':'', 'type':'checkbox', 'width':'25px', 'maxWidth':'25px', 'unique':myId, 'inputClass':' pcm-checkbox', 'btnFunc':checkboxFunc, 'tooltip':'Click here to select this job.'},
        {'string':'Requester Name', 'type':'keyValue', 'key':'reqName', 'orKey':'friendlyReqName', 'width':'220px', 'maxWidth':'220px', id:`pcm-RQN-${myId}`},
        {'string':'HIT Title', 'type':'keyValue', 'key':'title', 'orKey':'friendlyTitle', 'width':'550px', 'maxWidth':'550px', 'id':`pcm-TTL-${myId}`},
        {'string':'Pay', 'type':'keyValue', 'key':'price', 'width':'45px', 'maxWidth':'45px', 'money':true, 'id':`pcm-Pay-${myId}`, 'pre':'$'},
        {'btnLabel':'Collect', 'type':'button', 'addClass':` btn-xxs pcm-collectButton pcm-button${status}`, 'idStart':'pcm-collectButton2', 'width':'62px', 'maxWidth':'62px', 'unique':myId, 'btnFunc': e => { $(`#pcm-collectButton-${e.data.unique}`).click(); }, 'skip':(type === 'groupingEdit'), 'tooltip': 'Start Collecting this Panda HIT'},
        {'btnLabel':'Details', 'type':'button', 'addClass':' btn-xxs', 'idStart':'pcm-detailsButton2', 'width':'62px', 'maxWidth':'62px', 'unique':myId, 'btnFunc': e => { 
            const myId = e.data.unique;
            this.showDetailsModal( myId, (changes) => {
              $(`#pcm-RQN-${myId}`).text( (changes.friendlyReqName!=='') ? changes.friendlyReqName : changes.reqName );
              $(`#pcm-TTL-${myId}`).text( (changes.friendlyTitle!=='') ? changes.friendlyTitle : changes.title );
              $(`#pcm-Pay-${myId}`).text(changes.price);
            }, () => { if (afterClose) afterClose(); });
          }, 'tooltip':'Display and edit all options for this Panda.'}
      ], divContainer, data, true, true,_,_, `pcm-jobRow-${myId}`);
    }
    divContainer = null;
  }
  /** Filters out jobs with the search term, collecting radio, search mode and once options.
   * @async                  - To load in search data.
   * @param  {string} search - Search Term   @param  {object} modalControl - Jquery Element
   * @return {array}         - Array of ID's filtered */
  async jobsFilter(search, modalControl) {
    let newArray = []; await delay(2);
    for (const myId of bgPanda.pandaUniques) {
      let data = await bgPanda.dataObj(myId), stats = pandaUI.pandaStats[myId], good = false;
      const radioChecked = $(modalControl).find(`input[name='theJobs']:checked`).val();
      if (radioChecked === '0') good = true;
      else if (radioChecked === '1' && stats.collecting) good = true;
      else if (radioChecked === '2' && !stats.collecting) good = true;
      else if (radioChecked === '3' && data.search) good = true;
      else if (radioChecked === '4' && data.once) good = true;
      if (good && search !== '' && (data.title.toLowerCase().includes(search) || data.reqName.toLowerCase().includes(search))) good = true;
      else if (good && search !== '') good = false;
      if (good) newArray.push(myId);
    }
    return newArray;
  }
  /** Shows a modal to list jobs filtered by a search term, collecting, search mode or once options.
   * @param  {string} [type]        - Job Type           @param  {number} [groupUnique]  - Grouping Number     @param  {object} [thisObj]      - Grouping Object
   * @param  {function} [saveFunc]  - Save Function      @param  {function} [checkFunc]  - Checkbox Function   @param  {function} [cancelFunc] - Cancel Function
   * @param  {function} [afterShow] - AfterShow Function @param  {function} [afterClose] - AfterClose Function */
 showJobsModal(type='jobs', groupUnique=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null, afterClose=null) {
    if (!modal) modal = new ModalClass();
    let theTitle = (type==='groupingEdit') ? 'Edit Groupings' : 'List Jobs', saveBtnStatus = (type==='groupingEdit') ? 'visible btn-sm' : 'invisible';
    const idName = modal.prepareModal(thisObj, '1000px', 'pcm-showJobsModal', 'modal-lg', theTitle, '', '', '', saveBtnStatus, 'Save Groupings', saveFunc, 'invisible', 'No', null, 'invisible', 'Close');
    modal.showModal(cancelFunc, async () => {
      let addClass = (type === 'groupingEdit') ? 'pcm-groupingsEditModalBody' : 'pcm-jobsModalBody', df = document.createDocumentFragment();
      $(`#${idName} .${modal.classModalBody}`).addClass(addClass)
      let modalControl = $(`<div class='pcm-modalControl pcm-modalJobControl'></div>`).appendTo(df);
      if (type === 'groupingEdit') {
        $(`<div class='small pcm-selectJobs'></div>`).append('Select the jobs you want in this grouping below:').append(`<span class='pcm-jobsInGroup'>Jobs in Group: ${Object.keys(thisObj.pandas).length}</span>`).appendTo(modalControl);
        if (thisObj.startTime === '') { thisObj.endHours = '0'; thisObj.endMinutes = '0'; }
        createInput(modalControl, '', 'pcm-groupingNameI', 'Grouping Name: ', `default: Grouping #${groupUnique}`, null, '', modal.tempObject[idName].name).append(createTimeInput('Start Time', 'pcm-timepicker1', thisObj.startTime));
        createInput(modalControl, ' border-bottom', 'pcm-groupingDescI', 'Description: ', 'default: no description', null, '', modal.tempObject[idName].description).append(createTimeElapse(thisObj.endHours, thisObj.endMinutes));
      }
      let radioGroup = $(`<div class='pcm-uiGroup'></div>`).appendTo(modalControl);
      radioButtons(radioGroup, 'theJobs', '0', 'All Jobs', true, 'pcm-tooltipData pcm-tooltipHelper', 'Display all jobs in the list below.'); 
      if (type === 'jobs') {
        radioButtons(radioGroup, 'theJobs', '1', 'Collecting',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display Only the jobs currently being collected in the list below.');
        radioButtons(radioGroup, 'theJobs', '2', 'Not Collecting',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display Only the jobs not currently being collected in the list below.');
      }
      radioButtons(radioGroup, 'theJobs', '3', 'Searching Mode',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display only the search jobs in the list below.');
      radioButtons(radioGroup, 'theJobs', '4', 'Only Once',_, 'pcm-tooltipData pcm-tooltipHelper', 'Display the jobs that will only collect one HIT in the list below.');
      let inputControl = createInput(modalControl, '', 'pcm-searchJobs', 'Search phrase: ', 'example: receipts', e => {
        $(e.target).closest('.pcm-modalControl').find('.pcm-searchingJobs').click();
      }, 'pcm-tooltipData pcm-tooltipHelper',_,_,_,_, 'Enter text in the input field to search for in the requester name or HIT title.');
      $(`<button class='btn btn-xxs pcm-searchingJobs pcm-tooltipData pcm-tooltipHelper' data-original-title='Display only the jobs in the list below with the input text in the requester name or HIT title.'>Search</button>`).on( 'click', async () => {
        let theDialog = $(`#${idName} .${modal.classModalDialog}:first`); theDialog.find('.pcm-jobTable').remove();
        await this.jobsFilter($('#pcm-searchJobs').val().toLowerCase(), theDialog.find(`.pcm-modalJobControl:first`)).then( async (filtered) => {
          await this.showJobsTable(theDialog.find(`.${modal.classModalBody}:first`), filtered, type, checkFunc, () => {});
          if (type === 'groupingEdit') Object.keys(groupings.groups[groupUnique].pandas).forEach( (value) => { $(`#pcm-selection-${bgPanda.dbIds[value]}`).prop('checked', true); });
          theDialog = null;
        });
      }).appendTo(inputControl);
      if (type === 'jobs') $(`<button class='btn btn-xxs pcm-deleteSelected pcm-tooltipData pcm-tooltipHelper' data-original-title='Delete all the jobs which are selected in the list below.'>Delete Selected</button>`).click( () => {
        let selected = $(`#${idName} .${modal.classModalDialog}:first`).find('.pcm-checkbox:checked').map((_,element) => Number($(element).val()) ).get();
        if (selected.length) pandaUI.removeJobs(selected, (result, unique) => { if (result !== 'NO') $(`#pcm-jobRow-${unique}`).remove(); }, 'manual', () => { selected = null; });
        else { selected = null; }
      }).appendTo(inputControl);
      $(df).find(`input:radio[name='theJobs']`).click( e => { $(e.target).closest('.pcm-modalControl').find('.pcm-searchingJobs').click(); });
      $(`<div class='pcm-modalControl'></div>`).append(df).insertBefore($(`#${idName} .${modal.classModalBody}`));
      inputControl = null; radioGroup = null; df = null;
      await this.jobsFilter('', modalControl).then( async filtered => {
        let df2 = document.createDocumentFragment();
        await this.showJobsTable(df2, filtered, type, checkFunc, () => {});
        $(df2).appendTo(`#${idName} .${modal.classModalBody}`);
        $(`#pcm-timepicker1`).timepicker({ hourGrid: 4, minuteGrid: 10, timeFormat: 'hh:mm tt' });
        $(`#pcm-timepicker1`).on('change', e => {
          if ($(e.target).val() === '') { $('#pcm-endHours').val('0'); $('#pcm-endMinutes').val('0'); }
          else if ($('#pcm-endHours').val() === '0' && $('#pcm-endMinutes').val() === '0') $('#pcm-endMinutes').val('30');
        });
        $('#pcm-clearTInput').on('click', e => { $('#pcm-timepicker1').val(''); $('#pcm-endHours').val('0'); $('#pcm-endMinutes').val('0'); });
        if (afterShow) afterShow(this);
        df2 = null; modalControl = null;
      });
      pandaUI.resetToolTips(globalOpt.doGeneral().showHelpTooltips);
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
}