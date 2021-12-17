/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ListenerClass {
  constructor() {
    browser.runtime.onMessage.addListener((request, sender) => { console.info(request.command);
      if (sender.url && !sender.url.includes('generated_background_page')) {
        let command = request.command, data = request.data;
        if (command && data) {
          if (command.substring(0, 3) === 'add') { if (MyPandaUI !== null) MyPandaUI.addFromExternal(request); }
          else if (command === 'projectedEarnings') { if (MyPandaUI !== null) MyPandaUI.setEarnings(data.projectedEarnings); }
          else if (command === 'getQueueData') { if (MyPandaUI !== null && MyQueue) return Promise.resolve(MyQueue.sendQueueResults(true)); }
          else if (command === 'submitted') { if (MyPandaUI !== null) MyPandaUI.submittedHit(request); }
          else if (command === 'returned') { if (MyPandaUI !== null) MyPandaUI.returnedHit(request); }
          else if (command === 'acceptedhit') { if (MyPandaUI !== null) MyPandaUI.acceptedHit(request); }
          else if (command === 'getJobs') { if (MyPandaUI !== null) return Promise.resolve(MyPandaUI.getAllData()); }
          else if (command === 'removeJob') { if (MyPandaUI !== null && MyPanda && data.hasOwnProperty('id')) { return Promise.resolve(MyPandaUI.extRemoveJob(data.id)); }}
          else if (command === 'getTriggers') { if (MySearchUI && MySearch) return Promise.resolve(MySearch.getAllTriggers()); }
          else if (command === 'startSearching') { if (MySearchUI.isSearchUI()) MySearchUI.startSearching(); }
          else if (command === 'stopSearching') { if (MySearchUI.isSearchUI()) MySearchUI.stopSearching(); }
          else if (command === 'searchPause') { if (MySearchUI.isSearchUI()) MySearch.pauseTimer(); }
          else if (command === 'searchUnpause') { if (MySearchUI.isSearchUI()) MySearch.unPauseTimer(); }
          else if (command === 'enableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, true) }
          else if (command === 'disableTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) MySearchUI.externalSet(data.id, false); }
          else if (command === 'removeTrigger') { if (MySearchUI && MySearch && data.hasOwnProperty('id')) return Promise.resolve(MySearch.removeTrigger(data.id,_,_, true, true, true)); }
          else if (command === 'getStats') { if (MyPandaUI !== null) return Promise.resolve(MyPandaUI.sendStats()); }
          else if (command === 'pause') { if (MyPandaUI !== null) MyPandaUI.pauseToggle(true); }
          else if (command === 'unpause') { if (MyPandaUI !== null) MyPandaUI.pauseToggle(false); }
          else if (command === 'forumOptions') { if (MyPandaUI !== null && MyOptions) return Promise.resolve(MyOptions.theHelperOptions()); }
          else if (command === 'queueOptions') { if (MyPandaUI !== null && MyOptions) MyOptions.theSessionQueue(data); return Promise.resolve(MyOptions.theHelperOptions()); }
          else if (command === 'monitorSpeech') { if (MyPandaUI !== null && !MyOptions.doGeneral().disableMonitorAlert) MyAlarms.speakThisNow('HITs in Queue. Going to first.'); }
          else if (command === 'getGroups') { if (MyPandaUI !== null && MyGroupings) { let r = MyGroupings.theGroups(); return Promise.resolve({'for':'getGroups', 'response':r}); }}
          else if (command === 'getSGroups') { if (MySearchUI.isSearchUI() && MySGroupings) { let r = MySGroupings.theGroups(); return Promise.resolve({'for':'getSGroups', 'response':r}); }}
          else if (command === 'enableSgroup' || command === 'disableSgroup') { if (MySearchUI && MySGroupings && data.hasOwnProperty('id')) MySGroupings.externalCommand(command, data.id); }
          else if (command === 'startcollect') { if (MyPandaUI !== null && data.hasOwnProperty('id')) { let myId = MyPanda.getMyId(data.id); if (myId >= 0) MyPandaUI.startCollecting(myId); }}
          else if (command === 'stopcollect') { if (MyPandaUI !== null && data.hasOwnProperty('id')) { let myId = MyPanda.getMyId(data.id); if (myId >= 0) MyPandaUI.stopCollecting(myId); }}
          else if (command === 'startgroup' || command === 'stopgroup') { if (MyPandaUI !== null && MyGroupings && data.hasOwnProperty('id')) MyGroupings.externalCommand(command, data.id); }
          else if (command === 'popup: sessionOptions') { MyOptions.theSessionQueue(data); }
          else if (command === 'popup: helperOptions') { MyOptions.theHelperOptions(data); }
          else console.info(JSON.stringify(request), sender);
        }
      }
    });
  }
}
