/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( (request, sender) => { console.log(request.command);
      if (!sender.url.includes('generated_background_page')) {
        let command = request.command;
        if (command.substring(0, 3) === 'add' || command.slice(-7) === 'collect') { pandaUI.addFromExternal(request); }
        else if (request.command === 'projectedEarnings') { pandaUI.setEarnings(request.data.projectedEarnings); }
        else if (request.command === 'submitted') { pandaUI.submittedHit(request); }
        else if (request.command === 'returned') { pandaUI.returnedHit(request); }
        else if (request.command === 'accepted') { pandaUI.acceptedHit(request); }
        else if (request.command === 'monitorSpeech') { alarms.speakThisNow('HITs in Queue. Going to first.'); }
        else console.log(JSON.stringify(request), sender);
      }
    });
  }
}