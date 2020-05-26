const locationUrl = window.location.href;
/**
 * Sends message commands to PandaCrazy about a new panda or search job to add.
 * Parses the url to grab the command and the relevant information for panda.
 */
function addCommands() {
  const regex = /\/PandaCrazy([^\/]*)\/.*JRGID=([^&]*)&JRRName=([^&]*)&JRRID=([^&]*)&JRTitle=([^&]*)&JRReward=(.*)/;
  let [_, command, groupId, reqName, reqId, title, reward] = locationUrl.match(regex);
  command = (command==="Add") ? "addJob" : ( (command==="Search") ? "addSearchJob" : ( (command==="SearchOnce") ? "addSearchOnceJob" : "addOnceJob" ));
  chrome.runtime.sendMessage({command:command, groupId:groupId, description:"", title:title, reqId:reqId, reqName:reqName, price:reward});
}
/**
 * Parses a url with an assignment ID attached.
 */
function doAssignment() {
  const regex = /\/projects\/([^\/]*)\/tasks\/([^\?]*)\?assignment_id=([^&]*)/;
  let [_, groupId, hitId, assignmentId] = locationUrl.match(regex);
}

if (/requesters\/PandaCrazy[^\/].*JRGID=.*JRRName=/.test(locationUrl)) addCommands();
else if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(locationUrl)) console.log("thanks");
window.addEventListener("storage", event => { console.log(event);
});