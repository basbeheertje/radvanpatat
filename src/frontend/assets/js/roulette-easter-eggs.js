(function (window) {
	const app = window.SnackRad;
	const state = app.state;
	const commandHandlers = Object.create(null);
	let phaseTimer = null;
	let previousFocus = null;
	// The audio graph exists only during an active shake. Every reference is
	// cleared by stopHarlemShake so a later command starts with a fresh context.
	let shakeAudioContext = null;
	let shakeAudioInterval = null;
	let shakeMasterGain = null;
	let shakeNoiseBuffer = null;
	let shakeBeatStep = 0;

	/**
	 * Normalizes user-entered commands so command registration remains
	 * case-insensitive and insensitive to accidental surrounding whitespace.
	 *
	 * @param {unknown} command
	 * @returns {string}
	 */
	function normaliseerCommando(command) {
		return typeof command === "string" ? command.trim().toLowerCase() : "";
	}

	function getCommandBar() {
		return document.getElementById("easter-egg-command-bar");
	}

	function getCommandInput() {
		return document.getElementById("easter-egg-command-input");
	}

	/**
	 * Opens the console only after the existing `eggs` sequence enabled easter
	 * eggs. Focus is retained for restoration when the console closes.
	 *
	 * @returns {boolean} Whether the console was opened.
	 */
	function openCommandBar() {
		if (!state.easterEggsActief) {
			return false;
		}

		const commandBar = getCommandBar();
		const commandInput = getCommandInput();
		if (!commandBar || !commandInput) {
			return false;
		}

		if (document.activeElement !== commandInput) {
			previousFocus = document.activeElement;
		}
		commandBar.classList.remove("is-hidden");
		commandBar.setAttribute("aria-hidden", "false");
		document.body.classList.add("easter-command-open");
		commandInput.value = "";
		window.requestAnimationFrame(function () {
			commandInput.focus();
		});
		return true;
	}

	/**
	 * Closes the console and returns keyboard users to their previous control.
	 *
	 * @returns {void}
	 */
	function closeCommandBar() {
		const commandBar = getCommandBar();
		const commandInput = getCommandInput();
		if (commandBar) {
			commandBar.classList.add("is-hidden");
			commandBar.setAttribute("aria-hidden", "true");
		}
		document.body.classList.remove("easter-command-open");
		if (commandInput) {
			commandInput.value = "";
		}

		if (previousFocus && typeof previousFocus.focus === "function") {
			previousFocus.focus();
		}
		previousFocus = null;
	}

	function createNoiseBuffer(context) {
		const frameCount = Math.floor(context.sampleRate * 0.14);
		const buffer = context.createBuffer(1, frameCount, context.sampleRate);
		const channel = buffer.getChannelData(0);
		for (let index = 0; index < frameCount; index += 1) {
			channel[index] = (Math.random() * 2) - 1;
		}
		return buffer;
	}

	function playKick(context, output, startTime) {
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(145, startTime);
		oscillator.frequency.exponentialRampToValueAtTime(45, startTime + 0.14);
		gain.gain.setValueAtTime(0.72, startTime);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);
		oscillator.connect(gain);
		gain.connect(output);
		oscillator.start(startTime);
		oscillator.stop(startTime + 0.17);
	}

	function playNoiseHit(context, output, startTime, options) {
		const source = context.createBufferSource();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		source.buffer = shakeNoiseBuffer;
		filter.type = options.filterType;
		filter.frequency.setValueAtTime(options.frequency, startTime);
		gain.gain.setValueAtTime(options.volume, startTime);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + options.duration);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(output);
		source.start(startTime);
		source.stop(startTime + options.duration);
	}

	function playBass(context, output, startTime, frequency) {
		const oscillator = context.createOscillator();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		oscillator.type = "sawtooth";
		oscillator.frequency.setValueAtTime(frequency, startTime);
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(230, startTime);
		gain.gain.setValueAtTime(0.08, startTime);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
		oscillator.connect(filter);
		filter.connect(gain);
		gain.connect(output);
		oscillator.start(startTime);
		oscillator.stop(startTime + 0.23);
	}

	function playShakeBeatStep() {
		if (!shakeAudioContext || !shakeMasterGain) {
			return;
		}

		const context = shakeAudioContext;
		const startTime = context.currentTime + 0.01;
		const step = shakeBeatStep % 8;
		playNoiseHit(context, shakeMasterGain, startTime, {
			filterType: "highpass",
			frequency: 6500,
			volume: step % 2 === 0 ? 0.05 : 0.025,
			duration: 0.045
		});

		if ([0, 3, 4, 6].includes(step)) {
			playKick(context, shakeMasterGain, startTime);
		}
		if (step === 2 || step === 6) {
			playNoiseHit(context, shakeMasterGain, startTime, {
				filterType: "bandpass",
				frequency: 1700,
				volume: 0.19,
				duration: 0.13
			});
		}
		if (step === 0 || step === 4) {
			playBass(context, shakeMasterGain, startTime, step === 0 ? 55 : 65.41);
		}

		shakeBeatStep += 1;
	}

	/**
	 * Starts an original, locally synthesized shake beat. Generating the rhythm
	 * avoids an external media dependency and starts inside the Enter gesture,
	 * which satisfies browser autoplay policies.
	 *
	 * @returns {boolean} Whether an audio context could be started.
	 */
	function startShakeAudio() {
		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (typeof AudioContextClass !== "function") {
			return false;
		}

		try {
			shakeAudioContext = new AudioContextClass();
			shakeMasterGain = shakeAudioContext.createGain();
			shakeMasterGain.gain.setValueAtTime(0.24, shakeAudioContext.currentTime);
			shakeMasterGain.connect(shakeAudioContext.destination);
			shakeNoiseBuffer = createNoiseBuffer(shakeAudioContext);
			shakeBeatStep = 0;
			const resumeResult = shakeAudioContext.resume();
			if (resumeResult && typeof resumeResult.catch === "function") {
				resumeResult.catch(function () {
					return;
				});
			}
			playShakeBeatStep();
			shakeAudioInterval = window.setInterval(playShakeBeatStep, 125);
			return true;
		} catch (error) {
			stopShakeAudio();
			return false;
		}
	}

	/**
	 * Fades and closes the generated audio graph together with the visual
	 * effect, preventing oscillators or intervals from surviving Escape.
	 *
	 * @returns {void}
	 */
	function stopShakeAudio() {
		if (shakeAudioInterval) {
			window.clearInterval(shakeAudioInterval);
			shakeAudioInterval = null;
		}

		const context = shakeAudioContext;
		const masterGain = shakeMasterGain;
		shakeAudioContext = null;
		shakeMasterGain = null;
		shakeNoiseBuffer = null;
		shakeBeatStep = 0;

		if (!context || context.state === "closed") {
			return;
		}

		const closeContext = function () {
			context.close().catch(function () {
				return;
			});
		};
		if (masterGain) {
			const now = context.currentTime;
			masterGain.gain.cancelScheduledValues(now);
			masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.001), now);
			masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
			window.setTimeout(closeContext, 90);
		} else {
			closeContext();
		}
	}

	/**
	 * Removes every phase class, timer and audio node so roulette interactions
	 * return to their normal state immediately after Escape.
	 *
	 * @returns {void}
	 */
	function stopHarlemShake() {
		if (phaseTimer) {
			window.clearTimeout(phaseTimer);
			phaseTimer = null;
		}
		stopShakeAudio();
		document.body.classList.remove(
			"harlem-shake-active",
			"harlem-shake-intro",
			"harlem-shake-party"
		);
	}

	/**
	 * Runs a two-phase page animation: the wheel moves alone first, followed by
	 * independent page regions. Reduced-motion users receive a shorter,
	 * non-translating visual pulse through the corresponding CSS media query.
	 *
	 * @returns {void}
	 */
	function startHarlemShake() {
		stopHarlemShake();
		closeCommandBar();
		app.trackAnalyticsEvent("HARLEM_SHAKE_STARTED");
		document.body.classList.add("harlem-shake-active", "harlem-shake-intro");
		startShakeAudio();
		if (app.ui && typeof app.ui.toonToast === "function") {
			app.ui.toonToast("Harlem Shake! Druk Esc om te stoppen.", "positive");
		}

		const reducedMotion = typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const introDuration = reducedMotion ? 450 : 1200;

		// The party phase starts only after the wheel has completed its solo,
		// preserving the recognizable setup before the whole page joins in.
		phaseTimer = window.setTimeout(function () {
			phaseTimer = null;
			document.body.classList.remove("harlem-shake-intro");
			document.body.classList.add("harlem-shake-party");
		}, introDuration);
	}

	/**
	 * Reports the effect state without exposing internal timers or audio nodes.
	 *
	 * @returns {boolean}
	 */
	function isHarlemShakeActive() {
		return document.body.classList.contains("harlem-shake-active");
	}

	/**
	 * Reports whether the generated beat currently owns an audio context.
	 *
	 * @returns {boolean}
	 */
	function isShakeAudioActive() {
		return Boolean(
			shakeAudioContext &&
			shakeAudioContext.state === "running" &&
			shakeAudioInterval
		);
	}

	/**
	 * Checks whether a normalized command is available in the extensible
	 * command registry.
	 *
	 * @param {unknown} command
	 * @returns {boolean}
	 */
	function isBekendCommando(command) {
		return Object.prototype.hasOwnProperty.call(
			commandHandlers,
			normaliseerCommando(command)
		);
	}

	/**
	 * Executes a registered command only while easter eggs are enabled.
	 * Unknown commands keep the console open so the visitor can correct them.
	 *
	 * @param {unknown} command
	 * @returns {boolean} Whether a command was executed.
	 */
	function voerCommandoUit(command) {
		if (!state.easterEggsActief) {
			return false;
		}

		const normalizedCommand = normaliseerCommando(command);
		const handler = commandHandlers[normalizedCommand];
		if (!handler) {
			if (app.ui && typeof app.ui.toonToast === "function") {
				app.ui.toonToast(
					normalizedCommand ? `Onbekend commando: ${normalizedCommand}` : "Typ eerst een commando",
					"negative"
				);
			}
			return false;
		}

		handler();
		return true;
	}

	/**
	 * Hides the command UI when `eggs` is disabled. A running shake deliberately
	 * continues because Escape is the only user action allowed to stop it.
	 *
	 * @returns {void}
	 */
	function deactivate() {
		closeCommandBar();
	}

	commandHandlers.shake = startHarlemShake;

	app.easterEggs = {
		normaliseerCommando: normaliseerCommando,
		isBekendCommando: isBekendCommando,
		openCommandBar: openCommandBar,
		closeCommandBar: closeCommandBar,
		voerCommandoUit: voerCommandoUit,
		startHarlemShake: startHarlemShake,
		stopHarlemShake: stopHarlemShake,
		isHarlemShakeActive: isHarlemShakeActive,
		isShakeAudioActive: isShakeAudioActive,
		deactivate: deactivate
	};
})(window);
