/** Class deals with any adding, removing and working with groupings.
 * @class TheGroupings ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class TheGroupings {
  /**
   * @param {string} theType - Type of grouping. Panda or Search.
   */
  constructor(theType='panda') {
    this.groups = {};                 // Object with all the data for all the groupings.
    this.groupStatus = {};            // Object for the status of each grouping.
    this.unique = 1;                  // A unique value for grouping starting at 1.
    this.startTimes = {};             // Object with all the start times for groupings.
    this.endTimes = {};               // Object with all the end times for groupings.
    this.type = theType;
  }
  /** Loads up any groupings saved in datbase.
   * @async                       - To wait for the groupings to be loaded from the database.
   * @param  {function} afterFunc - Function to call after done to send success array or error object. */
  async prepare(afterFunc) {
    let success = [], err = null;
    this.groups = {}; this.groupStatus = {}; this.unique = 1; this.startTimes = {}; this.endTimes = {};
    MYDB.getFromDB(this.type, 'grouping').then( result => {
      let i = 1;
      for (const value of result) this.groups[i++] = value;
      this.unique = result.length + 1; this.resetTimes(true); success[0] = (this.type === 'panda') ? 'All Groupings have been loaded.' : 'All Search Groupings have been loaded.';
      afterFunc(success, err);
    }, (rejected) => { err = rejected; afterFunc(success, err); } );
  }
  /** Removes data from class so memory isn't being used after a closing. */
  removeAll() { this.groups = {}; this.groupStatus = {}; this.startTimes = {}; this.endTimes = {}; }
  /** Returns the groups data.
   * @return {object} - The groups data */
  theGroups() { return this.groups; }
  /** Sets up the data for the start and end times for this grouping with the unique number.
   * @param  {number} unique - The unique number for the grouping to set times for. */
  setStartEndTimes(unique) {
    const thisGroup = this.groups[unique], startMoment = moment(thisGroup.startTime,'hh:mm A');
    const endSet = (thisGroup.endHours !== '0' || thisGroup.endMinutes !== '0');
    this.startTimes[unique] = startMoment;
    if (!endSet) this.endTimes[unique] = null; else this.endTimes[unique] = moment(startMoment).add({hour:thisGroup.endHours, minute:thisGroup.endMinutes});
  }
  /** This resets the start and end times for all the groupings for next day or first start.
   * @param  {bool} [fillStatus] - Should group status be filled in also? Only on first start. */
  resetTimes(fillStatus=true) {
    for (const key of Object.keys(this.groups)) {
      if (this.groups[key].startTime !== '') this.setStartEndTimes(key);
      if (fillStatus) this.groupStatus[key] = {'collecting':false};
    }
  }
  /** This method checks all the start times and starts groupings when necessary. */
  checkStartTimes() {
    if (isNewDay()) this.resetTimes(false); // Reset start and end times object if new day.
    if (Object.keys(this.startTimes).length > 0) { // Are there any startTimes to check?
      let thisMoment = moment();
      for (var i=0, keys=Object.keys(this.startTimes); i < keys.length; i++) {
        let startMoment = this.startTimes[keys[i]], endMoment = this.endTimes[keys[i]];
        if (!this.groupStatus[keys[i]].collecting) { // Is the group already collecting then skip check.
          if (thisMoment.isSameOrAfter(startMoment) && (!endMoment || (endMoment && thisMoment.isBefore(endMoment))) ) this.toggle(keys[i]);
        } else { // Group is collecting and has a start time so check end time
          if (!endMoment) { delete this.startTimes[keys[i]]; delete this.endTimes[keys[i]]; }
          else if (endMoment && thisMoment.isSameOrAfter(endMoment)) {
            this.toggle(keys[i]); delete this.startTimes[keys[i]]; delete this.endTimes[keys[i]];
          }
        }
        startMoment = endMoment = null;
      }
      thisMoment = null;
    }
  }
  /** Adds groupings from an array to the database usually when importing.
   * @param  {array} additions - Groupings additions to add to database. */
  importToDB(additions) { for (const newGroup of additions) { MYDB.addToDB(this.type, 'grouping', newGroup); } }
  /** Adds a grouping with the name, description and data for it.
   * @param  {string} name - Name  @param  {string} description - Description  @param  {object} additions - Data object.
   * @return {number}      - Returns the unique number for this new grouping. */
  add(name, description, additions) {
    let panda = (this.type === 'panda'), collection = (panda) ? {'pandas':{}} : {'triggers':{}}, newUnique = this.unique;
    let newGroup = {'name':name, 'description':description, ...collection, 'startTime':'', 'endHours':0, 'endMinutes':0};
    if (panda) newGroup.pandas = additions; else newGroup.triggers = additions;
    this.groups[newUnique] = newGroup;
    MYDB.addToDB(this.type, 'grouping', newGroup).then( id => { if (id >= 0) this.groups[newUnique].id = id; } );
    this.groupStatus[newUnique] = {'collecting':false};
    if (this.groups[newUnique].startTime !== '') this.setStartEndTimes(newUnique);
    return this.unique++;
  }
  /** Returns an object with the id's of the jobs filtered by type.
   * @param {bool} isPanda - Panda Groupings?  @param {string} searchType - Type to Filter.
   * @return {object}      - Filtered Jobs. */
  doInstantFilter(isPanda, searchType='isEnabled') {
    let filtered = (isPanda) ? bgPanda.pandaUniques.filter((val) => pandaUI.pandaStats[val].collecting) : bgSearch.getFrom('Search').filter((val) => bgSearch[searchType](val));
    let collection = {};
    for (let i=0, len=filtered.length; i < len; i++) {
      if (isPanda) { let info =  bgPanda.options(filtered[i]); collection[info.dbId] = {'hamMode':info.autoTGoHam}; }
      else collection[filtered[i]] = {'id':filtered[i]};
    }
    return collection;
  }
  /** Instantly create a grouping without user input for name or description.
   * @param  {bool} [andEdit] - True if user can select the panda's in the grouping after creation. */
  createInstant(andEdit=false) {
    let collection = {}, collectNum = 0, isPanda = (this.type === 'panda');
    if (!andEdit) collection = this.doInstantFilter(isPanda); collectNum = Object.keys(collection).length;
    if (collectNum && !andEdit) {
      modal = new ModalClass(); let dialogStatus = `the ${collectNum} ${(isPanda) ? 'HIT(s) collecting now' : 'enabled trigger(s)'}`;
      let body = $(`<div>Do you want to create an instant grouping for <span class='pcm-instantDialogStatus'>${dialogStatus}</span>?</div>`);
      if (!isPanda) {
        const radioGroup = $(`<div class='pcm-groupingInstantly'></div>`).appendTo(body);
        radioButtons(radioGroup, 'theTriggers', 'isEnabled', 'Enabled', true); radioButtons(radioGroup, 'theTriggers', 'isDisabled', 'Disabled');
        radioGroup.find(`input`).click( e => {
          collection = this.doInstantFilter(isPanda, $(e.target).val());
          dialogStatus = `the ${Object.keys(collection).length} ${$(e.target).closest('label').text().toLowerCase()} trigger(s)`;
          $(e.target).closest(`.modal-body`).find('.pcm-instantDialogStatus').html(dialogStatus);
        });
        radioGroup = null;
      }
      modal.showDialogModal('700px', 'Create Grouping Instantly', body, () => {
        this.add(`Grouping #${this.unique}`, `Instantly made so no description.`, collection); modal.closeModal();
      }, true, true);
      body = null;
    } else if (!andEdit) {
      modal = new ModalClass();
      modal.showDialogModal('700px', 'Create Grouping Instantly', `You can only create an instant grouping if there are panda's collecting. Start collecting the panda's you want in the group or use the create by selection menu option.`, null , false, false);
    } else if (andEdit) {
      const unique = this.add(`Grouping #${this.unique}`, 'Instantly made so no description.', collection);
      this.showgroupingEditModal(unique, () => { this.showGroupingsModal((isPanda) ? pandaUI : search); }, () => { this.delete(unique); }, () => { modal = null; });
    }
  }
  /** Delete this grouping with the unique number.
   * @async                    - To wait for the deletion of the grouping from the database.
   * @param  {number} grouping - The unique number for the grouping to be deleted. */
  async delete(grouping) {
    await MYDB.deleteFromDB(this.type, 'grouping', this.groups[grouping].id).then( null, (rejected) => console.error(rejected));
    delete this.groups[grouping]; delete this.groupStatus[grouping]; delete this.startTimes[grouping]; delete this.endTimes[grouping];
  }
  /** If grouping has more than 1 panda to start it will stagger collection so timer won't get bombarded.
   * @param  {number} grouping - Grouping Unique Number  @param  {array} keys - The array of panda dbId's to start collecting or stop. */
  delayedToggle(grouping, keys) {
    if (keys.length > 0) {
      let panda = (this.type === 'panda'), dbKey = keys.shift(), myId = (panda) ? bgPanda.getMyId(dbKey) : dbKey, collecting = this.groupStatus[grouping].collecting;
      if (collecting && panda) pandaUI.startCollecting(myId);
      else if (!collecting && panda)pandaUI.stopCollecting(myId);
      else if (!panda) { bgSearch.toggleTrigger(null, myId, collecting); search.statusMe(bgSearch.getTrigger(myId).count, (collecting) ? 'searching' : 'disabled'); }
      setTimeout( () => { this.delayedToggle(grouping, keys); }, 100 );
    }
  }
  /** Toggles the collecting status for the grouping with the unique ID.
   * @param  {number} grouping - Grouping Unique Number  @param {bool} [noCheck] - Checks all groupings jobs?  */
  toggle(grouping, noCheck=false) {
    let panda = (this.type === 'panda'), type = (panda) ? 'pandas' : 'triggers', keys = Object.keys(this.groups[grouping][type]), tr = $(`#pcm-nameDesc-${grouping}`).closest('tr');
    this.groupStatus[grouping].collecting = !this.groupStatus[grouping].collecting;
    if (this.groupStatus[grouping].collecting) tr.removeClass('pcm-groupEmpty').addClass('pcm-groupCollect');
    else { 
      if (keys.length === 0) tr.removeClass('pcm-groupCollect').addClass('pcm-groupEmpty');
      else tr.removeClass('pcm-groupCollect pcm-groupEmpty');
      delete this.startTimes[grouping]; delete this.endTimes[grouping];
    }
    if (!noCheck) Object.keys(this.groups).forEach( unique => { this.goCheckGroup(unique); });
    setTimeout( () => { this.delayedToggle(grouping, keys); }, 10 );
  }
  /** Starts collecting the panda's from the group with the unique ID only if it's not collecting already.
   * @param  {number} grouping - The unique number for the grouping to be started. */
  startCollecting(grouping) { if (!this.groupStatus[grouping].collecting) this.toggle(grouping, true); }
  /** Stops collecting the panda's from the group with the unique ID only if it's collecting right now. 
   * @param  {number} grouping - The unique number for the grouping to be stopped. */
  stopCollecting(grouping) { if (this.groupStatus[grouping].collecting) this.toggle(grouping, true); }
  /** Check all panda jobs for a grouping to make sure it's not deleted and remove from grouping if it is.
   * @param  {object} grouping - Grouping Unique Number  @param  {bool} [doToggle] - True if toggle group when all panda's collecting or not collecting. */
  goCheckGroup(grouping, doToggle=false) {
    let oneCollecting = false, allCollecting = true, theGroup = this.groupStatus[grouping], panda = (this.type === 'panda')
    let type = (panda) ? 'pandas' : 'triggers', groups = this.groups[grouping][type], update = false;
    for (const key of Object.keys(groups)) {
      let myId = (panda) ? bgPanda.getMyId(key) : (bgSearch.getTrigger(key)) ? key : undefined;
      if (myId === undefined) { update = true; delete groups[key]; }
      else if (doToggle) {
        let collecting = (panda) ? pandaUI.pandaStats[myId].collecting : bgSearch.isEnabled(myId);
        oneCollecting = (oneCollecting || collecting); allCollecting = (allCollecting && collecting);
      }
    }
    if (update) MYDB.addToDB(this.type, 'grouping', this.groups[grouping]);
    if (Object.keys(groups).length === 0) allCollecting = false;
    if (doToggle && theGroup.collecting && !oneCollecting) { theGroup.collecting = false; }
    if (doToggle && !theGroup.collecting && allCollecting) { theGroup.collecting = true; }
  }
  /** Show the groupings in a modal to toggle collecting or editing. */
  showGroupingsModal() {
    modal = new ModalClass();
    const idName = modal.prepareModal(null, '800px', 'pcm-groupingsModal', 'modal-lg', 'List Groupings', '', '', '', 'invisible', 'No', null, 'invisible', 'No', null, 'invisible', 'Close');
    const divContainer = $(`<table class='table table-dark table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).appendTo(`#${idName} .${modal.classModalBody}`);
    let df = document.createDocumentFragment(), panda = (this.type === 'panda'), gType = (panda) ? 'pandas' : 'triggers';
    Object.keys(this.groups).forEach( grouping => {
      this.goCheckGroup(grouping, true);
      const bgClass = (this.groupStatus[grouping].collecting) ? 'pcm-groupCollect' : ((Object.keys(this.groups[grouping][gType]).length === 0) ? 'pcm-groupEmpty' : '');
      displayObjectData([
        {'string':'Grouping Name and Description', 'type':'keyValue', 'key':'name', 'id':`pcm-nameDesc-${grouping}`, 'andKey':'description', 'andString':`<span class='small'>{${Object.keys(this.groups[grouping][gType]).length} ${(panda) ? 'Jobs' : 'Trigger(s)'}}</span>`, 'unique':grouping, 'clickFunc': e => { this.toggle(e.data.unique); } },
        {'btnLabel':'Edit', 'type':'button', 'addClass':' btn-xxs pcm-groupingEdit pcm-myPrimary', 'idStart':'pcm-editButton1-', 'width':'45px', 'unique':grouping, 'btnFunc': () => {
          this.showgroupingEditModal(grouping,_,_, () => {});
        }},
        {'btnLabel':'Del', 'type':'button', 'addClass':' btn-xxs pcm-groupingDelete pcm-myPrimary', 'idStart':'pcm-deleteButton1-', 'width':'45px', 'unique':grouping, 'btnFunc': (e) => {
          this.delete(grouping);
          $(e.target).closest('tr').remove();
        }},
      ], df, this.groups[grouping], true, true, true, `pcm-groupingItem ${bgClass}`); }
    );
    modal.showModal(null, () => {
      divContainer.append(df);
      df = null;
    }, () => { modal = null; });
    
  }
  /** Show grouping edit modal so user can change grouping options.
   * @param  {number} grouping       - Unique number        @param  {function} [afterFunc] - Save function  @param  {function} [cancelFunc] - Cancel function
   * @param  {function} [afterClose] - After Close Function */
  showgroupingEditModal(grouping, afterFunc=null, cancelFunc=null, afterClose=null) {
    let panda = (this.type === 'panda'), prop = (panda) ? 'pandas' : 'triggers', saved = false;
    let saveResults = savedResults => {
      const name = $(`#pcm-groupingNameI`).val(), description = $(`#pcm-groupingDescI`).val();
      savedResults.name = (name === '') ? `Grouping #${grouping}` : name;
      savedResults.description = (description === '') ? `no description` : description;
      savedResults.startTime = $(`#pcm-timepicker1`).val(); savedResults.endHours = $(`#pcm-endHours`).val(); savedResults.endMinutes = $(`#pcm-endMinutes`).val();
      this.groups[grouping] = Object.assign(this.groups[grouping], savedResults);
      saved = true; modal.closeModal();
      if (savedResults.startTime !== '') this.setStartEndTimes(grouping);
      else if (this.startTimes.hasOwnProperty(grouping)) { delete this.startTimes[grouping]; delete this.endTimes[grouping]; }
      const size = Object.keys(this.groups[grouping][prop]).length, bgClass = (size === 0) ? 'pcm-groupEmpty' : '';
      $(`#pcm-nameDesc-${grouping}`).html(`${this.groups[grouping].name} - ${this.groups[grouping].description} - <span class='small'>{${size} ${(panda) ? 'Jobs' : 'Triggers'}</span>`)
      $(`#pcm-nameDesc-${grouping}`).closest('tr').removeClass().addClass(`pcm-groupingItem ${bgClass}`).effect( 'highlight', {'color':'#3CB371'}, 1500);
      MYDB.addToDB(this.type, 'grouping', this.groups[grouping]);
      if (afterFunc !== null) setTimeout( () => { afterFunc(); }, 300 );
    }
    let checkResults = async e => {
      let dbId = (panda) ? bgPanda.options(e.data.unique).dbId : e.data.unique, inGroup = (panda) ? '.pcm-jobsInGroup:first' : '.pcm-triggersInGroup:first';
      if ($(e.target).prop('checked')) {
        $(e.target).closest('tr').effect( 'highlight', {'color':'#3CB371'}, 800, () => {
          this.groups[grouping][prop][dbId] = {'hamMode':false};
          $(e.target).closest('.modal-content').find(inGroup).text(`${(panda) ? 'Jobs' : 'Triggers'} in Groups: ${Object.keys(this.groups[grouping][prop]).length}`);
        });
      } else {
        $(e.target).closest('tr').effect( 'highlight', {'color':'#F08080'}, 800, () => {
          delete this.groups[grouping][prop][dbId];
          $(e.target).closest('.modal-content').find(inGroup).text(`${(panda) ? 'Jobs' : 'Triggers'} in Groups: ${Object.keys(this.groups[grouping][prop]).length}`);
        });
      }
    }
    let afterShow = () => {
      Object.keys(this.groups[grouping][prop]).forEach( (key) => { $(`#pcm-selection-${(panda) ? bgPanda.dbIds[key] : key}`).prop('checked', true); });
    }
    if (panda) pandaUI.showJobsModal('groupingEdit', grouping, this.groups[grouping], saveResults, checkResults, cancelFunc, afterShow, () => { if (afterClose) afterClose(); });
    else {
      let modalSearch = new ModalSearchClass();
      modalSearch.showTriggersModal('groupingEdit', grouping, this.groups[grouping], saveResults, checkResults, cancelFunc, afterShow, () => {
        if (!saved && cancelFunc) cancelFunc();
        modalSearch = null; if (afterClose) afterClose();
      });
    }
  }
}