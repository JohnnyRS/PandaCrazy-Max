/** This class takes care of the exporting and importing of data.
 * @class EximClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class EximClass {
  constructor() {
    this.tabPosition = 0;                 // Unique counter for the tabs being imported.
    this.importJobData = {};              // All the jobs data being imported.
    this.importJobIds = [];               // All the id's for the jobs being imported.
    this.importTabsData = {};             // Panda jobs tabs being imported.
    this.importJobsTabs = {};             // Temporary panda jobs tabs being imported.
    this.importOptions = {};              // Global options being imported.
    this.importGroupings = [];            // Panda groupings being imported.
    this.importSGroupings = [];           // Search groupings being imported.
    this.importSearchData = {};           // Search data being imported.
    this.importAlarmsData = {};           // Alarms data being imported.
    this.importTriggersData = [];         // Triggers data being imported.
    this.importCompleted = false;         // Flag used to represent when the importing is completed.
    this.alarmsOnly = false;              // Only export the alarms.
    this.reader = new FileReader();       // Used to allow user to find a themes file on their computer.
    this.exportPre = {'extVersion':'0', 'exportVersion':'JRJUN-0', 'jobs':0, 'Options':0, 'groupings':0, 'tabs':0, 'searchTriggers':0};
    this.propData = {'Options':{'func':'theOptions', 'prop':'Options'}, 'Grouping':{'func':'theGroupings', 'prop':'Grouping'}, 'Alarms':{'func':'theSoundOptions', 'prop':'SoundOptions'}, 'Tabs':{'func':'theTabs', 'prop':'Tabsdata'}, 'SearchGroupings':{'func':'searchGroupings', 'prop':'SearchGroupings'}, 'Triggers':{'func':'theTriggers', 'prop':'SearchTriggers'}};
    this.soundConvert = {'more15':'less99', 'queueFull':'fullQueue', 'loggedOut':'hasToPause', 'captchaAlarm':'captchaAlarm'};
    this.options = {'HamCycleNumber':'hamTimer', 'cycleNumber':'mainTimer', 'cycleNumber2':'secondTimer', 'cycleNumber3':'thirdTimer', 'cycleAdding':'timerAddMore', 'cycleAutoIncrease':'timerAutoIncrease', 'cycleDecrease':'timerDecrease', 'cycleIncrease':'timerIncrease', 'savedCycleNum':'timerUsed', 'alarmVolume':'volume'};
  }
  /** Converts the amount of time set for the HIT from string to seconds.
   * @param  {string} duration - The duration in a string format that MTURK has for this HIT.
   * @return {number}          - Returns the number in seconds.
  **/
  secondsDuration(duration) {
    let testReg = /(\d*) (week|day|hour|minute|second)/g, totalMinutes = 0, matches = Array.from(duration.matchAll(testReg));
    let min_data = {'week':10080, 'day':1440, 'hour':60, 'minute':1, 'second':0};
    for (const match of matches) { totalMinutes += min_data[match[2]] * match[1]; }
    return totalMinutes * 60;
  }
  /** Empties out all the properties for this class to reset filled in import data. **/
  resetData() {
    this.tabPosition = 0; this.importJobData = {}; this.importTabsData = {}; this.importOptions = {}; this.importSearchData = {}; this.importJobsTabs = {};
    this.importJobIds = []; this.importGroupings = []; this.importSGroupings = [];
  }
  /** Export only alarms to an export file.
   * @param  {function} [doneFunc] - Do after function.
  **/
  exportOnlyAlarms(doneFunc=null) {
    let exportedAlarms = MyAlarms.exportAlarms(true);
    saveToFile({'pre':this.exportPre, 'Alarms':exportedAlarms},_, '_only_alarms', () => { if (doneFunc) doneFunc(); });
  }
  /** Export all the data to a file with alarms or not.
   * @async                      - To wait for all panda job data to be loaded.
   * @param  {bool} [withAlarms] - Should alarm sounds be included?  @param  {function} [doneFunc] - The function to call after saving file to computer.
  **/
  async exportData(withAlarms=false, doneFunc=null) {
    let exportJobs = [], exportTabs = [], exportOptions = [], exportGrouping = {}, exportedAlarms = [], exportTriggers = {}, exportSearchGroups = {};
    this.exportPre.extVersion = gCurrentVersion;
    await MyPanda.getAllPanda(false);
    for (const key of Object.keys(MyPanda.info)) { let data = await MyPanda.dataObj(key); exportJobs.push(data); }
    exportTabs = Object.values(MyPandaUI.tabs.getTabInfo()); exportOptions = MyOptions.exportOptions(); exportGrouping = MyGroupings.theGroups();
    exportedAlarms = MyAlarms.exportAlarms(withAlarms); exportTriggers = await MySearch.exportTriggers(); exportSearchGroups = await MySearch.exportSearchGroupings();
    this.exportPre.jobs = exportJobs.length;
    saveToFile({'pre':this.exportPre, 'jobs':exportJobs, 'Tabsdata':exportTabs, 'Options':exportOptions, 'Grouping':exportGrouping, 'SearchTriggers':exportTriggers,
      'SearchGroupings':exportSearchGroups, 'SoundOptions':exportedAlarms},_, (withAlarms) ? '_w_alarms' : null, () => {
      MyPanda.nullData(false); if (doneFunc) doneFunc();
    });
  }
  /** Show user that the file used was not valid.
   * @param  {bool} status - True for good file or false for a bad file.
  **/
  statusFile(status) {
    let statusText = (status) ? 'Data from file ready to be imported.' : 'Not a valid import file.';
    $('.pcm-importStatus').html(statusText).removeClass('pcm-inputError');
    if (status) $('.pcm-importButton').removeClass('pcm-disabled').prop('disabled',false);
    else { $('.pcm-importButton').addClass('pcm-disabled').prop('disabled',true); $('.pcm-importStatus').addClass('pcm-inputError'); }
  }
  /** Reads the data from the file to be imported and then verifies it.
   * @async - To check each property needed in the import file.
  **/
  async readData() {
    let textData = this.reader.result;
    $('.pcm-importStatus').html('');
    $('#pcm-importCheck').html(`<div class='tabs'></div><div class='jobs'></div><div class='options'></div><div class='groupings'></div><div class='alarms'></div><div class='searchGroupings'></div><div class='triggers'></div></div>`);
    this.resetData();
    try {
      if (textData) {
        let data = JSON.parse(textData), version = '';
        if (data.hasOwnProperty('pre') && data.pre.exportVersion === 'JRJUN-0') version = 'PCM';
        else if (data.hasOwnProperty('Requesters') && /JRAPR(-?)16/.test(data.Requesters[0].requesterName)) version = 'PCOLD';
        else if (Array.isArray(data) && data[0].requesterName === 'JRSep-1.0') version = 'PCOLDER';
        if (version !== '' ) {
          await this.checkProps(data, version, 'Tabs', 'tabs', 'Tabs');
          await this.checkJobs(data, version);
          await this.checkProps(data, version, 'Options', 'options', 'Options');
          await this.checkProps(data, version, 'Grouping', 'groupings', 'Groupings');
          await this.checkProps(data, version, 'Alarms', 'alarms', 'Alarms');
          await this.checkProps(data, version, 'SearchGroupings', 'searchGroupings', 'Search Groupings');
          await this.checkProps(data, version, 'Triggers', 'triggers', 'Search Triggers');
          this.statusFile(true);
        } else { this.statusFile(false); }
        data = null;
      }
    } catch (e) { console.info('Not a valid import file. ',e); this.statusFile(false); }
    textData = null;
  }
  /** Starts to import the data to the program and deleting all the old data.
   * @async                      - To wait for all the current data to be deleted and new imported data to be saved in database.
   * @param  {bool} [onlyAlarms] - Should alarm sounds only get imported?
  **/
  async startImporting(onlyAlarms=false) {
    if (onlyAlarms || this.alarmsOnly) {
      await MyAlarms.clearAlarms();
      await MyAlarms.prepareAlarms(Object.values(this.importAlarmsData), false);
    } else {
      if (!Object.keys(this.importTabsData).length) this.importTabsData = Object.assign({}, this.importJobsTabs);
      let counters = 0, tabDbId = 1, mInfo = [], mData = []; this.tabPosition = 0;
      if (Object.keys(this.importTabsData).length > 0) {
        $('#pcm-tabbedPandas').hide(); $('.pcm-importButton:first').append('.');
        MyPanda.removeAll(); MySearch.removeAll(); MyPanda.closeDB(); MySearch.closeDB(); // Must close DB before deleting and recreating stores.
        await MyPanda.recreateDB(); // Recreate database and stores.
        await MyOptions.prepare((_s, bad) => { if (bad) showMessages(null,bad); });
        await MyAlarms.prepareAlarms(Object.values(this.importAlarmsData), false);
        await MyGroupings.prepare((_s, bad) => { if (bad) showMessages(null,bad); });
        $('.pcm-importButton:first').append('.');
        MyOptions.importOptions(this.importOptions);
        for (const key of Object.keys(this.importTabsData)) {
          $('.pcm-importButton:first').append('.');
          let active = (counters++ === 0) ? true : false;
          let theTitle = (this.importTabsData[key].title !== '') ? this.importTabsData[key].title : ((this.tabPosition === 0) ? 'Main' : `tab #${this.tabPosition}`);
          tabDbId = await MyPandaUI.tabs.addFromDB({'title':theTitle, 'list':this.importTabsData[key].list, 'position':this.tabPosition++}, active);
          MyPandaUI.tabs.hideContents();
          for (const myId of this.importTabsData[key].list) {
            if (this.importJobData.hasOwnProperty(myId)) {
              this.importJobIds = arrayRemove(this.importJobIds, myId);
              let job = this.importJobData[myId];
              job.options.tabUnique = Number(tabDbId);
              mInfo.push({...job.data, ...job.options, 'dateAdded': job.dateAdded, 'totalSeconds':job.totalSeconds, 'totalAccepted':job.totalAccepted});
              mData.push({...this.importSearchData[myId], 'myId':myId});
              job = null;
            }
          }
        }
      }
      if (this.importJobIds.length > 0) {
        for (const myId of this.importJobIds) {
          let job = this.importJobData[myId];
          job.options.tabUnique = 1;
          mInfo.push({...job.data, ...job.options, 'dateAdded': job.dateAdded, 'totalSeconds':job.totalSeconds, 'totalAccepted':job.totalAccepted});
          mData.push(this.importSearchData[myId]);
          job = null;
        }
      }
      await MyPanda.addToDB(mInfo, true);
      let newPositions = {}, triggers = [], options = [], rules = [], addedTime = new Date().getTime();
      for (let i = 0, len = mInfo.length; i < len; i++) {
        if (mInfo[i].search) {
          let value = (mInfo[i].search === 'rid') ? mInfo[i].reqId : mInfo[i].groupId;
          if (value) {
            triggers.push({'type':mInfo[i].search, 'value':value, 'pDbId':mInfo[i].id, 'searchUI':false, 'pandaId':mInfo[i].myId, 'name':mInfo[i].reqName, 'disabled':true, 'numFound':0, 'added':addedTime + i, 'lastFound':null});
            options.push({'duration':0, 'once':mInfo[i].once, 'limitNumQueue':mInfo[i].limitNumQueue, 'limitTotalQueue':mInfo[i].limitTotalQueue, 'limitFetches':mInfo[i].limitFetches, 'autoGoHam':false, 'tempGoHam':0, 'acceptLimit':0});
            let ruleSet = Object.assign({}, MySearch.ruleSet, mData[i].rules)
            rules.push({rules:[ruleSet], 'ruleSet':0});
          }
        }
        if (!newPositions[mInfo[i].tabUnique]) newPositions[mInfo[i].tabUnique] = [];
        newPositions[mInfo[i].tabUnique].push(mInfo[i].id);
        for (const group of this.importGroupings) {
          if (group.grouping && group.grouping.includes(mData[i].myId)) group.pandas[mInfo[i].id] = group.delayed.includes(mData[i].myId);
          else if (group.pandas && group.pandas.hasOwnProperty(mData[i].myId)) { group.pandas[mInfo[i].id] = group.pandas[mData[i].myId]; delete group.pandas[mData[i].myId]; }
        }
      }
      if (triggers.length) await MySearch.saveToDatabase(triggers, options, rules,_, true);
      let triggerData = this.importTriggersData, imTriggers = [], imOptions = [], imRules = [], imHistory = [], prevId = [], newIds = {}, counter = 1;
      if (triggerData.length) {
        for (const data of this.importTriggersData) {
          let older = data.history.hasOwnProperty('gids'), gidsObject = (older) ? data.history.gids : data.history, numHits = -1, historyGids = {};
          prevId.push({'prevId':data.trigger.id, 'newId':-1}); delete data.trigger.id; delete data.options.dbId; delete data.rules.dbId;
          for (const key of Object.keys(gidsObject)) {
            let value = gidsObject[key]; numHits++;
            if (older) { historyGids[numHits] = {'gid':key, 'date':value.date, 'sent':value.sent}; }
            else { for (const key of Object.keys(data.history)) { delete data.history[key].dbId; delete data.history[key].id; } }
          }
          if (older) data.history = historyGids;
          if (numHits > 0 && data.trigger.numFound === 0) data.trigger.numFound = numHits;
          if (numHits > 0) data.trigger.numHits = numHits;
          imTriggers.push(data.trigger); imOptions.push(data.options); imRules.push(data.rules); imHistory.push(data.history); counter++;
        }
        await MySearch.saveToDatabase(imTriggers, imOptions, imRules, imHistory, true, prevId);
        for (const theId of prevId) { newIds[theId.prevId] = theId.newId; }
        for (const group of this.importSGroupings) {
          let newTriggers = {};
          for (const key of Object.keys(group.triggers)) { if (newIds.hasOwnProperty(key)) newTriggers[newIds[key]] = {'id':newIds[key]}; }
          group.triggers = newTriggers;
        }
      }
      for (const group of this.importGroupings) { delete group.grouping; delete group.delayed; }
      let searchGroupings = new TheGroupings('searching'); await searchGroupings.prepare((_s, bad) => { if (bad) showMessages(null,bad); });
      MyGroupings.importToDB(this.importGroupings); searchGroupings.importToDB(this.importSGroupings);
      for (const unique of MyPandaUI.tabs.getUniques()) { if (newPositions[unique]) MyPandaUI.tabs.setPositions(unique, newPositions[unique]); }
    }
  }
  /** Shows the import modal for user to select a file to import. **/
  importModal() {
    MyModal = new ModalClass();
    const idName = MyModal.prepareModal(null, '800px', 'pcm-importModal', 'modal-lg', 'Import Data', '<h4>Import saved data from an exported file.</h4>', '', '', 'invisible', 'No', null, 'invisible', 'No', null, 'invisible', 'Close');
    MyModal.showModal(null, () => {
      let df = document.createDocumentFragment();
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        createCheckBox(df, 'Import only alarm sounds: ', 'pcm-importAlarms', 'alarmsYes', false, ' pcm-importCheckbox',_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Import Alarm sounds ONLY from the exported file. No other data will be imported and all data will be kept.');
        let inputContainer = $(`<div class='col-xs-12 pcm-fileInput'></div>`).appendTo(df);
        createFileInput(inputContainer, 'application/JSON', 'Browse for an exported json file on your computer to import all your data.');
        $(`<div id='pcm-importCheck'></div>`).appendTo(df);
        $(`<div class='pcm-importStatus'>&nbsp;</div>`).appendTo(df);
        $('<div></div>').append($(`<button class='pcm-importButton pcm-disabled pcm-tooltipData pcm-tooltipHelper' data-original-title='Import jobs, options, groupings, triggers and alarm options from an exported file.'>Import Data From File</button>`).prop('disabled',true)).appendTo(df);
        $(`#${idName} .${MyModal.classModalBody}`).append(df);
        $('.custom-file-input').on('change', e => {
          const fileName = $(e.target).val().replace('C:\\fakepath\\', '');
          $(e.target).next('.custom-file-label').addClass('selected').html(fileName);
          this.reader.onload = () => this.readData();
          this.reader.readAsBinaryString($(e.target).prop('files')[0]);
          this.reader.onerror = () => { console.info('can not read the file'); }
        });
        $('.pcm-importButton:first').on('click', async e => {
          if (!this.importCompleted) {
            $(e.target).html('Please Wait: Importing').css('color','white').prop('disabled',true); MySearchUI.importing();
            await this.startImporting($('#pcm-importAlarms').prop('checked'));
            await delay(600);
            $('.custom-file-input').off('change');
            $(e.target).html('Importing completed. Click to restart!').css({'backgroundColor':'#00FF7F','color':'#000c9c', 'fontWeight':'bold'}).prop('disabled',false);
            this.reader.abort();
            this.reader = null; this.importCompleted = true; this.resetData();
            MySearchUI.importingDone(); gPCM_pandaOpened = false;
          } else MyModal.closeModal();
        });
        inputContainer = null;
      }
      df = null;
    }, () => { MyModal = null; if (this.importCompleted) { MySearchUI.importCompleted(); setTimeout(() => { window.location.reload(); }, 800); } });
  }
  /** Shows the export modal for user to choose to export alarm sounds or not. **/
  exportModal() {
    MyModal = new ModalClass();
    const idName = MyModal.prepareModal(null, '800px', 'pcm-exportModal', 'modal-lg', 'Export Data', '<h4>Export data to a file for importing later.</h4>', '', '', 'invisible', 'No', null, 'invisible', 'No', null, 'invisible', 'Close');
    MyModal.showModal(null, () => {
      let df = document.createDocumentFragment();
      $(`<h4 class='pcm-exportText'>Any added jobs, tabs, groupings and all options will be exported.<br />Only the alarm options will be saved unless you click the checkbox to save alarm sounds.<br />Saving alarm sounds will create a larger exported file so only do it when you add new sounds.</div>`).appendTo(df);
      let div1 = $(`<div></div>`).appendTo(df);
      createCheckBox(div1, 'Export alarm sounds too: ', 'pcm-exportAlarmsToo', 'alarmsYes', false, ' pcm-exportCheckAlarms',_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Export Alarm sounds also to the export file which could cause it to be large.');
      let div2 = $(`<div></div>`).appendTo(df);
      createCheckBox(div2, 'Export ONLY alarm sounds: ', 'pcm-exportAlarmsOnly', 'alarmsYes', false, ' pcm-exportCheckAlarmsOnly',_,_,_, 'pcm-tooltipData pcm-tooltipHelper', 'Export ONLY Alarm sounds to the export file. No other data will be exported so you can share your personal alarms only.');
      $(`<div></div>`).append($(`<button class='pcm-exportButton pcm-tooltipData pcm-tooltipHelper' data-original-title='Export jobs, options, groupings, triggers and alarms to a file.'>Export Your Data To A File</button>`)).appendTo(df);
      $(`#${idName} .${MyModal.classModalBody}`).append(df);
      $('.pcm-exportButton:first').on('click', e => {
        $(e.target).html('Please Wait: Exporting').css('color','white').prop('disabled',true);
        if ($('#pcm-exportAlarmsOnly').prop('checked')) this.exportOnlyAlarms(async () => { await delay(1500); MyModal.closeModal(); });
        else this.exportData($('#pcm-exportAlarmsToo').prop('checked'), async () => { await delay(1500); MyModal.closeModal(); });
      });
      df = null;
    }, () => { MyModal = null; });
  }
  /** Validates the job data in the file to be imported.
   * @async                - To delay for status text to be read by user.
   * @param  {object} data - The job data.  @param  {string} type - The version of the import file.
   * @return {bool}        - Returns if it was verified or not.
  **/
  async checkJobs(data, type) {
    let jobData = null;
    $('#pcm-importCheck .jobs').html('Job Data - Checking').removeClass('pcm-verified');
    if (type === 'PCM' && data.hasOwnProperty('jobs')) jobData = data.jobs;
    else if (type === 'PCOLD') jobData = Object.keys(data.Requesters);
    else if (type === 'PCOLDER') jobData = data;
    if (jobData) {
      for (const key of jobData) {
        const rData = (type === 'PCOLD') ? data.Requesters[key] : key;
        if (type === 'PCM') this.newerImportsJobs(rData);
        else if (type === 'PCOLD') this.olderImportsJobs(rData, key, type);
        else if (type === 'PCOLDER') this.olderImportsJobs(rData, rData.id, type);
      }
      await delay(400);
      $('#pcm-importCheck .jobs').html('Job Data - Verified').addClass('pcm-verified');
      return true;
    } else { $('#pcm-importCheck .jobs').html('Job Data - None').addClass('pcm-dataNone'); return false; }
  }
  /** Checks the properties from an import data and then calls the specific function for it.
   * @async                       - To wait for a delay.
   * @param  {object} data        - Import data.  @param  {string} version    - Import version.  @param  {string} type - Property ID.
   * @param  {string} [typeClass] - Class name.   @param  {string} [typeText] - Import name.
  **/
  async checkProps(data, version, type, typeClass='', typeText='') {
    $(`#pcm-importCheck .${typeClass}`).html(`${typeText} Data - Checking`).removeClass('pcm-verified');
    await delay(400);
    let prop = this.propData[type].prop;
    if (type === 'Tabs') { if (data.hasOwnProperty(prop)) { for (const tab of data.Tabsdata) { this.theTabs(tab, version); }}}
    else if (type === 'Alarms' && data.hasOwnProperty('Alarms')) { this.theSoundOptions(data['Alarms']); prop = 'Alarms'; this.alarmsOnly = true; }
    else this[this.propData[type].func]((data[prop]) ? data[prop] : {}, version);
    if (data.hasOwnProperty(prop)) $(`#pcm-importCheck .${typeClass}`).html(`${typeText} Data - Verified`).addClass('pcm-verified');
    else $(`#pcm-importCheck .${typeClass}`).html(`${typeText} Data - None`).addClass('pcm-dataNone');
  }
  /** Parse job data read from a newer import file to the data object needed.
   * @param  {object} rData - The job data read from the import file to be parsed to the newer data object.
  **/
  newerImportsJobs(rData) {
    if (Object.keys(this.importTabsData).length > 0) {
      if (!Object.keys(this.importTabsData).includes(rData.tabUnique.toString())) rData.tabUnique = MyPandaUI.tabs.currentTab;
    } else {
      if (this.importJobsTabs[rData.tabUnique]) this.importJobsTabs[rData.tabUnique].list.push(rData.id);
      else { this.importJobsTabs[rData.tabUnique] = {'title': '',list:[rData.id], 'id':rData.tabUnique}; this.tabPosition++; }
    }
    let hamD = (!rData.hamDuration) ? MyOptions.getHamDelayTimer() : rData.hamDuration;
		if (typeof rData.dateAdded === 'string') rData.dateAdded = new Date(rData.dateAdded).getTime();
    let dO = dataObject(rData.groupId, rData.description, rData.title, rData.reqId, rData.reqName, rData.price, rData.hitsAvailable, rData.assignedTime, rData.expires, rData.friendlyTitle, rData.friendlyReqName, rData.ext, rData.created);
    let oO = optObject(rData.once, rData.search, rData.tabUnique, rData.limitNumQueue, rData.limitTotalQueue, rData.limitFetches, rData.duration, rData.autoGoHam, hamD, rData.acceptLimit, rData.day, rData.weight, rData.dailyDone);
    this.importSearchData[rData.id] = {'rules':{}, 'history':{}}; this.importJobIds.push(rData.id);
    this.importJobData[rData.id] = {'data':dO, 'options':oO, 'dateAdded':rData.dateAdded, 'totalSeconds':rData.totalSeconds, 'totalAccepted':rData.totalAccepted};
  }
  /** Parse job data read from an older import file to the data object needed.
   * @param  {object} rData - Job data.  @param  {number} key - Job key name.  @param  {string} type - The version of the import file.
  **/
  olderImportsJobs(rData, key, type) {
    let firstOne = (rData.requesterName && ['JRSep','JRAPR'].includes(rData.requesterName.substring(0,5))) ? true : false;
    if (!firstOne && (rData.groupId || rData.requesterId)) {
      if (type === 'PCOLDER') rData.tabNumber++;
      if (Object.keys(this.importTabsData).length > 0) {
        if (!Object.keys(this.importTabsData).includes(rData.tabNumber.toString())) rData.tabNumber = MyPandaUI.tabs.currentTab;
      } else {
        if (this.importJobsTabs[rData.tabNumber]) this.importJobsTabs[rData.tabNumber].list.push(key);
        else { this.importJobsTabs[rData.tabNumber] = {'title': '',list:[key], 'id':rData.tabNumber}; this.tabPosition++; }
      }
      let totalSeconds = 0, duration = rData.duration, search = null;
      if (duration !== '' && duration !== '0') { totalSeconds = this.secondsDuration(duration); }
      if (rData.action.toLowerCase().indexOf('search') !== -1) search = 'rid';
      if (!rData.dateAdded) rData.dateAdded = new Date().getTime();
      if (typeof rData.dateAdded === 'string') rData.dateAdded = new Date(rData.dateAdded).getTime();
      let hamD = (!rData.hamTimer) ? MyOptions.getHamDelayTimer() : rData.hamTimer * 1000, minutesOff = (rData.secondsOff > 0) ? Math.round(rData.secondsOff / 60) : 0;
      let dO = dataObject(rData.groupId, rData.title, rData.title, rData.requesterId, rData.requesterName, rData.pay,_, totalSeconds,_, rData.friendlyTitle, rData.friendlyRName);
      let oO = optObject(rData.once, search, rData.tabNumber, rData.queueHitLimit, rData.queueLimit,_, minutesOff, rData.stickyDelayedHam, hamD, rData.dailyLimit,_, rData.weight);
      let searchRules = (rData.hasOwnProperty('searchData')) ? rData.searchData.searchOptions : {};
      let excludes = (searchRules.hasOwnProperty('excludeGID') && searchRules.excludeGID.length > 0) ? searchRules.excludeGID[0].split(/\s*,\s*/) : [];
      let rO = sRulesObject(excludes,_, searchRules.excludeTerm, searchRules.includeTerm, searchRules.minReward, searchRules.maxReward);
      let theHistory = ('searchData' in rData && 'theHistory' in rData.searchData) ? rData.searchData.theHistory : {}, fullHist = {};
      if (Object.keys(theHistory).length > 0) {
        for (const key2 of Object.keys(theHistory)) {
          let info = theHistory[key2].info;
          let hO = sHistoryObject(info.requesterName, info.requesterId, info.pay, info.title, info.description, info.duration, theHistory[key2].date);
          fullHist[key2] = hO;
        }
      }
      this.importSearchData[key.toString()] = {'rules':rO, 'history':fullHist}; this.importJobIds.push(key);
      this.importJobData[key.toString()] = {'data':dO, 'options':oO, 'dateAdded':rData.dateAdded, 'totalSeconds':0, 'totalAccepted':0};
    }
  }
  /** Parse tab data read from an import file to the data object needed.
   * @param  {object} rData - Tab data.  @param  {string} version - Is exported data old or new?
  **/
  theTabs(rData, version) {
    if (version === 'PCOLD') this.importTabsData[rData.tabNumber.toString()] = {'title':rData.tabName, 'list':rData.positions, 'id':rData.tabNumber};
    else this.importTabsData[rData.id.toString()]= rData;
  }
  /** Parse option data read from an import file to the data object needed.
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object.
  **/
  theOptions(rData) {
    if (Array.isArray(rData)) {
      for (const cat of ['general', 'timers', 'alarms', 'helpers', 'search']) {
        let count = arrayCount(rData, (item) => {
          if (item.category === cat) { this.importOptions[cat] = Object.assign({}, MyOptions[cat + 'Default'], item); return true; } else return false;
        }, true);
        if (count === 0) { this.importOptions[cat] = Object.assign({}, MyOptions[cat + 'Default']); }
      }
    } else {
      let tempOptions = {'generalDefault':{}, 'timersDefault':{}, 'alarmsDefault':{}, 'helpersDefault':{}, 'searchDefault':{}};
      for (const key of Object.keys(rData)) {
        let keyName = (this.options.hasOwnProperty(key)) ? this.options[key] : key, optionName = null;
        if (MyOptions['generalDefault'].hasOwnProperty(keyName)) optionName = 'generalDefault';
        if (MyOptions['timersDefault'].hasOwnProperty(keyName)) optionName = 'timersDefault';
        if (MyOptions['alarmsDefault'].hasOwnProperty(keyName)) optionName = 'alarmsDefault';
        if (MyOptions['helpersDefault'].hasOwnProperty(keyName)) optionName = 'helpersDefault';
        if (MyOptions['searchDefault'].hasOwnProperty(keyName)) optionName = 'searchDefault';
        if (optionName) tempOptions[optionName][keyName] = rData[key];
      }
      this.importOptions.general = Object.assign({}, MyOptions['generalDefault'], tempOptions['generalDefault']);
      this.importOptions.timers = Object.assign({}, MyOptions['timersDefault'], tempOptions['timersDefault']);
      this.importOptions.alarms = Object.assign({}, MyOptions['alarmsDefault'], tempOptions['alarmsDefault']);
      this.importOptions.helpers = Object.assign({}, MyOptions['helpersDefault'], tempOptions['helpersDefault']);
      this.importOptions.search = Object.assign({}, MyOptions['searchDefault'], tempOptions['searchDefault']);
    }
    let hamDelayTimer = this.importOptions.timers.hamDelayTimer, hamRange = MyOptions.getTimerHamRange();
    if (hamDelayTimer < hamRange.min || hamDelayTimer > hamRange.max) this.importOptions.timers.hamDelayTimer = MyOptions.timersDefault.hamDelayTimer;
  }
  /** Parse the groupings data from an import file to the data object needed.
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object.
  **/
  theGroupings(rData) {
    for (const key of Object.keys(rData)) {
      let importGroup = {};
      if (!rData[key].hasOwnProperty('delayed')) { rData[key].delayed = []; }
      if (rData[key].hasOwnProperty('pandas')) { importGroup = rData[key]; }
      else { importGroup = {'name':key, 'description':rData[key].description, 'grouping':rData[key].grouping, 'delayed':rData[key].delayed, pandas:{}, startTime:'', endHours:0, endMinutes:0}; }
      this.importGroupings.push(importGroup);
    }
  }
  /** Parse the alarms data from an import file to the data object needed.
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object.
  **/
  theSoundOptions(rData) {
    if (rData.captchaAlarm) {
      let defaultAlarms = MyAlarms.theDefaultAlarms();
      for (const key of Object.keys(rData)) {
        this.importAlarmsData[key] = Object.assign(defaultAlarms[key], rData[key]);
        if (!rData[key].obj) {
          let audio = MyAlarms.allAlarms(key).audio;
          if (audio === null) this.importAlarmsData[key].obj = null;
          else if (audio.src.substr(0,4) === 'data') this.importAlarmsData[key].obj = audio.src;
        } else if (rData[key].obj.substr(0,4) === 'data') this.importAlarmsData[key].obj = rData[key].obj;
        else this.importAlarmsData[key].obj = null;
      }
    }
  }
  /** Parse the search trigger data from an import file to the data object needed.
   * @param  {object} rData - The search trigger data read from the import file to be parsed to the newer data object.
  **/
  theTriggers(rData) {
    let addedTime = new Date().getTime();
    for (const value of Object.values(rData)) {
      if (!value.trigger.hasOwnProperty('added')) { value.trigger.numFound = 0; value.trigger.added = addedTime++; value.trigger.lastFound=null; value.trigger.numHits = 0; }
      for (const rule of value.rules.rules) {
				rule.blockGid = new Set(rule.blockGid); rule.blockRid = new Set(rule.blockRid); rule.exclude = new Set(rule.exclude);
				rule.include = new Set(rule.include); rule.onlyGid = new Set(rule.onlyGid);
      }
      this.importTriggersData.push(value);
    }
  }
  /** Parse the search groupings data from an import file to the data object needed.
   * @param  {object} rData - The search groupings data read from the import file to be parsed to the newer data object.
  **/
  searchGroupings(rData) { for (const key of Object.keys(rData)) this.importSGroupings.push(rData[key]); }
}
