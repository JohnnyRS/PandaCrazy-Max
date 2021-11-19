/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => { console.info(request.command);
      if (sender.url && !sender.url.includes('generated_background_page')) {
        let command = request.command, data = request.data;
        if (command && data) {
          if (command.substring(0, 3) === 'add') { if (typeof pandaUI !== 'undefined') pandaUI.addFromExternal(request); }
          else if (command === 'projectedEarnings') { if (typeof pandaUI !== 'undefined') pandaUI.setEarnings(data.projectedEarnings); }
          else if (command === 'getQueueData') { if (typeof pandaUI !== 'undefined' && bgQueue) bgQueue.sendQueueResults(sendResponse); }
          else if (command === 'submitted') { if (typeof pandaUI !== 'undefined') pandaUI.submittedHit(request); }
          else if (command === 'returned') { if (typeof pandaUI !== 'undefined') pandaUI.returnedHit(request); }
          else if (command === 'acceptedhit') { if (typeof pandaUI !== 'undefined') pandaUI.acceptedHit(request); }
          else if (command === 'getJobs') { if (typeof pandaUI !== 'undefined') pandaUI.getAllData(sendResponse); }
          else if (command === 'removeJob') { if (typeof pandaUI !== 'undefined' && bgPanda && data.hasOwnProperty('id')) { pandaUI.extRemoveJob(data.id, sendResponse); }}
          else if (command === 'getTriggers') { if (MySearchUI && MySearch) MySearch.getAllTriggers(sendResponse); }
          else if (command === 'startSearching') { if (MySearchUI && data.hasOwnProperty('id')) MySearchUI.startSearching(); }
          else if (command === 'stopSearching') { if (MySearchUI && data.hasOwnProperty('id')) MySearchUI.stopSearching(); }
          else if (command === 'enableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, true) }
          else if (command === 'disableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, false); }
          else if (command === 'removeTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearch.removeTrigger(data.id,_,_, true, true, sendResponse); }
          else if (command === 'getStats') { if (typeof pandaUI !== 'undefined') pandaUI.sendStats(sendResponse); }
          else if (command === 'pause') { if (typeof pandaUI !== 'undefined') pandaUI.pauseToggle(true); }
          else if (command === 'unpause') { if (typeof pandaUI !== 'undefined') pandaUI.pauseToggle(false); }
          else if (command === 'forumOptions') { if (typeof pandaUI !== 'undefined' && MyOptions) sendResponse(MyOptions.theHelperOptions()); }
          else if (command === 'queueOptions') { if (typeof pandaUI !== 'undefined' && MyOptions) MyOptions.theSessionQueue(data); if (sendResponse) sendResponse(MyOptions.theHelperOptions()); }
          else if (command === 'monitorSpeech') { if (typeof pandaUI !== 'undefined' && !MyOptions.doGeneral().disableMonitorAlert) MyAlarms.speakThisNow('HITs in Queue. Going to first.'); }
          else if (command === 'getGroups') { if (typeof pandaUI !== 'undefined' && groupings) sendResponse({'for':'getGroups', 'response':groupings.theGroups()}); }
          else if (command === 'getSGroups') { if (MySearchUI && sGroupings) sendResponse({'for':'getSGroups', 'response':sGroupings.theGroups()}); }
          else if (command === 'enableSgroup' || command === 'disableSgroup') { if (MySearchUI && sGroupings && data.hasOwnProperty('id')) sGroupings.externalCommand(command, data.id); }
          else if (command === 'startcollect') { if (typeof pandaUI !== 'undefined' && data.hasOwnProperty('id')) { let myId = bgPanda.getMyId(data.id); if (myId >= 0) pandaUI.startCollecting(myId); }}
          else if (command === 'stopcollect') { if (typeof pandaUI !== 'undefined' && data.hasOwnProperty('id')) { let myId = bgPanda.getMyId(data.id); if (myId >= 0) pandaUI.stopCollecting(myId); }}
          else if (command === 'startgroup' || command === 'stopgroup') { if (typeof pandaUI !== 'undefined' && groupings && data.hasOwnProperty('id')) groupings.externalCommand(command, data.id); }
          else console.info(JSON.stringify(request), sender);
        }
      }
      return true;
    });
  }
}
