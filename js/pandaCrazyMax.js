function createInput(appendHere, divAddClass, id, label, placeholder) {
  $(`<div class="form-inline w-100${divAddClass}"></div>`).append($(`<label for="${id}" class="col-sm-3 text-right">${label}</label>`)).append($(`<input type="text" class="form-control pcm_inputText-md ml-2 col-sm-7 text-left" id="${id}" placeholder="${placeholder}">`)).appendTo(appendHere);
}
function createCheckBox(appendHere, label, id, value, checked) {
  const checkedText = (checked) ? " checked" : "";
  const formCheck = $(`<div class="form-check form-check-inline"></div>`).appendTo(appendHere);
  $(`<input class="form-check-input${checkedText}" type="checkbox" id="${id}" value="${value}"${checkedText}>`).appendTo(formCheck);
  $(`<label class="form-check-label" for="${id}">${label}</label>`).appendTo(formCheck);
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
function arrayRemove(arr,value) { return arr.filter( (item) => item !== value ); }
function shortenGroupId(gId) { return gId.slice(0, 2) + "..." + gId.slice(-4); }
MturkPanda._init_Timer(995); // initialise a static timer for all panda's
MturkPanda._init_GStats(); // initialise a static stats for all global panda stats

const panda = new MturkPanda(); // set up a mturk class for a panda
const modal = new ModalClass(panda); // set up a modal class for a options, warnings or details
const queue = new MturkQueue(); // set up a mturk class for a panda
const menus = new MenuClass("pcm_quickMenu", panda); // set up a mturk class for a panda
const dataShow = new DataShowClass(); // set up a datashow class to display data easier
const pandaTabs = new TabbedClass($(`#pcm_pandaSection`)); // set up a mturk class for a panda
panda.addTabsObj(pandaTabs);

$(".sortable").sortable({connectWith: ".sortable"}).disableSelection();

// ***************** Add Panda's Here for now *******************
// addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle = "", friendlyReqName = "")
  panda.addPanda("30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", "Tell us if two receipts ar the same", "Tell us if two receipts ar the same", "AGVV5AWLJY7H2", "Ibotta, Inc.", "0.01", false, 12, 0, true, 4000, -1, 0);
  // **************************************************************
  
// Usually the main page is faster to load so it probably already got the queue.
const queueResults = localStorage.getItem("PCM_queueResults");
if (queueResults) queue.setQueueResults(JSON.parse(queueResults));

window.addEventListener("storage", event => {
  if (event.key==="PCM_addAndRunPanda") {
    const v = JSON.parse(event.newValue);
    panda.addAndRunPanda(v.gId, v.desc, v.title, v.rId, v.reqName, v.price, v.once, v.limitNumQueue, v.limitTotalQueue, v.hitsAvailable, v.tempDuration, v.tempGoHam);
    localStorage.removeItem("PCM_addAndRunPanda");
  } else if (event.key==="PCM_queueResults") {
    const v = JSON.parse(event.newValue);
    queue.setQueueResults(v);
    panda.gotNewQueue();
  }
}, false);
