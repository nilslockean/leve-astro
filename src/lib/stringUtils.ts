import { SiteLanguage } from "@config/site";
import { formatDate, joinDates, type PickupDateEntry } from "./dateUtils";

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toLocaleDateString(date: Date, locale = SiteLanguage.SV) {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Tallinn",
  });
}

export function toLocaleTimeString(date: Date, locale = SiteLanguage.SV) {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Tallinn",
  });
}

export function prettyCourseDates(
  start: Date,
  end?: Date,
  locale = SiteLanguage.SV,
) {
  const startDateString = toLocaleDateString(start, locale);
  const endDateString = toLocaleDateString(end ?? start, locale);
  const yearString = start.getFullYear().toString();

  if (startDateString === endDateString || end === undefined) {
    const endTimeString = end && toLocaleTimeString(end, locale);

    return capitalize(
      `${startDateString} ${yearString} kl. ${toLocaleTimeString(start, locale)}${
        endTimeString && start !== end && endTimeString !== "23:59"
          ? ` - ${endTimeString}`
          : ""
      }`,
    );
  }

  return capitalize(`${startDateString} - ${endDateString} ${yearString}`);
}

const currenyFormatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(prices: number[]) {
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // The currency formatter likes the &nbsp; character. I don't.
  const formattedPrice = currenyFormatter
    .format(minPrice)
    .replace(/\u00A0/g, " ");

  if (minPrice === maxPrice) {
    return formattedPrice;
  }

  return "Från " + formattedPrice;
}

export function getPickupDateDescription(
  entry: PickupDateEntry,
  availablePickupDates: string[],
  minOffset: number,
  maxOffset: number,
) {
  const { pickupDateRangeEnd, pickupDates, pickupDateRangeStart } = entry;
  const hasSpecificPickupDates = pickupDates && pickupDates.length > 0;
  const rangeIsSingleDate =
    pickupDateRangeStart !== null &&
    pickupDateRangeEnd === pickupDateRangeStart;

  if (hasSpecificPickupDates || rangeIsSingleDate) {
    return availablePickupDates.length > 0
      ? `Går att hämta ${joinDates(availablePickupDates)}.`
      : "Inga upphämtningsdatum är tillgängliga just nu.";
  }

  if (pickupDateRangeStart && pickupDateRangeEnd) {
    return `Går att hämta mellan ${formatDate(pickupDateRangeStart)} och ${formatDate(pickupDateRangeEnd)}.`;
  }

  if (pickupDateRangeStart) {
    return `Går att hämta tidigast ${formatDate(pickupDateRangeStart)}.`;
  }

  if (pickupDateRangeEnd) {
    return `Sista upphämtningsdatum: ${formatDate(pickupDateRangeEnd)}.`;
  }

  return `Går att hämta under våra öppettider med minst ${minOffset} dagars framförhållning, och max ${maxOffset} dagar in i framtiden.`;
}
