/** This class deals with any showing of modals for jobs.
 * @class ModalJobClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalJobClass {
	constructor() {
  }
  /** Shows the modal for users to change the details of the hit job with the unique ID.
   * @async                                - To wait for the data to be loaded from the database.
   * @param  {number} myId                 - The unique ID number for the hit job being edited.
   * @param  {function} [successFunc=null] - Function to call after the save button is pressed.
   * @param  {function} [afterClose=null]  - Function to call after the modal is closed. */
  async showDetailsModal(myId, successFunc=null, afterClose=null) {
    await bgPanda.getDbData(myId);
    let hitInfo = bgPanda.options(myId);
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(hitInfo.data, "700px", "modal-header-info modal-lg", "Details for a hit", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save New Details", async (changes) => {
      if (!hitInfo.data) { await bgPanda.getDbData(myId); }
      hitInfo.data = Object.assign(hitInfo.data, changes);
      hitInfo.data.duration *= 60000; bgPanda.timerDuration(myId);
      await bgPanda.updateDbData(myId, hitInfo.data);
      pandaUI.cards.updateAllCardInfo(myId, hitInfo);
      pandaUI.logTabs.updateLogStatus(null, myId, 0, hitInfo.data);
      modal.closeModal();
      if (hitInfo.skipped) bgPanda.checkSkipped(myId, hitInfo.data);
      if (!pandaUI.pandaStats[myId].collecting) hitInfo.data = null;
      if (successFunc!==null) successFunc(changes);
    }, "invisible", "No", null, "visible btn-sm", "Cancel");
    let df = document.createDocumentFragment();
    displayObjectData([
      {label:'Limit # of GroupID in queue:', type:'range', key:'limitNumQueue', min:0, max:24, tooltip:'Limit number of hits in queue by this group ID. Great way to do batches slowly.'},
      {label:'Limit # of total Hits in queue:', type:'range', key:'limitTotalQueue', min:0, max:24, tooltip:'Limit number of hits allowed in queue. Good when you want to leave room in queue for better hits.'},
      {label:'Accept Only Once:', type:'trueFalse', key:'once', tooltip:'Should only one hit be accepted and then stop collecting? Great for surveys.'},
      {label:"Daily Accepted Hit Limit:", type:"text", key:"acceptLimit", default:0, tooltip:'How many hits a day should be accepted for this job?'},
      {label:"Stop Collecting After Minutes:", type:"text", key:"duration", default:0, tooltip:'The number of minutes for this job to collect before stopping. Resets time if a hit gets collected.'},
      {label:"Stop Collecting After # of fetches:", type:"text", key:"limitFetches", default:0, tooltip:'Number of tries to catch a hit to do before stopping.'},
      {label:"Force Delayed Ham on Collect:", type:"trueFalse", key:"autoGoHam", tooltip:'Should this job go ham when it finds a hit and then runs for delayed ham duration before it goes back to normal collecting mode?'},
      {label:"Force Delayed Ham Duration:", type:"text", key:"hamDuration", default:0, tooltip:'The duration in minutes to use to go in ham mode after collecting a hit and then go back to normal collecting mode.'},
      {label:"Friendly Requester Name:", type:"text", key:"friendlyReqName", tooltip:'A user created requester name to make the name shorter or easier to remember.'},
      {label:"Friendly Hit Title:", type:"text", key:"friendlyTitle", tooltip:'A user created hit title to make the title shorter or easier to remember what it is.'},
      {label:"Requester ID", type:"text", key:"reqId", tooltip:'The requester ID for this job. May not be changed by user.'},
      {label:"Requester Name:", type:"text", key:"reqName", disable:true, tooltip:'The requester name for this job. May not be changed by user.'},
      {label:"Group ID", type:"text", key:"groupId", disable:true, tooltip:'The group ID for this job. May have multiple group ID jobs if wanted. May not be changed by user.'},
      {label:"Title", type:"text", key:"title", disable:true, tooltip:'The title for this job. May not be changed by user.'},
      {label:"Description", type:"text", key:"description", disable:true, tooltip:'The description for this job. May not be changed by user.'},
      {label:"Price", type:"text", key:"price", disable:true, tooltip:'The payment reward for this job. May not be changed by user.'},
      {label:"Assigned Time", type:"text", key:"assignedTime", disable:true, tooltip:'The assigned time in seconds that this has before expiration. May not be changed by user.'},
      {label:"Expires", type:"text", key:"expires", disable:true, tooltip:'The day and time which this hit will no longer be on mturk. May not be changed by user.'},
      {label:"Date Added", type:"text", key:"dateAdded", disable:true, format:"date", tooltip:'The date which this hit was added to PandaCrazy Max. May not be changed by user.'},
      {label:"Total Seconds Collecting", type:"text", key:"totalSeconds", disable:true, tooltip:'The total amount of seconds which this job has tried to collect hits since it was added. May not be changed by user.'},
      {label:"Total Accepted Hits", type:"text", key:"totalAccepted", disable:true, tooltip:'The total amount of hits collected by this job since it was added. May not be changed by user.'}
    ], df, modal.tempObject[idName], true);
    modal.showModal(null, () => {
      const modalBody = $(`#${idName} .${modal.classModalBody}`);
      const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
      divContainer.append(df);
      modalBody.find('[data-toggle="tooltip"]').tooltip({delay: {show:1200}, trigger:'hover'});
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
  /** Shows a modal for adding panda or search jobs.
   * @param  {function} [afterClose=null]  - Function to call after the modal is closed. */
  showJobAddModal(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(null, '900px', 'modal-header-info modal-lg', 'Add new Panda Info', '<h4>Enter New Panda Information. [GroupID is mandatory]</h4>', 'text-right bg-dark text-light', 'modal-footer-info', 'visible btn-sm', 'Add new Panda Info', checkGroupID.bind(this), 'invisible', 'No', null, 'visible btn-sm', 'Cancel');
    let df = document.createDocumentFragment();
    const div = $('<div><div class="pcm_inputError">&nbsp;</div></div>').appendTo(df);
    createInput(df, ' pcm_inputDiv-url', 'pcm_formAddGroupID', '* Group ID or URL: ', 'example: 30B721SJLR5BYYBNQJ0CVKKCWQZ0OI');
    createCheckBox(df, 'Start Collecting', 'pcm_startCollecting', '', true);
    createCheckBox(df, 'Collect Only Once', 'pcm_onlyOnce', '');
    createCheckBox(df, 'Search Job', 'pcm_searchJob', '');
    createInput(df, ' pt-3 border-top border-info', 'pcm_formReqName', 'Requester Name: ', 'default: group ID shown');
    createInput(df, '', 'pcm_formAddReqID', 'Requester ID: ', 'example: AGVV5AWLJY7H2');
    createInput(df, '', 'pcm_formAddTitle', 'Title: ', 'default: group ID shown');
    createInput(df, '', 'pcm_formAddDesc', 'Description: ', 'default: group ID shown');
    createInput(df, '', 'pcm_formAddPay', 'Pay Amount: ', 'default: 0.00');
    modal.showModal(null, () => {
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $('#pcm_formAddGroupID').keypress( (e) => {
        if((event.keyCode ? event.keyCode : event.which) == '13') checkGroupID.call(this);
      });
      $('#pcm_startCollecting').click( e => $('#pcm_formAddGroupID').focus() );
      $('#pcm_onlyOnce').click( e => $('#pcm_formAddGroupID').focus() );
      $('#pcm_formAddGroupID').focus();
    }, () => { modal = null; if (afterClose) afterClose(); });
    /** Verifies that the groupID inputted is correct. */
    function checkGroupID() {
      const groupVal = $('#pcm_formAddGroupID').val();
      if (groupVal === '') {
        $('label[for="pcm_formAddGroupID"]').css('color', 'red');
        $(div).find('.pcm_inputError:first').html('Must fill in GroupID or URL!').data('gIdEmpty',true);
      } else if (groupVal.match(/^[0-9a-zA-Z]+$/) || groupVal.includes('://')) {
        let groupId = null, reqId = null, reqSearch = false;
        if (groupVal.includes('://')) [groupId, reqId] = bgPanda.parsePandaUrl(groupVal);
        else if (groupVal.match(/^[^Aa]/)) groupId = groupVal;
        else { reqId = groupVal; reqSearch = true; }
        if (reqId && !reqSearch) { groupId = reqId; reqSearch = true; }
        let title = ($('#pcm_formAddTitle').val()) ? $('#pcm_formAddTitle').val() : groupId;
        const reqName = ($('#pcm_formReqName').val()) ? $('#pcm_formReqName').val() : groupId;
        const desc = ($('#pcm_formAddDesc').val()) ? $('#pcm_formAddDesc').val() : groupId;
        const pay = ($('#pcm_formAddPay').val()) ? $('#pcm_formAddPay').val() : '0.00';
        const startNow = $('#pcm_startCollecting').is(':checked');
        const once = $('#pcm_onlyOnce').is(':checked'); 
        const currentTab = pandaUI.tabs.currentTab;
        if (groupId && bgPanda.pandaGroupIds.hasOwnProperty(groupId) && !$(div).find('.pcm_inputError:first').data('gIdDup')) {
          $('label[for="pcm_formAddGroupID"]').css('color', 'yellow');
          $(div).find('.pcm_inputError:first').html('GroupID already added. Still want to add?').data('gIdDup',true);
          $('.modal-footer .pcm_modalSave:first').html('YES! Add new Panda Info');
        } else if ( (groupId && !reqSearch) || reqId) {
          title = (reqId) ? '--( Requester ID Search )--' : title;
          let search = (reqId) ? 'rid' : ((groupId && $('#pcm_searchJob').is(':checked')) ? 'gid' : null);
          let data = dataObject(groupId, desc, title, reqId, reqName, pay,_,_,_);
          let opt = optObject(once, search,_,_,_,_, (search === 'gid') ? globalOpt.getSearchDuration()*1000 : 0,_, (search) ? 0 : globalOpt.getHamDelayTimer()*1000);
          pandaUI.addPanda(data, opt, false, startNow,_,_, (search) ? 0 : globalOpt.getHamDelayTimer()*1000);
          modal.closeModal();
        } else {
          $('label[for="pcm_formAddGroupID"]').css('color', 'red');
          $(div).find('.pcm_inputError:first').html('Invalid Group ID or URL').data('gIdInvalid',true);
        }
      } else {
        $('label[for="pcm_formAddGroupID"]').css('color', 'red');
        $(div).find('.pcm_inputError:first').html('Invalid Group ID or URL').data('gIdInvalid',true);
      }
    }
  }
  /** Shows jobs in a table with a checkbox, collect button and details button.
   * @param  {object} modalBody             - The Jquery element of the modal body to append to.
   * @param  {array} jobs                   - An array of all the jobs to display.
   * @param  {function} [checkboxFunc=null] - Function to call when checkbox is clicked.
   * @param  {function} [afterClose=null]   - Function to call after the modal is closed. */
  async showJobsTable(modalBody, jobs, checkboxFunc=null, afterClose=null) {
    const divContainer = $(`<table class="table table-dark table-hover table-sm table-moreCondensed pcm_jobTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([ { string:"", type:"string" }, {string:"Requester Name", type:"string", noBorder:true}, {string:"Title", type:"string", noBorder:true}, {string:"Pay", type:"string", noBorder:true}, {string:"", type:"string"}, {string:"", type:"string"} ], divContainer, bgPanda.info, true, true, "#0b716c");
    for (const myId of jobs) {
      let status = (pandaUI.pandaStats[myId].collecting) ? "On" : "Off", data = await bgPanda.dataObj(myId);
      displayObjectData([
        { string:"", type:"checkbox", width:"20px", unique:myId, inputClass:" pcm_checkbox", btnFunc:checkboxFunc },
        { string:"Requester Name", type:"keyValue", key:"reqName", orKey:"friendlyReqName", width:"155px", id:`pcm_RQN_${myId}` },
        { string:"Hit Title", type:"keyValue", key:"title", orKey:"friendlyTitle", id:`pcm_TTL_${myId}` },
        { string:"Pay", type:"keyValue", key:"price", pre:"$", width:"45px", money:true, id:`pcm_Pay_${myId}` },
        { label:"Collect", type:"button", addClass:` btn-xxs pcm_button${status}`, idStart:"pcm_collectButton1", width:"62px", unique:myId, btnFunc: (e) => {
            $(`#pcm_collectButton_${e.data.unique}`).click();
          }},
        { label:"Details", type:"button", addClass:" btn-xxs", idStart:"pcm_detailsButton1_", width:"62px", unique:myId, btnFunc: (e) => { 
            const myId = e.data.unique;
            this.showDetailsModal( myId, (changes) => {
              $(`#pcm_RQN_${myId}`).text( (changes.friendlyReqName!=="") ? changes.friendlyReqName : changes.reqName );
              $(`#pcm_TTL_${myId}`).text( (changes.friendlyTitle!=="") ? changes.friendlyTitle : changes.title );
              $(`#pcm_Pay_${myId}`).text(changes.price);
            }, () => { if (afterClose) afterClose(); });
          }}
      ], divContainer, data, true, true);
    }
  }
  /** Filters out jobs with the search term, collecting radio, search mode and once options.
   * @param  {string} search       - Search term to find in title or requester name.
   * @param  {object} modalControl - Jquery element of modalControl to use for these jobs.
   * @return {bool}                - True if job should be shown. */
  jobsFilter(search, modalControl) {
    return bgPanda.pandaUniques.filter( async (myId) => {
      let options = bgPanda.options(myId);
      const stats = pandaUI.pandaStats[myId];
      let good = false;
      const radioChecked = $(modalControl).find(`input[name='theJobs']:checked`).val();
      if (radioChecked==="0") good = true;
      else if (radioChecked==="1" && stats.collecting) good = true;
      else if (radioChecked==="2" && !stats.collecting) good = true;
      else if (radioChecked==="4" && options.once) good = true;
      if (good && search!=="" && (options.title.toLowerCase().includes(search) || options.reqName.toLowerCase().includes(search))) good = true;
      else if (good && search!=="") good = false;
      return good;
    } )
  }
  /** Shows a modal to list jobs filtered by a search term, collecting, search mode or once options.
   * @param  {string} [type='jobs']       - Showing just jobs or jobs for grouping?
   * @param  {number} [groupUnique=-1]    - Only used for editing grouping jobs with this unique number.       
   * @param  {object} [thisObj=null]      - Only used for editing grouping jobs so it saves when user wants.
   * @param  {function} [saveFunc=null]   - Function to call when save button clicked.
   * @param  {function} [checkFunc=null]  - Function to call when checkbox clicked on a job.
   * @param  {function} [cancelFunc=null] - Function to call when cancel button clicked.
   * @param  {function} [afterShow=null]  - Function to call when modal is shown after animations stopped.
   * @param  {function} [afterClose=null] - Function to call after the modal is closed. */
 showJobsModal(type='jobs', groupUnique=-1, thisObj=null, saveFunc=null, checkFunc=null, cancelFunc=null, afterShow=null, afterClose=null) {
    if (!modal) modal = new ModalClass();
    const theTitle = (type==='groupingEdit') ? 'Edit Groupings' : 'List Jobs';
    const saveBtnStatus = (type==='groupingEdit') ? 'visible btn-sm' : 'invisible';
    const idName = modal.prepareModal(thisObj, '1000px', 'modal-header-info modal-lg', theTitle, '', 'text-right bg-dark text-light', 'modal-footer-info', saveBtnStatus, 'Save Groupings', saveFunc, 'invisible', 'No', null, 'invisible', 'Close');
    const addClass = (type === 'groupingEdit') ? 'pcm_groupingsEditModalBody' : 'pcm_jobsModalBody';
    const modalBody = $(`#${idName} .${modal.classModalBody}`); $(modalBody).addClass(addClass);
    let df = document.createDocumentFragment();
    let modalControl = $('<div class="pcm_modalControl w-100"></div>').appendTo(df);
    if (type==='groupingEdit') {
      $('<div class="small text-warning font-weight-bold pl-1"></div>').append('Select the jobs you want in this grouping below:').append(`<span class="ml-2 text-info pcm_jobsInGroup">Jobs in Group: ${Object.keys(thisObj.pandas).length}</span>`).appendTo(modalControl);
      createInput(modalControl, '', 'pcm_groupingNameI', 'Grouping Name: ', `default: Grouping #${groupUnique}`, null, ' pl-5 text-warning', modal.tempObject[idName].name).append(createTimeInput('Start Time', 'datetimepicker1'));
      createInput(modalControl, ' border-bottom', 'pcm_groupingDescI', 'Description: ', 'default: no description', null, ' pl-5 text-warning', modal.tempObject[idName].description).append(createTimeElapse(thisObj.endHours, thisObj.endMinutes));
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
      this.showJobsTable(modalBody, this.jobsFilter($('#pcm_searchJobs').val().toLowerCase(), modalControl), checkFunc, () => {});
      if (type==='groupingEdit') Object.keys(groupings.groups[groupUnique].pandas).forEach( (value) => { $(`#pcm_selection_${bgPanda.dbIds[value]}`).prop('checked', true); });
    }).appendTo(inputControl);
    if (type === 'jobs') $('<button class="btn btn-xxs btn-danger ml-1">Delete Selected</button>').click( (e) => {
      const selected = $(modalBody).find('.pcm_checkbox:checked').map((_,element) => Number(element.val())).get();
      if (selected.length) pandaUI.removeJobs(selected, () => {
          $(modalBody).find('.pcm_jobTable').remove();
          this.showJobsTable(modalBody, this.jobsFilter($('#pcm_searchJobs').val().toLowerCase(), modalControl),_, () => {});
        });
    }).appendTo(inputControl);
    $(df).find('input:radio[name="theJobs"]').click( (e) => {
      $(e.target).closest('.pcm_modalControl').find('.pcm_searchingJobs').click();
    } );
    modal.showModal(cancelFunc, () => {
      $('<div class="pcm_modalControl w-100"></div>').append(df).insertBefore(modalBody);
      let df2 = document.createDocumentFragment();
      this.showJobsTable(df2, this.jobsFilter('', modalControl), checkFunc, () => {});
      $(df2).appendTo(modalBody);
      if (afterShow) afterShow(this);
    }, () => { if (afterClose) afterClose(); else modal = null; });
  }
}