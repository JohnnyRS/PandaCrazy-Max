let todayDay = moment().date();
const _ = undefined;

/**
 * Creates a Jquery input object and returns it and appends to element if appendHere is passed.
 * @param  {object} appendHere  - The jquery element to append the input div to.
 * @param  {string} divAddClass - Class name for the div surrounding the input.
 * @param  {string} id          - Id name for the input itself.
 * @param  {string} label       - Label name used for the label for input.
 * @param  {string} placeholder - Placeholder used to show in input field when empty.
 * @param  {function} enterFunc - Function to call when enter is pressed in input.
 * @param  {string} labelClass  - Class name for the label for input.
 * @param  {string} value       - The initial value for the input field.
 * @param  {number} width       - The width of the div using bootstrap.
 * @param  {bool} noTab         - If true then user can't tab to the input field.
 * @param  {string} max         - The maximum length of the characters allowed in input field.
 * @return {object}             - The Jquery object of the input element.
 */
function createInput(appendHere, divAddClass, id, label, placeholder, enterFunc=null, labelClass="", value="", width="100", noTab=false, max=null) {
  const noIndex = (noTab) ? ` tabindex="-1"` : "", maxlength = (max) ? ` maxlength=${max}` : "";
  let theInput = $(`<div class="form-inline w-${width}${divAddClass}"></div>`).append(`<label for="${id}" class="px-2 text-right${labelClass}">${label}</label>`).append(`<input type="text" class="form-control pcm_inputText-md ml-2 text-left" id="${id}"${noIndex}${maxlength} placeholder="${placeholder}" value="${value}">`);
  if (appendHere) $(theInput).appendTo(appendHere); // Append to the element if defined.
  if (enterFunc!==null) $(theInput).keypress( (e) => { if (e.which===13) enterFunc.call(this, e); } )
  return theInput;
}
/**
 * Creates a Jquery link and returns it and appends it to element passed.
 * @param  {object} appendHere         - The element to append the link to.
 * @param  {string} addClass           - The class name used for the link.
 * @param  {string} theUrl             - The url used for the link.
 * @param  {string} theText            - The text shown for the link.
 * @param  {string} theTarget          - The target string of the link.
 * @param  {function} [clickFunc=null] - The function to call when link is clicked.
 * @return {object}                    - The Jquery object of the link element.
 */
function createLink(appendHere, addClass, theUrl, theText, theTarget, clickFunc=null) {
  let theLink = $(`<a class="${addClass}" target="${theTarget}" href="${theUrl}">${theText}</a>`).appendTo(appendHere);
  if (clickFunc!==null) $(theLink).click( (e) => { clickFunc(e); } )
  return theLink;
}
/**
 * Creates a Jquery checkbox with a label, id name and classes of elements.
 * @param  {object} appendHere      - The element to append the checkbox to.
 * @param  {string} label           - The label used for this checkbox.
 * @param  {string} id              - The id name used for the checkbox.
 * @param  {string} value           - The value for this checkbox.
 * @param  {bool} checked           - Should this checkbox be checked or not?
 * @param  {string} [divClass=""]   - The class name to use for the div element surrounding the input.
 * @param  {string} [inputClass=""] - The class name to use for the input element.
 * @return {object}                 - The Jquery object of the checkbox element.
 */
function createCheckBox(appendHere, label, id, value, checked, divClass="", inputClass="") {
  const checkedText = (checked) ? " checked" : "";
  const formCheck = $(`<div class="form-check form-check-inline${divClass}"></div>`).appendTo(appendHere);
  $(`<input class="form-check-input${checkedText}${inputClass}" type="checkbox" id="${id}" value="${value}"${checkedText}>`).appendTo(formCheck);
  $(`<label class="form-check-label" for="${id}">${label}</label>`).appendTo(formCheck);
  return formCheck;
}
/**
 * Creates a Jquery radio button with a name group, label and value.
 * @param  {object} appendHere - The element to append the radio button to.
 * @param  {string} nameGroup  - The name group for this radio button.
 * @param  {string} value      - The value for this radio button.
 * @param  {string} label      - The label for this radio button.
 * @param  {bool} checked      - Should this radio button be check or not?
 * @return {object}            - The Jquery object for the radio button.
 */
function radioButtons(appendHere, nameGroup, value, label, checked) {
  const checkedText = (checked) ? " checked" : "";
  let radioButton = $(`<label class="radio-inline my-0 mx-3 small"><input type="radio"${checkedText} name="${nameGroup}" size="sm" id="id" value="${value}" class="radio-xxs">${label}</input></label>`).appendTo(appendHere);
  return radioButton;
}
/**
 * Creates a time input using a datetimepicker from tempus dominus plugin.
 * @param  {string} label - The label for the time input to use.
 * @param  {string} id    - The id name for the time input.
 * @return {object}       - The Jquery object for the time input.
 */
function createTimeInput(label, id) {
  let input = $(`<div class="input-group"><label for="${id}" class="px-2 text-right pcm_timeLabel">${label}</label><input type="text" class="form-control datetimepicker-input pcm_inputDate-md" id="${id}" data-toggle="datetimepicker" data-target="#${id}" tabindex="-1" placeholder="None"/></div>`);
  $(input).append(`<div class="pcm-inputClearIcon" id="pcm_clearTInput"><i class="fas fa-times fa-sm"></i></div>`);
  return input;
}
/**
 * Limits a value to a low limit and hight limit.
 * @param  {number} val  - The value to limit for.
 * @param  {number} low  - The low limit to use.
 * @param  {number} high - The high limit to use.
 * @return {number}      - Returns the new value in the limit range.
 */
function limitRange(val, low, high) { return val < low ? low : (val > high ? high : val); }
/**
 * Shows the hour value and the minute value in two inputs so user can edit them.
 * @param  {string} hourValue   - The hour value to use for hour input.
 * @param  {string} minuteValue - The minute value to use for minute input.
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
 * Returns the date in a readable format according to the provided format and timezone.
 * @param  {string} theFormat   - The format to show the dat in.
 * @param  {object} theDate     - The date to show in the readable format.
 * @param  {string} theTimeZone - The timezone to use for the date.
 * @return {string}             - Returns the string of the date in a more readable format.
 */
function formatAMPM(theFormat, theDate, theTimeZone) {
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
 * Convert seconds into the number of weeks, days, hours, minutes and seconds.
 * @param  {number} seconds - The number of seconds to be converted.
 * @return {string}         - The converted time in a string format.
 */
function getTimeLeft(seconds) {
  let returnString = "", displaying = 0;
  if (seconds>=0) {
    let weeks = Math.floor(seconds/604800); seconds = seconds - (weeks*604800);
    let days = Math.floor(seconds/86400); seconds = seconds - (days*86400);
    let hours = Math.floor(seconds/3600); seconds = seconds - (hours*3600);
    let minutes = Math.floor(seconds/60); seconds = seconds - (minutes*60);
    let plusSeconds = seconds;
    if (weeks>0) { returnString += `${weeks} weeks `; displaying++; }
    if (weeks>0 || days>0) { returnString += `${days} days `; displaying++; }
    if (displaying<2 && (days>0 || hours>0) ) { returnString += `${hours} hours `; displaying++; }
    if (displaying<2 && (hours>0 || minutes>0) ) { returnString += `${minutes} minutes `; displaying++; }
    if (displaying<2) returnString += `${("0" + plusSeconds).slice(-2)} seconds`;
  } else returnString = "0 seconds";
  return returnString.trim();
}
/**
 * Moves a value in an array from one position to another. The array is changed by splice so need to return array.
 * @param  {array} arr   - The array that will be changed with a move action.
 * @param  {number} from - The position of the value that needs to be moved.
 * @param  {number} to   - The position the value in the from position to move to.
 */
function arrayMove(arr,from,to) { arr.splice(to, 0, arr.splice(from, 1)[0]); }
/**
 * Remove a value in an array provided. Must return array because filter doesn't change the array.
 * @param  {array} arr    - The array that needs to be changed with a remove action.
 * @param  {string} value - The value to search for and remove from the array.
 * @return {array}        - The new array that has the value removed.
 */
function arrayRemove(arr,value) { return arr.filter( (item) => item !== value ); }
/**
 * Shorten the group ID into a 2 letters then "..." and 4 letters at end.
 * @param  {string} gId - The group ID to shorten.
 * @return {string}     - The shortened string for the group ID.
 */
function shortenGroupId(gId) { return gId.slice(0, 2) + "..." + gId.slice(-4); }
/**
 * Toggles showing a text or a text input of a value for editing purposes.
 * @param  {object} thisObject      - The object with the value that may be edited.
 * @param  {object} target          - The element which will be changed to a text or input.
 * @param  {object} obj             - The object with the key and info for value to be shown or edited.
 * @param  {string} theValue        - The value of the data to be shown or edited.
 * @param  {bool} [editMe=null]     - Should the input text be shown or just the text value?
 * @param  {string} [textBorder=""] - The bootstrap border to add to element.
 * @param  {string} [textColor=""]  - The bootstrap color to add to element.
 */
function textToggle(thisObject, target, obj, theValue, editMe=null, textBorder="", textColor="") {
  let parent = $(target).parent();
  if (editMe) {
    $(parent).empty().append($(`<input class="pcm_inputText" id="pcm_${obj.key}DetailI" type="text" value="${theValue}"></input>`).blur( (e) => textToggle(thisObject, e.target, obj, theValue, false, textBorder, textColor)).focus( (e) => $(e.target).select() ));
    $(`#pcm_${obj.key}DetailI`).focus();
  } else {
    if (editMe!==null) thisObject[obj.key] = theValue = $(target).val(); // Null is on first call of function.
    if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
    let theSpan = $(`<span id="pcm_${obj.key}DetailS" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`);
    $(parent).empty().append(theSpan);
    if (!obj.disable) $(theSpan).on('click', (e) => { 
      textToggle(thisObject, e.target, obj, theValue, true, textBorder, textColor);
    });
  }
}
/**
 * Displays an array of objects line by line in different ways and allows for toggling an edit input
 * for each value. Types: text, range, truefalse, button, checkbox, keyValue and string.
 * @param  {array} thisArrayObject   - The array with object data to display line by line.
 * @param  {object} divContainer     - The div container that all these elements should be appened to.
 * @param  {object} thisObject       - The object with the values to be displayed on page.
 * @param  {bool} [table=false]      - Should the elements be listed in a table?
 * @param  {bool} [horizontal=false] - Should the values be displayed horizontally?
 * @param  {string} [trBgColor=""]   - The background color for the tr element.
 */
function displayObjectData(thisArrayObject, divContainer, thisObject, table=false, horizontal=false, trBgColor="") {
  let row=null;
  const trStyle = (trBgColor!=="") ? ` style="background-color:${trBgColor}"` : "";
  if (horizontal) row = $(`<tr${trStyle}></tr>`).hide();
  for (const element of thisArrayObject) {
    let textColor = "", padding="pl-0", valueCol=null, textBorder = "bottom-dotted";
    let theValue = (element.orKey && thisObject[element.orKey]!=="") ? thisObject[element.orKey] : ((element.key) ? ((element.andKey) ? `${thisObject[element.key]} - ${thisObject[element.andKey]}` : thisObject[element.key]) : "");
    theValue = (element.andString) ? `${theValue} - ${element.andString}` : theValue;
    if (theValue==="") { theValue = "{Empty}"; textColor = " text-danger"; }
    if (theValue===-1) { theValue = "0"; }
    if (theValue===undefined) { theValue = element.default; }
    if (element.format==="date") { theValue = formatAMPM("short",new Date(theValue)); }
    if (element.disable) { textColor = " text-warning"; textBorder = ""; }
    if (element.label!=="") { padding = " pl-4"; }
    const pre = (element.pre) ? element.pre : "", addSpan = (element.type==="text") ? "<span></span>" : "";
    const tdWidth = (element.width) ? `width:${element.width} !important;` : "";
    const tdStyle = ` style="padding-right:1px !important; max-width:320px; ${tdWidth}"`;
    if (table & !horizontal) row = $(`<tr class="d-flex"></tr>`).append(`<td class="col-4 text-right">${element.label}</td>`);
    else if (!horizontal) row = $(`<div>`).append($(`<span class="${padding}">${element.label}</span>`));
    if (table) valueCol = $(`<td class="font-weight-bold text-left px-1 py-1 text-pcmInfo text-truncate"${tdStyle}>${addSpan}</td>`);
    else valueCol = $(`<span class="font-weight-bold pl-2 text-left text-info">${addSpan}</span>`).data("edit","off");
    valueCol.appendTo(row);
    if (element.type==="range") {
      $(`<input class="pcm_inputRange" type="range" min="${element.min}" max="${element.max}" value="${theValue}"></input>`).on('input', (e) => {
        $(`#pcm_${element.key}Detail`).val(($(e.target).val())); thisObject[element.key] = $(e.target).val();
      } ).appendTo(valueCol);
      $(`<input class="pcm_inputRangeText" id="pcm_${element.key}Detail" type="text" value="${theValue}" size="2"></input>`).appendTo(valueCol);
    } else if (element.type==="text") {
        textToggle(thisObject, $(valueCol).find("span"), element, theValue, null, textBorder, textColor);
    } else if (element.type==="trueFalse") {
      $(`<span id="pcm_${element.key}Detail" class="${textBorder} font-weight-bold${textColor}">${theValue}</span>`)
      .on('click', (e) => {
        $(e.target).html( ($(e.target).html() === "true") ? "false" : "true" ); thisObject[element.key] = ($(e.target).html() === 'true');
      }).appendTo(valueCol);
    } else if (element.type==="button") {
      const button = $(`<button class="btn btn-primary${element.addClass}" id="${element.idStart}_${element.unique}">${element.label}</button>`);
      if (element.btnFunc) $(button).on('click', {unique:element.unique}, (e) => { element.btnFunc(e); });
      $(button).appendTo(valueCol);
    } else if (element.type==="checkbox") {
      const theCheckBox = createCheckBox(valueCol, "", `pcm_selection_${element.unique}`, element.unique, "", " m-0", element.inputClass);
      if (element.btnFunc!==null) theCheckBox.on('click', {unique:element.unique}, (e) => { element.btnFunc(e); });
    } else if (element.type==="keyValue") {
      const id = (element.id) ? ` id=${element.id}` : ``;
      const valueSpan = $(`<span${id}>${pre}${theValue}</span>`).css("cursor", "default").appendTo(valueCol);
      if (element.clickFunc) valueSpan.closest("td").on( 'click', {unique:element.unique}, (e) => { element.clickFunc.apply(this, [e]); });
    } else if (element.type==="string") {
      const border = (element.noBorder) ? "" : " class='border'";
      if (element.string!=="") $(`<span${border}>${element.string}</span>`).appendTo(valueCol);
    }
    row.appendTo(divContainer);
    $(row).show();
  }
}
/**
 * This is called after the alarm data are prepared and ready.
 * @callback doAfterCallBack
 * @param {number} count - The number of tabs counted with the search term.
 */
/**
 * Gets all the tabs opened in browser and will count how many page urls that includes the search term.
 * @param {string} search           - Search term to use for all tabs opened in browser.
 * @param {doAfterCallBack} doAfter - Function to call after counting tabs for search term.
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
    doAfter(count);
  });
}
/**
 * Save object to a file.
 * @param  {object} theData - The data to write to a file.
 */
function saveToFile(theData) {
  var blob = new Blob( [theData], {type: "text/plain"}), dl = document.createElement("A");
  dl.href = URL.createObjectURL(blob); dl.download = "PandaCrazyLog_" + formatAMPM("short") + ".json";
  document.body.appendChild(dl); dl.click(); dl.remove();
}
/**
 * Halt the script with error messages or just warn and continue script.
 * @param  {object} error                 - The error object that needs to be displayed.
 * @param  {string} alertMessage          - The message to show on page or in console or a warning.
 * @param  {string} [consoleMessage=null] - The message which will display on the console.
 * @param  {string} [title='...']         - The title to be shown on page.
 * @param  {bool} [warn=false]            - True if just a warning and don't stop the script yet!
 */
function haltScript(error, alertMessage, consoleMessage=null, title='Fatal error has happened. Stopping script.', warn=false) {
  $('.pcm_top:first').html(''); $('#pcm_quickMenu').html(''); $('.panel').html('');
  $('.panel:first').append(`<H1 style="text-align:center;">${title}</H1><H5 style="color:#FF3333; text-align:center; margin:0 100px;">${alertMessage}</H5>`);
  if (!warn && error) { // Only show message on console as an error if it's not a warning.
    console.error( (consoleMessage) ? consoleMessage : alertMessage , error );
    if (modal) modal.closeModal('Loading Data'); // Close modal before stopping script.
    if (bgQueue) bgQueue.stopQueueMonitor();
    throw 'Stopping script due to an error displayed previously or in another console.';
  } else console.log('Warning: ' + alertMessage); // Show a warning alert message on the console.
}
/**
 * Checks if it's a new day.
 * @return {bool} - True if it's a new day.
 */
function isNewDay() {
  let day = moment().date();
  if (todayDay != day) { todayDay = day; return true; }
  else return false;
}
/** Creates and returns an object filled with data for a hit and default values set if needed.
 * @param  {string} gid				 - The group ID for this panda.
 * @param  {string} desc			 - The description for this panda.
 * @param  {string} title			 - The title for this panda.
 * @param  {string} rid				 - The requester ID for this panda.
 * @param  {string} rN				 - The requester name for this panda.
 * @param  {string} pay				 - The price for this panda.
 * @param  {number} [hA=0]		 - The number of hits avaiable to collect in a batch?
 * @param  {number} [aT=null]  - Time duration in seconds for this hit.
 * @param  {string} [exp=null] - Time that this hit will expire from mturk.
 * @param  {string} [fT=""]	   - The friendly title to use for this panda job.
 * @param  {string} [fR=""]    - The friendly requester name to use for this panda job.
 * @return {object}            - Object with all the data set or using default values.
 */
function dataObject(gid, desc, title, rid, rN, pay, hA=0, aT=null, exp=null, fT='', fR='') {
  return {'groupId':gid, 'description':desc, 'title':title, 'reqId':rid, 'reqName':rN, 'price':pay, 'hitsAvailable':hA, 'assignedTime':aT, 'expires':exp, 'friendlyTitle':fT, 'friendlyReqName':fR};
}
/** Creates and returns an object for options of a hit and default values set if needed.
 * @param  {bool} [once=false]	- Should this panda job only accept one hit?
 * @param  {string} [srch=null] - Is this a search job and what kind will it be?
 * @param  {number} [tab=-1]		- The tab used for the card for this panda job.
 * @param  {number} [lNQ=0]		  - Limit the number of this group id in the queue at once.
 * @param  {number} [lTQ=0]	    - Limit the total number of hits in the queue before collecting more.
 * @param  {number} [lF=0]		  - Number of times to try to fetch panda before stopping.
 * @param  {number} [dur=0]			- The duration for this panda to collect before turning off.
 * @param  {bool} [aGH=false]		- Should this go ham automatically?
 * @param  {number} [hamD=0]		- The duration used in go ham mode.
 * @param  {number} [aL=0]			- The amount of hits to collect today before stopping.
 * @return {object}             - Object with options set or using default values.
 */
function optObject(once=false, srch=null, tab=-1, lNQ=0, lTQ=0, lF=0, dur=0, aGH=false, hamD=0, aL=0) {
  return {'once':once, 'search':srch,'limitNumQueue':lNQ, 'limitTotalQueue':lTQ, 'limitFetches':lF, 'duration':dur,'autoGoHam':aGH, 'hamDuration':hamD, 'acceptLimit':aL, 'tabUnique':tab};
}

/** Constant values for console coloring. */
const CONSOLE_WARN = 'color: red;'
const CONSOLE_INFO = 'color: purple;'
const CONSOLE_DEBUG = 'color: blue;'
