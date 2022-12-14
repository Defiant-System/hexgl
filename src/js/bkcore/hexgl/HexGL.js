 /*
 * HexGL "v.1.0.2" - Rewrite
 * Orginial author is as follows:
 * 
 * @author Thibaut 'BKcore' Despoulain <http://bkcore.com>
 * @license This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 *          To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/.
 */

class HexGL {
	
	constructor(opts) {
		this.active = true;
		this.width = opts.width == undefined ? window.innerWidth : opts.width;
		this.height = opts.height == undefined ? window.innerHeight : opts.height;
		this.player = opts.player == undefined ? "Anonym" : opts.player;
		this.track = bkcore.hexgl.tracks[ opts.track == undefined ? "Cityscape" : opts.track ];
		this.mode = opts.mode == undefined ? "timeattack" : opts.mode;
		
		// desktop + mid or high quality => 3 (VERY HIGH)
		this.settings = null;
		this.renderer = null;
		this.manager = null;
		this.lib = null;
		this.materials = {};
		this.components = {};
		this.extras = {
			vignetteColor: new THREE.Color(0x458ab1),
			bloom: null,
			fxaa: null
		};

		this.containers = {};
		this.containers.main = opts.container == undefined ? document.body : opts.container;
		this.containers.overlay = opts.overlay == undefined ? document.body : opts.overlay;
		this._godmode = opts.godmode == undefined ? false : opts.godmode;
		this.hud = null;
		this.gameplay = null;

		this.composers = {
			game: null
		};

		this.initRenderer();
	}

	get godmode() {
		return this._godmode;
	}

	set godmode(value) {
		this._godmode = value;
		this.tweakShipControls();
	}

	start(mode="timeattack") {
		this.manager.setCurrent("game");
		this.resume();
		// init game play;
		this.gameplay = new Gameplay({
			hud: this.hud,
			mode: this.mode,
			mode,
			shipControls: this.components.shipControls,
			cameraControls: this.components.cameraChase,
			analyser: this.track.analyser,
			pixelRatio: this.track.pixelRatio,
			track: this.track,
			onFinish: () => {
				this.components.shipControls.terminate();
				this.displayScore(this.gameplay.finishTime, this.gameplay.lapTimes);
			}
		});
		// start countdown
		this.gameplay.start();
	}

	stop() {
		this.components.shipControls.speed = 0;
		this.active = false;
	}

	pause() {
		this.components.shipControls.speed = 0;
		this.active = false;
		// UI update
		hexgl.dispatch({ type: "show-pause", isOn: true });
	}

	resume() {
		this.active = true;
		var self = this,
			raf = function() {
				if (self && self.active) requestAnimationFrame( raf );
				self.update();
			};
		raf();
		// UI update
		hexgl.dispatch({ type: "show-pause", isOn: false });
	}

	reset() {
		this.manager.get("game").objects.lowFPS = 0;
		this.gameplay.start();
	}

	restart() {
		this.active = true;
		this.reset();
	}

	update() {
		if (!this.active) return;
		if (this.gameplay != null) this.gameplay.update();
		this.manager.renderCurrent();
	}

	init() {
		this.hud = new HUD({
			width: this.width,
			height: this.height,
			font: "BebasNeueRegular",
			canvas: this.containers.overlay,
			bg: this.track.lib.get("images", "hud.bg"),
			speed: this.track.lib.get("images", "hud.speed"),
			shield: this.track.lib.get("images", "hud.shield")
		});
		this.track.buildMaterials();
		this.track.buildScenes(this);
		this.initGameComposer();
	}

	load(opts) {
		this.track.load(opts);
	}

	displayScore(f, l) {
		var APP = hexgl,
			GP = this.gameplay,
			T = new Timer;
		// stop raf
		this.active = false;
		// result type
		switch (GP.result) {
			case GP.results.FINISH:
				let finishTime = T.valueOf(GP.finishTime),
					fastest = Math.min(...GP.lapTimes),
					bestLap = T.valueOf(fastest);
				APP.dispatch({ type: "show-finish" });
				APP.dispatch({ type: "register-time", finish: GP.finishTime, fastest });
				APP.els.content.find(".view-finish .race-time span").html(finishTime);
				APP.els.content.find(".view-finish .lap-time span").html(bestLap);
				break;
			case GP.results.DESTROYED:
				let raceTime = T.valueOf(GP.timer.time.elapsed);
				APP.dispatch({ type: "show-game-over" });
				APP.els.content.prop({ className: "show-game-over" });
				APP.els.content.find(".game-time").html(raceTime);
				break;
		}
	}

	initRenderer() {
		var renderer = new THREE.WebGLRenderer({
			antialias: false,
			clearColor: 0x000000
		});

		// desktop + quality mid or high
		renderer.physicallyBasedShading = true;
		renderer.gammaInput = true;
		renderer.gammaOutput = true;
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		renderer.autoClear = false;
		renderer.sortObjects = false;
		renderer.setSize( this.width, this.height );
		renderer.domElement.style.position = "relative";

		this.containers.main.appendChild( renderer.domElement );
		this.canvas = renderer.domElement;
		this.renderer = renderer;
		this.manager = new RenderManager(renderer);
	}

	initGameComposer() {
		var renderTargetParameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false
			},
			renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, renderTargetParameters);

		// GAME COMPOSER
		var renderSky = new THREE.RenderPass( this.manager.get("sky").scene, this.manager.get("sky").camera );
		var renderModel = new THREE.RenderPass( this.manager.get("game").scene, this.manager.get("game").camera );
		renderModel.clear = false;

		var effectHex = new THREE.ShaderPass( Shaders[ "hexvignette" ] );
		effectHex.uniforms["size"].value = 512.0 * (this.width/1633);
		effectHex.uniforms["rx"].value = this.width;
		effectHex.uniforms["ry"].value = this.height;
		effectHex.uniforms["tHex"].texture = this.track.lib.get("textures", "hex");
		effectHex.uniforms["color"].value = this.extras.vignetteColor;
		effectHex.renderToScreen = true;

		var effectBloom = new THREE.BloomPass( 0.8, 25, 4, 256);

		this.composers.game = new THREE.EffectComposer( this.renderer, renderTarget );
		this.composers.game.addPass( renderSky );
		this.composers.game.addPass( renderModel );

		// desktop + quality mid or high
		this.composers.game.addPass( effectBloom );
		this.extras.bloom = effectBloom;

		// desktop + quality low, mid or high
		this.composers.game.addPass( effectHex );
	}

	createMesh(parent, geometry, x, y, z, mat) {
		geometry.computeTangents();

		var mesh = new THREE.Mesh( geometry, mat );
		mesh.position.set( x, y, z );
		parent.add(mesh);

		// desktop + quality mid or high
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		return mesh;
	}

	tweakShipControls() {
		var c = this.components.shipControls;
		c.airResist = 0.02;
		c.airDrift = 0.06;
		c.thrust = 0.02;
		c.airBrake = 0.025;
		c.maxSpeed = 7.0;
		c.boosterSpeed = c.maxSpeed * 0.5;
		c.boosterDecay = 0.007;
		c.angularSpeed = 0.0125;
		c.airAngularSpeed = 0.0135;
		c.rollAngle = 0.6;
		c.shieldDamage = 0.06;
		c.collisionSpeedDecrease = 0.8;
		c.collisionSpeedDecreaseCoef = 0.5;
		c.rollLerp = 0.07;
		c.driftLerp = 0.3;
		c.angularLerp = 0.4;

		if (this._godmode) c.shieldDamage = 0.0;
	}

}
