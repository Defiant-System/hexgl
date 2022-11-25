
class Gameplay {
	
	constructor(opts) {
		this.startDelay = opts.hud == null ? 0 : 100;
		this.countDownDelay = opts.hud == null ? 1000 : 500;

		this.active = false;
		this.timer = new Timer();
		this.hud = opts.hud;
		this.shipControls = opts.shipControls;
		this.cameraControls = opts.cameraControls;
		this.track = opts.track;
		this.analyser = opts.analyser;
		this.pixelRatio = opts.pixelRatio;
		this.previousCheckPoint = -1;

		this.results = {
			FINISH: 1,
			DESTROYED: 2,
			WRONGWAY: 3,
			REPLAY: 4,
			NONE: -1
		};
		this.result = this.results.NONE;

		this.lap = 1;
		this.lapTimes = [];
		this.lapTimeElapsed = 0;
		this.maxLaps = 3;
		this.score = null;
		this.finishTime = null;
		this.onFinish = opts.onFinish;

		this.modes = {
			timeattack: () => {
				this.raceData.tick(this.timer.time.elapsed);
				this.hud != null && this.hud.updateTime(this.timer.getElapsedTime());
				var cp = this.checkPoint();

				if (cp == this.track.checkpoints.start && this.previousCheckPoint == this.track.checkpoints.last) {
					this.previousCheckPoint = cp;
					var t = this.timer.time.elapsed;
					this.lapTimes.push(t - this.lapTimeElapsed);
					this.lapTimeElapsed = t;

					if (this.lap == this.maxLaps) {
						this.end(this.results.FINISH);
					} else {
						this.lap++;
						this.hud != null && this.hud.updateLap(this.lap, this.maxLaps);

						if (this.lap == this.maxLaps) {
							this.hud != null && this.hud.display("Final lap", 0.5);
						}
					}
				} else if (cp != -1 && cp != this.previousCheckPoint) {
					this.previousCheckPoint = cp;
					//this.hud.display("Checkpoint", 0.5);
				}

				if (this.shipControls.destroyed == true) {
					this.end(this.results.DESTROYED);
				}
			},
			replay: () => {
				this.raceData.applyInterpolated(this.timer.time.elapsed);

				if (this.raceData.seek == this.raceData.last) {
					this.end(this.result.REPLAY);
				}
			}
		};
		
		this.mode = opts.mode == undefined || !(opts.mode in this.modes) ? "timeattack" : opts.mode;
		this.raceData = null;
		this.step = 0;

	}

	simu() {
		this.lapTimes = [92300, 91250, 90365];
		this.finishTime = this.lapTimes[0] + this.lapTimes[1] + this.lapTimes[2];
		if (this.hud != null) this.hud.display("Finish");
		this.step = 100;
		this.result = this.results.FINISH;
		this.shipControls.active = false;
	}

	start(opts) {
		this.finishTime = null;
		this.score = null;
		this.lap = 1;

		this.shipControls.reset(this.track.spawn, this.track.spawnRotation);
		this.shipControls.active = false;
		this.previousCheckPoint = this.track.checkpoints.start;
		this.raceData = new bkcore.hexgl.RaceData(this.track.name, this.mode, this.shipControls);

		if (this.mode == "replay") {
			this.cameraControls.mode = this.cameraControls.modes.ORBIT;
			if (this.hud != null) this.hud.messageOnly = true;

			try {
				var d = localStorage[`race-${this.track.name}-replay`];
				if (d == undefined) {
					console.error(`No replay data for race-${this.track.name}-replay.`);
					return false;
				}
				this.raceData.import( JSON.parse(d) );
			} catch(e) {
				console.error('Bad replay format : '+e); return false;
			}
		}

		this.active = true;
		this.step = 0;
		this.timer.start();

		if (this.hud != null) {
			this.hud.resetTime();
			this.hud.display("Get ready", 1);
			this.hud.updateLap(this.lap, this.maxLaps);
		}
	}

	end(result) {
		this.score = this.timer.getElapsedTime();
		this.finishTime = this.timer.time.elapsed;
		this.timer.start();
		this.result = result;
		this.shipControls.active = false;

		if (result == this.results.FINISH) {
			if (this.hud != null) this.hud.display("Finish", 2);
			this.step = 100;
		} else if (result == this.results.DESTROYED) {
			if (this.hud != null) this.hud.display("Destroyed", 2);
			this.step = 100;
		}
	}

	update() {
		if (!this.active) return;

		this.timer.update();

		let cDelay = this.countDownDelay + this.startDelay;
		
		if (this.step == 0 && this.timer.time.elapsed >= cDelay) {
			if (this.hud != null) this.hud.display("3");
			this.step = 1;
		} else if (this.step == 1 && this.timer.time.elapsed >= 2 * cDelay) {
			if (this.hud != null) this.hud.display("2");
			this.step = 2;
		} else if (this.step == 2 && this.timer.time.elapsed >= 3 * cDelay) {
			if (this.hud != null) this.hud.display("1");
			this.step = 3;
		} else if (this.step == 3 && this.timer.time.elapsed >= 4 * cDelay) {
			if (this.hud != null) this.hud.display("Go", 0.5);
			this.step = 4;
			this.timer.start();
			
			if (this.mode != "replay") this.shipControls.active = true;
		} else if (this.step == 4) {
			this.modes[this.mode].call(this);
		} else if (this.step == 100 && this.timer.time.elapsed >= 2000) {
			this.active = false;
			this.onFinish.call(this);
		}
	}

	checkPoint() {
		let x = Math.round(this.analyser.pixels.width/2 + this.shipControls.dummy.position.x * this.pixelRatio),
			z = Math.round(this.analyser.pixels.height/2 + this.shipControls.dummy.position.z * this.pixelRatio),
			color = this.analyser.getPixel(x, z);

		if (color.r == 255 && color.g == 255 && color.b < 250) return color.b;
		else return -1;
	}

}
