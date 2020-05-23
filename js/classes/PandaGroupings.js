class PandaGroupings {
  constructor() {
    this.groups = {};        // 
    this.groupStatus = {};
    this.unique = 1;
    this.startTimes = {};
    this.endTimes = {};
		this.thisDay = moment().date();
  }
  setStartEndTimes(unique) {
    const thisGroup = this.groups[unique], startMoment = moment(thisGroup.startTime,"hh:mm A");
    const endSet = (thisGroup.endHours!=="0" || thisGroup.endMinutes!=="0");
    this.startTimes[unique] = startMoment;
    if (!endSet) this.endTimes[unique] = null;
    else this.endTimes[unique] = moment(startMoment).add({hour:thisGroup.endHours, minute:thisGroup.endMinutes});
}
  resetTimes(fillStatus=true) {
    for (var i=0, keys=Object.keys(this.groups); i < keys.length; i++) {
      if (this.groups[keys[i]].startTime !== "") this.setStartEndTimes(keys[i]);
      if (fillStatus) this.groupStatus[i] = {collecting:false};
    }
  }
  /**
   * Loads up any groupings saved in datbase.
   * Saves any errors from trying to add to database and then sends a reject.
   * Sends success array with messages and error object from any rejects to afterFunc.
   * @param  {function} afterFunc   Function to call after done to send success array or error object.
   */
  async prepare(afterFunc) {
    // Gets groupings from the database
    let success = [], err = null;
    await bgPanda.db.getFromDB(bgPanda.groupingStore, null, true,
        async (cursor, index) => { return {[index]:cursor.value}; }, false) // Return object for cursor.
    .then( async (result) => {
      if (Object.keys(result).length !== 0) { // If there are groupings saved then load them up!
        this.groups = result; this.unique = Object.keys(result).length + 1;
        this.resetTimes(true);
      }
      success[0] = "All Groupings have been loaded.";
    }, (rejected) => err = rejected );
    afterFunc.call(this, success, err);
  }
  checkStartTimes() {
    let day = moment().date();
    if (this.thisDay != day) this.resetTimes(false); // Reset start and end times object if new day.
    this.thisDay = day; // Save day to compare for next day detection.
    if (Object.keys(this.startTimes).length > 0) { // Are there any startTimes to check?
      const thisMoment = moment();
      for (var i=0, keys=Object.keys(this.startTimes); i < keys.length; i++) {
        const startMoment = this.startTimes[keys[i]], endMoment = this.endTimes[keys[i]];
        if (!this.groupStatus[keys[i]].collecting) { // Is the group already collecting then skip check.
          // Get the start time and find out if there is a end time.
          if (thisMoment.isSameOrAfter(startMoment) &&
            (!endMoment || (endMoment && thisMoment.isBefore(endMoment))) ) this.toggle(keys[i]);
        } else { // Group is collecting and has a start time so check end time
          if (!endMoment) { delete this.startTimes[keys[i]]; delete this.endTimes[keys[i]]; }
          else if (endMoment && thisMoment.isSameOrAfter(endMoment)) {
            this.toggle(keys[i]);
            delete this.startTimes[keys[i]]; delete this.endTimes[keys[i]]; // Delete
          }
        }
      }
    }
  }
  addGroup(group, myIdInfo) { group[myIdInfo[0]] = {hamMode:myIdInfo[1]}; }
  add(name, description, additions, delayedStart=false) {
    let newGroup = {name:name, description:description, pandas:{}, sorted:[], startTime:"", endHours:0, endMinutes:0};
    const newUnique = this.unique;
    newGroup.pandas = additions;
    Object.keys(additions).forEach(key => { newGroup.sorted.push(key); });
    this.groups[newUnique] = newGroup;
    bgPanda.db.addToDB(bgPanda.groupingStore, newGroup).then( (id) => { this.groups[newUnique].id = id; } );
    this.groupStatus[newUnique] = {collecting:false};
    return this.unique++;
  }
  createInstant(andEdit=false) {
    let collection = {};
    let filtered = bgPanda.pandaUniques.filter( (value) => { return pandaUI.pandaStats[value].collecting; });
    for (let i=0, len=filtered.length; i<len; i++) {
      collection[bgPanda.info[filtered[i]].dbId] = {hamMode:bgPanda.info[filtered[i]].autoTGoHam};
    }
    if (Object.keys(collection).length && !andEdit) {
      modal.showDialogModal("700px", "Create Grouping Instantly", "Do you really want to create an instant grouping for all the hits collecting now?", () => {
        this.add(`Grouping #${this.unique}`,"Instantly made so no description.", collection);
        modal.closeModal();
      }, true, true);
    } else if (!andEdit) {
      modal.showDialogModal("700px", "Create Grouping Instantly", "You can only create an instant grouping if there are panda's collecting. Start collecting the panda's you want in the group or use the create by selection menu option.", null , false, false);
    } else if (andEdit) {
      const unique = this.add("","", collection);
      this.showgroupingEditModal(unique, () => { this.showGroupingsModal(pandaUI); }, () => { this.delete(unique); });
    }
  }
  delete(unique) {
    bgPanda.db.deleteFromDB(bgPanda.groupingStore, this.groups[unique].id)
    .then( null, (rejected) => console.error(rejected));
    delete this.groups[unique];
    delete this.groupStatus[unique];
  }
  start(unique) { return this.groups[unique].pandas; }
  delayedToggle(unique, index, keys) {
    if (index<keys.length) {
      if (this.groupStatus[unique].collecting) pandaUI.startCollecting(bgPanda.dbIds[keys[index]]);
      else pandaUI.stopCollecting(bgPanda.dbIds[keys[index]]);
      Object.keys(this.groups).forEach( grouping => { this.goCheckGroup(grouping); });
      setTimeout( () => { this.delayedToggle(unique, ++index, keys); }, 30 )
    }
  }
  toggle(unique) {
    const keys = Object.keys(this.groups[unique].pandas);
    if (keys.length===0) return false;
    this.groupStatus[unique].collecting = !this.groupStatus[unique].collecting;
    if (this.groupStatus[unique].collecting) $(`#pcm_nameDesc_${unique}`).closest("tr").css("background-color", "green");
    else { 
      $(`#pcm_nameDesc_${unique}`).closest("tr").css("background-color", (Object.keys(this.groups[unique].pandas).length===0) ? "#800517" : "");
      delete this.startTimes[unique]; this.endTimes[unique];
    }
    setTimeout( () => { this.delayedToggle(unique, 0, keys); }, 30 );
  }
  stop() { return this.groups[unique].pandas; }
  goCheckGroup(grouping) {
    let collecting = false, theGroup = this.groupStatus[grouping];
    Object.keys(this.groups[grouping].pandas).forEach( (value, index, object) => {
      if (bgPanda.dbIds.hasOwnProperty(value)) // Make sure panda isn't deleted.
        collecting = (collecting || pandaUI.pandaStats[bgPanda.dbIds[value]].collecting);
      else object.splice(index,1); // If panda deleted then remove from group.
    });
    if (theGroup.collecting && !collecting) { this.toggle(grouping); }
  }
  showGroupingsModal(panda) {
    const idName = modal.prepareModal(null, "800px", "modal-header-info modal-lg", "List Groupings", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "invisible", "Close");
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    Object.keys(this.groups).forEach(grouping => {
      this.goCheckGroup(grouping);
      const bgColor = (this.groupStatus[grouping].collecting) ? "#066306" : ((Object.keys(this.groups[grouping].pandas).length===0) ? "#800517" : "");
      displayObjectData([
        { string:`Grouping Name and Description`, type:"keyValue", key:"name", id:`pcm_nameDesc_${grouping}`, andKey:"description", andString:`<span class="small">{${Object.keys(this.groups[grouping].pandas).length} Jobs}</span>`, unique:grouping, clickFunc: (e) => { this.toggle(e.data.unique); }
        },
        { label:"Edit", type:"button", addClass:" btn-xxs", idStart:"pcm_editButton1_", width:"45px", unique:grouping, btnFunc: (e) => {
          this.showgroupingEditModal(grouping);
        }},
        { label:"Del", type:"button", addClass:" btn-xxs", idStart:"pcm_deleteButton1_", width:"45px", unique:grouping, btnFunc: (e) => {
          this.delete(grouping);
          $(e.target).closest("tr").remove();
        } }
      ], divContainer, this.groups[grouping], true, true, bgColor);
      });
      modal.showModal();
  }
  momentTime(time) { return moment(`01-01-00 ${time}`, 'MM-DD-YY hh:mm A'); }
  showgroupingEditModal(grouping, afterFunc=null, cancelFunc=null) {
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
      bgPanda.db.updateDB(bgPanda.groupingStore, this.groups[grouping]);
      if (afterFunc!==null) setTimeout( () => { afterFunc.apply(this); }, 300 );
    }, (e) => {
      if ($(e.target).prop('checked')) {
        $(e.target).closest("tr").effect( "highlight", {color:"#3CB371"}, 800, () => {
          this.groups[grouping].pandas[bgPanda.info[e.data.unique].dbId] = {hamMode:false};
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.groups[grouping].pandas).length}`);
        } );
      } else {
        $(e.target).closest("tr").effect( "highlight", {color:"#F08080"}, 800, () => {
          delete this.groups[grouping].pandas[bgPanda.info[e.data.unique].dbId];
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.groups[grouping].pandas).length}`);
        } );
      }
    }, cancelFunc, () => {
      Object.keys(this.groups[grouping].pandas).forEach( 
        (key) => { $(`#pcm_selection_${bgPanda.dbIds[key]}`).prop('checked', true); });
    });
  }
}