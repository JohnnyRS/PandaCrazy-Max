class TimerClass {
	constructor(timer = null) {
		this.timeout = timer;
		this.queue = [];
		this.queueObject = [];
		this.queueJumping = [];
		this.queueSkipped = [];
		this.unique = 1;
		this.paused = false;
		this.running = false;
		this.goingHam = null;
		this.started = null; // time started
	}
	setTimer(timer) { this.timeout = timer; }
	returnTimer() { return this.timeout; }
	privateLoop() {
		const end = new Date().getTime(); let goodToGo = true, queueUnique = null, turnOffHam = false;
		const elapsed = end - this.started;
		const diff = ((elapsed - this.timeout) > 0) ? elapsed - this.timeout : 0;
		let newTimer = this.timeout - diff;
		if (this.timeout !== null && !this.paused && this.queue.length > 0) {
			if (this.goingHam!==null) queueUnique = this.goingHam;
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
					else if ( (end - thisItem.hamstarted) > thisItem.tGoHam ) { turnOffHam=true; thisItem.tGoHam = -1; thisItem.hamstarted = null; enableAllHamButtons(); }
				}
				if (goodToGo) {
					thisItem.theFunction.apply(this, [queueUnique, elapsed, thisItem.myId, thisItem.obj]);
					this.started = new Date().getTime();
					this.running = true; }
				else if (!goodToGo) {
					this.deleteFromQueue(queueUnique);
					thisItem.funcAfter.apply(this, [thisItem.myId, thisItem.obj, turnOffHam]);
					if (this.goingHam===queueUnique) this.goingHam = null;
					newTimer = 0;			// Pass to next in queue
				}
				if (goodToGo && this.goingHam===null) this.queue.push(queueUnique);
				if (turnOffHam) this.hamOff(queueUnique);
				this.timerObj = setTimeout(this.privateLoop.bind(this), newTimer);
				// if (!goodToGo) console.log(`Leaving ${queueUnique} on the floor`);
			} else { console.log(`Caught that little buggy: ${queueUnique} | ${this.queue} | ${this.goingHam}`); }
		} else { this.running = false; }
	}
	goTimer() { // start timer if it's not running
		if (!this.running && this.timeout !== null && !this.paused && this.queue.length > 0) {
			this.running = true;
			this.started = new Date().getTime();
			this.timerObj = setTimeout(this.privateLoop.bind(this), 0);
		}
	}
	removeFromQueue(queueUnique) { this.queue = arrayRemove(this.queue, queueUnique); console.log(`queueUnique: ${queueUnique} is removed - ${this.queue}`); }
	removeFromQueueSkipped(queueUnique) { this.queueSkipped = arrayRemove(this.queueSkipped, queueUnique); }
	goHam(queueUnique, tGoHam=null) { if (this.goingHam===null) { this.goingHam=queueUnique; if (tGoHam!==null) this.queueObject[queueUnique].tGoHam = tGoHam; } }
	hamOff(queueUnique) { if (this.goingHam===queueUnique) this.goingHam=null; }
	isHamOn() { return this.goingHam!==null; }
	isGoingHam(queueUnique) { return this.goingHam===queueUnique; }
	runQueueTimer() { this.goTimer(); }
	pauseTimer() { this.paused = true; }
	unPauseTimer() { this.paused = false; this.goTimer(); }
	skipThis(queueUnique) { console.log("Trying to skip");
		if (queueUnique in this.queueObject) {
			this.removeFromQueue(queueUnique);
			this.queueObject[thisUnique].skipped = true;
		}
	}
	unSkipThis(queueUnique) {
		if (queueUnique in this.queueSkipped) {
			this.removeFromQueueSkipped(queueUnique);
			this.queue.unshift(queueUnique); console.log(this.queue);
		}
	}
	resetTimeStarted(queueUnique) {
		if (queueUnique in this.queueObject && ( this.queueObject[queueUnique].tDuration!==-1 || this.queueObject[queueUnique].duration!==-1) ) this.queueObject[queueUnique].timeStarted=null;
	}
	addToQueue(myId, thisObj, func, funcAfter, duration=-1, tempDuration=-1, tempGoHam=-1) {
		const thisUnique = this.unique++;
		this.queue.unshift(thisUnique);
		tempDuration = (duration!==-1 && tempDuration>duration) ? -1 : tempDuration;
		this.queueObject[thisUnique] = { theFunction:func, funcAfter:funcAfter, myId:myId, obj:thisObj, duration:duration, tDuration:tempDuration, tGoHam:tempGoHam, timeStarted:null, hamstarted:null, skipped:false };
		if (tempGoHam!==-1 && this.goingHam===null) { this.goHam(thisUnique); disableOtherHamButtons(myId); }
		this.goTimer();
		return thisUnique;
	}
	deleteFromQueue(queueUnique) {
		this.removeFromQueue(queueUnique);
		delete this.queueObject[queueUnique];
		if (this.goingHam===queueUnique) this.goingHam = null;
	}
}
