/** Class dealing with the playing of the different alarms and saving it in the database.
 * @class AlarmsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class AlarmsClass {
  constructor() {
    this.alarmFolder = "alarms";
    this.modal = null;
    this.volume = 100;
    this.synth = null;
    this.dataDefault = {
      less2:{filename:"sword-hit-01.mp3", obj:null, desc:"Hits Paying less than", pay:"0.02", lessThan:-1, mute:false, tts:false},
      less2Short:{filename:"less2Short.mp3", obj:null, desc:"Hits Paying less than", pay:"0.02", lessThan:2, mute:false, tts:false},
      less5:{filename:"lessthan5.mp3", obj:null, desc:"Hits Paying less than", pay:"0.05", lessThan:-1, mute:false, tts:false},
      less5Short:{filename:"lessthan5short.mp3", obj:null, desc:"Hits Paying less than", pay:"0.05", lessThan:5, mute:false, tts:false},
      less15:{filename:"lessthan15.mp3", obj:null, desc:"Hits Paying less than", pay:"0.15", lessThan:-1, mute:false, tts:false},
      less15Short:{filename:"lessthan15Short.mp3", obj:null, desc:"Hits Paying less than", pay:"0.15", lessThan:8, mute:false, tts:false},
      more15:{filename:"higher-alarm.mp3", obj:null, desc:"Hits paying MORE than", pay:"0.15", lessThan:-1, mute:false, tts:false},
      queueFull:{filename:"Your queue is full - Paul.mp3", obj:null, desc:"You have a full queue!", pay:"", lessThan:-1, mute:false, tts:false},
      queueAlert:{filename:"Ship_Brass_Bell.mp3", obj:null, desc:"Lowest timed hit in queue is less than", pay:"", lessThan:4, mute:false, tts:false},
      loggedOut:{filename:"CrowCawSynthetic.wav", obj:null, desc:"You are logged out.", pay:"", lessThan:-1, mute:false, tts:false},
      captchaAlarm:{filename:"CrowCawSynthetic.wav", obj:null, desc:"Found a captcha.", pay:"", lessThan:-1, mute:false, tts:false}
    };
    this.data = {};
    this.myAudio = null;
  }
  /** Uses the Text to speach sythesis to speak a text provided. Will cancel any text speaking first.
   * @param  {string} thisText - The text which needs to be spoken. */
  speakThisNow(thisText) {
    if (this.synth){
        this.synth.cancel();
        let speech = new window.SpeechSynthesisUtterance(thisText);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
    }
  }
  /** Prepare the alarms by getting the src of the alarm url and save to database if using default values.
   * @async                - To wait for the alarm data to completely load into memory.
   * @param  {object} data - The alarms data object that has all the alarms.
   * @param  {bool} fromDB - Did these alarms come from the database or default values?
   * @return {object}      - Error object to return if error happened. */
  async prepareAlarms(data, fromDB) {
    let err = null; this.myAudio = null;
    for (const key of Object.keys(data)) {
      let value = data[key]; delete value.audio;
      if (!fromDB) { // Use default values and save to database.
        await bgPanda.db.addToDB(bgPanda.alarmsStore, value).then(id => value.id = id, rejected => err = rejected);
      }
      if (!value.obj) { // If no audio obj then set up src with default filename.
        value.audio = new Audio();
        value.audio.src = chrome.runtime.getURL(`${this.alarmFolder}/${value.filename}`);
      } else {
        value.audio = new Audio(value.obj);
      }
      this.data[key] = value;
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
    await bgPanda.db.getFromDB(bgPanda.alarmsStore, null, true, async (cursor) => { 
        if (cursor.value.mute) { return {[cursor.value.filename]:cursor.value}; } else return {};
      }, false)
    .then( async (result) => {
      if (Object.keys(result).length === 0 && !this.useDefault) await bgPanda.db.deleteFromDB(bgPanda.alarmsStore, null);
      if (Object.keys(result).length !== 0) { // If alarms are already in database then load them up.
        err = await this.prepareAlarms(result, true);
      } else err = await this.prepareAlarms(this.dataDefault, false);
      if (!err) success[0] = "All alarms have been loaded up.";
    }, (rejected) => err = rejected );
    afterFunc(success, err); // Sends any errors back to the after function for processing.
  }
  saveAlarm(alarmSound) {
    let saveThis = Object.assign({}, this.data[alarmSound]); delete saveThis.audio;
		bgPanda.db.updateDB(bgPanda.alarmsStore, saveThis).then( () => {},
			rejected => { pandaUI.haltScript(rejected, 'Failed updating data to database for an alarm so had to end script.', 'Error adding alarm data. Error:'); }
		);
  }
  /** Play the sound with the name provided. Also changes the volume.
   * @param  {string} alarmSound     - The name of the alarm to sound from the alarms object.
   * @param  {bool} [testing=false]  - Sound the alarm even if it is muted.
   * @param  {string} [speakThis=''] - The text to use for text to speech or just use description in data object.  */
  playSound(alarmSound, testing=false, speakThis='') {
    if (!this.data[alarmSound].mute || testing) {
      if (this.data[alarmSound].tts) {
        speakThis = (speakThis !== '') ? speakThis : this.data[alarmSound].desc;
        this.speakThisNow(speakThis);
      } else {
        const isPlaying = this.myAudio && this.myAudio.currentTime > 0 && !this.myAudio.paused && !this.myAudio.ended && this.myAudio.readyState > 2;
        if (isPlaying) { this.myAudio.load(); this.myAudio = null; }
        this.myAudio = this.data[alarmSound].audio; this.myAudio.currentTime = 0; this.myAudio.volume = this.volume/100;
        this.myAudio.play(); console.log(this.data[alarmSound].audio);
      }
    }
  }
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
  doQueueAlarm() { this.playSound('queueAlert'); }
  /** This plays the captcha alert alarm. */
  doCaptchaAlarm() { this.playSound('captchaAlarm'); }
	/** Method to decide which alarm to play according to the hit minutes and price.
	 * @param  {object} thisHit - The hit information to use to decide on alarm to sound. */
	doAlarms(hitData) {
    let minutes = Math.floor(hitData.assignedTime / 60), speakThis = '';
    if (this.synth) {
      let dollars = Math.floor(hitData.price), cents =  hitData.price - dollars; console.log(cents, cents > 0, cents === 0.01);
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
    this.modal.showAlarmsModal(_, () => { this.modal = null; });
  }
  /** Sets the volume used for the alarms and plays the first alarm for a test.
   * @param  {number} volume - The number to use for the volume for alarms from 0 to 100. */
  setVolume(volume) { this.volume = volume; this.playSound('less2', true); }
}
