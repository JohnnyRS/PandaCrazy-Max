/**
 * This class collects stats for pandas and displays it on the panda card.
 * It also takes care of the stat database for the panda.
 * @class PandaStats
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class PandaStats {
  /**
 * @param  {number} myId - The unique number for the panda using these stats.
 * @param  {number} dbId - The database unique number for the panda using these stats.
   */
  constructor(myId, dbId) {
    this.myId = myId;                         // The unique ID for this panda job.
    this.dbId = dbId;                         // The unique database ID for this panda job.
    this.collecting = false;                  // Is this panda collecting or not?
    this.collectStart = null;                 // Time that this panda started the collecting session.
    this.collectAccepted = 0;                 // The number of hits accepted for a collecting session.
    this.secondsCollecting = 0;               // The seconds collecting for a collecting session.
    this.collectStore = "collectionStore";    // The store name for the collection stat storage.
    this.acceptedStore = "acceptedStore";     // The store name for the accepted stat storage.
    this.fetched = { value:0, id:"#pcm_hitFetched", label:"Fetched" };
    this.accepted = { value:0, id:"#pcm_hitAccepted", label:"Acc" };
    this.noMore = { value:0, id:"#pcm_hitNoMore", label:"NM" };
    this.updateAllStats();
  }
  /**
   * Stores the data in the collect stats database for collecting times of panda jobs.
   * @param  {object} data - The data to store in the database stats for collecting.
   */
  collectStatsDB(data) { pandaUI.dbStats.addToDB( this.collectStore, data ).then( () => {} ); }
  /**
   * Stores the data in the accepted stats database for accepted hits times of panda jobs.
   * @param  {object} data - The data to store in the database stats for accepted hits.
   */
  acceptedStatsDB(data) { pandaUI.dbStats.addToDB( this.acceptedStore, data ).then( () => {} ); }
  /**
   * Deletes all stats for panda with the unique id from the panda stats database.
   * @param  {number} dbId - The database id of the panda to delete all stats from.
   */
  deleteIdFromDB(dbId) {
		pandaUI.dbStats.deleteFromDB(this.collectStore, dbId, "dbId")
    .then( null, (rejected) => console.error(rejected));
		pandaUI.dbStats.deleteFromDB(this.acceptedStore, dbId, "dbId")
    .then( null, (rejected) => console.error(rejected));
  }
  /**
   * Updates all the stats in the panda card.
   */
  updateAllStats() {
		$(`${this.accepted.id}_${this.myId}`).html(`${this.accepted.label}: ${this.accepted.value}`);
		$(`${this.fetched.id}_${this.myId}`).html(`${this.fetched.label}: ${this.fetched.value}`);
  }
  /**
   * Update a specific stat on the panda card.
   * @param  {object} statObj - Object of the stat to update on the panda card.
   */
  updateHitStat(statObj) {
		$(`${statObj.id}_${this.myId}`).html(`${statObj.label}: ${statObj.value}`);
  }
  /**
   * Adds the time it was collecting to the total seconds collecting for session.
   * @param  {dateTime} end - the Date that collecting has stopped.
   */
  addToSeconds(end) { this.secondsCollecting += Math.floor( (end - this.collectStart) / 1000); }
  /**
   * Adds the start time and end time for this panda that was collecting in the stats database.
   * @param  {dateTime} end
   */
  addTocollectTimes(end) { this.collectStatsDB( {dbId:this.dbId, start:this.collectStart, end:end} ); }
  /**
   * Adds the time a hit was accepted to the stats database.
   */
  addToacceptedTimes() { this.acceptedStatsDB( {dbId:this.dbId, date:new Date().getTime()} ); }
  /**
   * Adds 1 to the fetched counter for this panda and updates stat on the panda card.
   */
  addFetched() { this.fetched.value++; this.updateHitStat(this.fetched); }
  /**
   * Adds 1 to the total accepted and collected session for this panda and updates stat on the panda card.
   * Also adds the accepted time in the stats database.
   */
  addAccepted() {
    this.accepted.value++; this.addToacceptedTimes();
    this.collectAccepted++; this.updateHitStat(this.accepted);
  }
  /**
   * Adds 1 to the total no mores for this panda and updates stat on the panda card.
   */
  addNoMore() { this.noMore.value++; this.updateHitStat(this.noMore); }
  /**
   * Starts the stats for this collecting session.
   */
  startCollecting() { this.collecting = true; this.collectStart = new Date().getTime(); this.collectAccepted = 0; }
  /**
   * @typedef {object} returnStats
   * @property {number} seconds  - The seconds the collection session was collecting.
   * @property {number} accepted - The number of accepted hits in the collection session.
   */
  /**
   * Add the collecting time for this session to the stats database and resets stat values.
   * @return {returnStats} - Returns the seconds and accepted stats for this collecting session.
   */
  stopCollecting() {
    const ended = new Date().getTime(); this.collecting = false;
    this.addToSeconds(ended); this.addTocollectTimes(ended); this.collectStart = null;
    return {seconds:this.secondsCollecting, accepted:this.collectAccepted};
  }
}