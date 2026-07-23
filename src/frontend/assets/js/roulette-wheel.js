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
		const adjustedAngle = (pointerAngle - normaliseerRotatie(state.wheelRotation || 0) + halfAngle + 360) % 360;
		return Math.floor(adjustedAngle / segmentAngle) + 1;
	}

	function getDragSegmentMarkup(segmentIndex) {
		const segment = getSegmentElement(segmentIndex);
		if (!segment) {
			return "";
		}

		const clone = segment.cloneNode(true);
		const labelPath = clone.querySelector("defs path[id]");
		const labelReference = clone.querySelector("textPath[href]");
		clone.removeAttribute("data-segment-index");
		clone.removeAttribute("style");

		if (labelPath && labelReference) {
			const dragLabelPathId = `${labelPath.id}-drag`;
			labelPath.id = dragLabelPathId;
			labelReference.setAttribute("href", `#${dragLabelPathId}`);
		}

		const rotation = normaliseerRotatie(state.wheelRotation || 0);
		return [
			'<svg class="roulette-drag-segment" viewBox="0 0 640 640" aria-hidden="true">',
			`<g transform="rotate(${rotation} ${design.center} ${design.center})">`,
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
		const offsetX = clientX - state.actieveDrag.startClientX;
		const offsetY = clientY - state.actieveDrag.startClientY;
		ghost.style.left = `${state.actieveDrag.ghostLeft + offsetX}px`;
		ghost.style.top = `${state.actieveDrag.ghostTop + offsetY}px`;
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
			const animationDelay = -(bulbIndex * (1250 / design.bulbCount));
			group.append(
				getSvgNode("circle", {
					cx: point.x,
					cy: point.y,
					r: design.bulbRadius + 6,
					fill: "rgba(255, 201, 40, 0.15)",
					class: "roulette-wheel-bulb-glow",
					style: `animation-delay: ${animationDelay}ms`
				}),
				getSvgNode("circle", {
					cx: point.x,
					cy: point.y,
					r: design.bulbRadius,
					fill: "#FFFFFF",
					stroke: "#FFC928",
					"stroke-width": 6,
					class: "roulette-wheel-bulb",
					style: `animation-delay: ${animationDelay}ms`
				})
			);
		}
	}

	function renderCenter(group) {
		const clipPathId = "wheel-center-favicon-clip";
		const definitions = getSvgNode("defs");
		const clipPath = getSvgNode("clipPath", { id: clipPathId });
		clipPath.appendChild(getSvgNode("circle", {
			cx: design.center,
			cy: design.center,
			r: 80
		}));
		definitions.appendChild(clipPath);

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
			}),
			definitions,
			getSvgNode("image", {
				x: design.center - 80,
				y: design.center - 80,
				width: 160,
				height: 160,
				href: "./assets/images/brand/favicon.png",
				"clip-path": `url(#${clipPathId})`,
				preserveAspectRatio: "xMidYMid slice"
			})
		);
	}

	function renderSegment(group, snack, index) {
		const geometry = getSegmentGeometry(index);
		const color = config.kleuren[index % config.kleuren.length];
		const stroke = config.randKleuren[index % config.randKleuren.length];
		const segmentAngle = getSegmentAngle();
		const fontSize = clamp(22 - (Math.max(snack.name.length - 9, 0) * 0.55), 10.5, 17);
		const textRadius = clamp(design.outerRadius - 48, 188, 214);
		const textInset = clamp(segmentAngle * 0.14, 3, 8);
		const textArcAngle = Math.max(segmentAngle - (textInset * 2), segmentAngle * 0.5);
		const availableTextLength = Math.max(12, ((2 * Math.PI * textRadius) * (textArcAngle / 360)) - 12);
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
			textLength: availableTextLength,
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
		root.setAttribute("transform", `rotate(${state.wheelRotation || 0} ${design.center} ${design.center})`);

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

	function createWheel() {
		renderWheel();
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

		const info = getWheelInfo();
		state.actieveDrag = {
			segmentIndex: segmentIndex,
			startClientX: clientX,
			startClientY: clientY,
			ghostLeft: info.rect.left,
			ghostTop: info.rect.top,
			ghostSize: info.rect.width
		};
		document.body.classList.add("is-dragging-custom-snack");
		verbergSegmentInWiel(segmentIndex);

		const ghost = getGhost();
		ghost.innerHTML = getDragSegmentMarkup(segmentIndex);
		ghost.style.width = `${state.actieveDrag.ghostSize}px`;
		ghost.style.height = `${state.actieveDrag.ghostSize}px`;
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

		state.alleSnacks = state.alleSnacks.filter(function (_snack, index) {
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
		const huidigeRotatie = state.wheelRotation || 0;
		const currentNormalized = normaliseerRotatie(huidigeRotatie);
		const draaiRichting = Math.random() < 0.5 ? 1 : -1;
		const deltaClockwise = normaliseerRotatie(targetNormalized - currentNormalized);
		const deltaCounterClockwise = deltaClockwise === 0 ? 0 : deltaClockwise - 360;
		const deltaToTarget = draaiRichting === 1 ? deltaClockwise : deltaCounterClockwise;
		const extraRounds = 5 + Math.floor(Math.random() * 4);
		const motionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 4800;
		const totalSpin = (draaiRichting * extraRounds * 360) + deltaToTarget;
		const nieuweRotatie = huidigeRotatie + totalSpin;

		state.wheelRotation = nieuweRotatie;
		if (state.wheelAnimation && typeof state.wheelAnimation.cancel === "function") {
			state.wheelAnimation.cancel();
		}

		rotor.style.transform = `rotate(${huidigeRotatie}deg)`;

		if (typeof rotor.animate === "function") {
			state.wheelAnimation = rotor.animate(
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
