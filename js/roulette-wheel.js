(function (window) {
	const app = window.SnackRad;
	const state = app.state;
	const core = app.core;
	const ui = app.ui;
	const config = app.config;

	function isVerwijderbareSnack(snack) {
		return Boolean(snack);
	}

	function createWheel() {
		state.theWheel = new Winwheel({
			canvasId: "canvas",
			numSegments: state.alleSnacks.length,
			outerRadius: 304,
			innerRadius: 110,
			textFontFamily: "Space Grotesk",
			textFontSize: 22,
			textFontWeight: "600",
			textFillStyle: "#271900",
			textAlignment: "outer",
			textMargin: 28,
			lineWidth: 4,
			strokeStyle: "#7c5800",
			segments: state.alleSnacks.map(function (snack, index) {
				return {
					fillStyle: config.kleuren[index % config.kleuren.length],
					strokeStyle: config.randKleuren[index % config.randKleuren.length],
					text: snack.name,
					snack: snack
				};
			}),
			animation: {
				type: "spinToStop",
				duration: 5,
				spins: 8,
				callbackFinished: afterSpin
			}
		});
	}

	function getCanvasInfo() {
		const canvas = document.getElementById("canvas");
		const rect = canvas.getBoundingClientRect();
		return {
			canvas: canvas,
			rect: rect,
			schaalX: rect.width / canvas.width,
			schaalY: rect.height / canvas.height
		};
	}

	function getPointerCanvasLocatie(clientX, clientY) {
		const info = getCanvasInfo();
		return {
			x: (clientX - info.rect.left) / info.schaalX,
			y: (clientY - info.rect.top) / info.schaalY
		};
	}

	function getSegmentIndexFromPointer(clientX, clientY) {
		const locatie = getPointerCanvasLocatie(clientX, clientY);
		const deltaX = locatie.x - state.theWheel.centerX;
		const deltaY = locatie.y - state.theWheel.centerY;
		const afstand = Math.hypot(deltaX, deltaY);

		if (afstand < state.theWheel.innerRadius || afstand > state.theWheel.outerRadius) {
			return null;
		}

		const pointerHoek = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90 + 360) % 360;
		const rotatie = ((state.theWheel.rotationAngle % 360) + 360) % 360;
		const segmentHoek = (pointerHoek - rotatie + 360) % 360;

		for (let index = 1; index <= state.theWheel.numSegments; index += 1) {
			const segment = state.theWheel.segments[index];
			if (segment && segmentHoek >= segment.startAngle && segmentHoek < segment.endAngle) {
				return index;
			}
		}

		if (state.theWheel.numSegments > 0 && segmentHoek === 360) {
			return state.theWheel.numSegments;
		}

		return null;
	}

	function verbergDragCanvas() {
		document.getElementById("snack-drag-canvas").style.display = "none";
	}

	function getAfstandTotWielMidden(clientX, clientY) {
		const info = getCanvasInfo();
		const centerX = info.rect.left + (state.theWheel.centerX * info.schaalX);
		const centerY = info.rect.top + (state.theWheel.centerY * info.schaalY);
		return Math.hypot(clientX - centerX, clientY - centerY);
	}

	function isBuitenHetWiel(clientX, clientY) {
		const info = getCanvasInfo();
		const outerRadius = state.theWheel.outerRadius * ((info.schaalX + info.schaalY) / 2);
		return getAfstandTotWielMidden(clientX, clientY) > outerRadius;
	}

	function tekenSegmentPad(context, segment) {
		context.beginPath();
		context.arc(state.theWheel.centerX, state.theWheel.centerY, state.theWheel.outerRadius, state.theWheel.degToRad(segment.startAngle + state.theWheel.rotationAngle - 90), state.theWheel.degToRad(segment.endAngle + state.theWheel.rotationAngle - 90), false);
		context.arc(state.theWheel.centerX, state.theWheel.centerY, state.theWheel.innerRadius, state.theWheel.degToRad(segment.endAngle + state.theWheel.rotationAngle - 90), state.theWheel.degToRad(segment.startAngle + state.theWheel.rotationAngle - 90), true);
		context.closePath();
	}

	function renderDragCanvas(segmentIndex) {
		const info = getCanvasInfo();
		const segment = state.theWheel.segments[segmentIndex];
		const dragCanvas = document.getElementById("snack-drag-canvas");
		const dragContext = dragCanvas.getContext("2d");

		dragCanvas.width = info.canvas.width;
		dragCanvas.height = info.canvas.height;
		dragCanvas.style.width = `${info.rect.width}px`;
		dragCanvas.style.height = `${info.rect.height}px`;
		dragContext.clearRect(0, 0, dragCanvas.width, dragCanvas.height);
		tekenSegmentPad(dragContext, segment);
		dragContext.save();
		dragContext.clip();
		dragContext.drawImage(info.canvas, 0, 0);
		dragContext.restore();
	}

	function verbergSegmentInWiel(segmentIndex) {
		const segment = state.theWheel.segments[segmentIndex];
		state.actieveDrag.origineelSegment = {
			fillStyle: segment.fillStyle,
			strokeStyle: segment.strokeStyle,
			textFillStyle: segment.textFillStyle,
			textStrokeStyle: segment.textStrokeStyle
		};
		segment.fillStyle = "rgba(0,0,0,0)";
		segment.strokeStyle = "rgba(0,0,0,0)";
		segment.textFillStyle = "rgba(0,0,0,0)";
		segment.textStrokeStyle = "rgba(0,0,0,0)";
		state.theWheel.draw();
	}

	function herstelSegmentInWiel() {
		if (!state.actieveDrag || !state.actieveDrag.origineelSegment) {
			return;
		}

		const segment = state.theWheel.segments[state.actieveDrag.segmentIndex];
		if (!segment) {
			return;
		}

		segment.fillStyle = state.actieveDrag.origineelSegment.fillStyle;
		segment.strokeStyle = state.actieveDrag.origineelSegment.strokeStyle;
		segment.textFillStyle = state.actieveDrag.origineelSegment.textFillStyle;
		segment.textStrokeStyle = state.actieveDrag.origineelSegment.textStrokeStyle;
		state.theWheel.draw();
	}

	function positioneerDragCanvas(clientX, clientY) {
		if (!state.actieveDrag) {
			return;
		}

		const dragCanvas = document.getElementById("snack-drag-canvas");
		const offsetX = clientX - state.actieveDrag.startClientX;
		const offsetY = clientY - state.actieveDrag.startClientY;
		dragCanvas.style.left = `${state.actieveDrag.canvasLeft + offsetX}px`;
		dragCanvas.style.top = `${state.actieveDrag.canvasTop + offsetY}px`;
		dragCanvas.style.display = "block";
	}

	function stopDrag(herstelSegment) {
		const moetHerstellen = herstelSegment !== false;
		if (state.actieveDrag && moetHerstellen) {
			herstelSegmentInWiel();
		}
		document.body.classList.remove("is-dragging-custom-snack");
		state.actieveDrag = null;
		verbergDragCanvas();
	}

	function startDrag(segmentIndex, clientX, clientY) {
		const segment = state.theWheel.segments[segmentIndex];
		if (!segment || !isVerwijderbareSnack(segment.snack) || state.wheelSpinning) {
			return;
		}

		state.actieveDrag = {
			segmentIndex: segmentIndex,
			startClientX: clientX,
			startClientY: clientY,
			canvasLeft: getCanvasInfo().rect.left,
			canvasTop: getCanvasInfo().rect.top
		};
		document.body.classList.add("is-dragging-custom-snack");
		renderDragCanvas(segmentIndex);
		verbergSegmentInWiel(segmentIndex);
		positioneerDragCanvas(clientX, clientY);
	}

	function updateDrag(clientX, clientY) {
		if (!state.actieveDrag) {
			return;
		}

		positioneerDragCanvas(clientX, clientY);
		document.getElementById("snack-drag-canvas").style.opacity = isBuitenHetWiel(clientX, clientY) ? "0.82" : "1";
	}

	function verwijderSnack(segmentIndex) {
		const segment = state.theWheel.segments[segmentIndex];
		if (!segment || !isVerwijderbareSnack(segment.snack) || state.theWheel.numSegments <= 1) {
			return;
		}

		state.alleSnacks = state.alleSnacks.filter(function (snack) {
			return !(snack.name === segment.snack.name && (snack.image || "") === (segment.snack.image || "") && Boolean(snack.isCustom) === Boolean(segment.snack.isCustom));
		});
		core.persistSnacks();
		state.theWheel.deleteSegment(segmentIndex);
		state.theWheel.draw();
		verbergDragCanvas();
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

	function afterSpin(indicatedSegment) {
		state.wheelSpinning = false;
		if (state.easterEggsActief && Math.random() < (state.eggsKansPercentage / 100)) {
			ui.showEasterEggResult(config.easterEggBerichten[Math.floor(Math.random() * config.easterEggBerichten.length)]);
			return;
		}

		ui.showResult(indicatedSegment.snack || {
			name: indicatedSegment.text,
			image: `./images/${indicatedSegment.text.toLowerCase()}.jpg`
		});
	}

	function resetWheel() {
		state.theWheel.stopAnimation(false);
		state.theWheel.rotationAngle = 0;
		state.theWheel.draw();
		state.wheelSpinning = false;
	}

	function startSpin() {
		if (state.wheelSpinning) {
			return;
		}

		state.spinned = true;
		state.theWheel.animation.spins = 8;
		state.theWheel.startAnimation();
		stopDrag();
		ui.closeModal();
		state.wheelSpinning = true;
	}

	function resetAndStart() {
		if (state.spinned) {
			resetWheel();
		}
		startSpin();
	}

	function addSnackSegment(snack) {
		state.theWheel.addSegment({
			fillStyle: config.kleuren[(state.theWheel.numSegments - 1) % config.kleuren.length],
			strokeStyle: config.randKleuren[(state.theWheel.numSegments - 1) % config.randKleuren.length],
			text: snack.name,
			snack: snack
		});
		state.theWheel.draw();
		verbergDragCanvas();
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
})(window);
