class ListenerClass {
  constructor() {
    chrome.runtime.onMessage.addListener( (request, sender) => { 	// used for external add buttons
      console.log(JSON.stringify(request), sender);
      if (request.command.substring(0, 3)==="add") { pandaUI.addFromExternal(request); }
      else if (request.command === 'projectedEarnings') { console.log('earnings: ',request.data.projectedEarnings); }
    });
  }
}