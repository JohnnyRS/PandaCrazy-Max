const locationUrl = window.location.href;
/**
 */
function addCommands() {
  const regex = /\/PandaCrazy([^\/]*)\/.*JRGID=([^&]*)&JRRName=([^&]*)&JRRID=([^&]*)&JRTitle=([^&]*)&JRReward=(.*)/;
  let [_, command, groupId, reqName, reqId, title, reward] = locationUrl.match(regex);
  command = (command==="Add") ? "addJob" : ( (command==="Search") ? "addSearchJob" : ( (command==="SearchOnce") ? "addSearchOnceJob" : "addOnceJob" ));
  chrome.runtime.sendMessage({command:command, groupId:groupId, description:"", title:title, reqId:reqId, reqName:reqName, price:reward});
}
/**
 */
function doAssignment() {
  const regex = /\/projects\/([^\/]*)\/tasks\/([^\?]*)\?assignment_id=([^&]*)/;
  let [_, groupId, hitId, assignmentId] = locationUrl.match(regex);
}

if (/requesters\/PandaCrazy[^\/].*JRGID=.*JRRName=/.test(locationUrl)) addCommands();
else if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(locationUrl)) console.log("thanks");
window.addEventListener("storage", event => { console.log(event);
});