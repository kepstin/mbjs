/*
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details.
 */

/*
 * Usage:
 * var rl = new RateLimiter(1100, 10); // 1100 ms per request, burst 10 requests
 * rl.queue(function() { do stuff });
 * rl.queue(function() { do more stuff });
 * rl.queue(function() { do nothing, but waste a queue slot anyways });
 * ...
 */

function RateLimiter(period, burst) {
	this.inQueue = [];
	this.outQueue = []
	this.period = period || 1100;
	this.burst = burst || 10;
	this.burstPeriod = this.period * this.burst;
	this.active = false;
	
	this.queue = function(request) {
		// If there is space in the outqueue, do the request immediately.
		if (this.outQueue.length < this.burst) {
			request();
			this.outQueue.push(new Date().getTime());
		} else {
			this.inQueue.push(request);
		}
		
		
		// Start the timer if it wasn't previously running.
		if (!this.active) {
			this.startTimer();
		}
	}
	
	this.startTimer = function() {
		this.active = true;
		var delay = Math.max(this.period, this.burstPeriod - (new Date().getTime() - this.outQueue[0]));
		setTimeout(function(foo) {foo.next();}, delay , this);
	}
	
	this.next = function() {
		// If the oldest element in outQueue is more than period * burst old, remove it
		if (this.outQueue.length > 0) {
			if (this.outQueue[0] + this.burstPeriod <= new Date().getTime()) {
				this.outQueue.shift();
			}
		}
		
		// Do more requests if we have available space in outQueue
		while (this.outQueue.length < this.burst && this.inQueue.length > 0) {
			var request = this.inQueue.shift();
			request();
			this.outQueue.push(new Date().getTime());
		}
		
		// Queue the next timer tick if outQueue isn't empty
		if (this.outQueue.length > 0) {
			this.startTimer();
		} else {
			this.active = false;
		}
	}
}
