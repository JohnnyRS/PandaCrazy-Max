let MySearchUI = null, MyPandaUI = null, MySearch = null, MyModal = null, MyHistory = null, MYDB = null, MyOptions = null;
let gLocalVersion = localStorage.getItem('PCM_version');
let gSorter = [], gAllResults = [], gReqObj = null, gGidObj = null, gDaysObj = {};
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Sends a message back to the panda page if it is running.
 * @param  {string} command - The command to send in a message.  @param  {object} data - The data to send in a message.
**/
function sendMessage(command, data={}) { browser.runtime.sendMessage({'command':command, 'data':data}); }
/** Release data from memory when page closes or user releases memory so they can load up data again later. **/
function releaseMemory() {
  gSorter = []; gAllResults = []; gReqObj = null; gGidObj = null; gDaysObj = {};
  MySearchUI = null; MyPandaUI = null; MySearch = null; MyHistory = null; MyOptions = null; MYDB = null;
}
/** Gets the data from the database and sets up the needed object variables for all stat display options. **/
async function prepareData() {
  let theData = await MyHistory.getSearchResults();
  gAllResults = theData.all; gReqObj = theData.reqObj; gGidObj = theData.gidObj;
  for (const rid of Object.keys(gReqObj)) {
    let thisReq = gReqObj[rid];
    thisReq.hits = []; thisReq.min = null; thisReq.max = null;
    arrayCount(gAllResults, (item, i) => {
      if ((item.rid === rid)) {
        thisReq.hits.push(i);
        let gidInfo = gGidObj[item.gid];
        if (thisReq.min === null) thisReq.min = gidInfo.info.pay; else if (thisReq.min > gidInfo.info.pay) thisReq.min = gidInfo.info.pay;
        if (thisReq.max === null) thisReq.max = gidInfo.info.pay; else if (thisReq.max < gidInfo.info.pay) thisReq.max = gidInfo.info.pay;
        return true;
      } else return false;
    }, false);
  }
  for (const i in gAllResults) {
    let item = gAllResults[i], theDate = new Date(item.date);
    item.theDay = theDate.getDate(); if (!gDaysObj.hasOwnProperty(item.theDay)) gDaysObj[item.theDay] = {'hits':[], 'reqObj':{}, 'hours':{}};
    let daysObj = gDaysObj[item.theDay]; daysObj.hits.push(i);
    if (!daysObj.reqObj.hasOwnProperty(item.rid)) daysObj.reqObj[item.rid] = {'count':0, 'min':null, 'max':null}; daysObj.reqObj[item.rid].count++;
    let gidInfo = gGidObj[item.gid], dayReq = daysObj.reqObj[item.rid];
    if (dayReq.min === null) dayReq.min = gidInfo.info.pay; else if (dayReq.min > gidInfo.info.pay) dayReq.min = gidInfo.info.pay;
    if (dayReq.max === null) dayReq.max = gidInfo.info.pay; else if (dayReq.max < gidInfo.info.pay) dayReq.max = gidInfo.info.pay;
    item.theHour = theDate.getHours(); if (!daysObj.hours.hasOwnProperty(item.theHour)) daysObj.hours[item.theHour] = {'hits':[], 'reqObj':{}};
    let hoursObj = daysObj.hours[item.theHour]; hoursObj.hits.push(i);
    if (!hoursObj.reqObj.hasOwnProperty(item.rid)) hoursObj.reqObj[item.rid] = 0; hoursObj.reqObj[item.rid]++;
  }
}
/** Assigns the global sorter array to the particular day stats or the total stats.
 * @param  {number} day - Day to sort data for or null to sort data for all days.
**/
function doSorter(day=null) {
  if (day === null) gSorter = Object.keys(gReqObj);
  else gSorter = (gDaysObj[day]) ? Object.keys(gDaysObj[day].reqObj) : [];
  if (gSorter.length > 2) {
    gSorter.sort((a,b) => {
      let count1 = (day === null) ? gReqObj[a].stats.count : gDaysObj[day].reqObj[a].count, count2 = (day === null) ? gReqObj[b].stats.count : gDaysObj[day].reqObj[b].count;
      return (count2 - count1);
    });
  }
}
/** Displays the stats on the page with links to open up a modal and a button to save to a csv file. **/
function doShowStats() {
  let todaysDate = new Date(), dateString = formatAMPM('onlydate', todaysDate), currentDay = todaysDate.getDate(), theTotal = 0;
  let dataResults = $('.pcm-dataDisplay:first'), statsDiv = $('.pcm-statsDiv:first');
  for (let i=0; i<7; i++) {
    let count = (gDaysObj[currentDay]) ? gDaysObj[currentDay].hits.length : 0; theTotal += count;
    dataResults.append(`<div><span>[<span class='pcm-statsDate'>${dateString}</span>] : <span class='pcm-statsDateCount'>${count}</span> HITs recorded.</span><span> [<a href="#" class="pcm-statsDateDay pcm-tvLink" data-day="${currentDay}">Day Stats</a>]</span></div>`)
    todaysDate.setDate(todaysDate.getDate() - 1); dateString = formatAMPM('onlydate', todaysDate); currentDay = todaysDate.getDate();
  }
  dataResults.append(`<div><span>[<span class='pcm-statsDate'>TOTAL</span>] : <span class='pcm-statsDateCount'>${theTotal}</span> HITs recorded.</span><span> [<a href="#" class="pcm-statsDateDay pcm-tvLink" data-day="null">Day Stats</a>]</span></div>`)
  statsDiv.append(`<div><button id='pcm-theStatMaker'>Download Search Results to a CSV File.</button></div>`);
  statsDiv.append(`<div style='margin-top:15px;'>Because stats can use up a lot of memory on this page, remember to release stats data from memory<br>after you are finished with viewing your stats by closing this page or clicking the button below.<br><button id='pcm-releaseMemory'>Done With Stats</button></div>`);
  $('.pcm-statsDateDay').click( async (e) => {
    sendMessage('pause'); sendMessage('searchPause');
    if (!MyModal) MyModal = new ModalClass();
    const idName = MyModal.prepareModal(null, '860px', 'pcm-statsDisplay', 'modal-lg', 'Your Stats Display', '', '', '', 'visible btn-sm', 'Done', () => { MyModal.closeModal(); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    MyModal.showModal(() => {}, async () => {
      let df1 = document.createDocumentFragment(), df2 = document.createDocumentFragment(), theDay = $(e.target).data('day'); theDay = (theDay !== 'null') ? theDay : null; doSorter(theDay);
      let pageSorter = gSorter.slice(0,30);
      $(`<div class='pcm-detailsEdit'>Displaying 30 Requester's Sorted by Number of HITs Found:</div>`).appendTo(df1);
      displayObjectData( [
        {'type':'string', 'string':'Requester ID', 'disable':true, 'tooltip':`Requester ID.`},
        {'type':'string', 'string':'Requester Name', 'disable':true, 'tooltip':`Requester Name for this HIT.`},
        {'type':'string', 'string':'Found HITs', 'disable':true, 'tooltip':`Number of Found HITs.`},
        {'type':'string', 'string':'Minimum Pay', 'disable':true, 'tooltip':`Minimum Pay Rate.`},
        {'type':'string', 'string':'Maximum Pay', 'disable':true, 'tooltip':`Maximum Pay Rate.`},
      ], df2, {}, true, true, true, 'pcm-triggeredhit');
      for (const rid of pageSorter) {
        let requesterName = gReqObj[rid].info.reqName.trim().replace(/\r?\n|\r/g, ' ');
        let reqCount = (theDay !== null) ? gDaysObj[theDay].reqObj[rid].count : gReqObj[rid].stats.count;
        let payMin = (theDay !== null) ? gDaysObj[theDay].reqObj[rid].min : gReqObj[rid].min;
        let payMax = (theDay !== null) ? gDaysObj[theDay].reqObj[rid].max : gReqObj[rid].max;
        displayObjectData( [
          {'type':'string', 'string':rid, 'width':'140px', 'maxWidth':'140px', 'disable':true},
          {'type':'string', 'string':requesterName, 'disable':true},
          {'type':'string', 'string':reqCount, 'width':'80px', 'maxWidth':'80px', 'disable':true},
          {'type':'string', 'string':payMin, 'width':'80px', 'maxWidth':'80px', 'money':true, 'pre':'$', 'disable':true},
          {'type':'string', 'string':payMax, 'width':'80px', 'maxWidth':'80px', 'money':true, 'pre':'$', 'disable':true},
        ], df2, {}, true, true);
      }
      $(df1).appendTo(`#${idName} .${MyModal.classModalBody}`);
      let theTable = $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df2));
      $(theTable).appendTo(`#${idName} .${MyModal.classModalBody}`);
      sendMessage('unpause'); sendMessage('searchUnpause');
    }, () => { MyModal = null; });
  });
  $('#pcm-theStatMaker').click( async () => {
    if (!MyModal) MyModal = new ModalClass();
    MyModal.showDialogModal('700px', 'Loading Stats', 'Please Wait. Loading up stats to save to file.', null , false, false, '', '', null, async () => {
      sendMessage('pause'); sendMessage('searchPause');
      let csvContents = await searchResultsToCSV();
      saveToFile(csvContents, 'PCM_stats_results_',_, () => {
        sendMessage('unpause'); sendMessage('searchUnpause');
        MyModal.closeModal('Loading Stats');
      }, false, 'csv');
    });
  });
  $('#pcm-releaseMemory').click( async () => {
    $('.pcm-statsDiv:first').remove();
    releaseMemory(); startUp();
  });
}
/** Saves all the search results data from the database to a CSV formatted string with all name, descriptions and titles set.
 * @return {string} - Returns a string in a CSV format to save to a file.
**/
function searchResultsToCSV() {
  let returnString = `date,group id,requester id,requester name,title,hits,pay,duration\r\n`;
  for (const item of gAllResults) {
    let requesterName = gReqObj[item.rid].info.reqName.trim().replace(/,/g, ';'), title = gGidObj[item.gid].info.title.trim().replace(/,/g, ';');
    requesterName = requesterName.replace(/\r?\n|\r/g, ' '); title = title.replace(/\r?\n|\r/g, ' ');
    let pay = gGidObj[item.gid].info.pay, duration = gGidObj[item.gid].info.duration;
    returnString += `${formatAMPM('short',new Date(item.date))},${item.gid},${item.rid},${requesterName},${title},${item.hits},${pay},${duration}\r\n`;
  }
  return returnString;
}
/** Starts up the page to show the stats and allow users to download the stats to a csv file. **/
async function startUp() {
  let statsDiv = $(`<div class='pcm-myCenter pcm-statsDiv'></div>`).appendTo('#pcm-statInfo');

  MYDB = new DatabasesClass();
  MyOptions = new PandaGOptions();
  MyHistory = new HistoryClass();
  await MYDB.openSearching();
  await MYDB.openHistory();
  await MYDB.openPCM();
  await MYDB.openStats();
  await MyOptions.prepare();

  let sResultsOpt = MyOptions.getSaveHistResults();
  let infoDiv = $(`<div class='pcm-myInfo'></div>`).appendTo(statsDiv);
  infoDiv.append(`<H1 class='pcm-myPrimary'>Your Stats Page.</H1><div>This page lets you download the search results from MTURK search page to a CSV file or view basic stats.<br>You must have the save all mturk HITs option on for any data to be downloaded.</div>`);
  let dataResults = $(`<div class='pcm-dataDisplay'></div>`).appendTo(statsDiv);
  if (!sResultsOpt) dataResults.append(`<div class='pcm-myWarning'>Your current search Results option is set to false so you may not have any data to download.<br>Go to the advanced options on the SearchCrazy page. Change 'Should All MTURK HITs be stored for stats' to true.<br>Now when you start searching it will save every HIT it sees on the MTURK search page.</div>`);
  dataResults.append(`<div class='pcm-warningPausing pcm-myWarning'>Be aware that loading up stats from the database may take awhile so all panda jobs will be paused until fully loaded.<br>To load up the stats you must click the button below.<br><br><button id='pcm-goStartStats'>Load Up All Stats Now!</button></div>`);

  $('#pcm-goStartStats').click( async () => {
    if (!MyModal) MyModal = new ModalClass();
    MyModal.showDialogModal('700px', 'Loading Stats', 'Please Wait. Loading Up All Stats From Database. May take awhile and use up more memory.', null , false, false, '', '', null, async () => {
      let startedLoading = new Date();
      sendMessage('pause'); sendMessage('searchPause');
      await prepareData(dataResults);
      sendMessage('unpause'); sendMessage('searchUnpause');
      let msElapsed = new Date() - startedLoading;
      setTimeout(() => { MyModal.closeModal('Loading Stats'); }, Math.max(0, 800 - msElapsed));
      $('.pcm-warningPausing').remove();
      doShowStats();
    });
  });
}

/** ================ First lines executed when page is loaded. ============================ **/
startUp();

/** ================ EventListener Section ================================================================================================= **/
/** Detect when user closes page so all variables gets released from memory. **/
window.addEventListener('beforeunload', async () => { releaseMemory(); });
