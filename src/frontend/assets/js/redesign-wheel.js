(function (window) {
	const app = window.SnackRad;
	const state = app.state;
	const core = app.core;
	const ui = app.ui;
	const config = app.config;

	const design = {
		size: 640,
		center: 320,
		outerRadius: 260,
		innerRadius: 98,
		rimRadius: 288,
		bulbRadius: 15,
		bulbCount: 18
	};

	function getSvgNode(tagName, attributes) {
		const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
		if (attributes) {
			Object.entries(attributes).forEach(function ([key, value]) {
				node.setAttribute(key, String(value));
			});
		}
		return node;
	}

	function degToRad(degrees) {
		return (degrees * Math.PI) / 180;
	}

	function polarToCartesian(radius, angle) {
		return {
			x: design.center + (radius * Math.cos(degToRad(angle))),
			y: design.center + (radius * Math.sin(degToRad(angle)))
		};
	}

	function normaliseerRotatie(rotation) {
		return ((rotation % 360) + 360) % 360;
	}

	function getSegmentAngle() {
		return 360 / state.alleSnacks.length;
	}

	function getSegmentGeometry(index) {
		const segmentAngle = getSegmentAngle();
		const halfAngle = segmentAngle / 2;
		const centerAngle = -90 + (index * segmentAngle);
		return {
			centerAngle: centerAngle,
			startAngle: centerAngle - halfAngle,
			endAngle: centerAngle + halfAngle
		};
	}

	function getSegmentPad(startAngle, endAngle) {
		const outerStart = polarToCartesian(design.outerRadius, startAngle);
		const outerEnd = polarToCartesian(design.outerRadius, endAngle);
		const innerEnd = polarToCartesian(design.innerRadius, endAngle);
		const innerStart = polarToCartesian(design.innerRadius, startAngle);
		const largeArcFlag = (endAngle - startAngle) <= 180 ? 0 : 1;

		return [
			"M", outerStart.x, outerStart.y,
			"A", design.outerRadius, design.outerRadius, 0, largeArcFlag, 1, outerEnd.x, outerEnd.y,
			"L", innerEnd.x, innerEnd.y,
			"A", design.innerRadius, design.innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
			"Z"
		].join(" ");
	}

	function getArcPath(radius, startAngle, endAngle) {
		const start = polarToCartesian(radius, startAngle);
		const end = polarToCartesian(radius, endAngle);
		const largeArcFlag = (endAngle - startAngle) <= 180 ? 0 : 1;

		return [
			"M", start.x, start.y,
			"A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
		].join(" ");
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function getWheelRoot() {
		return document.getElementById("wheel-rotor");
	}

	function getWheelShell() {
		return document.getElementById("wheel-shell");
	}

	function getGhost() {
		return document.getElementById("snack-drag-ghost");
	}

	function getSegmentElement(segmentIndex) {
		return document.querySelector(`[data-segment-index="${segmentIndex}"]`);
	}

	function getWheelInfo() {
		const shell = getWheelShell();
		const rect = shell.getBoundingClientRect();
		return {
			rect: rect,
			centerX: rect.left + (rect.width / 2),
			centerY: rect.top + (rect.height / 2),
			scale: rect.width / design.size
		};
	}

	function getWheelRadiusOnScreen() {
		return design.outerRadius * getWheelInfo().scale;
	}

	function getPointerSegmentIndex(clientX, clientY) {
		if (!state.alleSnacks.length) {
			return null;
		}

		const info = getWheelInfo();
		const deltaX = clientX - info.centerX;
		const deltaY = clientY - info.centerY;
		const distance = Math.hypot(deltaX, deltaY);
		const outerRadius = design.outerRadius * info.scale;
		const innerRadius = design.innerRadius * info.scale;

		if (distance < innerRadius || distance > outerRadius) {
			return null;
		}

		const pointerAngle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90 + 360) % 360;
		const segmentAngle = getSegmentAngle();
		const halfAngle = segmentAngle / 2;
		const adjustedAngle = (pointerAngle - normaliseerRotatie(state.redesignRotation || 0) + halfAngle + 360) % 360;
		return Math.floor(adjustedAngle / segmentAngle) + 1;
	}

	function getDragSegmentMarkup(segmentIndex) {
		const segment = getSegmentElement(segmentIndex);
		if (!segment) {
			return "";
		}

		const clone = segment.cloneNode(true);
		clone.removeAttribute("data-segment-index");
		clone.removeAttribute("style");
		const actueleRotatie = normaliseerRotatie(state.redesignRotation || 0);

		return [
			'<svg class="redesign-drag-segment" viewBox="0 0 640 640" aria-hidden="true">',
			`<g transform="translate(16 16) scale(0.95) rotate(${actueleRotatie} ${design.center} ${design.center})">`,
			clone.outerHTML,
			"</g>",
			"</svg>"
		].join("");
	}

	function updateGhostPosition(clientX, clientY) {
		if (!state.actieveDrag) {
			return;
		}

		const ghost = getGhost();
		ghost.style.left = `${clientX}px`;
		ghost.style.top = `${clientY}px`;
	}

	function hideGhost() {
		const ghost = getGhost();
		ghost.classList.add("hidden");
		ghost.innerHTML = "";
	}

	function verbergSegmentInWiel(segmentIndex) {
		const segment = getSegmentElement(segmentIndex);
		if (segment) {
			segment.style.opacity = "0";
		}
	}

	function herstelSegmentInWiel(segmentIndex) {
		const segment = getSegmentElement(segmentIndex);
		if (segment) {
			segment.style.opacity = "1";
		}
	}

	function isBuitenHetWiel(clientX, clientY) {
		const info = getWheelInfo();
		return Math.hypot(clientX - info.centerX, clientY - info.centerY) > (getWheelRadiusOnScreen() * 1.05);
	}

	function renderBulbs(group) {
		for (let bulbIndex = 0; bulbIndex < design.bulbCount; bulbIndex += 1) {
			const angle = -90 + ((360 / design.bulbCount) * bulbIndex);
			const point = polarToCartesian(design.rimRadius, angle);
			group.append(
				getSvgNode("circle", {
					cx: point.x,
					cy: point.y,
					r: design.bulbRadius + 6,
					fill: "rgba(255, 201, 40, 0.15)"
				}),
				getSvgNode("circle", {
					cx: point.x,
					cy: point.y,
					r: design.bulbRadius,
					fill: "#FFFFFF",
					stroke: "#FFC928",
					"stroke-width": 6
				})
			);
		}
	}

	function renderCenter(group) {
		group.append(
			getSvgNode("circle", {
				cx: design.center,
				cy: design.center + 10,
				r: 98,
				fill: "rgba(33, 23, 15, 0.16)"
			}),
			getSvgNode("circle", {
				cx: design.center,
				cy: design.center,
				r: 96,
				fill: "#FFFFFF",
				stroke: "#21170F",
				"stroke-width": 7
			}),
			getSvgNode("circle", {
				cx: design.center,
				cy: design.center,
				r: 84,
				fill: "#FFE487",
				stroke: "#21170F",
				"stroke-width": 4
			})
		);

		[-20, -10, -2, 8, 16, 24].forEach(function (angle, index) {
			group.append(getSvgNode("rect", {
				x: design.center - 8,
				y: design.center - 92,
				width: 16,
				height: index % 2 === 0 ? 72 : 82,
				rx: 6,
				fill: index % 2 === 0 ? "#FFC928" : "#F28C18",
				stroke: "#21170F",
				"stroke-width": 4,
				transform: `rotate(${angle} ${design.center} ${design.center - 18})`
			}));
		});

		group.append(
			getSvgNode("path", {
				d: "M 285 296 L 355 296 L 336 396 L 304 396 Z",
				fill: "#FFFFFF",
				stroke: "#21170F",
				"stroke-width": 5,
				"stroke-linejoin": "round"
			}),
			getSvgNode("path", {
				d: "M 318 296 L 355 296 L 336 396 Z",
				fill: "#F4E3C6",
				stroke: "#21170F",
				"stroke-width": 4,
				"stroke-linejoin": "round"
			}),
			getSvgNode("path", {
				d: "M 292 305 C 302 289 317 294 324 304 C 337 284 356 294 356 308 C 354 323 336 326 324 317 C 315 328 298 325 292 305 Z",
				fill: "#FFF6D9",
				stroke: "#21170F",
				"stroke-width": 4,
				"stroke-linejoin": "round"
			})
		);
	}

	function splitLabel(label) {
		const woorden = label.split(" ").filter(Boolean);
		const segmentAngle = getSegmentAngle();
		const maxCharsPerLine = segmentAngle <= 28 ? 7 : segmentAngle <= 34 ? 9 : 11;
		const maxLines = segmentAngle <= 28 ? 3 : 2;
		const regels = [];
		let huidigeRegel = "";

		woorden.forEach(function (woord) {
			const voorstel = huidigeRegel ? `${huidigeRegel} ${woord}` : woord;
			if (voorstel.length <= maxCharsPerLine || !huidigeRegel) {
				huidigeRegel = voorstel;
				return;
			}

			regels.push(huidigeRegel);
			huidigeRegel = woord;
		});

		if (huidigeRegel) {
			regels.push(huidigeRegel);
		}

		if (regels.length <= maxLines) {
			return regels;
		}

		const samengevoegd = regels.slice(0, maxLines - 1);
		samengevoegd.push(regels.slice(maxLines - 1).join(" "));
		return samengevoegd;
	}

	function renderSegment(group, snack, index) {
		const geometry = getSegmentGeometry(index);
		const color = config.kleuren[index % config.kleuren.length];
		const stroke = config.randKleuren[index % config.randKleuren.length];
		const segmentAngle = getSegmentAngle();
		const fontSize = clamp(22 - (Math.max(snack.name.length - 9, 0) * 0.55), 10.5, 17);
		const textRadius = clamp(design.outerRadius - 66, 176, 206);
		const textInset = clamp(segmentAngle * 0.16, 5, 9);
		const textPathId = `wheel-segment-label-${index}`;

		const segmentGroup = getSvgNode("g", {
			"data-segment-index": index + 1
		});
		const segmentPath = getSvgNode("path", {
			d: getSegmentPad(geometry.startAngle, geometry.endAngle),
			fill: color,
			stroke: stroke,
			"stroke-width": 6,
			"stroke-linejoin": "round"
		});
		segmentGroup.appendChild(segmentPath);

		const defs = getSvgNode("defs");
		const textPath = getSvgNode("path", {
			id: textPathId,
			d: getArcPath(textRadius, geometry.startAngle + textInset, geometry.endAngle - textInset),
			fill: "none",
			stroke: "none"
		});
		defs.appendChild(textPath);
		segmentGroup.appendChild(defs);

		const contentGroup = getSvgNode("g");
		const label = getSvgNode("text", {
			"font-size": fontSize,
			"font-weight": 900,
			fill: "#21170F",
			"letter-spacing": "-0.03em",
			"text-rendering": "geometricPrecision"
		});
		const labelPath = getSvgNode("textPath", {
			href: `#${textPathId}`,
			startOffset: "50%",
			"text-anchor": "middle",
			method: "align",
			spacing: "auto",
			textLength: Math.max(92, ((2 * Math.PI * textRadius) * ((segmentAngle - (textInset * 2)) / 360)) - 8),
			lengthAdjust: "spacingAndGlyphs"
		});
		labelPath.textContent = snack.name;
		label.appendChild(labelPath);
		contentGroup.appendChild(label);

		segmentGroup.appendChild(contentGroup);
		group.appendChild(segmentGroup);
	}

	function renderWheel() {
		const root = getWheelRoot();
		if (!root) {
			return;
		}

		root.innerHTML = "";
		root.setAttribute("transform", `rotate(${state.redesignRotation || 0} ${design.center} ${design.center})`);

		root.append(
			getSvgNode("circle", {
				cx: design.center,
				cy: design.center + 18,
				r: design.outerRadius + 6,
				fill: "rgba(33, 23, 15, 0.14)"
			}),
			getSvgNode("circle", {
				cx: design.center,
				cy: design.center,
				r: 304,
				fill: "#3A291E",
				stroke: "#21170F",
				"stroke-width": 10
			}),
			getSvgNode("circle", {
				cx: design.center,
				cy: design.center,
				r: 278,
				fill: "#5B4132",
				stroke: "#F5D06E",
				"stroke-width": 4
			})
		);

		renderBulbs(root);
		state.alleSnacks.forEach(function (snack, index) {
			renderSegment(root, snack, index);
		});
		renderCenter(root);
	}

	function createWheelState() {
		state.theWheel = {
			numSegments: state.alleSnacks.length,
			segments: [null].concat(state.alleSnacks.map(function (snack, index) {
				return {
					startAngle: getSegmentGeometry(index).startAngle,
					endAngle: getSegmentGeometry(index).endAngle,
					snack: snack
				};
			})),
			centerX: design.center,
			centerY: design.center,
			innerRadius: design.innerRadius,
			outerRadius: design.outerRadius,
			rotationAngle: state.redesignRotation || 0,
			draw: function () {
				renderWheel();
			}
		};
	}

	function createWheel() {
		if (typeof state.redesignRotation !== "number") {
			state.redesignRotation = 0;
		}
		renderWheel();
		createWheelState();
	}

	function stopDrag(herstelSegment) {
		const moetHerstellen = herstelSegment !== false;
		if (state.actieveDrag && moetHerstellen) {
			herstelSegmentInWiel(state.actieveDrag.segmentIndex);
		}
		state.actieveDrag = null;
		document.body.classList.remove("is-dragging-custom-snack");
		hideGhost();
	}

	function startDrag(segmentIndex, clientX, clientY) {
		const snack = state.alleSnacks[segmentIndex - 1];
		if (!snack || state.wheelSpinning) {
			return;
		}

		state.actieveDrag = {
			segmentIndex: segmentIndex,
			startClientX: clientX,
			startClientY: clientY
		};
		document.body.classList.add("is-dragging-custom-snack");
		verbergSegmentInWiel(segmentIndex);

		const ghost = getGhost();
		ghost.innerHTML = getDragSegmentMarkup(segmentIndex);
		ghost.classList.remove("hidden");
		updateGhostPosition(clientX, clientY);
	}

	function updateDrag(clientX, clientY) {
		if (!state.actieveDrag) {
			return;
		}

		updateGhostPosition(clientX, clientY);
		const ghost = getGhost();
		ghost.style.opacity = isBuitenHetWiel(clientX, clientY) ? "0.78" : "1";
	}

	function verwijderSnack(segmentIndex) {
		const snack = state.alleSnacks[segmentIndex - 1];
		if (!snack || state.alleSnacks.length <= 1) {
			return;
		}

		state.alleSnacks = state.alleSnacks.filter(function (candidate, index) {
			return index !== (segmentIndex - 1);
		});
		core.persistSnacks();
		createWheel();
	}

	function eindigDrag(clientX, clientY) {
		if (!state.actieveDrag) {
			return;
		}

		const segmentIndex = state.actieveDrag.segmentIndex;
		const buitenWiel = isBuitenHetWiel(clientX, clientY);
		stopDrag(!buitenWiel);
		if (buitenWiel) {
			verwijderSnack(segmentIndex);
		}
	}

	function getSegmentIndexFromPointer(clientX, clientY) {
		return getPointerSegmentIndex(clientX, clientY);
	}

	function toonUitslag(snack) {
		state.wheelSpinning = false;
		if (state.easterEggsActief && Math.random() < (state.eggsKansPercentage / 100)) {
			ui.showEasterEggResult(config.easterEggBerichten[Math.floor(Math.random() * config.easterEggBerichten.length)]);
			return;
		}

		ui.showResult(snack);
	}

	function animeerNaarSegment(doelIndex) {
		const rotor = getWheelRoot();
		const segmentAngle = getSegmentAngle();
		const targetNormalized = normaliseerRotatie(360 - ((doelIndex - 1) * segmentAngle));
		const huidigeRotatie = state.redesignRotation || 0;
		const currentNormalized = normaliseerRotatie(huidigeRotatie);
		const draaiRichting = Math.random() < 0.5 ? 1 : -1;
		const deltaClockwise = normaliseerRotatie(targetNormalized - currentNormalized);
		const deltaCounterClockwise = deltaClockwise === 0 ? 0 : deltaClockwise - 360;
		const deltaToTarget = draaiRichting === 1 ? deltaClockwise : deltaCounterClockwise;
		const extraRounds = 5 + Math.floor(Math.random() * 4);
		const motionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 4800;
		const totalSpin = (draaiRichting * extraRounds * 360) + deltaToTarget;
		const nieuweRotatie = huidigeRotatie + totalSpin;

		state.redesignRotation = nieuweRotatie;
		state.theWheel.rotationAngle = state.redesignRotation;
		if (state.redesignAnimation && typeof state.redesignAnimation.cancel === "function") {
			state.redesignAnimation.cancel();
		}

		rotor.style.transform = `rotate(${huidigeRotatie}deg)`;

		if (typeof rotor.animate === "function") {
			state.redesignAnimation = rotor.animate(
				[
					{ transform: `rotate(${huidigeRotatie}deg)` },
					{ transform: `rotate(${nieuweRotatie}deg)` }
				],
				{
					duration: motionDuration,
					easing: "cubic-bezier(0.12, 0.82, 0.16, 1)",
					fill: "forwards"
				}
			);
		}

		rotor.style.transform = `rotate(${nieuweRotatie}deg)`;

		window.setTimeout(function () {
			toonUitslag(state.alleSnacks[doelIndex - 1]);
		}, motionDuration + 24);
	}

	function resetAndStart() {
		if (state.wheelSpinning || !state.alleSnacks.length) {
			return;
		}

		state.spinned = true;
		state.wheelSpinning = true;
		stopDrag();
		ui.closeModal();
		animeerNaarSegment(Math.floor(Math.random() * state.alleSnacks.length) + 1);
	}

	function addSnackSegment() {
		createWheel();
	}

	app.wheel = {
		createWheel: createWheel,
		getSegmentIndexFromPointer: getSegmentIndexFromPointer,
		startDrag: startDrag,
		updateDrag: updateDrag,
		eindigDrag: eindigDrag,
		stopDrag: stopDrag,
		resetAndStart: resetAndStart,
		addSnackSegment: addSnackSegment
	};
}(window));
