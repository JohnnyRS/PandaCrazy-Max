/** Class dealing with the playing of the different alarms from search page using BroadcastChannel.
 * @class SearchAlarmsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class SearchAlarmsClass {
  constructor(pcm_channel) {
    this.pcm_channel = pcm_channel;
    this.alarmFolder = 'alarms';
    this.modal = null;
    this.volume = 50;
    this.synth = null;
    this.voices = [];
    this.voiceIndex = 0;
    this.searchAlarms = ['triggeredAlarm'];
    this.data = {};
    this.myAudio = null;

    pcm_channel.postMessage({'msg':'search: prepare alarms'});
  }
  /** Adds the supplied source for audio to the alarm object with key name or from default source object.
   * @param {string} alarmKey - Alarm Key Property  @param {object} src - Source of the Audio
  **/
  setTheAudio(alarmKey, src=null) {
    let alarm = this.data[alarmKey];
    if (src === null) src = (!alarm.obj) ? alarm.audio.src : alarm.obj;
    alarm.audio = new Audio(src); alarm.obj = src;
    alarm = null;
  }
  /** Removes any data that should be removed when closing down. */
  removeAll() { this.modal = null; this.voices = []; this.data = {}; this.myAudio = null; }
  /** Uses the Text to speech synthesis to speak a text provided. Will cancel any text speaking first.
   * @param  {string} thisText - The text  @param  {string} [endFunc] - The function to run when the text spoken ends.
  **/
  async speakThisNow(thisText, endFunc=null) {
    if (this.synth) {
      this.synth.cancel();
      let speech = new window.SpeechSynthesisUtterance(thisText);
      speech.voice = this.voices[this.voiceIndex]; speech.onend = () => { speech = null; if (endFunc) endFunc(); };
      this.synth.speak(speech);
    }
  }
  /** Changes the voice index value to select the voice to use for text to speech. Also changes the name of the voice being used.
   * @param  {number} index - The index value to change value to.  @param  {string} name - The name for the voice name to change to.
  **/
  theVoiceIndex(index, name) { this.voiceIndex = index; this.theVoiceName(name); }
  /** Changes the name of the voice being used for text to speech and then saves it to database.
   * @param  {string} name - The name to use for the voice.
  **/
  theVoiceName(name) { MyOptions.alarms.ttsName = name; MyOptions.update(false); }
  /** Sets up the voices to use when using text to speech from options or default value. */
  setUpVoices() {
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices(); let i = 0, name = MyOptions.alarms.ttsName;
      if (name !== '') { for (const voice of this.voices) { if (voice.name === name) this.voiceIndex = i; i++; }}
    }
  }
  /** Loads up the alarms from the database or saves default values if no alarms are in the database.
   * @async               - To wait for the alarm data to be loaded from database.
   * @param  {object} obj - Object which has all the alarms data for the search page to use.
  **/
  async prepare(obj) {
    this.data = obj.data;
    this.setTheAudio('triggeredAlarm', null); this.volume = obj.volume;
    this.synth = ('speechSynthesis' in window) ? window.speechSynthesis : null; this.setUpVoices();
    this.synth.addEventListener('voiceschanged', () => this.setUpVoices());
  }
  /** Saves the alarms to the database. Will save the audio src if not using default sound.
   * @param  {string} alarmSound - The name of the alarm to sound from the alarms object.
  **/
  saveAlarm(alarmSound) {
    let saveThis = Object.assign({}, this.data[alarmSound]);
    if (this.data[alarmSound].audio.src.substr(0,4) === 'data') saveThis.obj = this.data[alarmSound].audio.src;
    delete saveThis.audio;
    this.pcm_channel.postMessage({'msg':'search: save alarm', 'object':{'alarmSound':alarmSound, 'alarm':saveThis}});
  }
  /** sets up a select option with all the voices available in english and selects any previous voice selected.
   * @return {object} - Jquery object of the voice options.
  **/
  voicesOption() {
    let options = $(document.createDocumentFragment()), i=0;
    for (const voice of this.voices) {
      if (voice.lang.includes('en-')) {
        let text = voice.name.replace('English (United States)','') + ' (' + voice.lang + ')', option = $(`<option>${text}</option>`);
        option.data('name', voice.name); option.data('index', i);
        if (i === this.voiceIndex) option.prop('selected', true);
        option.appendTo(options);
      }
      i++;
    }
    return options;
  }
  /** Play the sound with the name provided or text to speech if not muted. Also changes the volume.
   * @param  {string} alarmSound - Alarm name  @param  {bool} [testing] - Test alarm  @param  {string} [speakThis] - TTS text  @param  {string} [endFunc] - End function
  **/
  playSound(alarmSound, testing=false, speakThis='', endFunc=null) {
    if (this.data[alarmSound]) {
      if (!this.data[alarmSound].mute || testing) {
        if (this.data[alarmSound].tts) {
          speakThis = (speakThis !== '') ? speakThis : this.data[alarmSound].desc;
          this.speakThisNow(speakThis, endFunc);
        } else {
          const isPlaying = this.myAudio && this.myAudio.currentTime > 0 && !this.myAudio.paused && !this.myAudio.ended && this.myAudio.readyState > 2;
          if (isPlaying) { this.myAudio.load(); this.myAudio = null; }
          this.myAudio = this.data[alarmSound].audio;
          if (this.myAudio) {
            this.myAudio.currentTime = 0; this.myAudio.volume = this.volume/100;
            this.myAudio.play(); if (endFunc) this.myAudio.onended = () => { endFunc(); }
          }
        }
      }
    } else if (speakThis !== '') this.speakThisNow(speakThis, endFunc);
    else console.info('Alarms not fully loaded yet.');
  }
  /** Stop any sound currently playing from the myAudio variable. */
  stopSound() { if (this.myAudio) this.myAudio.load(); }
  /** Toggles the mute value for this alarm.
   * @param  {string} alarmSound - The name of the alarm to toggle the mute value.
   * @return {bool}              - Returns the value of mute after toggling it.
  **/
  muteToggle(alarmSound) { this.data[alarmSound].mute = !this.data[alarmSound].mute; this.saveAlarm(alarmSound); return this.data[alarmSound].mute; }
  /** Toggles the TTS value for this alarm.
   * @param  {string} alarmSound - The name of the alarm to toggle the TTS value.
   * @return {bool}              - Returns the value of TTS after toggling it.
  **/
  ttsToggle(alarmSound) { this.data[alarmSound].tts = !this.data[alarmSound].tts; this.saveAlarm(alarmSound); return this.data[alarmSound].tts; }
  /** Returns the value of the data for this alarm
   * @param  {string} alarmSound - The name of the alarm to return the full data.
   * @return {bool}              - Returns the object value of the alarm.
  **/
  getData(alarmSound) { return this.data[alarmSound]; }
  /** Sets the audio object for this alarm.
   * @param  {string} alarmSound  - The name of the alarm to set the audio data.  @param {object} theAudio - The audio object to change to.
  **/
  setAlarmAudio(alarmSound, theAudio) { this.data[alarmSound].audio = theAudio; this.saveAlarm(alarmSound); }
  /** This plays the logged out alarm. */
  doLoggedOutAlarm() { this.playSound('loggedOut',_, 'You are logged out.'); }
  /** Shows the alarms modal to change alarms and other options. */
  showAlarmsModal() { this.modal = new ModalAlarmClass(); this.modal.showAlarmsModal( () => { this.modal = null; } ); }
  /** Sets the volume used for the alarms and plays the first alarm for a test.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.  @param  {number} newPay - The new value for the pay rate in decimal format.
  **/
  setPayRate(alarmSound, newPay) { this.data[alarmSound].pay = newPay; this.saveAlarm(alarmSound); }
  /** Sets the pay rate to the default value and then returns it.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @return {bool}              - The default value for pay rate gets returned.
  **/
  setPayDef(alarmSound) { this.data[alarmSound].pay = this.dataDefault[alarmSound].pay; this.saveAlarm(alarmSound); return this.data[alarmSound].pay; }
  /** Sets the less than value to the default value and then returns it.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @return {number}            - Returns the default value for the less than value.
  **/
  setLessThanDef(alarmSound) { this.data[alarmSound].lessThan = this.dataDefault[alarmSound].lessThan; this.saveAlarm(alarmSound); return this.data[alarmSound].lessThan; }
  /** Sets the less than value to the value provided.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.  @param  {number} newLess - The new less than value to be set.
  **/
  setLessThan(alarmSound, newLess) { this.data[alarmSound].lessThan = newLess; this.saveAlarm(alarmSound); }
  /** Gets the folder for the alarms and returns it.
   * @return {string} - The folder name where the default alarms are stored.
  **/
  getFolder() { return this.alarmFolder; }
}

/*************************************************************************************************************/
/** A listener specific to using the AlarmsClass when BroadcastChannel is being used.
 * @param  {object} data - The data object that was passed in a message from the BroadcastChannel.
**/
function alarmsListener(data) {
  if (data && data.value && MyAlarms) {
    let value = data.value;
    if (data.msg === 'search: alarm data' && value) { MyAlarms.prepare(value); }
  }
};
