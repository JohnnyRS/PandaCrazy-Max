/** Class deals with any adding, removing and working with groupings.
 * @class PandaGroupings
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaGroupings {
  constructor() {
    this.groups = {};                 // Object with all the data for all the groupings.
    this.groupStatus = {};            // Object for the status of each grouping.
    this.unique = 1;                  // A unique value for grouping starting at 1.
    this.startTimes = {};             // Object with all the start times for groupings.
    this.endTimes = {};               // Object with all the end times for groupings.
  }
  /** Loads up any groupings saved in datbase.
   * @async                       - To wait for the groupings to be loaded from the database.
   * @param  {function} afterFunc - Function to call after done to send success array or error object. */
  async prepare(afterFunc) {
    let success = [], err = null;
    this.groups = {}; this.groupStatus = {}; this.unique = 1; this.startTimes = {}; this.endTimes = {};
    MYDB.getFromDB('panda', 'grouping').then( (result) => {
      let i = 1;
      for (const value of result) { this.groups[i++] = value;  }
      this.unique = result.length + 1; this.resetTimes(true);
      success[0] = "All Groupings have been loaded.";
      afterFunc(success, err);
    }, (rejected) => { err = rejected; afterFunc(success, err); } );
  }
  /** Removes data from class so memory isn't being used after a closing. */
  removeAll() { this.groups = {}; this.groupStatus = {}; this.startTimes = {}; this.endTimes = {}; }
  theGroups() { return this.groups; }
  /** Sets up the data for the start and end times for this grouping with the unique number.
   * @param  {number} unique - The unique number for the grouping to set times for. */
  setStartEndTimes(unique) {
    const thisGroup = this.groups[unique], startMoment = moment(thisGroup.startTime,"hh:mm A");
    const endSet = (thisGroup.endHours!=="0" || thisGroup.endMinutes!=="0");
    this.startTimes[unique] = startMoment;
    if (!endSet) this.endTimes[unique] = null;
    else this.endTimes[unique] = moment(startMoment).add({hour:thisGroup.endHours, minute:thisGroup.endMinutes});
  }
  /** This resets the start and end times for all the groupings for next day or first start.
   * @param  {bool} [fillStatus=true] - Should group status be filled in also? Only on first start. */
  resetTimes(fillStatus=true) {
    for (const key of Object.keys(this.groups)) {
      if (this.groups[key].startTime !== "") this.setStartEndTimes(key);
      if (fillStatus) this.groupStatus[key] = {collecting:false};
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
          if (thisMoment.isSameOrAfter(startMoment) &&
            (!endMoment || (endMoment && thisMoment.isBefore(endMoment))) ) this.toggle(keys[i]);
        } else { // Group is collecting and has a start time so check end time
          if (!endMoment) { delete this.startTimes[keys[i]]; delete this.endTimes[keys[i]]; }
          else if (endMoment && thisMoment.isSameOrAfter(endMoment)) {
            this.toggle(keys[i]);
            delete this.startTimes[keys[i]]; delete this.endTimes[keys[i]]; // Delete
          }
        }
        startMoment = endMoment = null;
      }
      thisMoment = null;
    }
  }
  /** Adds groupings from an array to the database usually when importing.
   * @param  {array} additions - Groupings additions to add to database. */
  importToDB(additions) { for (const newGroup of additions) { MYDB.addToDB('panda', 'grouping', newGroup); } }
  /** Adds a grouping with the name, description and data for it.
   * @param  {string} name        - The name for this new grouping.
   * @param  {string} description - The description for this new grouping.
   * @param  {object} additions   - An object with all data for the new grouping.
   * @return {number}             - Returns the unique number for this new grouping. */
  add(name, description, additions) {
    let newGroup = {name:name, description:description, pandas:{}, startTime:"", endHours:0, endMinutes:0};
    const newUnique = this.unique;
    newGroup.pandas = additions;
    this.groups[newUnique] = newGroup;
    MYDB.addToDB('panda', 'grouping', newGroup).then( (id) => { if (id >= 0) this.groups[newUnique].id = id; } );
    this.groupStatus[newUnique] = {collecting:false};
    if (this.groups[newUnique].startTime!=="") this.setStartEndTimes(newUnique);
    return this.unique++;
  }
  /** Instantly create a grouping without user input for name or description.
   * @param  {bool} [andEdit=false] - True if user can select the panda's in the grouping after creation. */
  createInstant(andEdit=false) {
    let collection = {};
    let filtered = bgPanda.pandaUniques.filter( (val) => pandaUI.pandaStats[val].collecting);
    for (let i=0, len=filtered.length; i<len; i++) {
      let info = bgPanda.options(filtered[i]);
      collection[info.dbId] = {hamMode:info.autoTGoHam};
    }
    if (Object.keys(collection).length && !andEdit) {
      modal = new ModalClass();
      modal.showDialogModal("700px", "Create Grouping Instantly", "Do you really want to create an instant grouping for all the hits collecting now?", () => {
        this.add(`Grouping #${this.unique}`,"Instantly made so no description.", collection);
        modal.closeModal();
      }, true, true);
    } else if (!andEdit) {
      modal = new ModalClass();
      modal.showDialogModal("700px", "Create Grouping Instantly", "You can only create an instant grouping if there are panda's collecting. Start collecting the panda's you want in the group or use the create by selection menu option.", null , false, false);
    } else if (andEdit) {
      const unique = this.add("","", collection);
      this.showgroupingEditModal(unique, () => { this.showGroupingsModal(pandaUI); }, () => { this.delete(unique); }, () => { modal = null; });
    }
  }
  /** Delete this grouping with the unique number.
   * @async                    - To wait for the deletion of the panda job from the database.
   * @param  {number} grouping - The unique number for the grouping to be deleted. */
  async delete(grouping) {
    await MYDB.deleteFromDB('panda', 'grouping', this.groups[grouping].id)
    .then( null, (rejected) => console.error(rejected));
    delete this.groups[grouping]; delete this.groupStatus[grouping]; delete this.startTimes[grouping]; delete this.endTimes[grouping];
  }
  /** If grouping has more than 1 panda to start it will stagger collection so timer won't get bombarded.
   * @param  {number} grouping - The unique number for the grouping to be deleted.
   * @param  {array} keys      - The array of panda dbId's to start collecting. */
  delayedToggle(grouping, keys) {
    if (keys.length>0) {
      let pandaDbKey = keys.shift(), myId = bgPanda.getMyId(pandaDbKey);
      if (this.groupStatus[grouping].collecting) pandaUI.startCollecting(myId);
      else pandaUI.stopCollecting(myId);
      setTimeout( () => { this.delayedToggle(grouping, keys); }, 100 );
    }
  }
  /** Toggles the collecting status for the grouping with the unique ID.
   * @param  {number} grouping - The unique number for the grouping to be deleted. */
  toggle(grouping, noCheck=false) {
    const keys = Object.keys(this.groups[grouping].pandas);
    if (keys.length>0) {
      this.groupStatus[grouping].collecting = !this.groupStatus[grouping].collecting;
      if (this.groupStatus[grouping].collecting)
        $(`#pcm_nameDesc_${grouping}`).closest("tr").css("background-color", "green");
      else { 
        $(`#pcm_nameDesc_${grouping}`).closest("tr").css("background-color", (keys.length===0) ? "#800517" : "");
        delete this.startTimes[grouping]; delete this.endTimes[grouping];
      }
      if (!noCheck) Object.keys(this.groups).forEach( unique => { this.goCheckGroup(unique); });
      setTimeout( () => { this.delayedToggle(grouping, keys); }, 10 );
    }
  }
  /** Starts collecting the panda's from the group with the unique ID only if it's not collecting already.
   * @param  {number} grouping - The unique number for the grouping to be started. */
  startCollecting(grouping) { if (!this.groupStatus[grouping].collecting) this.toggle(grouping, true); }
  /** Stops collecting the panda's from the group with the unique ID only if it's collecting right now. 
   * @param  {number} grouping - The unique number for the grouping to be stopped. */
  stopCollecting(grouping) { if (this.groupStatus[grouping].collecting) this.toggle(grouping, true); }
  /** Check all panda jobs for a grouping to make sure it's not deleted and remove from grouping if it is.
   * @param  {object} grouping       - The unique number for the grouping to be deleted.
   * @param  {bool} [doToggle=false] - True if toggle group when all panda's collecting or not collecting. */
  goCheckGroup(grouping, doToggle=false) {
    let oneCollecting = false, allCollecting = true, theGroup = this.groupStatus[grouping];
    Object.keys(this.groups[grouping].pandas).forEach( (value, index, object) => {
      let myId = bgPanda.getMyId(value);
      if (myId !== undefined && doToggle) { // Make sure panda isn't deleted.
        oneCollecting = (oneCollecting || pandaUI.pandaStats[myId].collecting);
        allCollecting = (allCollecting && pandaUI.pandaStats[myId].collecting);
      } else object.splice(index,1); // If panda deleted then remove from group.
    });
    if (doToggle && theGroup.collecting && !oneCollecting) { this.stopCollecting(grouping); }
    if (doToggle && !theGroup.collecting && allCollecting) { this.startCollecting(grouping); }
  }
  /** Show the groupings in a modal to toggle collecting or editing. */
  showGroupingsModal() {
    modal = new ModalClass();
    const idName = modal.prepareModal(null, '800px', 'modal-header-info modal-lg', 'List Groupings', '', 'text-right bg-dark text-light', 'modal-footer-info', 'invisible', 'No', null, 'invisible', 'No', null, 'invisible', 'Close');
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class='table table-dark table-hover table-sm pcm_detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    let df = document.createDocumentFragment();
    Object.keys(this.groups).forEach(grouping => {
      this.goCheckGroup(grouping, true);
      const bgColor = (this.groupStatus[grouping].collecting) ? '#066306' : ((Object.keys(this.groups[grouping].pandas).length===0) ? '#800517' : '');
      displayObjectData([
        {'string':'Grouping Name and Description', 'type':'keyValue', 'key':'name', 'id':`pcm_nameDesc_${grouping}`, 'andKey':'description', 'andString':`<span class="small">{${Object.keys(this.groups[grouping].pandas).length} Jobs}</span>`, 'unique':grouping, 'clickFunc': (e) => { this.toggle(e.data.unique); }
        },
        {'btnLabel':'Edit', 'type':'button', 'addClass':' btn-xxs', 'idStart':'pcm_editButton1_', 'width':'45px', 'unique':grouping, 'btnFunc': (e) => {
          this.showgroupingEditModal(grouping,_,_, () => { });
        }},
        {'btnLabel':'Del', 'type':'button', 'addClass':' btn-xxs', 'idStart':'pcm_deleteButton1_', 'width':'45px', 'unique':grouping, 'btnFunc': (e) => {
          this.delete(grouping);
          $(e.target).closest('tr').remove();
        }}
      ], df, this.groups[grouping], true, true, bgColor); }
    );
    modal.showModal(null, () => {
      divContainer.append(df);
    }, () => { modal = null; });
    
  }
  /** Show grouping edit modal so user can change grouping options.
   * @param  {number} grouping            - The unique number for the grouping to be deleted.
   * @param  {function} [afterFunc=null]  - The function to call when saved button is clicked.
   * @param  {function} [cancelFunc=null] - The function to call when cancel button is clicked.
   * @param  {function} [afterClose=null] - The function to call when modal is closed. */
  showgroupingEditModal(grouping, afterFunc=null, cancelFunc=null, afterClose=null) {
    pandaUI.showJobsModal("groupingEdit", grouping, this.groups[grouping], (savedResults) => {
      const name = $(`#pcm_groupingNameI`).val(), description = $(`#pcm_groupingDescI`).val();;
      savedResults.name = (name==="") ? `Grouping #${grouping}` : name;
      savedResults.description = (description==="") ? `no description` : description;
      savedResults.startTime = $(`#datetimepicker1`).val();
      savedResults.endHours = $(`#pcm_endHours`).val();
      savedResults.endMinutes = $(`#pcm_endMinutes`).val();
      this.groups[grouping] = Object.assign(this.groups[grouping], savedResults);
      modal.closeModal();
      if (savedResults.startTime!=="") this.setStartEndTimes(grouping);
      else if (this.startTimes.hasOwnProperty(grouping)) { delete this.startTimes[grouping]; delete this.endTimes[grouping]; }
      const jobNumbers = Object.keys(this.groups[grouping].pandas).length;
      const bgColor = (jobNumbers>0) ? "" : "#800517";
      $(`#pcm_nameDesc_${grouping}`).html(`${this.groups[grouping].name} - ${this.groups[grouping].description} - <span class="small">{${jobNumbers} Jobs}</span>`)
      $(`#pcm_nameDesc_${grouping}`).closest("tr").css("background-color", bgColor).effect( "highlight", {color:"#3CB371"}, 1500);
      MYDB.addToDB('panda', 'grouping', this.groups[grouping]);
      if (afterFunc!==null) setTimeout( () => { afterFunc(); }, 300 );
    }, async (e) => {
      let info = bgPanda.options(e.data.unique);
      if ($(e.target).prop('checked')) {
        $(e.target).closest("tr").effect( "highlight", {color:"#3CB371"}, 800, () => {
          this.groups[grouping].pandas[info.dbId] = {hamMode:false};
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.groups[grouping].pandas).length}`);
        } );
      } else {
        $(e.target).closest("tr").effect( "highlight", {color:"#F08080"}, 800, () => {
          delete this.groups[grouping].pandas[info.dbId];
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.groups[grouping].pandas).length}`);
        } );
      }
    }, cancelFunc, () => {
      Object.keys(this.groups[grouping].pandas).forEach( 
        (key) => { $(`#pcm_selection_${bgPanda.dbIds[key]}`).prop('checked', true); });
    }, () => { if (afterClose) afterClose(); });
  }
}