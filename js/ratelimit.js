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
			console.log("RateLimiter: Performing immediate request");
			request();
			this.outQueue.push(new Date().getTime());
		} else {
			this.inQueue.push(request);
			console.log("RateLimiter: Queueing request");
		}
		
		console.log("RateLimiter: outQueue: " + this.outQueue.length + " inQueue: " + this.inQueue.length);
		
		// Start the timer if it wasn't previously running.
		if (!this.active) {
			console.log("RateLimiter: starting timer");
			this.startTimer();
		}
	}
	
	this.startTimer = function() {
		this.active = true;
		var delay = Math.max(this.period, this.burstPeriod - (new Date().getTime() - this.outQueue[0]));
		console.log("RateLimiter: Timer delay: " + delay);
		setTimeout(function(foo) {foo.next();}, delay , this);
	}
	
	this.next = function() {
		console.log("RateLimiter: timer tick");
		// If the oldest element in outQueue is more than period * burst old, remove it
		if (this.outQueue.length > 0) {
			if (this.outQueue[0] + this.burstPeriod <= new Date().getTime()) {
				this.outQueue.shift();
				console.log("RateLimiter: dropping old request from outQueue");
			}
		}
		
		// Do more requests if we have available space in outQueue
		while (this.outQueue.length < this.burst && this.inQueue.length > 0) {
			var request = this.inQueue.shift();
			console.log("RateLimiter: Performing queued request");
			request();
			this.outQueue.push(new Date().getTime());
		}
		
		console.log("RateLimiter: outQueue: " + this.outQueue.length + " inQueue: " + this.inQueue.length);
		
		// Queue the next timer tick if outQueue isn't empty
		if (this.outQueue.length > 0) {
			this.startTimer();
		} else {
			this.active = false;
			console.log("RateLimiter: stopping timer");
		}
	}
}
