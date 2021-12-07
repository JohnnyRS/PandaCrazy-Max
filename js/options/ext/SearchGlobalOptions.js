/** Class for the global options and methods to change them. Breaks up the options into general, timers and alarm options.
 * @class SearchGOptions ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
 class SearchGOptions {
  /**
   * @param {object} pcm_channel - The Broadcast channel used for this class.
  **/
  constructor(pcm_channel) {
    this.general = {};              // The general object used in script from database or default values.
    this.timers = {};               // The timers object used in script from database or default values.
    this.timerRange = {};           // The limits for the timer in milliseconds when editing.
    this.timerHamDur = {}           // The limits for the ham duration in milliseconds.
    this.timerQueue = {};           // The limits for the timer queue in milliseconds when editing.
    this.timerSearch = {};          // The limits for the timer queue in milliseconds when editing.
    this.alarms = {};               // The alarms object used in script from database or default values.
    this.search = {}                // The search object used in script from database or default values.
    this.pcm_channel = pcm_channel; // Holds the Broadcast channel used for this class.
  }
  /** Changes the option with the option name and changes object. Will update database if update is true.
   * @param  {string} optionName - Option name.  @param  {object} changes - The changes.  @param  {bool} [update] - Should update?
  **/
  doChanges(optionName, changes, update=true) { this[optionName] = changes; if (update) this.update(optionName); }
  /** Changes the timers options with the changes object and updates database if update is true.
   * @param  {object} [changes] - Object changes.  @param  {bool} [update] - Update database?
   * @return {object}           - Timers options object.
  **/
  doTimers(changes=null, update=true) { if (changes) this.doChanges('timers', changes, update); else return this.timers; }
  /** Changes the general options with the changes object and updates database if update is true.
   * @param  {object} [changes] - Object changes.  @param  {bool} [update] - Update database?
   * @return {object}           - General options object.
  **/
  doGeneral(changes=null, update=true) { if (changes) this.doChanges('general', changes, update); else return this.general; }
  /** Changes the search options with the changes object and updates database if update is true.
   * @param  {object} [changes] - Object changes.  @param  {bool} [update] - Update database?
   * @return {object}           - Search options object.
  **/
  doSearch(changes=null, update=true) { if (changes) this.doChanges('search', changes, update); else return this.search; }
  /** Changes the alarms options with the changes object and updates database if update is true.
   * @param  {object} [changes] - Object changes.  @param  {bool} [update] - Update database?
   * @return {object}           - Alarms options object.
  **/
  doAlarms(changes=null, update=true) { if (changes) this.doChanges('alarms', changes, update); else return this.alarms; }
  /** Returns the search timer range.
   * @return {object} - Returns search timer range.
  **/
  getTimerSearch() { return this.timerSearch; }
  /** Removes data from memory so it's ready for closing or importing. **/
  removeAll() { this.general = {}; this.timers = {}; this.alarms = {}; this.helpers = {}; this.search = {}; }
  /** Sends message back to the main global options class to save the options to the database.
   * @param  {string} optName - Name of option to save or null for all.
  **/
  update(optName=null) {
    this.pcm_channel.postMessage({'msg':'search: updateOptions', 'object':{'general':this.general, 'search':this.search, 'timers':this.timers, 'alarms':this.alarms, 'toDo':optName}});
  }
  /** Are the notifications enabled?
   * @return {bool} - True if notifications are enabled.
  **/
  isNotifications() { if (this.general) return !this.general.disableNotifications; else return null; }
  /** Get the ham delay time to use for new HITs when goHam gets turned on.
   * @return {number} - Returns the value for the ham delay timer.
  **/
  getHamDelayTimer() { return this.timers.hamDelayTimer; }
  /** Sets or gets the value for the to SearchUI option value.
   * @param  {bool} [value] - Searches to SearchUI?  @param  {bool} [update] - Save to database?
   * @return {bool}         - Returns the value for the to SearchUI option value.
   **/
  theToSearchUI(value=null, update=true) { if (value !== null) { this.general.toSearchUI = value; if (update) this.update('general'); } return this.general.toSearchUI; }
  /** Sets or gets the value for the search timer value.
   * @param  {number} [value] - Search timer value.  @param  {bool} [update] - Save to database?
   * @return {number}         - Returns the value for the search timer.
  **/
  theSearchTimer(value=null, update=true) { if (value !== null) { this.timers.searchTimer = value; if (update) this.update('timers'); } return this.timers.searchTimer; }
  /** Sets or Gets the value of the volume.
   * @param  {number} [vol] - The value of the volume to change or null to return current value.
   * @return {number}       - Returns the value of the volume.
  **/
  theVolume(vol=null) { if (vol) { this.alarms.volume = vol; this.update('alarms'); } return this.alarms.volume; }
  /** Changes the theme index to the value given or returns the current theme index.
   * @param  {number} [value] - Theme index value.
   * @return {string}         - Current theme index.
  **/
  theThemeIndex(value=null) { if (value !== null) { this.general.themeIndex = value; this.update('general'); } else return this.general.themeIndex; }
  /** Changes the CSS theme string for given index or the current theme string if index is null. Returns the theme string for given index or the current theme string if index is null.
   * @param  {number} [index]     - Theme index value.  @param  {string} [cssTheme] - Theme CSS value.  @param  {bool} [all] - Return all themes?
   * @return {null|object|string} - Returns current theme string or all objects or null if index is out of bounds.
  **/
  theThemes(index=null, cssTheme=null, all=false) {
    if (index !== null && (index < 0 || index > 3)) return null;
    let thisIndex = (index === null) ? this.general.themeIndex : index, thisTheme = `theme${thisIndex}`;
    if (cssTheme !== null) { this.general[thisTheme] = cssTheme; this.update('general'); }
    else if (all) return {'theme0':this.general['theme0'], 'theme1':this.general['theme1'], 'theme2':this.general['theme2'], 'theme3':this.general['theme3']};
    else return this.general[thisTheme];
  }
  /** Updates the ranges in this class with the ranges sent to this method.
   * @param {object} ranges - All the ranges in an object.
  **/
  doRanges(ranges) { this.timerRange = ranges.timerRange; this.timerHamDur = ranges.hamRange; this.timerQueue = ranges.queueRange; this.timerSearch = ranges.searchRange; }
  /** Sends a message back to the main global option class to send back the options data. */
  sendOptionsToSearch() { this.pcm_channel.postMessage({'msg':'search: sendOptionsToSearch'}); }
}
