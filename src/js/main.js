
@import "libs/Three.js"
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
		gameOver: window.find(".game-over"),
		overlay: window.find(".overlay"),
		main: window.find(".main"),
	},
	game = new bkcore.hexgl.HexGL({
		// document: document,
		width: window.innerWidth,
		height: window.innerHeight,
		container: els.main[0],
		overlay: els.overlay[0],
		gameover: els.gameOver[0],
		track: "Cityscape",
		controlType: 0,
		difficulty: 0,
		quality: 3,
		godmode: 1,
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
			el;
		switch (event.type) {
			case "set-quality":
				break;
			case "toggle-hud":
				break;
			case "toggle-god-mode":
				break;
			case "show-pre-game":
			case "show-credits":
			case "show-start":
				Self.els.content.prop({ className: event.type });
				break;
			case "show-game":
				Self.els.content.prop({ className: event.type });

				game.load({
					onLoad: function() {
						console.log('LOADED.');
						game.init();
						return game.start();
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
 