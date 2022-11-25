
class Timer {
	
	// Creates a new timer, inactive by default.
	// Call Timer.start() to activate.
	constructor() {
		this.time = {
			start: 0,
			current: 0,
			previous: 0,
			elapsed: 0,
			delta: 0,
		};
		this.active = false;
	}

	// Starts/restarts the timer.
	start() {
		let now = (new Date).getTime();
		this.time.start = now;
		this.time.current = now;
		this.time.previous = now;
		this.time.elapsed = 0;
		this.time.delta = 0;
		return this.active = true;
	}

	// Pauses(true)/Unpauses(false) the timer.
	// @param bool Do pause
	pause(doPause) {
		return this.active = !doPause;
	}

	// Update method to be called inside a RAF loop
	update() {
		if (!this.active) return;
		
		let now = (new Date).getTime();
		this.time.current = now;
		this.time.elapsed = this.time.current - this.time.start;
		this.time.delta = now - this.time.previous;
		return this.time.previous = now;
	}

	// Returns a formatted version of the current elapsed time using msToTime().
	getElapsedTime() {
		return this.msToTime(this.time.elapsed);
	}

	msToTime(t) {
		let h, m, ms, s;
		ms = t % 1000;
		s = Math.floor((t / 1000) % 60);
		m = Math.floor((t / 60000) % 60);
		h = Math.floor(t / 3600000);
		return { h, m, s, ms, ms };
	}

	// Formats a millisecond integer into a h/m/s/ms object with prefix zeros
	// @param x int In milliseconds
	// @return Object<string>{h,m,s,ms}
	msToTimeString(t) {
		let time = this.msToTime(t);
		time.h = this.zfill(time.h, 2);
		time.m = this.zfill(time.m, 2);
		time.s = this.zfill(time.s, 2);
		time.ms = this.zfill(time.ms, 4);
		return time;
	}

	zfill(num, size) {
		let len = size - num.toString().length;
		if (len > 0) return new Array(len + 1).join("0") + num;
		else return num.toString();
	}

}
