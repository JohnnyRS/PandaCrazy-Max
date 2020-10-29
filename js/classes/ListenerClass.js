/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( (request, sender) => { 	// used for external add buttons
      if (!sender.url.includes('generated_background_page')) {
        console.log(JSON.stringify(request), sender);
        let command = request.command;
        if (command.substring(0, 3) === "add" || command.slice(-7) === 'collect') { pandaUI.addFromExternal(request); }
        else if (request.command === 'projectedEarnings') { pandaUI.setEarnings(request.data.projectedEarnings); }
        else if (request.command === 'submitted') { pandaUI.submittedHit(request.taskId); }
        else if (request.command === 'monitorSpeech') { alarms.speakThisNow('Hits in Queue. Going to first.'); }
      }
    });
  }
}