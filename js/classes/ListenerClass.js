/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => { console.log(request.command);
      if (sender.url && !sender.url.includes('generated_background_page')) {
        let command = request.command, data = request.data;
        if (command && data) {
          if (command.substring(0, 3) === 'add' || command.slice(-7) === 'collect') pandaUI.addFromExternal(request);
          else if (command === 'projectedEarnings') pandaUI.setEarnings(data.projectedEarnings);
          else if (command === 'submitted') { pandaUI.submittedHit(request); }
          else if (command === 'returned') { pandaUI.returnedHit(request); }
          else if (command === 'acceptedhit') { pandaUI.acceptedHit(request); }
          else if (command === 'queueData') {  }
          else if (command === 'startcollect') {  }
          else if (command === 'stopcollect') {  }
          else if (command === 'startgroup' || command === 'stopgroup') { if (data.hasOwnProperty('groupName')) groupings.externalCommand(command, data.groupName); }
          else if (command === 'startSgroup' || command === 'stopSgroup') { if (data.hasOwnProperty('groupName')) groupings.externalCommand(command, data.groupName); }
          else if (command === 'getGroups') { groupings.theGroups(); }
          else if (command === 'getSGroups') { groupings.theGroups(); }
          else if (command === 'pause') { pandaUI.pauseToggle(true); }
          else if (command === 'unpause') { pandaUI.pauseToggle(false); }
          else if (command === 'forumOptions') { sendResponse(globalOpt.theHelperOptions()); }
          else if (command === 'queueOptions') { globalOpt.theSessionQueue(data); if (sendResponse) sendResponse(globalOpt.theHelperOptions()); }
          else if (command === 'monitorSpeech') { alarms.speakThisNow('HITs in Queue. Going to first.'); }
          else console.log(JSON.stringify(request), sender);
        }
      }
    });
  }
}