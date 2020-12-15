let bgPage = null;

function pageData(fragment) {
  if (fragment) $(`<div class='pcm-addedSection'></div>`).appendTo('body').append(fragment);
}

window.onload = () => {
  chrome.runtime.getBackgroundPage( (backgroundPage) => {
    bgPage = backgroundPage; bgPage.popupOpened(pageData);
    bgPage.getCurrentTab( (thisUrl) => {
    });
  });
}
