/**
 */
class SearchGStats {
	constructor() {
		this.searching = { value:false, id:"#pcm_searching", disabled:null, type:"boolean", addClass:"pcm_searchOn" };
		this.searchNow = { value:false, id:"#pcm_searchNow", disabled:null, type:"boolean" };
		this.searchElapsed = { value:0, id:"#pcm_searchElapsed", disabled:null, type:"integer" };
		this.errors = 0;
		this.setTimer = 0;
		this.totalSearchFetched = { value: 0, id: "#pcm_searchTotalFetched", disabled:null, type:"integer" };
		this.totalSearchPREs = { value: 0, id: "#pcm_totalSearchPREs", disabled:null, type:"integer" };
		this.totalSearchHits = { value: 0, id: "#pcm_searchHitsFound", disabled:null, type:"integer" };
		this.totalSearchResults = { value: 0, id: "#pcm_searchResults", disabled:null, type:"integer" };
		this.total = "$0.00";
		this.totalInQueue = "$0.00";
		this.totalPandas = 0;
		this.totalSearches = 0;
	}
	/**
	 */
	isSearchOn() { return this.searching.value; }
	/**
	 */
	isSearchNowOn() { return this.searchNow.value; }
	/**
	 * @param  {object} statObj
	 * @param  {string} text=""
	 */
	updateStatNav(statObj,text="") { if (extSearchUI) extSearchUI.updateStatNav(statObj,text); }
	/**
	 */
	searchingOn() {
		this.searching.value = true; this.searchNow.value = true;
		this.updateStatNav(this.searching,"On"); this.updateStatNav(this.searchNow,"Stop Search");
	}
	/**
	 */
	searchingOff() { this.searching.value = false; this.updateStatNav(this.searching,"Off"); }
	/**
	 */
	searchNowOff() { this.searchNow.value = false; this.updateStatNav(this.searchNow,"Search Now"); }
	/**
	 * @param  {bool} value
	 */
	setSearchElapsed(value) { this.searchElapsed.value = value; this.updateStatNav(this.searchElapsed); }
	/**
	 */
	addTotalSearchFetched() { this.totalSearchFetched.value++; this.updateStatNav(this.totalSearchFetched); }
	/**
	 */
	addTotalSearchPRE() { this.totalSearchPREs.value++; this.updateStatNav(this.totalSearchPREs); }
	/**
	 * @param  {bool} value
	 */
	addTotalSearchHits(value) { this.totalSearchHits.value = value; this.updateStatNav(this.totalSearchHits); }
	/**
	 * @param  {bool} value
	 */
	addTotalSearchResults(value) { this.totalSearchResults.value = value; this.updateStatNav(this.totalSearchResults); }
}
