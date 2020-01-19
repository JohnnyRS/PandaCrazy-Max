function createInput(appendHere, divAddClass, id, label, placeholder, enterFunc=null, labelClass="", value="") {
  let theInput = $(`<div class="form-inline w-100${divAddClass}"></div>`).append(`<label for="${id}" class="px-2 text-right${labelClass}">${label}</label>`).append(`<input type="text" class="form-control pcm_inputText-md ml-2 text-left" id="${id}" placeholder="${placeholder}" value="${value}">`).appendTo(appendHere);
  if (enterFunc!==null) $(theInput).keypress( (e) => { if (e.which===13) enterFunc.apply(this, [e]); } )
  return theInput;
}
function createLink(appendHere, addClass, theUrl, theText, theTarget, clickFunc=null) {
  let theLink = $(`<a class="${addClass}" target="${theTarget}" href="${theUrl}">${theText}</a>`).appendTo(appendHere);
  if (clickFunc!==null) $(theLink).click( (e) => { clickFunc.apply(this, [e]); } )
  return theLink;
}
function createCheckBox(appendHere, label, id, value, checked, divClass="", inputClass="") {
  const checkedText = (checked) ? " checked" : "";
  const formCheck = $(`<div class="form-check form-check-inline${divClass}"></div>`).appendTo(appendHere);
  $(`<input class="form-check-input${checkedText}${inputClass}" type="checkbox" id="${id}" value="${value}"${checkedText}>`).appendTo(formCheck);
  $(`<label class="form-check-label" for="${id}">${label}</label>`).appendTo(formCheck);
  return formCheck;
}
function radioButtons(appendHere, nameGroup, value, label, checked) {
  const checkedText = (checked) ? " checked" : "";
  $(`<label class="radio-inline my-0 mx-3 small"><input type="radio"${checkedText} name="${nameGroup}" size="sm" id="id" value="${value}" class="radio-xxs">${label}</input></label>`).appendTo(appendHere);
}
function saveToFile(theData) {
  var blob = new Blob( [JSON.stringify(theData)], {type: "text/plain"}), dl = document.createElement("A");
  dl.href = URL.createObjectURL(blob); dl.download = "PCM_test.json";
  document.body.appendChild(dl); dl.click(); dl.remove();
}
function enableAllHamButtons() {
  $(".pcm_hamButton").removeClass("disabled").addClass("pcm_buttonOff");
}
function disableOtherHamButtons(myId=null) {
  if (myId!==null) $(`#pcm_hamButton_${myId}`).removeClass("pcm_buttonOff").addClass("pcm_buttonOn");
  $(".pcm_hamButton.pcm_buttonOff").addClass("disabled");
}
function formatAMPM(theFormat,theDate,theTimeZone) {
  var d = (theDate) ? theDate : new Date();
  if (theTimeZone === "mturk") {
    let mturkTZOffset = -8, today = new Date(); if (today.dst()) mturkTZOffset++;
    let utc = d.getTime() + (d.getTimezoneOffset() * 60000), MturkTime = utc + (3600000 * mturkTZOffset);
    d = new Date(MturkTime);
  }
  let minutes = d.getMinutes().toString().length == 1 ? '0'+d.getMinutes() : d.getMinutes(),
      hours = d.getHours(), ampm = hours >= 12 ? 'pm' : 'am',
      months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  hours = (hours>= 12) ? (hours-12) : hours;
  hours = (hours.toString().length === 1) ? '0'+hours : hours;
  if (theFormat==="short") return ('0' + (d.getMonth()+1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '-' + d.getFullYear() + '(' + hours + ':' + minutes + ampm + ')';
  else if (theFormat==="dayandtime") return days[d.getDay()] + ' ' + hours + ':' + minutes + ampm;
  else if (theFormat==="onlydate") return ('0' + (d.getMonth()+1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '-' + d.getFullYear();
  else return days[d.getDay()]+' '+months[d.getMonth()]+' '+d.getDate()+' '+d.getFullYear()+' '+hours+':'+minutes+ampm;
}
function formatTimeLeft(resetNow,thisDigit,timeString,lastDigit) {
	formatTimeLeft.timeFill = formatTimeLeft.timeFill || 0;
	if (resetNow) formatTimeLeft.timeFill = 0;
	var missingDigit = (lastDigit!="0" && thisDigit=="0") ? true : false;
	if (( thisDigit!="0" || missingDigit) && formatTimeLeft.timeFill<2) {
		formatTimeLeft.timeFill++;
		if (missingDigit) { return "00 " + timeString + "s"; }
		else {
			var addZero = (thisDigit<10) ? ((formatTimeLeft.timeFill==1) ? false : true) : false, plural = (thisDigit==1) ? true : true;
			return ((addZero) ? "0" : "") + thisDigit + " " + ((plural) ? (timeString+"s") : timeString) + " ";
		}
	} else return "";
}
function getTimeLeft(seconds) {
	let weeks = Math.floor(seconds/604800); seconds = seconds - (weeks*604800);
	let days = Math.floor(seconds/86400); seconds = seconds - (days*86400);
	let hours = Math.floor(seconds/3600); seconds = seconds - (hours*3600);
	let minutes = Math.floor(seconds/60); seconds = seconds - (minutes*60);
  let plusSeconds = seconds, returnString = "", displaying = 0;
  if (weeks>0) { returnString += `${weeks} weeks `; displaying++; }
  if (weeks>0 || days>0) { returnString += `${days} days `; displaying++; }
  if (displaying<2 && (days>0 || hours>0) ) { returnString += `${hours} hours `; displaying++; }
  if (displaying<2 && (hours>0 || minutes>0) ) { returnString += `${minutes} minutes `; displaying++; }
  if (displaying<2) returnString += `${("0" + plusSeconds).slice(-2)} seconds`;
  return returnString.trim();
}
function arrayRemove(arr,value) { return arr.filter( (item) => item !== value ); }
function shortenGroupId(gId) { return gId.slice(0, 2) + "..." + gId.slice(-4); }

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
function allTabs(searching, doAfter) {
  let counter = 0;
  chrome.windows.getAll({populate:true}, windows => {
    windows.forEach( window => {
      window.tabs.forEach( tab => { if (tab.url.includes(searching)) counter++; } );
    });
    console.log(`returning ${counter}`);
    doAfter.apply(this, [counter]);
  });
}
function displayData(key1, appendHere, dataObject, obj) {
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
    displayObjectData([
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
  });
}
function displayObjectData(thisArrayObject, divContainer, thisObject, table=false, horizontal=false, trBgColor="") {
  let row=null;
  const trStyle = (trBgColor!=="") ? ` style="background-color:${trBgColor}"` : "";
  if (horizontal) row = $(`<tr${trStyle}></tr>`).appendTo(divContainer);
  thisArrayObject.forEach(element => {
    let textColor = "", padding="pl-0", valueCol=null, textBorder = "bottom-dotted";
    let theValue = (element.orKey && thisObject[element.orKey]!=="") ? thisObject[element.orKey] : ((element.key) ? ((element.andKey) ? `${thisObject[element.key]} - ${thisObject[element.andKey]}` : thisObject[element.key]) : "");
    theValue = (element.andString) ? `${theValue} - ${element.andString}` : theValue;
    if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
    if (theValue===-1) { theValue = "0"; }
    if (element.format==="date") { theValue = formatAMPM("short",new Date(theValue)); }
    if (element.disable) { textColor = " text-warning"; textBorder = ""; }
    if (element.label!=="") { padding = " pl-4"; }
    const pre = (element.pre) ? element.pre : "", addSpan = (element.type==="text") ? "<span></span>" : "";
    const tdWidth = (element.width) ? `width:${element.width} !important;` : "";
    const tdStyle = ` style="padding-right:1px !important; max-width:320px; ${tdWidth}"`;
    if (table & !horizontal) row = $(`<tr class="d-flex"></tr>`).append(`<td class="col-4 text-right">${element.label}</td>`).appendTo(divContainer);
    else if (!horizontal) row = $(`<div>`).append($(`<span class="${padding}">${element.label}</span>`)).appendTo(divContainer);
    if (table) valueCol = $(`<td class="font-weight-bold text-left px-1 py-1 text-pcmInfo text-truncate"${tdStyle}>${addSpan}</td>`).appendTo(row);
    else valueCol = $(`<span class="font-weight-bold pl-2 text-left text-info">${addSpan}</span>`).data("edit","off").appendTo(row);
    if (element.type==="range") {
      $(`<input class="pcm_inputRange" type="range" min="${element.min}" max="${element.max}" value="${theValue}"></input>`).on('input', (e) => { $(`#pcm_${element.key}Detail`).val(($(e.target).val())); thisObject[element.key] = $(e.target).val(); } ).appendTo(valueCol);
      $(`<input class="pcm_inputRangeText" id="pcm_${element.key}Detail" type="text" value="${theValue}" size="2"></input>`).appendTo(valueCol);
    } else if (element.type==="text") {
        textToggle(thisObject, $(valueCol).find("span"), element, theValue, null, textBorder, textColor);
    } else if (element.type==="trueFalse") {
      $(`<span id="pcm_${element.key}Detail" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`).on('click', (e) => {
        $(e.target).html( ($(e.target).html() === "true") ? "false" : "true" ); thisObject[element.key] = ($(e.target).html() === 'true');
      }).appendTo(valueCol);
    } else if (element.type==="button") {
      const button = $(`<button class="btn btn-primary${element.addClass}" id="${element.idStart}_${element.unique}">${element.label}</button>`);
      if (element.btnFunc) $(button).on('click', {unique:element.unique}, (e) => { element.btnFunc.apply(this, [e]); });
      $(button).appendTo(valueCol);
    } else if (element.type==="checkbox") {
        const theCheckBox = createCheckBox(valueCol, "", `pcm_selection_${element.unique}`, element.unique, "", " m-0", element.inputClass);
        if (element.btnFunc!==null) theCheckBox.on('click', {unique:element.unique}, (e) => { element.btnFunc.apply(this, [e]); });
    } else if (element.type==="keyValue") {
        const id = (element.id) ? ` id=${element.id}` : ``;
        const valueSpan = $(`<span${id}>${pre}${theValue}</span>`).css("cursor", "default").appendTo(valueCol);
        if (element.clickFunc) valueSpan.closest("td").on( 'click', {unique:element.unique}, (e) => { element.clickFunc.apply(this, [e]); });
    } else if (element.type==="string") {
      const border = (element.noBorder) ? "" : " class='border'";
      if (element.string!=="") $(`<span${border}>${element.string}</span>`).appendTo(valueCol);
    }
  });
}
