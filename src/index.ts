/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { WebUntis } from 'webuntis';
import ical from 'ical-generator';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const untis = new WebUntis(env.SCHOOL_NAME, env.USERNAME, env.PASSWORD, env.SCHOOL_URL);

		await untis.login();
		const timetable = await untis.getOwnTimetableForWeek(new Date());

		const calendar = ical({name: "Untis"});

		timetable.forEach(t => {
			if (!t.studentGroup) return;

			const date = parseDate(t.date.toString());

			const start = parseTime(date, t.startTime.toString());
			const end = parseTime(date, t.endTime.toString());

			calendar.createEvent({
				summary: t.studentGroup,
				start,
				end
			})
		});

		const headers = new Headers();
		headers.append("Content-Type", "text/calendar")

		return new Response(calendar.toString(), {
			headers
		});
	},
} satisfies ExportedHandler<Env>;

function parseDate(dateString: string): Date {
	const year = parseInt(dateString.substring(0, 4), 10);
	const month = parseInt(dateString.substring(4, 6), 10) - 1; // Months are 0-based in JavaScript
	const day = parseInt(dateString.substring(6, 8), 10);

	// Create a new Date object
	return new Date(year, month, day);
}

function parseTime(date: Date, timeString: string): Date {
	if (timeString.length == 3) {
		timeString = `0${timeString}`
	}
	// Extract hours and minutes from the time string
	const hours = parseInt(timeString.substring(0, 2), 10);
	const minutes = parseInt(timeString.substring(2, 4), 10);

	// Create a new Date object based on the input date
	const newDate = new Date(date);

	// Set the hours and minutes
	newDate.setHours(hours);
	newDate.setMinutes(minutes);
	newDate.setSeconds(0);
	newDate.setMilliseconds(0);

	return newDate;
}
