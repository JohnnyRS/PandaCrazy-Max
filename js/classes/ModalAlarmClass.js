/** This class deals with any showing of modals for jobs.
 * @class ModalAlarmClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalAlarmClass {
	constructor() {
    this.reader = new FileReader();
  }
  btnStr(text, theClass='', color='light', title='', size='xxs') {
    let titleStr = (title !== '') ? ` title='${title}'` : '';
    return `<button class='${theClass} btn btn-${size} btn-${color} mr-1'${titleStr}>${text}</button>`;
  }
  addDivAlarms(name, description) {
    let data = alarms.getData(name);
    let colorM = (data.mute) ? 'success' : _, colorT = (data.tts) ? 'success' : _;
    let desc = data.desc, pay = data.pay, lessThan = (data.lessThan) ? data.lessThan : '';
    let payStr = (pay) ? ` <span class='pay bg-info px-1' title='Change the less than pay rate.'>$${pay}</span>` : '';
    let lessThanStr = (lessThan > 0 && name !== 'queueAlert') ? ` with a short timer less than <span class='minutes bg-info px-1' title='Change the less than minute(s).'>${lessThan}</span> minute(s)` : '';
    if (name === 'queueAlert') lessThanStr = ` <span class='minutes bg-info px-1' title='Change the less than minute(s).'>${lessThan}</span> minute(s)`;
    return $(`<div class='${name}'></div>`).data('snd',name).append(this.btnStr('Play','playme',_, 'Play the sound now!')).append(this.btnStr('Mute','muteMe', colorM, 'Mute this sound.')).append(this.btnStr('TTS','ttsMe', colorT, 'Use Text to Speech instead.')).append(this.btnStr('Change','newSnd',_, 'Change the alarm to your own sound file.')).append(`<span class="ml-2">${desc}</span>${payStr}${lessThanStr}</div>`);
  }
  async showAlarmsModal(successFunc=null, afterClose=null) {
    modal = new ModalClass();
    const idName = modal.prepareModal(this.alarms, "900px", "modal-header-info modal-lg", "Alarm Options", "", "text-right bg-dark text-light", "modal-footer-info");
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<div class='text-left pcm_alarms'></div>`);
    let df = document.createDocumentFragment();
    this.addDivAlarms('less2', 'Hits paying less than $0.02.').appendTo(df);
    this.addDivAlarms('less2Short', 'Hits paying less than $0.02 with a short timer less than 2 minutes.').appendTo(df);
    this.addDivAlarms('less5', 'Hits paying less than $0.05.').appendTo(df);
    this.addDivAlarms('less5Short', 'Hits paying less than $0.05 with a short timer less than 5 minutes.').appendTo(df);
    this.addDivAlarms('less15', 'Hits paying less than $0.15.').appendTo(df);
    this.addDivAlarms('less15Short', 'Hits paying less than $0.15 with a short timer less than 8 minutes.').appendTo(df);
    this.addDivAlarms('more15', 'Hits paying more than $0.15.').appendTo(df);
    this.addDivAlarms('queueFull', 'You have a full queue.').appendTo(df);
    this.addDivAlarms('queueAlert', 'Lowest timed hit in queue is less than 3 minutes.').appendTo(df);
    this.addDivAlarms('loggedOut', 'You are logged out.').appendTo(df);
    this.addDivAlarms('captchaAlarm', 'Found a captcha.').appendTo(df);
    modal.showModal(_, () => {
      divContainer.append(df).appendTo(modalBody);
      modalBody.find('[data-toggle="tooltip"]').tooltip({delay: {show:1200}, trigger:'hover'});
      modalBody.find('.playme').click( (e) => {
        alarms.playSound($(e.target).closest('div').data('snd'), true);
        $(e.target).blur();
      });
      modalBody.find('.muteMe').click( (e) => {
        let btn = $(e.target);
        let mute = alarms.muteToggle(btn.closest('div').data('snd'));
        if (mute) btn.removeClass('btn-light').addClass('btn-success');
        else btn.removeClass('btn-success').addClass('btn-light');
        btn.blur();
      });
      modalBody.find('.ttsMe').click( (e) => {
        let btn = $(e.target);
        let tts = alarms.ttsToggle(btn.closest('div').data('snd'));
        if (tts) btn.removeClass('btn-light').addClass('btn-success');
        else btn.removeClass('btn-success').addClass('btn-light');
        btn.blur();
      });
      modalBody.find('.newSnd').click( (e) => {
        $('.pcm_changeMe').remove();
        let soundName = $(e.target).closest('div').data('snd');
        $(e.target).closest('div').after($(`<div class='ml-4 my-2 pcm_changeMe'>Change sound to: </div>`).append(`<span class='col-xs-12 pcm_fileInput'></span>`).append(createFileInput(_,'audio/*')).append(`<span class='ml-2 pcm_fileStatus'></span>`));
        $('.custom-file-input').on('change', (e) => {
          const fileName = $(e.target).val().replace('C:\\fakepath\\', ''), theFile = $(e.target).prop("files")[0];
          if (theFile) {
            let error = '', size = theFile.size/1024/1024;
            if (!theFile.type.includes('audio')) error = 'Only audio files may be used for alarms.';
            if (size <= 0 || size >= 6) error = 'Size must be less than 6MB.';
            if (error === '') { console.log(soundName);
              $(e.target).next('.custom-file-label').addClass("selected").html(fileName);
              this.reader.onload = () => this.readData(soundName, theFile.type);
              this.reader.readAsBinaryString(theFile);
              this.reader.onerror = () => { $('.pcm_fileStatus').html('can not read the file').css('color', '#f17979'); }
            } else $('.pcm_fileStatus').html(error).css('color', '#f17979');
          }
        });
      });
      modalBody.find('.pay').click( (e) => {
        modal.showDialogModal("700px", "Change New Less Than Pay Rate.", "Enter the pay rate this alarm will sound when the pay rate is less than this:", () => {
          const newPay = $('#pcm_formQuestion').val();
          console.log('oh my god.....................',newPay);
          modal.closeModal();
        }, true, false, "Pay rate: ", $(e.target).text(), 10,_, () => {}, 'Change');
      });
      modalBody.find('.minutes').click( (e) => {
        modal.showDialogModal("700px", "Change New Less Than Minutes.", "Enter the minutes that this alarm will sound if the duration is less than this:", () => {
          const newPay = $('#pcm_formQuestion').val();
          console.log('oh my god.....................',newPay);
          modal.closeModal();
        }, true, false, "Minutes: ", $(e.target).text(), 10,_, () => {}, 'Change');
      });
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  readData(name, type) {
    let readerContents = this.reader.result;
    let base64Audio = btoa(readerContents);
    let newAudio = new Audio(`data:${type};base64,` + base64Audio);
    newAudio.play();
    $('.pcm_fileStatus').html('').css('color', '#1ee81e').append(this.btnStr('Save Audio', 'saveAudio', 'success', 'xs'));
    $('.saveAudio').click( (e) => {
      $('.pcm_changeMe').remove();
      console.log('saving audio file.');
      alarms.getData(name).audio = newAudio;
    } )
  }
}