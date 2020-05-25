/**
 * This class deals with fetching urls from mturk and send results back to other classes.
 * @class MturkClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class MturkClass {
	constructor() {
		this.totalFetched = { value:0, id:"#pcm_totalFetched", disabled:null, type:"integer" };
		this.totalPREs = { value:0, id:"#pcm_totalPres", disabled:null, type:"integer" };
		this.timerValue = { value:0, id:"#pcm_timerValue", disabled:null, type:"integer" };
		this.resultUrl = "";			// Just a place to keep results from fetch for future use.
	}
	/**
	 * This method updates the status bar with relevant information from fetching mturk urls.
	 * @param  {object} statObj - The object that needs to be updated in status bar.
	 */
	updateStatNav(statObj) {
		if (window.jQuery) {
			if (statObj.disabled===null) statObj.disabled = ($(statObj.id).length) ? false : true;
			if (!statObj.disabled) $(statObj.id).html(statObj.value);
		}
	}
	/**
	 * Adds 1 to the total fetched and updates the stat in status bar.
	 */
	addTotalFetched() { this.totalFetched.value++; this.updateStatNav(this.totalFetched); }
	/**
	 * Adds 1 to the total PRE's and updates the stat in status bar.
	 */
	addPRE() { this.totalPREs.value++; this.updateStatNav(this.totalPREs); }
	/**
	 * Fetches the url in url object and handles mturk results.
	 * Can deal with Pre's, maxxed out and logged out for any mturk URL;
	 * TODO #2 might want to deal with reject results from the fetch function.
	 * @param  {object} objUrl - The url object to use for fetching.
	 * @return {object} 			 - Returns data in an object or null if got nothing.
	 */
	async goFetch(objUrl) {
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
		}, rejected => { console.error("error has occured"); });
		return response;
	}
}
