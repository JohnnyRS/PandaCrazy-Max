class TabbedClass {

	constructor(element) {
    this.unique = 0;
    this.tabObject = {};
    this.currentTab = this.unique;
    this.attachedTo = element;

    this.tabStructure(this.attachedTo);
    this.addAddButton($(`#pcm_tabbedPandas`));
    this.tabObject[this.unique] = {label:"Main"}
    this.addTab($(`#pcm_tabbedPandas`), $(`#pcm_pandaTabContents`), this.tabObject[this.unique].label, this.unique++, true);
    this.tabObject[this.unique] = {label:"Test"}
    this.addTab($(`#pcm_tabbedPandas`), $(`#pcm_pandaTabContents`), this.tabObject[this.unique].label, this.unique++);
  }
  tabStructure(element) {
    $(`<div id="pcm_pandaTabs" class="h-100 p-0"></div>`).append($(`<ul class="nav nav-tabs" id="pcm_tabbedPandas" role="tablist"></ul>`)).append($(`<div id="pcm_pandaTabContents" class="tab-content"></div>`)).appendTo($(element));
  }
  addAddButton(tabElement) {
    $(`<li class="nav-item pcm-addTab"></li>`).append($(`<a class="nav-link small py-0 px-1" href="#tabadd">+</a>`).click( (e) => {
      e.preventDefault();
      const label = prompt(`Enter New Tab Label: `, `Added-${this.unique}`);
      if (label && returnName!=="") {
        this.tabObject[this.unique] = {label:label};
        this.addTab($(`#pcm_tabbedPandas`), $(`#pcm_pandaTabContents`), label, this.unique++);
        console.log(this.tabObject);
      }
    } )).appendTo($(tabElement));
  }
  addTab(tabEle, tabContents, name, unique, active=false) {
    const activeText = (active) ? " active" : "";
    const start = $(`<li class="nav-item"></li>`).data("unique", unique).insertBefore($(tabEle).find(`.pcm-addTab`))
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
    const label = $(`<a class="nav-link${activeText} small py-0 pl-2 pr-1" id="pcm-t${unique}Tab" data-toggle="tab" href="#pcm-t${unique}Content" role="tab" aria-controls="pandaMain" aria-selected="true"></a>`).appendTo(start).bind('contextmenu', (e) => {
        if ($(e.target).closest("li").data("unique")!==0) {
          const label = prompt(`Enter New Tab Label: `, $(e.target).text());
          if (label && label!=="") { this.tabObject[this.unique] = {label:label}; $(e.target).html(label); }
          e.preventDefault();
        }
        e.preventDefault();
        return false;
      });
      $(label).append($(`<span>${name}</span>`));
    if (unique!==0) $(label).append($(`<span class="float-right pl-3 font-weight-bold pcm-tabDelete">x</span>`).click( (e) => {
        e.preventDefault(); e.stopPropagation();
        const unique = $(e.target).closest('li').data("unique");
        $(e.target).closest('li').remove();
        delete this.tabObject[unique];
      }));
    $(`<div class="tab-pane pcm_tabs fade p-0 show${activeText}" id="pcm-t${unique}Content" name="${name}" role="tabpanel"></div>`).append($(`<div class="card-deck p-0 px-1"></div>`).data("unique",unique).sortable({ opacity:0.5, cursor:"move", appendTo: document.body, helper: "clone",
        stop: function(e, ui) {
          const unique = $(`#pcm_tabbedPandas a.active:first`).closest("li").data("unique");
          const pandaObj = $(ui.item).closest(".card").data("pandaObj");
          const tabUnique = pandaObj.tabUnique;
          if (unique!==tabUnique) {
            ui.item.detach().appendTo($(`#pcm-t${unique}Content .card-deck:first`));
            pandaObj.tabUnique = unique;
          }
        }
    })).appendTo($(tabContents));
  }
}