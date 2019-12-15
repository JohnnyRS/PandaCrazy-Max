class DataShowClass {
	constructor() {}
  displayObjectData(thisArrayObject, divContainer, thisObject, table=false) {
    function textToggle(thisObject, target, element, theValue, editMe=null, textBorder, textColor) {
      let parent = $(target).parent();
      if (editMe) {
        $(parent).empty().append($(`<input class="pcm_inputText" id="pcm_${element.key}DetailI" type="text" value="${theValue}"></input>`).blur( (e) => textToggle(thisObject, e.target, element, theValue, false, textBorder, textColor)).focus( (e) => $(e.target).select() ));
        $(`#pcm_${element.key}DetailI`).focus();
      } else {
        if (editMe!==null) thisObject[element.key] = theValue = $(target).val();
        if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
        let theSpan = $(`<span id="pcm_${element.key}DetailS" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`);
        $(parent).empty().append(theSpan);
        if (!element.disable) $(theSpan).on('click', (e) => { 
          textToggle(thisObject, e.target, element, theValue, true, textBorder, textColor);
        });
      }
    }
    thisArrayObject.forEach(element => {
      let textColor = "", padding="pl-0", row=null, valueCol=null, textBorder = "bottom-dotted", theValue = thisObject[element.key];
      if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
      if (theValue===-1) { theValue = "0"; }
      if (element.format==="date") { theValue = formatAMPM("short",new Date(theValue)); }
      if (element.disable) { textColor = " text-warning"; textBorder = ""; }
      if (element.label!=="") { padding = " pl-4"; }
      if (table) row = $(`<tr class="d-flex"></tr>`).append($(`<td class="col-4 text-right">${element.label}</td>`)).appendTo(divContainer);
      else row = $(`<div></div>`).append($(`<span class="${padding}">${element.label}</span>`)).appendTo(divContainer);
      if (table) valueCol = $(`<td class="font-weight-bold col-8 text-left text-pcmInfo"><span></span></td>`).appendTo(row);
      else valueCol = $(`<span class="font-weight-bold pl-2 text-left text-info"><span></span></span>`).data("edit","off").appendTo(row);
      if (element.type==="range") {
        $(`<input class="pcm_inputRange" type="range" min="${element.min}" max="${element.max}" value="${theValue}"></input>`).on('input', (e) => { $(`#pcm_${element.key}Detail`).val(($(e.target).val())); thisObject[element.key] = $(e.target).val(); } ).appendTo(valueCol);
        $(`<input class="pcm_inputRangeText" id="pcm_${element.key}Detail" type="text" value="${theValue}" size="2"></input>`).appendTo(valueCol);
      } else if (element.type==="text") {
          textToggle(thisObject, $(valueCol).find("span"), element, theValue, null, textBorder, textColor);
          // textToggle(this, valueCol[0], element, theValue, textBorder, textColor);
      } else if (element.type==="trueFalse") {
        $(`<span id="pcm_${element.key}Detail" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`).on('click', (e) => {
          $(e.target).html( ($(e.target).html() === "true") ? "false" : "true" ); thisObject[element.key] = $(e.target).html();
        }).appendTo(valueCol);
      } else if (element.type==="string") {
        $(`<span class="border">${element.string}</span>`).appendTo(valueCol);
        
      }
    });
  }
  displayData(key1, appendHere, dataObject, obj) {
    let temp = null;
    let row = $(`<div class="row mx-0"></div>`).appendTo(appendHere);
    let column1 = $(`<div class="col-4 px-0 my-1"></div>`).appendTo(row);
    let listGroup1 = $(`<div class="list-group list-group-flush" id="pcm_listTab" role="tablist"></div>`).appendTo(column1);
    for( const [index, [key2,value]] of Object.entries(Object.entries(dataObject[key1])) ) {
      const active = (Number(index)===0) ? " active" : "";
      const disabledClass = (value.disabled) ? " pcm_disabled" : "";
      let label = $(`<a class="list-group-item list-group-item-action${active} py-0 px-1 mx-0 my-0 border-info text-nowrap text-truncate pcm_triggerItem${disabledClass}" id="list-t${key1}${index}-list" data-toggle="list" href="#list-t${key1}${index}" role="tab" aria-controls="t${key1}${index}">${value.name} [<span class="text-xs">${shortenGroupId(key2)}</span>]</a>`).data("key1",key1).data("key2",key2).data("index",index).data("value",value);
      $(label).appendTo(listGroup1);
    }
    let column2 = $(`<div class="col-8 pl-1 mx-0"></div>`).appendTo(row);
    let listGroup2 = $(`<div class="tab-content" id="nav-tabContent"></div>`).appendTo(column2);
    for( const [index, [key2,value]] of Object.entries(Object.entries(dataObject[key1])) ) {
      const active = (Number(index)===0) ? " show active" : "";
      const disabledText = (value.disabled) ? ` <span class="text-danger pr-2 pcm_disabledText">(Disabled)</span>` : ` <span class="text-success pr-2 pcm_disabledText">(Enabled)</span>`;
      let tabPane = $(`<div class="tab-pane fade${active}" id="list-t${key1}${index}" role="tabpanel" aria-labelledby="list-t${key1}${index}-list" data-key1=${key1} data-key2="${key2}" data-test1="${value}"></div>`).data("value",value).data("search",this).appendTo(listGroup2);
      this.displayObjectData([
        { label:"", type:"string", string:`<span class="text-pcmInfo pl-1">${value.name}</span> - <span class="text-xs text-light">[${shortenGroupId(key2)}]</span>${disabledText}` },
        { label:"Duration: ", type:"text", key:"duration" }, 
        { label:"Once: ", type:"text", key:"once" }, 
        { label:"Limit Group ID in Queue: ", type:"text", key:"limitNumQueue" }, 
        { label:"Limit Total Hits in Queue: ", type:"text", key:"limitTotalQueue" }, 
        { label:"Temporary GoHam Time on Auto: ", type:"text", key:"tempGoHam", disable:true } 
      ], tabPane, dataObject[key1][key2]);
    }
    $(appendHere).find('a').on('dblclick', (e) => {
      const theTarget = $(e.target).closest('a');
      const theValue = $(theTarget).data("value");
      obj.enableToggle(theValue);
      if ($(theTarget).hasClass("pcm_disabled")) $(e.target).removeClass("pcm_disabled");
      else $(theTarget).addClass("pcm_disabled");
      const disabledText = (theValue.disabled) ? ` <span class="text-danger pcm_disabledText">(Disabled)</span>` : ` <span class="text-success pcm_disabledText">(Enabled)</span>`;
      $(`#list-t${theValue.key1}${$(theTarget).data("index")} .pcm_disabledText`).html(disabledText);
     } );
  }
}