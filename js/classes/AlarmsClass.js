class AlarmsClass {
  constructor() {
    this.alarmFolder = "alarms";
    this.myAlarms = {
      lessThan2:{filename:"sword-hit-01.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.02", lessMinutes:99},
      lessThan2Short:{filename:"less2Short.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.02", lessMinutes:2},
      lessThan5:{filename:"lessthan5.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.05", lessMinutes:99},
      lessThan5Short:{filename:"lessthan5short.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.05", lessMinutes:5},
      lessThan15:{filename:"lessthan15.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.15", lessMinutes:99},
      lessThan15Short:{filename:"lessthan15Short.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.15", lessMinutes:8},
      moreThan15:{filename:"higher-alarm.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"0.15", lessMinutes:99},
      queueFull:{filename:"Your queue is full - Paul.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"", lessMinutes:99},
      queueAlert:{filename:"Ship_Brass_Bell.mp3", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"", lessMinutes:4},
      loggedOut:{filename:"CrowCawSynthetic.wav", audioObj: new Audio(), desc:"Hits Paying less than", payRate:"", lessMinutes:99}
    };
    this.myAudio = null;
    Object.entries(this.myAlarms).forEach( ([key, value]) => { value.audioObj.src = chrome.extension.getURL(`${this.alarmFolder}/${value.filename}`); });
  }
  playSound(alarmSound) {
    const isPlaying = this.myAudio && this.myAudio.currentTime > 0 && !this.myAudio.paused && !this.myAudio.ended && this.myAudio.readyState > 2;
    if (isPlaying) {
      this.myAudio.load();
      this.myAudio = null;
    }
    this.myAudio = this.myAlarms[alarmSound].audioObj;
    this.myAudio.currentTime = 0;
    if (!isPlaying) this.myAudio.play();
  }
}
