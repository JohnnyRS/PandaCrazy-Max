MturkPanda._init_GStats(); // initialise a static stats for all global panda stats

const panda = new MturkPanda(); // set up a mturk class for a panda
const modal = new ModalClass(panda); // set up a modal class for a options, warnings or details
const menus = new MenuClass("pcm_quickMenu", panda); // set up a mturk class for a panda
const pandaTabs = new TabbedClass($(`#pcm_pandaSection`)); // set up a mturk class for a panda
const groupings = new PandaGroupings();
const alarms = new AlarmsClass();
panda.addTabsObj(pandaTabs);

$(".sortable").sortable({connectWith: ".sortable"}).disableSelection();

// ***************** Add Panda's Here for now *******************
// addPanda(groupId, description, title, reqId, reqName, price, once, limitNumQueue, limitTotalQueue, autoGoHam, hamDuration, duration, acceptLimit, hitsAvailable=0, tabUnique=0, autoAdded=false, friendlyTitle = "", friendlyReqName = "")
  panda.addPanda("30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", "Tell us if two receipts ar the same", "Tell us if two receipts ar the same", "AGVV5AWLJY7H2", "Ibotta, Inc.", "0.01", false, 12, 0, true, 4000, -1, 0);
  // **************************************************************
  
  groupings.addGroupings("1 group","My first grouping", [[0,false], [1,false]]);
  groupings.addGroupings("2 group","My second grouping", [[0,false], [1,false]]);
  groupings.addGroupings("3 group","My third grouping", [[0,false], [1,false]]);
  
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
  