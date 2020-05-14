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
function arrayMove(arr,from,to) { arr.splice(to, 0, arr.splice(from, 1)[0]); };
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
function allTabs(searching, doAfter) {
  let counter = 0;
  chrome.windows.getAll({populate:true}, windows => {
    windows.forEach( window => {
      window.tabs.forEach( tab => { if (tab.url.includes(searching)) counter++; } );
    });
    doAfter.apply(this, [counter]);
  });
}
function saveToFile(theData) {
  var blob = new Blob( [theData], {type: "text/plain"}), dl = document.createElement("A");
  dl.href = URL.createObjectURL(blob); dl.download = "PandaCrazyLog_" + formatAMPM("short") + ".json";
  document.body.appendChild(dl); dl.click(); dl.remove();
}
