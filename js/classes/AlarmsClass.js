/**
 * Class dealing with the playing of the different alarms and saving it in the database.
 * @class AlarmsClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class AlarmsClass {
  constructor() {
    this.alarmFolder = "alarms";
    this.data = {
      less2:{filename:"sword-hit-01.mp3", obj:null, desc:"Hits Paying less than", pay:"0.02", lessThan:99},
      less2Short:{filename:"less2Short.mp3", obj:null, desc:"Hits Paying less than", pay:"0.02", lessThan:2},
      less5:{filename:"lessthan5.mp3", obj:null, desc:"Hits Paying less than", pay:"0.05", lessThan:99},
      less5Short:{filename:"lessthan5short.mp3", obj:null, desc:"Hits Paying less than", pay:"0.05", lessThan:5},
      less15:{filename:"lessthan15.mp3", obj:null, desc:"Hits Paying less than", pay:"0.15", lessThan:99},
      less15Short:{filename:"lessthan15Short.mp3", obj:null, desc:"Hits Paying less than", pay:"0.15", lessThan:8},
      more15:{filename:"higher-alarm.mp3", obj:null, desc:"Hits Paying less than", pay:"0.15", lessThan:99},
      queueFull:{filename:"Your queue is full - Paul.mp3", obj:null, desc:"Hits Paying less than", pay:"", lessThan:99},
      queueAlert:{filename:"Ship_Brass_Bell.mp3", obj:null, desc:"Hits Paying less than", pay:"", lessThan:4},
      loggedOut:{filename:"CrowCawSynthetic.wav", obj:null, desc:"Hits Paying less than", pay:"", lessThan:99}
    };
    this.myAudio = null;
  }
  /**
   * Prepare the alarms by getting the src of the alarm url and save to database if using default values.
   * @async
   * @param  {object} data - The alarms data object that has all the alarms.
   * @param  {bool} fromDB - Did these alarms come from the database or default values?
   * @return {object}      - Error object to return if error happened.
   */
  async prepareAlarms(data, fromDB) {
    let err = null;
    await Object.entries(data).forEach( async ([key, value]) => {
      if (!fromDB) { // Use default values and save to database.
        // Need to make a clone of value because audio obj has methods which can not be saved.
        await bgPanda.db.addToDB(bgPanda.alarmsStore, value)
        .then( null, rejected => err = rejected );
      }
      if (!value.obj) // If no audio obj then set up src with default filename
        value.audio = new Audio();
        value.audio.src = chrome.runtime.getURL(`${this.alarmFolder}/${value.filename}`);
    });
    return err;
  }
  /**
   * This is called after the alarm data are prepared and ready.
   * @callback afterACallBack
   * @param {array} success  - Array of successful messages.
   * @param {object} err     - An error object if promise was rejected.
   */
  /**
   * Loads up the alarms from the database or saves default values if no alarms are in the database.
   * Saves any errors from trying to add to database and then sends a reject.
   * @async
   * @param  {afterACallBack} afterFunc - Function to call after done to send success error.
   */
  async prepare(afterFunc) {
    let success = [], err = null;
    await bgPanda.db.getFromDB(bgPanda.alarmsStore, null, true, async (cursor) => { 
        const key = cursor.value.name; delete cursor.value.name; // Don't need name in cursor return.
        return {[key]:cursor.value}; // Return object.
      }, false)
    .then( async (result) => {
      if (Object.keys(result).length !== 0) { // If alarms are already in database then load them up.
        err = await this.prepareAlarms(result, true);
      } else err = await this.prepareAlarms(this.data, false);
      if (!err) success[0] = "All alarms have been loaded up.";
    }, (rejected) => err = rejected );
    afterFunc(success, err); // Sends any errors back to the after function for processing.
  }
  /**
   * Play the sound with the name provided.
   * @param  {string} alarmSound - The name of the alarm to sound from the alarms object.
   */
  playSound(alarmSound) {
    const isPlaying = this.myAudio && this.myAudio.currentTime > 0 && !this.myAudio.paused && !this.myAudio.ended && this.myAudio.readyState > 2;
    if (isPlaying) {
      this.myAudio.load();
      this.myAudio = null;
    }
    this.myAudio = this.data[alarmSound].audio; this.myAudio.currentTime = 0;
    this.myAudio.play();
  }
  /**
   * This plays the queue alert alarm.
   */
  doQueueAlarm() { this.playSound("queueAlert"); }
	/**
   * Method to decide which alarm to play according to the hit minutes and price.
	 * @param  {object} thisHit - The hit information to use to decide on alarm to sound.
	 */
	doAlarms(thisHit) {
		const minutes = Math.floor(thisHit.assignedTime / 60);
		if ( thisHit.price < parseFloat(this.data.less2.pay) ) {
			if (minutes <= this.data.less2.lessThan) this.playSound("less2Short"); else this.playSound("less2");
		} else if ( thisHit.price <= parseFloat(this.data.less5.pay) ) {
			if (minutes <= this.data.less5.lessThan) this.playSound("less5Short"); else this.playSound("less5");
		} else if ( thisHit.price <= parseFloat(this.data.less15.pay) ) {
			if (minutes <= this.data.less15.lessThan) this.playSound("less15Short"); else this.playSound("less15");
		} else if ( thisHit.price < parseFloat(this.data.more15.pay) ) { this.playSound("more15"); }
	}
}
