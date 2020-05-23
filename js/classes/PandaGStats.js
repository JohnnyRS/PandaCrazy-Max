/**
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
	 * @param  {object} statObj
	 * @param  {string} text=""
	 */
	updateStatNav(statObj,text="") {
		if (text==="") {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled===true) return null;
			$(statObj.id).html(statObj.value);
		} else $(statObj.id).html(text);
	}
  /**
   */
	addPandaPRE() { this.pandaPREs.value++; this.updateStatNav(this.pandaPREs); }
  /**
   */
	addTotalPandaFetched() { this.totalPandaFetched.value++; this.updateStatNav(this.totalPandaFetched); }
  /**
   */
	addTotalPandaNoMore() { this.totalPandaNoMore.value++; this.updateStatNav(this.totalPandaNoMore); }
  /**
   */
	addTotalAccepted() { this.totalAccepted.value++; this.updateStatNav(this.totalAccepted); }
  /**
   */
	collectingOn() { this.collecting.value = true; this.updateStatNav(this.collecting,this.collecting.on); }
  /**
   */
	collectingOff() {
		if (this.collectingTotal.value<1) {
			this.collecting.value = false;
			this.updateStatNav(this.collecting,this.collecting.off);
		}
	}
  /**
   */
	collectingPaused() { this.updateStatNav(this.collecting,this.collecting.paused); }
  /**
   */
	collectingUnPaused() {
		this.updateStatNav(this.collecting,(this.collecting.value) ? this.collecting.on : this.collecting.off );
	}
  /**
   */
	addCollecting() { this.collectingTotal.value++; this.updateStatNav(this.collectingTotal); }
  /**
   */
	subCollecting() { this.collectingTotal.value--; this.updateStatNav(this.collectingTotal); }
  /**
   */
	addTotalPandaErrors() { this.totalPandaErrors.value++; this.updateStatNav(this.totalPandaErrors); }
	/**
	 * @param  {number} value
	 */
	setPandaElapsed(value) { this.pandaElapsed.value = value; this.updateStatNav(this.pandaElapsed); }
	/**
	 * @param  {number} value
	 */
	setTotalEarned(value) { this.totalEarned.value = value; this.updateStatNav(this.totalEarned); }
	/**
	 * @param  {number} value
	 */
	setTotalValueInQueue(value) { this.totalValueInQueue.value = value; this.updateStatNav(this.totalValueInQueue); }
  /**
   */
	addPanda() { this.totalPandas.value++; this.updateStatNav(this.totalPandas); }
  /**
   */
	subPanda() { this.totalPandas.value--; this.updateStatNav(this.totalPandas); }
}
