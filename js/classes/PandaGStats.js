/**
 * @class PandaGStats
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class PandaGStats {
	constructor() {
		this.collecting = { value:false, id:"#pcm_collecting", disabled:null, type:"boolean", on:`<span class="text-success">On</span>`, off:`<span class="text-danger">Off</span>`, paused:`<span class="text-warning">Paused</span>` };
		this.collectingTotal = { value:0, id:"#pcm_collectingTotal", disabled:null, type:"integer" };
		this.pandaElapsed = { value:false, id:"#pcm_pandaElapsed", disabled:null, type:"integer" };
		this.totalPandaErrors = { value:0, id:"#pcm_totalPandaErrors", disabled:null, type:"integer" };
		this.totalAccepted = { value:0, id:"#pcm_totalPandaAccepted", disabled:null, type:"integer" };
		this.totalPandaFetched = { value:0, id:"#pcm_totalPandaFetched", disabled:null, type:"integer" };
		this.totalPandaNoMore = { value:0, id:"#pcm_totalPandaNoMore", disabled:null, type:"integer" };
		this.pandaPREs = { value:0, id:"#pcm_totalPandaPREs", disabled:null, type:"integer" };
		this.totalEarned = { value:"0.00", id:"#pcm_totalEarned", disabled:null, type:"price" };
		this.totalValueInQueue = { value:"0.00", id:"#pcm_totalQueueEarnings", disabled:null, type:"price" };
		this.totalPandas = { value:0, id:"#pcm_totalPandas", disabled:null, type:"integer" };
	}
	/**
	 * Updates the status bar for a specific stat with updated stat or with the text supplied.
	 * @param  {object} statObj		- The object of the stat which should be updated in status bar.
	 * @param  {string} [text=""] - Text to show in the status bar for this specific stat in object.
	 */
	updateStatNav(statObj, text="") {
		if (text==="") {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled===true) return null;
			$(statObj.id).html(statObj.value);
		} else $(statObj.id).html(text);
	}
  /**
	 * Add 1 to the PRE counter and update status bar.
   */
	addPandaPRE() { this.pandaPREs.value++; this.updateStatNav(this.pandaPREs); }
  /**
	 * Add 1 to the total panda's fetched counter and update status bar.
   */
	addTotalPandaFetched() { this.totalPandaFetched.value++; this.updateStatNav(this.totalPandaFetched); }
  /**
	 * Add 1 to the total no more counter and update status bar.
   */
	addTotalPandaNoMore() { this.totalPandaNoMore.value++; this.updateStatNav(this.totalPandaNoMore); }
  /**
	 * Add 1 to the total accepted counter and update status bar.
   */
	addTotalAccepted() { this.totalAccepted.value++; this.updateStatNav(this.totalAccepted); }
  /**
	 * Set the collecting value to on and then update the stat on the status bar.
   */
	collectingOn() { this.collecting.value = true; this.updateStatNav(this.collecting,this.collecting.on); }
  /**
	 * Set the collecting value to off and then update the stat on the status bar.
   */
	collectingOff() {
		if (this.collectingTotal.value<1) {
			this.collecting.value = false;
			this.updateStatNav(this.collecting,this.collecting.off);
		}
	}
  /**
	 * Set the collecting value to paused and update the stat on the status bar.
   */
	collectingPaused() { this.updateStatNav(this.collecting,this.collecting.paused); }
  /**
	 * Set the collecting value to unpaused and update the stat on the status bar.
   */
	collectingUnPaused() {
		this.updateStatNav(this.collecting,(this.collecting.value) ? this.collecting.on : this.collecting.off );
	}
  /**
	 * Add 1 to the total collecting jobs counter and update it on the status bar.
   */
	addCollecting() { this.collectingTotal.value++; this.updateStatNav(this.collectingTotal); }
  /**
	 * Subtract 1 to the total collecting jobs counter and update it on the status bar.
   */
	subCollecting() { this.collectingTotal.value--; this.updateStatNav(this.collectingTotal); }
  /**
	 * Add 1 to the total panda error counter and update it on the status bar.
   */
	addTotalPandaErrors() { this.totalPandaErrors.value++; this.updateStatNav(this.totalPandaErrors); }
	/**
	 * Set the elapsed time value and then update it on the status bar.
	 * @param  {number} value - The value to change the elapsed time value.
	 */
	setPandaElapsed(value) { this.pandaElapsed.value = value; this.updateStatNav(this.pandaElapsed); }
	/**
	 * Set the total earned value and then update it on the status bar.
	 * @param  {number} value - The value to change the total earned value.
	 */
	setTotalEarned(value) { this.totalEarned.value = value; this.updateStatNav(this.totalEarned); }
	/**
	 * Set the total value in queue value and then update it on the status bar.
	 * @param  {number} value - the value to change the total value in queue value.
	 */
	setTotalValueInQueue(value) { this.totalValueInQueue.value = value; this.updateStatNav(this.totalValueInQueue); }
  /**
	 * Add 1 to the total number of panda's loaded and update it on the status bar.
   */
	addPanda() { this.totalPandas.value++; this.updateStatNav(this.totalPandas); }
  /**
	 * Subtract 1 to the total number of panda's loaded and update it on the status bar.
   */
	subPanda() { this.totalPandas.value--; this.updateStatNav(this.totalPandas); }
}
