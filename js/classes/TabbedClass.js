class TabbedClass {
	constructor(element, divId, ulId, contentId) {
    this.unique = 0;
    this.tabObject = {};
    this.currentTab = this.unique;
    this.attachedTo = element;
    this.ulId = ulId;
    this.contentId = contentId;
    this.tabIds = "pcm-t";
    this.addButton = false;           // Can users add tabs by using an add button?
    this.renameTab = false;           // Can users rename a tab?
    this.deleteTab = false;           // Can users delete a tab?
    this.draggable = false;           // Are objects in tabs draggable?
    this.dataTabs = [{title:"Main", position:0, list:[]}, {title:"Daily", position:1, list:[]}];
    this.tabStructure(this.attachedTo, divId, ulId, contentId);
  }
  getAllFromDB(afterFunc) {
    bgPanda.db.getFromDB(bgPanda.tabsStore, "cursor", null, (cursor) => { return cursor.value; })
      .then( (result) => {
        if (result.length) { this.dataTabs = result; this.prepareAddTabs(true, afterFunc);
        } else this.prepareAddTabs(false, afterFunc);
      })
  }
  prepareAddTabs(fromDB, afterFunc) {
    let active = true;
    this.dataTabs.forEach( theTab => { this.addTab(theTab.title, active, !fromDB); active = false; });
    afterFunc.apply(this);
  }
  prepare(afterFunc) {
    if (this.ulId==="pcm_tabbedPandas") { // Is this tab row for the panda's?
      this.addAddButton($(`#${this.ulId}`)); // Shows the add tab button on the tabbed panda row
      this.renameTab = true; this.deleteTab = true; this.draggable = true; // Allows renaming, deleting and dragging
      this.getAllFromDB(afterFunc);
    } else $(`<li class="pcm_captchaText ml-2"></li>`).appendTo($(`#${this.ulId}`));
  }
  tabStructure(element, divId, ulId, contentId) {
    $(`<div id="${divId}" class="h-100 p-0"></div>`).append($(`<ul class="nav nav-tabs" id="${ulId}" role="tablist"></ul>`)).append($(`<div id="${contentId}" class="tab-content"></div>`)).appendTo($(element));
  }
  addAddButton(tabElement) {
    this.addButton = true;
    $(`<li class="nav-item pcm_addTab"></li>`).append($(`<a class="nav-link small py-0 px-1" href="#tabadd">+</a>`).click( (e) => {
      e.preventDefault();
      const label = prompt(`Enter New Tab Label: `, `Added-${this.unique}`);
      if (label && returnName!=="") {
        this.addTab(label, false, true);
      }
    } )).appendTo($(tabElement));
  }
  addTab(name, active=false, addToDB=false) {
    const unique = this.unique++;
    if (addToDB) bgPanda.db.addToDB(bgPanda.tabsStore, {title:name, position:unique, list:[]})
      .then( () => {} );
    this.tabObject[unique] = {label:name};
    const activeText = (active) ? " active" : "";
    const start = $(`<li class="nav-item"></li>`).data("unique", unique);
    if (this.addButton) $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_addTab`))
      .droppable( {tolerance:'pointer', over: (e, ui) => {
          $(e.target).find("a").click();
        },
        drop: (e, ui) => {
          function changeTab(e, hitInfo, myId) { console.log("droppable - " + hitInfo.id);
            const unique = $(e.target).data("unique");
            if (unique!==hitInfo.tabUnique) {
              setTimeout( () => { 
                ui.draggable.detach().appendTo($(`#pcm-t${unique}Content .card-deck:first`));
                hitInfo.tabUnique = unique;
                bgPanda.updateDbData(myId, hitInfo);
              },0);
            }
          }
          const myId = $(ui.draggable).data("myId");
          // if database data loaded then change tabunique to new tab number and update
          if (bgPanda.info[myId].data) changeTab(e, bgPanda.info[myId].data, myId);
          else { // load up data from database and then change tabunique and update
            bgPanda.getDbData(myId, (r) => { changeTab(e, r, myId); });
          }
        }
      });
    else $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_captchaText`));
    const label = $(`<a class="nav-link${activeText} small py-0 px-2" id="${this.tabIds}${unique}Tab" data-toggle="tab" href="#${this.tabIds}${unique}Content" role="tab" aria-controls="${this.tabIds}${unique}Content" aria-selected="${(active) ? "true" : "false"}"></a>`).appendTo(start);
    if (this.renameTab) $(label).bind('contextmenu', (e) => {
        if ($(e.target).closest("li").data("unique")!==0) { // First tab can not be renamed ever.
          const label = prompt(`Enter New Tab Label: `, $(e.target).text());
          if (label && label!=="") { this.tabObject[unique] = {label:label}; $(e.target).html(label); }
          e.preventDefault();
        }
        e.preventDefault();
        return false;
      });
      $(label).append($(`<span>${name}</span>`));
    if (unique!==0 && this.deleteTab) $(label).append($(`<span class="float-right pl-3 font-weight-bold pcm-tabDelete">x</span>`).click( (e) => {
        e.preventDefault(); e.stopPropagation();
        const unique = $(e.target).closest('li').data("unique");
        $(e.target).closest('li').remove();
        delete this.tabObject[unique];
      }));
    const tabPane = $(`<div class="tab-pane pcm_tabs p-0 show${activeText}" id="${this.tabIds}${unique}Content" name="${name}" role="tabpanel"></div>`).appendTo(`#${this.contentId}`);
    if (this.draggable) $(tabPane).append($(`<div class="card-deck p-0 px-1"></div>`).data("unique",unique).sortable({ opacity:0.5, cursor:"move", appendTo: document.body, helper: "clone",
        stop: function(e, ui) {
          function changePos(e, hitInfo, myId) { console.log("sortable - " + hitInfo.id);
            const unique = $(`#pcm_tabbedPandas a.active:first`).closest("li").data("unique");
            if (unique===hitInfo.tabUnique) {
              // ui.item.detach().appendTo($(`#pcm-t${unique}Content .card-deck:first`));
              // hitInfo.tabUnique = unique;
              // bgPanda.updateDbData(myId, hitInfo);
            }
          }
          const myId = $(ui.item).data("myId");
          // if database data loaded then change tabunique to new tab number and update
          if (bgPanda.info[myId].data) changePos(e, bgPanda.info[myId].data, myId);
          else { // load up data from database and then change tabunique and update
            bgPanda.getDbData(myId, (r) => { changePos(e, r, myId);
            });
          }
        }
    }));
    return {tabId:`${this.tabIds}${unique}Tab`, tabContent:`${this.tabIds}${unique}Content`};
  }
  updateCaptcha(captchaCount) {
    $(`#${this.ulId} .pcm_captchaText:first`).html(`Captcha Count: ${captchaCount}`)
  }
}