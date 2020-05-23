/**
 */
class AlarmsClass {
  constructor() {
    this.alarmFolder = "alarms";
    this.data = {
      less2:{filename:"sword-hit-01.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.02", lessThan:99},
      less2Short:{filename:"less2Short.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.02", lessThan:2},
      less5:{filename:"lessthan5.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.05", lessThan:99},
      less5Short:{filename:"lessthan5short.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.05", lessThan:5},
      less15:{filename:"lessthan15.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.15", lessThan:99},
      less15Short:{filename:"lessthan15Short.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.15", lessThan:8},
      more15:{filename:"higher-alarm.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"0.15", lessThan:99},
      queueFull:{filename:"Your queue is full - Paul.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"", lessThan:99},
      queueAlert:{filename:"Ship_Brass_Bell.mp3", obj:new Audio(), desc:"Hits Paying less than", pay:"", lessThan:4},
      loggedOut:{filename:"CrowCawSynthetic.wav", obj:new Audio(), desc:"Hits Paying less than", pay:"", lessThan:99}
    };
    this.myAudio = null;
  }
  /**
   * @param  {object} data
   * @param  {bool} fromDB
   */
  async prepareAlarms(data, fromDB) {
    // Sets the Audio src value if not defined or saves default alarm to database.
    let saveValue = {}, goodSave = true, err = null;
    await Object.entries(data).forEach( async ([key, value]) => {
      if (!fromDB) {
        // Need to make a clone of value because audio obj has methods which can not be saved.
        saveValue = JSON.parse(JSON.stringify(value)); saveValue.name=key;
        await bgPanda.db.addToDB(bgPanda.alarmsStore, saveValue)
        .then( null, rejected => err = rejected );
      }
      if (Object.keys(value.obj).length===0) // If no audio obj then set up src with default filename
        value.obj.src = chrome.runtime.getURL(`${this.alarmFolder}/${value.filename}`);
    });
    return err;
  }
  /**
   * Loads up the alarms from the database or saves default values if no alarms are in the database.
   * Saves any errors from trying to add to database and then sends a reject.
   * Sends success array with messages and error object from any rejects to afterFunc.
   * @param  {function} afterFunc   Function to call after done to send success array or error object.
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
    afterFunc.call(this, success, err); // Sends any errors back to the after function for processing.
  }
  /**
   * @param  {string} alarmSound
   */
  playSound(alarmSound) {
    const isPlaying = this.myAudio && this.myAudio.currentTime > 0 && !this.myAudio.paused && !this.myAudio.ended && this.myAudio.readyState > 2;
    if (isPlaying) {
      this.myAudio.load();
      this.myAudio = null;
    }
    this.myAudio = this.data[alarmSound].obj;
    this.myAudio.currentTime = 0;
    this.myAudio.play();
  }
  /**
   */
  doQueueAlarm() { this.playSound("queueAlert"); }
	/**
	 * @param  {object} thisHit
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
