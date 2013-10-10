var Sora = {};
(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0 ; x < vendors.length && !window.requestAnimationFrame ; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}
	if (window.requestAnimationFrame === undefined) {
		window.requestAnimationFrame = function (callback) {
			var currTime = Date.now(), timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
	window.cancelAnimationFrame = window.cancelAnimationFrame || function (id) { window.clearTimeout(id) };
}());
Sora.GL_ARRAY = Float32Array || Array;
Sora.map = function (input, callback) {
	if (input instanceof Array && callback) {
		var output = [];
		for (var i = 0, l = input.length ; i < l ; ++i)
			output.push(callback(input[i]));
		return output;
	}
	return null;
};
Sora.foreach = function (obj, callback, alternate) {
	if (typeof obj === 'object' && callback) {
		alternate = alternate || callback;
		if (Object.keys) {
			var keys = Object.keys(obj);
			for (var i = 0, l = keys.length ; i < l ; ++i) {
				var prop = keys[i];
				callback(prop);
			}
		}
		else {
			var safeHasOwnProperty = {}.hasOwnProperty;
			for (var prop in obj)
				if (safeHasOwnProperty.call(obj, prop))
					alternate(prop);
		}
		return obj;
	}
	return null;
};
Sora.extend = function (obj, src) {
	Sora.foreach(src, function (prop) {
		Object.defineProperty(obj, prop, Object.getOwnPropertyDescriptor(src, prop));
	}, function (prop) {
		obj[prop] = src[prop];
	});
	return obj;
};
Sora.stringify = function (value, key) {
	function quote(string) {
		var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, meta = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		};
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
			var c = meta[a];
			return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' : '"' + string + '"';
	}
	if (key === undefined) key = '';
	else key = ' ' + key + ':';
	switch (typeof value) {
	case 'boolean':
		return key + (value ? '1' : '0');
	case 'number':
		return key + value;
	case 'string':
		return key + quote(value);
	default:
		return '';
	}
};
Sora.EventDispatcher = function () {};
Sora.EventDispatcher.prototype = {
	constructor: Sora.EventDispatcher,
	addEventListener: function (type, listner) {
		if (this.listners === undefined)
			this.listners = {};
		if (this.listners[type] === undefined)
			this.listners[type] = [];
		if (this.listners[type].indexOf(listner) === -1)
			this.listners[type].push(listner);
	},
	hasEventListner: function (type, listner) {
		if (this.listners === undefined)
			return false;
		if (this.listners[type] === undefined)
			return false;
		if (this.listners[type].indexOf(listner) === -1)
			return false;
		return true;
	},
	removeEventListner: function (type, listner) {
		if (this.listners === undefined)
			return ;
		if (this.listners[type] === undefined)
			return ;
		var index = this.listners[type].indexOf(listner);
		if (index !== -1)
			this.listners[type].splice(index, 1);
	},
	dispatchEvent: function (event) {
		if (this.listners === undefined)
			return ;
		var listnerArray = this.listners[event.type];
		if (listnerArray !== undefined) {
			event.target = this;
			for (var i = 0, l = listnerArray.length ; i < l ; ++i)
				listnerArray[i].call(this, event);
		}
	},
	dealloc: function () {
		this.dispatchEvent({type: 'dealloc'});
	},
	name: '',
	params: function () {
		return '';
	},
	str: function () {
		return '';
	}
};
Sora.Texture = function (image, callback) {
	Sora.EventDispatcher.call(this);
	this.needsUpdate = false;
	this.texture = null;
	this.flipY = true;
	switch (typeof image) {
	case 'string':
		this.image = new Image();
		var scope = this;
		this.image.onload = function () {
			scope.needsUpdate = true;
			if (callback) callback();
		};
		this.image.src = image;
		break;
	default:
		this.image = image;
		if (callback) callback();
		break;
	}
};
Sora.Texture.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Texture.prototype, {
	str: function () {
		if (this.image instanceof Image)
			return this.image.src;
		else
			return null;
	}
});
Sora.Sound = function (params) {
	this.audio = document.createElement('audio');
	this.audio.volume = params.volume ? parseFloat(params.volume) : 1;
	this.audio.loop = params.loop ? true : false;
	this.audio.autoplay = true;
	this.audio.src = params.src;
	this.audio.load();
	// this.audio.currentTime
};
Sora.Sound.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Sound.prototype, {
	play: function () {
		this.audio.play();
	},
	pause: function () {
		this.audio.pause();
	},
	name: 'sound',
	params: function () {
		return Sora.stringify(this.audio.volume, 'volume') +
		Sora.stringify(this.audio.loop, 'loop') +
		Sora.stringify(this.audio.currentTime, 'currentTime') +
		Sora.stringify(this.audio.src, 'src');
	},
	str: function () {
		return '[' + this.name + this.params + ']';
	}
});
Sora.timmingFuncLinear = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return t;
};
Sora.timmingFuncEaseIn = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return Math.sin((t - 1) * Math.PI * 0.5) + 1;
};
Sora.timmingFuncEaseOut = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return Math.sin(t * Math.PI * 0.5);
};
Sora.timmingFuncEaseInOut = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return Math.sin((t - 0.5) * Math.PI) * 0.5 + 0.5;
};
Sora.Action = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	this.target = params.target || {id: ''};
	this.duration = params.duration ? Math.max(1, parseInt(params.duration)) : 1000;
	this.elapsed = params.elapsed ? Math.max(0, parseInt(params.elapsed)) : 0;
	this.repeat = params.repeat ? Math.max(0, parseFloat(params.repeat)) : 1;
	this.reverse = params.reverse ? true : false;
	this.autorev = params.autorev ? true : false;
	this.timming = params.timming ? params.timming.toLowerCase() : '';
	this.callback = params.callback;
	this.keys = [];
	this.fromValues = [];
	this.toValues = [];
	var scope = this;
	Sora.foreach(params, function (prop) {
		if (prop == 'target' ||
			prop == 'duration' ||
			prop == 'elapsed' ||
			prop == 'repeat' ||
			prop == 'reverse' ||
			prop == 'autorev' ||
			prop == 'timming' ||
			prop == 'callback')
			return ;
		if (typeof scope.target[prop] === 'number') {
			var str = params[prop], fromValue, toValue;
			if (/[\s\S]+->[\s\S]+/.test(str)) {
				var values = /([\s\S]+)->([\s\S]+)/.exec(str);
				fromValue = parseFloat(values[1]);
				toValue = parseFloat(values[2]);
			}
			else {
				fromValue = scope.target[prop];
				toValue = parseFloat(str);
			}
			scope.keys.push(prop);
			scope.fromValues.push(fromValue);
			scope.toValues.push(toValue);
		}
	});
};
Sora.Action.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Action.prototype, {
	update: function (t) {
		var timmingFunc;
		if (this.timming.match('easeinout')) timmingFunc = Sora.timmingFuncEaseInOut;
		else if (this.timming.match('easeout')) timmingFunc = Sora.timmingFuncEaseOut;
		else if (this.timming.match('easein')) timmingFunc = Sora.timmingFuncEaseIn;
		else timmingFunc = Sora.timmingFuncLinear;
		t = timmingFunc(t, this.reverse);
		for (var i = 0, l = this.keys.length ; i < l ; ++i)
			this.target[this.keys[i]] = this.toValues[i] * t + (1 - t) * this.fromValues[i];
	},
	step: function (dt) {
		var t = parseInt((Math.max(1, Math.min(this.repeat * this.duration, this.elapsed)) - 1) / this.duration);
		this.elapsed = Math.max(0, this.elapsed + dt);
		t ^= parseInt((Math.max(1, Math.min(this.repeat * this.duration, this.elapsed)) - 1) / this.duration);
		if (this.autorev && (t & 1)) this.reverse = !this.reverse;
		if (this.done())
			t = this.repeat - parseInt(this.repeat) || 1;
		else
			t = this.elapsed ? (((this.elapsed - 1) % this.duration) + 1) / this.duration : 0;
		this.update(t);
		if (this.done() && this.callback) this.callback();
	},
	remain: function () {
		if (this.elapsed <= parseInt(this.repeat) * this.duration)
			return this.duration - ((this.elapsed - 1) % this.duration + 1);
		else
			return this.repeat * this.duration - this.elapsed;
	},
	done: function () {
		return this.elapsed >= this.repeat * this.duration;
	},
	name: 'action',
	params: function () {
		var str = Sora.stringify(this.target.id, 'target') +
		Sora.stringify(this.duration, 'duration') +
		Sora.stringify(this.elapsed, 'elapsed') +
		Sora.stringify(this.repeat, 'repeat') +
		Sora.stringify(this.reverse, 'reverse') +
		Sora.stringify(this.autorev, 'autorev') +
		Sora.stringify(this.timming, 'timming');
		for (var i = 0, l = this.keys.length ; i < l ; ++i)
			str += Sora.stringify(Sora.stringify(this.fromValues[i]) + '->' + Sora.stringify(this.toValues[i]), this.keys[i]);
		return str;
	},
	str: function () {
		return '[' + this.name + this.params() + ']';
	}
});
Sora.Layer = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	this.x = params.x ? parseFloat(params.x) : 0;
	this.y = params.y ? parseFloat(params.y) : 0;
	this.width = params.width ? parseFloat(params.width) : 0;
	this.height = params.height ? parseFloat(params.height) : 0;
	this.anchorX = params.anchorX ? parseFloat(params.anchorX) : 0;
	this.anchorY = params.anchorY ? parseFloat(params.anchorY) : 0;
	this.scaleX = params.scaleX ? parseFloat(params.scaleX) : 1;
	this.scaleY = params.scaleY ? parseFloat(params.scaleY) : 1;
	this.rotation = params.rotation ? parseFloat(params.rotation) : 0;
	this.opacity = params.opacity ? parseFloat(params.opacity) : 1;
	this.order = params.order ? parseInt(params.order) : 0;
	this.id = params.id || '';
	this.sublayers = [];
	this.superlayer = null;
	var scope = this;
	this.texture = params.src ? new Sora.Texture(params.src, function () {
		if (!params.width) scope.width = scope.texture.image.width;
		if (!params.height) scope.height = scope.texture.image.height;
	}) : null;
};
Sora.Layer.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Layer.prototype, {
	addSublayer: function (layer) {
		if (layer.superlayer) layer.removeFromSuperlayer();
		var i = 0;
		for (var l = this.superlayer.length ; i < l ; ++i)
			if (layer.order < this.sublayers[i].order)
				break;
		this.sublayers.splice(i, 0, layer);
		layer.superlayer = this;
	},
	removeFromSuperlayer: function () {
		if (!this.superlayer) return ;
		var layers = this.superlayer.sublayers;
		for (var i = 0, l = layers.length ; i < l ; ++i)
			if (layers[i] == this) {
				layers.splice(i, 1);
				break;
			}
		this.superlayer = null;
	},
	update: function () {
		
	},
	getLayerById: function (id) {
		if (id && this.id && id == this.id) return this;
		for (var i = 0, l = this.sublayers.length ; i < l ; ++i) {
			var layer = this.sublayers[i].getLayerById(id);
			if (layer) return layer;
		}
		return null;
	},
	dealloc: function () {
		if (this.texture) this.texture.dealloc();
		for (var i = 0, l = this.sublayers.length ; i < l ; ++i)
			this.sublayers[i].dealloc();
		Sora.EventDispatcher.prototype.dealloc.call(this);
	},
	mouseEntered: function (event) {
		
	},
	mouseExited: function (event) {
		
	},
	mouseDown: function (event) {
		
	},
	mouseUp: function (event) {
		
	},
	mouseDragged: function (event) {
		
	},
	rightMouseDown: function (event) {
		
	},
	rightMouseUp: function (event) {
		
	},
	rightMouseDraged: function (event) {
		
	},
	keyDown: function (event) {
		
	},
	keyUp: function (event) {
		
	},
	responseToMouseEvent: function (event) {
		
		return null;
	},
	responseToKeyEvent: function (event) {
		
		return null;
	},
	name: 'layer',
	params: function () {
		return Sora.stringify(this.x, 'x') +
		Sora.stringify(this.y, 'y') +
		Sora.stringify(this.width, 'width') +
		Sora.stringify(this.height, 'height') +
		Sora.stringify(this.anchorX, 'anchorX') +
		Sora.stringify(this.anchorY, 'anchorY') +
		Sora.stringify(this.scaleX, 'scaleX') +
		Sora.stringify(this.scaleY, 'scaleY') +
		Sora.stringify(this.rotation, 'rotation') +
		Sora.stringify(this.opacity, 'opacity') +
		Sora.stringify(this.order, 'order') +
		Sora.stringify(this.id, 'id') +
		Sora.stringify(this.superlayer ? this.superlayer.id : null, 'super') +
		Sora.stringify(this.texture ? this.texture.str() : null, 'src');
	},
	str: function () {
		var str = '[' + this.name + this.params() + ']';
		for (var i = 0, l = this.sublayers.length ; i < l ; ++i)
			str += this.sublayers[i].str();
		return str;
	}
});
Sora.Label = function (params) {
	params = params || {};
	params.src = null;
	Sora.Layer.call(this, params);
	this.canvas = document.createElement('canvas');
	this.context = this.canvas.getContext('2d');
	this.text = params.text || '';
	this.font = params.font || this.context.font;
	this.align = params.align || this.context.textAlign;
	this.texture = new Sora.Texture(this.canvas);
	this.start = params.start ? parseFloat(params.start) : 1;
};
Sora.Label.prototype = Object.create(Sora.Layer.prototype);
Sora.extend(Sora.Label.prototype, {
	appendText: function (text) {
		this.text += text;
	},
	clearText: function () {
		this.text = '';
	},
	update: function () {
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.context.clearRect(this.width, this.height);
		this.context.font = this.font;
		this.context.textAlign = this.align;
		this.context.textBaseline = 'bottom';
		this.context.fillStyle = '#FFFFFF';
		this.context.fillText(this.text, 0, this.height);
		// parse multi-line, and hide the text after start
		this.texture.needsUpdate = true;
		Sora.Layer.prototype.update.call(this);
	},
	name: 'label',
	params: function () {
		return Sora.Layer.prototype.params.call(this) +
		Sora.stringify(this.text, 'text') +
		Sora.stringify(this.font, 'font') +
		Sora.stringify(this.align, 'align') +
		Sora.stringify(this.start, 'start');
	}
});
Sora.Button = function (params) {
	params = params || {};
	params.src = params.src || params.normalSrc;
	Sora.Layer.call(this, params);
	this.normalTexture = this.texture;
	this.disabledTexture = params.disabledSrc ? new Sora.Texture(params.disabledSrc) : null;
	this.selectedTexture = params.selectedSrc ? new Sora.Texture(params.selectedSrc) : null;
	this.maskedTexture = params.maskedSrc ? new Sora.Texture(params.maskedSrc) : null;
	this.disabled = params.disabled ? true : false;
	this.selected = params.selected ? true : false;
	this.masked = params.masked ? true : false;
	this.callback = params.callback;
};
Sora.Button.prototype = Object.create(Sora.Layer.prototype);
Sora.extend(Sora.Button.prototype, {
	update: function () {
		this.texture = this.normalTexture;
		if (this.disabled) this.texture = this.disabledTexture;
		else if (this.selected) this.texture = this.selectedTexture;
		else if (this.masked) this.texture = this.maskedTexture;
		Sora.Layer.prototype.update.call(this);
	},
	dealloc: function () {
		this.texture = null;
		if (this.normalTexture) this.normalTexture.dealloc();
		if (this.disabledTexture) this.disabledTexture.dealloc();
		if (this.selectedTexture) this.selectedTexture.dealloc();
		if (this.maskedTexture) this.maskedTexture.dealloc();
		Sora.Layer.prototype.dealloc.call(this);
	},
	name: 'button',
	params: function () {
		this.texture = null;
		return Sora.Layer.prototype.params.call(this) +
		Sora.stringify(this.normalTexture ? this.normalTexture.str() : null, 'normalSrc') +
		Sora.stringify(this.disabledTexture ? this.disabledTexture.str() : null, 'disabledSrc') +
		Sora.stringify(this.selectedTexture ? this.selectedTexture.str() : null, 'selectedSrc') +
		Sora.stringify(this.maskedTexture ? this.maskedTexture.str() : null, 'maskedSrc') +
		Sora.stringify(this.disabled, 'disabled') +
		Sora.stringify(this.selected, 'selected') +
		Sora.stringify(this.masked, 'masked') +
		Sora.stringify(this.callback, 'callback');
	}
});
Sora.Renderer = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var canvas = params.canvas;
	if (!canvas) return ;
	var gl = canvas.getContext('experimental-webgl');
	if (!gl) {
		alert('Couldn\'t get webgl context');
		return ;
	}
	gl.clearColor(0, 0, 0, 1);
	//gl.enable(gl.DEPTH_TEST);
	//gl.clearDepth(1);
	//gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.TEXTURE_2D);
	function createShader(src, type) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}
	var vs = createShader([
	'attribute vec2 vertex;',
	'attribute vec2 texA;',
	'varying vec2 texV;',
	'uniform mat4 mvMat;',
	'void main(void) {',
	'gl_Position = mvMat * vec4(vertex, 0.0, 1.0);',
	'texV = texA;',
	'}'
	].join('\n'), gl.VERTEX_SHADER);
	var fs = createShader([
	'precision mediump float;',
	'varying vec2 texV;',
	'uniform float alpha;',
	'uniform bool enabled;',
	'uniform float progress;',
	'uniform float offset;',
	'uniform sampler2D mask;',
	'uniform sampler2D tex;',
	'void main(void) {',
	'vec4 color = vec4(1.0, 1.0, 1.0, alpha) * texture2D(tex, texV);',
	'if (enabled) {',
	'float threshold = texture2D(mask, texV).x;',
	'if (offset == 0.0)',
	'if (threshold <= progress) gl_FragColor = vec4(color.xyz, 0.0);',
	'else gl_FragColor = color;',
	'else gl_FragColor = vec4(color.xyz, color.w * clamp((threshold - progress) / offset, 0.0, 1.0));',
	'}',
	'else gl_FragColor = color;',
	'}'
	].join('\n'), gl.FRAGMENT_SHADER);
	var prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		alert('Couldn\'t initialize shader program');
		return ;
	}
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	gl.useProgram(prog);
	Sora.map(['vertex', 'texA'], function (key) {
		gl.enableVertexAttribArray(prog[key] = gl.getAttribLocation(prog, key));
	});
	Sora.map(['mvMat', 'alpha', 'enabled', 'progress', 'offset', 'mask', 'tex'], function (key){
		prog[key] = gl.getUniformLocation(prog, key);
	});
	gl.activeTexture(gl.TEXTURE0);
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(prog.mask, 0);
	gl.uniform1i(prog.tex, 1);
	var verBuf = gl.createBuffer(), texBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Sora.GL_ARRAY([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
	function setAlpha(f) {
		gl.uniform1f(prog.alpha, Math.max(0, Math.min(1, f)));
	}
	function setEnabled(b) {
		gl.uniform1i(prog.enabled, b ? 1 : 0);
	}
	function setProgress(f) {
		gl.uniform1f(prog.progress, Math.max(0, Math.min(1, f)));
	}
	function setOffset(f) {
		gl.uniform1f(prog.offset, Math.max(0, Math.min(1, f)));
	}
	setAlpha(1);
	setEnabled(false);
	setProgress(0);
	setOffset(0);
	function onTextureDealloc(event) {
		var texture = event.target;
		texture.removeEventListner('dealloc', onTextureDealloc);
		gl.deleteTexture(texture.texture);
		texture.texture = null;
	}
	function updateTexture(texture, slot) {
		if (!texture instanceof Sora.Texture || slot === undefined) return ;
		if (texture.needsUpdate && !texture.texture) {
			texture.texture = gl.createTexture();
			texture.addEventListener('dealloc', onTextureDealloc);
		}
		gl.activeTexture(gl.TEXTURE0 + slot);
		gl.bindTexture(gl.TEXTURE_2D, texture.texture);
		if (texture.needsUpdate) {
			texture.needsUpdate = false;
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
			if (texture.image)
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
			else
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
	}
	function bindMask(texture) {
		updateTexture(texture, 0);
	}
	function bindTexture(texture) {
		updateTexture(texture, 1);
	}
	var matrices = [mat4.create()];
	function pushMatrix() {
		matrices.push(mat4.clone(matrices[matrices.length - 1]));
	}
	function popMatrix() {
		if (matrices.length > 1) {
			matrices.pop();
			gl.uniformMatrix4fv(prog.mvMat, false, matrices[matrices.length - 1]);
		}
	}
	function loadIdentity() {
		var m = matrices[matrices.length - 1];
		mat4.identity(m);
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	function translate(x, y, z) {
		var m = matrices[matrices.length - 1];
		mat4.translate(m, m, vec3.fromValues(x || 0, y || 0, z || 0));
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	function rotate(x, y, z) {
		var m = matrices[matrices.length - 1];
		if (x) mat4.rotateX(m, m, x);
		if (y) mat4.rotateY(m, m, y);
		if (z) mat4.rotateZ(m, m, z);
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	function scale(x, y, z) {
		var m = matrices[matrices.length - 1];
		mat4.scale(m, m, vec3.fromValues(x || 1, y || 1, z || 1));
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	loadIdentity();
	function draw(layer) {
		pushMatrix();
		var tx = layer.width * layer.anchorX, ty = layer.height * layer.anchorY;
		translate(tx + layer.x, ty + layer.y);
		rotate(0, 0, layer.rotation);
		scale(layer.scaleX, layer.scaleY);
		translate(-tx, -ty);
		var opacity = layer.opacity;
		if (layer.superlayer) layer.opacity = layer.opacity * layer.superlayer.opacity;
		var i = 0, l = layer.sublayers.length;
		for (; i < l ; ++i) {
			if (layer.sublayers[i].order >= 0) break;
			draw(layer.sublayers[i]);
		}
		if (layer.texture) {
			setAlpha(layer.opacity);
			bindTexture(layer.texture);
			gl.bindBuffer(gl.ARRAY_BUFFER, verBuf);
			var w = layer.width, h = layer.height;
			gl.bufferData(gl.ARRAY_BUFFER, new Sora.GL_ARRAY([0, 0, w, 0, w, h, 0, h]), gl.STREAM_DRAW);
			gl.vertexAttribPointer(prog.vertex, 2, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
			gl.vertexAttribPointer(prog.texA, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
		}
		for (; i < l ; ++i) draw(layer.sublayers[i]);
		layer.opacity = opacity;
		popMatrix();
	}
	this.render = function (layer) {
		if (!layer) return ;
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT/* | gl.DEPTH_BUFFER_BIT*/);
		pushMatrix();
		translate(-1, -1);
		scale(2 / layer.width, 2 / layer.height);
		draw(layer);
		popMatrix();
	};
	var scope = this;
	this.snapshot = function (layer) {
		if (!layer) return null;
		var w = parseInt(layer.width), h = parseInt(layer.height);
		var fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		//var rb = gl.createRenderbuffer();
		//gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
		//gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
		//gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		var texture = new Sora.Texture();
		texture.width = w, texture.height = h;
		texture.needsUpdate = true;
		texture.flipY = false;
		bindTexture(texture);
		//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
		scope.render(layer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(fb);
		//gl.deleteRenderbuffer(rb);
		return texture;
	};
};
Sora.Renderer.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.Controls = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var actions = [];
	this.start = function (action) {
		for (var i = 0, l = actions.length ; i < l ; ++i)
			if (actions[i] === action)
				return ;
		actions.push(action);
	};
	this.stop = function (action) {
		for (var i = 0, l = actions.length ; i < l ; ++i)
			if (actions[i] === action) {
				// finish action
				// action callback
				actions.splice(i, 1);
				break;
			}
	};
	this.update = function (dt) {
		actions.sort(function (a, b) { return a.remain() - b.remain(); });
		for (var i = 0, l = actions.length ; i < l ; ++i) {
			actions[i].step(dt);
			if (actions[i].done()) actions.splice(i--, 1), --l;
		}
	};
	this.str = function () {
		var str = '';
		for (var i = 0, l = actions.length ; i < l ; ++i)
			str += actions[i].str();
		return str;
	};
};
Sora.Controls.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.Player = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	
	this.str = function () {
		
	};
};
Sora.Player.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.Scripter = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var renderer = params.renderer;
	var controls = params.controls;
	var player = params.player;
	var width = params.width;
	var height = params.height;
	var script = params.script;
	var scriptLoc = params.scriptLoc;
	var vars = {}, cmds = {};
	var foreLayer = new Sora.Layer({width: width, height: height});
	var backLayer = new Sora.Layer({width: width, height: height});
	function isWhitespace(c) {
		return c == ' ' || c == '	' || c == '\n' || c == '\r';
	}
	function parseParams(str) {
		var params = {}, loc = -1;
		
		return params;
	}
	function mergeParams(dst, src, force) {
		Sora.foreach(src, function (prop) {
			if (force || dst[prop] === undefined)
				dst[prop] = src[prop];
		});
		return dst;
	}
	function parseRef(dst, src) {
		Sora.foreach(dst, function (prop) {
			if (dst[prop][0] == '$' && src[dst[prop].slice(1)] !== undefined)
				dst[prop] = src[dst[prop].slice(1)];
		});
		return dst;
	}
	var scope = this;
	function onButtonMouseDown(event) {
		var button = event.target;
		
	}
	this.execute = function (str, params) {
		
	};
	this.update = function (dt) {
		controls.update(dt);
		renderer.render(foreLayer);
	};
	this.save = function (params) {
		
	};
	this.load = function (params) {
		
	};
};
Sora.Scripter.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.System = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	this.canvas = document.createElement('canvas');
	var width = params.width, height = params.height;
	this.canvas.width = width;
	this.canvas.height = height;
	var renderer = new Sora.Renderer({canvas: this.canvas});
	var controls = new Sora.Controls({canvas: this.canvas});
	var player = new Sora.Player();
	var scripter = new Sora.Scripter({renderer: renderer, controls: controls, player: player, width: width, height: height});
	var lastTime = 0, animFrame;
	function animate(currTime) {
		animFrame = window.requestAnimationFrame(animate);
		var dt = Math.max(1, Math.min(33, currTime - lastTime));
		lastTime = currTime;
		scripter.update(dt);
	}
	animFrame = window.requestAnimationFrame(animate);
	this.dealloc = function () {
		if (animFrame) {
			window.cancelAnimationFrame(animFrame);
			animFrame = null;
		}
		scripter.dealloc();
		player.dealloc();
		controls.dealloc();
		renderer.dealloc();
	};
};
Sora.System.prototype = Object.create(Sora.EventDispatcher.prototype);
