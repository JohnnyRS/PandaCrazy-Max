/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => { console.info(request.command);
      if (sender.url && !sender.url.includes('generated_background_page')) {
        let command = request.command, data = request.data;
        if (command && data) {
          if (command.substring(0, 3) === 'add') { if (MyPandaUI !== null) MyPandaUI.addFromExternal(request); }
          else if (command === 'projectedEarnings') { if (MyPandaUI !== null) MyPandaUI.setEarnings(data.projectedEarnings); }
          else if (command === 'getQueueData') { if (MyPandaUI !== null && MyQueue) MyQueue.sendQueueResults(sendResponse); }
          else if (command === 'submitted') { if (MyPandaUI !== null) MyPandaUI.submittedHit(request); }
          else if (command === 'returned') { if (MyPandaUI !== null) MyPandaUI.returnedHit(request); }
          else if (command === 'acceptedhit') { if (MyPandaUI !== null) MyPandaUI.acceptedHit(request); }
          else if (command === 'getJobs') { if (MyPandaUI !== null) MyPandaUI.getAllData(sendResponse); }
          else if (command === 'removeJob') { if (MyPandaUI !== null && MyPanda && data.hasOwnProperty('id')) { MyPandaUI.extRemoveJob(data.id, sendResponse); }}
          else if (command === 'getTriggers') { if (MySearchUI && MySearch) MySearch.getAllTriggers(sendResponse); }
          else if (command === 'startSearching') { if (MySearchUI && data.hasOwnProperty('id')) MySearchUI.startSearching(); }
          else if (command === 'stopSearching') { if (MySearchUI && data.hasOwnProperty('id')) MySearchUI.stopSearching(); }
          else if (command === 'enableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, true) }
          else if (command === 'disableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, false); }
          else if (command === 'removeTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearch.removeTrigger(data.id,_,_, true, true, sendResponse); }
          else if (command === 'getStats') { if (MyPandaUI !== null) MyPandaUI.sendStats(sendResponse); }
          else if (command === 'pause') { if (MyPandaUI !== null) MyPandaUI.pauseToggle(true); }
          else if (command === 'unpause') { if (MyPandaUI !== null) MyPandaUI.pauseToggle(false); }
          else if (command === 'forumOptions') { if (MyPandaUI !== null && MyOptions) sendResponse(MyOptions.theHelperOptions()); }
          else if (command === 'queueOptions') { if (MyPandaUI !== null && MyOptions) MyOptions.theSessionQueue(data); if (sendResponse) sendResponse(MyOptions.theHelperOptions()); }
          else if (command === 'monitorSpeech') { if (MyPandaUI !== null && !MyOptions.doGeneral().disableMonitorAlert) MyAlarms.speakThisNow('HITs in Queue. Going to first.'); }
          else if (command === 'getGroups') { if (MyPandaUI !== null && MyGroupings) sendResponse({'for':'getGroups', 'response':MyGroupings.theGroups()}); }
          else if (command === 'getSGroups') { if (MySearchUI && MySGroupings) sendResponse({'for':'getSGroups', 'response':MySGroupings.theGroups()}); }
          else if (command === 'enableSgroup' || command === 'disableSgroup') { if (MySearchUI && MySGroupings && data.hasOwnProperty('id')) MySGroupings.externalCommand(command, data.id); }
          else if (command === 'startcollect') { if (MyPandaUI !== null && data.hasOwnProperty('id')) { let myId = MyPanda.getMyId(data.id); if (myId >= 0) MyPandaUI.startCollecting(myId); }}
          else if (command === 'stopcollect') { if (MyPandaUI !== null && data.hasOwnProperty('id')) { let myId = MyPanda.getMyId(data.id); if (myId >= 0) MyPandaUI.stopCollecting(myId); }}
          else if (command === 'startgroup' || command === 'stopgroup') { if (MyPandaUI !== null && MyGroupings && data.hasOwnProperty('id')) MyGroupings.externalCommand(command, data.id); }
          else if (command === 'popup: sessionOptions') { MyOptions.theSessionQueue(data); }
          else if (command === 'popup: helperOptions') { MyOptions.theHelperOptions(data); }
          else console.info(JSON.stringify(request), sender);
        }
      }
      return true;
    });
  }
}
