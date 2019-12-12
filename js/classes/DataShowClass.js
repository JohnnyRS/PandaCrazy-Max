class DataShowClass {
	constructor() {
    this.headerObject = null;
    this.dataObject = null;
  }
  editableSuccess(obj, newValue) {
    const value = $(obj).closest(".tab-pane").data("value");
    const name = $(obj).attr("data-name");
    value[name] = newValue;
  }
  editableValidate(obj, value) {
    if ($(obj).data("name")==="duration") {
      if (value==="never") return null;
      if (isNaN(value)) return "Must be number.";
      if (Number(value)<5000) return "Must be abover 5000";
    }
  }
  displayData(key1, selector, obj) {
    let temp = null;
    let row = $(`<div class="row mx-0"></div>`).appendTo(selector);
    let column1 = $(`<div class="col-4 px-0 my-1"></div>`).appendTo(row);
    let listGroup1 = $(`<div class="list-group list-group-flush" id="pcm_listTab" role="tablist"></div>`).appendTo(column1);
    for( const [index, [key2,value]] of Object.entries(Object.entries(this.dataObject[key1])) ) {
      const active = (Number(index)===0) ? " active" : "";
      const disabledClass = (value.disabled) ? " pcm_disabled" : "";
      let temp = $(`<a class="list-group-item list-group-item-action${active} py-0 px-1 mx-0 my-0 border-info text-nowrap text-truncate pcm_triggerItem${disabledClass}" id="list-t${key1}${index}-list" data-key1="${key1}" data-key2="${key2}" data-index="${index}" data-toggle="list" href="#list-t${key1}${index}" role="tab" aria-controls="t${key1}${index}">${value.name} [<span class="text-xs">${shortenGroupId(key2)}</span>]</a>`).data("value",value);
      $(temp).appendTo(listGroup1);
    }
    let column2 = $(`<div class="col-8 pl-1 mx-0"></div>`).appendTo(row);
    let listGroup2 = $(`<div class="tab-content" id="nav-tabContent"></div>`).appendTo(column2);
    for( const [index, [key2,value]] of Object.entries(Object.entries(this.dataObject[key1])) ) {
      const active = (Number(index)===0) ? " show active" : "";
      const disabledText = (value.disabled) ? ` (<span class="text-danger">Disabled</span>)` : ` (<span class="text-success">Enabled</span>)`;
      let tabPane = $(`<div class="tab-pane fade${active}" id="list-t${key1}${index}" role="tabpanel" aria-labelledby="list-t${key1}${index}-list" data-key1="${key1}" data-key2="${key2}" data-test1="${value}"></div>`).data("value",value).data("search",this);
      $(`<div><span class="pcm_tDName">${value.name}</span> - [${shortenGroupId(key2)}]<span class="text-xs pcm_tDDisabled">${disabledText}</span></div>`).appendTo(tabPane);
      let durationLabel = $(`<div>Duration: </div>`).appendTo(tabPane);
      $(`<a href="#" data-type="text" data-placement="right" data-name="duration" data-title="Enter duration above 5000 or type never" class="pcm_editable pcm_tDDuration">${value.duration}</a>`).editable({
          validate: function(value) { return $(this).closest(".tab-pane").data("search").editableValidate(this, value); },
          success: function(response,newValue) { $(this).closest(".tab-pane").data("search").editableSuccess(this,newValue); }
        }).appendTo(durationLabel);
      let onceLabel = $(`<div>Once: </div>`).appendTo(tabPane);
      $(`<a data-type="select" data-placement="right" data-name="once" data-title="Accept only one hit?" class="pcm_editable pcm_tDOnce">${value.once}</a>`).editable({
        value:value.once ? 1 : 0,
        source: [ {value:0, text:'false'}, {value:1, text:'true'} ],
        validate: function(value) { return $(this).closest(".tab-pane").data("search").editableValidate(this, value); },
        success: function(response,newValue) { $(this).closest(".tab-pane").data("search").editableSuccess(this,newValue); }
      }).appendTo(onceLabel);
      $(`<div>Limit Group ID in Queue: <span class="pcm_tDlimitNumQueue">${value.limitNumQueue}</span></div>`).appendTo(tabPane);
      $(`<div>Limit Total Hits in Queue: <span class="pcm_tDlimitTotalQueue">${value.limitTotalQueue}</span></div>`).appendTo(tabPane);
      $(`<div>Temporary GoHam Time on Auto: <span class="pcm_tDtempGoHam">${value.tempGoHam}</span></div>`).appendTo(tabPane);
      $(tabPane).appendTo(listGroup2);
    }
    $.fn.editable.defaults.mode = 'popup';
    // $('.pcm_editable').editable({
    //   validate: function(value) { return $(this).closest(".tab-pane").data("search").editableValidate(this, value); },
    //   success: function(response,newValue) { $(this).closest(".tab-pane").data("search").editableSuccess(this,newValue); }
    // });
    $(selector + " a").on('dblclick', (e) => {
      const theTarget = $(e.target).closest('a');
      const theValue = $(theTarget).data("value");
      obj.enableToggle(theValue);
      if ($(theTarget).hasClass("pcm_disabled")) $(e.target).removeClass("pcm_disabled");
      else $(theTarget).addClass("pcm_disabled");
      const disabledText = (theValue.disabled) ? ` (<span class="text-danger">Disabled</span>)` : ` (<span class="text-success">Enabled</span>)`;
      $(`#list-t${theValue.key1}${$(theTarget).data("index")} .pcm_tDDisabled`).html(disabledText);
     } );
  }
  prepareData(headerObject, dataObject) {
    this.headerObject = headerObject;
    this.dataObject = dataObject;
  }
}