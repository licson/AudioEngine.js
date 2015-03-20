// AudioEngine.js

(function(window){
	var AudioEngine = AudioEngine || {};
	AudioEngine.sounds = AudioEngine.sounds || {};

	AudioEngine.init = function(){
		if(window.AudioContext||window.webkitAudioContext){
			AudioEngine._ctx = new (window.AudioContext||window.webkitAudioContext)();
			AudioEngine._panner = AudioEngine._ctx.createPanner();
			AudioEngine._panner.connect(AudioEngine._ctx.destination);
		}
		else {
			AudioEngine._ctx = null;
		}
	};

	AudioEngine.init();

	AudioEngine.addSound = function(src, id, loop, callback, usePanner){
		var ctx = AudioEngine._ctx;
		var audio = new Audio();
		
		if(ctx){
			var audio = { src: null, gainNode: null, bufferNode: null, loop: loop };
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'arraybuffer';

			xhr.onload = function(){
				ctx.decodeAudioData(xhr.response, function(b){
					// Create Gain Node
					var gainNode = ctx.createGain();

					if(usePanner === true){
						gainNode.connect(AudioEngine._panner);
					}
					else {
						gainNode.connect(ctx.destination);
					}

					// Add the audio source
					audio.src = b;

					//Remember the gain node
					audio.gainNode = gainNode;
					
					callback();
				}, function(e){
					console.error('Audio decode failed!', e);
				});
			};

			xhr.open('GET', src, true);
			xhr.send(null);
		}
		else {
			// Workaround for old Safari
			audio.addEventListener('canplay', function(){
				audio.pause();
				audio.currentTime = 0;

				callback();
			}, false);

			audio.autoplay = true;
			audio.loop = loop;
			audio.src = src;
		}
		
		AudioEngine.sounds[id] = audio;
	};

	AudioEngine.play = function(id){
		var ctx = AudioEngine._ctx;

		if(ctx){
			var sound = ctx.createBufferSource();
			sound.connect(AudioEngine.sounds[id].gainNode);
			
			sound.buffer = AudioEngine.sounds[id].src;
			sound.loop = AudioEngine.sounds[id].loop;

			AudioEngine.sounds[id].gainNode.gain.value = 1;
			AudioEngine.sounds[id].bufferNode = sound;

			sound.start ? sound.start(0) : sound.noteOn(0);
		}
		else {
			if(AudioEngine.sounds[id].currentTime > 0){
				AudioEngine.sounds[id].pause();
				AudioEngine.sounds[id].currentTime = 0;
			}

			AudioEngine.sounds[id].play();
		}
	};

	AudioEngine.stop = function(id){
		var ctx = AudioEngine._ctx;

		if(ctx){
			if(AudioEngine.sounds[id].bufferNode !== null){
				var bufferNode = AudioEngine.sounds[id].bufferNode;
				bufferNode.stop ? bufferNode.stop(ctx.currentTime) : bufferNode.noteOff(ctx.currentTime);
			}
		}
		else {
			AudioEngine.sounds[id].pause();
			AudioEngine.sounds[id].currentTime = 0;
		}
	};

	AudioEngine.volume = function(id, volume){
		var ctx = AudioEngine._ctx;

		if(ctx){
			AudioEngine.sounds[id].gainNode.gain.value = volume;
		}
		else {
			AudioEngine.sounds[id].volume = volume;
		}
	};

	AudioEngine.setListenerPos = function(vec){
		if(AudioEngine._ctx){
			var panner = AudioEngine._panner;
			panner.setPosition(vec2.x, vec2.y, vec2.z);
		}
	};

	AudioEngine.setListenerVelocity = function(vec){
		if(AudioEngine._ctx){
			var panner = AudioEngine._panner;
			panner.setVelocity(vec.x, vec.y, vec.z);
		}
	};

	window.AudioEngine = AudioEngine;
})(window);