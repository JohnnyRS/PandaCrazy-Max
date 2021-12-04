/** This class deals with any showing of modals for jobs.
 * @class ModalAlarmClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ModalSearchAlarmClass {
	constructor() {
    this.reader = new FileReader();     // Set up a file reader so user can select a audio file on their computer.
    this.myAudio = null;                // A temporary variable to hold the audio in memory before saving it.
  }
  /** Creates a Jquery button and returns it.
   * @param  {string} text    - Button text.  @param  {string} [theClass] - Class name.  @param  {string} [status] - Status class name.
   * @param  {string} [title] - The title.    @param  {string} [size]     - Button size.
   * @return {object}         - The Jquery button element created.
  **/
  btnStr(text, theClass='', status='', title='', size='xxs') {
    let titleStr = (title !== '') ? ` data-original-title='${title}'` : '';
    return `<button class='${theClass} btn btn-${size} ${status} pcm-tooltipData pcm-tooltipHelper'${titleStr}>${text}</button>`;
  }
  /** Creates the div element for each alarm option and returns it.
   * @param  {string} name - The name of the alarm to add.
   * @return {object}      - Jquery object of the div element created.
  **/
  addDivAlarms(name) {
    let data = MyAlarms.getData(name), statusM = (data.mute) ? 'btn-mutted' : '', colorT = (data.tts) ? 'btn-doTTS' : '', desc = data.desc, pay = data.pay, lessThanStr = ``;
    let lessThan = (data.lessThan) ? data.lessThan : '', payStr = (pay) ? ` <span class='pcm-alarmsPay pcm-tooltipData pcm-tooltipHelper' data-original-title='Change the less than pay rate.'>$${pay}</span>` : '';
    if (lessThan > 0 && name !== 'queueAlert') lessThanStr = ` with a short timer less than <span class='pcm-alarmsMinutes pcm-tooltipData pcm-tooltipHelper' data-original-title='Change the less than minute(s).'>${lessThan}</span> minute(s)`;
    else if (name === 'queueAlert') lessThanStr = ` <span class='pcm-alarmsMinutes pcm-tooltipData pcm-tooltipHelper' data-original-title='Change the less than minute(s).'>${lessThan}</span> minute(s)`;
    return $(`<div class='${name}'></div>`).data('snd',name).append(this.btnStr('Play','pcm-playMe',_, 'Play the sound now!')).append(this.btnStr('Mute','pcm-muteMe', statusM, 'Mute this sound.')).append(this.btnStr('TTS','pcm-ttsMe', colorT, 'Use Text to Speech instead.')).append(this.btnStr('Change','pcm-newSnd',_, 'Change the alarm to your own sound file.')).append(`<span class='pcm-alarmDesc'>${desc}</span>${payStr}${lessThanStr}</div>`);
  }
  /** Add the save button when a user is changing the alarm sound.
   * @param  {string} name - The name of the alarm being changed.
  **/
  addSaveButton(name) {
    $('.pcm-fileStatus').html('').removeClass('pcm-optionLabelError').append(this.btnStr('Save Audio', 'pcm-saveAudio', '', 'Save this audio for this alarm.', 'xs'));
    $('.pcm-saveAudio').click( () => {
      $('.pcm-changeMe').find('.pcm-tooltipHelper').tooltip('dispose'); $('.pcm-changeMe').remove();
      if (this.myAudio) this.myAudio.load();
      MyAlarms.setAlarmAudio(name, this.myAudio); this.myAudio = null;
    });
  }
  /** Shows the alarms modal to change alarms and other options. **/
  showAlarmsModal() {
    if (!MyModal) MyModal = new ModalClass();
    const idName = MyModal.prepareModal(null, '900px', 'pcm-alarmsModal', 'modal-lg', 'Alarm Options', '', '', '');
    MyModal.showModal(_, () => {
      let df = document.createDocumentFragment(), modalBody = $(`#${idName} .${MyModal.classModalBody}`);
      $(`<div class='pcm-alarmEdit'>You can mute and change an individual alarm sound here. Click the change button and pick your own sound from your computer. It must be less than 6MB and less than 30 seconds. You can also load in the default alarm sounds if you need to. The TTS button will have the script use a text to speech computerized voice instead of the alarm sound.</div>`).appendTo(df);
      this.addDivAlarms('triggeredAlarm').appendTo(df);
      $(`<div class='pcm-textToSpeechSelect'>Text to Speech voice: </div>`).append($(`<select id='voiceSelect' class='pcm-tooltipData pcm-tooltipHelper' data-original-title='Select the voice to use for Text to Speech.'></select>`).append(MyAlarms.voicesOption())).appendTo(df);
      $(`<div class='pcm-alarms'></div>`).append(df).appendTo(modalBody);
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      $('#voiceSelect').change( () => {
        let index = $('#voiceSelect option:selected').data('index'), name = $('#voiceSelect option:selected').data('name');
        MyAlarms.theVoiceIndex(index, name);
      });
      modalBody.find('.pcm-playMe').click( e => {
        let wasPlaying = $(e.target).hasClass('pcm-playing');
        $(`#${idName} .${MyModal.classModalBody}`).find('.pcm-playMe').removeClass('pcm-playing').blur();
        MyAlarms.stopSound(); if (this.myAudio) this.myAudio.load();
        if (!wasPlaying) {
          $(e.target).addClass('pcm-playing');
          MyAlarms.playSound($(e.target).closest('div').data('snd'), true,_, () => {
            if (MyModal) $(`#${idName} .${MyModal.classModalBody}`).find('.pcm-playMe').removeClass('pcm-playing').blur();
          });
        }
      });
      modalBody.find('.pcm-muteMe').click( e => {
        let btn = $(e.target), mute = MyAlarms.muteToggle(btn.closest('div').data('snd'));
        if (mute) btn.addClass('btn-mutted'); else btn.removeClass('btn-mutted');
        btn.blur(); btn = null;
      });
      modalBody.find('.pcm-ttsMe').click( e => {
        let btn = $(e.target), tts = MyAlarms.ttsToggle(btn.closest('div').data('snd'));
        if (tts) btn.addClass('btn-doTTS'); else btn.removeClass('btn-doTTS');
        btn.blur(); btn = null
      });
      modalBody.find('.pcm-newSnd').click( e => {
        $(`#${idName} .${MyModal.classModalBody}`).find('.pcm-playMe').removeClass('pcm-playing').blur();
        MyAlarms.stopSound(); if (this.myAudio) this.myAudio.load();
        let prevSnd = $('.pcm-changeMe').data('snd'), soundName = $(e.target).closest('div').data('snd');
        $('.pcm-changeMe').find('.pcm-tooltipHelper').tooltip('dispose'); $('.pcm-changeMe').remove();
        if (prevSnd !== soundName) {
          $(e.target).closest('div').after($(`<div class='pcm-changeMe'>Change sound to: </div>`).data('snd',soundName).append(`<span class='col-xs-12 pcm-fileInput'></span>`).append(createFileInput(_,'audio/*', 'Browse for an audio file on your computer to replace the alarm with.')).append($(`<span class='pcm-fileStatus'></span>`).append(this.btnStr('Default Audio', 'pcm-defaultAudio pcm-tooltipData pcm-tooltipHelper', '', 'Change alarm back to the default alarm sound.', 'xs'))));
          $('.custom-file-input').on('change', e => {
            let fileName = $(e.target).val().replace('C:\\fakepath\\', ''), theFile = $(e.target).prop('files')[0];
            if (theFile) {
              let error = '', size = theFile.size/1024/1024;
              if (this.myAudio) this.myAudio.load(); this.myAudio = null;
              if (!theFile.type.includes('audio')) error = 'Only audio files may be used for alarms.';
              if (size <= 0 || size >= 6) error = 'Size must be less than 6MB.';
              if (error === '') {
                $(e.target).next('.custom-file-label').addClass('selected').html(fileName);
                this.reader.onload = () => this.readData(soundName, theFile.type);
                this.reader.readAsBinaryString(theFile);
                this.reader.onerror = () => { $('.pcm-fileStatus').html('can not read the file').addClass('pcm-optionLabelError'); }
              } else $('.pcm-fileStatus').html(error).addClass('pcm-optionLabelError');
            }
          });
          $('.pcm-defaultAudio').click( () => {
            let data = MyAlarms.getData(soundName);
            this.myAudio = new Audio(); this.myAudio.src = chrome.runtime.getURL(`${MyAlarms.getFolder()}/${data.filename}`); this.addSaveButton(soundName);
          });
          if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
        }
      });
      modalBody.find('.pcm-alarmsPay').click( e => {
        let soundName = $(e.target).closest('div').data('snd');
        MyModal.showDialogModal('700px', 'Change New Less Than Pay Rate.', 'Enter the pay rate this alarm will sound when the pay rate is less than this:', () => {
          let newValue = $('#pcm-formQuestion').val();
          if (!isNaN(newValue)) {
            newValue = Number(newValue).toFixed(2);
            if (newValue < 20) {
              MyAlarms.setPayRate(soundName, newValue); $(e.target).html('$' + newValue); MyModal.closeModal();
            } else $('.pcm-inputDiv-question:first .inputError').html('Must be a decimal less than 20!');
          } else $('.pcm-inputDiv-question:first .inputError').html('Must be a number!');
        }, true, true, 'Pay rate: ', $(e.target).text().replace('$',''), 10,_, () => {}, 'Change', 'Default Value' ,() => {
          $(e.target).html('$' + MyAlarms.setPayDef(soundName));
        });
      });
      modalBody.find('.pcm-alarmsMinutes').click( e => {
        let soundName = $(e.target).closest('div').data('snd');
        MyModal.showDialogModal('700px', 'Change New Less Than Minutes.', 'Enter the minutes that this alarm will sound if the duration is less than this:', () => {
          let newValue = $('#pcm-formQuestion').val();
          if (!isNaN(newValue)) {
            MyAlarms.setLessThan(soundName, newValue); $(e.target).html(newValue); MyModal.closeModal();
          } else $('.pcm-inputDiv-question:first .inputError').html('Must be a number!');
        }, true, true, 'Minutes: ', $(e.target).text(), 10,_, () => {}, 'Change', 'Default Value' ,() => {
          $(e.target).html(MyAlarms.setLessThanDef(soundName));
        });
      });
      modalBody = null; df = null;
    }, () => { MyAlarms.stopSound(); if (this.myAudio) this.myAudio.load(); this.myAudio = null; MyModal = null; });
  }
  /** Reads a file, sets up the audio and plays the audio to user.
   * @param  {string} name - Alarm name.  @param  {string} type - Audio type.
  **/
  readData(name, type) {
    let readerContents = this.reader.result, base64Audio = btoa(readerContents);
    this.myAudio = new Audio(`data:${type};base64,` + base64Audio);
    this.myAudio.play(); this.addSaveButton(name);
  }
}