/** Class which handles the global status data and values.
 * @class PandaGStats ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class PandaGStats {
	constructor() {
		this.collecting = {'value':false, 'id':'#pcm-collecting', 'disabled':false, 'type':'boolean', 'on':'pcm-span-on', 'off':'pcm-span-off', 'paused':'pcm-span-paused'};
		this.collectingTotal = {'value':0, 'id':'#pcm-collectingTotal', 'disabled':false, 'type':'integer', 'string':'', 'post':''};
		this.pandaElapsed = {'value':0, 'id':'#pcm-pandaElapsed', 'disabled':false, 'type':'integer', 'string':'Elapsed: ', 'post':'ms'};
		this.fetchedElapsed = {'value':0, 'id':'#pcm-fetchedElapsed', 'disabled':true, 'type':'integer', 'string':'Fetched Elapsed: ', 'post':'ms'};
		this.pandaTimer = {'value':0, 'id':'#pcm-pandaTimer', 'disabled':true, 'type':'integer', 'string':'Timer set at: ', 'post':'ms'};
		this.pandaHamTimer = {'value':0, 'id':'#pcm-pandaHamTimer', 'disabled':true, 'type':'integer', 'string':'Ham Timer set at: ', 'post':'ms'};
		this.searchTimer = {'value':0, 'id':'#pcm-searchTimer', 'disabled':true, 'type':'integer', 'string':'Search Timer set at: ', 'post':'ms'};
		this.queueTimer = {'value':0, 'id':'#pcm-queueTimer', 'disabled':true, 'type':'integer', 'string':'Queue Timer set at: ', 'post':'ms'};
		this.totalAccepted = {'value':0, 'id':'#pcm-totalAccepted', 'disabled':false, 'type':'integer', 'string':'Accepted: ', 'post':'', 'updateEffect':true};
		this.totalFetched = {'value':0, 'id':'#pcm-totalFetched', 'disabled':true, 'type':'integer', 'string':'Fetched: ', 'post':''};
		this.totalNoMore = {'value':0, 'id':'#pcm-totalNoMore', 'disabled':true, 'type':'integer', 'string':'No More: ', 'post':''};
		this.totalErrors = {'value':0, 'id':'#pcm-totalErrors', 'disabled':true, 'type':'integer', 'string':'Errors: ', 'post':'', 'updateEffect':true};
		this.totalPandaPREs = {'value':0, 'id':'#pcm-totalPandaPREs', 'disabled':false, 'type':'integer', 'string':`PRE's: `, 'post':'', 'updateEffect':true};
		this.totalSearchPREs = {'value':0, 'id':'#pcm-totalSearchPREs', 'disabled':true, 'type':'integer', 'string':`Search PRE's: `, 'post':'', 'updateEffect':true};
		this.totalPREs = {'value':0, 'id':'#pcm-totalPREs', 'disabled':true, 'type':'integer', 'string':`Total PRE's: `, 'post':'', 'updateEffect':true};
		this.totalPandas = {'value':0, 'id':'#pcm-totalPandas', 'disabled':false, 'type':'integer', 'string':`Panda Jobs: `, 'post':'', 'updateEffect':true};
		this.totalSearches = {'value':0, 'id':'#pcm-totalSearches', 'disabled':true, 'type':'integer', 'string':`Search Jobs: `, 'post':'', 'updateEffect':true};
		this.totalSubmitted = {'value':0, 'id':'#pcm-totalSubmitted', 'disabled':true, 'type':'integer', 'string':`Submitted: `, 'post':'', 'updateEffect':true};
		this.totalReturned = {'value':0, 'id':'#pcm-totalReturned', 'disabled':true, 'type':'integer', 'string':`Returned: `, 'post':'', 'updateEffect':true};
		this.totalAbandoned = {'value':0, 'id':'#pcm-totalAbandoned', 'disabled':true, 'type':'integer', 'string':`Abandoned: `, 'post':'', 'updateEffect':true};
		this.totalEarned = {'value':'?.??', 'id':'#pcm-totalEarned', 'disabled':false, 'type':'price', 'string':'Total Earnings: $', 'post':'', 'updateEffect':true};
		this.totalPotential = {'value':'?.??', 'id':'#pcm-totalPotential', 'disabled':true, 'type':'price', 'string':'Potential: $', 'post':'', 'updateEffect':true};
		this.totalEarnedInQueue = {'value':'0.00', 'id':'#pcm-totalQueueEarnings', 'disabled':true, 'type':'price', 'string':'Queue Earnings: $', 'post':'', 'updateEffect':true};
		this.timerStats = [this.pandaElapsed, this.pandaTimer, this.pandaHamTimer, this.searchTimer, this.queueTimer, this.fetchedElapsed];
		this.jobFetchStats = [this.totalAccepted, this.totalFetched, this.totalErrors];
		this.preStats = [this.totalPandaPREs, this.totalSearchPREs, this.totalPREs];
		this.jobStats = [this.totalPandas, this.totalSearches, this.totalSubmitted, this.totalReturned, this.totalAbandoned];
		this.earningsStats = [this.totalEarned, this.totalPotential, this.totalEarnedInQueue];
		this.sendStatsTime = new Date().getTime();
		this.prepare();
	}
	/** Updates the status bar for a specific stat with updated stat or with the text supplied.
	 * @param  {object} statObj - Status object.  @param  {string} [text] - Stat text.  @param  {string} [className] - Class name.  @param  {bool} [effect] - Show animation?
	**/
	updateStatNav(statObj, text='', className=null, effect=true) {
		if (text === '') {
			if (statObj.disabled) $(statObj.id).hide();
			else {
				let cssVar = (statObj.tempStr) ? statObj.tempStr : getCSSVar(statObj.id.replace('#pcm-', ''), statObj.string), newValue = `${cssVar}${statObj.value}${statObj.post}`;
				statObj.tempStr = cssVar;
				if (className) $(statObj.id).removeClass().addClass(className);
				else if ($(statObj.id).html() !== newValue) {
					$(statObj.id).show().html(newValue);
					if (statObj.updateEffect && effect) $(statObj.id).stop(true,true).css('color','Tomato').animate({'color':'#f3fd7d'}, 3500);
				}
			}
		} else { if (statObj.disabled) $(statObj.id).hide().html(text); else $(statObj.id).html(text); }
	}
	/** Prepare the status bar with values and hide the disabled status values. **/
	prepare() {
		$('#pcm-timerStats').append(`<span id='pcm-pandaElapsed' class='pcm-stat1 pcm-tooltipData pcm-tooltipHelper' data-original-title='The exact accurate elapsed time it took for timer to send a fetch request to MTURK.'></span><span id='pcm-pandaTimer' class='pcm-stat2 pcm-tooltipData pcm-tooltipHelper' data-original-title='The time set for the panda timer.'></span><span id='pcm-pandaHamTimer' class='pcm-stat3 pcm-tooltipData pcm-tooltipHelper' data-original-title='The time set for the ham timer.'></span><span id='pcm-searchTimer' class='pcm-stat4 pcm-tooltipData pcm-tooltipHelper' data-original-title='The time set for the search timer.'></span><span id='pcm-queueTimer' class='pcm-stat5 pcm-tooltipData pcm-tooltipHelper' data-original-title='The time set for the Queue Timer.'></span><span id='pcm-fetchedElapsed' class='pcm-stat6 pcm-tooltipData pcm-tooltipHelper' data-original-title='The exact accurate elapsed time to get results back from MTURK page.'></span>`).data('toggled', 1).data('max',6).data('array', 'timerStats');
		$('#pcm-jobFetchStats').append(`<span id='pcm-totalAccepted' class='pcm-stat1 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of accepted HITs since starting Panda Crazy Max.'></span><span id='pcm-totalFetched' class='pcm-stat2 pcm-tooltipData pcm-tooltipHelper' data-original-title='The total number of fetches from MTURK since starting Panda Crazy Max.'></span><span id='pcm-totalErrors' class='pcm-stat3 pcm-tooltipData pcm-tooltipHelper' data-original-title='The total number of errors received from fetching MTURK pages.'></span>`).data('toggled', 1).data('max',3).data('array', 'jobFetchStats');
		$('#pcm-preStats').append(`<span id='pcm-totalPandaPREs' class='pcm-stat1 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of PRE&apos;s received when fetching panda pages from MTURK.'></span><span id='pcm-totalSearchPREs' class='pcm-stat2 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of PRE&apos;s received when fetching search pages from MTURK.'></span><span id='pcm-totalPREs' class='pcm-stat3 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of PRE&apos;s received from any page fetched from MTURK.'></span>`).data('toggled', 1).data('max',3).data('array', 'preStats');
		$('#pcm-jobStats').append(`<span id='pcm-totalPandas' class='pcm-stat1 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of panda jobs saved in extension.'></span><span id='pcm-totalSearches' class='pcm-stat2 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of search jobs saved in extension.'></span><span id='pcm-totalSubmitted' class='pcm-stat3 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of submitted HITs detected from user since starting Panda Crazy Max.'></span><span id='pcm-totalReturned' class='pcm-stat4 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of returned HITs detected from user since starting Panda Crazy Max.'></span><span id='pcm-totalAbandoned' class='pcm-stat5 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total number of abandoned HITs detected from user since starting Panda Crazy Max.'></span>`).data('toggled', 1).data('max',5).data('array', 'jobStats');
		$('#pcm-earningsStats').append(`<span id='pcm-totalEarned' class='pcm-stat1 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total amount of potential earnings today including the HITs in queue.'></span><span id='pcm-totalPotential' class='pcm-stat2 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total amount of potential earnings today given by the MTURK dashboard page.'></span><span id='pcm-totalQueueEarnings' class='pcm-stat3 pcm-tooltipData pcm-tooltipHelper' data-original-title='Total amount of potential earnings today from the HITs in queue only.'></span>`).data('toggled', 1).data('max',3).data('array', 'earningsStats');
		this.updateStatNav(this.timerStats[0]); this.updateStatNav(this.jobFetchStats[0]); this.updateStatNav(this.preStats[0]);
		this.updateStatNav(this.totalEarned); this.updateStatNav(this.totalPandas);
		$('.pcm-statArea .toggle').click( e => {
			let theToggle = $(e.target).closest('.toggle'), toggled = theToggle.data('toggled'), max = theToggle.data('max'), theArray = theToggle.data('array');
			if (theToggle.data('longClicked')) theToggle.removeData('longClicked');
			else {
				this[theArray][toggled-1].disabled = true; toggled = (++toggled > max) ? 1 : toggled; theToggle.data('toggled', toggled); this[theArray][toggled-1].disabled = false;
				let thisStat = theToggle.find(`.pcm-stat${toggled}`); theToggle.find('span').hide(); thisStat.show().stop(true,true);
				let oldColor = thisStat.css('color'); thisStat.css('color','Tomato').animate({'color':oldColor}, 3500);
				this.updateStatNav(this[theArray][toggled-1]);
			}
		});
		$('#pcm-earningsStats').on('long-press', e => {
			e.preventDefault(); $(e.target).closest('.toggle').data('longClicked', true);
			if (!MyDash.isFetching()) MyDash.doDashEarns();
		});
	}
  /** Resets the CSS variable values after a theme change to change any text on buttons or stats. **/
	resetCSSValues() {
		let setTempStr = (statObj) => { statObj.tempStr = getCSSVar(statObj.id.replace('#pcm-', ''), statObj.string); this.updateStatNav(statObj); }
		let properties = ['timerStats', 'jobFetchStats', 'preStats', 'jobStats', 'earningsStats', 'collectingTotal'];
		for (const prop of properties) {
			if (Array.isArray(this[prop])) { for (const thisObj of this[prop]) setTempStr(thisObj); }
			else setTempStr(this[prop]);
		}
	}
  /** Add 1 to the PRE counter and update status bar. **/
	addPandaPRE() { this.totalPandaPREs.value++; this.totalPREs.value++; this.updateStatNav(this.totalPandaPREs); this.updateStatNav(this.totalPREs); }
	/** Add 1 to the search PRE counter and update status bar. **/
	addSearchPRE() { this.totalSearchPREs.value++; this.totalPREs.value++; this.updateStatNav(this.totalSearchPREs); this.updateStatNav(this.totalPREs); }
  /** Add 1 to the total panda's fetched counter and update status bar. **/
	addTotalFetched() { this.totalFetched.value++; this.updateStatNav(this.totalFetched); }
  /** Add 1 to the total no more counter and update status bar. **/
	addTotalNoMore() { this.totalNoMore.value++; this.updateStatNav(this.totalNoMore); }
  /** Add 1 to the total accepted counter and update status bar. **/
	addTotalAccepted() { this.totalAccepted.value++; this.updateStatNav(this.totalAccepted); }
  /** Set the collecting value to on and then update the stat on the status bar. **/
	collectingOn() { this.collecting.value = true; this.updateStatNav(this.collecting, '', this.collecting.on); }
  /** Set the collecting value to off and then update the stat on the status bar. **/
	collectingOff() { if (this.collectingTotal.value < 1) { this.collecting.value = false; this.updateStatNav(this.collecting, '', this.collecting.off); } }
  /** Set the collecting value to paused and update the stat on the status bar. **/
	collectingPaused() { this.updateStatNav(this.collecting, '', this.collecting.paused); }
  /** Set the collecting value to unpaused and update the stat on the status bar. **/
	collectingUnPaused() { this.updateStatNav(this.collecting, '', (this.collecting.value) ? this.collecting.on : this.collecting.off ); }
  /** Add 1 to the total collecting jobs counter and update it on the status bar. **/
	addCollecting() { this.collectingTotal.value++; this.updateStatNav(this.collectingTotal); }
  /** Subtract 1 to the total collecting jobs counter and update it on the status bar. **/
	subCollecting() { this.collectingTotal.value--; this.updateStatNav(this.collectingTotal); }
  /** Add 1 to the total panda error counter and update it on the status bar. **/
	addTotalPandaErrors() { this.totalErrors.value++; this.updateStatNav(this.totalErrors); }
	/** Set the elapsed fetched timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the elapsed time value.
	**/
	addFetchedElapsed(value) { this.fetchedElapsed.value = value; this.updateStatNav(this.fetchedElapsed); }
	/** Set the elapsed panda timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the elapsed time value.
	**/
	setPandaElapsed(value) { this.pandaElapsed.value = value; this.updateStatNav(this.pandaElapsed); }
	/** Set the panda timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the panda timer value.
	**/
	setPandaTimer(value) { this.pandaTimer.value = value; this.updateStatNav(this.pandaTimer); }
	/** Set the ham timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the ham timer value.
	**/
	setHamTimer(value) { this.pandaHamTimer.value = value; this.updateStatNav(this.pandaHamTimer); }
	/** Set the search timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the search timer value.
	**/
	setSearchTimer(value) { this.searchTimer.value = value; this.updateStatNav(this.searchTimer); }
	/** Set the search timer value and then update it on the status bar.
	 * @param  {number} value - The value to change the search timer value.
	**/
	setQueueTimer(value) { this.queueTimer.value = value; this.updateStatNav(this.queueTimer); }
	/** Set the total earned from the potential earnings and the HITs in the queue. **/
	setTotalEarned() {
		if (isNaN(this.totalPotential.value)) return;
		else this.totalEarned.value = (Number(this.totalPotential.value) + Number(this.totalEarnedInQueue.value)).toFixed(2);
		this.updateStatNav(this.totalEarned);
	}
	/** Set the total earned value and then update it on the status bar.
	 * @param  {number} [value] - The earned value. @param {bool} [addTo] - Add this value to earnings.
	 * @return {string}         - The value of the potential earnings.
	**/
	thePotentialEarnings(value=null, addTo=null) {
		if (addTo !== null) value = Number(this.totalPotential.value) + addTo;
		if (value !== null) { this.totalPotential.value = Number(value).toFixed(2); this.updateStatNav(this.totalPotential); this.setTotalEarned(); }
		else return this.totalPotential.value;
	}
	/** Updates the earned stats with the page number of the MTURK stat page it's checking.
	 * @param  {number} [page] - Page number.
	**/
	waitEarningsPage(page=1) {
		this.updateStatNav(this.totalEarned, `${this.totalEarned.string} [page ${page}]`);
		this.updateStatNav(this.totalPotential, `${this.totalPotential.string} [page ${page}]`);
	}
	/** Set the total value in queue value and then update it on the status bar.
	 * @param  {number} value - the value to change the total value in queue value.
	**/
	setTotalValueInQueue(value) { this.totalEarnedInQueue.value = value; this.updateStatNav(this.totalEarnedInQueue); this.setTotalEarned(); }
  /** Add 1 to the total number of panda's loaded and update it on the status bar. **/
	addPanda() { this.totalPandas.value++; this.updateStatNav(this.totalPandas); }
  /** Subtract 1 to the total number of panda's loaded and update it on the status bar. **/
	subPanda() { this.totalPandas.value--; this.updateStatNav(this.totalPandas); }
  /** Add 1 to the total number of search jobs loaded and update it on the status bar. **/
	addSearch() { this.totalSearches.value++; this.updateStatNav(this.totalSearches); }
  /** Subtract 1 to the total number of search jobs loaded and update it on the status bar. **/
	subSearch() { this.totalSearches.value--; this.updateStatNav(this.totalSearches); }
  /** Add 1 to the total number of search jobs loaded and update it on the status bar. **/
	addSubmitted() { this.totalSubmitted.value++; this.updateStatNav(this.totalSubmitted); }
  /** Resets stats when wiping data for importing. **/
	resetStats() { this.totalPandas.value = 0; this.totalSearches.value = 0; this.totalSubmitted.value = 0; }
	/** Will send the full stats back using the function given.
	 * @param  {function} [sendResponse] - Function to send response back.
	**/
	sendStats(sendResponse=null) {
		let newTime = new Date().getTime();
		if (newTime - this.sendStatsTime < 1000) sendResponse({'for':'getStats', 'response':{error:'Too Fast'}});
		else {
			this.sendStatsTime = newTime;
			let statsReturned = {}, stats = [this.timerStats, this.jobFetchStats, this.preStats, this.jobStats, this.earningsStats, [this.collecting], [this.collectingTotal]];
			this.collecting = {'value':false, 'id':'#pcm-collecting', 'disabled':false, 'type':'boolean', 'on':'pcm-span-on', 'off':'pcm-span-off', 'paused':'pcm-span-paused'};
			this.collectingTotal = {'value':0, 'id':'#pcm-collectingTotal', 'disabled':false, 'type':'integer', 'string':'', 'post':''};
			for (const statObj of stats) {
				for (const stat of statObj) { let key = (stat.string) ? stat.string : stat.id.replace('#', ''); statsReturned[key] = stat.value; }
			}
			if (sendResponse) sendResponse({'for':'getStats', 'response':statsReturned});
		}
	}
}
