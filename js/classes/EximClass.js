/** This class takes care of the exporting and importing of data.
 * @class EximClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class EximClass {
  constructor() {
    this.exportPre = {'extVersion':'0', 'exportVersion':'JRJUN-0', 'jobs':0, 'opt':0, 'groupings':0, 'tabs':0};
    this.tabPosition = 0;
    this.importJobData = {};
    this.importJobIds = [];
    this.importTabsData = {};
    this.importTabsIds = [];
    this.importJobsTabs = {};
    this.importOptions = {};
    this.reader = new FileReader();
    this.options = {'HamCycleNumber':'hamTimer', 'cycleNumber':'mainTimer', 'cycleNumber2':'secondTimer', 'cycleNumber3':'thirdTimer', 'cycleAdding':'timerAddMore', 'cycleAutoIncrease':'timerAutoIncrease', 'cycleDecrease':'timerDecrease', 'cycleIncrease':'timerIncrease', 'savedCycleNum':'timerUsed', 'alarmVolume':'volume'};
  }
  /** Export the data to a file. */
  async exportData() {
    let exportJobs = [];
    this.exportPre.extVersion = gManifestData.version;
    await bgPanda.getAllPanda(false);
    for (const key of Object.keys(bgPanda.info)) { let data = await bgPanda.dataObj(key); exportJobs.push(data); }
    this.exportPre.jobs = exportJobs.length;
    saveToFile({'pre':this.exportPre, 'jobs':exportJobs});
    bgPanda.nullData(false);
  }
  /** Show user that the file used was not valid. */
  badFile() {
    $('.pcm_importStatus').html('Not a valid import file.').css('color','#ff7a7a');
    $('.pcm_importButton').addClass('disabled').prop("disabled",true);
  }
  /** Show user that the file was valid and now ready to be imported. */
  goodFile() {
    $('.pcm_importStatus').html('Data from file ready to be imported.').css('color','#dbfd23');
    $('.pcm_importButton').removeClass('disabled').prop("disabled",false);
  }
  /** Validates the tab data in the file to be imported.
   * @param  {object} data - The tab data found in the import file.
   * @param  {string} type - The version of the import file. */
  async checkTabs(data, type) {
    $('#pcm_importCheck .tabs').html('Tabs Data - Checking').css('color','#e4aeae');
    await delay(500);
    if (type !== 'PCOLDER' && data.hasOwnProperty('Tabsdata')) {
      for (const tab of data.Tabsdata) {
        if (type === 'PCOLD') this.olderImportTabs(tab);
        else this.newerImportTabs(tab);
      }
      $('#pcm_importCheck .tabs').html('Tabs Data - Verified').css('color','#00fb00');
    } else $('#pcm_importCheck .tabs').html('Tabs Data - None').css('color','#00fb00');
  }
  /** Validates the job data in the file to be imported.
   * @param  {object} data - The job data found in the import file.
   * @param  {string} type - The version of the import file. */
  async checkJobs(data, type) {
    let jobData = null;
    $('#pcm_importCheck .jobs').html('Job Data - Checking').css('color','#e4aeae');
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
      await delay(600);
      $('#pcm_importCheck .jobs').html('Job Data - Verified').css('color','#00fb00');
      return true;
    } else return false;
  }
  /** Validates the option data in the file to be imported.
   * @param  {object} data - The option data found in the import file.
   * @param  {string} type - The version of the import file. */
  async checkOptions(data, type) {
    $('#pcm_importCheck .options').html('Options Data - Checking').css('color','#e4aeae');
    await delay(600);
    if (data.hasOwnProperty('Options')) {
      this.olderOptions(data.Options);
      $('#pcm_importCheck .options').html('Options Data - Verified').css('color','#00fb00');
    } else $('#pcm_importCheck .options').html('Options Data - None').css('color','#00fb00');
  }
  /**
   * @param  {object} data - The groupings data found in the import file.
   * @param  {string} type - The version of the import file. */
  async checkGroupings(data, type) {
    $('#pcm_importCheck .groupings').html('Groupings Data - Checking').css('color','#e4aeae');
    await delay(600);
    if (data.hasOwnProperty('Grouping')) {
      console.log(JSON.stringify(data.Grouping));
      $('#pcm_importCheck .groupings').html('Groupings Data - Verified').css('color','#00fb00');
    } else $('#pcm_importCheck .options').html('Groupings Data - None').css('color','#00fb00');
  }
  /** Reads the data from the file to be imported and then verifies it. */
  async readData() {
    let textData = this.reader.result;
    $('.pcm_importStatus').html('');
    $('#pcm_importCheck').html(`<div class='tabs'></div><div class='jobs'></div><div class='options'></div><div class='groupings'></div></div>`);
    this.importJobData = {}; this.tabPosition = 0; this.importJobsTabs = {};
    this.importJobIds = []; this.importTabsIds = []; this.importTabsData = {};
    // try {
      if (textData) {
        let data = JSON.parse(textData), theType = '';
        if (data.hasOwnProperty('pre') && data.pre.exportVersion === 'JRJUN-0') theType = 'PCM';
        else if (data.hasOwnProperty('Requesters') && /JRAPR(-?)16/.test(data.Requesters[0].requesterName)) theType = 'PCOLD';
        else if (Array.isArray(data) && data[0].requesterName === 'JRSep-1.0') theType = 'PCOLDER';
        if (theType !== '' ) {
          await this.checkTabs(data, theType);
          await this.checkJobs(data, theType);
          await this.checkOptions(data, theType);
          await this.checkGroupings(data, theType);
          this.goodFile();
        } else { this.badFile(); }
        data = null;
      }
    // } catch(e) {
    //   console.log('Not a valid import file. ',e); this.badFile();
    // }
    textData = null;
  }
  /** Starts to import the data to the program and deleting all the old data. */
  async startImporting() {
    if (!Object.keys(this.importTabsData).length) this.importTabsData = Object.assign({}, this.importJobsTabs);
    let counters = 0, tabDbId = 1, mData = []; this.tabPosition = 0;
    console.time('start');
    if (Object.keys(this.importTabsData).length > 0) {
      $('.pcm_importButton:first').append('.');
      await bgPanda.removeAll(true); // Remove all panda jobs first.
      pandaUI.tabs.wipeTabs(); // Remove all tabs.
      bgPanda.db.closeDB(); // Must close DB before deleting and recreating stores.
      await bgPanda.openDB(true); // Recreate database and stores.
      await globalOpt.prepare( (_, bad) => { if (bad) showMessages(null,bad); } );
      await alarms.prepare( (_, bad) => { if (bad) showMessages(null,bad); } );
      await groupings.prepare( (_, bad) => { if (bad) showMessages(null,bad); } );
      $('.pcm_importButton:first').append('.');
      for (const key of Object.keys(this.importTabsData)) {
        $('.pcm_importButton:first').append('.');
        let active = (counters++ === 0) ? true : false;
        let theTitle = (this.importTabsData[key].title !== '') ? this.importTabsData[key].title : ((this.tabPosition === 0) ? 'Main' : `tab #${this.tabPosition}`);
        tabDbId = await pandaUI.tabs.addFromDB({'title':theTitle, 'list':[], 'position':this.tabPosition++}, active);
        pandaUI.tabs.hideContents();
        for (const dbId of this.importTabsData[key].list) {
          if (this.importJobData.hasOwnProperty(dbId)) {
            this.importJobIds = arrayRemove(this.importJobIds, dbId);
            let job = this.importJobData[dbId];
            job.options.tabUnique = Number(tabDbId);
            let dbInfo = {...job.data, ...job.options, 'dateAdded': job.dateAdded, 'totalSeconds':job.totalSeconds, 'totalAccepted':job.totalAccepted};
            mData.push(dbInfo);
            job = null;
          } else console.log('dbId not found: ',dbId);
        }
      }
    }
    console.log('orphans: ',JSON.stringify(this.importJobIds));
    if (this.importJobIds.length > 0) {
      for (const dbId of this.importJobIds) {
        let job = this.importJobData[dbId];
        job.options.tabUnique = 1;
        let dbInfo = {...job.data, ...job.options, 'dateAdded': job.dateAdded, 'totalSeconds':job.totalSeconds, 'totalAccepted':job.totalAccepted};
        mData.push(dbInfo);
        job = null;
      }
    }
    await bgPanda.addToDB(mData, true);
    for (const data of mData) { await bgPanda.addPanda(data, false, {}, false); }
    pandaUI.tabs.showContents(); bgPanda.nullData(); mData = null;
    console.timeEnd('start');
  }
  /** Shows the import modal for user to select a file to import. */
  importModal() {
    modal = new ModalClass();
    const idName = modal.prepareModal(null, "800px", "modal-header-info modal-lg", "Import Data", "<h4>Import saved data from an exported file.</h4>", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "invisible", "Close");
    modal.showModal(null, () => {
      let df = document.createDocumentFragment();
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        let inputContainer = $(`<div class='col-xs-12 pcm_fileInput'></div>`).appendTo(df);
        createFileInput(inputContainer);
        $(`<div id='pcm_importCheck'></div>`).appendTo(df);
        $(`<div class='pcm_importStatus'>&nbsp;</div>`).appendTo(df);
        $('<div></div>').append($(`<button class='pcm_importButton disabled'>Import Data From File</button>`).prop("disabled",true)).appendTo(df);
        $(`#${idName} .${modal.classModalBody}`).append(df);
        $('.custom-file-input').on('change', (e) => {
          const fileName = $(e.target).val().replace('C:\\fakepath\\', '');
          const theFile = $(e.target).prop("files")[0];
          $(e.target).next('.custom-file-label').addClass("selected").html(fileName);
          this.reader.onload = () => this.readData();
          this.reader.readAsBinaryString(theFile);
          this.reader.onerror = () => { console.log('can not read the file'); }
        })
        $('.pcm_importButton:first').on('click', async (e) => {
          $(e.target).html('Please Wait: Importing').prop("disabled",true);
          await this.startImporting();
          await delay(200);
          $(e.target).off('click'); $('.custom-file-input').off('change');
          this.reader = null;
          modal.closeModal();
        });
        inputContainer = null;
      }
      df = null;
    }, () => { modal = null; });
  }
  /** Converts the amount of time set for the hit from string to seconds.
   * @param  {string} duration - The duration in a string format that mturk has for this hit. */
  secondsDuration(duration) {
    let testReg = /(\d*) (week|day|hour|minute|second)/g, totalMinutes = 0;
    let matches = Array.from(duration.matchAll(testReg));
    let min_data = {'week':10080, 'day':1440, 'hour':60, 'minute':1, 'second':0};
    for (const match of matches) { totalMinutes += min_data[match[2]] * match[1]; }
    return totalMinutes * 60;
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
    let hamD = (rData.hamDuration === 0) ? globalOpt.getHamDelayTimer() : 0;
    let dO = dataObject(rData.groupId, rData.description, rData.title, rData.reqId, rData.reqName, rData.price, rData.hitsAvailable, rData.assignedTime, rData.expires, rData.friendlyTitle, rData.friendlyReqName);
    let oO = optObject(rData.once, rData.search, rData.tabUnique, rData.limitNumQueue, rData.limitTotalQueue, rData.limitFetches, rData.duration, rData.autoGoHam, hamD, rData.acceptLimit, rData.day, rData.weight, rData.dailyDone);
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
      let hamD = (rData.hamTimer === 0) ? globalOpt.getHamDelayTimer() : 0;
      let minutesOff = (rData.secondsOff > 0) ? Math.round(rData.secondsOff / 60) : 0;
      let dO = dataObject(rData.groupId, rData.title, rData.title, rData.requesterId, rData.requesterName, rData.pay,_, totalSeconds,_, rData.friendlyTitle, rData.friendlyRName);
      let oO = optObject(rData.once, search, rData.tabNumber, rData.queueHitLimit, rData.queueLimit,_, minutesOff, rData.stickyDelayedHam, hamD, rData.dailyLimit,_, rData.weight);
      this.importJobIds.push(key);
      this.importJobData[key.toString()] = {'data':dO, 'options':oO, 'dateAdded':rData.dateAdded, 'totalSeconds':0, 'totalAccepted':0};
    } else if (!rData.requesterName) { console.log(JSON.stringify(rData)); }
  }
  /** Parse tab data read from a newer import file to the data object needed.
   * @param  {object} rData - The tab data read from the import file to be parsed to the newer data object. */
  newerImportTabs(rData) {
    this.importTabsData[rData.id.toString()]= rData;
  }
  /** Parse tab data read from an older import file to the data object needed.
   * @param  {object} rData - The tab data read from the import file to be parsed to the newer data object. */
  olderImportTabs(rData) {
    this.importTabsData[rData.tabNumber.toString()] = {'title':rData.tabName, 'list':rData.positions, 'id':rData.tabNumber};
  }
  /** Parse option data read from an older import file to the data object needed.
   * @param  {object} rData - The option data read from the import file to be parsed to the newer data object. */
  olderOptions(rData) {
    let tempOptions = {'generalDefault':{}, 'timersDefault':{}, 'alarmsDefault':{}};
    for (const key of Object.keys(rData)) {
      let keyName = (this.options.hasOwnProperty(key)) ? this.options[key] : key, optionName = null;
      if (globalOpt['generalDefault'].hasOwnProperty(keyName)) optionName = 'generalDefault';
      if (globalOpt['timersDefault'].hasOwnProperty(keyName)) optionName = 'timersDefault';
      if (globalOpt['alarmsDefault'].hasOwnProperty(keyName)) optionName = 'alarmsDefault';
      if (optionName) tempOptions[optionName][keyName] = rData[key];
      else console.log('Missing option: ',key);
    }
    console.log(JSON.stringify(tempOptions));
    this.importOptions.general = Object.assign({}, globalOpt['generalDefault'], tempOptions['generalDefault']);
    this.importOptions.timers = Object.assign({}, globalOpt['timersDefault'], tempOptions['timersDefault']);
    this.importOptions.alarms = Object.assign({}, globalOpt['alarmsDefault'], tempOptions['alarmsDefault']);
  }
}