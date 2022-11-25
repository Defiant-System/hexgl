
class RenderManager {

	constructor(renderer) {
		this.renderer = renderer;
		this.time = window.performance.now();
		this.renders = {};
		this.current = {};
		this.size = 0;

		this.defaultRenderMethod = function(delta, renderer) {
			renderer.render(this.scene, this.camera);
		};
	}

	add(id, scene, camera, render, objects) {
		render = render || this.defaultRenderMethod;
		objects = objects || {};

		this.renders[id] = {
			id: id,
			scene: scene, 
			camera: camera, 
			render: render, 
			objects: objects
		};

		if (this.size == 0) this.current = this.renders[id];

		this.size++;
	}

	get(id) {
		return this.renders[id];
	}

	remove(id) {
		if (id in this.renders) {
			delete this.renders[id];
			this.size--;
		}
	}

	renderCurrent() {
		if (this.current && this.current.render) {
			let now = window.performance.now(),
				delta = now - this.time;
			this.time = now;
			this.current.render.call(this.current, delta, this.renderer);
		} else {
			console.warn('RenderManager: No current render defined.');
		}
	}

	setCurrent(id) {
		if (id in this.renders) {
			this.current = this.renders[id];
		} else {
			console.warn('RenderManager: Render "'+id+'" not found.');
		}
	}

}
