
class Loader {
	
	constructor(opts) {
		this.jsonLoader = new THREE.JSONLoader();

		this.errorCallback = opts.onError == undefined ? function(s){ console.warn("Error while loading %s.".replace("%s", s)) } : opts.onError;
		this.loadCallback = opts.onLoad == undefined ? function(){ console.log("Loaded.") } : opts.onLoad;
		this.progressCallback = opts.onProgress == undefined ? function(progress, type, name){ /**/ } : opts.onProgress;

		this.states = {};
		this.data = {};
		this.types = {
			textures: null,
			texturesCube: null,
			geometries: null,
			analysers: null,
			images: null,
			sounds: null
		};

		for (var t in this.types) {
			this.data[t] = {};
			this.states[t] = {};
		}

		this.progress = {
			total: 0,
			remaining: 0,
			loaded: 0,
			finished: false
		};
	}

	load(data) {
		for (let key in this.types) {
			if (key in data) {
				let size = 0;
				for (let j in data[key]) {
					size++;
				}
				this.progress.total += size;
				this.progress.remaining += size;
			}
		}
		for (let key in data.textures) {
			this.loadTexture(key, data.textures[key]);
		}
		for (let key in data.texturesCube) {
			this.loadTextureCube(key, data.texturesCube[key]);
		}
		for (let key in geometries) {
			this.jsonLoader.createModel(geometries[key], mesh => this.data.geometries[key] = mesh);
		}
		for (let key in data.analysers) {
			this.loadAnalyser(key, data.analysers[key]);
		}
		for (let key in data.images) {
			this.loadImage(key, data.images[key]);
		}
		this.progressCallback.call(this, this.progress);
	}

	updateState(type, name, state) {
		if (!(type in this.types)) {
			console.warn("Unkown loader type.");
			return;
		}

		if (state == true) {
			this.progress.remaining--;
			this.progress.loaded++;
			this.progressCallback.call(this, this.progress, type, name);
		}

		this.states[type][name] = state;


		if (this.progress.loaded == this.progress.total) {
			this.loadCallback.call(this);
		}
	}

	get(type, name) {
		if (!(type in this.types)) {
			console.warn("Unkown loader type.");
			return null;
		}
		if (!(name in this.data[type])) {
			console.warn("Unkown file.");
			return null;
		}
		return this.data[type][name];
	}

	loaded(type, name) {
		if (!(type in this.types)) {
			console.warn("Unkown loader type.");
			return null;
		}
		if (!(name in this.states[type])) {
			console.warn("Unkown file.");
			return null;
		}
		return this.states[type][name];
	}

	loadTexture(name, url) {
		this.updateState("textures", name, false);
		this.data.textures[name] = THREE.ImageUtils.loadTexture(
			url, undefined, 
			() => this.updateState("textures", name, true),
			() => this.errorCallback.call(this, name),
		);
	}

	loadTextureCube(name, url) {
		var urls = [
				url.replace("%1", "px"), url.replace("%1", "nx"),
				url.replace("%1", "py"), url.replace("%1", "ny"),
				url.replace("%1", "pz"), url.replace("%1", "nz")
			];
		this.updateState("texturesCube", name, false);
		this.data.texturesCube[name] = THREE.ImageUtils.loadTextureCube( 
			urls, 
			new THREE.CubeRefractionMapping(), 
			() => this.updateState("texturesCube", name, true)
		);
	}

	loadAnalyser(name, url) {
		this.updateState("analysers", name, false);
		this.data.analysers[name] = new window.bkcore.ImageData(
			url,
			() => this.updateState("analysers", name, true)
		);
	}

	loadImage(name, url) {
		this.updateState("images", name, false);
		var img = new Image();
		img.onload = () => this.updateState("images", name, true);
		img.crossOrigin = "anonymous";
		img.src = url;
		this.data.images[name] = img;
	}

}
