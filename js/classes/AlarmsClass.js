/** Class dealing with the playing of the different alarms and saving it in the database.
 * @class AlarmsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class AlarmsClass {
  constructor() {
    this.alarmFolder = "alarms";
    this.modal = null;
    this.volume = 50;
    this.synth = null;
    this.voices = [];
    this.voiceIndex = 0;
    this.dataDefault = {
      'less2':{'filename':"sword-hit-01.mp3", 'name':'less2', 'obj':null, 'desc':"Hits Paying less than", 'pay':"0.02", 'lessThan':-1, 'mute':false, 'tts':false},
      'less2Short':{'filename':"less2Short.mp3", 'name':'less2Short', 'obj':null, 'desc':"Hits Paying less than", 'pay':"0.02", 'lessThan':2, 'mute':false, 'tts':false},
      'less5':{'filename':"lessthan5.mp3", 'name':'less5', 'obj':null, 'desc':"Hits Paying less than", 'pay':"0.05", 'lessThan':-1, 'mute':false, 'tts':false},
      'less5Short':{'filename':"lessthan5short.mp3", 'name':'less5Short', 'obj':null, 'desc':"Hits Paying less than", 'pay':"0.05", 'lessThan':5, 'mute':false, 'tts':false},
      'less15':{'filename':"lessthan15.mp3", 'name':'less15', 'obj':null, 'desc':"Hits Paying less than", 'pay':"0.15", 'lessThan':-1, 'mute':false, 'tts':false},
      'less15Short':{'filename':"lessthan15Short.mp3", 'name':'less15Short', 'obj':null, 'desc':"Hits Paying less than", 'pay':"0.15", 'lessThan':8, 'mute':false, 'tts':false},
      'more15':{'filename':"higher-alarm.mp3", 'name':'more15', 'obj':null, 'desc':"Hits paying MORE than", 'pay':"0.15", 'lessThan':-1, 'mute':false, 'tts':false},
      'queueFull':{'filename':"Your queue is full - Paul.mp3", 'name':'queueFull', 'obj':null, 'desc':"You have a full queue! Pausing!", 'pay':"", 'lessThan':-1, 'mute':false, 'tts':false},
      'queueAlert':{'filename':"Ship_Brass_Bell.mp3", 'name':'queueAlert', 'obj':null, 'desc':"Lowest timed hit in queue is less than", 'pay':"", 'lessThan':4, 'mute':false, 'tts':false},
      'loggedOut':{'filename':"CrowCawSynthetic.wav", 'name':'loggedOut', 'obj':null, 'desc':"You are logged out.", 'pay':"", 'lessThan':-1, 'mute':false, 'tts':false},
      'captchaAlarm':{'filename':"CrowCawSynthetic2.wav", 'name':'captchaAlarm', 'obj':null, 'desc':"Found a captcha.", 'pay':"", 'lessThan':-1, 'mute':false, 'tts':false}
    };
    this.data = {};
    this.myAudio = null;
  }
  /** Uses the Text to speach sythesis to speak a text provided. Will cancel any text speaking first.
   * @param  {string} thisText       - The text which needs to be spoken.
   * @param  {string} [endFunc=null] - The function to run when the text spoken ends. */
  async speakThisNow(thisText, endFunc=null) {
    if (this.synth) {
        this.synth.cancel();
        let speech = new window.SpeechSynthesisUtterance(thisText);
        speech.voice = this.voices[this.voiceIndex];
        speech.onend = () => { if (endFunc) endFunc(); }
        this.synth.speak(speech);
    }
  }
  /** Changes the voice index value to select the voice to use for text to speech.
   * @param  {number} index - The index value  to change value to. */
  theVoiceIndex(index) { this.voiceIndex = index; }
  /** Changes the name of the voice being used for text to speech and then saves it to database.
   * @param  {string} name - The name to use for the voice. */
  theVoiceName(name) { globalOpt.alarms.ttsName = name; globalOpt.update(false); }
  /** Prepare the alarms by getting the src of the alarm url and save to database if using default values.
   * @async                - To wait for the alarm data to completely load into memory.
   * @param  {object} data - The alarms data object that has all the alarms.
   * @param  {bool} fromDB - Did these alarms come from the database or default values?
   * @return {object}      - Error object to return if error happened. */
  async prepareAlarms(data, fromDB) {
    let err = null; this.myAudio = null;  
    for (const value of data) {
      delete value.audio;
      if (!fromDB) { // Use default values and save to database.
        await bgPanda.db.addToDB(bgPanda.alarmsStore, value).then(id => value.id = id, rejected => err = rejected);
      }
      if (!value.obj) { // If no audio obj then set up src with default filename.
        value.audio = new Audio();
        value.audio.src = chrome.runtime.getURL(`${this.alarmFolder}/${value.filename}`);
      } else {
        value.audio = new Audio(value.obj); value.obj = null;
      }
      this.data[value.name] = value;
    }
    return err;
  }
  /** Loads up the alarms from the database or saves default values if no alarms are in the database.
   * Saves any errors from trying to add to database and then sends a reject.
   * @async                       - To wait for the alarm data to be loaded from database.
   * @param  {function} afterFunc - Function to call after done to send success error. */
  async prepare(afterFunc) {
    let success = [], err = null;
    this.synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
    this.synth.addEventListener('voiceschanged', () => {
      if (this.voices.length == 0) {
        this.voices = this.synth.getVoices(); let i = 0, name = globalOpt.alarms.ttsName;
        if (name !== '') { for (const voice of this.voices) { if (voice.name === name) this.voiceIndex = i; i++; }}
      }
    });
    bgPanda.db.getFromDB(bgPanda.alarmsStore).then( async (result) => {
      let valuesLen = result.length;
      if (valuesLen === 0 && !this.useDefault) await bgPanda.db.deleteFromDB(bgPanda.alarmsStore, null);
      if (valuesLen !== 0 && result[0].mute === undefined) await bgPanda.db.deleteFromDB(bgPanda.alarmsStore, null);
      if (valuesLen !== 0 && result[0].mute !== undefined) err = await this.prepareAlarms(result, true);
      else err = await this.prepareAlarms(Object.values(this.dataDefault), false);
      if (!err) success[0] = "All alarms have been loaded up.";
      afterFunc(success, err); // Sends any error back to the after function for processing.
    }, (rejected) => { err = rejected; afterFunc(success, err); } );
  }
  /** Saves the alarms to the database. Will save the audio src if not using default sound.
   * @param  {string} alarmSound - The name of the alarm to sound from the alarms object. */
  saveAlarm(alarmSound) {
    let saveThis = Object.assign({}, this.data[alarmSound]);
    if (saveThis.audio.src.substr(0,4) === 'data') saveThis.obj = saveThis.audio.src;
    delete saveThis.audio;
		bgPanda.db.updateDB(bgPanda.alarmsStore, saveThis).then( () => {},
			rejected => { pandaUI.haltScript(rejected, 'Failed updating data to database for an alarm so had to end script.', 'Error adding alarm data. Error:'); }
		);
  }
  /** sets up a select option with all the voices available in english and selects any previous voice selected. */
  voicesOption() {
    let options = $(document.createDocumentFragment()), i=0;
    for (const voice of this.voices) {
      if (voice.lang.includes('en-')) {
        let text = voice.name.replace('English (United States)','') + ' (' + voice.lang + ')';
        let option = $(`<option>${text}</option>`);
        option.data('name', voice.name); option.data('index', i);
        if (i === this.voiceIndex) option.prop('selected', true);
        option.appendTo(options);
      }
      i++;
    }
    return options;
  }
  /** Play the sound with the name provided or text to speech if not muted. Also changes the volume.
   * @param  {string} alarmSound     - The name of the alarm to sound from the alarms object.
   * @param  {bool} [testing=false]  - Sound the alarm even if it is muted.
   * @param  {string} [speakThis=''] - The text to use for text to speech or just use description in data object.
   * @param  {string} [endFunc=null] - The function to run when the sound or text spoken ends. */
  playSound(alarmSound, testing=false, speakThis='', endFunc=null) {
    if (!this.data[alarmSound].mute || testing) {
      if (this.data[alarmSound].tts) {
        speakThis = (speakThis !== '') ? speakThis : this.data[alarmSound].desc;
        this.speakThisNow(speakThis, endFunc);
      } else {
        const isPlaying = this.myAudio && this.myAudio.currentTime > 0 && !this.myAudio.paused && !this.myAudio.ended && this.myAudio.readyState > 2;
        if (isPlaying) { this.myAudio.load(); this.myAudio = null; }
        this.myAudio = this.data[alarmSound].audio; this.myAudio.currentTime = 0; this.myAudio.volume = this.volume/100;
        this.myAudio.play(); if (endFunc) this.myAudio.onended = () => { endFunc(); }
      }
    }
  }
  /** Stop any sound currently playing from the myAudio variable. */
  stopSound() { if (this.myAudio) this.myAudio.load(); }
  /** Toggles the mute value for this alarm.
   * @param  {string} alarmSound - The name of the alarm to toggle the mute value.
   * @return {bool}              - Returns the value of mute after toggling it. */
  muteToggle(alarmSound) {
    this.data[alarmSound].mute = !this.data[alarmSound].mute;
    this.saveAlarm(alarmSound); return this.data[alarmSound].mute;
  }
  /** Toggles the TTS value for this alarm.
   * @param  {string} alarmSound - The name of the alarm to toggle the TTS value.
   * @return {bool}              - Returns the value of TTS after toggling it. */
  ttsToggle(alarmSound) {
    this.data[alarmSound].tts = !this.data[alarmSound].tts;
    this.saveAlarm(alarmSound); return this.data[alarmSound].tts;
  }
  /** Returns the value of mute for this alarm.
   * @param  {string} alarmSound - The name of the alarm to return the mute value for.
   * @return {bool}              - Returns the value of mute for this alarm. */
  getMute(alarmSound) { return this.data[alarmSound].mute; }
  /** Returns the value of TTS for this alarm.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @return {bool}              - Returns the value of tts for this alarm. */
  getTTS(alarmSound) { return this.data[alarmSound].tts; }
  /** Returns the value of the data for this alarm
   * @param  {string} alarmSound - The name of the alarm to return the full data.
   * @return {bool}              - Returns the object value of the alarm. */
  getData(alarmSound) { return this.data[alarmSound]; }
  /** This plays the queue alert alarm. */
  doQueueAlarm(minutes) { minutes++; this.playSound('queueAlert',_, `A hit in your queue has less than ${minutes} minute${(minutes > 1) ? 's' : ''} left before it expires.`); }
  /** This plays the captcha alert alarm. */
  doCaptchaAlarm() { this.playSound('captchaAlarm'); }
  /** This plays the queue full alarm. */
  doFullAlarm() { this.playSound('queueFull'); }
	/** Method to decide which alarm to play according to the hit minutes and price.
	 * @param  {object} thisHit - The hit information to use to decide on alarm to sound. */
	doAlarms(hitData) {
    let minutes = Math.floor(hitData.assignedTime / 60), speakThis = '';
    if (this.synth) {
      let dollars = Math.floor(hitData.price), cents =  hitData.price - dollars;
      let dollarStr = (dollars > 0) ? ((dollars === 1) ? '1 dollar' : `${dollars} dollars`) : '';
      let centsStr = (cents > 0) ? ((cents === 0.01) ? '1 cent' : `${cents} cents`) : '';
      speakThis = `Accepted hit from ${hitData.reqName}. Duration ${minutes} minutes. Paying ${dollarStr} ${centsStr}.`;
    }
    if ( hitData.price < parseFloat(this.data.less2.pay) ) {
			if (minutes <= this.data.less2.lessThan) this.playSound("less2Short",_, speakThis); else this.playSound("less2",_, speakThis);
		} else if ( hitData.price <= parseFloat(this.data.less5.pay) ) {
			if (minutes <= this.data.less5.lessThan) this.playSound("less5Short",_, speakThis); else this.playSound("less5",_, speakThis);
		} else if ( hitData.price <= parseFloat(this.data.less15.pay) ) {
			if (minutes <= this.data.less15.lessThan) this.playSound("less15Short",_, speakThis); else this.playSound("less15",_, speakThis);
		} else if ( hitData.price < parseFloat(this.data.more15.pay) ) { this.playSound("more15",_, speakThis); }
  }
  /** Shows the alarms modal to change alarms and other options. */
  showAlarmsModal() {
    this.modal = new ModalAlarmClass();
    this.modal.showAlarmsModal( () => { this.modal = null; } );
  }
  /** Sets the volume used for the alarms and plays the first alarm for a test.
   * @param  {number} volume - The number to use for the volume for alarms from 0 to 100. */
  setVolume(volume) { this.volume = volume; globalOpt.theVolume(volume); this.playSound('less2', true); }
  /** Sets the volume used for the alarms and plays the first alarm for a test.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @param  {number} newPay     - The new value for the pay rate in decimal format. */
  setPayRate(alarmSound, newPay) { this.data[alarmSound].pay = newPay; this.saveAlarm(alarmSound); }
  /** Sets the pay rate to the default value and then returns it.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @return {bool}              - The default value for pay rate gets returned. */
  setPayDef(alarmSound) {
    this.data[alarmSound].pay = this.dataDefault[alarmSound].pay;
    this.saveAlarm(alarmSound); return this.data[alarmSound].pay;
  }
  /** Sets the less than value to the default value and then returns it.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @return {number}            - Returns the default value for the less than value. */
  setLessThanDef(alarmSound) {
    this.data[alarmSound].lessThan = this.dataDefault[alarmSound].lessThan;
    this.saveAlarm(alarmSound); return this.data[alarmSound].lessThan;
  }
  /** Sets the less than value to the value provided.
   * @param  {string} alarmSound - The name of the alarm to return the TTS value for.
   * @param  {number} newLess    - The new less than value to be set. */
  setLessThan(alarmSound, newLess) { this.data[alarmSound].lessThan = newLess; this.saveAlarm(alarmSound); }
}
