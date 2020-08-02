/**
 * Class dealing with history info of requester ID's and group ID's.
 * @class HistoryClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class HistoryClass {
  constructor() {
		this.dbHistoryName = "Pcm_History";		// Name of the database used for all storage.
    this.storeHistName = 'searchHistory';
    this.useDefault = false;
		this.db = new DatabaseClass(this.dbHistoryName, 1);  // Set up the search database class.
  }
  /** Opens the history database or creates it if not found.
   * @param  {bool} [del=true] - Delete database before opening it.
	 * @return {promise}         - Error if rejected. */
  openDB(del=true) {
		return new Promise( (resolve, reject) => {
    	this.db.openDB( del, (e) => {
				if (e.oldVersion === 0) { // Had no database so let's initialise it.
          let store1 = e.target.result.createObjectStore(this.storeHistName, {keyPath:'theId', autoIncrement:'false'});
          store1.createIndex('reqId', 'reqId', {unique:false});
          store1.createIndex('pay', 'pay', {unique:false});
          store1.createIndex('from', 'from', {unique:false});
          this.useDefault = true;
        }
      } ).then( response => resolve(response), rejected => { console.error(rejected); reject(rejected); });
		});
  }
	/** Updates the database with new data.
	 * @param  {object} newData - New data to be saved in database. */
	async updateToDB(newData) {
		if (this.db) {
			await this.db.addToDB(this.storeHistName, newData)
			.then(_, rejected => { extPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database usually when importing. */
	closeDB() { this.db.closeDB(); this.db = null; }
	/** Fill in the history database with the group ID and requester info from history object.
	 * @param  {object} history          - History object with all data.
	 * @param  {string} [from='unknown'] - Where data comes from. */
	async fillInHistory(history, from='unknown') {
		let newHits = {};
		for (const key of Object.keys(history)) {
			let item = history[key], hits = 1, nowDate = new Date();
			let reqKey = (item.reqId && item.reqId !== ''), theDate = (item.date) ? item.date : nowDate.toISOString();
			if (reqKey) newHits[item.reqId] = 0;
			if (key.charAt(0).toUpperCase() !== 'A') {
				let pay = (item.pay) ? item.pay : item.price, duration = item.duration | item.assignedTime;
				await this.updateToDB({'reqId':item.reqId, 'pay': pay, 'title': item.title, 'description':item.description, 'duration': duration, 'date': theDate, 'theId':key, 'from':from, 'updated':nowDate, 'filled':true});
			}
			if (reqKey) await this.updateToDB({'reqName':item.reqName, 'hits':hits, 'theId':item.reqId, 'from':from, 'updated':nowDate, 'filled':true});
		}
	}
}