let MySearchUI = null, MyPandaUI = null, MySearch = null, MyModal = null, MyHistory = null, MYDB = null, MyOptions = null;
let gLocalVersion = localStorage.getItem('PCM_version');
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Starts up the page to show the stats and allow users to download the stats to a csv file. **/
async function startUp() {
  let statsDiv = $(`<div class='pcm-myCenter'></div>`).appendTo('#pcm-statInfo');

  MYDB = new DatabasesClass();
  MyOptions = new PandaGOptions();
  MyHistory = new HistoryClass();
  await MYDB.openSearching();
  await MYDB.openHistory();
  await MYDB.openPCM();
  await MYDB.openStats();
  await MyOptions.prepare();
  let allCounts = await MyHistory.getCounts();

  let sResultsOpt = MyOptions.getSaveHistResults();
  let todaysDate = new Date(), dateString = formatAMPM('onlydate', todaysDate);
  let infoDiv = $(`<div class='pcm-myInfo'></div>`).appendTo(statsDiv);
  infoDiv.append(`<H1 class='pcm-myPrimary'>Your Stats Page.</H1><div>For now this page lets you download the search results from MTURK search page to a CSV file.<br>You must have the save all mturk HITs option on for any data to be downloaded.</div>`);
  let dataResults = $(`<div class='pcm-dataDisplay'></div>`).appendTo(statsDiv);
  if (!sResultsOpt) dataResults.append(`<div class='pcm-myWarning'>Your current search Results option is set to false so you may not have any data to download.<br>Go to the advanced options on the SearchCrazy page. Change 'Should All MTURK HITs be stored for stats' to true.<br>Now when you start searching it will save every HIT it sees on the MTURK search page.</div>`);
  for (const count of allCounts) {
    dataResults.append(`<div><span>[<span class='pcm-statsDate'>${dateString}</span>] : <span class='pcm-statsDateCount'>${count}</span> HITs recorded.</span></div>`)
    todaysDate.setDate(todaysDate.getDate() - 1); dateString = formatAMPM('onlydate', todaysDate);
  }
  statsDiv.append(`<button id='pcm-theStatMaker'>Download Search Results to a CSV File.</button>`);

  $('#pcm-theStatMaker').click( async () => {
    MyModal = new ModalClass();
    MyModal.showDialogModal('700px', 'Loading Stats', 'Please Wait. Loading up stats to save to file.', null , false, false, '', '', null, async () => {
      if (MyPandaUI) MyPandaUI.pauseToggle(true); if (MySearchUI) MySearchUI.pauseToggle(true);
      let csvContents = await MyHistory.searchResultsToCSV();
      saveToFile(csvContents, 'PCM_stats_results_',_, () => {
        if (MyPandaUI) MyPandaUI.pauseToggle(false); if (MySearchUI) MySearchUI.pauseToggle(false);
        MyModal.closeModal('Loading Stats');
      }, false);
    });
  });
}

/** ================ First lines executed when page is loaded. ============================ **/
startUp();
