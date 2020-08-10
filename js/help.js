chrome.runtime.getBackgroundPage( async (backgroundPage) => {
  bgPage = backgroundPage;
  $('#pcm_resetMyData').click( () => {
    modal = new ModalClass();
    if (!bgPage.gGetPanda() && !bgPage.gGetSearch() && !bgPage.gGetHistory()) {
      modal.showDialogModal("600px", "Wipe All Data", "Do you really want to delete all your saved data?<br>You will go back to default values!", async () => {
        bgPage.wipeData();
        $('#pcm_resetMyData').css({'backgroundColor':'#e69ca3', 'color':'#777'}).prop('disabled',true);
        modal.closeModal();
      }, true, true);
    } else {
      modal.showDialogModal("700px", "Please Close the Panda Crazy Max Page!", "You must close the Panda Crazy Max page first before wiping all the data.", null , false, false);
    }
  });
});
