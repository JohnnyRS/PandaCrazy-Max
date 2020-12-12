/** This class collects stats for pandas and displays it on the panda card.
 * It also takes care of the stat database for the panda.
 * @class PandaStats ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaStats {
  /**
   * @param  {number} myId     - The unique number for the panda using these stats.
   * @param  {number} dbId     - The database unique number for the panda using these stats.
   * @param  {string} accepted - String used for the accepted stats text.
   * @param  {string} fetched  - String used for the fetched stats text.
   */
  constructor(myId, dbId, accepted, fetched) {
    this.myId = myId;                         // The unique ID for this panda job.
    this.dbId = dbId;                         // The unique database ID for this panda job.
    this.collecting = false;                  // Is this panda collecting or not?
		this.searching = false;
		this.searchCollecting = false;
    this.collectStart = null;                 // Time that this panda started the collecting session.
    this.collectAccepted = 0;                 // The number of HITs accepted for a collecting session.
    this.secondsCollecting = 0;               // The seconds collecting for a collecting session.
    this.dailyAccepted = 0;                   // The number of accepted HITs today.
    this.fetched = { 'value':0, 'session':0, 'id':'#pcm-hitFetched', 'class':'.pcm-hitFetched', 'label':'Fetched', 'id1':'#pcm-hitFetched1' };
    this.accepted = { 'value':0, 'id':'#pcm-hitAccepted', 'class':'.pcm-hitAccepted', 'label':'Acc', 'id1':'#pcm-hitAccepted1' };
    this.noMore = { 'value':0, 'id':'#pcm-hitNoMore', 'class':'.pcm-hitNoMore', 'label':'NM', 'id1':'#pcm-hitNoMore1' };
    this.prepare(accepted, fetched);
    this.updateAllStats();
  }
  /** Prepares the card stats with the accepted and fetched text.
   * @param {string} accepted - Accepted Stat Text  @param {string} fetched - Fetched Stat text */
  prepare(accepted, fetched) { this.acceptedStatusText = accepted; this.fetchedStatusText = fetched; }
  /** Will return the number of accepted HITs from this panda job for this day.
   * @return {number} - The number of accepted HITs for this day. */
  getDailyAccepted() { return this.dailyAccepted; }
  /** Will reset any daily stats if a new day has happened.
   * @param  {number} [total] - Total number for daily accepted HITs. */
  setDailyStats(total=0) { this.dailyAccepted = total; }
  /** Stores the data in the collect stats database for collecting times of panda jobs.
   * @param  {object} data - The data to store in the database stats for collecting. */
  collectStatsDB(data) { MYDB.addToDB('stats',_, data).then( () => {} ); }
  /** Stores the data in the accepted stats database for accepted HITs times of panda jobs.
   * @param  {object} data - The data to store in the database stats for accepted HITs. */
  acceptedStatsDB(data) { MYDB.addToDB('stats', 'accepted', data).then( () => {} ); }
  /** Deletes all stats for panda with the unique id from the panda stats database.
   * @param  {number} dbId - The database id of the panda to delete all stats from. */
  deleteIdFromDB(dbId) {
		MYDB.deleteFromDB('stats',_, dbId, 'dbId').then( null, (rejected) => console.error(rejected));
		MYDB.deleteFromDB('stats', 'accepted', dbId, 'dbId').then( null, (rejected) => console.error(rejected));
  }
  /** Updates all the stats in the panda card.
   * @param  {object} [card] - Jquery Card Object */
  updateAllStats(card=null) {
    if (card) {
      card.document.find(`.pcm-hitStats`).css('cursor', 'default');
      card.document.find(`${this.accepted.class}`).html(`${this.acceptedStatusText}: ${this.accepted.value}`);
      card.document.find(`${this.fetched.class}`).html(`${this.fetchedStatusText}: ${this.fetched.value}`);
    } else {
      $(`${this.accepted.id}-${this.myId}`).html(`${this.acceptedStatusText}: ${this.accepted.value}`);
      $(`${this.fetched.id}-${this.myId}`).html(`${this.fetchedStatusText}: ${this.fetched.value}`);
      $(`${this.accepted.id1}-${this.myId}`).html(`${this.acceptedStatusText}: ${this.accepted.value}`);
      $(`${this.fetched.id1}-${this.myId}`).html(`${this.fetchedStatusText}: ${this.fetched.value}`);
    }
  }
  /** Update a specific stat on the panda card.
   * @param  {object} statObj - Object of the stat to update on the panda card. */
  updateHitStat(statObj) {
		$(`${statObj.id}-${this.myId}`).html(`${statObj.label}: ${statObj.value}`);
		$(`${statObj.id1}-${this.myId}`).html(`${statObj.label}: ${statObj.value}`);
  }
  /** Adds the time it was collecting to the total seconds collecting for session.
   * @param  {dateTime} end - The Date that collecting has stopped. */
  addToSeconds(end) { this.secondsCollecting += Math.floor( (end - this.collectStart) / 1000); }
  /** Adds the start time and end time for this panda that was collecting in the stats database.
   * @param  {dateTime} end - The Date that collecting has stopped. */
  addTocollectTimes(end) { this.collectStatsDB( {'dbId':this.dbId, 'start':this.collectStart, 'end':end} ); }
  /** Adds the time a HIT was accepted to the stats database. */
  addToacceptedTimes() { this.acceptedStatsDB( {'dbId':this.dbId, 'date':new Date().getTime()} ); }
  /** Adds 1 to the fetched counter for this panda and updates stat on the panda card. */
  addFetched() { this.fetched.value++; this.fetched.session++; this.updateHitStat(this.fetched); }
  /** Returns the fetched value for this collected session.
   * @return {number} - The value of the number of fetches made in the collected session. */
  getFetchedSession() { return this.fetched.session; }
  /** Adds 1 to the total accepted and collected session for this panda and updates stat on the panda card. Saves to database too.*/
  addAccepted() { this.accepted.value++; this.dailyAccepted++; this.addToacceptedTimes(); this.collectAccepted++; this.updateHitStat(this.accepted); }
  /** Adds 1 to the total no mores for this panda and updates stat on the panda card. */
  addNoMore() { this.noMore.value++; this.updateHitStat(this.noMore); }
  /** Starts the stats for this collecting session. */
  startCollecting() { this.collecting = true; this.collectStart = new Date().getTime(); this.collectAccepted = 0; this.fetched.session = 0; }
  /** Add the collecting time for this session to the stats database and resets stat values.
   * @return {object} - Returns the seconds and accepted stats for this collecting session. */
  stopCollecting() {
    const ended = new Date().getTime(); this.collecting = false;
    this.addToSeconds(ended); this.addTocollectTimes(ended); this.collectStart = null;
    return {'seconds':this.secondsCollecting, 'accepted':this.collectAccepted};
  }
	/** Sets or returns value of the searching status.
	 * @param  {bool} [val] - The status to set the searching status.
   * @return {object} - Returns value of the searching status. */
	doSearching(val=null) { if (val !== null) this.searching = val; return this.searching; }
	/** Sets or returns value of the search collecting status.
	 * @param  {bool} [val] - The status to set the search collecting status.
   * @return {object} - Returns value of the search collecting status. */
	doSearchCollecting(val=null) { if (val !== null) this.searchCollecting = val; return this.searchCollecting; }
	/** Sets or returns value of the collecting status.
	 * @param  {bool} [val] - The status to set the collecting status.
   * @return {object} - Returns value of the collecting status. */
	doCollecting(val=null) { if (val !== null) this.collecting = val; return this.collecting; }
}