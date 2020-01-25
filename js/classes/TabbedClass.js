class TabbedClass {
	constructor(element, divId, ulId, contentId) {
    this.unique = 0;
    this.tabObject = {};
    this.currentTab = this.unique;
    this.attachedTo = element;
    this.ulId = ulId;
    this.contentId = contentId;
    this.tabIds = "pcm-t";
    this.addButton = false;
    this.renameTab = false;
    this.deleteTab = false;
    this.draggable = false;

    this.tabStructure(this.attachedTo, divId, ulId, contentId);
    if (ulId==="pcm_tabbedPandas") {
      this.addAddButton($(`#${ulId}`));
      this.renameTab = true; this.deleteTab = true; this.draggable = true;
      this.addTab("Main", true);
      this.addTab("Test");
    } else $(`<li class="pcm_captchaText ml-2"></li>`).appendTo($(`#${ulId}`));
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
        this.addTab(label);
        console.log(this.tabObject);
      }
    } )).appendTo($(tabElement));
  }
  addTab(name, active=false) {
    const unique = this.unique++;
    this.tabObject[unique] = {label:name};
    const activeText = (active) ? " active" : "";
    const start = $(`<li class="nav-item"></li>`).data("unique", unique);
    if (this.addButton) $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_addTab`))
      .droppable( {tolerance:'pointer', over: (e, ui) => {
          const unique = $(e.target).data("unique");
          const tabUnique = $(ui.draggable).data("pandaObj").tabUnique;
          $(e.target).find("a").click();
        },
        drop: (e, ui) => {
          const unique = $(e.target).data("unique");
          const pandaObj = $(ui.draggable).data("pandaObj");
          if (unique!==pandaObj.tabUnique) {
            setTimeout( () => { 
              ui.draggable.detach().appendTo($(`#pcm-t${unique}Content .card-deck:first`));
              pandaObj.tabUnique = unique;
            },0);
          }
        }
      });
    else $(start).insertBefore($(`#${this.ulId}`).find(`.pcm_captchaText`));
    const label = $(`<a class="nav-link${activeText} small py-0 px-2" id="${this.tabIds}${unique}Tab" data-toggle="tab" href="#${this.tabIds}${unique}Content" role="tab" aria-controls="${this.tabIds}${unique}Content" aria-selected="${(active) ? "true" : "false"}"></a>`).appendTo(start);
    if (this.renameTab) $(label).bind('contextmenu', (e) => {
        if ($(e.target).closest("li").data("unique")!==0) {
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
          const unique = $(`#pcm_tabbedPandas a.active:first`).closest("li").data("unique");
          const pandaObj = $(ui.item).closest(".card").data("pandaObj");
          const tabUnique = pandaObj.tabUnique;
          if (unique!==tabUnique) {
            ui.item.detach().appendTo($(`#pcm-t${unique}Content .card-deck:first`));
            pandaObj.tabUnique = unique;
          }
        }
    }));
    return {tabId:`${this.tabIds}${unique}Tab`, tabContent:`${this.tabIds}${unique}Content`};
  }
  updateCaptcha(captchaCount) {
    $(`#${this.ulId} .pcm_captchaText:first`).html(`Captcha Count: ${captchaCount}`)
  }
}