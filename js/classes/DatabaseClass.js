/**
 * Class for using datbases with promises for operations so it can wait for completion of function.
 * @param {string} dbName      Name of the database to be used.
 * @param {number} dbVersion   Version number for this database.
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class DatabaseClass {
  constructor(dbName, dbVersion) {
    this.db = null; // Database variable to the indexedDB object.
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
  }
  /**
   * Opens this database using dbName and dbVersion properties of class.
   * Assigns db property to opened database request.
   * @param {bool} deleteFirst    Delete database before opening or creating it?
   * @param {function} upgrade    Function to be used when upgrade is needed because newer version.
   * @return {promise}            Database version in resolve. Error object in reject.
   */
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
  /**
   * Adds data to database with a key in data or next key available.
   * @param {string} storeName    Store name to be used for adding data to.
   * @param {object} data         Data to be added to the store name database.
   * @param {bool} update=false   True to use put for add or update data. False to use add only and error if key exists.
   * @return {promise}            Database key or new key in resolve. Error object in reject.
   */
  addToDB(storeName, data, update=false) {
    return new Promise( (resolve, reject) => {
      let newId = null;
      let transaction = this.db.transaction( [storeName], "readwrite" );
      let items = transaction.objectStore( storeName );
      let request = (update) ? items.put(data) : items.add(data);
      request.onsuccess = e => { newId = request.result; } // Set newId to the key used to add item.
      transaction.onabort = () => { reject(new Error(`Add to: ${storeName} error: ${transaction.error.message}`)); }
      transaction.oncomplete = () => { resolve(newId); }
    });
  }
  /**
   * Updates data in database with a key in data or if key not found then it adds data.
   * @param {string} storeName  Store name to be used for adding data to.
   * @param {object} data       Data to be added to the store name database.
   * @return {promise}          Database key or new key in resolve. Error object in reject.
   */
  updateDB(storeName, data) {
    return new Promise( (resolve, reject) => {
      this.addToDB( storeName, data, true ).then( id => { resolve(id); }, rejected => reject(rejected) );
    });
  }
  /**
   * Get an array or object of items from database with a key. Using arrays is by default.
   * @param {string} storeName            Store name to be used for adding data to.
   * @param {string} key                  Get the item with this key.
   * @param {bool} doCursor=false         Use cursor to get multiple items with the key.
   * @param {function} cursorFunc=null    Function to use for each item got with cursor.
   * @param {bool} useArray=true          Use array or false to save returned value from cursorFunc to object.
   * @return {promise}                    Array or object in resolve. Error object in reject.
   */
  getFromDB(storeName, key, doCursor=false, cursorFunc=null, useArray=true) {
    return new Promise( (resolve, reject) => {
      let myArray = [], myObject = {}, index = 0;
      let theResult = null;
      const returnThis = (useArray) ? myArray : myObject; // Return an array or object?
      let transaction = this.db.transaction( [storeName], "readonly" );
      let store = transaction.objectStore( storeName );
      let request = (doCursor) ? store.openCursor() : store.get(key); // Open cursor or just get an item?
      request.onsuccess = (e) => {
        if (doCursor) { // Get multiple items with cursor.
          let cursor = request.result;
          if (cursor) {
            if (useArray) myArray.push(cursorFunc(cursor, index)); // Add value from cursorFunc to an array.
            else Object.assign(myObject, cursorFunc(cursor, index)); // Add value from cursorFunc to an object.
            index++;
            cursor.continue();
          }
        } else theResult = request.result; // Return just the one item.
      };
      transaction.onabort = e => { reject(new Error(`Get from: ${storeName} error: ${transaction.error.message}`)); }
      transaction.oncomplete = () => resolve( (doCursor) ? returnThis : theResult );
    });
  }
  /**
   * Delete an item or items from a database with a key using an index if necessary.
   * @param {string} storeName        Store name to be used for adding data to.
   * @param {string} key              Delete the item with this key.
   * @param {string} indexName=null   Use index name and delete all items with key.
   * @return {promise}                Key in resolve. Error object in reject.
   */
  deleteFromDB(storeName, key, indexName=null) {
    return new Promise( (resolve, reject) => {
      let completed = false, error = "";
      let transaction = this.db.transaction( [storeName], "readwrite" );
      let store = transaction.objectStore(storeName);
      if (indexName) { // Should an index be used for the key?
        const index = store.index(indexName);
        const listDel = index.getAllKeys(key); // Get all items with this key in index.
        listDel.onsuccess = e => { completed = true; listDel.result.forEach(mainKey => { store.delete(mainKey); }); }
        listDel.onerror = e => { error = listDel.error.message; } // Error when problems with index happen.
      } else {
        let count = store.count(key); count.onsuccess = () => { // Get number of items with Key
          if (count.result>0) { const request = store.delete(key); request.onsuccess = () => { completed = true; } }
          else { error = `Key: [${key}] not found in ${storeName}`; } // Error if key not found.
        }
      }
      transaction.onabort = e => { reject(new Error(`Del from: ${storeName} error: ${transaction.error.message}`)); }
      transaction.oncomplete = e => {
        if (completed) resolve(key); else reject(new Error(`Del from: ${storeName} error: ${error}`));
      }
    });
  }
}