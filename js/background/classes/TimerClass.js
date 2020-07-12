'use strict';
/** Class for the main timer which keeps all the timing organized for panda's, search and queue operations.
 * A queue is used to hold all the jobs it needs to do and runs the job after an elapsed time.
 * Minimum timer is set to make sure the timer never goes under which could cause problems.
 * Allows jobs to be skipped or jumped over. Allows jobs to go ham which runs on a lower elapsed time.
 * @class TimerClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class TimerClass {
	/**
	 * @param  {number} [timer=900]        - Do jobs after this time in milliseconds has elapsed.
	 * @param  {number} [hamTimer=700]	 - Do jobs a bit faster than normal for a specified amount of time.
	 * @param  {string} [timerName='none'] - The name of this timer.
	 */
	constructor(timer=900, hamTimer=700, timerName='none') {
		this.timeout = timer;						// The timer for the timeout cycle.
		this.hamTimer = hamTimer;		// Timer used when going ham.
		this.min = 600;									// The minimum time that the timer can be.
		this.timeoutID = null;					// A timeout ID for the current timeout.
		this.timeoutDoing = null;				// A timeout ID saved so the timeout ID can be nulled.
		this.queue = [];								// The main queue holding all jobs to cycle through.
		this.queueObject = {};					// All the jobs data information in an object.
		this.queueSkipped = [];					// An array with all the jobs being skipped over.
		this.unique = 1;								// A unique value for job in the timer queue.
		this._running = false;					// Is this timer running or not?
		this._goingHam = null;					// The queue unique number that is going ham right now.
		this._paused = false;						// Is this timer paused?
		this.started = null;						// The time that the timeout started.
		this.myClass = null;						// The class object that is using this timer.
		this.timerName = timerName;			// The timername used for debugging purposes.
		this.sendBack = false;					// Should timer status be sent back to the class?
	}
	/** Setters and getters to change the private properties and send back info */
	/** Passes back the running status of the timer.
	 * @type {bool} - True if timer is running. */
	get running() { return this._running; } 
	/** Sets the running status of the timer.
	 * @param {bool} v - Set timer as running or not. */											
	set running(v) { if (v!=this._running) { this._running = v; this.sendBackInfo(); } }
	/** Passes back the status of going ham.
	 * @type {bool} - True if timer is going ham. */
	get goingHam() { return this._goingHam; } 										
	/** Sets the going ham status for this timer.
	 * @param {bool} v - Set timer as going ham or not. */											
	set goingHam(v) { if (v!=this._goingHam) { this._goingHam = v; this.sendBackInfo(); } }	
	/** Passes back the status of timer being paused.
	 * @type {bool} - True if timer is paused. */
	get paused() { return this._paused; } 												
	/** Sets the status of being paused for this timer.
	 * @param {bool} v - Set timer as paused or not. */
	set paused(v) {
		const oldPaused = this._paused;
		this._paused = v; // Set private property to change.
		if (oldPaused && !v) this.goTimer(); // If it was paused then start timer.
		if (v != oldPaused) this.sendBackInfo(); // If paused was changed then send back info to class.
		return v;
	}
	/** Tells timer to send back information about timer status to class attached. */
	pleaseSendBack() { this.sendBack = true; }
	/** Set the myClass property so timer can send back timer info.
	 * @param  {object} myClass			Class object which is using this timer. */
	setMyClass(myClass) { this.myClass = myClass; }
	/** Will send some important timer info back to the class that started the timer. */
	sendBackInfo() {
		let goingHamNow = this._goingHam;
		if ( (goingHamNow && this.queueObject.hasOwnProperty(goingHamNow)) || !goingHamNow) {
			const passThis = {running:this._running, goingHam:this._goingHam, paused:this._paused, myIdHam:(this._goingHam!==null) ? this.queueObject[this._goingHam].myId : 0};
			if (this.sendBack) this.myClass.timerInfo(passThis);
			if (this.dLog(3)) console.debug("%c"+JSON.stringify(passThis), CONSOLE_DEBUG);
		}
	}
	/** Set a new time for this timer. If new time is lower than last time elapsed than do job now.
	 * If new time is higher than last time elapsed then take the difference and use it to complete the time needed.
	 * @param  {number} timer			 	 - The time that this timer should run at.
	 * @param  {bool} [adjust=false] - Should the timer calculate the time difference from last timer?
	 * @return {number}						 	 - Returns the new timer time. */
	setTimer(timer, adjust=false) {
		if (timer >= this.min) { // Make sure it's not under the minimum time.
			this.timeout = timer;
			if (adjust) this.adjustTimer(timer);
			if (this.dLog(3)) console.debug(`%cNew timer set: ${timer}`, CONSOLE_DEBUG);
			return this.timer; }
		else { if (this.dError(2)) console.error('New timer would be too low!'); return null; }
	}
	/** Add time to the timer.
	 * @param  {number} add - The time in milliseconds to add to the current timer. */
	addToTimer(add) { this.timeout += add; this.adjustTimer(this.timeout); return this.timeout; }
	/** Remove time from the time.
	 * @param  {number} del - The time in milliseconds to delete from the current timer. */
	delFromTimer(del) {
		this.timeout -= del;
		if (this.timeout <= this.min) this.timeout = this.min;
		this.adjustTimer(this.timeout);
		return this.timeout;
	}
	/** Set a new ham time for this timer.
	 * @param  {number} timer - The time for hamming that this timer should run at.
	 * @return {number}				- Returns the new ham time. */
	setHamTimer(timer) { 
		if (timer>=this.min) { this.hamTimer = timer; return this.timer; }
		else { if (this.dError(2)) console.error('New ham timer would be too low!'); return null; }
	}
	/** This is the main loop for the timer to work with. After timeout is done it will run this method.
	 * Stops timer if duration is elapsed. Stops hamming after ham duration is elapsed.
	 * Calculates exact elapsed time for information purposes. */
	privateLoop() {
		this.timeoutDoing = this.timeoutID; this.timeoutID = null;
		const end = new Date().getTime(); let stopFor = null, queueUnique = null, turnOffHam = false;
		// Which timer is being used. ham timer or regular timer.
		const usingTimer = (this.goingHam!==null && this.hamTimer!==null) ? this.hamTimer : this.timeout;
		const usingTimer2 = (this.goingHam!==null && this.hamTimer!==null) ? 'hamTimer' : 'normalTimer';
		const elapsed = end - this.started; // Get elapsed time from when timer started to end
		if (usingTimer!==null && !this.paused && this.queue.length > 0) {
			// How accurate was the timer? find difference between real timer and actual time elapsed.
			const diff = ((elapsed - usingTimer) > 0) ? elapsed - usingTimer : 0;
			if (this.dLog(3)) console.debug(`%c[${this.timerName}] using: ${usingTimer2} elapsed: ${elapsed} timer: ${usingTimer}`, CONSOLE_DEBUG);
			let newTimer = usingTimer - diff; // If actual time went over timer than subtract the difference for next timer
			if (this.goingHam!==null) { queueUnique = this.goingHam; } // If going ham then get item unique from ham
			else queueUnique = this.queue.shift(); // If not going ham then item unique is in the next queue position
			const thisItem = this.queueObject[queueUnique]; // Let's get the details of this item
			if (thisItem) {
				if (thisItem.timeStarted===null) thisItem.timeStarted = end;
				if (thisItem.timeRestarted===null) thisItem.timeRestarted = end;
				if (thisItem.duration>0 && (end-thisItem.timeStarted) > thisItem.duration ) stopFor = thisItem.duration;
				if (thisItem.tDuration>0 && (end-thisItem.timeRestarted) > thisItem.tDuration ) stopFor = thisItem.tDuration;
				if (thisItem.dGoHam>0) { // Is this just a temporary go ham job and item just started then init hamstarted
					if (thisItem.hamstarted===null) thisItem.hamstarted = end;
					else if ( (end - thisItem.hamstarted) > thisItem.dGoHam ) {
						turnOffHam=true; thisItem.dGoHam = 0; thisItem.hamstarted = null;
					}
				}
				if (!stopFor && this.goingHam===null) this.queue.push(queueUnique);
				if (!stopFor) { // Is this item good to go back into queue? Run the function and update started time.
					thisItem.theFunction(queueUnique, elapsed, thisItem.myId);
					this.started = end;
				}
				else if (stopFor) { // This item has expired so run the after function and delete it from queue
					if (this.dLog(2)) console.info(`%c[${this.timerName}] timer expired: ${stopFor}`, CONSOLE_INFO);
					thisItem.funcAfter(thisItem.myId, turnOffHam);
					this.deleteFromQueue(queueUnique);
					if (this.goingHam===queueUnique) this.goingHam = null; // If this was going ham then turn ham off.
					newTimer = 0;	// Pass to next item in queue
				}
				// Put this item back on the bottom of the queue if it's not going ham and good to go back on queue
				if (turnOffHam) this.hamOff(queueUnique); // If turning off ham then make sure ham is really off.
				this.timeoutDoing = null;
				this.timeoutID = setTimeout(this.privateLoop.bind(this), Math.max(newTimer, 0)); // Timeout never under 0
			}
		} else { this.running = false; } // queue isn't running right now.
	}
	/** Starts the timer if it's not running, not paused and the queue is not empty.
	 * Checks to make sure the timeoutID is null so it won't start another timeout. */
	goTimer() {
		if (this.timeoutID === null && !this.running && this.timeout !== null && !this.paused && this.queue.length > 0) {
			if (this.dLog(2)) console.info(`%c[${this.timerName}] is now starting: ${this.timeout}`, CONSOLE_INFO);
			this.running = true; this.started = new Date().getTime();
			this.timeoutID = setTimeout(this.privateLoop.bind(this), 0); // Start only one timeout.
		}
	}
	/** Removes the unique number from the queue.
	 * @param  {number} queueUnique - Unique number for job to remove from queue. */
	removeFromQueue(queueUnique) {
		if (this.queue.includes(queueUnique)) {
			this.queue = arrayRemove(this.queue, queueUnique);
			if (this.dLog(3)) console.log(`[${this.timerName}] unique: ${queueUnique} is removed - ${this.queue}`);
		} else if (this.dLog(3)) console.log(`[${this.timerName}] unique: ${queueUnique} not in main queue`);
	}
	/** Removes the unique number from the skipped queue.
	 * @param  {number} queueUnique - Unique number for job to remove from skipped queue. */
	removeFromQueueSkipped(queueUnique) {
		if (this.queueSkipped.includes(queueUnique)) { 
			this.queueSkipped = arrayRemove(this.queueSkipped, queueUnique);
			if (this.dLog(3)) console.log(`[${this.timerName}] unique: ${queueUnique} is removed from skipped queue - ${this.queueSkipped}`);
		} else if (this.dLog(3)) console.log(`[${this.timerName}] unique: ${queueUnique} not in skipped queue`);
	}
	/** Find the difference from new timer and old timer and then use difference as timer once to catchup.
	 * @param  {number} newTimer - The new timer to be used. */
	adjustTimer(newTimer) {
		if (this.timeoutID!==null && this.timeoutDoing!==this.timeoutID) {
			clearTimeout(this.timeoutID); // Drop current timeout ID.
			const timeElapsed = newTimer - (new Date().getTime() - this.started);
			const newTimeout = (timeElapsed > 0) ? timeElapsed : 0; // If there is time left then use that time.
			this.timeoutDoing = null; this.timeoutID = setTimeout(this.privateLoop.bind(this), newTimeout);
		}
	}
	/** Change the duration for a job inside the queue.
	 * @param  {number} queueUnique - Unique number for job to remove from skipped queue.
	 * @param  {number} duration		- The new duration for this job. */
	changeDuration(queueUnique, duration) {
		if (this.queueObject.hasOwnProperty(queueUnique)) {
			if (this.dLog(2)) console.info(`%c[${this.timerName}] duration changed for: ${queueUnique} to ${duration}`, CONSOLE_INFO);
			this.queueObject[queueUnique].duration = duration;
		}
	}
	/** Start to go ham on the job with this unique number and use a temporary go ham duration if necessary.
	 * If ham time is higher than last time elapsed then take the difference and use it to complete the time needed.
	 * @param  {number} queueUnique - Unique number for job to go ham.
	 * @param  {number} [dGoHam=0] - Temporary duration to go ham. */
	goHam(queueUnique, dGoHam=0) {
		if (this.goingHam===null) { // If it's already going ham then do nothing.
			if (this.dLog(3)) console.log(`[${this.timerName}] is now going ham for ${queueUnique}: ${this.hamTimer}`);
			if (dGoHam === 0) dGoHam = 5000; // default temporary goham to 5000ms if it was 0.
			this.queueObject[queueUnique].dGoHam = dGoHam;
			this.goingHam=queueUnique; this.adjustTimer(this.hamTimer);
		}
	}
	/** Turn off going ham for unique ID or if no ID passed then turn off whatever is going ham now.
	 * If main time is higher than last time elapsed then take the difference and use it to complete the time needed.
	 * @param  {number} [queueUnique=null] - Unique number for job to go ham.
	 * @return {number}										 - Unique number of job that stopped hamming. */
	hamOff(queueUnique=null) {
		const thisUnique = (queueUnique) ? queueUnique : this.goingHam;
		if (thisUnique===this.goingHam && thisUnique) {
			this.goingHam = null; this.adjustTimer(this.timeout);
			if (this.dLog(3)) console.log(`[${this.timerName}] is turning ham off for ${thisUnique}`);
			if (this.queueObject.hasOwnProperty(thisUnique)) this.queueObject[thisUnique].dGoHam = 0;
		}
		return thisUnique;
	}
	/** Toggle the pause status of timer.
	 * @return {bool} - Returns the status of the timer after toggling. */
	pauseToggle() { this.paused = !this.paused; return this.paused;  }
	/** Remove all jobs from queue and stop the timer. */
	stopAll() {
		if (this.queue.length || this.queueSkipped.length) {
			if (this.timeoutID!==null) clearTimeout(this.timeoutID);
			this.timeoutDoing = this.timeoutID = null;
			Object.keys(this.queueObject).forEach( key => {
				let thisItem = this.queueObject[key];
				thisItem.funcAfter(thisItem.myId, false);
				this.deleteFromQueue(key);
			});
			if (this.dLog(2)) console.log(`%c[${this.timerName}] is trying to stop all jobs`,CONSOLE_INFO);
			this.goingHam = null; this.running = false; this.queue = [], this.queueSkipped = [];
		}
	}
	/** Skip the job with the unique number until it is unskipped.
	 * @param  {number} queueUnique - Unique number of job to be skipped. */
	skipThis(queueUnique) {
		if (this.queue.includes(queueUnique)) {
			if (this.goingHam=queueUnique) this.hamOff(queueUnique); // Turn off ham if this item was going ham.
			this.removeFromQueue(queueUnique); this.queueSkipped.push(queueUnique); // Move to queueSkipped.
			this.queueObject[queueUnique].skipped = true; // Set flag to show it is skipped in object data.
			if (this.dLog(3)) console.log(`[${this.timerName}] is trying to skip: ${queueUnique}`);
		}
	}
	/** Unskip the job with the unique number.
	 * @param  {number} queueUnique - Unique number of job to be unskipped. */
	unSkipThis(queueUnique) {
		if (this.queueSkipped.includes(queueUnique)) {
			if (this.dLog(3)) console.log(`[${this.timerName}] is trying to unskip: ${queueUnique}`);
			this.removeFromQueueSkipped(queueUnique); // Remove item unique ID from the skipped queue.
			this.queueObject[queueUnique].skipped = false; // Set flag to show it is not skipped in object data.
			this.queue.unshift(queueUnique); // Put item unique ID back on the queue.
			if (!this.running) this.goTimer();
		}
	}
	/** Resets the time started for this job so it can keep trying to collect after a hit was collected.
	 * @param  {number} queueUnique - Reset the time started on the job with this unique. */
	resetTimeStarted(queueUnique) {
		if (this.dLog(2)) console.info(`%c[${this.timerName}] is trying to reset time started: ${queueUnique}`, CONSOLE_INFO);
		if (this.queueObject.hasOwnProperty(queueUnique) && ( this.queueObject[queueUnique].tDuration>0 || this.queueObject[queueUnique].duration>0) ) this.queueObject[queueUnique].timeRestarted=null;
	}
	/** Add a new job to the queue for this timer. Also will remove job when duration has elapsed.
	 * Can go ham at start and have a duration for the go ham too. Can also be skipped at beginning.
	 * @param  {number} myId					   - Unique id of panda job only used for panda timer.
	 * @param  {function} doFunc			   - Do this function every cycle of the timer.
	 * @param  {function} funcAfter      - Do this function after this job gets removed from queue.
	 * @param  {bool} [goHamStart=false] - Go ham at start?
	 * @param  {number} [duration=0]		 - The duration for this job to run.
	 * @param  {number} [tDuration=0]		 - Temporary duration for this job used for external panda adds.
	 * @param  {number} [dGoHam=0]			 - Temporary go ham duration for this job used for external panda adds.
	 * @param  {bool} [skipped=false]	   - Should skip it at beginning?
	 * @return {number}								 	 - Returns a unique number for this job in queue. */
	addToQueue(myId, doFunc, funcAfter, goHamStart=false, duration=0, tDuration=0, dGoHam=0, skipped=false) {
		const thisUnique = this.unique++; // Advance unique index for this new queue item
		this.queue.unshift(thisUnique); // put this new unique index at the beginning of the queue
		tDuration = (duration>0 && tDuration>duration) ? 0 : tDuration;
		this.queueObject[thisUnique] = { theFunction:doFunc, funcAfter:funcAfter, myId:myId, duration:duration, tDuration:tDuration, dGoHam:dGoHam, timeStarted:null, timeRestarted:null, hamstarted:null, skipped:skipped };
		if ( (dGoHam>0 || goHamStart) && this.goingHam===null) { this.goHam(thisUnique, dGoHam); }
		if (skipped) this.skipThis(thisUnique);
		if (this.dLog(2)) console.info(`%c[${this.timerName}] new add [${myId}]: duration: ${duration} tDuration: ${tDuration} goHamStart: ${goHamStart} dGoHam: ${dGoHam}`, CONSOLE_INFO);
		if (!this.running) this.goTimer();
		else this.sendBackInfo();
		return thisUnique;
	}
	/** Delete this job with the unique number from the queue.
	 * @param {number} queueUnique - Unique number of job to be deleted. */
	deleteFromQueue(queueUnique) {
		if (this.queueObject.hasOwnProperty(queueUnique)) {
			if (this.goingHam===queueUnique) this.goingHam = null;
			this.removeFromQueue(queueUnique); // Make sure it's no longer in queue.
			this.removeFromQueueSkipped(queueUnique); // Make sure it's no longer in skipped queue.
			delete this.queueObject[queueUnique];
			if (this.dLog(3)) console.info(`%c[${this.timerName}] is trying to delete from queue: ${queueUnique}`, CONSOLE_INFO);
			if (this.queue.length===0) this.running = false;
			else this.sendBackInfo();
		}
	}
	/** Checks if this error is allowed to show depending on user options and class name.
	 * (0)-fatal = Errors that can crash or stall program.
   * (1)-error = Errors that shouldn't be happening but may not be fatal.
   * (2)-warn = Warnings of errors that could be bad but mostly can be self corrected.
	 * @param  {number} levelNumber - Level number for this error.
	 * @return {bool}								- True if this error is permitted to show. */
	dError(levelNumber) { return dError(levelNumber, 'TimeClass'); }
	/** Checks if this debug message is allowed to show depending on user options and class name.
   * (1)-info = Shows basic information of progress of program.
   * (2)-debug = Shows the flow of the program with more debugging information.
   * (3)-trace = More details shown including variable contents and functions being called.
   * (4)-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
	 * @param  {number} levelNumber - Level number for this debug message.
	 * @return {bool}								- True if this message is permitted to show. */
	dLog(levelNumber) { return dLog(levelNumber, 'TimerClass'); }
}

const pandaTimer = new TimerClass(995,970,'pandaTimer'); // little lower than 1s for panda timer by default
const queueTimer = new TimerClass(2000,1000,'queueTimer'); // 2s for queue monitor by default
const searchTimer = new TimerClass(950,920,'searchTimer'); // little lower than 1s for search timer by default
