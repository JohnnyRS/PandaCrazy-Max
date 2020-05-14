class PandaGroupings {
  constructor() {
    this.store = {};
    this.groups = {};
    this.unique = 1;
  }
  prepare(afterFunc) {
    bgPanda.db.getFromDB(bgPanda.groupingStore, "cursor", null, (cursor, index) => { return {[index]:cursor.value}; }, false)
      .then( (result) => {
        if (Object.keys(result).length !== 0) { console.log(JSON.stringify(result));
          this.store = result; this.unique = Object.keys(result).length;
          Object.keys(result).forEach( (key,index) => this.groups[index] = {collecting:false} );
        }
        afterFunc.apply(this);
      })
  }
  addGroup(group, myIdInfo) { group[myIdInfo[0]] = {hamMode:myIdInfo[1]}; }
  add(name, description, additions, delayedStart=false) {
    let newGroup = {name:name, description:description, group:{}, sorted:[], startTime:null, stopTime:null};
    const newUnique = this.unique;
    newGroup.group = additions;
    Object.keys(additions).forEach(key => { newGroup.sorted.push(key); });
    this.store[newUnique] = newGroup;
    bgPanda.db.addToDB(bgPanda.groupingStore, newGroup).then( (id) => { this.store[newUnique].id = id; } );
    this.groups[newUnique] = {collecting:false};
    return this.unique++;
  }
  createInstant(panda, andEdit=false) {
    let collection = {};
    let filtered = bgPanda.pandaUniques.filter( (value) => { return pandaUI.pandaStats[value].collecting; });
    for (let i=0, len=filtered.length; i<len; i++) {
      collection[bgPanda.info[filtered[i]].dbId] = {hamMode:bgPanda.info[filtered[i]].autoTGoHam};
    }
    if (Object.keys(collection).length && !andEdit) {
      modal.showDialogModal("700px", "Create Grouping Instantly", "Do you really want to create an instant grouping for all the hits collecting now?", () => {
        this.add(`Grouping #${this.unique}`,"Instantly made so no description.", collection);
        modal.closeModal();
      }, true, true, null);
    } else if (!andEdit) {
      modal.showDialogModal("700px", "Create Grouping Instantly", "You can only create an instant grouping if there are panda's collecting. Start collecting the panda's you want in the group or use the create by selection menu option.", null , false, false, null);
    } else if (andEdit) {
      const unique = this.add("","", collection);
      modal.showgroupingEditModal(pandaUI, unique, () => { this.showGroupingsModal(pandaUI); }, () => { this.delete(unique); });
    }
  }
  delete(unique) {
    bgPanda.db.deleteFromDB(bgPanda.groupingStore, this.store[unique].id);
    delete this.store[unique];
    delete this.groups[unique];
  }
  start(unique) { return this.store[unique].group; }
  delayedToggle(unique, index, keys) {
    if (index<keys.length) {
      if (this.groups[unique].collecting) pandaUI.startCollecting(bgPanda.dbIds[keys[index]]);
      else pandaUI.stopCollecting(bgPanda.dbIds[keys[index]]);
      Object.keys(this.store).forEach( grouping => { this.goCheckGroup(grouping); });
      setTimeout( () => { this.delayedToggle(unique, ++index, keys); }, 30 )
    }
  }
  toggle(unique) {
    const keys = Object.keys(this.store[unique].group);
    if (keys.length===0) return false;
    this.groups[unique].collecting = !this.groups[unique].collecting;
    if (this.groups[unique].collecting) $(`#pcm_nameDesc_${unique}`).closest("tr").css("background-color", "green");
    else $(`#pcm_nameDesc_${unique}`).closest("tr").css("background-color", (Object.keys(this.store[unique].group).length===0) ? "#800517" : "");
    let index = 0;
    if (index<keys.length) setTimeout( () => { this.delayedToggle(unique, index, keys); }, 30 );
}
  stop() { return this.store[unique].group; }
  goCheckGroup(grouping) {
    let collecting = false, theGroup = this.groups[grouping];
    Object.keys(this.store[grouping].group).forEach( (value, index, object) => {
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
    Object.keys(this.store).forEach(grouping => {
      this.goCheckGroup(grouping);
      const bgColor = (this.groups[grouping].collecting) ? "#066306" : ((Object.keys(this.store[grouping].group).length===0) ? "#800517" : "");
      displayObjectData([
        { string:`Grouping Name and Description`, type:"keyValue", key:"name", id:`pcm_nameDesc_${grouping}`, andKey:"description", andString:`<span class="small">{${Object.keys(this.store[grouping].group).length} Jobs}</span>`, unique:grouping, clickFunc: (e) => { this.toggle(e.data.unique); }
        },
        { label:"Edit", type:"button", addClass:" btn-xxs", idStart:"pcm_editButton1_", width:"45px", unique:grouping, btnFunc: (e) => {
          this.showgroupingEditModal(grouping);
        }},
        { label:"Del", type:"button", addClass:" btn-xxs", idStart:"pcm_deleteButton1_", width:"45px", unique:grouping, btnFunc: (e) => {
          this.delete(grouping);
          $(e.target).closest("tr").remove();
        } }
      ], divContainer, this.store[grouping], true, true, bgColor);
      });
      modal.showModal();
  }
  showgroupingEditModal(grouping, afterFunc=null, cancelFunc=null) {
    pandaUI.showJobsModal("groupingEdit", grouping, this.store[grouping], (savedResults) => {
      savedResults.name = $(`#pcm_groupingNameI`).val();
      if (savedResults.name == "") savedResults.name = `Grouping #${grouping}`;
      savedResults.description = $(`#pcm_groupingDescI`).val();
      if (savedResults.description == "") savedResults.description = `no description`;
      this.store[grouping] = Object.assign(this.store[grouping], savedResults);
      modal.closeModal();
      const jobNumbers = Object.keys(this.store[grouping].group).length;
      const bgColor = (jobNumbers>0) ? "" : "#800517";
      $(`#pcm_nameDesc_${grouping}`).html(`${this.store[grouping].name} - ${this.store[grouping].description} - <span class="small">{${jobNumbers} Jobs}</span>`)
      $(`#pcm_nameDesc_${grouping}`).closest("tr").css("background-color", bgColor).effect( "highlight", {color:"#3CB371"}, 1500);
      bgPanda.db.updateDB(bgPanda.groupingStore, this.store[grouping], this.store[grouping].id);
      if (afterFunc!==null) setTimeout( () => { afterFunc.apply(this); }, 300 );
    }, (e) => {
      if ($(e.target).prop('checked')) {
        $(e.target).closest("tr").effect( "highlight", {color:"#3CB371"}, 800, () => {
          this.store[grouping].group[bgPanda.info[e.data.unique].dbId] = {hamMode:false};
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.store[grouping].group).length}`);
          } );
      } else {
        $(e.target).closest("tr").effect( "highlight", {color:"#F08080"}, 800, () => {
          delete this.store[grouping].group[bgPanda.info[e.data.unique].dbId];
          bgPanda.db.updateDB(bgPanda.groupingStore, this.store[grouping], this.store[grouping].id);
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.store[grouping].group).length}`);
          } );
        }
    }, cancelFunc, () => {
      Object.keys(this.store[grouping].group).forEach( (key) => { console.log($(`#pcm_groupingNameI`).html()); $(`#pcm_selection_${bgPanda.dbIds[key]}`).prop('checked', true); });
    });
  }
}