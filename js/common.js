let todayDay = new Date().getDate();
const _ = undefined;

/** Creates a Jquery input object and returns it and appends to element if appendHere is passed.
 * @param  {object} appendHere      - Jquery Element @param  {string} divAddClass - Div class     @param  {string} id                 - Input ID
 * @param  {string} label           - Label name     @param  {string} placeholder - Placeholder   @param  {function} [enterFunc=null] - Enter pressed
 * @param  {string} [labelClass=""] - label class    @param  {string} [value=""]  - Initial value @param  {number} [width="100"]      - Width
 * @param  {bool} [noTab=false]     - Can't tab      @param  {string} [max=null]  - Max length
 * @return {object}                 - The Jquery object of the input element. */
function createInput(appendHere, divAddClass, id, label, placeholder, enterFunc=null, labelClass="", value="", width="100", noTab=false, max=null) {
  const noIndex = (noTab) ? ` tabindex="-1"` : "", maxlength = (max) ? ` maxlength=${max}` : "";
  let theInput = $(`<div class="form-inline w-${width}${divAddClass}"></div>`).append(`<label for="${id}" class="px-2 text-right${labelClass}">${label}</label>`).append(`<input type="text" class="form-control pcm_inputText-md ml-2 text-left" id="${id}"${noIndex}${maxlength} placeholder="${placeholder}" value="${value}">`);
  if (appendHere) $(theInput).appendTo(appendHere); // Append to the element if defined.
  if (enterFunc!==null) $(theInput).keypress( (e) => { if (e.which===13) enterFunc.call(this, e); } )
  return theInput;
}
/** Create a Jquery file input object and returns it and appends to element if appendHere is passed.
 * @param  {object} [appendHere=null] - The jquery element to append the input div to.
 * @param  {string} [accept=null]     - String of file extensions to accept.
 * @return {object}                   - Jquery element of the input created. */
function createFileInput(appendHere=null, accept=null) {
  let inputGroup = $(`<div class='custom-file'></div>`);
  let acceptStr = (accept) ? ` accept='${accept}'` : '';
  $(`<input type='file' class='custom-file-input' id='customFile' nowrap${acceptStr}><label class='custom-file-label' for='customFile'>Choose file...</label>`).appendTo(inputGroup);
  if (appendHere) inputGroup.appendTo(appendHere);
  return inputGroup;
}
/** Creates a Jquery link and returns it and appends it to element passed.
 * @param  {object} appendHere         - Jquery element @param  {string} addClass  - Link class  @param  {string} theUrl             - Url
 * @param  {string} theText            - Link Text      @param  {string} theTarget - Link Target @param  {function} [clickFunc=null] - Clicked function
 * @return {object}                    - The Jquery object of the link element. */
function createLink(appendHere, addClass, theUrl, theText, theTarget, clickFunc=null) {
  let theLink = $(`<a class="${addClass}" target="${theTarget}" href="${theUrl}">${theText}</a>`).appendTo(appendHere);
  if (clickFunc!==null) $(theLink).click( (e) => { clickFunc(e); } )
  return theLink;
}
/** Creates a Jquery checkbox with a label, id name and classes of elements.
 * @param  {object} appendHere      - Jquery element @param  {string} label - Label text @param  {string} id            - Id name
 * @param  {string} value           - Value          @param  {bool} checked - Checked?   @param  {string} [divClass=""] - Div class
 * @param  {string} [inputClass=""] - Input class
 * @return {object}                 - The Jquery object of the checkbox element. */
function createCheckBox(appendHere, label, id, value, checked, divClass="", inputClass="") {
  const checkedText = (checked) ? " checked" : "";
  const formCheck = $(`<div class="form-check form-check-inline${divClass}"></div>`).appendTo(appendHere);
  $(`<input class="form-check-input${checkedText}${inputClass}" type="checkbox" id="${id}" value="${value}"${checkedText}>`).appendTo(formCheck);
  $(`<label class="form-check-label" for="${id}">${label}</label>`).appendTo(formCheck);
  return formCheck;
}
/** Creates a Jquery radio button with a name group, label and value.
 * @param  {object} appendHere - Jquery element @param  {string} nameGroup - Input name @param  {string} value - Value
 * @param  {string} label      - Label          @param  {bool} checked     - Checked
 * @return {object}            - The Jquery object for the radio button. */
function radioButtons(appendHere, nameGroup, value, label, checked, classAdd='') {
  const checkedText = (checked) ? " checked" : "";
  let radioButton = $(`<label class='radio-inline my-0 mx-3 small ${classAdd}'><input type='radio'${checkedText} name='${nameGroup}' size='sm' value='${value}' class='radio-xxs'>${label}</input></label>`).appendTo(appendHere);
  return radioButton;
}
/** Creates a time input using a datetimepicker from tempus dominus plugin.
 * @param  {string} label - The label for the time input to use. @param  {string} id    - The id name for the time input.
 * @return {object}       - The Jquery object for the time input. */
function createTimeInput(label, id) {
  let input = $(`<div class="input-group"><label for="${id}" class="px-2 text-right pcm_timeLabel">${label}</label><input type="text" class="form-control datetimepicker-input pcm_inputDate-md" id="${id}" data-toggle="datetimepicker" data-target="#${id}" tabindex="-1" placeholder="None"/></div>`);
  $(input).append(`<div class="pcm-inputClearIcon" id="pcm_clearTInput"><i class="fas fa-times fa-sm"></i></div>`);
  return input;
}
function inputRange(appendTo, min, max, theValue, key, setValue) {
  $(`<input class='pcm_inputRange' type='range' min='${min}' max='${max}' value='${theValue}'></input>`).on('input', (e) => {
    $(`#pcm_${key}Detail`).val(($(e.target).val())); setValue(Number($(e.target).val()));
  }).appendTo(appendTo);
  $(`<input class='pcm_inputRangeText' id='pcm_${key}Detail' type='text' value='${theValue}' size='2'></input>`).appendTo(appendTo);
}
/** Limits a value to a low limit and hight limit.
 * @param  {number} val  - The value @param  {number} low  - The low limit @param  {number} high - The high limit
 * @return {number}      - Returns the new value in the limit range. */
function limitRange(val, low, high) { return val < low ? low : (val > high ? high : val); }
/** Shows the hour value and the minute value in two inputs so user can edit them.
 * @param  {string} hourValue   - The hour value to use for hour input.
 * @param  {string} minuteValue - The minute value to use for minute input. */
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
/** Returns the date in a readable format according to the provided format and timezone.
 * @param  {string} theFormat   - The format @param  {object} theDate - The date @param  {string} theTimeZone - The timezone
 * @return {string}             - Returns the string of the date in a more readable format. */
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
/** Convert seconds into the number of weeks, days, hours, minutes and seconds.
 * @param  {number} seconds - The number of seconds to be converted.
 * @return {string}         - The converted time in a string format. */
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
/** Used to count object property values in arrays using a count function and returning the total count.
 * @param  {array} arr - Array @param  {function} countFunc - Counting Function @param  {bool} [counting=true] - Counting or not?
 * @return {number}    - Total value counted or from count function. */
function arrayCount(arr, countFunc, counting=true) { // Similar to the ES6 filter method without creating an array.
  let total = 0;
  if (countFunc && arr.length) {
    for (const item of arr) {
      let val = countFunc(item);
      total += (!counting) ? val : ((val) ? 1 : 0);
    }
  }
  return total;
}
function limitQueue(arr, limitSize) { arr.length = Math.min(arr.length, limitSize); }
/** Moves a value in an array from one position to another. The array is changed by splice so need to return array.
 * @param  {array} arr - Array @param  {number} from - From position @param  {number} to - To position */
function arrayMove(arr, from, to) { arr.splice(to, 0, arr.splice(from, 1)[0]); }
/** Remove a value in an array provided. Must return array because filter doesn't change the array.
 * @param  {array} arr - Array @param  {string} value - Search value
 * @return {array}     - Array with value removed. */
function arrayRemove(arr, value) { return arr.filter( (item) => item !== value ); }
/** Builds up an object with a key having an array of values. Creates key if doesn't exist in object.
 * @param  {object} obj   - Object @param  {string} key - Key value @param  {number} value - Added value */
function buildSortObject(obj, key, value) {
  if (obj.hasOwnProperty(key)) obj[key].push(value); else obj[key] = [value];
}
/** Flattens the object by removing a value from the array in key value.
 * @param  {object} obj - Object @param  {string} key - Key value @param  {number} value - Remove value */
function flattenSortObject(obj, key, value) {
  if (obj.hasOwnProperty(key)) { if (obj[key].length > 1) obj[key] = arrayRemove(obj[key], value); else delete obj[key]; }
}
/** Shorten the group ID into a 2 letters then "..." and 4 letters at end.
 * @param  {string} gId - The group ID to shorten.
 * @return {string}     - The shortened string for the group ID. */
function shortenGroupId(gId, preNum=2, postNum=4) { return gId.slice(0, preNum) + "..." + gId.slice(-1 * postNum); }
/** Toggles showing a text or a text input of a value for editing purposes.
 * @param  {object} thisObject     - Main object @param  {object} target      - Changed target @param  {object} obj             - Object with key
 * @param  {string} theValue       - Value       @param  {bool} [editMe=null] - Input or text? @param  {string} [textBorder=''] - Border class
 * @param  {string} [textColor=''] - Color class */
function textToggle(thisObject, target, obj, theValue, editMe=null, textBorder='', textColor='') {
  let parent = $(target).parent(), pre = (obj.money) ? '$' : '';
  if (editMe) {
    let doTextToggle = (e) => { textToggle(thisObject, e.target, obj, theValue, false, textBorder); }
    $(parent).empty().append($(`<input class='pcm_inputText' id='pcm_${obj.key}DetailI' type="text" value="${theValue}"></input>`).blur( (e) => doTextToggle(e) ).focus( (e) => $(e.target).select() ).keypress( (e) => { if (e.which === 13) doTextToggle(e); } ));
    $(`#pcm_${obj.key}DetailI`).focus();
  } else {
    $(`#pcm_tdLabel_${obj.key}`).css('color', '');
    if (editMe !== null) theValue = $(target).val(); // Null is on first call of function.
    if (theValue === '' || theValue === '{Empty}') { theValue = '{Empty}'; textColor = ' text-danger'; }
    if ( (obj.min === undefined && obj.max === undefined) || ((theValue >= obj.min) && (theValue <= obj.max)) ) {
      if (obj.type === 'number') thisObject[obj.key] = Number((obj.minutes) ? theValue * 60000 : (obj.seconds) ? theValue * 1000 : theValue);
      else if (theValue !== '{Empty}') thisObject[obj.key] = theValue; else thisObject[obj.key] = ''
      let theSpan = $(`<span id='pcm_${obj.key}DetailS' class='${textBorder} font-weight-bold${textColor}'>${pre}${theValue}</span>`);
      $(parent).empty().append(theSpan);
      if (!obj.disable) $(theSpan).on('click', (e) => {
        textToggle(thisObject, e.target, obj, theValue, true, textBorder, textColor);
      });
    } else $(`#pcm_tdLabel_${obj.key}`).css('color', 'red');
  }
}
function markInPlace(findThis, fromHere) {
  let find = findThis.toLowerCase(), findLength = find.length, str = fromHere.toLowerCase(), start = 0, returnStr = '';
  if (!findThis.length || !fromHere.length) return fromHere;
  while ((index = str.indexOf(find, start)) > -1) {
    returnStr = returnStr + fromHere.substring(start, index) + '<mark>' + fromHere.substr(index, findLength) + '</mark>'; start = index + findLength;
  }
  return returnStr + fromHere.substring(start);
}
/** Displays an array of objects line by line in different ways and allows for toggling an edit input
 * for each value. Types: text, range, truefalse, button, checkbox, keyValue and string.
 * @param  {array} thisArrayObject - Array of objects @param  {object} divContainer     - Container   @param  {object} thisObject     - The object
 * @param  {bool} [table=false]    - Table or not?    @param  {bool} [horizontal=false] - Horizontal? @param  {string} [trBgColor=''] - TR background color */
function displayObjectData(thisArrayObject, divContainer, thisObject, table=false, horizontal=false, trBgColor='', append=true) {
  let row=null, tdCol = '';
  const trStyle = (trBgColor!=='') ? ` style='background-color:${trBgColor}'` : '';
  if (horizontal) row = $(`<tr${trStyle}></tr>`).hide();
  for (const element of thisArrayObject) { 
    let useObject = (element.key1) ? thisObject[element.key1] : thisObject;
    if (!useObject || (element.ifNot && useObject[element.ifNot])) continue;
    if (element.keyCheckNot && useObject[element.keyCheck] === element.keyCheckNot) continue;
    let textColor = '', padding='pl-0', valueCol=null, textBorder = 'bottom-dotted';
    let theValue = (element.orKey && useObject[element.orKey]!=='') ? useObject[element.orKey] : ((element.key) ? ((element.andKey) ? `${useObject[element.key]} - ${useObject[element.andKey]}` : useObject[element.key]) : (element.string) ? element.string : '');
    theValue = (element.andString) ? `${theValue} - ${element.andString}` : theValue;
    if (theValue === '') { theValue = '{Empty}'; textColor = ' text-danger'; }
    if (theValue === -1) { theValue = '0'; }
    if (theValue === undefined) { theValue = element.default; }
    if (element.money) theValue = Number(theValue).toFixed(2);
    if (element.format === 'date') { theValue = formatAMPM('short',new Date(theValue)); }
    if (element.link) theValue = `<a href='${element.link}' class='${element.linkClass}' target='_blank'>${theValue}</a>`;
    if (element.disable) { textColor = ' text-warning'; textBorder = ''; }
    if (element.label !== '') { padding = ' pl-4'; }
    if (table & !horizontal) { element.width = 'auto'; element.maxWidth = '450px'; tdCol = 'col-7 '; }
    const pre = (element.pre) ? element.pre : '';
    const addSpan = (element.type === 'text' || element.type === 'number') ? '<span></span>' : '';
    const tdWidth = (element.width) ? `width:${element.width} !important;` : '';
    const tdMaxWidth = (element.maxWidth) ? `max-width:${element.maxWidth} !important;` : '';
    const tdMinWidth = `min-width:` + ((element.minWidth) ? element.minWidth : '20px') + ` !important;`;
    const tdStyle = ` style='padding-right:1px !important; ${tdMaxWidth} ${tdMinWidth} ${tdWidth}'`;
    const addtip = (element.tooltip && element.tooltip!=='') ? ` data-toggle='tooltip' data-html='true' data-placement='bottom' title='${element.tooltip}'` : ``;
    const toolTipClass = (element.tooltip) ? ` pcm_tooltipData`: '';
    if (table & !horizontal) row = $(`<tr class='d-flex'></tr>`).append($(`<td class='col-5 text-right unSelectable'></td>`).append($(`<span${addtip} class='pcm_eleLabel${toolTipClass}' id='pcm_tdLabel_${element.key}'>${element.label}</span>`).data('range',element.data).data('key',element.key)));
    else if (!horizontal) row = $('<div>').append($(`<span class='${padding}'>${element.label}</span>`));
    if (table) valueCol = $(`<td class='${tdCol}font-weight-bold text-left px-1 py-1 text-pcmInfo text-truncate${toolTipClass}'${tdStyle}${addtip}>${addSpan}</td>`);
    else valueCol = $(`<span class='font-weight-bold pl-2 text-left text-info'>${addSpan}</span>`).data('edit','off');
    valueCol.appendTo(row);
    if (element.type==='range') {
      inputRange(valueCol, element.min, element.max, theValue, element.key, (value) => { useObject[element.key] = value; });
    } else if (element.type === 'text' || element.type === 'number') {
      theValue = (element.seconds) ? theValue / 1000 : (element.minutes) ? theValue / 60000 : theValue;
      theValue = (element.min !== undefined) ? Math.min(Math.max(theValue, element.min), element.max) : theValue;
      textToggle(useObject, $(valueCol).find('span'), element, theValue, null, textBorder, textColor);
    } else if (element.type === 'trueFalse') {
      if (element.reverse) theValue = !theValue;
      $(`<span id='pcm_${element.key}Detail' class='${textBorder} font-weight-bold${textColor}'>${theValue}</span>`)
      .on('click', (e) => {
        $(e.target).html( ($(e.target).html() === 'true') ? 'false' : 'true' );
        useObject[element.key] = ($(e.target).html() === 'true');
        if (element.reverse) useObject[element.key] = !useObject[element.key];
      }).appendTo(valueCol);
    } else if (element.type === 'button') {
      element.btnColor = (element.hasOwnProperty('btnColor')) ? element.btnColor : 'primary'
      const button = $(`<button class='btn btn-${element.btnColor}${element.addClass}' id='${element.idStart}_${element.unique}'>${element.btnLabel}</button>`);
      if (element.btnFunc) $(button).on('click', {unique:element.unique}, (e) => { element.btnFunc(e); });
      $(button).appendTo(valueCol);
    } else if (element.type === 'checkbox') {
      const theCheckBox = createCheckBox(valueCol, '', `pcm_selection_${element.unique}`, element.unique, '', ' m-0', element.inputClass);
      if (element.btnFunc!==null) theCheckBox.on('click', {unique:element.unique}, (e) => { element.btnFunc(e); });
    } else if (element.type === 'keyValue') {
      const id = (element.id) ? ` id=${element.id}` : ``;
      const valueSpan = $(`<span${id}>${pre}${theValue}</span>`).css('cursor', 'default').appendTo(valueCol);
      if (element.clickFunc) valueSpan.closest('td').on( 'click', {unique:element.unique}, (e) => { element.clickFunc.apply(this, [e]); });
    } else if (element.type==='string') {
      const id = (element.id) ? ` id=${element.id}` : ``;
      const border = (element.noBorder) ? '' : ` class='border-light'`;
      $(`<span${border}${id}>${theValue}</span>`).appendTo(valueCol);
    }
    if (append) row.appendTo(divContainer); else row.prependTo(divContainer);
    $(row).show();
  }
}
/** Gets all the tabs opened in browser and will count how many page urls that includes the search term.
 * @param {string} search    - Search term to use for all tabs opened in browser.
 * @param {function} doAfter - Function to call after counting tabs for search term. */
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
/** Save object to a file.
 * @param  {object} theData      - The data to write to a file.
 * @param  {string} [type='Exp'] - The type of file to save to add to the filename. */
async function saveToFile(theData, withAlarms=false, doneFunc=null) {
  let blob = new Blob( [JSON.stringify(theData)], {type: 'text/plain'}), dl = document.createElement('A');
  let fileEnd = (withAlarms) ? '_w_alarms' : '';
  dl.href = URL.createObjectURL(blob); dl.download = `PandaCrazyEXP_${formatAMPM('short')}${fileEnd}.json`;
  document.body.appendChild(dl); dl.click();
  setTimeout( () => {
    dl.remove();
    URL.revokeObjectURL(blob);
    if (doneFunc) doneFunc();
  }, 0);
}
/** Get the group id and requester id from the preview or accept url.
 * @param  {string} url - The url to parse and return info from.
 * @return {array}			- Group id is first in array. Requester Id is second in array. */
function parsePandaUrl(url) {
  const groupInfo = url.match(/\/projects\/([^\/]*)\/tasks[\/?]([^\/?]*)/);
  const requesterInfo = url.match(/\/requesters\/([^\/]*)\/projects(\/|\?|$)/);
  let groupId = (groupInfo) ? groupInfo[1] : null;
  let reqId = (requesterInfo) ? requesterInfo[1] : null;
  return [groupId, reqId];
}
/** Halt the script with error messages or just warn and continue script.
 * @param  {object} error                 - The error object that needs to be displayed.
 * @param  {string} alertMessage          - The message to show on page or in console or a warning.
 * @param  {string} [consoleMessage=null] - The message which will display on the console.
 * @param  {string} [title='...']         - The title to be shown on page.
 * @param  {bool} [warn=false]            - True if just a warning and don't stop the script yet! */
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
/** Checks if the day sent is the same day as today.
 * @param  {date} day - The date that needs to be compared to today.
 * @return {bool}     - True if the date is the same as today. */
function isSameDay(day) {
  let d1 = new Date();
  return day.getFullYear() === d1.getFullYear() && day.getMonth() === d1.getMonth() && day.getDate() === d1.getDate();
}
/** Checks if it's a new day.
 * @return {bool} - True if it's a new day. */
function isNewDay() {
  let day = new Date().getDate();
  if (todayDay != day) { todayDay = day; return true; }
  else return false;
}
/** Returns just the date in a string without the time.
 * @param  {object} date - The object date to drop the time from.
 * @return {string}      - Returns the string with only the date without the time. */
function justDate(date) { return new Date(date).toISOString().substring(0, 10); }
/** Creates and returns an object filled with data for a hit using default values without friendly data.
 * @param  {string} gid    - GroupId       @param  {string} desc      - Description  @param  {string} title - Title
 * @param  {string} rid    - ReqId         @param  {string} rN        - ReqName      @param  {string} pay - Price
 * @param  {number} [hA=0] - HitsAvailable @param  {number} [aT=null] - AssignedTime @param  {string} [exp=null] - Expires
 * @return {object}        - Object with all the data set or using default values. */
function hitObject(gid, desc, title, rid, rN, pay, hA=0, aT=null, exp=null) {
  return {'groupId':gid, 'description':desc, 'title':title, 'reqId':rid, 'reqName':rN, 'price':pay, 'hitsAvailable':Number(hA), 'assignedTime':Number(aT), 'expires':exp};
}
/** Creates and returns an object filled with data for a hit and default values set if needed.
 * @param  {string} gid			- GroupId       @param  {string} desc			 - Description     @param  {string} title			- Title
 * @param  {string} rid			- ReqId         @param  {string} rN				 - ReqName         @param  {string} pay				- Price
 * @param  {number} [hA=0]  - HitsAvailable @param  {number} [aT=null] - AssignedTime    @param  {string} [exp=null] - Expires
 * @param  {string} [fT=""]	- FriendlyTitle @param  {string} [fR=""]   - FriendlyReqName
 * @return {object}         - Object with all the data set or using default values. */
function dataObject(gid, desc, title, rid, rN, pay, hA=0, aT=null, exp=null, fT='', fR='') {
  return {'groupId':gid, 'description':desc, 'title':title, 'reqId':rid, 'reqName':rN, 'price':pay, 'hitsAvailable':Number(hA), 'assignedTime':Number(aT), 'expires':exp, 'friendlyTitle':fT, 'friendlyReqName':fR };
}
/** Creates and returns an object for options of a hit and default values set if needed.
 * @param  {bool} [o=false]	- once          @param  {string} [s=null] - search          @param  {number} [tab=-1] - tabUnique
 * @param  {number} [lN=0]	- limitNumQueue @param  {number} [lT=0]	  - limitTotalQueue @param  {number} [lF=0]	  - limitFetches
 * @param  {number} [dur=0] - duration      @param  {bool} [aG=false] - autoGoHam       @param  {number} [hamD=0] - hamDuration
 * @param  {number} [aL=0]	- acceptLimit   @param  {number} [day=0]	- day             @param  {number} [wt=0]	  - weight
 * @param  {number} [dd=0]	- dailyDone
 * @return {object}         - Object with options set or using default values. */
function optObject(o=false, s=null, tab=-1, lN=0, lT=0, lF=0, dur=0, aG=false, hamD=0, aL=0, day=0, wt=0, dd=0, dis=false) {
  let today = new Date();
  if (day===0 || justDate(day) !== justDate(today)) { day = today.getTime(); dd = 0; }
  return {'once':o, 'search':s,'limitNumQueue':Number(lN), 'limitTotalQueue':Number(lT), 'limitFetches':Number(lF), 'duration':Number(dur),'autoGoHam':aG, 'hamDuration':Number(hamD), 'acceptLimit':Number(aL), 'tabUnique':Number(tab), 'day':Number(day), 'dailyDone':Number(dd), 'weight':Number(wt), 'disabled':dis};
}
/** Creates and returns an object for the rules for a search trigger.
 * @param  {array} [bG=[]]  - Blocked gid   @param  {array} [oG=[]]     - Only gid    @param  {array} [exc=[]]    - Exclude terms
 * @param  {array} [inc=[]] - Include terms @param  {number} [min=0.00] - Minimum pay @param  {number} [max=0.00] - Maximum pay
 * @return {object}         - Object with the rules all set. */
function sRulesObject(bG=[], oG=[], exc=[], inc=[], min=0.00, max=0.00) {
  bG = bG.filter(Boolean); oG = oG.filter(Boolean); exc = exc.filter(Boolean); inc = inc.filter(Boolean);
  let terms = (exc.length || inc.length), range = (min > 0.00 || max > 0.00);
  return {'blockGid': new Set(bG), 'onlyGid': new Set(oG), 'terms': terms, 'exclude': new Set(exc), 'include': new Set(inc), 'payRange': range, 'minPay': Number(min), 'maxPay': Number(max)};
}
/** Creates and returns an object for the history database.
 * @param  {string} rN - reqName @param  {string} rid - reqId @param  {number} [pay=0.00] - pay @param  {string} [title=''] - title
 * @param  {string} [desc=''] - description @param  {string} [dur=''] - duration @param  {string} [date=null] - date
 * @return {object}           - Object with data used for the history database. */
function sHistoryObject(rN, rid, pay=0.00, title='', desc='', dur='', date=null) {
  if (!date) date = new Date().toISOString();
  return {'reqName':rN, 'reqId':rid, 'pay': pay, 'title': title, 'description':desc, 'duration': dur, 'date': date};
}
/** Delays the script for certain amount of milliseconds.
 * @param  {number} ms - The milliseconds to delay script for. */
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function compareversion(version1, version2) {
  let result = false; if (!version1) return true;
  if (typeof version1 !== 'object'){ version1 = version1.toString().split('.'); }
  if (typeof version2 !== 'object'){ version2 = version2.toString().split('.'); }
  for (var i=0; i<(Math.max(version1.length, version2.length)); i++){
      if (version1[i] == undefined) { version1[i]=0; }
      if (version2[i] == undefined) { version2[i]=0; }
      if (Number(version1[i])<Number(version2[i])) { result = true; break; }
      if (version1[i] != version2[i]) { break; }
  }
  return(result);
}

/** Constant values for console coloring. */
const CONSOLE_WARN = 'color: red;'
const CONSOLE_INFO = 'color: purple;'
const CONSOLE_DEBUG = 'color: blue;'
