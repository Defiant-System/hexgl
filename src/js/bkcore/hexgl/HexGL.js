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
		this.displayHUD = opts.hud == undefined ? true : opts.hud;
		this.width = opts.width == undefined ? window.innerWidth : opts.width;
		this.height = opts.height == undefined ? window.innerHeight : opts.height;
		this.difficulty = opts.difficulty == undefined ? 0 : opts.difficulty;
		this.player = opts.player == undefined ? "Anonym" : opts.player;
		this.track = bkcore.hexgl.tracks[ opts.track == undefined ? 'Cityscape' : opts.track ];
		this.mode = opts.mode == undefined ? 'timeattack' : opts.mode;
		this.controlType = opts.controlType == undefined ? 1 : opts.controlType;
		
		// 0 == low, 1 == mid, 2 == high, 3 == very high
		// the old platform+quality combinations map to these new quality values
		// as follows:
		// mobile + low quality => 0 (LOW)
		// mobile + mid quality OR desktop + low quality => 1 (MID)
		// mobile + high quality => 2 (HIGH)
		// desktop + mid or high quality => 3 (VERY HIGH)
		this.quality = opts.quality == undefined ? 3 : opts.quality;

		if (this.quality === 0) {
			this.width /= 2;
			this.height /=2;
		}

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
		this.gameover = opts.gameover == undefined ? null : opts.gameover;
		this.godmode = opts.godmode == undefined ? false : opts.godmode;
		this.hud = null;
		this.gameplay = null;

		this.composers = {
			game: null
		};

		this.initRenderer();
	}

	start() {
		this.manager.setCurrent("game");
		this.raf();
		this.initGameplay();
	}

	raf() {
		if (this.active) {
			requestAnimationFrame(this.raf.bind(this));
			this.update();
		}
	}

	pause() {
		this.active = false;
	}

	resume() {
		this.active = true;
		this.raf();
	}

	reset() {
		this.manager.get('game').objects.lowFPS = 0;
		this.gameplay.start();
	}

	restart() {
		// this.document.getElementById('finish').style.display = 'none';
		this.reset();
	}

	update() {
		if (!this.active) return;
		if (this.gameplay != null) this.gameplay.update();
		this.manager.renderCurrent();
	}

	init() {
		this.initHUD();
		this.track.buildMaterials(this.quality);
		this.track.buildScenes(this, this.quality);
		this.initGameComposer();
	}

	load(opts) {
		this.track.load(opts, this.quality);
	}

	initGameplay() {
		var self = this;

		this.gameplay = new bkcore.hexgl.Gameplay({
			mode: this.mode,
			hud: this.hud,
			shipControls: this.components.shipControls,
			cameraControls: this.components.cameraChase,
			analyser: this.track.analyser,
			pixelRatio: this.track.pixelRatio,
			track: this.track,
			onFinish: function() {
				self.components.shipControls.terminate();
				self.displayScore(this.finishTime, this.lapTimes);
			}
		});
		// temp
		// this.gameplay.start();
	}

	displayScore(f, l) {
		this.active = false;

		var tf = bkcore.Timer.msToTimeString(f);
		var tl = [
			bkcore.Timer.msToTimeString(l[0]),
			bkcore.Timer.msToTimeString(l[1]),
			bkcore.Timer.msToTimeString(l[2])
		];

		if (this.gameover !== null) {
			this.gameover.style.display = "block";
			this.gameover.children[0].innerHTML = tf.m + "'" + tf.s + "''" + tf.ms;
			this.containers.main.parentElement.style.display = "none";
			return;
		}
	}

	initRenderer() {
		var renderer = new THREE.WebGLRenderer({
			antialias: false,
			clearColor: 0x000000
		});

		// desktop + quality mid or high
		if (this.quality > 2) {
			renderer.physicallyBasedShading = true;
			renderer.gammaInput = true;
			renderer.gammaOutput = true;
			renderer.shadowMapEnabled = true;
			renderer.shadowMapSoft = true;
		}

		renderer.autoClear = false;
		renderer.sortObjects = false;
		renderer.setSize( this.width, this.height );
		renderer.domElement.style.position = "relative";

		this.containers.main.appendChild( renderer.domElement );
		this.canvas = renderer.domElement;
		this.renderer = renderer;
		this.manager = new bkcore.threejs.RenderManager(renderer);
	}

	initHUD() {
		if (!this.displayHUD) return;
		this.hud = new bkcore.hexgl.HUD({
			width: this.width,
			height: this.height,
			font: "BebasNeueRegular",
			bg: this.track.lib.get("images", "hud.bg"),
			speed: this.track.lib.get("images", "hud.speed"),
			shield: this.track.lib.get("images", "hud.shield")
		});
		this.containers.overlay.appendChild(this.hud.canvas);
	}

	initGameComposer() {
		var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		var renderTarget = new THREE.WebGLRenderTarget( this.width, this.height, renderTargetParameters );

		// GAME COMPOSER
		var renderSky = new THREE.RenderPass( this.manager.get("sky").scene, this.manager.get("sky").camera );
		var renderModel = new THREE.RenderPass( this.manager.get("game").scene, this.manager.get("game").camera );
		renderModel.clear = false;

		this.composers.game = new THREE.EffectComposer( this.renderer, renderTarget );

		var effectHex = new THREE.ShaderPass( bkcore.threejs.Shaders[ "hexvignette" ] );
		effectHex.uniforms[ 'size' ].value = 512.0 * (this.width/1633);
		effectHex.uniforms[ 'rx' ].value = this.width;
		effectHex.uniforms[ 'ry' ].value = this.height;
		effectHex.uniforms[ 'tHex' ].texture = this.track.lib.get("textures", "hex");
		effectHex.uniforms[ 'color' ].value = this.extras.vignetteColor;
		effectHex.renderToScreen = true;

		this.composers.game.addPass( renderSky );
		this.composers.game.addPass( renderModel );

		// desktop + quality mid or high
		var effectBloom = new THREE.BloomPass( 0.8, 25, 4 , 256);
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
		if (this.quality > 2) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}

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

		if (this.godmode) c.shieldDamage = 0.0;
	}

}

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.HexGL = HexGL;
