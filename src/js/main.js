
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


/*

bkcore/Audio.js
launch.js

*/

console.log( THREE );


let game;

const hexgl = {
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			gameOver: window.find(".game-over"),
			cvsOverlay: window.find("canvas.overlay"),
			cvsMain: window.find("canvas.main"),
		};

		// this.dispatch({ type: "new-game" });
	},
	dispatch(event) {
		let Self = hexgl,
			el;
		switch (event.type) {
			case "window.init":
				break;
			case "new-game":
				game = new bkcore.hexgl.HexGL({
					// document: document,
					width: window.innerWidth,
					height: window.innerHeight,
					container: Self.els.cvsMain,
					overlay: Self.els.cvsOverlay,
					gameover: Self.els.gameOver,
					track: "Cityscape",
					controlType: 0,
					difficulty: 0,
					quality: 3,
					godmode: 1,
					hud: 1,
				});
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = hexgl;
 