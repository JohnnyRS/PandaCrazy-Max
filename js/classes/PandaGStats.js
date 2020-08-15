/** Class which handles the global status.
 * @class PandaGStats
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaGStats {
	constructor() {
		this.collecting = { value:false, id:'#pcm_collecting', disabled:false, type:'boolean', on:`<span class='text-success'>On</span>`, off:`<span class='text-danger'>Off</span>`, paused:`<span class='text-warning'>Paused</span>` };
		this.collectingTotal = {value:0, id:'#pcm_collectingTotal', disabled:false, type:'integer', 'string':'', 'post':''};
		this.pandaElapsed = {value:0, id:'#pcm_pandaElapsed', disabled:false, type:'integer', 'string':'Elapsed: ', 'post':'ms'};
		this.pandaTimer = {value:0, id:'#pcm_pandaTimer', disabled:true, type:'integer', 'string':'Timer set at: ', 'post':'ms'};
		this.pandaHamTimer = {value:0, id:'#pcm_pandaHamTimer', disabled:true, type:'integer', 'string':'Ham Timer set at: ', 'post':'ms'};
		this.searchTimer = {value:0, id:'#pcm_searchTimer', disabled:true, type:'integer', 'string':'Search Timer set at: ', 'post':'ms'};
		this.queueTimer = {value:0, id:'#pcm_queueTimer', disabled:true, type:'integer', 'string':'Queue Timer set at: ', 'post':'ms'};
		this.totalAccepted = {value:0, id:'#pcm_totalAccepted', disabled:false, type:'integer', 'string':'Accepted: ', 'post':''};
		this.totalFetched = {value:0, id:'#pcm_totalFetched', disabled:true, type:'integer', 'string':'Fetched: ', 'post':''};
		this.totalNoMore = {value:0, id:'#pcm_totalNoMore', disabled:true, type:'integer', 'string':'No More: ', 'post':''};
		this.totalErrors = {value:0, id:'#pcm_totalErrors', disabled:true, type:'integer', 'string':'Errors: ', 'post':''};
		this.totalPandaPREs = {value:0, id:'#pcm_totalPandaPREs', disabled:false, type:'integer', 'string':`PRE's: `, 'post':''};
		this.totalSearchPREs = {value:0, id:'#pcm_totalSearchPREs', disabled:true, type:'integer', 'string':`Search PRE's: `, 'post':''};
		this.totalPREs = {value:0, id:'#pcm_totalPREs', disabled:true, type:'integer', 'string':`Total PRE's: `, 'post':''};
		this.totalEarned = {value:'0.00', id:'#pcm_totalEarned', disabled:false, type:'price', 'string':'Total Earnings: $', 'post':''};
		this.totalPotential = {value:'0.00', id:'#pcm_totalPotential', disabled:true, type:'price', 'string':'Potential: $', 'post':''};
		this.totalEarnedInQueue = {value:'0.00', id:'#pcm_totalQueueEarnings', disabled:true, type:'price', 'string':'Queue Earnings: $', 'post':''};
		this.totalPandas = {value:0, id:'#pcm_totalPandas', disabled:false, type:'integer', 'string':`Total Panda's: `, 'post':''};
		this.timerStats = [this.pandaElapsed, this.pandaTimer, this.pandaHamTimer, this.searchTimer, this.queueTimer];
		this.jobFetchStats = [this.totalAccepted, this.totalFetched, this.totalErrors];
		this.preStats = [this.totalPandaPREs, this.totalSearchPREs, this.totalPREs];
		this.earningsStats = [this.totalEarned, this.totalPotential, this.totalEarnedInQueue];
		this.prepare();
	}
	/** Updates the status bar for a specific stat with updated stat or with the text supplied.
	 * @param  {object} statObj		- The object of the stat which should be updated in status bar.
	 * @param  {string} [text=''] - Text to show in the status bar for this specific stat in object. */
	updateStatNav(statObj, text='') {
		if (text === '') {
			if (statObj.disabled === true) $(statObj.id).hide();
			else $(statObj.id).show().html(`${statObj.string}${statObj.value}${statObj.post}`);
		} else $(statObj.id).show().html(text);
	}
	/** Prepare the status bar with values and hide the disabled status values. */
	prepare() {
		$('#pcm_timerStats').append(`<span id='pcm_pandaElapsed' class='1'></span><span id='pcm_pandaTimer' class='2'></span><span id='pcm_pandaHamTimer' class='3'></span><span id='pcm_searchTimer' class='4'></span><span id='pcm_queueTimer' class='5'></span>`).data('toggled', 1).data('max',5).data('array', 'timerStats');
		$('#pcm_jobFetchStats').append(`<span id='pcm_totalAccepted' class='1'></span><span id='pcm_totalFetched' class='2'></span><span id='pcm_totalErrors' class='3'></span>`).data('toggled', 1).data('max',3).data('array', 'jobFetchStats');
		$('#pcm_preStats').append(`<span id='pcm_totalPandaPREs' class='1'></span><span id='pcm_totalSearchPREs' class='2'></span><span id='pcm_totalPREs' class='3'></span>`).data('toggled', 1).data('max',3).data('array', 'preStats');
		$('#pcm_earningsStats').append(`<span id='pcm_totalEarned' class='1'></span><span id='pcm_totalPotential' class='2'></span><span id='pcm_totalQueueEarnings' class='3'></span>`).data('toggled', 1).data('max',3).data('array', 'earningsStats');
		this.updateStatNav(this.timerStats[0]); this.updateStatNav(this.jobFetchStats[0]); this.updateStatNav(this.preStats[0]); this.updateStatNav(this.totalEarned);
		$('#pcm_statArea .toggle').click( (e) => {
			let theToggle = $(e.target).closest('.toggle'), toggled = theToggle.data('toggled'), max = theToggle.data('max'); let theArray = theToggle.data('array');
			this[theArray][toggled-1].disabled = true;
			toggled = (++toggled > max) ? 1 : toggled; theToggle.data('toggled', toggled);  this[theArray][toggled-1].disabled = false;
			theToggle.find('span').hide(); theToggle.find(`.${toggled}`).show().stop(true,true).css('color','Tomato').animate({'color':'#f3fd7d'}, 3500); this.updateStatNav(this[theArray][toggled-1]);
		});
	}
  /** Add 1 to the PRE counter and update status bar. */
	addPandaPRE() { this.totalPandaPREs.value++; this.updateStatNav(this.totalPandaPREs); }
  /** Add 1 to the total panda's fetched counter and update status bar. */
	addTotalFetched() { this.totalFetched.value++; this.updateStatNav(this.totalFetched); }
  /** Add 1 to the total no more counter and update status bar. */
	addTotalNoMore() { this.totalNoMore.value++; this.updateStatNav(this.totalNoMore); }
  /** Add 1 to the total accepted counter and update status bar. */
	addTotalAccepted() { this.totalAccepted.value++; this.updateStatNav(this.totalAccepted); }
  /** Set the collecting value to on and then update the stat on the status bar. */
	collectingOn() { this.collecting.value = true; this.updateStatNav(this.collecting,this.collecting.on); }
  /** Set the collecting value to off and then update the stat on the status bar. */
	collectingOff() {
		if (this.collectingTotal.value<1) { this.collecting.value = false; this.updateStatNav(this.collecting,this.collecting.off); }
	}
  /** Set the collecting value to paused and update the stat on the status bar. */
	collectingPaused() { this.updateStatNav(this.collecting,this.collecting.paused); }
  /** Set the collecting value to unpaused and update the stat on the status bar. */
	collectingUnPaused() {
		this.updateStatNav(this.collecting,(this.collecting.value) ? this.collecting.on : this.collecting.off );
	}
  /** Add 1 to the total collecting jobs counter and update it on the status bar. */
	addCollecting() { this.collectingTotal.value++; this.updateStatNav(this.collectingTotal); }
  /** Subtract 1 to the total collecting jobs counter and update it on the status bar. */
	subCollecting() { this.collectingTotal.value--; this.updateStatNav(this.collectingTotal); }
  /** Add 1 to the total panda error counter and update it on the status bar. */
	addTotalPandaErrors() { this.totalErrors.value++; this.updateStatNav(this.totalErrors); }
	/** Set the elapsed timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the elapsed time value. */
	setPandaElapsed(value) { this.pandaElapsed.value = value; this.updateStatNav(this.pandaElapsed); }
	/** Set the panda timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the panda timer value. */
	setPandaTimer(value) { this.pandaTimer.value = value; this.updateStatNav(this.pandaTimer); }
	/** Set the ham timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the ham timer value. */
	setHamTimer(value) { this.pandaHamTimer.value = value; this.updateStatNav(this.pandaHamTimer); }
	/** Set the search timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the search timer value. */
	setSearchTimer(value) { this.searchTimer.value = value; this.updateStatNav(this.searchTimer); }
	/** Set the search timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the search timer value. */
	setQueueTimer(value) { this.queueTimer.value = value; this.updateStatNav(this.queueTimer); }
	/** Set the total earned from the potential earnings and the hits in the queue. */
	setTotalEarned() {
		this.totalEarned.value = (Number(this.totalPotential.value) + Number(this.totalEarnedInQueue.value)).toFixed(2).toString();
		this.updateStatNav(this.totalEarned);
	}
	/** Set the total earned value and then update it on the status bar.
	 * @param  {number} value - The value to change the total earned value.
	 * @return {string}       - The value of the potential earnings. */
	thePotentialEarnings(value=null) {
		if (value) { this.totalPotential.value = Number(value).toFixed(2).toString(); this.updateStatNav(this.totalPotential); this.setTotalEarned(); }
		else return this.totalPotential.value;
	}
	/** Set the total value in queue value and then update it on the status bar.
	 * @param  {number} value - the value to change the total value in queue value. */
	setTotalValueInQueue(value) { this.totalEarnedInQueue.value = value; this.updateStatNav(this.totalEarnedInQueue); this.setTotalEarned(); }
  /** Add 1 to the total number of panda's loaded and update it on the status bar. */
	addPanda() { this.totalPandas.value++; this.updateStatNav(this.totalPandas); }
  /** Subtract 1 to the total number of panda's loaded and update it on the status bar. */
	subPanda() { this.totalPandas.value--; this.updateStatNav(this.totalPandas); }
  /** Resets stats when wiping data for importing. */
	resetStats() { this.totalPandas.value = 0; }
}
