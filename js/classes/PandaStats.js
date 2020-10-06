/** This class collects stats for pandas and displays it on the panda card.
 * It also takes care of the stat database for the panda.
 * @class PandaStats
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaStats {
  /**
 * @param  {number} myId - The unique number for the panda using these stats.
 * @param  {number} dbId - The database unique number for the panda using these stats.
   */
  constructor(myId, dbId) {
    this.myId = myId;                         // The unique ID for this panda job.
    this.dbId = dbId;                         // The unique database ID for this panda job.
    this.collecting = false;                  // Is this panda collecting or not?
		this.searching = false;
		this.searchCollecting = false;
    this.collectStart = null;                 // Time that this panda started the collecting session.
    this.collectAccepted = 0;                 // The number of hits accepted for a collecting session.
    this.secondsCollecting = 0;               // The seconds collecting for a collecting session.
    this.dailyAccepted = 0;                   // The number of accepted hits today.
    this.fetched = { value:0, session:0, id:'#pcm_hitFetched', class:'.pcm_hitFetched', label:'Fetched', id2:'#pcm_hitFetched1' };
    this.accepted = { value:0, id:'#pcm_hitAccepted', class:'.pcm_hitAccepted', label:"Acc", id2:'#pcm_hitAccepted1' };
    this.noMore = { value:0, id:'#pcm_hitNoMore', class:'.pcm_hitNoMore', label:'NM', id2:'#pcm_hitNoMore1' };
    this.updateAllStats();
  }
  /** Will return the number of accepted hits from this panda job for this day.
   * @return {number} - The number of accepted hits for this day. */
  getDailyAccepted() { return this.dailyAccepted; }
  /** Will reset any daily stats if a new day has happened.
   * @param  {number} [total=0] - Total number for daily accepted hits. */
  setDailyStats(total=0) { this.dailyAccepted = total; }
  /** Stores the data in the collect stats database for collecting times of panda jobs.
   * @param  {object} data - The data to store in the database stats for collecting. */
  collectStatsDB(data) { MYDB.addToDB('stats',_, data).then( () => {} ); }
  /** Stores the data in the accepted stats database for accepted hits times of panda jobs.
   * @param  {object} data - The data to store in the database stats for accepted hits. */
  acceptedStatsDB(data) { MYDB.addToDB('stats', 'accepted', data).then( () => {} ); }
  /** Deletes all stats for panda with the unique id from the panda stats database.
   * @param  {number} dbId - The database id of the panda to delete all stats from. */
  deleteIdFromDB(dbId) {
		MYDB.deleteFromDB('stats',_, dbId, "dbId")
    .then( null, (rejected) => console.error(rejected));
		MYDB.deleteFromDB('stats', 'accepted', dbId, "dbId")
    .then( null, (rejected) => console.error(rejected));
  }
  /** Updates all the stats in the panda card. */
  updateAllStats(card=null) {
    if (card) {
      card.document.find(`.pcm_hitStats`).css('cursor', 'default');
      card.document.find(`${this.accepted.class}`).html(`${this.accepted.label}: ${this.accepted.value}`);
      card.document.find(`${this.fetched.class}`).html(`${this.fetched.label}: ${this.fetched.value}`);
    } else {
      $(`${this.accepted.id}_${this.myId}`).html(`${this.accepted.label}: ${this.accepted.value}`);
      $(`${this.fetched.id}_${this.myId}`).html(`${this.fetched.label}: ${this.fetched.value}`);
      $(`${this.accepted.id2}_${this.myId}`).html(`${this.accepted.label}: ${this.accepted.value}`);
      $(`${this.fetched.id2}_${this.myId}`).html(`${this.fetched.label}: ${this.fetched.value}`);
    }
  }
  /** Update a specific stat on the panda card.
   * @param  {object} statObj - Object of the stat to update on the panda card. */
  updateHitStat(statObj) {
		$(`${statObj.id}_${this.myId}`).html(`${statObj.label}: ${statObj.value}`);
		$(`${statObj.id2}_${this.myId}`).html(`${statObj.label}: ${statObj.value}`);
  }
  /** Adds the time it was collecting to the total seconds collecting for session.
   * @param  {dateTime} end - the Date that collecting has stopped. */
  addToSeconds(end) { this.secondsCollecting += Math.floor( (end - this.collectStart) / 1000); }
  /** Adds the start time and end time for this panda that was collecting in the stats database.
   * @param  {dateTime} end */
  addTocollectTimes(end) { this.collectStatsDB( {dbId:this.dbId, start:this.collectStart, end:end} ); }
  /** Adds the time a hit was accepted to the stats database. */
  addToacceptedTimes() { this.acceptedStatsDB( {dbId:this.dbId, date:new Date().getTime()} ); }
  /** Adds 1 to the fetched counter for this panda and updates stat on the panda card. */
  addFetched() { this.fetched.value++; this.fetched.session++; this.updateHitStat(this.fetched); }
  /** Returns the fetched value for this collected session.
   * @return {number} - The value of the number of fetches made in the collected session. */
  getFetchedSession() { return this.fetched.session; }
  /** Adds 1 to the total accepted and collected session for this panda and updates stat on the panda card.
   * Also adds the accepted time in the stats database. */
  addAccepted() {
    this.accepted.value++; this.dailyAccepted++; this.addToacceptedTimes();
    this.collectAccepted++; this.updateHitStat(this.accepted);
  }
  /** Adds 1 to the total no mores for this panda and updates stat on the panda card. */
  addNoMore() { this.noMore.value++; this.updateHitStat(this.noMore); }
  /** Starts the stats for this collecting session. */
  startCollecting() {
    this.collecting = true; this.collectStart = new Date().getTime();
    this.collectAccepted = 0; this.fetched.session = 0;
  }
  /** Add the collecting time for this session to the stats database and resets stat values.
   * @return {object} - Returns the seconds and accepted stats for this collecting session. */
  stopCollecting() {
    const ended = new Date().getTime(); this.collecting = false;
    this.addToSeconds(ended); this.addTocollectTimes(ended); this.collectStart = null;
    return {seconds:this.secondsCollecting, accepted:this.collectAccepted};
  }
	/** Sets or returns the value of the searching status.
	 * @param  {bool} val=null - The status to set the searching status or return status if null. */
	doSearching(val=null) { if (val !== null) this.searching = val; return this.searching; }
	/** Sets or returns the value of the search collecting status.
	 * @param  {bool} val=null - The status to set the search collecting status or return status if null. */
	doSearchCollecting(val=null) { if (val !== null) this.searchCollecting = val; return this.searchCollecting; }
	/** Sets or returns the value of the collecting status.
	 * @param  {bool} val=null - The status to set the collecting status or return status if null. */
	doCollecting(val=null) { if (val !== null) this.collecting = val; return this.collecting; }
}