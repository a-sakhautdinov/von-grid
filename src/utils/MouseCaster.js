import vg from "../vg";
import * as THREE from "three";

function MouseCaster(group, camera, element) {
	this.down = false; // left click
	this.rightDown = false;
	// the object that was just clicked on
	this.pickedObject = null;
	// the object currently being 'held'
	this.selectedObject = null;
	// store the results of the last cast
	this.allHits = null;
	// disable the caster easily to temporarily prevent user input
	this.active = true;

	this.shift = false;
	this.ctrl = false;
	this.wheel = 0;

	// you can track exactly where the mouse is in the 3D scene by using the z component
	this.position = new THREE.Vector3();
	this.screenPosition = new THREE.Vector2();
	this.signal = new vg.Signal();
	this.group = group;

	// behind-the-scenes stuff you shouldn't worry about
	this._camera = camera;
	this._raycaster = new THREE.Raycaster();
	this._preventDefault = false;

	element = element || document;

	element.addEventListener('mousemove', this._onDocumentMouseMove.bind(this), false);
	element.addEventListener('mousedown', this._onDocumentMouseDown.bind(this), false);
	element.addEventListener('mouseup', this._onDocumentMouseUp.bind(this), false);
	element.addEventListener('mousewheel', this._onMouseWheel.bind(this), false);
	element.addEventListener('DOMMouseScroll', this._onMouseWheel.bind(this), false); // firefox
}

// statics to describe the events we dispatch
MouseCaster.OVER = 'over';
MouseCaster.OUT = 'out';
MouseCaster.DOWN = 'down';
MouseCaster.UP = 'up';
MouseCaster.CLICK = 'click'; // only fires if the user clicked down and up while on the same object
MouseCaster.WHEEL = 'wheel';

MouseCaster.prototype = {
  constructor: MouseCaster,

  update: function() {
    if (!this.active) {
      return;
    }

    this._raycaster.setFromCamera(this.screenPosition, this._camera);

    var intersects = this._raycaster.intersectObject(this.group, true);
    var hit, obj;

    if (intersects.length > 0) {
      // get the first object under the mouse
      hit = intersects[0];
      obj = hit.object.hexData.structure;
      if (this.pickedObject !== obj) {
        // the first object changed, meaning there's a different one, or none at all
        if (this.pickedObject) {
          // it's a new object, notify the old object is going away
          this.signal.dispatch(vg.MouseCaster.OUT, this.pickedObject);
        }
        /*else {
          // hit a new object when nothing was there previously
        }*/
        this.pickedObject = obj;
        this.selectedObject = null; // cancel click, otherwise it'll confuse the user

        this.signal.dispatch(vg.MouseCaster.OVER, this.pickedObject);
      }
      this.position.copy(hit.point);
      this.screenPosition.z = hit.distance;
    }
    else {
      // there isn't anything under the mouse
      if (this.pickedObject) {
        // there was though, we just moved out
        this.signal.dispatch(vg.MouseCaster.OUT, this.pickedObject);
      }
      this.pickedObject = null;
      this.selectedObject = null;
    }

    this.allHits = intersects;
  },

  preventDefault: function() {
    this._preventDefault = true;
  },

  _onDocumentMouseDown: function(evt) {
    if (!this.active) {
      return;
    }
    evt = evt || window.event;
    evt.preventDefault();
    if (this._preventDefault) {
      this._preventDefault = false;
      return false;
    }
    if (this.pickedObject) {
      this.selectedObject = this.pickedObject;
    }
    this.shift = evt.shiftKey;
    this.ctrl = evt.ctrlKey;

    this.down = evt.which === 1;
    this.rightDown = evt.which === 3;

    this.signal.dispatch(vg.MouseCaster.DOWN, this.pickedObject);
  },

  _onDocumentMouseUp: function(evt) {
    if (!this.active) {
      return;
    }
    evt.preventDefault();
    if (this._preventDefault) {
      this._preventDefault = false;
      return false;
    }
    this.shift = evt.shiftKey;
    this.ctrl = evt.ctrlKey;

    this.signal.dispatch(vg.MouseCaster.UP, this.pickedObject);
    if (this.selectedObject && this.pickedObject && this.selectedObject.uniqueID === this.pickedObject.uniqueID) {
      this.signal.dispatch(vg.MouseCaster.CLICK, this.pickedObject);
    }

    this.down = evt.which === 1 ? false : this.down;
    this.rightDown = evt.which === 3 ? false : this.rightDown;
  },

  _onDocumentMouseMove: function(evt) {
    if (!this.active) {
      return;
    }
    evt.preventDefault();
    this.screenPosition.x = (evt.clientX / window.innerWidth) * 2 - 1;
    this.screenPosition.y = -(evt.clientY / window.innerHeight) * 2 + 1;
  },

  _onMouseWheel: function(evt) {
    if (!this.active) {
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();

    var delta = 0;
    if (evt.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9
      delta = evt.wheelDelta;
    }
    else if (evt.detail !== undefined) { // Firefox
      delta = -evt.detail;
    }
    if (delta > 0) {
      this.wheel++;
    }
    else {
      this.wheel--;
    }
    // console.log(this.wheel);
    this.signal.dispatch(vg.MouseCaster.WHEEL, this.wheel);
  }
};


export default MouseCaster;
