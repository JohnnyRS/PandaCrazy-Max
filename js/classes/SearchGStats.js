/**
 * @class SearchGStats
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class SearchGStats {
	constructor() {
		this.errors = 0;								// Amount of errors that happened while searching.
		this.totalPandas = 0;						// Total number of panda's found.
		this.totalSearches = 0;					// Total number of searches made.
		this.searching = { value:false, id:"#pcm_searching", disabled:null, type:"boolean", addClass:"pcm_searchOn" };
		this.searchNow = { value:false, id:"#pcm_searchNow", disabled:null, type:"boolean" };
		this.searchElapsed = { value:0, id:"#pcm_searchElapsed", disabled:null, type:"integer" };
		this.totalSearchFetched = { value: 0, id: "#pcm_searchTotalFetched", disabled:null, type:"integer" };
		this.totalSearchPREs = { value: 0, id: "#pcm_totalSearchPREs", disabled:null, type:"integer" };
		this.totalSearchHits = { value: 0, id: "#pcm_searchHitsFound", disabled:null, type:"integer" };
		this.totalSearchResults = { value: 0, id: "#pcm_searchResults", disabled:null, type:"integer" };
	}
	/**
	 * Checks to see if searching is on by using searching value.
	 * @return {bool} - True if searching is on now.
	 */
	isSearchOn() { return this.searching.value; }
	/**
	 * Checks to see if searching is on by using searchNow value.
	 * @return {bool} - True is searchNow is on.
	 */
	isSearchNowOn() { return this.searchNow.value; }
	/**
	 * Updates the given stat object on the status bar and pass a text to use too.
	 * @param  {object} statObj   - The stat object to display stats on the status bar.
	 * @param  {string} [text=""] - The text to use in the status bar for this stat object.
	 */
	updateStatNav(statObj,text="") { if (extSearchUI) extSearchUI.updateStatNav(statObj, text); }
	/**
	 * Set the searching value and searching now value to on and update stat in status bar.
	 */
	searchingOn() {
		this.searching.value = true; this.searchNow.value = true;
		this.updateStatNav(this.searching,"On"); this.updateStatNav(this.searchNow,"Stop Search");
	}
	/**
	 * Set the searching value to off and update stat in status bar.
	 */
	searchingOff() { this.searching.value = false; this.updateStatNav(this.searching,"Off"); }
	/**
	 * Set the search now value to off and update stat in status bar.
	 */
	searchNowOff() { this.searchNow.value = false; this.updateStatNav(this.searchNow,"Search Now"); }
	/**
	 * Set the search elapsed time value and update stat in status bar.
	 * @param  {bool} value
	 */
	setSearchElapsed(value) { this.searchElapsed.value = value; this.updateStatNav(this.searchElapsed); }
	/**
	 * Add 1 to the total amount of searches fetched and update stat in status bar.
	 */
	addTotalSearchFetched() { this.totalSearchFetched.value++; this.updateStatNav(this.totalSearchFetched); }
	/**
	 * Add 1 to the total amount of PRE's found and update stat in status bar.
	 */
	addTotalSearchPRE() { this.totalSearchPREs.value++; this.updateStatNav(this.totalSearchPREs); }
	/**
	 * Set the total search hits value to value and update stat in status bar.
	 * @param  {number} value - The new value for the total number of hits in the database.
	 */
	addTotalSearchHits(value) { this.totalSearchHits.value = value; this.updateStatNav(this.totalSearchHits); }
	/**
	 * Set the total search results value to value and update stat in status bar.
	 * @param  {number} value - The new value for the total amount of hits found in one search result.
	 */
	addTotalSearchResults(value) { this.totalSearchResults.value = value; this.updateStatNav(this.totalSearchResults); }
}
