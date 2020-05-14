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
  prepareAlarms(data, fromDB, afterFunc) {
    let saveValue={};
    Object.entries(data).forEach( async ([key, value]) => {
      if (!fromDB) {
        // Because this is a forEach loop then I must make a copy of the value so database can work
        // asynchronous without having to pause the loop which is not needed.
        saveValue = JSON.parse(JSON.stringify(value)); saveValue.name=key; // Make copy of default value
        bgPanda.db.addToDB(bgPanda.alarmsStore, saveValue).then( () => {} ); // Save into Database
      }
      if (Object.keys(value.obj).length===0) // If no audio obj then set up src with default filename
        value.obj.src = chrome.extension.getURL(`${this.alarmFolder}/${value.filename}`);
    });
    afterFunc.apply(this);
  }
  prepare(afterFunc) {
    bgPanda.db.getFromDB(bgPanda.alarmsStore, "cursor", null, (cursor) => { 
        const key = cursor.value.name; delete cursor.value.name;
        return {[key]:cursor.value};
      }, false)
      .then( (result) => {
        if (Object.keys(result).length !== 0) {
          this.prepareAlarms(result, true, afterFunc);
        } else this.prepareAlarms(this.data, false, afterFunc);
      })
  }
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
  doQueueAlarm() { this.playSound("queueAlert"); }
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
