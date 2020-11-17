/** This class deals with any showing of modals for jobs.
 * @class ModalJobClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalJobClass {
	constructor() {
    this.pandaDur = {min:0, max:120} // Limits for the panda duration in minutes.
    this.modalSearch = null;
  }
  pandaOptions(appendHere, changes) {
    $(`<div class='pcm-optionsEdit text-center mb-2 unSelectable w-100'>Details of job: All can be edited except details in yellow. Click on the details to edit.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered w-100'></table>`).appendTo(appendHere);
    displayObjectData([
      {'label':'Limit # of GroupID in queue:', 'type':'range', 'key':'limitNumQueue', 'min':0, 'max':24, 'ifNot':'search', 'tooltip':'Limit number of hits in queue by this group ID. Great way to do batches slowly.'},
      {'label':'Limit # of total Hits in queue:', 'type':'range', 'key':'limitTotalQueue', 'min':0, 'max':24, 'ifNot':'search', 'tooltip':'Limit number of hits allowed in queue. Good when you want to leave room in queue for better hits.'},
      {'label':'Accept Only Once:', 'type':'trueFalse', 'key':'once', 'ifNot':'search', 'tooltip':'Should only one hit be accepted and then stop collecting? Great for surveys.'},
      {'label':'Daily Accepted Hit Limit:', 'type':'number', 'key':'acceptLimit', 'default':0, 'ifNot':'search', 'tooltip':'How many hits a day should be accepted for this job?'},
      {'label':'Stop Collecting After (minutes):', 'type':'number', 'key':'duration', 'minutes':true, 'default':0, 'ifNot':'search', 'tooltip':'The number of minutes for this job to collect before stopping. Resets time if a hit gets collected.', 'minMax':this.pandaDur},
      {'label':'Stop Collecting After # of fetches:', 'type':'number', 'key':'limitFetches', 'default':0, 'ifNot':'search', 'tooltip':'Number of tries to catch a hit to do before stopping.'},
      {'label':'Force Delayed Ham on Collect:', 'type':'trueFalse', 'key':'autoGoHam', 'ifNot':'search', 'tooltip':'Should this job go ham when it finds a hit and then runs for delayed ham duration in milliseconds before it goes back to normal collecting mode?'},
      {'label':'Force Delayed Ham Duration (seconds):', 'type':'number', 'key':'hamDuration', 'seconds':true, 'default':0, 'ifNot':'search', 'tooltip':'The duration in seconds to use to go in ham mode after collecting a hit and then go back to normal collecting mode.', 'minMax':this.pandaDur},
      {'label':'Friendly Requester Name:', 'type':'text', 'key':'friendlyReqName', 'tooltip':'A user created requester name to make the name shorter or easier to remember.'},
      {'label':'Friendly Hit Title:', 'type':'text', 'key':'friendlyTitle', 'tooltip':'A user created hit title to make the title shorter or easier to remember what it is.'},
    ], theTable, changes, true);
  }
  pandaDetails(appendHere, changes, ridDisabled=false) {
    $(`<div class='pcm-detailsEdit text-center mb-2 unSelectable w-100'>Details of job: All can be edited except details in yellow. Click on the details to edit.</div>`).appendTo(appendHere);
    let theTable = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered w-100'></table>`).appendTo(appendHere);
    let ridDisableTip = (ridDisabled) ? ' May not be changed by user.' : '';
    displayObjectData([
      {'label':'Requester ID', 'type':'text', 'key':'reqId', 'disable':ridDisabled, 'tooltip':`The requester ID for this job.${ridDisableTip}`},
      {'label':'Requester Name:', 'type':'text', 'key':'reqName', 'disable':true, 'tooltip':'The requester name for this job. May not be changed by user.'},
      {'label':'Group ID', 'type':'text', 'key':'groupId', 'disable':true, 'tooltip':'The group ID for this job. May have multiple group ID jobs if wanted. May not be changed by user.'},
      {'label':'Title', 'type':'text', 'key':'title', 'disable':true, 'tooltip':'The title for this job. May not be changed by user.'},
      {'label':'Description', 'type':'text', 'key':'description', 'disable':true, 'tooltip':'The description for this job. May not be changed by user.'},
      {'label':'Price', 'type':'text', 'key':'price', 'money':true, 'disable':true, 'tooltip':'The payment reward for this job. May not be changed by user.'},
      {'label':'Assigned Time', 'type':'text', 'key':'assignedTime', 'disable':true, 'tooltip':'The assigned time in seconds that this has before expiration. May not be changed by user.'},
      {'label':'Expires', 'type':'text', 'key':'expires', 'disable':true, 'tooltip':'The day and time which this hit will no longer be on mturk. May not be changed by user.'},
      {'label':'Date Added', 'type':'string', 'key':'dateAdded', 'disable':true, 'format':'date', 'tooltip':'The date which this hit was added to PandaCrazy Max. May not be changed by user.'},
      {'label':'Total Seconds Collecting', 'type':'text', 'key':'totalSeconds', 'disable':true, 'tooltip':'The total amount of seconds which this job has tried to collect hits since it was added. May not be changed by user.'},
      {'label':'Total Accepted Hits', 'type':'text', 'key':'totalAccepted', 'disable':true, 'tooltip':'The total amount of hits collected by this job since it was added. May not be changed by user.'}
    ], theTable, changes, true);
  }
  disableCreateButton(theButton) { theButton.prop('disabled', true).css('text-decoration', 'line-through'); }
  enableCreateButton(theButton) { theButton.prop('disabled', false).css('text-decoration', 'none'); }
  disableToSearchButton(modalB) { modalB.find('.toSearchUI > input').prop('disabled', true); modalB.find('.toSearchUI').css('text-decoration', 'line-through'); }
  enableToSearchButton(modalB) { modalB.find('.toSearchUI > input').prop('disabled', false); modalB.find('.toSearchUI').css('text-decoration', 'none'); }
  recheckButtons(modalB, data) {
    let toUI = Number(modalB.find(`input[name='toUI']:checked`).val());
    if (!data.groupId || (toUI === 0 && bgPanda.searchesGroupIds.hasOwnProperty(data.groupId)) ||
      (toUI === 1 && (!bgSearch.isSearchUI() || bgSearch.is('gid', data.groupId, true)))) this.disableCreateButton(modalB.find(`.pcm-createGidJob`));
    else this.enableCreateButton(modalB.find(`.pcm-createGidJob`));
    if (!data.reqId || (toUI === 0 && bgPanda.searchesReqIds.hasOwnProperty(data.reqId)) ||
      (toUI === 1 && (!bgSearch.isSearchUI() || bgSearch.is('rid', data.reqId, true)))) this.disableCreateButton(modalB.find(`.pcm-createRidJob`));
    else this.enableCreateButton(modalB.find(`.pcm-createRidJob`));
    if (!bgSearch.isSearchUI()) { modalB.find(`.toPandaUI > input`).prop('checked', true); this.disableToSearchButton(modalB); } else this.enableToSearchButton(modalB);
  }
  async createSearch(modalB, myId, type, data) {
    let toUI = Number(modalB.find(`input[name='toUI']:checked`).val()), result = null;
    if (toUI === 0) result = await bgPanda.copyToSearchJob(myId, type);
    else result = bgPanda.createSearchTrigger(myId, type);
    if (result) modal.showDialogModal("700px", "Search Job Created!", "Search Job has been created successfully.", null , false, false,_,_,_,_, () => { this.recheckButtons(modalB, data); });
    else modal.showDialogModal("700px", "Search Job NOT Created!", "Error creating search job. Maybe it was created before?", null , false, false);
  }
  searchUIConnect(status=true) {
    if (status) { this.enableToSearchButton($(`.modal-body`)); this.recheckSMoveButtons($(`.modal-body`)); }
    else { $(`.toPandaUI > input`).prop('checked', true); this.disableToSearchButton($(`.modal-body`)); this.disableCreateButton($(`.modal-body .pcm-toSearchUI`)); }
  }
  recheckSMoveButtons(modalB) {
    let button = modalB.find(`.pcm-toSearchUI`), search = button.data('search'), value = button.data('value');
    if (!bgSearch.isSearchUI() || bgSearch.is(search, value, true)) this.disableCreateButton(modalB.find(`.pcm-toSearchUI`));
    else this.enableCreateButton(modalB.find(`.pcm-toSearchUI`));
  }
  moveToSearch(dbId, myId) {
    modal.showDialogModal("700px", "Moving search job to search UI.", "Do you really want to move this search job to a search trigger on search UI?<br>Any changes you made here for this job will not be saved.", async () => {
      let enabled = pandaUI.pandaStats[myId].searching || pandaUI.pandaStats[myId].collecting;
      await pandaUI.stopCollecting(myId, 'manual'); pandaUI.searchDisabled(myId); modal.closeModal();
      let result = await bgSearch.moveToSearch(dbId, enabled);
      if (result) {
        modal.closeModal();
        pandaUI.removeJob(myId, () => {
          if (!modal) modal = new ModalClass();
          modal.showDialogModal("700px", "Search trigger created", "The search job has been moved to the search UI successfully.",_,_, true,_,_,_, (idName) => {
            const modalBody = $(`#${idName} .${modal.classModalBody}`);
            let checkboxDiv = $(`<div class='pcm-autoSearchUI my-2 small text-primary'></div>`).appendTo(modalBody);
            createCheckBox(checkboxDiv, 'Search job buttons should create search UI triggers by default.', 'searchUITriggers', 'autoSearchUI', globalOpt.theToSearchUI());
          }, () => {
            globalOpt.theToSearchUI($(`#searchUITriggers`).prop('checked'));
          },_, 'OK');
        });
      }
    }, true, true,_,_,_,_, () => {});
  }
  async searchOptionsChanged(changes, sChanges) {
    let sOptions = sChanges.options;
    changes = Object.assign(changes, {'acceptLimit':sOptions.acceptLimit, 'autoGoHam':sOptions.autoGoHam, 'duration':sOptions.duration, 'limitFetches':sOptions.limitFetches, 'limitNumQueue':sOptions.limitNumQueue, 'limitTotalQueue':sOptions.limitTotalQueue, 'once':sOptions.once});
    sChanges = Object.assign(sChanges,)
    await bgSearch.optionsChanged(sChanges, sChanges.searchDbId);
  }
  /** Shows the modal for users to change the details of the hit job with the unique ID.
   * @async                - To wait for the data to be loaded from the database.
   * @param  {number} myId - Unique ID @param  {function} [successFunc=null] - Save Function @param  {function} [afterClose=null]  - Close function */
  async showDetailsModal(myId, successFunc=null, afterClose=null) {
    await bgPanda.getDbData(myId);
    let hitInfo = bgPanda.options(myId);
    let searchChanges = {'details':null, 'rules':null, 'options':null, 'searchDbId':null};
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(hitInfo.data, "800px", "modal-header-info modal-lg", "Details for a hit", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save New Details", async (changes) => {
      if (!hitInfo.data) { await bgPanda.getDbData(myId); }
      if (hitInfo.search) await this.searchOptionsChanged(changes, searchChanges);
      changes.mute = hitInfo.data.mute; // Makes sure mute button changes will be saved.
      changes.disabled = (changes.disabled) ? changes.disabled : false;
      hitInfo.data = Object.assign(hitInfo.data, changes); bgPanda.timerDuration(myId);
      await bgPanda.updateDbData(myId, hitInfo.data); hitInfo.disabled = changes.disabled;
      pandaUI.cards.updateAllCardInfo(myId, hitInfo);
      pandaUI.logTabs.updateLogStatus(null, myId, 0, hitInfo.data);
      modal.closeModal();
      if (hitInfo.skipped) bgPanda.checkSkipped(myId, hitInfo.data);
      if (!pandaUI.pandaStats[myId].collecting) hitInfo.data = null;
      if (successFunc!==null) successFunc(changes);
    }, "invisible", "No", null, "visible btn-sm", "Cancel");
    const modalBody = $(`#${idName} .${modal.classModalBody}`); modalBody.css({'padding':'1rem 0.3rem'});
    modal.showModal(null, async () => {
      let df = document.createDocumentFragment(), df2 = document.createDocumentFragment(), detailsContents = null, optionsContents = null, ridDisabled = false;
      let detailsDiv = $(`<div id='pcm-jobDetails' class='bg-dark'></div>`).appendTo(modalBody);
      let detailsTabs = new TabbedClass(detailsDiv, `pcm-detailTabs`, `pcm-tabbedDetails`, `pcm-detailsContents`, false, 'Srch');
      let [_, err] = await detailsTabs.prepare();
      if (!err) {
        let optionTab = await detailsTabs.addTab(`${(hitInfo.search) ? 'Search' : 'Panda'} Options`, true);
        optionsContents = $(`<div class='pcm-optionCont card-deck'></div>`).appendTo(`#${optionTab.tabContent}`);
        let detailTab = await detailsTabs.addTab(`${(hitInfo.search) ? 'Search' : 'Panda'} Details`);
        detailsContents = $(`<div class='pcm-detailsCont card-deck'></div>`).appendTo(`#${detailTab.tabContent}`);
        if (hitInfo.search) { this.modalSearch = new ModalSearchClass(); await this.modalSearch.triggerOptions(df, null, hitInfo.data.id, searchChanges); ridDisabled = true; }
        else this.pandaOptions(df, modal.tempObject[idName]);
        this.pandaDetails(df2, modal.tempObject[idName], ridDisabled);
        optionsContents.append(df); detailsContents.append(df2);
        let muteText = (hitInfo.data.mute) ? 'Unmute Job Alarms' : 'Mute Job Alarms';
        $(`<div class='mt-1 text-center w-100'></div>`).append(`<button class='btn btn-info btn-xs pcm-muteJob'>${muteText}</button> <button class='btn btn-info btn-xs pcm-deleteJob'>Delete Job</button>`).appendTo(detailsDiv);
        if (!hitInfo.search) {
          let radioGroup = $(`<span class='uiGroup'></span>`);
          radioButtons(radioGroup, 'toUI', '0', 'Panda UI', true, 'toPandaUI'); radioButtons(radioGroup, 'toUI', '1', 'Search UI', false, 'toSearchUI');
          $(`<div class='mb-2 text-center w-100'></div>`).append(`<button class='btn btn-info btn-xs pcm-createGidJob'>Create Gid Search Job</button> <button class='btn btn-info btn-xs pcm-createRidJob'>Create Rid Search Job</button> - To: `).append(radioGroup).appendTo(detailsDiv);
          this.recheckButtons(modalBody, hitInfo.data);
          modalBody.find(`.pcm-createGidJob`).click( async () => { this.createSearch(modalBody, myId, 'gid', hitInfo.data); });
          modalBody.find(`.pcm-createRidJob`).click( async () => { this.createSearch(modalBody, myId, 'rid', hitInfo.data); });
          modalBody.find(`input[name='toUI']`).on('change', (e) => { this.recheckButtons(modalBody, hitInfo.data); })
        } else {
          let value = (hitInfo.search === 'gid') ? hitInfo.data.groupId : hitInfo.data.reqId;
          $(`<div class='my-1 text-center w-100'></div>`).append($(`<button class='btn btn-info btn-xs pcm-toSearchUI'>Move to searchUI and create search trigger</button>`)
            .data('search',hitInfo.search).data('value',value)).appendTo(detailsDiv);
          this.recheckSMoveButtons(modalBody);
          modalBody.find(`.pcm-toSearchUI`).click( async () => { this.moveToSearch(hitInfo.dbId, myId); });
        }
        modalBody.find(`.pcm-muteJob`).click( async () => {
          hitInfo.data.mute = !hitInfo.data.mute; muteText = (hitInfo.data.mute) ? 'Unmute Job Alarms' : 'Mute Job Alarms';
          $(`button.pcm-muteJob`).text(muteText); await bgPanda.updateDbData(myId, hitInfo.data); pandaUI.pandaMute(myId, hitInfo.data.mute);
        });
        modalBody.find(`.pcm-deleteJob`).click( async () => { pandaUI.removeJobs([myId], (response) => { if (response === 'YES') { modal.closeModal(); } }, 'manual', () => {}); });
      }
    }, () => { if (afterClose) afterClose(); else modal = null; this.modalSearch = null; });
  }
  /** Shows a modal for adding panda or search jobs.
   * @param  {function} [afterClose=null]  - Function to call after the modal is closed. */
  showJobAddModal(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(null, '920px', 'modal-header-info modal-lg', 'Add new Panda Info', '<h4>Enter New Panda Information.</h4>', 'text-right bg-dark text-light', 'modal-footer-info', 'visible btn-sm', 'Add new Panda Info', checkGroupID.bind(this), 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    let df = document.createDocumentFragment();
    const div = $(`<div><div class='pcm-inputError'></div><div style='color:aqua'>Enter a Group ID, Requester ID, Preview URL or accept URL.</div></div>`).appendTo(df);
    createInput(df, ' pcm-inputDiv-url', 'pcm-formAddGroupID', '* Enter info for new Job: ', 'example: 3SHL2XNU5XNTJYNO5JDRKKP26VU0PY');
    createCheckBox(df, 'Start Collecting', 'pcm-startCollecting', '', true);
    createCheckBox(df, 'Collect Only Once', 'pcm-onlyOnce', '');
    createCheckBox(df, 'Search Job', 'pcm-searchJob', '');
    createInput(df, ' pt-3 border-top border-info', 'pcm-formReqName', 'Requester Name: ', 'default: group ID shown');
    createInput(df, '', 'pcm-formAddReqID', 'Requester ID: ', 'example: AGVV5AWLJY7H2');
    createInput(df, '', 'pcm-formAddTitle', 'Title: ', 'default: group ID shown');
    createInput(df, '', 'pcm-formAddDesc', 'Description: ', 'default: group ID shown');
    createInput(df, '', 'pcm-formAddPay', 'Pay Amount: ', 'default: 0.00');
    modal.showModal(null, () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $('#pcm-formAddGroupID').keypress( (e) => {
        if((e.keyCode ? e.keyCode : e.which) == '13') checkGroupID.call(this);
      });
      $('#pcm-startCollecting').click( e => $('#pcm-formAddGroupID').focus() );
      $('#pcm-onlyOnce').click( e => $('#pcm-formAddGroupID').focus() );
      $('#pcm-formAddGroupID').focus();
    }, () => { modal = null; if (afterClose) afterClose(); });
    /** Verifies that the groupID inputted is correct. */
    function checkGroupID() {
      const groupVal = $('#pcm-formAddGroupID').val();
      if (groupVal === '') {
        $(`label[for='pcm-formAddGroupID']`).css('color', '#f78976');
        $(div).find('.pcm-inputError:first').html('Must fill in GroupID or URL!').data('gIdEmpty',true);
      } else if (groupVal.match(/^[0-9a-zA-Z]+$/) || groupVal.includes('://')) {
        let groupId = null, reqId = null, reqSearch = false;
        if (groupVal.includes('://')) [groupId, reqId] = parsePandaUrl(groupVal);
        else if (groupVal.match(/^[^Aa]/)) groupId = groupVal;
        else { reqId = groupVal; reqSearch = true; }
        if (reqId && !reqSearch) { groupId = reqId; reqSearch = true; }
        let title = ($('#pcm-formAddTitle').val()) ? $('#pcm-formAddTitle').val() : groupId;
        let reqName = ($('#pcm-formReqName').val()) ? $('#pcm-formReqName').val() : groupId;
        const desc = ($('#pcm-formAddDesc').val()) ? $('#pcm-formAddDesc').val() : groupId;
        const pay = ($('#pcm-formAddPay').val()) ? $('#pcm-formAddPay').val() : '0.00';
        const startNow = $('#pcm-startCollecting').is(':checked');
        const once = $('#pcm-onlyOnce').is(':checked'); 
        const currentTab = pandaUI.tabs.currentTab;
        if (groupId && bgPanda.pandaGroupIds.hasOwnProperty(groupId) && !$(div).find('.pcm-inputError:first').data('gIdDup')) {
          $('label[for="pcm-formAddGroupID"]').css('color', 'yellow');
          $(div).find('.pcm-inputError:first').html('GroupID already added. Still want to add?').data('gIdDup',true);
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
          $('label[for="pcm-formAddGroupID"]').css('color', 'red');
          $(div).find('.pcm-inputError:first').html('Invalid Group ID or URL').data('gIdInvalid',true);
        }
      } else {
        $('label[for="pcm-formAddGroupID"]').css('color', 'red');
        $(div).find('.pcm-inputError:first').html('Invalid Group ID or URL').data('gIdInvalid',true);
      }
    }
  }
  /** Shows jobs in a table with a checkbox, collect button and details button.
   * @param  {object} modalBody             - The Jquery element of the modal body to append to.
   * @param  {array} jobs                   - An array of all the jobs to display.
   * @param  {function} [checkboxFunc=null] - Function to call when checkbox is clicked.
   * @param  {function} [afterClose=null]   - Function to call after the modal is closed. */
  async showJobsTable(modalBody, jobs, checkboxFunc=null, afterClose=null) {
    const divContainer = $(`<table class='table table-dark table-sm table-moreCondensed pcm-jobTable table-bordered w-auto'></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      {'string':'', 'type':'checkbox', 'btnFunc': (e) => { $(`.modal-body input[type='checkbox']`).prop('checked', $(e.target).is(':checked')); }},
      {'string':'Requester Name', 'type':'string', 'noBorder':true}, {'string':'Title', 'type':'string', 'noBorder':true}, {'string':'Pay', 'type':'string', 'noBorder':true},
      {'string':' ', 'type':'string'}, {'string':' ', 'type':'string'}
    ], divContainer, bgPanda.info, true, true, true, 'pcm-triggeredhit');
    for (const myId of jobs) {
      let status = (pandaUI.pandaStats[myId].collecting) ? 'On' : 'Off', data = await bgPanda.dataObj(myId);
      displayObjectData([
        {'string':'', 'type':'checkbox', 'width':'25px', 'maxWidth':'25px', 'unique':myId, 'inputClass':' pcm-checkbox', 'btnFunc':checkboxFunc},
        {'string':'Requester Name', 'type':'keyValue', 'key':'reqName', 'orKey':'friendlyReqName', 'width':'220px', 'maxWidth':'220px', id:`pcm-RQN-${myId}`},
        {'string':'Hit Title', 'type':'keyValue', 'key':'title', 'orKey':'friendlyTitle', 'width':'550px', 'maxWidth':'550px', 'id':`pcm-TTL-${myId}`},
        {'string':'Pay', 'type':'keyValue', 'key':'price', 'width':'45px', 'maxWidth':'45px', 'money':true, 'id':`pcm-Pay-${myId}`, 'pre':'$'},
        {'btnLabel':'Collect', 'type':'button', 'addClass':` btn-xxs pcm-button${status}`, 'idStart':'pcm-collectButton1', 'width':'62px', 'maxWidth':'62px', 'unique':myId, 'btnFunc': (e) => {
            $(`#pcm-collectButton-${e.data.unique}`).click();
          }},
        {'btnLabel':'Details', 'type':'button', 'addClass':' btn-xxs', 'idStart':'pcm-detailsButton1-', 'width':'62px', 'maxWidth':'62px', 'unique':myId, 'btnFunc': (e) => { 
            const myId = e.data.unique;
            this.showDetailsModal( myId, (changes) => {
              $(`#pcm-RQN-${myId}`).text( (changes.friendlyReqName!=='') ? changes.friendlyReqName : changes.reqName );
              $(`#pcm-TTL-${myId}`).text( (changes.friendlyTitle!=='') ? changes.friendlyTitle : changes.title );
              $(`#pcm-Pay-${myId}`).text(changes.price);
            }, () => { if (afterClose) afterClose(); });
          }}
      ], divContainer, data, true, true);
    }
  }
  /** Filters out jobs with the search term, collecting radio, search mode and once options.
   * @param  {string} search       - Search term to find in title or requester name.
   * @param  {object} modalControl - Jquery element of modalControl to use for these jobs.
   * @return {bool}                - True if job should be shown. */
  async jobsFilter(search, modalControl) {
    let newArray = [];
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
    const theTitle = (type==='groupingEdit') ? 'Edit Groupings' : 'List Jobs';
    const saveBtnStatus = (type==='groupingEdit') ? 'visible btn-sm' : 'invisible';
    const idName = modal.prepareModal(thisObj, '1000px', 'modal-header-info modal-lg', theTitle, '', 'text-right bg-dark text-light', 'modal-footer-info', saveBtnStatus, 'Save Groupings', saveFunc, 'invisible', 'No', null, 'invisible', 'Close');
    const addClass = (type === 'groupingEdit') ? 'pcm-groupingsEditModalBody' : 'pcm-jobsModalBody';
    const modalBody = $(`#${idName} .${modal.classModalBody}`); $(modalBody).addClass(addClass);
    let df = document.createDocumentFragment();
    let modalControl = $('<div class="pcm-modalControl w-100"></div>').appendTo(df);
    if (type==='groupingEdit') {
      $('<div class="small text-warning font-weight-bold pl-1"></div>').append('Select the jobs you want in this grouping below:').append(`<span class="ml-2 text-info pcm-jobsInGroup">Jobs in Group: ${Object.keys(thisObj.pandas).length}</span>`).appendTo(modalControl);
      createInput(modalControl, '', 'pcm-groupingNameI', 'Grouping Name: ', `default: Grouping #${groupUnique}`, null, ' pl-5 text-warning', modal.tempObject[idName].name).append(createTimeInput('Start Time', 'datetimepicker1'));
      createInput(modalControl, ' border-bottom', 'pcm-groupingDescI', 'Description: ', 'default: no description', null, ' pl-5 text-warning', modal.tempObject[idName].description).append(createTimeElapse(thisObj.endHours, thisObj.endMinutes));
      if (thisObj.startTime) $('#datetimepicker1').datetimepicker({defaultDate: moment(thisObj.startTime,'hh:mm A'), format: 'LT'});
      else $('#datetimepicker1').datetimepicker({format: 'LT'});
      $('#pcm-clearTInput').on('click', e => { $('#datetimepicker1').datetimepicker('clear'); });
    }
    const radioGroup = $('<div class="text-center"></div>').appendTo(modalControl);
    radioButtons(radioGroup, 'theJobs', '0', 'All Jobs', true); 
    if (type === 'jobs') radioButtons(radioGroup, 'theJobs', '1', 'Collecting');
    if (type === 'jobs') radioButtons(radioGroup, 'theJobs', '2', 'Not Collecting');
    radioButtons(radioGroup, 'theJobs', '3', 'Searching Mode');
    radioButtons(radioGroup, 'theJobs', '4', 'Only Once');
    const inputControl = createInput(modalControl, '', 'pcm-searchJobs', 'Search phrase: ', 'example: receipts', (e) => {
      $(e.target).closest('.pcm-modalControl').find('.pcm-searchingJobs').click();
    }, ' pl-5');
    $('<button class="btn btn-xxs btn-primary ml-1 pcm-searchingJobs">Search</button>').on( 'click', async (e) => {
      $(modalBody).find('.pcm-jobTable').remove();
      let filtered = await this.jobsFilter($('#pcm-searchJobs').val().toLowerCase(), modalControl);
      await this.showJobsTable(modalBody, filtered, checkFunc, () => {});
      if (type === 'groupingEdit') Object.keys(groupings.groups[groupUnique].pandas).forEach( (value) => { $(`#pcm-selection-${bgPanda.dbIds[value]}`).prop('checked', true); });
    }).appendTo(inputControl);
    if (type === 'jobs') $('<button class="btn btn-xxs btn-danger ml-1">Delete Selected</button>').click( (e) => {
      const selected = $(modalBody).find('.pcm-checkbox:checked').map((_,element) => Number($(element).val()) ).get();
      if (selected.length) pandaUI.removeJobs(selected, async (result) => {
          if (result !== 'NO') {
            $(modalBody).find('.pcm-jobTable').remove();
            let filtered = await this.jobsFilter($('#pcm-searchJobs').val().toLowerCase(), modalControl);
            await this.showJobsTable(modalBody, filtered,_, () => {});
          }
        }, 'manual', () => {});
    }).appendTo(inputControl);
    $(df).find('input:radio[name="theJobs"]').click( (e) => {
      $(e.target).closest('.pcm-modalControl').find('.pcm-searchingJobs').click();
    } );
    modal.showModal(cancelFunc, async () => {
      $('<div class="pcm-modalControl w-100"></div>').append(df).insertBefore(modalBody);
      let df2 = document.createDocumentFragment();
      let filtered = await this.jobsFilter('', modalControl);
      await this.showJobsTable(df2, filtered, checkFunc, () => {});
      $(df2).appendTo(modalBody);
      if (afterShow) afterShow(this);
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
}