import assert from "node:assert/strict";
import test from "node:test";

import {
	isRoadmapVisibleMilestone,
	normalizeMilestone,
	selectRoadmapItems,
	sortMilestones
} from "../scripts/generate-roadmap.mjs";

function createMilestone({
	number,
	title,
	dueOn,
	state = "open",
	openIssues = 1,
	closedIssues = 0,
	closedAt = null,
	updatedAt = null
}) {
	return {
		number,
		title,
		due_on: dueOn,
		state,
		open_issues: openIssues,
		closed_issues: closedIssues,
		closed_at: closedAt,
		updated_at: updatedAt,
		description: ""
	};
}

test("completed milestones stay roadmap-visible when they have a due date", () => {
	assert.equal(isRoadmapVisibleMilestone(createMilestone({
		number: 1,
		title: "Live release",
		dueOn: "2026-01-15T00:00:00.000Z",
		state: "closed",
		openIssues: 0,
		closedIssues: 4,
		closedAt: "2026-01-20T00:00:00.000Z"
	})), true);
});

test("selectRoadmapItems keeps all completed milestones outside the 9 open-work cap", () => {
	const incompleteMilestones = Array.from({ length: 11 }, (_, index) =>
		normalizeMilestone(createMilestone({
			number: index + 1,
			title: `Open milestone ${index + 1}`,
			dueOn: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
			openIssues: 1,
			closedIssues: 0
		})));
	const completedMilestones = Array.from({ length: 4 }, (_, index) =>
		normalizeMilestone(createMilestone({
			number: 100 + index,
			title: `Completed milestone ${index + 1}`,
			dueOn: `2026-07-${String(20 - index).padStart(2, "0")}T00:00:00.000Z`,
			state: "closed",
			openIssues: 0,
			closedIssues: 3,
			closedAt: `2026-07-${String(21 - index).padStart(2, "0")}T00:00:00.000Z`
		})));

	const selected = selectRoadmapItems(sortMilestones([...incompleteMilestones, ...completedMilestones]));

	assert.equal(selected.filter((item) => !item.isCompleted).length, 9);
	assert.equal(selected.filter((item) => item.isCompleted).length, 4);
});

test("completed milestones are ordered by most recent due date within the completed history", () => {
	const selected = selectRoadmapItems(sortMilestones([
		normalizeMilestone(createMilestone({
			number: 201,
			title: "Completed oldest",
			dueOn: "2026-05-01T00:00:00.000Z",
			state: "closed",
			openIssues: 0,
			closedIssues: 2,
			closedAt: "2026-05-02T00:00:00.000Z"
		})),
		normalizeMilestone(createMilestone({
			number: 202,
			title: "Completed newest",
			dueOn: "2026-07-01T00:00:00.000Z",
			state: "closed",
			openIssues: 0,
			closedIssues: 2,
			closedAt: "2026-07-02T00:00:00.000Z"
		})),
		normalizeMilestone(createMilestone({
			number: 203,
			title: "Completed middle",
			dueOn: "2026-06-01T00:00:00.000Z",
			state: "closed",
			openIssues: 0,
			closedIssues: 2,
			closedAt: "2026-06-02T00:00:00.000Z"
		}))
	]));

	const completedTitles = selected.filter((item) => item.isCompleted).map((item) => item.title);

	assert.deepEqual(completedTitles, [
		"Completed newest",
		"Completed middle",
		"Completed oldest"
	]);
});
