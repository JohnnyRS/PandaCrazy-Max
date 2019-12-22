class PandaGroupings {
  constructor() {
    this.groupings = {};
    this.unique = 0;
  }
  addGroup(group, myIdInfo) { group[myIdInfo[0]] = {hamMode:myIdInfo[1]}; }
  addGroupings(name, description, additions, delayedStart=false) {
    this.groupings[this.unique] = {name:name, description:description, group:{}, sorted:[], delayedStart:delayedStart};
    additions.forEach(value => {
      this.addGroup(this.groupings[this.unique].group, value);
      this.groupings[this.unique].sorted.push(value[0]);
    });
    return this.unique++;
  }
  deleteGroupings(unique) { delete this.groupings[unique]; }
  startGroupings(unique) { return this.groupings[unique].group; }
  stopGroupings() { return this.groupings[unique].group; }
}