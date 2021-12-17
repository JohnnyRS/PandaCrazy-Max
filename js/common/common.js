let gStartDate = new Date();   // The current local date.
let gMturkDate = null;         // The current date in timezone where MTURK is located.
const _ = undefined;           // Used for sending to functions if parameter is not used.
/** Constant values for console coloring. **/
const CONSOLE_WARN  = 'color: red;'
const CONSOLE_INFO  = 'color: purple;'
const CONSOLE_DEBUG = 'color: blue;'

/** Will take the maximum timezone offset of Jan 1st and Jul 1st to get the standard timezone and return it.
 * @return {number} - The maximum timezone offset of jan 1st and jul 1st.
**/
Date.prototype.stdTimezoneOffset = function() {
  var jan = new Date(this.getFullYear(), 0, 1), jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};
/** Compares the current timezone offset to the standard timezone offset and returns if the current one is less than which means it's observing DST.
 * @return {bool} - Returns if the current timezone offset is less than the standard which means it's observing DST.
**/
Date.prototype.isDstObserved  = function() {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
};
/** Checks to see if a value is a string.
 * @param  {object} val - Unknown type of value.
 * @return {bool}       - True if val is a string and false otherwise.
**/
function checkString(val) { if (typeof val === 'string') return true; else return false; }
/** Returns an empty sting if the value given is undefined or null.
 * @param  {object} val - Value to check.
 * @return {string}     - Returns an empty string if value is empty.
**/
function passEmptyStr(val) { return (val) ? val : ''; }
/** Creates a Jquery input object and returns it and appends to element if appendHere is passed.
 * @param  {object} appendHere   - Jquery element.  @param  {string} divAddClass - Div class.      @param  {string} id            - Input ID.
 * @param  {string} label        - Label name.      @param  {string} placeholder - Placeholder.    @param  {function} [enterFunc] - Enter pressed function.
 * @param  {string} [labelClass] - Label class.     @param  {string} [value]     - Initial value.  @param  {string} [width]       - The width.
 * @param  {bool} [noTab]        - No tab key.      @param  {string} [max]       - Max length.     @param  {string} [labelTitle]  - Label title.
 * @return {object}              - The Jquery object of the input element.
**/
function createInput(appendHere, divAddClass, id, label, placeholder, enterFunc=null, labelClass='', value='', width='100', noTab=false, max=null, labelTitle=null) {
  let noIndex = (noTab) ? ` tabindex='-1'` : '', maxlength = (max) ? ` maxlength=${max}` : '', addTitle = (labelTitle) ? ` data-original-title='${labelTitle}'` : '';
  let addClass = (divAddClass) ? ` ${divAddClass}` : '', lAddClass = (labelClass) ? ` ${labelClass}` : '', theValue = (value) ? ` value='${value}'` : '';
  let theInput = $(`<div class='form-inline w-${width}${addClass}'></div>`).append(`<label for='${id}' class='pcm-inputLabel-md${lAddClass}'${addTitle}>${label}</label>`).append(`<input type='text' class='form-control pcm-inputText-md' id='${id}'${noIndex}${maxlength} placeholder='${placeholder}'${theValue}>`);
  if (appendHere) $(theInput).appendTo(appendHere); // Append to the element if defined.
  if (enterFunc !== null) $(theInput).keypress( e => { if (e.keyCode === 13) enterFunc.call(this, e); } )
  return theInput;
}
/** Create a Jquery file input object and returns it and appends to element if appendHere is passed.
 * @param  {object} [appendHere] - Jquery Element.  @param  {string} [accept] - String of file extensions to accept.  @param  {string} [title] - Input title.
 * @return {object}              - Jquery element of the input created.
**/
function createFileInput(appendHere=null, accept=null, title=null) {
  let acceptStr = (accept) ? ` accept='${accept}'` : '', addTitle = (title) ? ` data-original-title='${title}'` : '';
  let inputGroup = $(`<div class='custom-file pcm-tooltipData pcm-tooltipHelper'${addTitle}></div>`);
  $(`<input type='file' class='custom-file-input' id='customFile' nowrap${acceptStr}><label class='custom-file-label' for='customFile'>Choose file...</label>`).appendTo(inputGroup);
  if (appendHere) inputGroup.appendTo(appendHere);
  return inputGroup;
}
/** Creates a Jquery link and returns it and appends it to element passed.
 * @param  {object} appendHere - Jquery element.  @param  {string} addClass  - Link class.   @param  {string} theUrl        - The URL.
 * @param  {string} theText    - Link text.       @param  {string} theTarget - Link target.  @param  {function} [clickFunc] - Clicked function.
 * @return {object}            - The jquery object of the link element.
**/
function createLink(appendHere, addClass, theUrl, theText, theTarget, clickFunc=null) {
  let theLink = $(`<a class='${addClass}' target='${theTarget}' href='${theUrl}'>${theText}</a>`).appendTo(appendHere);
  if (clickFunc !== null) $(theLink).click( e => { clickFunc(e); } )
  return theLink;
}
/** Creates a Jquery checkbox with a label, id name and classes of elements.
 * @param  {object} appendHere   - Jquery element.  @param  {string} label        - Label text.  @param  {string} id            - Id name.
 * @param  {string} value        - The value.       @param  {bool} checked        - Checked?     @param  {string} [divClass]    - Div class.
 * @param  {string} [inputClass] - Input class.     @param  {string} [divTitle]   - Div title.   @param  {function} [clickFunc] - Click function.
 * @param  {string} [labelClass] - Label class.     @param  {string} [labelTitle] - Label title.
 * @return {object}              - The Jquery object of the checkbox element.
**/
function createCheckBox(appendHere, label, id, value, checked, divClass=null, inputClass=null, divTitle=null, clickFunc=null, labelClass=null, labelTitle=null) {
  let checkedText = (checked) ? ' checked' : '', titleText = (divTitle) ? ` title='${divTitle}'`: '', divAddClass = (divClass) ? ` ${divClass}` : '';
  let lAddClass = (labelClass) ? ` ${labelClass}` : '', lAddTitle = (labelTitle) ? ` data-original-title='${labelTitle}'` : '', iAddClass = (inputClass) ? ` ${inputClass}` : '';
  let formCheck = $(`<div class='form-check form-check-inline${divAddClass}'${titleText}></div>`).appendTo(appendHere);
  let input = $(`<input class='form-check-input${checkedText}${iAddClass}' type='checkbox' id='${id}' value='${value}'${checkedText}${titleText}>`).appendTo(formCheck);
  if (clickFunc) input.click(clickFunc);
  $(`<label class='form-check-label${lAddClass}' for='${id}'${lAddTitle}>${label}</label>`).appendTo(formCheck);
  input = null;
  return formCheck;
}
/** Creates a Jquery radio button with a name group, label and value.
 * @param  {object} appendHere   - Jquery element.  @param  {string} nameGroup - Input name.  @param  {string} value      - The value.
 * @param  {string} label        - The label.       @param  {bool} [checked]   - Checked?     @param  {string} [classAdd] - Class names.
 * @param  {string} [labelTitle] - Label title.
 * @return {object}              - The jquery object for the radio button.
**/
function radioButtons(appendHere, nameGroup, value, label, checked=false, classAdd='', labelTitle='') {
  const checkedText = (checked) ? ' checked' : '', lAddTitle = (labelTitle) ? ` data-original-title='${labelTitle}'` : '', addClass = (classAdd) ? ` ${classAdd}` : '';
  let radioButton = $(`<label class='radio-inline small${addClass}'${lAddTitle}><input type='radio'${checkedText} name='${nameGroup}' value='${value}' class='radio-xxs'>${label}</input></label>`).appendTo(appendHere);
  return radioButton;
}
/** Creates a time input using a date time picker from tempus dominus plugin.
 * @param  {string} label - The label.  @param  {string} id - The time input ID.  @param  {string} [value] - The time input value.
 * @return {object}       - The jquery object for the time input.
**/
function createTimeInput(label, id, value=null) {
  let theValue = (value) ? ` value='${value}'` : '';
  let input = $(`<div class='input-group pcm-inputGroup'><label for='${id}' class='pcm-timeLabel'>${label}</label><input type='text' class='form-control pcm-inputDate-md' id='${id}' tabindex='-1' placeholder='None'${theValue}/></div>`);
  $(input).append(`<div class='pcm-inputClearIcon' id='pcm-clearTInput'><i class='fas fa-times fa-sm'></i></div>`);
  return input;
}
/** Sets up an input range and appends it to given element with minimum and maximum values. Uses a current value and a set value function.
 * @param  {object} appendTo - Jquery element.  @param  {number} min        - Minimum range.       @param  {number} max      - Maximum range.  @param  {number} theValue - The value.
 * @param  {string} key      - Key name.        @param  {function} setValue - Set value function.  @param  {bool} [withText] - Show value text?
**/
function inputRange(appendTo, min, max, theValue, key, setValue, withText=true) {
  $(`<input class='pcm-inputRange' type='range' min='${min}' max='${max}' value='${theValue}'></input>`).on('input', e => {
    $(`#pcm-${key}Detail`).val(($(e.target).val())); setValue(Number($(e.target).val()));
  }).appendTo(appendTo);
  function inputSetVal(e) { let newVal = $(e.target).val(); $(e.target).prev('input').val(newVal); setValue(Number(newVal)); }
  if (withText) $(`<input class='pcm-inputRangeText' id='pcm-${key}Detail' type='text' value='${theValue}' size='2'></input>`).change( e => inputSetVal(e) )
    .keypress( e => { if (e.keyCode === 13) { inputSetVal(e); return false; } }).appendTo(appendTo);
}
/** Limits a value to a low limit and hight limit.
 * @param  {number} val - The value.  @param  {number} low - The low limit.  @param  {number} high - The high limit.
 * @return {number}     - Returns the new value in the limit range.
**/
function limitRange(val, low, high) { return val < low ? low : (val > high ? high : val); }
/** Shows the hour value and the minute value in two inputs so user can edit them.
 * @param  {string} hourValue - The hour value to use for hour input.  @param  {string} minuteValue - The minute value to use for minute input.
 * @return {object}           - Returns the time elapse element.
**/
function createTimeElapse(hourValue, minuteValue) {
  let inputGroup = $(`<span class='form-inline pcm-timeToStop'></span>`)
  let input1 = createInput(null, ' pcm-hoursRow', 'pcm-endHours', `Ends after hours: `, '0', null, ' pcm-hoursLabel', hourValue, '10', true);
  $(input1).find('input').addClass('pcm-inputEndHours')
    .on('input', e => { let val = $(e.target).val(); $(e.target).val(limitRange(val, 0, 24)); })
    .on('focus', e => { $(e.target).select(); });
  let input2 = createInput(null, ' pcm-minutesRow', 'pcm-endMinutes', `minutes: `, '0', null, ' pcm-minutesLabel', minuteValue, '10', true);
  $(input2).find('input').addClass('pcm-inputEndMinutes')
    .on('input', e => { let val = $(e.target).val(); $(e.target).val(limitRange(val, 0, 60)); })
    .on('focus', e => { $(e.target).select(); });
  inputGroup.append(input1).append(input2); input1 = null; input2 = null;
  return inputGroup;
}
/** Returns the date in a readable format according to the provided format and timezone.
 * @param  {string} theFormat - The format.  @param  {object} theDate - The date.  @param  {string} theTimeZone - The timezone.
 * @return {string|object}    - Returns the string of the date in a more readable format or just the Date object.
**/
function formatAMPM(theFormat, theDate, theTimeZone) {
  var d = (theDate) ? theDate : new Date();
  if (theTimeZone === 'mturk') {
    let mturkTZOffset = -8, today = new Date(); if (today.isDstObserved()) mturkTZOffset++;
    let utc = d.getTime() + (d.getTimezoneOffset() * 60000), MturkTime = utc + (3600000 * mturkTZOffset);
    d = new Date(MturkTime);
  }
  let minutes = d.getMinutes().toString().length === 1 ? '0' + d.getMinutes() : d.getMinutes(),
      hours = d.getHours(), ampm = hours >= 12 ? 'pm' : 'am',
      months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  hours = (hours >= 12) ? (hours - 12) : hours;
  hours = (hours.toString().length === 1) ? '0' + hours : hours;
  if (theFormat === 'short') return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '-' + d.getFullYear() + '(' + hours + ':' + minutes + ampm + ')';
  else if (theFormat === 'dayandtime') return days[d.getDay()] + ' ' + hours + ':' + minutes + ampm;
  else if (theFormat === 'onlydate') return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '-' + d.getFullYear();
  else if (theFormat === 'yearMonDay') return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  else if (theFormat === 'theDateObj') return d;
  else return days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate() + ' ' + d.getFullYear() + ' ' + hours + ':' + minutes + ampm;
}
/** Convert seconds into the number of weeks, days, hours, minutes and seconds.
 * @param  {number} seconds - The number of seconds to be converted.
 * @return {string}         - The converted time in a string format.
**/
function getTimeLeft(seconds) {
  let returnString = '', displaying = 0;
  if (seconds >= 0) {
    let weeks = Math.floor(seconds / 604800); seconds = seconds - (weeks * 604800), days = Math.floor(seconds / 86400); seconds = seconds - (days * 86400);
    let hours = Math.floor(seconds / 3600); seconds = seconds - (hours * 3600), minutes = Math.floor(seconds / 60); seconds = seconds - (minutes * 60);
    let plusSeconds = seconds;
    if (weeks > 0) { returnString += `${weeks} weeks `; displaying++; }
    if (weeks > 0 || days > 0) { returnString += `${days} days `; displaying++; }
    if (displaying < 2 && (days > 0 || hours > 0) ) { returnString += `${hours} hours `; displaying++; }
    if (displaying < 2 && (hours > 0 || minutes > 0) ) { returnString += `${minutes} minutes `; displaying++; }
    if (displaying < 2) returnString += `${('0' + plusSeconds).slice(-2)} seconds`;
  } else returnString = '0 seconds';
  return returnString.trim();
}
/** Tests a given URL to make sure it's a preview, accept URL or a requester URL.
 * @param  {string} url - URL to test.
 * @return {bool}       - True if matched or false otherwise.
**/
function testGidRid(url) {return /(^http[s]{0,1}\:\/\/[^\s]*\/(projects|requesters)\/[^\s]*\/(tasks|projects)|^[Aa][^\s]{5,25}|^[3][^\s]{10,50})/.test(url); }
/** Used to count object property values in arrays using a count function and returning the total count.
 * @param  {array} arr - The array.  @param  {function} countFunc - Counting function.  @param  {bool} [counting] - Counting or not?
 * @return {number}    - Total value counted or from count function.
**/
function arrayCount(arr, countFunc, counting=true) { // Similar to the ES6 filter method without creating an array.
  let total = 0;
  if (countFunc && arr.length) { for (const i in arr) { let item = arr[i]; let val = countFunc(item, i); total += (!counting) ? val : ((val) ? 1 : 0); }}
  return total;
}
/** Moves a value in an array from one position to another. The array is changed by splice so no need to return array.
 * @param  {array} arr - Array to move.  @param  {number} from - From position.  @param  {number} to - To position.
**/
function arrayMove(arr, from, to) { arr.splice(to, 0, arr.splice(from, 1)[0]); }
/** Remove a value in an array provided. Must return array because filter doesn't change the array.
 * @param  {array} arr - Array to remove from.  @param  {string} value - Search value.
 * @return {array}     - Array with value removed.
**/
function arrayRemove(arr, value) { return arr.filter( (item) => item !== value ); }
/** Builds up an object with a key having an array of values. Creates key if doesn't exist in object.
 * @param  {object} obj - The object.  @param  {string} key - Key value.  @param  {number} value - Added value.
**/
function buildSortObject(obj, key, value) { if (obj.hasOwnProperty(key)) obj[key].push(value); else obj[key] = [value]; }
/** Flattens the object by removing a value from the array in key value.
 * @param  {object} obj - The object.  @param  {string} key - Key value.  @param  {number} value - Remove value.
**/
function flattenSortObject(obj, key, value) {
  if (obj.hasOwnProperty(key)) { if (obj[key].length > 1) obj[key] = arrayRemove(obj[key], value); else delete obj[key]; }
}
/** Shorten the group ID into a 2 letters then '...' and 4 letters at end.
 * @param  {string} gId - The group ID to shorten.  @param  {number} [preNum] - Limit length at start.  @param  {number} [postNum] - Limit length at end.
 * @return {string}     - The shortened string for the group ID.
**/
function shortenGroupId(gId, preNum=2, postNum=4) { return gId.slice(0, preNum) + '...' + gId.slice(-1 * postNum); }
/**
 * Adds or removes classes to the option label depending on the status.
 * @param  {string} key - The key.  @param  {bool} status - The option limit status.
**/
function doOptLimit(key, status) { if (status) $(`#pcm-tdLabel-${key}`).addClass('pcm-optionLimited'); else $(`#pcm-tdLabel-${key}`).removeClass('pcm-optionLimited pcm-optionEmpty'); }
/** Toggles showing a text or a text input of a value for editing purposes.
 * @param  {object} thisObject  - Main object.  @param  {object} target - Changed target.  @param  {object} obj          - Object with key.
 * @param  {string} theValue    - The value.    @param  {bool} [editMe] - Input or text?   @param  {string} [textBorder] - Border class.
 * @param  {string} [textColor] - Color class.
**/
function textToggle(thisObject, target, obj, theValue, editMe=null, textBorder=null, textColor=null) {
  let parent = $(target).parent(), pre = (obj.money) ? '$' : '', borderClass = (textBorder) ? ` ${textBorder}` : '', colorClass = (textColor) ? ` ${textColor}` : '';
  if (editMe) {
    let doTextToggle = e => { textToggle(thisObject, e.target, obj, theValue, false, textBorder); };
    $(parent).empty().append($(`<input class='pcm-inputText' id='pcm-${obj.key}DetailI' type='text' value='${theValue}'></input>`)
      .blur( e => doTextToggle(e) )
      .focus( e => $(e.target).select() )
      .keypress( e => { if (e.keyCode === 13) doTextToggle(e); e.stopPropagation(); } )
      .on('input', e => {
        let thisValue = $(e.target).val(), limit = false;
        if (obj.min === undefined || obj.max === undefined) return;
        if (obj.minFunc) { limit = (Number(thisValue) === obj.min) ? obj.minFunc(obj.key) : false; }
        if (limit) doOptLimit(obj.key, true);
        else if (obj.min !== undefined && (thisValue < obj.min || thisValue > obj.max)) doOptLimit(obj.key, true);
        else doOptLimit(obj.key, false);
      }));
    $(`#pcm-${obj.key}DetailI`).focus();
  } else {
    $(target).closest(`.pcm-modal`).focus();
    doOptLimit(obj.key, false);
    if (editMe !== null) theValue = $(target).val(); // Null is on first call of function.
    if (theValue === '' || theValue === '{Empty}') { theValue = '{Empty}'; colorClass = ' pcm-optionEmpty'; }
    if ((obj.min === undefined && obj.max === undefined) || ((theValue >= obj.min) && (theValue <= obj.max))) {
      if (obj.minFunc && Number(theValue) === obj.min) if (obj.minFunc(obj.key)) doOptLimit(obj.key, true); else doOptLimit(obj.key, false);
      if (obj.type === 'number') thisObject[obj.key] = Number((obj.minutes) ? theValue * 60000 : (obj.seconds) ? theValue * 1000 : theValue);
      else if (theValue !== '{Empty}') thisObject[obj.key] = theValue; else thisObject[obj.key] = ''
      if (obj.money) theValue = Number(theValue).toFixed(2);
      let theSpan = $(`<span id='pcm-${obj.key}DetailS' class='pcm-toggleDetails${borderClass}${colorClass}'>${pre}${theValue}</span>`);
      $(parent).empty().append(theSpan);
      if (!obj.disable) $(theSpan).on('click', e => { textToggle(thisObject, e.target, obj, theValue, true, textBorder, textColor); });
      theSpan = null;
    } else doOptLimit(obj.key, true);
  }
  parent = null;
}
/** Finds a text in a string and sets a mark on each one found to emphasize those text.
 * @param  {string} findThis - String to find.  @param  {string} fromHere - String to search from.
 * @return {string}          - String with found text marked.
**/
function markInPlace(findThis, fromHere) {
  let find = findThis.toLowerCase(), findLength = find.length, str = fromHere.toLowerCase(), start = 0, returnStr = '';
  if (!findThis.length || !fromHere.length) return fromHere;
  while ((index = str.indexOf(find, start)) > -1) {
    returnStr = returnStr + fromHere.substring(start, index) + '<mark>' + fromHere.substr(index, findLength) + '</mark>'; start = index + findLength;
  }
  return returnStr + fromHere.substring(start);
}
/** Displays an array of objects line by line in different ways and allows for toggling an edit input for each value.
 * Types: range, text, number, trueFalse, button, checkbox, keyValue, hr and string.
 * @param  {array} thisArrayObject - Array of objects.   @param  {object} divContainer - Container.       @param  {object} thisObject - The object.
 * @param  {bool} [table]          - Table or not?       @param  {bool} [horizontal]   - Horizontal?      @param  {bool} [append]     - Append or prepend?
 * @param  {string} [addClass]     - Class to be added.  @param  {string} [addId]      - ID to be added.  @param  {object} [theData]  - Data to save.
 * @param  {object} [data2]        - Second data to save
**/
function displayObjectData(thisArrayObject, divContainer, thisObject, table=true, horizontal=false, append=true, addClass=null, addId=null, theData=null, data2=null) {
  let row = null, tdCol = '', trClass = (addClass) ? ` class='${addClass}'` : '', trId = (addId) ? ` id='${addId}'` : '', styleAdd = '';
  if (horizontal) { row = $(`<tr${trClass}${trId}></tr>`).hide(); if (theData) row.data('theData', theData); if (data2) row.data('data2', data2); }
  for (const element of thisArrayObject) {
    let useObject = (element.key1) ? thisObject[element.key1] : thisObject;
    if (element.skip === true || !useObject || (element.ifNot && useObject[element.ifNot])) continue;
    if (element.keyCheckNot && useObject[element.keyCheck] === element.keyCheckNot) continue;
    let textColor = '', valueCol = null, textBorder = 'pcm-bottomDotted';
    let theValue = (element.orKey && useObject[element.orKey] !== '') ? useObject[element.orKey] : ((element.key && element.type !== 'string') ? ((element.andKey) ? `${useObject[element.key]} - ${useObject[element.andKey]}` : useObject[element.key]) : (element.string) ? element.string : '');
    theValue = (element.andString) ? `${theValue} - ${element.andString}` : theValue;
    if (theValue === '') { theValue = '{Empty}'; textColor = ' pcm-optionEmpty'; }
    if (theValue === -1) { theValue = '0'; }
    if (element.money) theValue = (theValue !== null || theValue !== undefined) ? Number(theValue).toFixed(2) : '_.__';
    if (theValue === undefined || theValue === null) { theValue = element.default; }
    if (element.format === 'date') { theValue = formatAMPM('short',new Date(theValue)); }
    if (element.link) theValue = `<a href='${element.link}' class='${element.linkClass}' target='_blank'>${theValue}</a>`;
    if (element.disable) { textColor = ' pcm-optionDisabled'; textBorder = ''; }
    if (element.minMax) { element.min = element.minMax.min; element.max = element.minMax.max; }
    if (table && !horizontal) { element.width = 'auto'; element.maxWidth = '450px'; tdCol = 'col-7 '; }
    if ('styleDisplay' in element) styleAdd = ` display:${element.styleDisplay};`; else styleAdd = '';
    const strMin = (element.money && element.minMax) ? `$${element.min.toFixed(2)}` : element.min;
    const strMax = (element.money && element.minMax) ? `$${element.max.toFixed(2)}` : element.max;
    const pre = (element.pre) ? element.pre : '', addSpan = (element.type === 'text' || element.type === 'number') ? '<span></span>' : '';
    const tdWidth = (element.width) ? `width:${element.width} !important;` : '', tdMaxWidth = (element.maxWidth) ? `max-width:${element.maxWidth} !important;` : '';
    const tdMinWidth = `min-width:` + ((element.minWidth) ? element.minWidth : '20px') + ` !important;`;
    const tdStyle = ` style='${tdMaxWidth} ${tdMinWidth} ${tdWidth}${styleAdd}'`, tdClass = (element.addTdClass) ? ` ${element.addTdClass}` : '';
    const theRange = (element.minMax) ? ` (min:&nbsp;${strMin}&nbsp;|&nbsp;max:&nbsp;${strMax}&nbsp;)` : '';
    const addTip = (element.tooltip && element.tooltip !== '') ? ` data-toggle='tooltip' data-html='true' data-placement='bottom' data-original-title='${element.tooltip}${theRange}'` : ``;
    const toolTipClass = (element.tooltip) ? ` pcm-tooltipData${(element.notHelper) ? '' : ' pcm-tooltipHelper'}`: '';
    if (element.type === 'hr') row = $(`<tr class='d-flex pcm-hrTable'><td class='col-12 pcm-hrTable'></td></tr>`);
    else if (table && !horizontal) row = $(`<tr class='d-flex'></tr>`).append($(`<td class='col-5 unSelectable'></td>`).append($(`<span${addTip} class='pcm-eleLabel${toolTipClass}' id='pcm-tdLabel-${element.key}'>${element.label}</span>`).data('range',element.minMax).data('key',element.key)));
    valueCol = $(`<td class='${tdCol}pcm-textInfo text-truncate${toolTipClass}${tdClass}'${tdStyle}${addTip}>${addSpan}</td>`).data('unique',element.unique);
    if (element.type !== 'hr') valueCol.appendTo(row);
    if (element.type === 'range') {
      inputRange(valueCol, element.min, element.max, theValue, element.key, (value) => { useObject[element.key] = value; });
    } else if (element.type === 'text' || element.type === 'number') {
      theValue = (element.seconds) ? theValue / 1000 : (element.minutes) ? theValue / 60000 : theValue;
      theValue = (element.min !== undefined) ? Math.min(Math.max(theValue, element.min), element.max) : theValue;
      textToggle(useObject, $(valueCol).find('span'), element, theValue, null, textBorder, textColor);
    } else if (element.type === 'trueFalse') {
      if (element.reverse) theValue = !theValue;
      $(`<span id='pcm-${element.key}Detail' class='${textBorder} pcm-toggleDetails${textColor}'>${theValue}</span>`)
      .on('click', e => {
        $(e.target).html( ($(e.target).html() === 'true') ? 'false' : 'true' );
        useObject[element.key] = ($(e.target).html() === 'true');
        if (element.reverse) useObject[element.key] = !useObject[element.key];
      }).appendTo(valueCol);
    } else if (element.type === 'button') {
      let button = $(`<button class='btn ${element.addClass}' id='${element.idStart}-${element.unique}'>${element.btnLabel}</button>`);
      if (element.btnFunc) $(button).on('click', {unique:element.unique}, e => { element.btnFunc(e); e.stopPropagation(); });
      $(button).appendTo(valueCol); button = null;
    } else if (element.type === 'checkbox') {
      let theCheckBox = createCheckBox(valueCol, '', `pcm-selection-${element.unique}`, element.unique, '', ' m-0', element.inputClass);
      if (element.btnFunc !== null) theCheckBox.on('click', {unique:element.unique}, e => { element.btnFunc(e); }); theCheckBox = null;
    } else if (element.type === 'keyValue') {
      const id = (element.id) ? ` id=${element.id}` : ``, theClass = (textColor) ? ` class=${textColor}` : ``;
      let valueSpan = $(`<span${id} ${theClass}>${pre}${theValue}</span>`).css('cursor', 'default').appendTo(valueCol);
      if (element.clickFunc) valueSpan.closest('td').on( 'click', {unique:element.unique}, e => { element.clickFunc.apply(this, [e]); }); valueSpan = null;
    } else if (element.type === 'string') {
      const id = (element.id) ? ` id=${element.id}` : ``, border = (element.noBorder) ? '' : ` `;
      $(`<span class='${textColor}${border}'${id}>${pre}${theValue}</span>`).appendTo(valueCol);
    }
    if (append) row.appendTo(divContainer); else row.prependTo(divContainer);
    $(row).show();
    valueCol = null;
  }
  row = null;
}
/** Save object to a file. Adds prefix, suffix and extension to filename if given. Uses a function given after file is saved.
 * @param  {object} theData      - Export data.          @param  {string} [prefix]      - File prefix.                    @param  {string} [suffix]    - File ending.
 * @param  {function} [doneFunc] - After save function.  @param  {bool}   [doStringify] - Should theData be stringified?  @param  {string} [extension] - File extension.
**/
function saveToFile(theData, prefix='PandaCrazyEXP', suffix=null, doneFunc=null, doStringify=true, extension='json') {
  let dataToSave = (doStringify) ? JSON.stringify(theData) : theData;
  let blob = new Blob( [dataToSave], {'type': 'text/plain'}), dl = document.createElement('A'), fileEnd = (suffix) ? suffix : '';
  dl.href = URL.createObjectURL(blob); dl.download = `${prefix}_${formatAMPM('short')}${fileEnd}.${extension}`;
  document.body.appendChild(dl); dl.click();
  setTimeout( () => { dl.remove(); URL.revokeObjectURL(blob); if (doneFunc) doneFunc(); }, 0);
}
/** Get the group ID and requester ID from the preview or accept URL.
 * @param  {string} url - The URL to parse and return info from.
 * @return {array}			- Group ID is first in array. Requester ID is second in array.
**/
function parsePandaUrl(url) {
  const groupInfo = url.match(/\/projects\/([^\/]*)\/tasks([\/?]|$)/), requesterInfo = url.match(/\/requesters\/([^\/]*)\/projects(\/|\?|$)/);
  let groupId = (groupInfo) ? groupInfo[1] : null, reqId = (requesterInfo) ? requesterInfo[1] : null;
  return [groupId, reqId];
}
/** Halt the script with error messages or just warn and continue script.
 * @param  {object} error   - Error object.  @param  {string} alertMessage - Alert Message.  @param  {string} [consoleMessage] - Console message.
 * @param  {string} [title] - The title.     @param  {bool} [warn]         - True if just a warning and don't stop the script yet!
**/
function haltScript(error, alertMessage, consoleMessage=null, title='Fatal error has happened. Stopping script.', warn=false) {
  $('.pcm-top:first').html(''); $('#pcm-pandaUI .pcm-quickMenu').html(''); $('.panel').html('');
  $('.panel:first').append(`<H1 class='pcm-myCenter'>${title}</H1><H5 class='pcm-haltMessage'>${alertMessage}</H5>`);
  setTimeout(() => { if (MyModal) MyModal.closeAll(); }, 500);
  if (!warn && error) {                             // Only show message on console as an error if it's not a warning.
    console.error( (consoleMessage !== null) ? consoleMessage : alertMessage, error );
    if (MyQueue !== null) MyQueue.stopQueueMonitor();
    throw 'Stopping script due to an error displayed previously or in another console.';
  } else console.info('Warning: ' + alertMessage);  // Show a warning alert message on the console.
}
/** Returns the saved MTURK date or save the current MTURK date and then return it.
 * @param  {bool} renew - Should get new MTURK date?
 * @return              - The saved MTURK date or the current MTURK date.
**/
function getMturkDate(renew=false) { if (gMturkDate === null || renew) gMturkDate = formatAMPM('theDateObj',_,'mturk'); return gMturkDate; }
/** Checks if the day sent is the same day as today.
 * @param  {date} day - The date that needs to be compared to today.
 * @return {bool}     - True if the date is the same as today.
**/
function isSameDay(day) {
  let d1 = new Date();
  return day.getFullYear() === d1.getFullYear() && day.getMonth() === d1.getMonth() && day.getDate() === d1.getDate();
}
/** Checks if it's a new MTURK day by using getDate and updates the current local time or MTURK time.
 * @param  {Date} [testDate] - A date to test today's MTURK date with.  @param  {bool} useLocal - Use local time for comparison instead of MTURK time.
 * @return {bool}            - True if it's a new MTURK day.
**/
function isNewDay(testDate=null, useLocal=false) {
  let savedDay = (useLocal) ? gStartDate : getMturkDate(), newDay = (useLocal) ? new Date() : getMturkDate(true), returnValue = false;
  if (testDate !== null && (!datesAreOnSameDay(newDay, testDate, true) || newDay.getDate() !== testDate.getDate())) returnValue = true;
  else if (savedDay.getDate() !== newDay.getDate()) returnValue = true;
  if (useLocal) gStartDate = newDay; else gMturkDate = newDay;
  return returnValue;
}
/** Checks if two dates are the exact day, month and year. Don't compare to the day if notDay is true.
 * @param  {Date} first - First date.  @param  {Date} second - Second date.  @param  {bool} [notDay] - Don't use getDate?
 * @return {bool}       - True is same day, month and year or just same month and year.
 */
function datesAreOnSameDay(first, second, notDay=false) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && (notDay || first.getDate() === second.getDate());
}
/** Returns just the date in a string without the time.
 * @param  {object} date - The object date to drop the time from.
 * @return {string}      - Returns the string with only the date without the time.
**/
function justDate(date) { return new Date(date).toISOString().substring(0, 10); }
/** Creates and returns an object filled with data for a HIT using default values without friendly data.
 * @param  {string} gid   - The group ID.    @param  {string} desc - The description.  @param  {string} title - The title.       @param  {string} rid  - Requester ID.
 * @param  {string} rN    - Requester name.  @param  {string} pay  - The price.        @param  {number} [hA]  - Hits available.  @param  {number} [aT] - Assigned time.
 * @param  {string} [exp] - Date and time expires.
 * @return {object}     - Object with all the data set or using default values.
**/
function hitObject(gid, desc, title, rid, rN, pay, hA=0, aT=null, exp=null) {
  return {'groupId':gid, 'description':desc, 'title':title, 'reqId':rid, 'reqName':rN, 'price':pay, 'hitsAvailable':Number(hA), 'assignedTime':Number(aT), 'expires':exp};
}
/** Creates and returns an object filled with data for a HIT and default values set if needed.
 * @param  {string} gid	  - The group ID.           @param  {string} desc - The description.  @param  {string} title - The title.       @param  {string} rid  - Requester ID.
 * @param  {string} rN	  - Requester name.         @param  {string} pay	- The price.        @param  {number} [hA]  - Hits available.  @param  {number} [aT] - Assigned time.
 * @param  {string} [exp] - Date and time expires.  @param  {string} [fT]	- Friendly title.   @param  {string} [fR]  - Friendly requester name.
 * @param  {bool} [ext]   - Created externally?     @param  {string} [cr] - Created 'manually' or 'automatically'.
 * @return {object}       - Object with all the data set or using default values.
**/
function dataObject(gid, desc, title, rid, rN, pay, hA=0, aT=null, exp=null, fT='', fR='', ext=false, cr='manually') {
  return {'groupId':gid, 'description':desc, 'title':title, 'reqId':rid, 'reqName':rN, 'price':pay, 'hitsAvailable':Number(hA), 'assignedTime':Number(aT), 'expires':exp, 'friendlyTitle':fT, 'friendlyReqName':fR, 'ext':ext, 'created':cr};
}
/** Creates and returns an object for options of a HIT and default values set if needed.
 * @param  {bool} [o]	     - Once?               @param  {string} [s]  - Search?         @param  {number} [tab] - Tab unique.    @param  {number} [lN] - Limit number queue.
 * @param  {number} [lT]	 - Limit total queue.  @param  {number} [lF] - Limit fetches.  @param  {number} [dur] - The duration.  @param  {bool} [aG]   - Auto goham?
 * @param  {number} [hamD] - Ham duration.       @param  {number} [aL] - Accept limit.   @param  {number} [day]	- The day.       @param  {number} [wt] - Weight number.
 * @param  {number} [dd]	 - Daily done.         @param  {bool} [dis]  - Disabled?       @param  {bool} [mute]  - Muted?
 * @return {object}        - Object with options set or using default values.
**/
function optObject(o=false, s=null, tab=-1, lN=0, lT=0, lF=0, dur=0, aG=false, hamD=0, aL=0, day=0, wt=0, dd=0, dis=false, mute=false) {
  let today = new Date();
  if (day === 0 || justDate(day) !== justDate(today)) { day = today.getTime(); dd = 0; }
  return {'once':o, 'search':s,'limitNumQueue':Number(lN), 'limitTotalQueue':Number(lT), 'limitFetches':Number(lF), 'duration':Number(dur),'autoGoHam':aG, 'hamDuration':Number(hamD), 'acceptLimit':Number(aL), 'tabUnique':Number(tab), 'day':Number(day), 'dailyDone':Number(dd), 'weight':Number(wt), 'disabled':dis, 'mute':mute};
}
/** Creates and returns an object for the rules for a search trigger.
 * @param  {array} [bG]  - Blocked gid.     @param  {array} [oG]   - Only gid.     @param  {array} [exc]  - Excluded terms.
 * @param  {array} [inc] - Included terms.  @param  {number} [min] - Minimum pay.  @param  {number} [max] - Maximum pay.
 * @return {object}      - Object with the rules all set up.
**/
function sRulesObject(bG=[], oG=[], exc=[], inc=[], min=0.00, max=0.00) {
  bG = bG.filter(Boolean); oG = oG.filter(Boolean); exc = exc.filter(Boolean); inc = inc.filter(Boolean); // Filters out false boolean values.
  let terms = (exc.length || inc.length), range = (min > 0.00 || max > 0.00);
  return {'blockGid': new Set(bG), 'onlyGid': new Set(oG), 'terms': terms, 'exclude': new Set(exc), 'include': new Set(inc), 'payRange': range, 'minPay': Number(min), 'maxPay': Number(max)};
}
/** Creates and returns an object for the history database.
 * @param  {string} rN     - Requester name.   @param  {string} rid   - Requester ID.  @param  {number} [pay]  - The price.  @param  {string} [title] - The title.
 * @param  {string} [desc] - The description.  @param  {string} [dur] - The duration.  @param  {string} [date] - The date.
 * @return {object}        - Object with data used for the history database.
**/
function sHistoryObject(rN, rid, pay=0.00, title='', desc='', dur='', date=null) {
  if (!date) date = new Date().toISOString();
  return {'reqName':rN, 'reqId':rid, 'pay': pay, 'title': title, 'description':desc, 'duration': dur, 'date': date};
}
/** Converts history HIT data back into MTURK data format to show on some modal dialogs.
 * @param  {object} data - History data.
 * @return {object}      - Returns data back into MTURK data format.
**/
function hConverterObject(data) {
  data = (data) ? data : {};
  return {'requester_name':'', 'title':passEmptyStr(data.title), 'description':passEmptyStr(data.description), 'monetary_reward':{'amount_in_dollars':(data.pay) ? data.pay : null}, 'requester_id':passEmptyStr(data.reqId), 'hit_set_id':passEmptyStr(data.theId), 'date':data.date};
}
/** Delays the script for certain amount of milliseconds.
 * @param  {number} ms - The milliseconds to delay script for.
**/
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
/** If the version1 is older than version2 then returns true otherwise false.
 * @param  {string} version1 - Older version.  @param  {string} version2 - Newer Version.
 * @return {bool}            - Returns if first is older than second.
**/
function compareVersion(version1, version2) {
  let result = false; if (!version1) return true;
  if (typeof version1 !== 'object'){ version1 = version1.toString().split('.'); } if (typeof version2 !== 'object'){ version2 = version2.toString().split('.'); }
  for (let i=0; i < (Math.max(version1.length, version2.length)); i++){
    if (version1[i] === undefined) { version1[i] = 0; } if (version2[i] === undefined) { version2[i] = 0; }
    if (Number(version1[i]) < Number(version2[i])) { result = true; break; }
    if (version1[i] != version2[i]) { break; }
  }
  return(result);
}
/** Checks the CSS file if user set a CSS variable and then returns it or returns the default value if no CSS variable found.
 * @param  {string} [varName] - Variable name.  @param  {string} [defaultText] - Default text to use.
 * @return {null|string}      - CSS variable or the default value if no CSS variable found. Null if no varName given.
**/
function getCSSVar(varName=null, defaultText='') {
  if (varName === null) return null;
  let varContent = getComputedStyle(document.documentElement).getPropertyValue(`--pcm-${varName}`).trim();
  varContent = varContent.replace(/^['"](.*)['"]$/g, '$1');
  if (varContent === '___') return '&nbsp;'; else return (varContent) ? varContent : defaultText;
}
