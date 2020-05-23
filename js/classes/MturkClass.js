/**
 */
class MturkClass {
	constructor() {
		this.totalFetched = { value:0, id:"#pcm_totalFetched", disabled:null, type:"integer" };
		this.totalPREs = { value:0, id:"#pcm_totalPres", disabled:null, type:"integer" };
		this.timerValue = { value:0, id:"#pcm_timerValue", disabled:null, type:"integer" };
		this.resultUrl = ""; }
	/**
	 * @param  {object} statObj
	 */
	updateStatNav(statObj) { // global stats for pandas and searches
		if (!window.jQuery) return null;
		if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
		if (statObj.disabled===true) return null;
		$(statObj.id).html(statObj.value);
	}
	/**
	*/
 addTotalFetched() { this.totalFetched.value++; this.updateStatNav(this.totalFetched); }
 /**
	*/
 addPRE() { this.totalPREs.value++; this.updateStatNav(this.totalPREs); }
 /**
	* @param  {object} objUrl
	*/
 async goFetch(objUrl) {
		// Can deal with Pre's, maxxed out and logged out for any mturk URL;
		const response = objUrl.goFetch().then(result => {
			if (!result) return null;
			this.resultUrl = result.url;
			this.addTotalFetched();
			let returnObj = { type:result.type, status:result.status, mode: "", data:result.data, url:result.url };
			if (this.resultUrl && this.resultUrl.includes('https://www.amazon.com/ap/signin')) { returnObj.mode = "logged out"; returnObj.data = null; }
			else if (result.type === "ok.json" && result.data.error && result.data.error.includes("You have exceeded the allowable")) { this.addPRE(); returnObj.mode = "pre"; returnObj.data = null; }
			else if (result.type === "ok.json" && result.data.message && result.data.message.includes("You have accepted the maximum number of HITs")) { returnObj.mode = "maxxedOut"; returnObj.data = null; }
			else if (result.type === "ok.json" && result.data.message && result.data.message === "There are no more of these HITs available.") { returnObj.mode = "noMoreHits"; returnObj.data = null; }
			else if ( result.type === "ok.json" && result.data.message && result.data.message.includes("you do not meet those Qualifications") ) { returnObj.mode = "noQual"; returnObj.data = null; }
			else if ( result.type === "ok.json" && result.data.message && result.data.message.includes("address is not valid") ) { returnObj.mode = "notValid"; returnObj.data = null; }
			else if ( result.type === "ok.json" && result.data.message && result.data.message.includes("prevent you from working") ) { returnObj.mode = "blocked"; returnObj.data = null; }
			else if ( result.type === "ok.json" && result.data.message ) { returnObj.mode = "unknown";  }
			return returnObj;
		});
		return response;
	}
}
