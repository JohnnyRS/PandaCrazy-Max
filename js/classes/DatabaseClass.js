class DatabaseClass {
  constructor( dbName, dbVersion ) {
    this.db = null; // database pointer
    this.dbName = dbName; // name of database to be used
    this.dbVersion = dbVersion; // the version number for this database
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
  }
  openDB( deleteFirst, upgrade ) {
    return new Promise( (resolve, reject) => { // using a promise to make opening database synchronous so it waits
      if (!this.indexedDB) reject(Error("indexedDB is Not supported")); // if no indexedDB then big fail
      else {
        if (deleteFirst) { // used to delete database but temporary for testing purposes
          let deleteRequest = this.indexedDB.deleteDatabase( this.dbName ); // delete database
          deleteRequest.onerror = e => { console.log(e.target.error.message); } // show error if deleting database failed
        }
        let openRequest = this.indexedDB.open( this.dbName, this.dbVersion ); // try to open databse
        openRequest.onupgradeneeded = e => { upgrade(e); } // if need to upgrade then call upgrade function
        openRequest.onsuccess = e => { this.db = e.target.result; resolve("OPENED"); } // set database pointer on success
        openRequest.onerror = error => { reject(error); } // reject promise if open database failed
      }  
    });
  }
  addToDB( storeName, data, key=null ) {
    return new Promise( (resolve, reject) => { // using a promise to make adding to database synchronous so it waits
      let newId = null;
      let transaction = this.db.transaction( [storeName], "readwrite" ); // start tranasaction first with read/write
      let items = transaction.objectStore( storeName ); // create object store on transaction
      let request = (key) ? items.put(data) : items.add(data); // request to add data to object store
      request.onsuccess = e => { newId = e.target.result; } // 
      request.onerror = e => { } // do nothing on error because transaction onerror will take care of it
      transaction.onerror = e => { reject(e.target.error); } // reject promise if an error happened
      transaction.oncomplete = e => { resolve(newId); } // resolve promise on success
    });
  }
  updateDB(storeName, data, key) {
    this.addToDB( storeName, data, key ).then( (id) => { return id; } ).catch( (error) => console.log(error) );
  }
  getFromDB(storeName, toDo, key, doWithCursor=null, useArray=true) {
    return new Promise( (resolve, reject) => { // using a promise to make getting from database synchronous so it waits
      let myArray = [], myObject = {}, index = 0; // create an array and object to store the cursor data from database
      const toDoReturn = (useArray) ? myArray : myObject;
      let transaction = this.db.transaction( [storeName], "readonly" ); // start transaction first with read only
      let store = transaction.objectStore( storeName ); // create object store on transaction
      let request = (toDo==="cursor") ? store.openCursor() : store.get(key); // let's open a cursor on transaction
      request.onsuccess = (e) => { // on success get cursor and call doWithCursor function
        if (toDo==="cursor") {
          let cursor = e.target.result; // get cursor object
          if (cursor) {
            if (useArray) myArray.push(doWithCursor(cursor, index)); // add returned value to array
            else Object.assign(myObject, doWithCursor(cursor, index));
            index++;
            cursor.continue(); // continue with next cursor
          }
        } else resolve(e.target.result);
      };
      request.onerror = e => { } // do nothing on error because transaction onerror will take care of it
      transaction.onerror = e => reject(e.target.error); // reject promise if an error happened
      transaction.oncomplete = result => resolve( (toDo==="cursor") ? toDoReturn : result ); // resolve promise on success
    });
  }
  deleteFromDB(storeName, key, indexName=null) {
    return new Promise( (resolve, reject) => { // using a promise to make adding to database synchronous so it waits
      let transaction = this.db.transaction( [storeName], "readwrite" ); // start tranasaction first with read/write
      let store = transaction.objectStore(storeName); // create object store on transaction
      if (indexName) {
        const index = store.index(indexName);
        const listDel = index.getAllKeys(key);
        listDel.onsuccess = function(e) { e.target.result.forEach(mainKey => { store.delete(mainKey); }); }
        listDel.onerror = e => console.log(e.target.error);
      } else {
        const request = store.delete(key); // request to delete data from object store
        request.onsuccess = e => { } // do nothing on success
        request.onerror = e => { } // do nothing on error because transaction onerror will take care of it
      }
      transaction.onerror = e => { reject(e.target.error); } // reject promise if an error happened
      transaction.oncomplete = e => { resolve("Done"); } // resolve promise on success
    });
  }
}