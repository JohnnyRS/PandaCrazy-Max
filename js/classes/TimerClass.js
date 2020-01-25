class TimerClass {
	constructor(timer = null, hamTimeout = null) {
		this.timeout = timer;
		this.hamTimeout = hamTimeout;
		this.timeoutID = null;
		this.timeoutDoing = null;
		this.queue = [];
		this.queueObject = [];
		this.queueJumping = [];
		this.queueSkipped = [];
		this.unique = 1;
		this._running = false;
		this._goingHam = null;
		this._paused = false;
		this.started = null; // time started
		this.port = null;
	}
	get running() { return this._running; }
	set running(v) { this._running = v; this.sendToPort(); }
	get goingHam() { return this._goingHam; }
	set goingHam(v) { this._goingHam = v; this.sendToPort(); }
	get paused() { return this._paused; }
	set paused(v) { this._paused = v; this.sendToPort(); }
	sendToPort() { if (this.port) { this.port.postMessage({return:"timerInfo", running:this._running, goingHam:this._goingHam, paused:this._paused, queueTotal:Object.keys(this.queueObject).length, myIdHam:(this._goingHam!==null) ? this.queueObject[this._goingHam].myId : -1}); }
		}
	setPort(port) { this.port = port; }
	setTimer(timer, adjust=false) { if (timer<this.min) return null; this.timeout = timer; if (adjust) this.adjustTimer(timer); }
	setHamTimer(timer) { this.hamTimeout = timer; }
	returnTimer() { return this.timeout; }
	privateLoop() {
		this.timeoutDoing = this.timeoutID; this.timeoutID = null;
		const end = new Date().getTime(); let goodToGo = true, queueUnique = null, turnOffHam = false;
		const usingTimer = (this.goingHam!==null && this.hamTimeout!==null) ? this.hamTimeout : this.timeout;
		const elapsed = end - this.started;
		const diff = ((elapsed - usingTimer) > 0) ? elapsed - usingTimer : 0;
		let newTimer = usingTimer - diff;
		if (usingTimer!==null && !this.paused && this.queue.length > 0) {
			if (this.goingHam!==null) { queueUnique = this.goingHam; }
			else queueUnique = this.queue.shift();
			const thisItem = this.queueObject[queueUnique];
			if (thisItem) {
				const thisDuration = (thisItem.tDuration!==-1) ? thisItem.tDuration : (thisItem.duration!==-1) ? thisItem.duration : -1;
				if (thisDuration!==-1) {
					if ( thisDuration!==-1 && thisItem.timeStarted===null) thisItem.timeStarted = new Date().getTime();
					else if (thisDuration!==-1 && (end - thisItem.timeStarted) > thisDuration) goodToGo = false;
				}
				if (thisItem.tGoHam!==-1) {
					if (thisItem.hamstarted===null) thisItem.hamstarted = new Date().getTime();
					else if ( (end - thisItem.hamstarted) > thisItem.tGoHam ) { turnOffHam=true; thisItem.tGoHam = -1; thisItem.hamstarted = null; }
				}
				if (goodToGo) {
					thisItem.theFunction.apply(this, [queueUnique, elapsed, thisItem.myId, thisItem.obj]);
					this.started = new Date().getTime();
				}
				else if (!goodToGo) {
					thisItem.funcAfter.apply(this, [thisItem.myId, thisItem.obj, turnOffHam]);
					this.deleteFromQueue(queueUnique);
					if (this.goingHam===queueUnique) this.goingHam = null;
					newTimer = 0;			// Pass to next in queue
				}
				if (goodToGo && this.goingHam===null) this.queue.push(queueUnique);
				if (turnOffHam) this.hamOff();
				this.timeoutDoing = null;
				this.timeoutID = setTimeout(this.privateLoop.bind(this), newTimer);
			} else { console.log(`Caught that little buggy: ${queueUnique} | ${this.queue} | ${this.goingHam}`); }
		} else { this.running = false; }
	}
	goTimer() { // start timer if it's not running
		if (!this.running && this.timeout !== null && !this.paused && this.queue.length > 0) {
			this.running = true;
			this.started = new Date().getTime(); this.tempStarted = new Date().getTime();
			this.timeoutID = setTimeout(this.privateLoop.bind(this), 0);
		}
	}
	removeFromQueue(queueUnique) { this.queue = arrayRemove(this.queue, queueUnique); console.log(`queueUnique: ${queueUnique} is removed - ${this.queue}`); }
	removeFromQueueSkipped(queueUnique) { this.queueSkipped = arrayRemove(this.queueSkipped, queueUnique); }
	adjustTimer(newTimer) {
		if (this.timeoutID!==null && this.timeoutDoing!==this.timeoutID) {
			clearTimeout(this.timeoutID);
			const timeElapsed = newTimer - (new Date().getTime() - this.started), newTimeout = (timeElapsed > 0) ? timeElapsed : 0;
			this.timeoutDoing = null; this.timeoutID = setTimeout(this.privateLoop.bind(this), newTimeout);
		}
	}
	goHam(queueUnique, tGoHam=null) {
		if (this.goingHam===null) {
			if (tGoHam!==null) this.queueObject[queueUnique].tGoHam = tGoHam;
			this.goingHam=queueUnique; this.adjustTimer(this.hamTimeout);
		}
	}
	hamOff(queueUnique) { this.goingHam = null; this.adjustTimer(this.timeout); if (queueUnique in this.queueObject) this.queueObject[queueUnique].tGoHam = null; }
	isHamOn() { return this.goingHam!==null; }
	isGoingHam(queueUnique) { return this.goingHam===queueUnique; }
	isRunning() { return this.running; }
	runQueueTimer() { this.goTimer(); }
	pauseTimer() { this.paused = true; }
	unPauseTimer() { if (this.paused) { this.paused = false; this.goTimer(); } }
	pauseToggle() { this.paused = !this.paused; this.goTimer(); return this.paused;  }
	stopAll() {
		if (this.queue.length) {
			if (this.timeoutID!==null) clearTimeout(this.timeoutID);
			this.timeoutDoing = null;
			this.queue.forEach( (queueUnique) => {
				const thisItem = this.queueObject[queueUnique];
				thisItem.funcAfter.apply(this, [thisItem.myId, thisItem.obj, false]);
				this.deleteFromQueue(queueUnique);
			});
			this.goingHam = null; this.running = false; this.queue = [];
		}
	}
	skipThis(queueUnique) { console.log("Trying to skip");
		if (queueUnique in this.queueObject) {
			this.removeFromQueue(queueUnique); this.queueSkipped.push(queueUnique);
			if (this.goingHam=queueUnique) this.hamOff();
			this.queueObject[queueUnique].skipped = true;
			console.log(this.queue,this.queueSkipped);
		}
	}
	unSkipThis(queueUnique) { console.log("trying to unskip: ", queueUnique,this.queueSkipped);
		if (this.queueSkipped.includes(queueUnique)) {
			this.removeFromQueueSkipped(queueUnique);
			this.queueObject[queueUnique].skipped = false;
			this.queue.unshift(queueUnique);
			this.goTimer();
		}
	}
	resetTimeStarted(queueUnique) {
		if (queueUnique in this.queueObject && ( this.queueObject[queueUnique].tDuration!==-1 || this.queueObject[queueUnique].duration!==-1) ) this.queueObject[queueUnique].timeStarted=null;
	}
	addToQueue(myId, thisObj, func, funcAfter, goHamStart=false, duration=-1, tempDuration=-1, tempGoHam=-1) {
		const thisUnique = this.unique++;
		this.queue.unshift(thisUnique);
		tempDuration = (duration!==-1 && tempDuration>duration) ? -1 : tempDuration;
		this.queueObject[thisUnique] = { theFunction:func, funcAfter:funcAfter, myId:myId, obj:thisObj, duration:duration, tDuration:tempDuration, tGoHam:tempGoHam, timeStarted:null, hamstarted:null, skipped:false };
		if ( (tempGoHam!==-1 || goHamStart) && this.goingHam===null) { this.goHam(thisUnique); }
		this.goTimer();
		this.sendToPort();
		return thisUnique;
	}
	deleteFromQueue(queueUnique) {
		if (this.goingHam===queueUnique) this.goingHam = null;
		this.removeFromQueue(queueUnique);
		delete this.queueObject[queueUnique];
		if (this.queue.length===0) this.running = false;
		this.sendToPort();
	}
}

const pandaTimer = new TimerClass(995,970); // little lower than 1s panda timer by default
const queueTimer = new TimerClass(2000); // 2s queue monitor by default
const searchTimer = new TimerClass(950);
let portsConnected = 0;

if (chrome.runtime) {
	chrome.runtime.onConnect.addListener( function(port) {
		let portTimer = null;
		if (port.name==="pandaTimer") { portTimer = pandaTimer; pandaTimer.setPort(port); }
		else if (port.name==="queueTimer") { portTimer = queueTimer; queueTimer.setPort(port); }
		else if (port.name==="searchTimer") { portTimer = searchTimer; searchTimer.setPort(port); }
		if (portTimer) {
			console.log(`port name: ${port.name} is NOW connected!`);
			portsConnected++;
			port.onMessage.addListener(function(msg) {
				if (msg.command == "addToQueue") {
					const value = portTimer.addToQueue(msg.myId, msg.thisObj, (a1, a2, a3, a4) => { console.log(port.name);
							if (port!==null) port.postMessage({return:msg.doThis, queueUnique:a1, elapsed:a2, myId:a3, obj:a4});
						}, (a1, a2, a3) => {
							if (port!==null) port.postMessage({return:msg.doAfter, myId:a1, obj:a2, turnOffHam:a3});
						}, msg.goHamStart, msg.duration, msg.tempDuration, msg.tempGoHam);
					port.postMessage({return:"addToQueue", myId:msg.myId, obj:msg.thisObj, value:value});
				}
				else if (msg.command=="setTimer") { portTimer.setTimer(msg.timer, msg.mainTimer); }
				else if (msg.command=="setHamTimer") { portTimer.setHamTimer(msg.timer); }
				else if (msg.command=="pauseToggle") { portTimer.pauseToggle(); }
				else if (msg.command=="pauseTimer") { portTimer.pauseTimer(); }
				else if (msg.command=="unPauseTimer") { portTimer.unPauseTimer(); }
				else if (msg.command=="stopAll") { portTimer.stopAll(); }
				else if (msg.command=="deleteFromQueue") { portTimer.deleteFromQueue(msg.queueUnique); }
				else if (msg.command=="isGoingHam") {  port.postMessage({return:"isGoingHam", value:portTimer.isGoingHam(msg.queueUnique)}); }
				else if (msg.command=="isHamOn") { port.postMessage({return:"isHamOn", value:portTimer.isHamOn()}); }
				else if (msg.command=="isRunning") { port.postMessage({return:"isRunning", value:portTimer.isRunning()}); }
				else if (msg.command=="goHam") { portTimer.goHam(msg.queueUnique, msg.tGoHam); }
				else if (msg.command=="hamOff") { portTimer.hamOff(); }
				else if (msg.command=="unSkipThis") { portTimer.unSkipThis(msg.queueUnique); }
				else if (msg.command=="skipThis") { portTimer.skipThis(msg.queueUnique); }
				else if (msg.command=="resetTimeStarted") { portTimer.resetTimeStarted(msg.queueUnique); }
			});
			port.onDisconnect.addListener( () => {
				console.log(`TC port name: ${port.name} is disconnected!`);
				portsConnected = (portsConnected>0) ? portsConnected-1 : 0;
				if (portsConnected===0) { queueTimer.stopAll(); }
				port = null; portTimer.setPort(port); portTimer.stopAll();
			});
		}
	});
}
