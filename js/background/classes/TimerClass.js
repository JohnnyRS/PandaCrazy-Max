class TimerClass {
		// set up lowest timer and ham values for the constructor plus name of timer and class object
	constructor(timer=900, hamTimeout=700, timerName="none") {
		this.timeout = timer;
		this.hamTimeout = hamTimeout;
		this.min = 600;
		this.timeoutID = null;
		this.timeoutDoing = null;
		this.queue = [];
		this.queueObject = {};
		this.queueJumping = [];
		this.queueSkipped = [];
		this.unique = 1;
		this._running = false;
		this._goingHam = null;
		this._paused = false;
		this.started = null; // time started
		this.port = null;
		this.myClass = null;
		this.timerName = timerName;
	}
	get running() { return this._running; } // is timer running
	set running(v) { this._running = v; this.sendToPort(); }
	get goingHam() { return this._goingHam; } // is timer going ham?
	set goingHam(v) { this._goingHam = v; this.sendToPort(); }
	get paused() { return this._paused; } // is timer paused?
	set paused(v) { this._paused = v; this.sendToPort(); }
	setMyClass(myClass) { this.myClass = myClass; }
	sendToPort() {
		let goingHamNow = this._goingHam;
		if (goingHamNow && this.queueObject[goingHamNow]===undefined) return
		this.myClass.timerInfo({running:this._running, goingHam:this._goingHam, paused:this._paused, myIdHam:(this._goingHam!==null) ? this.queueObject[this._goingHam].myId : -1});
		}
	setPort(port) { this.port = port; if (port) this.timerName = port.name; }
	setTimer(timer, adjust=false) { 
		if (timer>=this.min) { this.timeout = timer; if (adjust) this.adjustTimer(timer); return this.timer; }
		else { console.log("timer would be too low"); return null; }
	}
	setHamTimer(timer) { 
		if (timer>=this.min) { this.hamTimeout = timer; return this.timer; }
		else { console.log("hamtimer would be too low"); return null; }
	}
	returnTimer() { return this.timeout; }
	privateLoop() {
		this.timeoutDoing = this.timeoutID; this.timeoutID = null; // timeoutID gets moved to timeoutDoing
		// end is date that timer ended.
		const end = new Date().getTime(); let goodToGo = true, queueUnique = null, turnOffHam = false;
		// Which timer is being used. ham timer or regular timer.
		const usingTimer = (this.goingHam!==null && this.hamTimeout!==null) ? this.hamTimeout : this.timeout;
		const usingTimer2 = (this.goingHam!==null && this.hamTimeout!==null) ? "hamTimer" : "normalTimer";
		const elapsed = end - this.started; // get elapsed time from when timer started to end
		gDebugLog.logThis(3, "TimerClass", `[${this.timerName}] timerDone: ${usingTimer2} | timeElapsed: ${elapsed}`);
		if (usingTimer!==null && !this.paused && this.queue.length > 0) {
			// how accurate was the timer? find difference between real timer and actual time elapsed.
			const diff = ((elapsed - usingTimer) > 0) ? elapsed - usingTimer : 0;
			console.log(`usingTimer: ${usingTimer} | diff: ${diff}`);
			let newTimer = usingTimer - diff; // if actual time went over timer than subtract the difference for next timer
			if (this.goingHam!==null) { queueUnique = this.goingHam; } // if going ham then get item unique from ham
			else queueUnique = this.queue.shift(); // if not going ham then item unique is in the next queue position
			const thisItem = this.queueObject[queueUnique]; // let's get the details of this item
			if (thisItem) {
				const thisDuration = (thisItem.tDuration!==-1) ? thisItem.tDuration : (thisItem.duration!==-1) ? thisItem.duration : -1; // does this queue item have a duration or temp duration for it to stop?
				if (thisDuration!==-1) { // if item just started then initialize timestarted
					if ( thisDuration!==-1 && thisItem.timeStarted===null) thisItem.timeStarted = new Date().getTime();
					// if this item is over the duration time then remove it from queue by making goodToGo as false
					else if (thisDuration!==-1 && (end - thisItem.timeStarted) > thisDuration) goodToGo = false;
				}
				if (thisItem.tGoHam!==-1) { // is this just a temporary go ham job and item just started then init hamstarted
					if (thisItem.hamstarted===null) thisItem.hamstarted = new Date().getTime();
					// if this ham timer has gone over the temporary go hamer expired time then turn off ham
					else if ( (end - thisItem.hamstarted) > thisItem.tGoHam ) { turnOffHam=true; thisItem.tGoHam = -1; thisItem.hamstarted = null; }
				}
				if (goodToGo) { // is this item good to go back into queue? Run the function and update started time.
					thisItem.theFunction.apply(this, [queueUnique, elapsed, thisItem.myId, thisItem.obj]);
					this.started = new Date().getTime();
				}
				else if (!goodToGo) { // this item has expired so run the after function and delete it from queue
					thisItem.funcAfter.apply(this, [thisItem.myId, thisItem.obj, turnOffHam]);
					this.deleteFromQueue(queueUnique);
					if (this.goingHam===queueUnique) this.goingHam = null; // if this was going ham then turn ham off.
					newTimer = 0;	// Pass to next item in queue
				}
				// put this item back on the bottom of the queue if it's not going ham and good to go back on queue
				if (goodToGo && this.goingHam===null) this.queue.push(queueUnique);
				if (turnOffHam) this.hamOff(); // if turning off ham then make sure ham is really off.
				this.timeoutDoing = null;
				this.timeoutID = setTimeout(this.privateLoop.bind(this), Math.max(newTimer, 0)); // start new timer for next item.
			} else { gDebugLog.logError(0, "TimerClass", `Caught that little buggy: ${queueUnique} | ${this.queue} | ${this.goingHam}`); } // there was a bug where item data was undefined for some reason but happened only once.
		} else { this.running = false; } // queue isn't running right now.
	}
	goTimer() { // start timer if it's not running
		if (this.timeoutID === null && !this.running && this.timeout !== null && !this.paused && this.queue.length > 0) {
			this.running = true; this.started = new Date().getTime();
			this.timeoutID = setTimeout(this.privateLoop.bind(this), 0);
		}
	}
	removeFromQueue(queueUnique) { // remove queueUnique from the main queue
		if (this.queue.includes(queueUnique)) {
			this.queue = arrayRemove(this.queue, queueUnique);
			gDebugLog.logThis(3, "TimerClass", `queueUnique: ${queueUnique} is removed - ${this.queue}`);
		} else gDebugLog.logThis(3, "TimerClass", `queueUnique: ${queueUnique} not in main queue`);
	}
	removeFromQueueSkipped(queueUnique) { // remove queueUnique from the skipped queue
		if (this.queueSkipped.includes(queueUnique)) { 
			this.queueSkipped = arrayRemove(this.queueSkipped, queueUnique);
			gDebugLog.logThis(3, "TimerClass", `queueUnique: ${queueUnique} is removed - ${this.queueSkipped}`);
		} else gDebugLog.logThis(3, "TimerClass", `queueUnique: ${queueUnique} not in skipped queue`);
	}
	adjustTimer(newTimer) { // find difference from new timer and old timer and then use difference as timer once.
		if (this.timeoutID!==null && this.timeoutDoing!==this.timeoutID) {
			// if current timer hasn't started or not doing the queue item right now
			clearTimeout(this.timeoutID); // drop current timeout ID
			const timeElapsed = newTimer - (new Date().getTime() - this.started); // elapsed time from this new timer and old
			const newTimeout = (timeElapsed > 0) ? timeElapsed : 0; // if there is time left then use that time.
			// do another timer with the time left or do item now if new time is less than the time left.
			this.timeoutDoing = null; this.timeoutID = setTimeout(this.privateLoop.bind(this), newTimeout);
			gDebugLog.logThis(3, "TimerClass", `newTimer: ${newTimer} timeElapsed: ${timeElapsed} newTimeout: ${newTimeout}`);
		}
	}
	goHam(queueUnique, tGoHam=null) {
		if (this.goingHam===null) {
			if (tGoHam!==null) this.queueObject[queueUnique].tGoHam = tGoHam;
			this.goingHam=queueUnique; this.adjustTimer(this.hamTimeout);
		}
	}
	hamOff(queueUnique) {
		this.goingHam = null; this.adjustTimer(this.timeout);
		if (this.queueObject.hasOwnProperty(queueUnique)) this.queueObject[queueUnique].tGoHam = null;
	}
	isHamOn() { return this.goingHam!==null; }
	isGoingHam(queueUnique) { return this.goingHam===queueUnique; }
	isRunning() { return this.running; }
	runQueueTimer() { this.goTimer(); }
	pauseTimer() { this.paused = true; }
	unPauseTimer() { if (this.paused) { this.paused = false; this.goTimer(); } }
	pauseToggle() { this.paused = !this.paused; this.goTimer(); return this.paused;  }
	isInTimer(queueUnique) { return (this.queueObject.hasOwnProperty(queueUnique)); }
	stopAll() {
		if (this.queue.length) {
			if (this.timeoutID!==null) clearTimeout(this.timeoutID);
			this.timeoutDoing = this.timeoutID = null;
			Object.keys(this.queueObject).forEach( key => {
				let thisItem = this.queueObject[key];
				thisItem.funcAfter.apply(this, [thisItem.myId, thisItem.obj, false]);
				this.deleteFromQueue(key);
			});
			this.goingHam = null; this.running = false; this.queue = [], this.queueSkipped = [];
		}
	}
	skipThis(queueUnique) {
		gDebugLog.logThis(3, "TimerClass", "Trying to skip");
		if (this.queue.includes(queueUnique)) { // is the item with the unique ID in the main queue?
			// If skipped then remove it from queue and add it to skipped queue to remember it for unskipping
			if (this.goingHam=queueUnique) this.hamOff(); // turn off ham if this item was going ham
			this.removeFromQueue(queueUnique); this.queueSkipped.push(queueUnique); // move to queueSkipped
			this.queueObject[queueUnique].skipped = true; // set flag to show it is skipped in object data
			gDebugLog.logThis(3, "TimerClass", this.queue,this.queueSkipped);
		}
	}
	unSkipThis(queueUnique) {
		gDebugLog.logThis(3, "TimerClass", "trying to unskip: ", queueUnique,this.queueSkipped);
		if (this.queueSkipped.includes(queueUnique)) { // is the item with the unique ID in the skipped queue?
			this.removeFromQueueSkipped(queueUnique); // remove item unique ID from the skipped queue
			this.queueObject[queueUnique].skipped = false; // set flag to show it is not skipped in object data
			this.queue.unshift(queueUnique); // put item unique ID back on the queue
			this.goTimer(); // make sure timer is running if it was off
		}
	}
	resetTimeStarted(queueUnique) {
		if (this.queueObject.hasOwnProperty(queueUnique) && ( this.queueObject[queueUnique].tDuration!==-1 || this.queueObject[queueUnique].duration!==-1) ) this.queueObject[queueUnique].timeStarted=null;
	}
	addToQueue(myId, thisObj, func, funcAfter, goHamStart=false, duration=-1, tempDuration=-1, tempGoHam=-1, skipped=false) {
		const thisUnique = this.unique++; // Advance unique index for this new queue item
		this.queue.unshift(thisUnique); // put this new unique index at the beginning of the queue
		// if the tempduration is greater than the duration then just use the duration because it's more permanent
		tempDuration = (duration!==-1 && tempDuration>duration) ? -1 : tempDuration;
		// add item data to the queueObject
		this.queueObject[thisUnique] = { theFunction:func, funcAfter:funcAfter, myId:myId, obj:thisObj, duration:duration, tDuration:tempDuration, tGoHam:tempGoHam, timeStarted:null, hamstarted:null, skipped:skipped };
		gDebugLog.logThis(3, "TimerClass", `${this.timerName} add to timer: ${myId} duration: ${duration} tempDuration: ${tempDuration} goHamStart: ${goHamStart} tempGoHam: ${tempGoHam}`);
		// if need to go ham then start the go ham process now.
		if ( (tempGoHam!==-1 || goHamStart) && this.goingHam===null) { this.goHam(thisUnique); }
		if (skipped) this.skipThis(thisUnique);
		console.log("starting timer at: " + this.timeout + " | " + this.hamTimeout);
		this.goTimer(); // start the timer
		this.sendToPort(); // send timerinfo for timer queue back to the program port
		return thisUnique; // return the unique id for this new item in queue
	}
	deleteFromQueue(queueUnique) {
		if (this.isInTimer(queueUnique)) {
			if (this.goingHam===queueUnique) this.goingHam = null;
			this.removeFromQueue(queueUnique);
			this.removeFromQueueSkipped(queueUnique);
			delete this.queueObject[queueUnique];
			if (this.queue.length===0) this.running = false;
			else this.sendToPort();
		}
	}
	nowLoggedOff() { if (this.port) this.port.postMessage({return:"loggedOff"}); }
	nowLoggedOn() { if (this.port) this.port.postMessage({return:"loggedOn"});  }
}

const pandaTimer = new TimerClass(995,970,"pandaTimer"); // little lower than 1s for panda timer by default
const queueTimer = new TimerClass(2000,1000,"queueTimer"); // 2s for queue monitor by default
const searchTimer = new TimerClass(950,920,"searchTimer"); // little lower than 1s for search timer by default
let portsConnected = 0; // counter for the amount of ports or programs connected now.

if (chrome.runtime) {
	chrome.runtime.onConnect.addListener( function(port) {
		let portTimer = null;
		if (port.name==="pandaTimer") { portTimer = pandaTimer; pandaTimer.setPort(port); }
		else if (port.name==="queueTimer") { portTimer = queueTimer; queueTimer.setPort(port); }
		else if (port.name==="searchTimer") { portTimer = searchTimer; searchTimer.setPort(port); }
		if (portTimer) {
			gDebugLog.logThis(1, "TimerClass", `port name: ${port.name} is NOW connected!`);
			portsConnected++;
			port.onDisconnect.addListener( () => {
				gDebugLog.logThis(1, "TimerClass", `TC port name: ${port.name} is disconnected!`);
				portsConnected = (portsConnected>0) ? portsConnected-1 : 0;
				if (portsConnected===0) { queueTimer.stopAll(); }
				port = null; portTimer.setPort(port); portTimer.stopAll();
			});
		}
	});
}
