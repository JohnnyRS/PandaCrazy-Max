/** This class creates a Node to be used in the LRU cache class.
 * @class Node ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class Node {
  /**
   * @param  {string} key - Key for node.  @param  {object} value - Value for node.  @param {Node} [next] - Next node.  @param  {Node} [prev] - Previous node.
  **/
  constructor(key, value, next=null, prev=null) {
    this.key = key;       // The key set for this node.
    this.value = value;   // The value set for this node.
    this.next = next;     // The next node following this node.
    this.prev = prev;     // The previous node before this node.
  }
}

/** This class creates a LRU (Least Recently Used) cache by using a Doubly Linked List.
 * @class LRU ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class LRU {
  /**
   * @param  {number} [limit] - Maximum limit size of cache.  @param  {function} [gotDeleted] - Function to call when key gets removed due to limit size.
  **/
  constructor(limit=10, gotDeleted=null) {
    this.size = 0;                  // The current size of the LRU cache.
    this.limit = limit;             // The maximum limit size of the LRU cache.
    this.head = null;               // The head or first node in the cache.
    this.tail = null;               // The tail or last node in the cache.
    this.cacheMap = {};             // Holds all the keys that are saved in the cache now.
    this.unSaved = new Set();       // Holds all the keys that haven't been saved to the database.
    this.sendDeleted = gotDeleted;  // When a node gets deleted from the cache due to size limit then this function will be called with the key, value and unsaved flag.
  }

  /** Write the value with the key to the cache. Mark value saved with saved parameter and let it combine with previous existing value with concat parameter.
   * @param  {string} key    - Key for node.  @param  {object} value - Value of node.  @param  {bool} [saved] - Value saved already?
   * @param  {bool} [concat] - Should value be combined with the existing value?
  **/
  write(key, value, saved=true, concat=false) {
    const existingNode = this.cacheMap[key];                       // Check if key is in the cache map which means it should be replaced by new info.
    if (existingNode) { this.detach(existingNode); this.size--; }  // If node exists with this key then detach that node and reduce current size of cache.
    else if (this.size === this.limit) {                           // The LRU cache has reached it's limit.
      let deletingThis = this.cacheMap[this.tail.key], doSave = this.unSaved.has(this.tail.key);    // Save the value of the tail node and saved flag value.
      delete this.cacheMap[this.tail.key]; if (doSave) delete this.unSaved.delete(this.tail.key);   // Remove the tail key from cache map and unsaved Set.
      this.detach(this.tail); this.size--;                                                          // Detach node at the tail of the list and reduce current size of cache.
      if (this.sendDeleted) this.sendDeleted(this.tail.key, deletingThis.value, doSave);            // Call the sendDeleted function with the deleted node info.
    }
    if (concat && existingNode) value = Object.assign(value, existingNode.value);  // combine the existing node value to the new value if concat is true.
    if (!this.head) this.head = this.tail = new Node(key, value);                  // If nothing in cache then assign head and tail to the new node.
    else { const node = new Node(key, value, this.head); this.head.prev = node; this.head = node; } // Set old head previous node to this new node and the head as this new node.
    this.cacheMap[key] = this.head;    // Add the new key to the cache map.
    if (!saved) this.unSaved.add(key); // If value has not been saved to the database then add key to the unsaved Set.
    this.size++;                       // Increase size of LRU cache.
  }
  /** Finds a node with the given key and returns the value. Will also move the key node to the head of the list.
   * @param  {string} key  - Key value to find in cache.
   * @return {object|null} - Returns the value saved in the key node or null if not found in cache.
  **/
  read(key) {
    const existingNode = this.cacheMap[key];     // Check if key is in the cache map which means it exists in the cache.
    if (existingNode) {
      const value = existingNode.value;                              // Save value to return it.
      if (this.head !== existingNode) this.write(key, value, true);  // Update the existing node to the head position in the cache list.
      return value;                                                  // Return the value of the node.
    }
    else return null;                                                // Key not found in the cache.
  }
  /** Detach the following node from the cache list.
   * @param  {node} node - Node to detach from list.
  **/
  detach(node) {
    if (node.prev !== null) node.prev.next = node.next;   // Set the previous node next node as the next node of the detaching node.
    else this.head = node.next;                           // If node is at the head then mark next node as the head.
    if (node.next !== null) node.next.prev = node.prev;   // Set the next node previous node as the previous node of the detaching node.
    else this.tail = node.prev;                           // If node is at the tail then mark the previous node as the tail.
  }
  /** Clears out all nodes from the list by setting head and tail to null and reset all cache info. **/
  clear() { this.head = null; this.tail = null; this.size = 0; this.cacheMap = {}; this.unSaved.clear(); }
  /** Gets all the values of the unsaved nodes using the keys in the unsaved variable. Replaces the values with the clearValue or leaves it alone.
   * @param  {object} [clearValue] - The value to use to clear out the values.
   * @return {object}              - Returns the values for the unsaved nodes in an object with the key as the key for each value.
  **/
  getUnSaved(clearValue=null) {
    let theseValues = {};
    for (let key of this.unSaved) {
      let keyNode = this.cacheMap[key]; theseValues[key] = keyNode.value;   // Fill in the theseValues object with the values with the keys.
      if (clearValue !== null) keyNode.value = clearValue;                  // Replaces the values to the clearValue if it's not null.
    }
    this.unSaved.clear();                                                   // Clear out the keys in the unsaved Set.
    return theseValues;                                                     // Return the values of the keys in the unsaved Set.
  }
  limitChange(newLimit) {
    if (newLimit === this.limit) return null;
    else {
      let lowerLimit = (newLimit < this.size); this.limit = newLimit;
      if (lowerLimit) {                                                                           // Check if new limit is less than the current size.
        while (this.size !== this.limit) {                                                        // Do while the current size and new limit is not the same.
          let deletingThis = this.cacheMap[this.tail.key]; delete this.cacheMap[this.tail.key];   // Save the value of the tail node and delete it.
          this.detach(this.tail); this.size--;                                                    // Detach node at the tail of the list and reduce current size of cache.
          if (this.sendDeleted) this.sendDeleted(this.tail.key, deletingThis.value, false);       // Call the sendDeleted function with the deleted node info.
        }
      }
    }
  }
}
