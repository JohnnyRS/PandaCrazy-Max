/**
 * A class that works with the tabbed areas of the page for panda's and logging.
 * @class TabbedClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class TabbedClass {
  #tabsArr = [];                // The array of all the tab unique ID's.
  #dataTabs = {};               // The data for the tabs on this page.
/**
 * @param  {object} element   - The element on page that the tab structure should be appended to.
 * @param  {string} divId     - The div id name for the tab structure of page.
 * @param  {string} ulId      - The ul id name for the tab structure of page.
 * @param  {string} contentId - The contetn id name for the content area of page.
 */
	constructor(element, divId, ulId, contentId) {
    this.unique = 0;                  // Unique id of a tab initialized at 0.
    this.attachedTo = element;        // The element that the tab structure should be appended to.
    this.ulId = ulId;                 // The ul id name for the tab structure of page.
    this.contentId = contentId;       // The content id name for the content area of page.
    this.tabIds = "pcm-t";            // The tab id name of the tab area of page.
    this.addButton = false;           // Can users add tabs by using an add button?
    this.renameTab = false;           // Can users rename a tab?
    this.deleteTab = false;           // Can users delete a tab?
    this.draggable = false;           // Are objects in tabs draggable?
    this.defaultTabs = [{title:"Main", position:0, list:[]}, {title:"Daily", position:1, list:[]}];
    this.tabStructure(this.attachedTo, divId, ulId, contentId);
  }
	/**
   * Gets the current active tab unique number
   * @returns {number} - The unique number for the active tab.
	 */
  get currentTab() { return $('.nav-tabs .active').closest('li').data('unique') }
  /**
   * Public method to get all the tab unique in an array from a private member.
   */
  getUniques() { return this.#tabsArr; }
  /**
   * @param  {number} tabUnique
   * @return {object}
   */
  getTabInfo(tabUnique) { return this.#dataTabs[tabUnique]; }
  /**
   * @param  {number} tabUnique
   * @return {array}
   */
  getpositions(tabUnique) {
    return this.#dataTabs[tabUnique].list;
  }
  /**
   * @param  {number} tabUnique
   * @return {array}
   */
  removePosition(tabUnique, position) {
    this.#dataTabs[tabUnique].list = arrayRemove(this.#dataTabs[tabUnique].list, position);
    bgPanda.db.updateDB(bgPanda.tabsStore, this.#dataTabs[tabUnique]);
  }
  /**
   * Prepare the tabbed areas on this page at the start up of the program.
   * @async                   - To wait for the loading of the tab data from the database.
   * @return {array.<Object>} - Returns an array of success messages or Error object for rejections.
   */
  async prepare() {
    let success = "", err = null;
    if (this.ulId==="pcm_tabbedPandas") { // Is this tab row for the panda's?
      this.addAddButton($(`#${this.ulId}`).disableSelection()); // Shows the add tab button on the tabbed panda row
      this.renameTab = true; this.deleteTab = true; this.draggable = true; // Allows renaming, deleting and dragging
      await bgPanda.db.getFromDB(bgPanda.tabsStore, null, true, (cursor) => { return cursor.value; })
      .then( async result => {
        const theData = (result.length) ? result : this.defaultTabs;
        let active = true;
        for (let index=0, len=theData.length; index<len; index++) { // Do this for each tab
          let dbId = theData[index].id;
          if (!dbId) await bgPanda.db.addToDB(bgPanda.tabsStore, theData[index])
          .then( result => { dbId = theData[index].id = result; }, rejected => err = rejected );
          this.#tabsArr.push(dbId); this.#dataTabs[dbId] = theData[index];
          await this.addTab2(dbId, active);
          active = false;
        }
        if (!err) success = "Added all panda tabs.";
      }, (rejected) => err = rejected );
    } else {
      $(`<li class="pcm_captchaText ml-2"></li>`).appendTo($(`#${this.ulId}`).disableSelection());
      success = "Added all log tabs.";
    }
    return [success, err];
  }
  /**
   * Creates the tab structure with the supplied id names and element appended to it.
   * @param  {object} element   - The jquery element to append to the tab structure.
   * @param  {string} divId     - The div id name for the div element of the tab structure.
   * @param  {string} ulId      - The ul id name for the ul of the tab structure.
   * @param  {string} contentId - The content id name for the content area.
   */
  tabStructure(element, divId, ulId, contentId) {
    $(`<div id="${divId}" class="h-100 p-0"></div>`).append($(`<ul class="nav nav-tabs" id="${ulId}" role="tablist"></ul>`)).append($(`<div id="${contentId}" class="tab-content"></div>`)).appendTo($(element));
  }
  /**
   * Creates an add button and adds it to the tab area.
   * @param  {object} tabElement - The jquery element to append the add button.
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
      }, true, true, "Title: ", `Added-${this.#tabsArr.length}`, 10);
    } )).appendTo($(tabElement));
  }
  /**
   * Add tab to the page with name and active status. Only used for manual additions to get unique ID.
   * @async                           - To wait for the loading of the data from database.
   * @param  {string} name            - The name of this new tab.
   * @param  {bool} [active=false]    - Is this tab active?
   * @param  {bool} [manualAdd=false] - Was tab manually added?
   */
  async addTab(name, active=false, manualAdd=false) {
    const unique = this.#tabsArr.length, arrPos = this.#tabsArr.length; this.#tabsArr.push(unique);
    this.#dataTabs[unique] = {title:name, position:arrPos, list:[]};
    if (manualAdd) await bgPanda.db.addToDB(bgPanda.tabsStore, this.#dataTabs[unique])
      .then( id => { this.#dataTabs[unique].id = id; } );
    return await this.addTab2(unique, active);
  }
  /**
   * Add a tab to the page with the unique number and active status.
   * This method is called when tab data is first loaded or when a new tab is created by user.
   * @async                  - To wait for the updating of the tab data after repositioning in database.
   * @param  {number} unique - The unique tab number for the new tab.
   * @param  {bool} active   - Shows that this tab is active if true.
   */
  async addTab2(unique, active) {
    const activeText = (active) ? " active" : "";
    const start = $(`<li class="nav-item"></li>`).data("unique", unique);
    if (this.addButton) $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_addTab`))
      .droppable( {tolerance:'pointer', over: (e, ui) => { $(e.target).find("a").click(); },
        drop: async (e, ui) => { await this.cardDragged(e, ui, "droppable"); }}
      );
    else $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_captchaText`));
    const label = $(`<a class="nav-link${activeText} small py-0 px-2" id="${this.tabIds}${unique}Tab" data-toggle="tab" href="#${this.tabIds}${unique}Content" role="tab" aria-controls="${this.tabIds}${unique}Content" aria-selected="${(active) ? "true" : "false"}"></a>`).disableSelection().appendTo(start);
    if (this.renameTab) $(label).bind('contextmenu', (e) => {
        if ($(e.target).closest("li").data("unique")!==0) { // First tab can not be renamed ever.
          modal.showDialogModal("700px", "Rename Tab Title", "Type in the title of this tab you want renamed.", () => {
            e.preventDefault(); e.stopPropagation();
            const label = $('#pcm_formQuestion').val();
            if (label && label!=="") { this.#dataTabs[unique].title = label; $(e.target).html(label); }
            modal.closeModal();
          }, true, true, "Title: ", $(e.target).text(), 10);
        }
        e.preventDefault();
        return false;
      });
      $(label).append($(`<span>${this.#dataTabs[unique].title}</span>`).disableSelection());
    if (unique!==0 && this.deleteTab) $(label).append($(`<span class="float-right pl-3 font-weight-bold pcm-tabDelete">x</span>`).click( (e) => {
      modal.showDialogModal("700px", "Delete tab", "Do you really want to delete this tab?", () => {
        e.preventDefault(); e.stopPropagation();
        const unique = $(e.target).closest('li').data("unique");
        $(e.target).closest('li').remove();
        delete this.#dataTabs[unique];
        arrayRemove(this.#tabsArr, unique);
        modal.closeModal();
      }, true, true);
      }));
    const tabPane = $(`<div class="tab-pane pcm_tabs p-0 show${activeText}" id="${this.tabIds}${unique}Content" name="${this.#dataTabs[unique].title}" role="tabpanel"></div>`).disableSelection().appendTo(`#${this.contentId}`);
    if (this.draggable) {
      $(tabPane).append($(`<div class="card-deck p-0 px-1"></div>`).data("unique",unique).sortable({ opacity:0.5, cursor:"move", appendTo: document.body, helper: "clone",
        stop: async (e, ui) => { await this.cardDragged(e, ui, "sortable"); }}
      ));
      $(tabPane).droppable({tolerance:'pointer', drop: async (e, ui) => { await this.cardDragged(e, ui, "droppable"); }});
    }
    return {tabId:`${this.tabIds}${unique}Tab`, tabContent:`${this.tabIds}${unique}Content`};
  }
  /**
   * Handles the dragging of the card from a sortable or droppable area.
   * It will set the new position or set the new tab for this card.
   * @async                  - To wait for the updating the tab data for repositioning in database.
   * @param  {object} e      - The event object from a sortable or droppable area.
   * @param  {object} ui     - The ui jquery element from a sortable or droppable area.
   * @param  {string} action - Which action is the card being dragged for?
   */
  async cardDragged(e, ui, action) {
    const theItem = (action === "sortable") ? ui.item : ui.draggable;
    const myId = $(theItem).data("myId"), activeTab = $(`#pcm_tabbedPandas a.active:first`).closest("li");
    const unique = $(activeTab).data("unique");
    if (!bgPanda.info[myId].data) await bgPanda.getDbData(myId); // Wait and load up hit data from DB
    const hitData = bgPanda.info[myId].data, tabUnique = hitData.tabUnique;
    const tabsInfo = this.#dataTabs[tabUnique];
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
   * Updates the captcha number in the bottom area of the page.
   * @param  {number} captchaCount - The captcha counter that needs to be updated on page.
   */
  updateCaptcha(captchaCount) {
    $(`#${this.ulId} .pcm_captchaText:first`).html(`Captcha Count: ${captchaCount}`)
  }
  /**
   * Sets the panda with the unique ID to the tab unique ID and then saves to database.
   * @param  {number} tabUnique - The tab unique ID that the panda should be positioned in.
   * @param  {string} id        - The unique ID for the panda that is being positioned.
   */
  setPosition(tabUnique, id) {
    this.#dataTabs[tabUnique].list.push(id);
    bgPanda.db.updateDB(bgPanda.tabsStore, this.#dataTabs[tabUnique]);
  }
  /**
   * Removes the panda from this tab unique ID and then saves the updated positions to database.
   * @param  {number} tabUnique - The tab unique ID that the panda should be removed from.
   * @param  {string} id        - The unique ID for the panda that is being removed from position.
   */
  removePosition(tabUnique, id) {
    this.#dataTabs[tabUnique].list = arrayRemove(this.#dataTabs[tabUnique].list, id);
    bgPanda.db.updateDB(bgPanda.tabsStore, this.#dataTabs[tabUnique]);
  }
}