class PandaGroupings {
  constructor() {
    this.store = {};
    this.unique = 1;
  }
  addGroup(group, myIdInfo) { group[myIdInfo[0]] = {hamMode:myIdInfo[1]}; }
  addGroupings(name, description, additions, delayedStart=false) {
    this.store[this.unique] = {name:name, description:description, group:{}, sorted:[], delayedStart:delayedStart, collecting:false};
    additions.forEach(value => {
      this.addGroup(this.store[this.unique].group, value);
      this.store[this.unique].sorted.push(value[0]);
    });
    return this.unique++;
  }
  createInstant(panda, andEdit=false) {
    const collection = (bgPandaClass.pandaUniques.filter( (value) => { return bgPandaClass.pandaStats[value].collecting; })).map( (value) => { return [value,bgPandaClass.info[value].autoTGoHam]; } );
    if (collection.length && !andEdit) {
      modal.showDialogModal("700px", "Create Grouping Instantly", "Do you really want to create an instant grouping for all the hits collecting now?", () => {
        this.addGroupings(`Grouping #${this.unique}`,"Instantly made so no description.", collection);
        modal.closeModal();
      }, true, true, null);
    } else if (!andEdit) {
      modal.showDialogModal("700px", "Create Grouping Instantly", "You can only create an instant grouping if there are panda's collecting. Start collecting the panda's you want in the group or use the create by selection menu option.", null , false, false, null);
    } else if (andEdit) {
      const unique = this.addGroupings("","", collection);
      modal.showgroupingEditModal(pandaUI, unique, () => { this.showGroupingsModal(pandaUI); }, () => { this.delete(unique); });
    }
  }
  delete(unique) { delete this.store[unique]; }
  start(unique) { return this.store[unique].group; }
  delayedToggle(panda, unique, index, keys) {
    if (index<keys.length) {
      console.log(keys[index],this.store[unique].group[keys[index]]);
      if (this.store[unique].collecting) pandaUI.startCollecting(keys[index]);
      else pandaUI.stopCollecting(keys[index], true);
      setTimeout( () => { this.delayedToggle(pandaUI, unique, ++index, keys); }, 30 )
    }
  }
  toggle(panda, unique) {
    const keys = Object.keys(this.store[unique].group);
    if (keys.length===0) return false;
    this.store[unique].collecting = !this.store[unique].collecting;
    let index = 0;
    if (index<keys.length) setTimeout( () => { this.delayedToggle(pandaUI, unique, index, keys); }, 30 );
    return this.store[unique].collecting;
  }
  stop() { return this.store[unique].group; }
  showGroupingsModal(panda) {
    const idName = modal.prepareModal(null, "1000px", "modal-header-info modal-lg", "List Groupings", "", "text-right bg-dark text-light", "modal-footer-info", "invisible", "No", null, "invisible", "No", null, "invisible", "Close");
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    Object.keys(this.store).forEach(grouping => {
      const bgColor = (this.store[grouping].collecting) ? "#066306" : ((Object.keys(this.store[grouping].group).length===0) ? "#800517" : "");
      displayObjectData([
        { string:`Grouping Name and Description`, type:"keyValue", key:"name", id:`pcm_nameDesc_${grouping}`, andKey:"description", andString:`<span class="small">{${Object.keys(this.store[grouping].group).length} Jobs}</span>`, unique:grouping, clickFunc: (e) => {
            if (this.toggle(pandaUI, e.data.unique)) $(e.target).closest("tr").css("background-color", "green");
            else $(e.target).closest("tr").css("background-color", (Object.keys(this.store[e.data.unique].group).length===0) ? "#800517" : "");
          }
        },
        { label:"Edit", type:"button", addClass:" btn-xxs", idStart:"pcm_editButton1_", width:"45px", unique:grouping, btnFunc: (e) => {
          this.showgroupingEditModal(pandaUI, grouping);
        }},
        { label:"Del", type:"button", addClass:" btn-xxs", idStart:"pcm_deleteButton1_", width:"45px", unique:grouping, btnFunc: (e) => {
          this.delete(grouping);
          $(e.target).closest("tr").remove();
        } }
      ], divContainer, this.store[grouping], true, true, bgColor);
      });
      modal.showModal();
  }
  showgroupingEditModal(panda, grouping, afterFunc=null, cancelFunc=null) {
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
      if (afterFunc!==null) setTimeout( () => { afterFunc.apply(this); }, 300 );
    }, (e) => {
      if ($(e.target).prop('checked')) {
        $(e.target).closest("tr").effect( "highlight", {color:"#3CB371"}, 800, () => {
          this.store[grouping].group[e.data.unique] = {hamMode:false};
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.store[grouping].group).length}`);
          } );
      } else {
        $(e.target).closest("tr").effect( "highlight", {color:"#F08080"}, 800, () => {
          delete this.store[grouping].group[e.data.unique];
          $(e.target).closest(".modal-content").find(".pcm_jobsInGroup:first").removeClass("text-info").addClass("text-success").text(`Jobs in Groups: ${Object.keys(this.store[grouping].group).length}`);
          } );
        }
    }, cancelFunc);
    Object.keys(this.store[grouping].group).forEach( (value) => { $(`#pcm_selection_${value}`).prop('checked', true); });
  }
}