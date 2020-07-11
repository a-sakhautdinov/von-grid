function LinkedListNode() {
  this.obj = null;
  this.next = null;
  this.prev = null;
  this.free = true;
}

function LinkedList() {
  this.first = null;
  this.last = null;
  this.length = 0;
  this.objToNodeMap = {}; // a quick lookup list to map linked list nodes to objects
  this.uniqueID = Date.now() + '' + Math.floor(Math.random()*1000);

  this.sortArray = [];
}

LinkedList.generateID = function() {
  return Math.random().toString(36).slice(2) + Date.now();
};

LinkedList.prototype = {
  constructor: LinkedList,

  getNode: function(obj) {
    return this.objToNodeMap[obj.uniqueID];
  },

  addNode: function(obj) {
    const node = new LinkedListNode();
    if (!obj.uniqueID) {
      try {
        obj.uniqueID = LinkedList.generateID();
        // console.log('New ID: '+obj.uniqueID);
      }
      catch (err) {
        console.error('[LinkedList.addNode] obj passed is immutable: cannot attach necessary identifier');
        return null;
      }
    }

    node.obj = obj;
    node.free = false;
    this.objToNodeMap[obj.uniqueID] = node;
    return node;
  },

  swapObjects: function(node, newObj) {
    this.objToNodeMap[node.obj.uniqueID] = null;
    this.objToNodeMap[newObj.uniqueID] = node;
    node.obj = newObj;
  },

  add: function(obj) {
    let node = this.objToNodeMap[obj.uniqueID];

    if (!node) {
      node = this.addNode(obj);
    }
    else {
      if (node.free === false) return;

      node.obj = obj;
      node.free = false;
      node.next = null;
      node.prev = null;
    }

    if (!this.first) {
      this.first = node;
      this.last = node;
      node.next = null;
      node.prev = null;
    }
    else {
      if (!this.last) {
        throw new Error("[LinkedList.add] No last in the list -- that shouldn't happen here");
      }

      this.last.next = node;
      node.prev = this.last;
      this.last = node;
      node.next = null;
    }
    this.length++;

    if (this.showDebug) this.dump('after add');
  },

  has: function(obj) {
    return !!this.objToNodeMap[obj.uniqueID];
  },

  moveUp: function(obj) {
    this.dump('before move up');
    let c = this.getNode(obj);
    if (!c) throw new Error("Oops, trying to move an object that isn't in the list");
    if (!c.prev) return; // already first, ignore

    // This operation makes C swap places with B:
    // A <-> B <-> C <-> D
    // A <-> C <-> B <-> D

    let b = c.prev;
    let a = b.prev;

    // fix last
    if (c === this.last) this.last = b;

    let oldCNext = c.next;

    if (a) a.next = c;
    c.next = b;
    c.prev = b.prev;

    b.next = oldCNext;
    b.prev = c;

    // check to see if we are now first
    if (this.first === b) this.first = c;
  },

  moveDown: function(obj) {
    let b = this.getNode(obj);
    if (!b) throw new Error("Oops, trying to move an object that isn't in the list");
    if (!b.next) return; // already last, ignore

    // This operation makes B swap places with C:
    // A <-> B <-> C <-> D
    // A <-> C <-> B <-> D

    let c = b.next;
    this.moveUp(c.obj);

    // check to see if we are now last
    if (this.last === c) this.last = b;
  },

  sort: function(compare) {
    let sortArray = this.sortArray;
    let i, l, node = this.first;
    sortArray.length = 0;

    while (node) {
      sortArray.push(node.obj);
      node = node.next;
    }

    this.clear();

    sortArray.sort(compare);
    // console.log(sortArray);
    l = sortArray.length;
    for (i = 0; i < l; i++) {
      this.add(sortArray[i]);
    }
  },

  remove: function(obj) {
    let node = this.getNode(obj);
    if (!node || node.free){
      return false;
    }

    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;

    if (!node.prev)
      this.first = node.next;
    if (!node.next)
      this.last = node.prev;

    node.free = true;
    node.prev = null;
    node.next = null;

    this.length--;

    return true;
  },

  shift: function() {
    let node = this.first;
    if (this.length === 0) return null;
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }

    this.first = node.next;
    if (!node.next) this.last = null;

    node.free = true;
    node.prev = null;
    node.next = null;

    this.length--;
    return node.obj;
  },

  pop: function() {
    const node = this.last;
    if (this.length === 0) return null;

    // pull this object out and tie up the ends
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }

    // this node's previous becomes last
    this.last = node.prev;
    if (!node.prev) this.first = null; // make sure we clear this

    node.free = true;
    node.prev = null;
    node.next = null;

    this.length--;
    return node.obj;
  },

  concat: function(list) {
    let node = list.first;
    while (node) {
      this.add(node.obj);
      node = node.next;
    }
  },

  clear: function() {
    let next = this.first;

    while (next) {
      next.free = true;
      next = next.next;
    }

    this.first = null;
    this.length = 0;
  },

  dispose: function() {
    let next = this.first;

    while (next) {
      next.obj = null;
      next = next.next;
    }
    this.first = null;

    this.objToNodeMap = null;
  },

  /*
    Outputs the contents of the current list for debugging.
   */
  dump: function(msg) {
    console.log('====================' + msg + '=====================');
    let a = this.first;
    while (a) {
      console.log("{" + a.obj.toString() + "} previous=" + (a.prev ? a.prev.obj : "NULL"));
      a = a.next();
    }
    console.log("===================================");
    console.log("Last: {" + (this.last ? this.last.obj : 'NULL') + "} " +
      "First: {" + (this.first ? this.first.obj : 'NULL') + "}");
  }
};

export default LinkedList;
