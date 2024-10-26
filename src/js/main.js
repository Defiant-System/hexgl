
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

@import "modules/test.js"


// replay data
let replay = @import "replay.json";

// default settings
let Pref = {
		"fx": true,
		"music": true,
		"best-race": 540000,
		"best-lap": 180000,
	},
	els = {
		content: window.find("content"),
		gameOver: window.find(".view-game-over"),
		overlay: window.find(".overlay canvas"),
		main: window.find(".main"),
	},
	game = new HexGL({
		width: window.innerWidth,
		height: window.innerHeight,
		container: els.main[0],
		overlay: els.overlay[0],
		track: "Cityscape",
		godmode: 0,
	});


const hexgl = {
	init() {
		// fast references
		this.els = els;
		// get settings, if any
		this.settings = window.settings.getItem("settings") || { ...Pref };
		// enable start button when resources are done loading
		game.load({ onLoad: () => {
			els.content.find(".menu .start.disabled").removeClass("disabled");
			
			// DEV-ONLY-START
			Test.init(this);
			// DEV-ONLY-END
		}});
		// best rece / lap values
		this.dispatch({ type: "update-best-race-lap" });
		
		// temp
		// els.content.find(".fx").trigger("click");
	},
	dispatch(event) {
		let Self = hexgl,
			Controls = game.components.shipControls,
			time,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.close":
				// save settings
				if (Self.saveSettings) {
					window.settings.setItem("settings", Self.settings);
				}
				break;
			case "window.blur":
				if (Controls) {
					game.pause();
				}
				break;
			// system events
			case "window.keystroke":
				// keyboard controls; DOWN state
				switch (event.keyCode) {
					case 27: // escape
						Self.dispatch({ type: "reset-to-start-view" });
						break;
					case 77: // m - mute
						break;
					case 80: // p - pause
						if (game.active) {
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
			case "save-race":
				let file = new karaqu.File({ kind: "json" });
				// save race data as JSON file
				window.dialog.saveAs(file, {
					json:  () => {
						let data = game.gameplay.raceData.export();
						return JSON.stringify(data);
					},
				});
				break;
			case "replay-race":
				Self.dispatch({ type: "show-game", mode: "replay" });
				break;
			case "toggle-god-mode":
				game.godmode = !game.godmode;
				if (game.godmode) event.xMenu.setAttribute("is-checked", 1);
				else event.xMenu.removeAttribute("is-checked");
				break;
			case "reset-to-start-view":
				Self.dispatch({ type: "show-start" });
				game.gameplay.raceData.seek = 0;
				game.stop();
				break;
			case "toggle-music":
				// value = window.midi.playing;
				// if (value) {
				// 	window.midi.stop();
				// } else {
				// 	window.midi.play("~/audio/beethoven.mid");
				// }
				// UI value
				event.el.find("span").html(value ? "Off" : "On");
				// update settings
				Self.settings.music = value ? false : true;
				break;
			case "toggle-fx":
				value = window.audio.mute;
				// UI value
				event.el.find("span").html(value ? "On" : "Off");
				// change value
				window.audio.mute = !value;
				// update settings
				Self.settings.fx = value ? false : true;
				break;
			case "register-time":
				if (Self.settings["best-race"] > event.finish) {
					Self.settings["best-race"] = event.finish;
					Self.saveSettings = true;
				}
				if (Self.settings["best-lap"] > event.fastest) {
					Self.settings["best-lap"] = event.fastest;
					Self.saveSettings = true;
				}
				Self.dispatch({ type: "update-best-race-lap" });
				break;
			case "update-best-race-lap":
				if (Self.settings["best-race"] !== Pref["best-race"]) {
					Self.els.content.find(".best-score").addClass("show");
				}
				time = new Timer();
				value = time.valueOf(+Self.settings["best-race"]);
				Self.els.content.find(`.view-start .best-race span`).html(value);

				value = time.valueOf(+Self.settings["best-lap"]);
				Self.els.content.find(`.view-start .best-lap span`).html(value);
				break;
			case "show-pause":
				Self.els.content.find(".view-game").toggleClass("show-pause", !event.isOn);
				break;
			case "show-pre-game":
			case "show-game-over":
			case "show-credits":
			case "show-finish":
			case "show-start":
				Self.els.content.prop({ className: event.type });
				break;
			case "show-game":
				Self.els.content.prop({ className: event.type });
				game.init();
				game.start(event.mode);
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = hexgl;
 