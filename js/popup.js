let bgPage = null;

window.onload = () => {
  chrome.runtime.getBackgroundPage( (backgroundPage) => {
    bgPage = backgroundPage; bgPage.popupOpened();
    bgPage.getCurrentTab( (thisUrl) => { console.log(thisUrl);
      if (/projects\/[^\/]*\/tasks\/.*?assignment_id/.test(thisUrl) || /worker\.mturk\.com\/tasks/.test(thisUrl)) console.log('Hit Page or queue');
    });
  });
}
