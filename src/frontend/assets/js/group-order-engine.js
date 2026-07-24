export const GROUP_LIMITS = Object.freeze({
	minPeople: 1,
	maxPeople: 20,
	minSnacks: 1,
	maxSnacks: 20
});

function clampInteger(value, minimum, maximum) {
	const parsedValue = Number.parseInt(value, 10);
	const safeValue = Number.isFinite(parsedValue) ? parsedValue : minimum;
	return Math.min(maximum, Math.max(minimum, safeValue));
}

/**
 * Resizes the participant collection while preserving names, personal targets,
 * and assigned snacks for entries that remain in the group.
 *
 * @param {Array} currentPeople
 * @param {number} requestedCount
 * @param {number} defaultTarget
 * @returns {Array}
 */
export function resizePeople(currentPeople, requestedCount, defaultTarget) {
	const count = clampInteger(requestedCount, GROUP_LIMITS.minPeople, GROUP_LIMITS.maxPeople);
	const targetCount = clampInteger(defaultTarget, GROUP_LIMITS.minSnacks, GROUP_LIMITS.maxSnacks);

	return Array.from({ length: count }, (_unused, index) => {
		const currentPerson = currentPeople[index];
		if (currentPerson) {
			return currentPerson;
		}

		return {
			id: `person-${index + 1}`,
			name: "",
			targetCount: targetCount,
			hasCustomTarget: false,
			snacks: []
		};
	});
}

/**
 * Applies a new group default only to participants that have not explicitly
 * overridden their own snack count.
 *
 * @param {Array} people
 * @param {number} requestedTarget
 * @returns {Array}
 */
export function applyDefaultTarget(people, requestedTarget) {
	const targetCount = clampInteger(requestedTarget, GROUP_LIMITS.minSnacks, GROUP_LIMITS.maxSnacks);
	return people.map((person) => person.hasCustomTarget
		? person
		: { ...person, targetCount: targetCount });
}

/**
 * Returns only participants who may still receive a snack. This is the central
 * fairness invariant used before every automatic wheel spin.
 *
 * @param {Array} people
 * @returns {Array}
 */
export function getEligiblePeople(people) {
	return people.filter((person) => person.snacks.length < person.targetCount);
}

/**
 * Chooses one eligible participant per round. Injecting the random source keeps
 * this business rule deterministic in tests.
 *
 * @param {Array} people
 * @param {Function} random
 * @returns {object|null}
 */
export function pickRandomEligiblePerson(people, random = Math.random) {
	const eligiblePeople = getEligiblePeople(people);
	if (eligiblePeople.length === 0) {
		return null;
	}

	const randomIndex = Math.min(
		eligiblePeople.length - 1,
		Math.floor(random() * eligiblePeople.length)
	);
	return eligiblePeople[randomIndex];
}

/**
 * Records one snack without mutating the participant array used by renderers.
 *
 * @param {Array} people
 * @param {string} personId
 * @param {{name: string}} snack
 * @returns {Array}
 */
export function assignSnackToPerson(people, personId, snack) {
	return people.map((person) => {
		if (person.id !== personId || person.snacks.length >= person.targetCount) {
			return person;
		}

		return { ...person, snacks: [...person.snacks, { name: snack.name }] };
	});
}

/**
 * Counts the requested and assigned snacks for progress and completion checks.
 *
 * @param {Array} people
 * @returns {{requested: number, assigned: number}}
 */
export function getOrderProgress(people) {
	return people.reduce((progress, person) => ({
		requested: progress.requested + person.targetCount,
		assigned: progress.assigned + person.snacks.length
	}), { requested: 0, assigned: 0 });
}
