
let geometries = {
		"bonus.base"					: @import "geometries/bonus/base/base.js",
		"booster"						: @import "geometries/booster/booster.js",
		"ship.feisar"					: @import "geometries/ships/feisar/feisar.js",
		"track.cityscape"				: @import "geometries/tracks/cityscape/track.js",
		"track.cityscape.scrapers1"		: @import "geometries/tracks/cityscape/scrapers1.js",
		"track.cityscape.scrapers2"		: @import "geometries/tracks/cityscape/scrapers2.js",
		"track.cityscape.start"			: @import "geometries/tracks/cityscape/start.js",
		"track.cityscape.start.banner"	: @import "geometries/tracks/cityscape/startbanner.js",
		"track.cityscape.bonus.speed"	: @import "geometries/tracks/cityscape/bonus/speed.js"
	};

@import "libs/Three.dev.js"
@import "libs/ShaderExtras.js"
@import "libs/postprocessing/EffectComposer.js"
@import "libs/postprocessing/RenderPass.js"
@import "libs/postprocessing/BloomPass.js"
@import "libs/postprocessing/ShaderPass.js"
@import "libs/postprocessing/MaskPass.js"

@import "bkcore/threejs/RenderManager.js"
@import "bkcore/threejs/Shaders.js"
@import "bkcore/threejs/Particles.js"
@import "bkcore/threejs/Loader.js"

@import "bkcore/Timer.js"
@import "bkcore/ImageData.js"
@import "bkcore/Utils.js"

@import "bkcore/hexgl/HUD.js"
@import "bkcore/hexgl/RaceData.js"
@import "bkcore/hexgl/ShipControls.js"
@import "bkcore/hexgl/ShipEffects.js"
@import "bkcore/hexgl/CameraChase.js"
@import "bkcore/hexgl/Gameplay.js"

@import "bkcore/hexgl/tracks/Cityscape.js"
@import "bkcore/hexgl/HexGL.js"


let els = {
		content: window.find("content"),
		gameOver: window.find(".view-game-over"),
		overlay: window.find(".overlay"),
		main: window.find(".main"),
	},
	game = new bkcore.hexgl.HexGL({
		width: window.innerWidth,
		height: window.innerHeight,
		container: els.main[0],
		overlay: els.overlay[0],
		gameover: els.gameOver,
		track: "Cityscape",
		controlType: 0,
		difficulty: 0,
		quality: 3,
		godmode: 0,
		hud: 1,
	});


const hexgl = {
	init() {
		// fast references
		this.els = els;

		// temp
		this.dispatch({ type: "show-game" });
	},
	dispatch(event) {
		let Self = hexgl,
			Controls = game.components.shipControls,
			el;
		// console.log(event);
		switch (event.type) {
			case "window.focus":
				break;
			case "window.blur":
				if (Controls) {
					Controls.speed = 0;
					game.pause();
				}
				break;
			// system events
			case "window.keystroke":
				// keyboard controls; DOWN state
				switch (event.keyCode) {
					case 27: // escape
						game.reset();
						break;
					case 77: // m - mute
						break;
					case 80: // p - pause
						if (game.active) {
							Controls.speed = 0;
							game.pause();
						} else {
							game.resume();
						}
						break;
					case 37: // left
						Controls.key.left = true;
						break;
					case 65: // a
						Controls.key.ltrigger = true;
						break;
					case 39: // right
						Controls.key.right = true;
						break;
					case 68: // d
						Controls.key.rtrigger = true;
						break;
					case 38: // up
					case 87: // w
						Controls.key.forward = true;
						break;
				}
				break;
			case "window.keyup":
				// keyboard controls; UP state
				switch (event.keyCode) {
					case 37: // left
						Controls.key.left = false;
						break;
					case 65: // a
						Controls.key.ltrigger = false;
						break;
					case 39: // right
						Controls.key.right = false;
						break;
					case 68: // d
						Controls.key.rtrigger = false;
						break;
					case 38: // up
					case 87: // w
						Controls.key.forward = false;
						break;
				}
				break;

			// custom events
			case "set-quality": break;
			case "toggle-hud": break;
			case "toggle-god-mode": break;
			case "show-pre-game":
			case "show-credits":
			case "show-start":
				Self.els.content.prop({ className: event.type });
				break;
			case "show-game":
				Self.els.content.prop({ className: event.type });

				game.load({
					onLoad: function() {
						game.init();
						game.start();
					}
				});
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = hexgl;
 