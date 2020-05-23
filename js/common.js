/**
 * Creates a Jquery input object and returns it and appends to element if appendHere is passed.
 * @param {object} appendHere     The jquery element to append the input div to.
 * @param {string} divAddClass    Class name for the div surrounding the input.
 * @param {string} id             Id name for the input itself.
 * @param {string} label          Label name used for the label for input.
 * @param {string} placeholder    Placeholder used to show in input field when empty.
 * @param {function} enterFunc    Function to call when enter is pressed in input.
 * @param {string} labelClass     Class name for the label for input.
 * @param {string} value          The initial value for the input field.
 * @param {number} width          The width of the div using bootstrap.
 * @param {bool} noTab            If true then user can't tab to the input field.
 * @param {string} max            The maximum length of the characters allowed in input field.
 */
function createInput(appendHere, divAddClass, id, label, placeholder, enterFunc=null, labelClass="", value="", width="100", noTab=false, max=null) {
  const noIndex = (noTab) ? ` tabindex="-1"` : "", maxlength = (max) ? ` maxlength=${max}` : "";
  let theInput = $(`<div class="form-inline w-${width}${divAddClass}"></div>`).append(`<label for="${id}" class="px-2 text-right${labelClass}">${label}</label>`).append(`<input type="text" class="form-control pcm_inputText-md ml-2 text-left" id="${id}"${noIndex}${maxlength} placeholder="${placeholder}" value="${value}">`);
  if (appendHere) $(theInput).appendTo(appendHere); // Append to the element if defined.
  if (enterFunc!==null) $(theInput).keypress( (e) => { if (e.which===13) enterFunc.call(this, e); } )
  return theInput;
}
/**
 * @param  {object} appendHere
 * @param  {string} addClass
 * @param  {string} theUrl
 * @param  {string} theText
 * @param  {string} theTarget
 * @param  {function} clickFunc=null
 */
function createLink(appendHere, addClass, theUrl, theText, theTarget, clickFunc=null) {
  let theLink = $(`<a class="${addClass}" target="${theTarget}" href="${theUrl}">${theText}</a>`).appendTo(appendHere);
  if (clickFunc!==null) $(theLink).click( (e) => { clickFunc.call(this, e); } )
  return theLink;
}
/**
 * @param  {object} appendHere
 * @param  {string} label
 * @param  {string} id
 * @param  {string} value
 * @param  {bool} checked
 * @param  {string} divClass=""
 * @param  {string} inputClass=""
 */
function createCheckBox(appendHere, label, id, value, checked, divClass="", inputClass="") {
  const checkedText = (checked) ? " checked" : "";
  const formCheck = $(`<div class="form-check form-check-inline${divClass}"></div>`).appendTo(appendHere);
  $(`<input class="form-check-input${checkedText}${inputClass}" type="checkbox" id="${id}" value="${value}"${checkedText}>`).appendTo(formCheck);
  $(`<label class="form-check-label" for="${id}">${label}</label>`).appendTo(formCheck);
  return formCheck;
}
/**
 * @param  {object} appendHere
 * @param  {string} nameGroup
 * @param  {string} value
 * @param  {string} label
 * @param  {bool} checked
 */
function radioButtons(appendHere, nameGroup, value, label, checked) {
  const checkedText = (checked) ? " checked" : "";
  $(`<label class="radio-inline my-0 mx-3 small"><input type="radio"${checkedText} name="${nameGroup}" size="sm" id="id" value="${value}" class="radio-xxs">${label}</input></label>`).appendTo(appendHere);
}
/**
 * @param  {string} label
 * @param  {string} id
 */
function createTimeInput(label, id) {
  let input = $(`<div class="input-group"><label for="${id}" class="px-2 text-right pcm_timeLabel">${label}</label><input type="text" class="form-control datetimepicker-input pcm_inputDate-md" id="${id}" data-toggle="datetimepicker" data-target="#${id}" tabindex="-1" placeholder="None"/></div>`);
  $(input).append(`<div class="pcm-inputClearIcon" id="pcm_clearTInput"><i class="fas fa-times fa-sm"></i></div>`);
  return input;
}
/**
 * @param  {number} val
 * @param  {number} low
 * @param  {number} high
 */
function limitRange(val, low, high) { return val < low ? low : (val > high ? high : val); }
/**
 * @param  {string} hourValue
 * @param  {string} minuteValue
 */
function createTimeElapse(hourValue, minuteValue) {
  let input = createInput(null, " hour", "pcm_endHours", `Ends after hours: `, "0", null, " pcm_hoursLabel", hourValue, "10", true);
  $(input).find("input").addClass("pcm_inputEndHours")
    .on('input', e => { let val = $(e.target).val(); $(e.target).val(limitRange(val, 0, 60)); })
    .on('focus', e => { $(e.target).select(); });
  let input2 = createInput(null, " hour", "pcm_endMinutes", `minutes: `, "0", null, " pcm_minutesLabel", minuteValue, "10", true);
  $(input2).find("input").addClass("pcm_inputEndMinutes")
    .on('input', e => { let val = $(e.target).val(); $(e.target).val(limitRange(val, 0, 60)); })
    .on('focus', e => { $(e.target).select(); });
  return $(input).append(input2);
}
/**
 * @param  {string} theFormat
 * @param  {object} theDate
 * @param  {string} theTimeZone
 */
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
/**
 * @param  {bool} resetNow
 * @param  {string} thisDigit
 * @param  {string} timeString
 * @param  {string} lastDigit
 */
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
/**
 * @param  {number} seconds
 */
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
/**
 * @param  {array} arr
 * @param  {number} from
 * @param  {number} to
 */
function arrayMove(arr,from,to) { arr.splice(to, 0, arr.splice(from, 1)[0]); }
/**
 * @param  {array} arr
 * @param  {string} value
 */
function arrayRemove(arr,value) { return arr.filter( (item) => item !== value ); }
/**
 * @param  {string} gId
 */
function shortenGroupId(gId) { return gId.slice(0, 2) + "..." + gId.slice(-4); }
/**
 * @param  {object} thisObject
 * @param  {object} target
 * @param  {object} element
 * @param  {string} theValue
 * @param  {bool} editMe=null
 * @param  {string} textBorder
 * @param  {string} textColor
 */
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
/**
 * @param  {array} thisArrayObject
 * @param  {object} divContainer
 * @param  {object} thisObject
 * @param  {bool} table=false
 * @param  {bool} horizontal=false
 * @param  {string} trBgColor=""
 */
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
/**
 * Gets all the tabs opened in browser and will count how many page urls that includes the search term.
 * @param {string} search       Search term to use for all tabs opened in browser.
 * @param {function} doAfter    Function to call after counting tabs for search term.
 */
function allTabs(search, doAfter) {
  let count = 0;
  chrome.windows.getAll({populate:true}, windows => { // Populate is true so tabs are included in the windows objects.
    for (let i1=0, len1=windows.length; i1<len1; i1++) {
      for (let i2=0, len2=windows[i1].tabs.length; i2<len2; i2++) {
        const tab = windows[i1].tabs[i2];
        if (tab.url.includes(search)) count++;
      }
    }
    doAfter.call(this, count);
  });
}
/**
 * @param  {object} theData
 */
function saveToFile(theData) {
  var blob = new Blob( [theData], {type: "text/plain"}), dl = document.createElement("A");
  dl.href = URL.createObjectURL(blob); dl.download = "PandaCrazyLog_" + formatAMPM("short") + ".json";
  document.body.appendChild(dl); dl.click(); dl.remove();
}
/**
 * @param  {object} error
 * @param  {string} alertMessage
 * @param  {string} consoleMessage=null
 * @param  {string} title='...'
 * @param  {bool} warn=false
 * @param  {bool} throwError=false
 */
function haltScript(error, alertMessage, consoleMessage=null, title='Fatal error has happened. Stopping script.', warn=false, throwError=false) {
  $('.pcm_top:first').html(''); $('#pcm_quickMenu').html(''); $('.panel').html('');
  $('.panel:first').append(`<H1 style="text-align:center;">${title}</H1><H5 style="color:#FF3333; text-align:center; margin:0 100px;">${alertMessage}</H5>`);
  if (!warn && error) { // Only show message on console as an error if it's not a warning.
    console.error( (consoleMessage) ? consoleMessage : alertMessage , error );
    if (modal) modal.closeModal('Loading Data'); // Close modal before stopping script.
    if (bgQueue) bgQueue.stopQueueMonitor();
    throw 'Stopping script due to an error displayed previously or in another console.';
  } else console.log('Warning: ' + alertMessage); // Show a warning alert message on the console.
}

const CONSOLE_WARN = 'color: red;'
const CONSOLE_INFO = 'color: purple;'
const CONSOLE_DEBUG = 'color: blue;'
