/** Class for using datbases with promises for operations so it can wait for completion of function.
 * @class DatabaseClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class DatabaseClass {
  /**
   * @param {string} dbName      Name of the database to be used.
   * @param {number} dbVersion   Version number for this database.
   */
  constructor(dbName, dbVersion) {
    this.db = null;                 // Database variable to the indexedDB object.
    this.dbName = dbName;           // Database name for the indexedDB object.
    this.dbVersion = dbVersion;     // Database version for the indexedDB object.
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
  }
  /** Test the database to make sure there are stores available.
   * @Return {promise} - Resolves with 'good' or rejects with 'bad'. */
  testDB() {
    return new Promise( (resolve, reject) => {
      let request = this.indexedDB.open( this.dbName, this.dbVersion );
      request.onsuccess = () => { if (request.result.objectStoreNames.length === 0) { request.result.close(); reject('bad'); } else resolve('good'); };
      request.onerror = () => { request.result.close(); reject('bad'); }
    });
  }
  /** Opens this database using dbName and dbVersion properties of class.
   * Assigns db property to opened database request.
   * @param {bool} deleteFirst - Delete database before opening or creating it?
   * @param {function} upgrade - Function to be used when upgrade is needed because newer version.
   * @return {promise}         - Database version in resolve. Error object in reject. */
  openDB(deleteFirst, upgrade) {
    return new Promise( (resolve, reject) => {
      if (!this.indexedDB) reject(new Error("indexedDB is Not supported"));
      else {
        if (deleteFirst) { // Used to delete database before opening so upgrade is used.
          let deleteRequest = this.indexedDB.deleteDatabase( this.dbName );
          deleteRequest.onerror = () => { // If request to delete fails then send error to console.
            console.error(new Error(`Delete: ${this.dbName} error: ${deleteRequest.error.message}`));
          }
        }
        let openRequest = this.indexedDB.open( this.dbName, this.dbVersion );
        openRequest.onupgradeneeded = e => { upgrade(e); } // if need to upgrade then call upgrade function
        openRequest.onsuccess = () => { this.db = openRequest.result; resolve("OPENED"); } // set database pointer
        openRequest.onerror = () => { reject(new Error(`Open: ${this.dbName} error: ${openRequest.error.message}`)); }
        openRequest.onabort = () => { reject(new Error(`Open: ${this.dbName} error: ${openRequest.error.message}`)); }
      }  
    });
  }
  /** Adds data to database with a key in data or next key available.
   * @param {string} storeName      - Store name to be used for adding data to.
   * @param {object} data           - Data to be added to the store name database.
   * @param {bool} [update=false]   - True to use put for add or update. False to use add only.
   * @param {bool} [multiple=false] - Does the data object have multiple items to add?
   * @return {promise}              - Database key or new key in resolve. Error object in reject. */
  addToDB(storeName, mData) {
    return new Promise( (resolve, reject) => {
      let newId = null, tx = this.db.transaction( [storeName], "readwrite" );
      let datas = (Array.isArray(mData)) ? mData : [mData], storage = tx.objectStore(storeName);
      for (const data of datas) {  storage.put(data).onsuccess = (e) => { data.id = newId = e.target.result; } }
      tx.onabort = () => { reject(new Error(`Add to: ${storeName} error: ${tx.error.message}`)); }
      tx.oncomplete = () => { resolve( (datas.length > 1) ? -1 : newId ); }
    });
  }
  /** Get an array or object of items from database with a key.
   * @param {string} storeName           - Store name to be used for adding data to.
   * @param {string} key                 - Get the item with this key.
   * @return {promise}                   - Array or object in resolve. Error object in reject. */
  getFromDB(storeName, key=null) {
    return new Promise( (resolve, reject) => {
      let tx = this.db.transaction( [storeName], "readonly" );
      let store = tx.objectStore( storeName );
      let request = (key) ? store.get(key) : store.getAll(); // Open cursor or just get an item?
      request.onsuccess = () => resolve(request.result);
      request.onabort = e => { reject(new Error(`Get from: ${storeName} error: ${request.error.message}`)); }
    });
  }
  /** Delete an item or items from a database with a key using an index if necessary.
   * @param {string} storeName        - Store name to be used for adding data to.
   * @param {string} key              - Delete the item with this key.
   * @param {string} [indexName=null] - Use index name and delete all items with key.
   * @return {promise}                - Key in resolve. Error object in reject. */
  deleteFromDB(storeName, key, indexName=null) {
    return new Promise( (resolve, reject) => {
      let completed = false, error = '';
      let tx = this.db.transaction( [storeName], "readwrite" );
      let store = tx.objectStore(storeName);
      if (indexName) { // Should an index be used for the key?
        const index = store.index(indexName);
        const listDel = index.getAllKeys(key); // Get all items with this key in index.
        listDel.onsuccess = e => { completed = true; listDel.result.forEach(mainKey => { store.delete(mainKey); }); }
        listDel.onerror = e => { error = listDel.error.message; } // Error when problems with index happen.
      } else {
        let count = store.count(key); count.onsuccess = () => { // Get number of items with Key
          if (count.result > 0 && key !== null) { const request = store.delete(key); request.onsuccess = () => { completed = true; } }
          else if (key === null) { store.clear(); completed = true; }
          else { error = `Key: [${key}] not found in ${storeName}`; } // Error if key not found.
        }
      }
      tx.onabort = e => { reject(new Error(`Del from: ${storeName} error: ${tx.error.message}`)); }
      tx.oncomplete = e => {
        if (completed) resolve(key); else reject(new Error(`Del from: ${storeName} error: ${error}`));
      }
    });
  }
  /** Clear the data from a store name in this database.
   * @param  {string} storeName - Store name to be used for adding data to.
   * @return {promise}          - Key in resolve. Error object in reject. */
  clearStore(storeName) {
    return new Promise( (resolve, reject) => {
      let tx = this.db.transaction( [storeName], "readwrite" );
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => { resolve(true); }
      tx.onabort = () => { reject(new Error(`Clear from: ${storeName} error: ${tx.error.message}`)); }
    });
  }
  /** Close the database. Usually before deleting it for complete reset. */
  closeDB() { this.db.close(); }
}