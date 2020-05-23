/**
 * @param  {object} element
 * @param  {string} divId
 * @param  {string} ulId
 * @param  {string} contentId
 */
class TabbedClass {
	constructor(element, divId, ulId, contentId) {
    this.unique = 0;
    this.tabObject = {};
    this.attachedTo = element;
    this.ulId = ulId;
    this.dbIds = {};
    this.uniques = {};
    this.contentId = contentId;
    this.tabIds = "pcm-t";
    this.addButton = false;           // Can users add tabs by using an add button?
    this.renameTab = false;           // Can users rename a tab?
    this.deleteTab = false;           // Can users delete a tab?
    this.draggable = false;           // Are objects in tabs draggable?
    this.dataTabs = {};
    this.tabsArr = [];
    this.defaultTabs = [{title:"Main", position:0, list:[]}, {title:"Daily", position:1, list:[]}];
    this.tabStructure(this.attachedTo, divId, ulId, contentId);
  }
	/**
	 */
	get currentTab() { return $('.nav-tabs .active').closest('li').data('unique') }
  /**
   */
  async prepare() {
    let success = "", err = null;
    if (this.ulId==="pcm_tabbedPandas") { // Is this tab row for the panda's?
      this.addAddButton($(`#${this.ulId}`)); // Shows the add tab button on the tabbed panda row
      this.renameTab = true; this.deleteTab = true; this.draggable = true; // Allows renaming, deleting and dragging
      await bgPanda.db.getFromDB(bgPanda.tabsStore, null, true, (cursor) => { return cursor.value; })
      .then( async result => {
        const theData = (result.length) ? result : this.defaultTabs;
        let active = true;
        for (let index=0, len=theData.length; index<len; index++) { // Do this for each tab
          let dbId = theData[index].id;
          if (!dbId) await bgPanda.db.addToDB(bgPanda.tabsStore, theData[index])
          .then( result => { dbId = theData[index].id = result; }, rejected => err = rejected );
          this.tabsArr.push(dbId); this.dataTabs[dbId] = theData[index];
          await this.addTab2(dbId, active);
          active = false;
        }
        if (!err) success = "Added all panda tabs.";
      }, (rejected) => err = rejected );
    } else {
      $(`<li class="pcm_captchaText ml-2"></li>`).appendTo($(`#${this.ulId}`));
      success = "Added all log tabs.";
    }
    return [success, err];
  }
  /**
   * @param  {object} element
   * @param  {string} divId
   * @param  {string} ulId
   * @param  {string} contentId
   */
  tabStructure(element, divId, ulId, contentId) {
    $(`<div id="${divId}" class="h-100 p-0"></div>`).append($(`<ul class="nav nav-tabs" id="${ulId}" role="tablist"></ul>`)).append($(`<div id="${contentId}" class="tab-content"></div>`)).appendTo($(element));
  }
  /**
   * @param  {object} tabElement
   */
  addAddButton(tabElement) {
    this.addButton = true;
    $(`<li class="nav-item pcm_addTab"></li>`).append($(`<a class="nav-link small py-0 px-1" href="#tabadd">+</a>`).click( (e) => {
      e.preventDefault();
      modal.showDialogModal("700px", "Add New Tab", "Type in the title of the new tab you want.", () => {
        e.preventDefault(); e.stopPropagation();
        const label = $('#pcm_formQuestion').val();
        if (label) { this.addTab(label, false, true); }
        modal.closeModal();
      }, true, true, "Title: ", `Added-${this.tabsArr.length}`, 10);
    } )).appendTo($(tabElement));
  }
  /**
   * @param  {string} name
   * @param  {bool} active=false
   * @param  {bool} manualAdd=false
   */
  async addTab(name, active=false, manualAdd=false) {
    const unique = this.tabsArr.length, arrPos = this.tabsArr.length; this.tabsArr.push(unique);
    this.dataTabs[unique] = {title:name, position:arrPos, list:[]};
    if (manualAdd) await bgPanda.db.addToDB(bgPanda.tabsStore, this.dataTabs[unique])
      .then( id => { this.dataTabs[unique].id = id; } );
    return await this.addTab2(unique, active);
  }
  /**
   * @param  {number} unique
   * @param  {bool} active
   */
  async addTab2(unique, active) {
    this.tabObject[unique] = {label:this.dataTabs[unique].title};
    const activeText = (active) ? " active" : "";
    const start = $(`<li class="nav-item"></li>`).data("unique", unique);
    if (this.addButton) $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_addTab`))
      .droppable( {tolerance:'pointer', over: (e, ui) => { $(e.target).find("a").click(); },
        drop: async (e, ui) => { this.cardDragged(e, ui, "droppable"); }}
      );
    else $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_captchaText`));
    const label = $(`<a class="nav-link${activeText} small py-0 px-2" id="${this.tabIds}${unique}Tab" data-toggle="tab" href="#${this.tabIds}${unique}Content" role="tab" aria-controls="${this.tabIds}${unique}Content" aria-selected="${(active) ? "true" : "false"}"></a>`).appendTo(start);
    if (this.renameTab) $(label).bind('contextmenu', (e) => {
        if ($(e.target).closest("li").data("unique")!==0) { // First tab can not be renamed ever.
          modal.showDialogModal("700px", "Rename Tab Title", "Type in the title of this tab you want renamed.", () => {
            e.preventDefault(); e.stopPropagation();
            const label = $('#pcm_formQuestion').val();
            if (label && label!=="") { this.tabObject[unique] = {label:label}; $(e.target).html(label); }
            modal.closeModal();
          }, true, true, "Title: ", $(e.target).text(), 10);
        }
        e.preventDefault();
        return false;
      });
      $(label).append($(`<span>${this.dataTabs[unique].title}</span>`));
    if (unique!==0 && this.deleteTab) $(label).append($(`<span class="float-right pl-3 font-weight-bold pcm-tabDelete">x</span>`).click( (e) => {
      modal.showDialogModal("700px", "Delete tab", "Do you really want to delete this tab?", () => {
        e.preventDefault(); e.stopPropagation();
        const unique = $(e.target).closest('li').data("unique");
        $(e.target).closest('li').remove();
        delete this.tabObject[unique];
        modal.closeModal();
      }, true, true);
      }));
    const tabPane = $(`<div class="tab-pane pcm_tabs p-0 show${activeText}" id="${this.tabIds}${unique}Content" name="${this.dataTabs[unique].title}" role="tabpanel"></div>`).appendTo(`#${this.contentId}`);
    if (this.draggable) {
      $(tabPane).append($(`<div class="card-deck p-0 px-1"></div>`).data("unique",unique).sortable({ opacity:0.5, cursor:"move", appendTo: document.body, helper: "clone",
        stop: async (e, ui) => { console.log("sortable stop"); this.cardDragged(e, ui, "sortable"); }}
      ));
      $(tabPane).droppable({tolerance:'pointer', drop: async (e, ui) => { this.cardDragged(e, ui, "droppable"); }});
    }
    return {tabId:`${this.tabIds}${unique}Tab`, tabContent:`${this.tabIds}${unique}Content`};
  }
  /**
   * @param  {object} e
   * @param  {object} ui
   * @param  {string} action
   */
  async cardDragged(e, ui, action) {
    const theItem = (action === "sortable") ? ui.item : ui.draggable;
    const myId = $(theItem).data("myId"), activeTab = $(`#pcm_tabbedPandas a.active:first`).closest("li");
    const unique = $(activeTab).data("unique");
    if (!bgPanda.info[myId].data) await bgPanda.getDbData(myId); // Wait and load up hit data from DB
    const hitData = bgPanda.info[myId].data, tabUnique = hitData.tabUnique;
    const tabsInfo = this.dataTabs[tabUnique];
    if (unique===tabUnique && action === "sortable") {
      const pos1 = tabsInfo.list.indexOf(hitData.id);
      arrayMove(tabsInfo.list, pos1, theItem.index());
      await bgPanda.db.updateDB(bgPanda.tabsStore, tabsInfo); // Wait and update tab positions
    } else if (unique!==tabUnique && action !== "sortable") {
      this.removePosition(tabUnique, hitData.id); this.setPosition(unique, hitData.id);
      setTimeout( () => { $(theItem).detach().appendTo($(`#pcm-t${unique}Content .card-deck:first`)); });
      hitData.tabUnique = unique;
      await bgPanda.updateDbData(myId, hitData);
      await bgPanda.db.updateDB(bgPanda.tabsStore, tabsInfo); // Wait and update tab positions
    }
  }
  /**
   * @param  {number} captchaCount
   */
  updateCaptcha(captchaCount) {
    $(`#${this.ulId} .pcm_captchaText:first`).html(`Captcha Count: ${captchaCount}`)
  }
  /**
   * @param  {number} tabUnique
   * @param  {string} id
   * @param  {bool} update=false
   */
  setPosition(tabUnique, id, update=false) { console.log("setting position: ", tabUnique, id);
    this.dataTabs[tabUnique].list.push(id);
    bgPanda.db.updateDB(bgPanda.tabsStore, this.dataTabs[tabUnique]);
  }
  /**
   * @param  {number} tabUnique
   * @param  {string} id
   */
  removePosition(tabUnique, id) {
    this.dataTabs[tabUnique].list = arrayRemove(this.dataTabs[tabUnique].list, id);
    bgPanda.db.updateDB(bgPanda.tabsStore, this.dataTabs[tabUnique]);
  }
}