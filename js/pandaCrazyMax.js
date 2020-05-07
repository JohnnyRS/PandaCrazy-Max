let globalOpt=null, modal=null, pandaUI=null, alarms=null, notify=null, groupings=null, menus=null;
let bgPandaClass=null, bgQueueClass=null, bgPage = chrome.extension.getBackgroundPage();
function startPandaCrazy() {
  if (bgPage.gCheckDebugger()) {
    window.addEventListener("beforeunload", (e) => { bgPandaClass.removeAll(); bgPage.gSetPandaUI(null); });
    globalOpt = new PandaGOptions();
    modal = new ModalClass(); // set up a modal class for options, warnings or details
    pandaUI = new PandaUI();
    alarms = new AlarmsClass();
    notify = new NotificationsClass();
    groupings = new PandaGroupings();
    menus = new MenuClass("pcm_quickMenu"); // set up a mturk class for a panda

    bgPandaClass = bgPage.gSetPandaUI(pandaUI);
    bgQueueClass = bgPage.gReturnQueueClass();

    $(".sortable").sortable({connectWith: ".sortable"}).disableSelection();

    pandaUI.preparePanda();
    // ***************** Add Panda's Here for now *******************
    // addPanda(groupId, description, title, reqId, reqName, price, once, search, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle = "", friendlyReqName = "")
    pandaUI.addPanda("30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", "Tell us if two receipts are the same", "Tell us if two receipts are the same", "AGVV5AWLJY7H2", "Ibotta, Inc.", "0.01", false, null, 12, 0, true, 4000, -1, 0);
    // **************************************************************
  
    groupings.addGroupings("1 group","My first grouping", [[1,"off"], [2,"off"]]);
    groupings.addGroupings("2 group","My second grouping", []);
    groupings.addGroupings("3 group","My third grouping", [[2,"off"], [1,"off"]]);
    $('[data-toggle="tooltip"]').tooltip({delay: {show:1300}, trigger:'hover'});
  } else { displayDebuggerError(`Error opening database.`,error.message); }
}
function displayDebuggerError(title,message) {
  $(".pcm_top:first").html("");
  console.log(message); $('#pcm_logSection').html(`<H1 style="text-align:center;">${title}</H1><H5 style="color:#FF3333; text-align:center;">${message}</H5>`);
}
function logThis(num, cl, desc, title="log") { if (bgPage.gDebugLogThis(num, cl, desc, title)) console.log(desc); }
function logError(num, Cl, desc, title="error") { if (bgPage.gDebugLogError(num, Cl, desc, title)) console.log(desc); }
allTabs("/pandaCrazy.html", count => {
  if (count<2) startPandaCrazy();
  else displayDebuggerError(`Error starting PandaCrazy Max.`,`You have PandaCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`);
});
