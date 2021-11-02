/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => { console.info(request.command);
      if (sender.url && !sender.url.includes('generated_background_page')) {
        let command = request.command, data = request.data;
        if (command && data) {
          if (command.substring(0, 3) === 'add') { if (pandaUI) pandaUI.addFromExternal(request); }
          else if (command === 'projectedEarnings') { if (pandaUI) pandaUI.setEarnings(data.projectedEarnings); }
          else if (command === 'getQueueData') { if (pandaUI && bgQueue) bgQueue.sendQueueResults(sendResponse); }
          else if (command === 'submitted') { if (pandaUI) pandaUI.submittedHit(request); }
          else if (command === 'returned') { if (pandaUI) pandaUI.returnedHit(request); }
          else if (command === 'acceptedhit') { if (pandaUI) pandaUI.acceptedHit(request); }
          else if (command === 'getJobs') { if (pandaUI) pandaUI.getAllData(sendResponse); }
          else if (command === 'startcollect') { if (pandaUI && data.hasOwnProperty('id')) { let myId = bgPanda.getMyId(data.id); if (myId >= 0) pandaUI.startCollecting(myId); }}
          else if (command === 'stopcollect') { if (pandaUI && data.hasOwnProperty('id')) { let myId = bgPanda.getMyId(data.id); if (myId >= 0) pandaUI.stopCollecting(myId); }}
          else if (command === 'getGroups') { if (pandaUI && groupings) sendResponse({'for':'getGroups', 'response':groupings.theGroups()}); }
          else if (command === 'startgroup' || command === 'stopgroup') { if (pandaUI && groupings && data.hasOwnProperty('id')) groupings.externalCommand(command, data.id); }
          else if (command === 'removeJob') { if (pandaUI && bgPanda && data.hasOwnProperty('id')) { pandaUI.extRemoveJob(data.id, sendResponse); }}
          else if (command === 'getTriggers') { if (search && bgSearch) bgSearch.getAllTriggers(sendResponse); }
          else if (command === 'startSearching') { if (search && data.hasOwnProperty('id')) search.startSearching(data.id); }
          else if (command === 'stopSearching') { if (search && data.hasOwnProperty('id')) search.stopSearching(data.id); }
          else if (command === 'enableTrigger') { if (search && bgSearch && data.hasOwnProperty('id')) search.externalSet(data.id, true) }
          else if (command === 'disableTrigger') { if (search && bgSearch && data.hasOwnProperty('id')) search.externalSet(data.id, false); }
          else if (command === 'getSGroups') { if (search && sGroupings) sendResponse({'for':'getSGroups', 'response':sGroupings.theGroups()}); }
          else if (command === 'enableSgroup' || command === 'disableSgroup') { if (search && sGroupings && data.hasOwnProperty('id')) sGroupings.externalCommand(command, data.id); }
          else if (command === 'removeTrigger') { if (search && bgSearch && data.hasOwnProperty('id')) bgSearch.removeTrigger(data.id,_,_, true, true, sendResponse); }
          else if (command === 'getStats') { if (pandaUI) pandaUI.sendStats(sendResponse); }
          else if (command === 'pause') { if (pandaUI) pandaUI.pauseToggle(true); }
          else if (command === 'unpause') { if (pandaUI) pandaUI.pauseToggle(false); }
          else if (command === 'forumOptions') { if (pandaUI && globalOpt) sendResponse(globalOpt.theHelperOptions()); }
          else if (command === 'queueOptions') { if (pandaUI && globalOpt) globalOpt.theSessionQueue(data); if (sendResponse) sendResponse(globalOpt.theHelperOptions()); }
          else if (command === 'monitorSpeech') { if (pandaUI && !globalOpt.doGeneral().disableMonitorAlert) MyAlarms.speakThisNow('HITs in Queue. Going to first.'); }
          else console.info(JSON.stringify(request), sender);
        }
      }
      return true;
    });
  }
}
