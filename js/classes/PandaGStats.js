class PandaGStats {
	constructor() {
		this.collecting = { value:false, id:"#pcm_collecting", disabled:null, type:"boolean" };
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
	updateStatNav(statObj,text="") {
		if (text==="") {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (statObj.disabled===true) return null;
			$(statObj.id).html(statObj.value);
		} else $(statObj.id).html(text);
	}
	addPandaPRE() { this.pandaPREs.value++; this.updateStatNav(this.pandaPREs); }
	addTotalPandaFetched() { this.totalPandaFetched.value++; this.updateStatNav(this.totalPandaFetched); }
	addTotalPandaNoMore() { this.totalPandaNoMore.value++; this.updateStatNav(this.totalPandaNoMore); }
	addTotalAccepted() { this.totalAccepted.value++; this.updateStatNav(this.totalAccepted); }
	collectingOn() { this.collecting.value = true; this.updateStatNav(this.collecting,"On"); }
	collectingOff() { if (this.collectingTotal.value<1) { this.collecting.value = false; this.updateStatNav(this.collecting,"Off"); } }
	addCollecting() { this.collectingTotal.value++; this.updateStatNav(this.collectingTotal); }
	subCollecting() { this.collectingTotal.value--; this.updateStatNav(this.collectingTotal); }
	addTotalPandaErrors() { this.totalPandaErrors.value++; this.updateStatNav(this.totalPandaErrors); }
	setPandaElapsed(value) { this.pandaElapsed.value = value; this.updateStatNav(this.pandaElapsed); }
	setTotalEarned(value) { this.totalEarned.value = value; this.updateStatNav(this.totalEarned); }
	setTotalValueInQueue(value) { this.totalValueInQueue.value = value; this.updateStatNav(this.totalValueInQueue); }
	addPanda() { this.totalPandas.value++; this.updateStatNav(this.totalPandas); }
	subPanda() { this.totalPandas.value--; this.updateStatNav(this.totalPandas); }
}
