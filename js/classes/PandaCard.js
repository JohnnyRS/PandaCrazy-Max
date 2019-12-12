class PandaCard {
  constructor(myId, pandaInfo, pandaStats) {
    this.myId = myId;
    this.pandaInfo = pandaInfo;
    this.cardObj = null;
    this.reqName = {valueName:"reqName", id:"#pcm_hitReqName", label:""};
    this.groupId = {valueName:"groupId", id:"#pcm_groupId", label:""};
    this.price = {valueName:"price", id:"#pcm_hitPrice", label:""};
    this.numbers = {valueName:"hitsAvailable", id:"#pcm_numbers", label:""};
    this.title = {valueName:"title", id:"#pcm_hitTitle", label:""};
    this.appendCard();
    this.updateAllCardInfo();
    //pandaStats.updateAllStats();
  }
  updateAllCardInfo() {
		$(`${this.reqName.id}_${this.myId}`).html(`${this.pandaInfo[this.reqName.valueName]}`);
		$(`${this.groupId.id}_${this.myId}`).html(`${shortenGroupId(this.pandaInfo[this.groupId.valueName])}`);
		$(`${this.price.id}_${this.myId}`).html(`${this.pandaInfo[this.price.valueName]}`);
		if (this.pandaInfo[this.numbers.valueName]>1) $(`${this.numbers.id}_${this.myId}`).html(`[${this.pandaInfo[this.numbers.valueName]}]`);
		$(`${this.title.id}_${this.myId}`).html(`${this.pandaInfo[this.title.valueName]}`);
  }
  createCardStatus() {
    let htmlCode = `<div class="pcm_hitStats" id="pcm_hitStats_${this.myId}">`;
    htmlCode += ` [ <span class="pcm_hitAccepted" id="pcm_hitAccepted_${this.myId}"></span> | <span class="pcm_hitFetched" id="pcm_hitFetched_${this.myId}"></span> ]`;
    htmlCode += `</div>`;
    return htmlCode;
  }
  createCardButtonGroup() {
    let htmlCode = `<div class="card-text" id="pcm_buttonGroup_${this.myId}">`;
    htmlCode += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_collectButton pcm_buttonOff shadow-none" id="pcm_collectButton_${this.myId}"><span>Collect</span></button>`;
    htmlCode += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_hamButton pcm_buttonOff shadow-none" id="pcm_hamButton_${this.myId}"><span>GoHam</span></button>`;
    htmlCode += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_detailsButton pcm_buttonOff shadow-none" id="pcm_detailsButton_${this.myId}"><span>Details</span></button>`;
    htmlCode += `<button class="btn btn-light btn-xs btn-outline-dark toggle-text pcm_hitButton pcm_deleteButton pcm_buttonOff shadow-none" id="pcm_deleteButton_${this.myId}"><span>X</span></button>`;
    htmlCode += `</div>`;
    return htmlCode;
  }
  createCard() {
    let htmlCode = `<div class="card text-light p-0 px-1 border mb-0 pcm_pandaCard" id="pcm_pandaCard_${this.myId}">`;
    htmlCode += `<div class="card-body p-0">`;
    htmlCode += `<div class="card-text p-0" id="output_${this.myId}">`;
    htmlCode += `<div class="pcm_nameGroup"><span class="pcm_reqName text-truncate" id="pcm_hitReqName_${this.myId}"></span>`;
    htmlCode += ` <span class="pcm_groupId text-truncate float-right" id="pcm_groupId_${this.myId}"></span></div>`;
    htmlCode += `<div class="pcm_priceGroup"><span class="pcm_price text-truncate" id="pcm_hitPrice_${this.myId}"></span>`;
    htmlCode += ` <span class="pcm_numbers text-truncate" id="pcm_numbers_${this.myId}"></span></div>`;
    htmlCode += `<div class="pcm_title text-truncate" id="pcm_hitTitle_${this.myId}"></div>`;
    htmlCode += this.createCardStatus();
    htmlCode += this.createCardButtonGroup();
    htmlCode += `</div></div></div>`;
    return htmlCode;
  }
  appendCard() {
    $(".pcm_pandaGroup").append(this.createCard());
  }
  removeCard(removeFunc) {
    $(`#pcm_pandaCard_${this.myId}`).effect('slide', { direction:'left', mode:'hide' }, 800, () => { 
      $(`#pcm_pandaCard_${this.myId}`).remove(); removeFunc.apply();
    });
  }
}