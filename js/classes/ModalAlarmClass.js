/** This class deals with any showing of modals for jobs.
 * @class ModalAlarmClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalAlarmClass {
	constructor() {
    this.reader = new FileReader();
    this.audio = null;
  }
  /** Creates a Jquery button and returns it.
   * @param  {string} text   - Button Text @param  {string} [theClass] - Class Name @param  {string} [color] - Color Name @param  {string} [title] - Title
   * @param  {string} [size] - Button Size
   * @return {object}                 - The Jquery button element created. */
  btnStr(text, theClass='', color='light', title='', size='xxs') {
    let titleStr = (title !== '') ? ` title='${title}'` : '';
    return `<button class='${theClass} btn btn-${size} btn-${color} mr-1'${titleStr}>${text}</button>`;
  }
  /** Creates the div element for each alarm option and returns it.
   * @param  {string} name - The name of the alarm to add.
   * @return {object}      - Jquery object of the div element created. */
  addDivAlarms(name) {
    let data = alarms.getData(name), colorM = (data.mute) ? 'success' : _, colorT = (data.tts) ? 'success' : _, desc = data.desc, pay = data.pay;
    let lessThan = (data.lessThan) ? data.lessThan : '', payStr = (pay) ? ` <span class='pay bg-info px-1' title='Change the less than pay rate.'>$${pay}</span>` : '';
    let lessThanStr = (lessThan > 0 && name !== 'queueAlert') ? ` with a short timer less than <span class='minutes bg-info px-1' title='Change the less than minute(s).'>${lessThan}</span> minute(s)` : '';
    if (name === 'queueAlert') lessThanStr = ` <span class='minutes bg-info px-1' title='Change the less than minute(s).'>${lessThan}</span> minute(s)`;
    return $(`<div class='${name}'></div>`).data('snd',name).append(this.btnStr('Play','playme',_, 'Play the sound now!')).append(this.btnStr('Mute','muteMe', colorM, 'Mute this sound.')).append(this.btnStr('TTS','ttsMe', colorT, 'Use Text to Speech instead.')).append(this.btnStr('Change','newSnd',_, 'Change the alarm to your own sound file.')).append(`<span class="ml-2">${desc}</span>${payStr}${lessThanStr}</div>`);
  }
  /** Add the save button when a user is changing the alarm sound.
   * @param  {string} name - The name of the alarm being changed. */
  addSaveButton(name) {
    $('.pcm_fileStatus').html('').css('color', '#1ee81e').append(this.btnStr('Save Audio', 'saveAudio', 'success', 'xs'));
    $('.saveAudio').click( (e) => {
      $('.pcm_changeMe').remove();
      if (this.audio) this.audio.load();
      alarms.getData(name).audio = this.audio;
      alarms.saveAlarm(name); this.audio = null;
    });
  }
  /** Shows the modal for the alrams so users can change alarm options.
   * @param  {function} [afterClose=null] - Function to call after modal is closed. */
  async showAlarmsModal(afterClose=null, onlySearch=false) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(this.alarms, "900px", "modal-header-info modal-lg", "Alarm Options", "", "text-right bg-dark text-light", "modal-footer-info");
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<div class='text-left pcm_alarms'></div>`);
    let df = document.createDocumentFragment();
    $(`<div class='pcm_alarmEdit text-center my-2'>You can mute and change an individual alarm sound here. Click the change button and pick your own sound from your computer. It must be less than 6MB and less than 30 seconds. You can also load in the default alarm sounds if you need to. The TTS button will have the script use a text to speech process instead of the alarm sound.</div>`).appendTo(df);
    if (onlySearch) { this.addDivAlarms('triggeredAlarm').appendTo(df); }
    else {
      this.addDivAlarms('less2').appendTo(df); this.addDivAlarms('less2Short').appendTo(df); this.addDivAlarms('less5').appendTo(df);
      this.addDivAlarms('less5Short').appendTo(df); this.addDivAlarms('less15').appendTo(df); this.addDivAlarms('less15Short').appendTo(df);
      this.addDivAlarms('more15').appendTo(df); this.addDivAlarms('queueFull').appendTo(df); this.addDivAlarms('queueAlert').appendTo(df);
      this.addDivAlarms('loggedOut').appendTo(df); this.addDivAlarms('captchaAlarm').appendTo(df);
    }
    modal.showModal(_, () => {
      $(`<div class='mt-3 ml-5'>Text to Speech voice: </div>`).append($(`<select id='voiceSelect'></select>`).append(alarms.voicesOption())).appendTo(df);
      divContainer.append(df).appendTo(modalBody);
      $('#voiceSelect').change( (e) => {
        let index = $('#voiceSelect option:selected').data('index');
        let name = $('#voiceSelect option:selected').data('name');
        alarms.theVoiceIndex(index); alarms.theVoiceName(name);
      });
      modalBody.find('.playme').click( (e) => {
        let wasPlaying = $(e.target).hasClass('btn-primary');
        modalBody.find('.playme').removeClass('btn-primary').addClass('btn-light').blur();
        alarms.stopSound(); if (this.audio) this.audio.load();
        if (!wasPlaying) {
          $(e.target).removeClass('btn-light').addClass('btn-primary');
          alarms.playSound($(e.target).closest('div').data('snd'), true,_, () => {
            modalBody.find('.playme').removeClass('btn-primary').addClass('btn-light').blur();
          });
        }
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
        modalBody.find('.playme').removeClass('btn-primary').addClass('btn-light').blur();
        alarms.stopSound(); if (this.audio) this.audio.load();
        let prevSnd = $('.pcm_changeMe').data('snd'), btn = $(e.target);
        let soundName = btn.closest('div').data('snd');
        $('.pcm_changeMe').remove();
        if (prevSnd !== soundName) {
          btn.closest('div').after($(`<div class='ml-4 my-2 pcm_changeMe'>Change sound to: </div>`).data('snd',soundName).append(`<span class='col-xs-12 pcm_fileInput'></span>`).append(createFileInput(_,'audio/*')).append($(`<span class='ml-2 pcm_fileStatus'></span>`).append(this.btnStr('Default Audio', 'defaultAudio', 'light', 'xs'))));
          $('.custom-file-input').on('change', (e) => {
            const fileName = $(e.target).val().replace('C:\\fakepath\\', ''), theFile = $(e.target).prop("files")[0];
            if (theFile) {
              let error = '', size = theFile.size/1024/1024;
              if (this.audio) this.audio.load(); this.audio = null;
              if (!theFile.type.includes('audio')) error = 'Only audio files may be used for alarms.';
              if (size <= 0 || size >= 6) error = 'Size must be less than 6MB.';
              if (error === '') {
                $(e.target).next('.custom-file-label').addClass("selected").html(fileName);
                this.reader.onload = () => this.readData(soundName, theFile.type);
                this.reader.readAsBinaryString(theFile);
                this.reader.onerror = () => { $('.pcm_fileStatus').html('can not read the file').css('color', '#f17979'); }
              } else $('.pcm_fileStatus').html(error).css('color', '#f17979');
            }
          });
          $('.defaultAudio').click( (e) => {
            let data = alarms.getData(soundName);
            this.audio = new Audio();
            this.audio.src = chrome.runtime.getURL(`${alarms.getFolder()}/${data.filename}`);
            this.addSaveButton(soundName);
          });
        }
      });
      modalBody.find('.pay').click( (e) => {
        let soundName = $(e.target).closest('div').data('snd');
        modal.showDialogModal("700px", "Change New Less Than Pay Rate.", "Enter the pay rate this alarm will sound when the pay rate is less than this:", () => {
          let newValue = $('#pcm_formQuestion').val();
          if (!isNaN(newValue)) {
            newValue = Number(newValue).toFixed(2);
            if (newValue < 20) {
              alarms.setPayRate(soundName, newValue); $(e.target).html('$' + newValue); modal.closeModal();
            } else $('.pcm_inputDiv-question:first .inputError').html('Must be a decimal less than 20!');
          } else $('.pcm_inputDiv-question:first .inputError').html('Must be a number!');
        }, true, true, "Pay rate: ", $(e.target).text().replace('$',''), 10,_, () => {}, 'Change', 'Default Value' ,() => {
          $(e.target).html('$' + alarms.setPayDef(soundName));
        });
      });
      modalBody.find('.minutes').click( (e) => {
        let soundName = $(e.target).closest('div').data('snd');
        modal.showDialogModal("700px", "Change New Less Than Minutes.", "Enter the minutes that this alarm will sound if the duration is less than this:", () => {
          let newValue = $('#pcm_formQuestion').val();
          if (!isNaN(newValue)) {
            alarms.setLessThan(soundName, newValue); $(e.target).html(newValue); modal.closeModal();
          } else $('.pcm_inputDiv-question:first .inputError').html('Must be a number!');
        }, true, true, "Minutes: ", $(e.target).text(), 10,_, () => {}, 'Change', 'Default Value' ,() => {
          $(e.target).html(alarms.setLessThanDef(soundName));
        });
      });
    }, () => {
      if (this.audio) this.audio.load(); this.audio = null; alarms.stopSound();
      modal = null; if (afterClose) afterClose();
    });
  }
  /** Reads a file, sets up the audio and plays the audio to user.
   * @param  {string} name - Alarm Name @param  {string} type - Audio Type */
  readData(name, type) {
    let readerContents = this.reader.result;
    let base64Audio = btoa(readerContents);
    this.audio = new Audio(`data:${type};base64,` + base64Audio);
    this.audio.play(); this.addSaveButton(name);
  }
}