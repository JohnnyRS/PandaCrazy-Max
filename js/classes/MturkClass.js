class MturkClass {
	constructor() {
		this.totalFetched = { value:0, id:"#pcm_totalFetched", disabled:null, type:"integer" };
		this.totalPREs = { value:0, id:"#pcm_totalPres", disabled:null, type:"integer" };
		this.timerValue = { value:0, id:"#pcm_timerValue", disabled:null, type:"integer" };
		this.resultUrl = ""; }
	updateStatNav(statObj) { // global stats for pandas and searches
		if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
		if (statObj.disabled===true) return null;
		$(statObj.id).html(statObj.value); }
	addTotalFetched() { this.totalFetched.value++; this.updateStatNav(this.totalFetched); }
	addPRE() { this.totalPREs.value++; this.updateStatNav(this.totalPREs); }
	async goFetch(objUrl) {
		// Can deal with Pre's, maxxed out and logged out for any mturk URL;
		const response = objUrl.goFetch().then(result => {
			this.resultUrl = result.url;
			this.addTotalFetched();
			let returnObj = { type: result.type, status: result.status, mode: "", data: result.data };
			if (this.resultUrl && this.resultUrl.includes('https://www.amazon.com/ap/signin')) {
				console.log("You are logged out!");
				returnObj.mode = "logged out"; returnObj.data = null; }
			else if (result.type === "ok.json" && result.data.error === "You have exceeded the allowable page request rate") {
				this.addPRE();
				returnObj.mode = "pre"; returnObj.data = null; }
			else if (result.type === "ok.json" && result.data.message && result.data.message.includes("You have accepted the maximum number of HITs allowed at one time")) {
				returnObj.mode = "maxxedOut"; returnObj.data = null;
				console.log("maxed queue!");
			}
			return returnObj;
		});
		return response; } }
