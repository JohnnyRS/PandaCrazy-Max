/** This class takes care of the exporting and importing of data.
 * @class EximClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class EximClass {
  constructor() {
    this.exportPre = {'extVersion':'0', 'exportVersion':'JRJUN-0', 'jobs':0, 'Options':0, 'groupings':0, 'tabs':0, 'searchTriggers':0};
    this.tabPosition = 0;
    this.importJobData = {};
    this.importJobIds = [];
    this.importTabsData = {};
    this.importTabsIds = [];
    this.importJobsTabs = {};
    this.importOptions = {};
    this.importGroupings = [];
    this.importSGroupings = [];
    this.importSearchData = {};
    this.importAlarmsData = {};
    this.importTriggersData = [];
    this.importCompleted = false;
    this.propData = {'Options':{'func':'theOptions', 'prop':'Options'}, 'Grouping':{'func':'theGroupings', 'prop':'Grouping'}, 'Alarms':{'func':'theSoundOptions', 'prop':'SoundOptions'}, 'Tabs':{'func':'theTabs', 'prop':'Tabsdata'}, 'SearchGroupings':{'func':'searchGroupings', 'prop':'SearchGroupings'}, 'Triggers':{'func':'theTriggers', 'prop':'SearchTriggers'}};
    this.soundConvert = {'more15':'less99', 'queueFull':'fullQueue', 'loggedOut':'hasToPause', 'captchaAlarm':'captchaAlarm'};
    this.reader = new FileReader();
    this.options = {'HamCycleNumber':'hamTimer', 'cycleNumber':'mainTimer', 'cycleNumber2':'secondTimer', 'cycleNumber3':'thirdTimer', 'cycleAdding':'timerAddMore', 'cycleAutoIncrease':'timerAutoIncrease', 'cycleDecrease':'timerDecrease', 'cycleIncrease':'timerIncrease', 'savedCycleNum':'timerUsed', 'alarmVolume':'volume'};
  }
  /** Converts the amount of time set for the hit from string to seconds.
   * @param  {string} duration - The duration in a string format that mturk has for this hit.
   * @return {number}          - Returns the number in seconds. */
  secondsDuration(duration) {
    let testReg = /(\d*) (week|day|hour|minute|second)/g, totalMinutes = 0;
    let matches = Array.from(duration.matchAll(testReg));
    let min_data = {'week':10080, 'day':1440, 'hour':60, 'minute':1, 'second':0};
    for (const match of matches) { totalMinutes += min_data[match[2]] * match[1]; }
    return totalMinutes * 60;
  }
  /** Empties out all the properties for this class to reset filled in import data. */
  resetData() {
    this.tabPosition = 0;
    this.importJobData = {}; this.importTabsData = {}; this.importOptions = {}; this.importSearchData = {}; this.importJobsTabs = {};
    this.importJobIds = []; this.importTabsIds = []; this.importGroupings = []; this.importSGroupings = [];
  }
  /** Export all the data to a file with alarms or not.
   * @param  {bool} [withAlarms=false]  - Should alarm sounds be included or just the alarm options?
   * @param  {function} [doneFunc=null] - The function to call after saving file to computer. */
  async exportData(withAlarms=false, doneFunc=null) {
    let exportJobs = [], exportTabs = [], exportOptions = [], exportGrouping = [], exportAlarms = [], exportTriggers = [], exportSearchGroups = [];
    this.exportPre.extVersion = gManifestData.version;
    await bgPanda.getAllPanda(false);
    for (const key of Object.keys(bgPanda.info)) { let data = await bgPanda.dataObj(key); exportJobs.push(data); }
    exportTabs = Object.values(pandaUI.tabs.getTabInfo());
    exportOptions = globalOpt.exportOptions(); exportGrouping = groupings.theGroups(); exportAlarms = alarms.exportAlarms(withAlarms);
    exportTriggers = await bgSearch.exportTriggers();
    exportSearchGroups = await bgSearch.exportSearchGroupings();
    this.exportPre.jobs = exportJobs.length;
    saveToFile({'pre':this.exportPre, 'jobs':exportJobs, 'Tabsdata':exportTabs, 'Options':exportOptions, 'Grouping':exportGrouping, 'SearchTriggers':exportTriggers,
      'SearchGroupings':exportSearchGroups, 'SoundOptions':exportAlarms}, withAlarms, () => {
      bgPanda.nullData(false);
      if (doneFunc) doneFunc();
    });
  }
  /** Show user that the file used was not valid.
   * @param  {bool} status - True for good file or false for a bad file. */
  statusFile(status) {
    let statusText = (status) ? 'Data from file ready to be imported.' : 'Not a valid import file.';
    let colorText = (status) ? '#dbfd23' : '#ff7a7a';
    $('.pcm-importStatus').html(statusText).css('color',colorText);
    if (status) $('.pcm-importButton').removeClass('pcm-disabled').prop('disabled',false);
    else $('.pcm-importButton').addClass('pcm-disabled').prop('disabled',true);
  }
  /** Reads the data from the file to be imported and then verifies it. */
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
    } catch(e) { console.log('Not a valid import file. ',e); this.statusFile(false); }
    textData = null;
  }
  /** Starts to import the data to the program and deleting all the old data.
   * @param  {bool} [onlyAlarms=false] - Should alarm sounds only get imported? */
  async startImporting(onlyAlarms=false) {
    if (onlyAlarms) {
      await alarms.clearAlarms();
      await alarms.prepareAlarms(Object.values(this.importAlarmsData), false);
    } else {
      if (!Object.keys(this.importTabsData).length) this.importTabsData = Object.assign({}, this.importJobsTabs);
      let counters = 0, tabDbId = 1, mInfo = [], mData = []; this.tabPosition = 0;
      if (Object.keys(this.importTabsData).length > 0) {
        $('#pcm-tabbedPandas').hide();
        $('.pcm-importButton:first').append('.');
        await bgPanda.removeAll(false);
        await bgSearch.removeAll();
        bgPanda.closeDB(); bgSearch.closeDB(); // Must close DB before deleting and recreating stores.
        await bgPanda.recreateDB(); // Recreate database and stores.
        await globalOpt.prepare( (_, bad) => { if (bad) showMessages(null,bad); } );
        await alarms.prepareAlarms(Object.values(this.importAlarmsData), false);
        await groupings.prepare( (_, bad) => { if (bad) showMessages(null,bad); } );
        $('.pcm-importButton:first').append('.');
        globalOpt.importOptions(this.importOptions);
        for (const key of Object.keys(this.importTabsData)) {
          $('.pcm-importButton:first').append('.');
          let active = (counters++ === 0) ? true : false;
          let theTitle = (this.importTabsData[key].title !== '') ? this.importTabsData[key].title : ((this.tabPosition === 0) ? 'Main' : `tab #${this.tabPosition}`);
          tabDbId = await pandaUI.tabs.addFromDB({'title':theTitle, 'list':this.importTabsData[key].list, 'position':this.tabPosition++}, active);
          pandaUI.tabs.hideContents();
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
      await bgPanda.addToDB(mInfo, true);
      let newPositions = {}, triggers = [], options = [], rules = [], addedTime = new Date().getTime();
      for (let i = 0, len = mInfo.length; i < len; i++) {
        if (mInfo[i].search) {
          let value = (mInfo[i].search === 'rid') ? mInfo[i].reqId : mInfo[i].groupId;
          if (value) {
            triggers.push({'type':mInfo[i].search, 'value':value, 'pDbId':mInfo[i].id, 'searchUI':false, 'pandaId':mInfo[i].myId, 'name':mInfo[i].reqName, 'disabled':true, 'numFound':0, 'added':addedTime + i, 'lastFound':null});
            options.push({'duration':0, 'once':mInfo[i].once, 'limitNumQueue':mInfo[i].limitNumQueue, 'limitTotalQueue':mInfo[i].limitTotalQueue, 'limitFetches':mInfo[i].limitFetches, 'autoGoHam':false, 'tempGoHam':0, 'acceptLimit':0});
            let ruleSet = Object.assign({}, bgSearch.ruleSet, mData[i].rules)
            rules.push({rules:[ruleSet], 'ruleSet':0});
          }
        }
        if (!newPositions[mInfo[i].tabUnique]) newPositions[mInfo[i].tabUnique] = [];
        newPositions[mInfo[i].tabUnique].push(mInfo[i].id);
        for (const group of this.importGroupings) {
          if (group.grouping && group.grouping.includes(mData[i].myId)) group.pandas[mInfo[i].id] = group.delayed.includes(mData[i].myId);
        }
      }
      if (triggers.length) await bgSearch.saveToDatabase(triggers, options, rules,_, true);
      let triggerData = this.importTriggersData;
      let imTriggers = [], imOptions = [], imRules = [], imHistory = [], counter = 1;
      if (triggerData.length) {
        for (const data of this.importTriggersData) {
          delete data.trigger.id; delete data.options.dbId; delete data.rules.dbId;
          let older = data.history.hasOwnProperty('gids'), gidsObject = (older) ? data.history.gids : data.history, numHits = -1, historyGids = {};
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
        await bgSearch.saveToDatabase(imTriggers, imOptions, imRules, imHistory, true);
      }
      for (const group of this.importGroupings) { delete group.grouping; delete group.delayed; }
      groupings.importToDB(this.importGroupings);
      sGroupings.importToDB(this.importSGroupings);
      let tabUniques = pandaUI.tabs.getUniques();
      for (const unique of tabUniques) { if (newPositions[unique]) pandaUI.tabs.setpositions(unique, newPositions[unique]); }
    }
  }
  /** Shows the import modal for user to select a file to import. */
  importModal() {
    modal = new ModalClass();
    const idName = modal.prepareModal(null, '800px', 'pcm-importModal', 'modal-lg', 'Import Data', '<h4>Import saved data from an exported file.</h4>', '', '', 'invisible', 'No', null, 'invisible', 'No', null, 'invisible', 'Close');
    modal.showModal(null, () => {
      let df = document.createDocumentFragment();
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        createCheckBox(df, 'Import only alarm sounds: ', 'pcm-importAlarms', 'alarmsYes', false, ' pcm-importCheckbox mt-3');
        let inputContainer = $(`<div class='col-xs-12 pcm-fileInput'></div>`).appendTo(df);
        createFileInput(inputContainer);
        $(`<div id='pcm-importCheck'></div>`).appendTo(df);
        $(`<div class='pcm-importStatus'>&nbsp;</div>`).appendTo(df);
        $('<div></div>').append($(`<button class='pcm-importButton pcm-disabled'>Import Data From File</button>`).prop('disabled',true)).appendTo(df);
        $(`#${idName} .${modal.classModalBody}`).append(df);
        $('.custom-file-input').on('change', (e) => {
          const fileName = $(e.target).val().replace('C:\\fakepath\\', '');
          $(e.target).next('.custom-file-label').addClass('selected').html(fileName);
          this.reader.onload = () => this.readData();
          this.reader.readAsBinaryString($(e.target).prop('files')[0]);
          this.reader.onerror = () => { console.log('can not read the file'); }
        });
        $('.pcm-importButton:first').on('click', async (e) => {
          if (!this.importCompleted) {
            $(e.target).html('Please Wait: Importing').css('color','white').prop('disabled',true); bgSearch.importing();
            await this.startImporting($('#pcm-importAlarms').prop('checked'));
            await delay(100);
            $('.custom-file-input').off('change');
            $(e.target).html('Importing completed. Click to restart!').css({'backgroundColor':'#00FF7F','color':'#000c9c', 'fontWeight':'bold'}).prop('disabled',false);
            this.reader.abort();
            this.reader = null; this.importCompleted = true; this.resetData();
          } else modal.closeModal();
        });
        inputContainer = null;
      }
      df = null;
    }, () => { modal = null; if (this.importCompleted) { bgSearch.importingDone(); window.location.reload(); } });
  }
  /** Shows the export modal for user to choose to export alarm sounds or not. */
  exportModal() {
    modal = new ModalClass();
    const idName = modal.prepareModal(null, '800px', 'pcm-exportModal', 'modal-lg', 'Export Data', '<h4>Export data to a file for importing later.</h4>', '', '', 'invisible', 'No', null, 'invisible', 'No', null, 'invisible', 'Close');
    modal.showModal(null, () => {
      let df = document.createDocumentFragment();
      $(`<h4 class='small mt-3'>Any added jobs, tabs, groupings and all options will be exported.<br />Only the alarm options will be saved unless you click the checkbox to save alarm sounds.<br />Saving alarm sounds will create a larger exported file so only do it when you add new sounds.</div>`).css('color','cyan').appendTo(df);
      createCheckBox(df, 'Export alarm sounds too: ', 'pcm-exportAlarmsToo', 'alarmsYes', false, ' mt-3');
      $(`<div class='mt-4'></div>`).append($(`<button class='pcm-exportButton'>Export Your Data To A File</button>`)).appendTo(df);
      $(`#${idName} .${modal.classModalBody}`).append(df);
      $('.pcm-exportButton:first').on('click', (e) => {
        $(e.target).html('Please Wait: Exporting').css('color','white').prop('disabled',true);
        this.exportData($('#pcm-exportAlarmsToo').prop('checked'), async () => {
          await delay(500);
          modal.closeModal();
        });
      });
    }, () => { modal = null; });
  }
  /** Validates the job data in the file to be imported.
   * @param  {object} data - The job data found in the import file.
   * @param  {string} type - The version of the import file. */
  async checkJobs(data, type) {
    let jobData = null;
    $('#pcm-importCheck .jobs').html('Job Data - Checking').css('color','#e4aeae');
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
      $('#pcm-importCheck .jobs').html('Job Data - Verified').css('color','#00fb00');
      return true;
    } else return false;
  }
  /** Checks the properties from an import data and then calls the specific function for it.
   * @param  {object} data           - Import data @param  {string} version       - Import version @param  {string} type - Property Id
   * @param  {string} [typeClass=''] - Class name  @param  {string} [typeText=''] - Import name */
  async checkProps(data, version, type, typeClass='', typeText='') {
    $(`#pcm-importCheck .${typeClass}`).html(`${typeText} Data - Checking`).css('color','#e4aeae');
    await delay(300);
    let prop = this.propData[type].prop;
    if (type === 'Tabs' && data.hasOwnProperty(prop)) { for (const tab of data.Tabsdata) { this.theTabs(tab, version); } }
    else if (type !== 'Tabs') this[this.propData[type].func]((data[prop]) ? data[prop] : {}, version);
    if (data.hasOwnProperty(prop)) $(`#pcm-importCheck .${typeClass}`).html(`${typeText} Data - Verified`).css('color','#00fb00');
    else $(`#pcm-importCheck .${typeClass}`).html(`${typeText} Data - None`).css('color','#FFA07A');
  }
  /** Parse job data read from a newer import file to the data object needed.
   * @param  {object} rData - The job data read from the import file to be parsed to the newer data object. */
  async newerImportsJobs(rData) {
    if (Object.keys(this.importTabsData).length > 0) {
      if (!Object.keys(this.importTabsData).includes(rData.tabUnique.toString())) rData.tabUnique = pandaUI.tabs.currentTab;
    } else {
      if (this.importJobsTabs[rData.tabUnique]) this.importJobsTabs[rData.tabUnique].list.push(rData.id);
      else { this.importJobsTabs[rData.tabUnique] = {'title': '',list:[rData.id], 'id':rData.tabUnique}; this.tabPosition++; }
    }
    let hamD = (!rData.hamDuration) ? globalOpt.getHamDelayTimer() : rData.hamDuration;
		if (typeof rData.dateAdded === 'string') rData.dateAdded = new Date(rData.dateAdded).getTime();
    let dO = dataObject(rData.groupId, rData.description, rData.title, rData.reqId, rData.reqName, rData.price, rData.hitsAvailable, rData.assignedTime, rData.expires, rData.friendlyTitle, rData.friendlyReqName);
    let oO = optObject(rData.once, rData.search, rData.tabUnique, rData.limitNumQueue, rData.limitTotalQueue, rData.limitFetches, rData.duration, rData.autoGoHam, hamD, rData.acceptLimit, rData.day, rData.weight, rData.dailyDone);
    this.importSearchData[rData.id] = {'rules':{}, 'history':{}};
    this.importJobIds.push(rData.id);
    this.importJobData[rData.id] = {'data':dO, 'options':oO, 'dateAdded':rData.dateAdded, 'totalSeconds':rData.totalSeconds, 'totalAccepted':rData.totalAccepted};
  }
  /** Parse job data read from an older import file to the data object needed.
   * @param  {object} rData - The job data read from the import file to be parsed to the newer data object. 
   * @param  {number} key   - The key used for this job data in the older import format.
   * @param  {string} type  - The version of the import file. */
  olderImportsJobs(rData, key, type) {
    let firstOne = (rData.requesterName && ['JRSep','JRAPR'].includes(rData.requesterName.substring(0,5))) ? true : false;
    if (!firstOne && (rData.groupId || rData.requesterId)) {
      if (type === 'PCOLDER') rData.tabNumber++;
      if (Object.keys(this.importTabsData).length > 0) {
        if (!Object.keys(this.importTabsData).includes(rData.tabNumber.toString())) rData.tabNumber = pandaUI.tabs.currentTab;
      } else {
        if (this.importJobsTabs[rData.tabNumber]) this.importJobsTabs[rData.tabNumber].list.push(key);
        else { this.importJobsTabs[rData.tabNumber] = {'title': '',list:[key], 'id':rData.tabNumber}; this.tabPosition++; }
      }
      let totalSeconds = 0, duration = rData.duration, search = null;
      if (duration !== '' && duration !== '0') { totalSeconds = this.secondsDuration(duration); }
      if (rData.action.toLowerCase().indexOf('search') !== -1) search = 'rid';
      if (!rData.dateAdded) rData.dateAdded = new Date().getTime();
      if (typeof rData.dateAdded === 'string') rData.dateAdded = new Date(rData.dateAdded).getTime();
      let hamD = (!rData.hamTimer) ? globalOpt.getHamDelayTimer() : rData.hamTimer * 1000;
      let minutesOff = (rData.secondsOff > 0) ? Math.round(rData.secondsOff / 60) : 0;
      let dO = dataObject(rData.groupId, rData.title, rData.title, rData.requesterId, rData.requesterName, rData.pay,_, totalSeconds,_, rData.friendlyTitle, rData.friendlyRName);
      let oO = optObject(rData.once, search, rData.tabNumber, rData.queueHitLimit, rData.queueLimit,_, minutesOff, rData.stickyDelayedHam, hamD, rData.dailyLimit,_, rData.weight);
      let searchRules = (rData.hasOwnProperty('searchData')) ? rData.searchData.searchOptions : {};
      let excludes = (searchRules.hasOwnProperty('excludeGID') && searchRules.excludeGID.length > 0) ? searchRules.excludeGID[0].split(/\s*,\s*/) : [];
      let rO = sRulesObject(excludes,_, searchRules.excludeTerm, searchRules.includeTerm, searchRules.minReward, searchRules.maxReward);
      let history = ('searchData' in rData && 'theHistory' in rData.searchData) ? rData.searchData.theHistory : {}, fullHist = {};
      if (Object.keys(history).length > 0) {
        for (const key2 of Object.keys(history)) {
          let info = history[key2].info;
          let hO = sHistoryObject(info.requesterName, info.requesterId, info.pay, info.title, info.description, info.duration, history[key2].date);
          fullHist[key2] = hO;
        }
      }
      this.importSearchData[key.toString()] = {'rules':rO, 'history':fullHist}; this.importJobIds.push(key);
      this.importJobData[key.toString()] = {'data':dO, 'options':oO, 'dateAdded':rData.dateAdded, 'totalSeconds':0, 'totalAccepted':0};
    }
  }
  /** Parse tab data read from an import file to the data object needed.
   * @param  {object} rData   - The tab data read from the import file to be parsed to the newer data object.
   * @param  {string} version - Is exported data old or new? */
  theTabs(rData, version) {
    if (version === 'PCOLD') this.importTabsData[rData.tabNumber.toString()] = {'title':rData.tabName, 'list':rData.positions, 'id':rData.tabNumber};
    else this.importTabsData[rData.id.toString()]= rData;
  }
  /** Parse option data read from an import file to the data object needed.
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object. */
  theOptions(rData) {
    if (Array.isArray(rData)) {
      for (const cat of ['general', 'timers', 'alarms', 'helpers', 'search']) {
        let count = arrayCount(rData, (item) => {
          if (item.category === cat) { this.importOptions[cat] = Object.assign({}, globalOpt[cat + 'Default'], item); return true; } else return false;
        }, true);
        if (count === 0) { this.importOptions[cat] = Object.assign({}, globalOpt[cat + 'Default']); }
      }
    } else {
      let tempOptions = {'generalDefault':{}, 'timersDefault':{}, 'alarmsDefault':{}, 'helpersDefault':{}, 'searchDefault':{}};
      for (const key of Object.keys(rData)) {
        let keyName = (this.options.hasOwnProperty(key)) ? this.options[key] : key, optionName = null;
        if (globalOpt['generalDefault'].hasOwnProperty(keyName)) optionName = 'generalDefault';
        if (globalOpt['timersDefault'].hasOwnProperty(keyName)) optionName = 'timersDefault';
        if (globalOpt['alarmsDefault'].hasOwnProperty(keyName)) optionName = 'alarmsDefault';
        if (globalOpt['helpersDefault'].hasOwnProperty(keyName)) optionName = 'helpersDefault';
        if (globalOpt['searchDefault'].hasOwnProperty(keyName)) optionName = 'searchDefault';
        if (optionName) tempOptions[optionName][keyName] = rData[key];
      }
      this.importOptions.general = Object.assign({}, globalOpt['generalDefault'], tempOptions['generalDefault']);
      this.importOptions.timers = Object.assign({}, globalOpt['timersDefault'], tempOptions['timersDefault']);
      this.importOptions.alarms = Object.assign({}, globalOpt['alarmsDefault'], tempOptions['alarmsDefault']);
      this.importOptions.helpers = Object.assign({}, globalOpt['helpersDefault'], tempOptions['helpersDefault']);
      this.importOptions.search = Object.assign({}, globalOpt['searchDefault'], tempOptions['searchDefault']);
    }
    let hamDelayTimer = this.importOptions.timers.hamDelayTimer, hamRange = globalOpt.getTimerHamRange();
    if (hamDelayTimer < hamRange.min || hamDelayTimer > hamRange.max) this.importOptions.timers.hamDelayTimer = globalOpt.timersDefault.hamDelayTimer;
  }
  /** Parse the groupings data from an import file to the data object needed.
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object. */
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
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object. */
  theSoundOptions(rData) {
    if (rData.captchaAlarm) {
      let defaultAlarms = alarms.theDefaultAlarms();
      for (const key of Object.keys(rData)) {
        this.importAlarmsData[key] = Object.assign(defaultAlarms[key], rData[key]);
        if (!rData[key].obj) {
          let audio = alarms.theAlarms(key).audio;
          if (audio === null) this.importAlarmsData[key].obj = null;
          else if (audio.src.substr(0,4) === 'data') this.importAlarmsData[key].obj = audio.src;
        } else if (rData[key].obj.substr(0,4) === 'data') this.importAlarmsData[key].obj = rData[key].obj;
        else this.importAlarmsData[key].obj = null;
      }
    }
  }
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
  searchGroupings(rData) { for (const key of Object.keys(rData)) this.importSGroupings.push(rData[key]); }
}