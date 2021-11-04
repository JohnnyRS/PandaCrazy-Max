class ExtSearchUI {
  constructor(pcm_channel) {
    this.pcm_channel = pcm_channel;
		this.searchGStats = new SearchGStats();
  }
	addToUI(trigger, status, name, unique) { if (extSearchUI) extSearchUI.addToUI(trigger, status, name, unique); }
  nowLoggedOff() { if (extSearchUI) extSearchUI.nowLoggedOff(); }
  nowLoggedOn() { if (extSearchUI) extSearchUI.nowLoggedOn(); }
  updateStatNav(statObj, text='') { if (extSearchUI) extSearchUI.updateStatNav(statObj, text); }
  resetToolTips(enabled) { if (extSearchUI) extSearchUI.resetToolTips(enabled); }
  importing() { if (extSearchUI) extSearchUI.importing(); }
  importingDone() { if (extSearchUI) extSearchUI.importingDone(); }
  stopSearching() { if (extSearchUI) extSearchUI.stopSearching(); }
  statusMe(unique, status) { if (extSearchUI) extSearchUI.statusMe(unique, status); }
  updateStats(count, data) { if (extSearchUI) extSearchUI.updateStats(count, data); }
  triggeredHit(count, data, item, term, started, auto) { if (extSearchUI) extSearchUI.triggeredHit(count, data, item, term, started, auto); }
  redoFilters(type) { if (extSearchUI) extSearchUI.redoFilters(type); }
  appendFragments() { if (extSearchUI) extSearchUI.appendFragments(); }
  removeTrigger(count) { if (extSearchUI) extSearchUI.removeTrigger(count); }
  themeChanged() { if (extSearchUI) extSearchUI.themeChanged(); }

  isSearchUI() { return (extSearchUI !== null); }
  // Combo methods for specific multiple actions needed instead of sending multiple messages.
  moveToSearch(data, status, name, count, type) { }
}
