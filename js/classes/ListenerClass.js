/**
 * Class dealing with any listening to messages from other scripts or extensions.
 * @class ListenerClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( (request, sender) => { 	// used for external add buttons
      console.log(JSON.stringify(request), sender);
      let command = request.command;
      if (command.substring(0, 3) === "add" || command.slice(-7) === 'collect') { pandaUI.addFromExternal(request); }
      else if (request.command === 'projectedEarnings') { console.log('earnings: ',request.data.projectedEarnings); }
    });
  }
}