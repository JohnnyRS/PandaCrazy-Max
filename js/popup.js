$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Adds a jquery fragment to the popup from background page or closes this popup window.
 * @param {object} fragment - Jquery Element  @param {bool} [closeThis] - Close Popup Window?  @param {bool} [tooltips] - Show Tooltips? */
function pageData(fragment, closeThis=false, tooltips=null) {
  if (closeThis) window.close();
  else if (tooltips !== null) { if (tooltips) $('.pcm-tooltipData').removeClass('pcm-tooltipDisable'); else $('.pcm-tooltipData').addClass('pcm-tooltipDisable'); }
  else if (fragment && fragment[0].childElementCount > 0) $(`<div class='pcm-addedSection'></div>`).appendTo('body').append(fragment);
}

/** Will inform extension that it's icon has been clicked and sends active tab object. Waits for any sent data back to add to popup or close it. */
window.onload = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => { chrome.runtime.getBackgroundPage( (backgroundPage) => { backgroundPage.popupOpened(tabs[0], pageData); }); });
};
