let panda=null, alarms=null, notify=null, menus=null, globalOpt=null;
function startPandaCrazy() {
  MturkPanda._init_GStats(); // initialise a static stats for all global panda stats

  globalOpt = new PandaGOptions();
  panda = new MturkPanda(); // set up a mturk class for a panda
  alarms = new AlarmsClass();
  notify = new NotificationsClass();
  groupings = new PandaGroupings();
  menus = new MenuClass("pcm_quickMenu"); // set up a mturk class for a panda

  $(".sortable").sortable({connectWith: ".sortable"}).disableSelection();

  // ***************** Add Panda's Here for now *******************
  // addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle = "", friendlyReqName = "")
  panda.addPanda("30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", "Tell us if two receipts are the same", "Tell us if two receipts are the same", "AGVV5AWLJY7H2", "Ibotta, Inc.", "0.01", false, 12, 0, true, 4000, -1, 0);
  // **************************************************************
  
  groupings.addGroupings("1 group","My first grouping", [[1,"off"], [2,"off"]]);
  groupings.addGroupings("2 group","My second grouping", []);
  groupings.addGroupings("3 group","My third grouping", [[2,"off"], [1,"off"]]);
  $('[data-toggle="tooltip"]').tooltip({delay: {show:1300}, trigger:'hover'});
  
  window.addEventListener("storage", event => { console.log(event);
    if (event.key==="PCM_addAndRunPanda") {
      const v = JSON.parse(event.newValue);
      panda.addAndRunPanda(v.gId, v.desc, v.title, v.rId, v.reqName, v.price, v.once, v.hitsAvailable, v.limitNumQueue, v.limitTotalQueue, v.tempDuration, v.tempGoHam);
      localStorage.removeItem("PCM_addAndRunPanda");
    } else if (event.key==="PCM_queueResults") {
      const v = JSON.parse(event.newValue);
      queue.setQueueResults(v);
      panda.gotNewQueue();
    }
  }, false);
}
allTabs("/pandaCrazy.html", count => { if (count<2) startPandaCrazy(); });

