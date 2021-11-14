/** Class for the global options and methods to change them. Breaks up the options into general, timers and alarm options.
 * @class PandaGOptions ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
 class SearchGOptions {
  constructor(pcm_channel) {
    this.general = {};              // The general object used in script from database or default values.
    this.timers = {};               // The timers object used in script from database or default values.
    this.timerRange = {};           // The limits for the timer in milliseconds when editing.
    this.timerHamDur = {}           // The limits for the ham duration in milliseconds.
    this.timerQueue = {};           // The limits for the timer queue in milliseconds when editing.
    this.timerSearch = {};          // The limits for the timer queue in milliseconds when editing.
    this.alarms = {};               // The alarms object used in script from database or default values.
    this.search = {}                // The search object used in script from database or default values.
    this.pcm_channel = pcm_channel;
    pcm_channel.postMessage({'msg':'search: prepareGlobals'});
  }
  doChanges(optionName, changes, update=true) { this[optionName] = changes; if (update) this.update(); }
  doTimers(changes=null, update=true) { if (changes) this.doChanges('timers', changes, update); else return this.timers; }
  doGeneral(changes=null, update=true) { if (changes) this.doChanges('general', changes, update); else return this.general; }
  doSearch(changes=null, update=true) { if (changes) this.doChanges('search', changes, update); else return this.search; }
  doAlarms(changes=null, update=true) { if (changes) this.doChanges('alarms', changes, update); else return this.alarms; }
  /** Returns the search timer range.
   * @return  {object} - Returns Search Timer Range */
  getTimerSearch() { return this.timerSearch; }
  removeAll() { this.general = {}; this.timers = {}; this.alarms = {}; this.helpers = {}; this.search = {}; }
  update() { this.pcm_channel.postMessage({'msg':'search: updateOptions', 'object':{'general':this.general, 'search':this.search, 'timers':this.timers, 'alarms':this.alarms}}); }
  isNotifications() { if (this.general) return !this.general.disableNotifications; else return null; }
  /** Sets or gets the value for the to SearchUI option value.
   * @param  {bool} [value] - Searches to SearchUI?  @param {bool} [update] - Save to Database?
   * @return {bool}       - Returns the value for the to SearchUI option value. */
  theToSearchUI(value=null, update=true) { if (value !== null) { this.general.toSearchUI = value; if (update) this.update(); } return this.general.toSearchUI; }
  /** Sets or gets the value for the search timer value.
   * @param  {number} [value] - Search Timer Value  @param {bool} [update] - Save to Database?
   * @return {number}       - Returns the value for the search timer. */
  theSearchTimer(value=null, update=true) { if (value !== null) { this.timers.searchTimer = value; if (update) this.update(); } return this.timers.searchTimer; }
  theVolume(vol=null) { if (vol) { this.alarms.volume = vol; this.update(); } return this.alarms.volume; }
  theThemeIndex(value=null) { if (value !== null) { this.general.themeIndex = value; this.update(); } else return this.general.themeIndex; }
  theThemes(index=null, cssTheme=null, all=false) {
    if (index !== null && (index < 0 || index > 3)) return null;
    let thisIndex = (index === null) ? this.general.themeIndex : index, thisTheme = `theme${thisIndex}`;
    if (cssTheme !== null) { this.general[thisTheme] = cssTheme; this.update(); }
    else if (all) return {'theme0':this.general['theme0'], 'theme1':this.general['theme1'], 'theme2':this.general['theme2'], 'theme3':this.general['theme3']};
    else return this.general[thisTheme];
  }
  doRanges(ranges) { this.timerRange = ranges.timerRange; this.timerHamDur = ranges.hamRange; this.timerQueue = ranges.queueRange; this.timerSearch = ranges.searchRange; }
  sendOptionsToSearch() { this.pcm_channel.postMessage({'msg':'search: sendOptionsToSearch'}); }
  getHamDelayTimer() { return this.timers.hamDelayTimer; }
}
