const bgPage = chrome.extension.getBackgroundPage(); // Get background page for extension
const searchUI = new SearchUI();
const bgSearchClass = bgPage.gSetSearchUI(searchUI);
const bgQueue = bgPage.gGetQueue();
const modal = new ModalClass(); // set up a modal class for a options, warnings or details
/**
 */
function startSearchCrazy() {
  window.addEventListener("beforeunload", (e) => { bgPage.gSetSearchUI(null); bgSearchClass.closedUI(); });
  searchUI.prepareSearch();
  bgSearchClass.addTrigger("rid", "ASOSP45W2WM03", {"name":"Job Spotter", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A15ZSKX8TUCGEU", {"name":"C-SATS, Inc", "duration": 60000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A1OVB3ATBAQ1KM", {"name":"Unanimous", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A2NPHK2GTUF78O", {"name":"Ipsoft", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "ALZUWU3P4QQSG", {"name":"Picsfromabove", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A8DQXJEVAM6JF", {"name":"Alegion", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A1KHBXVBU8SRQ0", {"name":"Ipsoft2", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A2CIK5WEHBJBNU", {"name":"Joe Lo", "duration": 10000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A2QKOWG2NKRJ2K", {"name":"Vacation Rental API", "duration": 20000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A2RAGWQ0G2TWAT", {"name":"Geohive Admin", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "AFEG4RKNBSL4T", {"name":"Ben Peterson", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A32BFAN07OQKZN", {"name":"Remesh", "duration": 10000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "AI2HRFAYYSAW7", {"name":"PickFu", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A1UZ1H4REEV6MR", {"name":"Peter Burke", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A3NVZ6RW9GT7CA", {"name":"Tim Kowalewski", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A33KPKIGB3LRZD", {"name":"SocialCat", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "ANER3VNU9AD0O", {"name":"Endor", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A1HLORNYQ43JYS", {"name":"Meghan Moore", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A3643USXULLFI2", {"name":"paul connor", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A19Y8N1023GB2R", {"name":"Emily Wilson", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A1X47GCK2IDEX3", {"name":"Marketing Team", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("rid", "A3S0VV664CKQDA", {"name":"Matthew Shardlow", "duration": 6000, "once":true, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", {"name":"Ibotta, Inc.", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3BDJRSQX56L109G3MO1MNB1V5GL8S5", {"name":"Javan Martin", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3HHMCOI47E84O2S8KPM5S1B08CHVSA", {"name":"Mturk Prod short video", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3YNFDCZ5R5PFFIJM3909SACR15RRNT", {"name":"Mturk Prod short video", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3S1POB7GVA8SY7OVNVNV1FUGCCLUQJ", {"name":"Mturk Prod short video", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3T6UNEUZ5USN3YJ7HC3S3YVC8S2911", {"name":"Panel compare", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "35DAEVU8JHJ10FFZ10EN4CRDQ8F870", {"name":"Panel (1-2 items)", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "35DAEVU8JHJ10FFZ10EN4CRDQ8N878", {"name":"Panel (1-2 items)", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3T6HLR4BXW65EY3SGXC7I8IJLT5985", {"name":"Panel (1-2 items)", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3L8V324VIVRQCOOFCXM8V9CTK3H9FD", {"name":"Panel (1-2 items)", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "37ZHE2JT1D250TKIB56TICN73UQ88W", {"name":"Panel Classify Receipt", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3T9YKFMCGXSGJFSWM9VI7I124UNC9X", {"name":"Michael Thaler", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "3D3X1L1OBIFIZZ22WGODAUDYQUR1VF", {"name":"EMP Lab", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
}
/**
 * @param  {string} title
 * @param  {string} message
 */
function displayError(title,message) {
  $(".pcm_top:first").html("");
  console.log(message); $('#pcm_searchTriggers .tab-content').html(`<H1 style="text-align:center;">${title}</H1><H5 style="color:#FF3333; text-align:center;">${message}</H5>`);
}
allTabs("/searchCrazy.html", count => { if (count<2) startSearchCrazy(); else {
  displayError(`Error starting SearchCrazy Page.`,`You have SearchCrazy Page running in another tab or window. You can't have multiple instances running or it will cause database problems.`);
}});
