<script setup lang="ts">
// Visitor locations — world map with phosphor pings plus a ranked country
// ledger. The ledger always renders 6 rows (top 5 + Others); empty slots
// show as skeleton loaders. Amber marks the leading country.
interface LocationData {
  country: string;
  count: number;
  percentage: number;
}

interface LedgerRow {
  name: string;
  count: number;
  percentage: number;
}

const props = defineProps<{ locationStats: LocationData[] }>();

const totalVisitors = computed(() =>
  stats.value.reduce((sum, loc) => sum + loc.count, 0),
);

const stats = computed(() => props.locationStats);

// fixed-size ledger: 5 country slots (null = skeleton slot) + Others
const chartData = computed<(LedgerRow | null)[]>(() => {
  const topCountries = stats.value.slice(0, 5);
  const others = stats.value.slice(5);
  const othersCount = others.reduce((sum, loc) => sum + loc.count, 0);
  const othersPercentage = others.reduce((sum, loc) => sum + loc.percentage, 0);

  const rows: (LedgerRow | null)[] = [];
  for (let i = 0; i < 5; i++) {
    const loc = topCountries[i];
    rows.push(loc ? { name: loc.country, count: loc.count, percentage: loc.percentage } : null);
  }
  rows.push(
    othersCount > 0
      ? { name: "Others", count: othersCount, percentage: othersPercentage }
      : null,
  );
  return rows;
});

const maxCount = computed(() =>
  Math.max(0, ...chartData.value.flatMap((d) => (d ? [d.count] : []))),
);

const markers = computed(() =>
  stats.value
    .map((loc, index) => {
      const entry = Object.entries(COUNTRY_CODE_TO_NAME).find(([, name]) => name === loc.country);
      const coords = entry ? COUNTRY_CODE_TO_COORDS[entry[0]] : undefined;
      if (!coords) return null;

      return {
        key: loc.country,
        x: coords.x,
        y: coords.y,
        dot: Math.min(4 + Math.log2(loc.count) * 0.9, 8),
        lead: index === 0,
      };
    })
    .filter((m) => m !== null),
);

const COUNTRY_CODE_TO_COORDS: Record<string, { x: number; y: number }> = {
  "US": { x: 205.9, y: 347.2 },
  "GB": { x: 468.7, y: 280.3 },
  "IN": { x: 707.1, y: 398.6 },
  "CA": { x: 198.9, y: 250.8 },
  "AU": { x: 849.3, y: 537.4 },
  "DE": { x: 504.2, y: 295.7 },
  "FR": { x: 479.6, y: 314.3 },
  "BR": { x: 322.2, y: 505.6 },
  "JP": { x: 857.8, y: 349.5 },
  "KR": { x: 833.8, y: 353.4 },
  "CN": { x: 767.3, y: 345.2 },
  "RU": { x: 780.3, y: 220.9 },
  "MX": { x: 188.8, y: 394.1 },
  "ZA": { x: 544.1, y: 546.4 },
  "NL": { x: 489.8, y: 291.8 },
  "IT": { x: 510.1, y: 331 },
  "ES": { x: 466.6, y: 340.9 },
  "PL": { x: 528.5, y: 292.2 },
  "SE": { x: 524.4, y: 234.6 },
  "NO": { x: 525.2, y: 219.3 },
  "FI": { x: 548.1, y: 218.7 },
  "CH": { x: 497.9, y: 314.7 },
  "AT": { x: 512.3, y: 310.9 },
  "BE": { x: 487.4, y: 299 },
  "DK": { x: 501.6, y: 271.8 },
  "IE": { x: 451.9, y: 285.6 },
  "PT": { x: 452.9, y: 342.3 },
  "GR": { x: 540.3, y: 344 },
  "TR": { x: 574.4, y: 344.5 },
  "EG": { x: 561.3, y: 384.9 },
  "NG": { x: 499.2, y: 437.4 },
  "KE": { x: 581.2, y: 461.8 },
  "AR": { x: 296.3, y: 580.2 },
  "CL": { x: 274.6, y: 577.4 },
  "CO": { x: 270.2, y: 451.4 },
  "PE": { x: 264.4, y: 489 },
  "VE": { x: 288, y: 444.9 },
  "EC": { x: 255.7, y: 467.9 },
  "BO": { x: 296.5, y: 509.3 },
  "PY": { x: 310.9, y: 530.3 },
  "UY": { x: 318.3, y: 559 },
  "CR": { x: 238.5, y: 435.9 },
  "PA": { x: 250.1, y: 439.4 },
  "PR": { x: 288.4, y: 411.2 },
  "CU": { x: 251.7, y: 401.4 },
  "JM": { x: 258, y: 411.5 },
  "HT": { x: 269.8, y: 409 },
  "DO": { x: 278, y: 409.6 },
  "GT": { x: 221.7, y: 418.3 },
  "HN": { x: 232.8, y: 422 },
  "SV": { x: 225.4, y: 424.1 },
  "NI": { x: 235.2, y: 426.7 },
  "NZ": { x: 953.2, y: 598.6 },
  "SG": { x: 766.3, y: 459.1 },
  "MY": { x: 796, y: 452 },
  "ID": { x: 757.3, y: 463.3 },
  "TH": { x: 759.8, y: 425.9 },
  "VN": { x: 771.8, y: 417.4 },
  "PH": { x: 817.2, y: 418.8 },
  "PK": { x: 669.4, y: 373.1 },
  "BD": { x: 728.4, y: 394.8 },
  "LK": { x: 701.6, y: 440.9 },
  "NP": { x: 710.9, y: 380.3 },
  "MM": { x: 746.2, y: 407.3 },
  "KH": { x: 769.5, y: 427.6 },
  "LA": { x: 766.4, y: 411.1 },
  "UA": { x: 562.3, y: 307.5 },
  "RO": { x: 545, y: 317.9 },
  "BG": { x: 546.4, y: 330.7 },
  "HU": { x: 529.6, y: 313.2 },
  "CZ": { x: 518.3, y: 302 },
  "SK": { x: 530.2, y: 306.9 },
  "HR": { x: 521.1, y: 322.9 },
  "RS": { x: 533.6, y: 325 },
  "BA": { x: 524.5, y: 326.1 },
  "AL": { x: 531.5, y: 336.6 },
  "MK": { x: 535.9, y: 335 },
  "ME": { x: 529.3, y: 330.8 },
  "SI": { x: 516.8, y: 317.4 },
  "LT": { x: 542, y: 277.4 },
  "LV": { x: 544, y: 268.8 },
  "EE": { x: 547.3, y: 259.8 },
  "BY": { x: 553.3, y: 284.1 },
  "MD": { x: 554.5, y: 314 },
  "GE": { x: 596.5, y: 332.3 },
  "AM": { x: 601.2, y: 340.6 },
  "AZ": { x: 608.7, y: 340.3 },
  "KZ": { x: 662.8, y: 307.5 },
  "UZ": { x: 656.1, y: 335.4 },
  "TM": { x: 642.1, y: 344.3 },
  "TJ": { x: 674.8, y: 344.9 },
  "KG": { x: 684.6, y: 336.3 },
  "AF": { x: 664.9, y: 361.8 },
  "IR": { x: 625.5, y: 366.2 },
  "IQ": { x: 597.4, y: 364.2 },
  "SY": { x: 584.5, y: 359.1 },
  "JO": { x: 579.1, y: 370.9 },
  "LB": { x: 575.5, y: 362.4 },
  "IL": { x: 573.3, y: 370.3 },
  "SA": { x: 601.5, y: 392.4 },
  "YE": { x: 609.2, y: 418.2 },
  "OM": { x: 631.8, y: 403.4 },
  "AE": { x: 626.4, y: 392.9 },
  "QA": { x: 618.5, y: 389.8 },
  "KW": { x: 608.2, y: 377.3 },
  "BH": { x: 616.7, y: 387.7 },
  "MA": { x: 454.9, y: 369 },
  "DZ": { x: 479.5, y: 380.2 },
  "TN": { x: 501.6, y: 362.4 },
  "LY": { x: 523.3, y: 386.1 },
  "SD": { x: 559.7, y: 419 },
  "ET": { x: 588.5, y: 437.2 },
  "TZ": { x: 572.8, y: 480.8 },
  "UG": { x: 565.5, y: 459.1 },
  "RW": { x: 558.7, y: 468.3 },
  "BI": { x: 558.8, y: 472.4 },
  "CD": { x: 535.9, y: 474.4 },
  "GH": { x: 472, y: 440.6 },
  "CI": { x: 459.3, y: 441.8 },
  "SN": { x: 434.3, y: 422 },
  "ML": { x: 463.6, y: 412.7 },
  "BF": { x: 470.5, y: 428.5 },
  "NE": { x: 497.5, y: 412.7 },
  "TD": { x: 527.4, y: 418.8 },
  "CM": { x: 509.6, y: 442.2 },
  "SO": { x: 604.5, y: 448.5 },
  "ZW": { x: 556.6, y: 517.1 },
  "ZM": { x: 553, y: 500 },
  "MW": { x: 571.1, y: 500.3 },
  "MZ": { x: 574.6, y: 516.5 },
  "BW": { x: 544.1, y: 527 },
  "NA": { x: 526.8, y: 529.1 },
  "AO": { x: 525.1, y: 496.6 },
  "MG": { x: 606.4, y: 516.8 },
  "MN": { x: 766.3, y: 313.4 },
  "KP": { x: 832.8, y: 339.4 },
  "TW": { x: 814.5, y: 395.1 },
  "HK": { x: 795.2, y: 398.7 },
  "MO": { x: 793.5, y: 399.3 },
  "BN": { x: 796.4, y: 450.3 },
  "TL": { x: 828.8, y: 487.9 },
  "FJ": { x: 974.3, y: 513.3 },
  "PG": { x: 884.2, y: 481.5 },
  "AD": { x: 479.3, y: 331.5 },
  "AG": { x: 301.5, y: 414.6 },
  "AI": { x: 297.9, y: 411.2 },
  "AS": { x: 1006.2, y: 503.2 },
  "AW": { x: 278.5, y: 427.7 },
  "AX": { x: 530.9, y: 250.7 },
  "BB": { x: 307.8, y: 425.8 },
  "BJ": { x: 481.3, y: 436.8 },
  "BL": { x: 298.5, y: 412.2 },
  "BM": { x: 293.1, y: 367.5 },
  "BQ": { x: 283.2, y: 428.7 },
  "BS": { x: 257.4, y: 386.5 },
  "BT": { x: 728.6, y: 383.1 },
  "BV": { x: 484.5, y: 644.8 },
  "BZ": { x: 226.1, y: 414.3 },
  "CC": { x: 746.7, y: 497.1 },
  "CF": { x: 533.6, y: 444.3 },
  "CG": { x: 516.6, y: 464.8 },
  "CK": { x: 26.4, y: 523.5 },
  "CV": { x: 408.6, y: 420.3 },
  "CW": { x: 281.4, y: 428.6 },
  "CX": { x: 771.4, y: 492.4 },
  "CY": { x: 568.7, y: 358.2 },
  "DJ": { x: 594.4, y: 429.7 },
  "DM": { x: 302.7, y: 419.4 },
  "EH": { x: 438.7, y: 393.1 },
  "ER": { x: 586.5, y: 420 },
  "FK": { x: 310.1, y: 632.6 },
  "FM": { x: 919, y: 443.7 },
  "FO": { x: 455.5, y: 239.7 },
  "GA": { x: 507.4, y: 465.2 },
  "GD": { x: 301.8, y: 428.9 },
  "GF": { x: 325.8, y: 451.9 },
  "GG": { x: 467.7, y: 303.5 },
  "GI": { x: 459.9, y: 354.7 },
  "GL": { x: 356.7, y: 126.7 },
  "GM": { x: 431.9, y: 425.1 },
  "GN": { x: 443, y: 435 },
  "GO": { x: 607.6, y: 495.4 },
  "GP": { x: 302.7, y: 416.7 },
  "GQ": { x: 504, y: 458.4 },
  "GS": { x: 371.3, y: 644.9 },
  "GU": { x: 881.3, y: 425.1 },
  "GW": { x: 432.3, y: 429.8 },
  "GY": { x: 309.5, y: 449.3 },
  "HM": { x: 681.3, y: 638.5 },
  "IM": { x: 462.1, y: 281.9 },
  "IO": { x: 678.2, y: 483.4 },
  "IS": { x: 421.5, y: 221.6 },
  "JE": { x: 468.9, y: 304.6 },
  "JU": { x: 594.9, y: 511.2 },
  "KI": { x: 33.2, y: 457.7 },
  "KM": { x: 596.6, y: 495.6 },
  "KN": { x: 298.8, y: 413.9 },
  "XK": { x: 533.5, y: 331.4 },
  "KY": { x: 246.8, y: 408 },
  "LC": { x: 303.8, y: 423.8 },
  "LI": { x: 501.7, y: 313.2 },
  "LR": { x: 448.4, y: 444.9 },
  "LS": { x: 554.1, y: 549.5 },
  "LU": { x: 492, y: 302.1 },
  "MC": { x: 495.7, y: 326.8 },
  "MF": { x: 297.9, y: 411.6 },
  "MH": { x: 955.4, y: 443 },
  "MP": { x: 883.9, y: 420.1 },
  "MQ": { x: 303.6, y: 421.6 },
  "MR": { x: 444.2, y: 402.6 },
  "MS": { x: 300.4, y: 415.6 },
  "MT": { x: 515.5, y: 355.5 },
  "MU": { x: 636.4, y: 520.6 },
  "MV": { x: 681.2, y: 451.2 },
  "NC": { x: 939.4, y: 523.6 },
  "NF": { x: 946.2, y: 547.7 },
  "NR": { x: 943.4, y: 464.4 },
  "NU": { x: 1008.5, y: 517.1 },
  "PF": { x: 55.6, y: 513 },
  "PM": { x: 316.8, y: 314.1 },
  "PN": { x: 114.8, y: 533 },
  "PS": { x: 573.7, y: 368.8 },
  "PW": { x: 852.6, y: 441.9 },
  "RE": { x: 630.8, y: 523.2 },
  "SB": { x: 921.6, y: 485.4 },
  "SC": { x: 630.6, y: 476 },
  "SH": { x: 458.8, y: 508 },
  "SJ": { x: 519.9, y: 95.6 },
  "SL": { x: 441.8, y: 439.3 },
  "SM": { x: 509.9, y: 326.1 },
  "SR": { x: 317.7, y: 452 },
  "SS": { x: 558.3, y: 440.9 },
  "ST": { x: 493.4, y: 462.3 },
  "SX": { x: 297.9, y: 411.8 },
  "SZ": { x: 563.2, y: 539.7 },
  "TC": { x: 273.6, y: 400.6 },
  "TF": { x: 670.4, y: 621.1 },
  "TG": { x: 477.3, y: 438.8 },
  "TK": { x: 1001.1, y: 486.9 },
  "TO": { x: 993.5, y: 523.3 },
  "TT": { x: 302.5, y: 433.6 },
  "TV": { x: 977.9, y: 486.7 },
  "VA": { x: 509.8, y: 333.9 },
  "VC": { x: 303.1, y: 425.6 },
  "VG": { x: 294.2, y: 410.5 },
  "VI": { x: 293.2, y: 412.6 },
  "VU": { x: 943.2, y: 505.6 },
  "WF": { x: 985.3, y: 503.1 },
  "WS": { x: 1001.2, y: 501.3 },
  "YT": { x: 601.6, y: 499 },
};

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  "US": "United States",
  "GB": "United Kingdom",
  "IN": "India",
  "CA": "Canada",
  "AU": "Australia",
  "DE": "Germany",
  "FR": "France",
  "BR": "Brazil",
  "JP": "Japan",
  "KR": "South Korea",
  "CN": "China",
  "RU": "Russia",
  "MX": "Mexico",
  "ZA": "South Africa",
  "NL": "Netherlands",
  "IT": "Italy",
  "ES": "Spain",
  "PL": "Poland",
  "SE": "Sweden",
  "NO": "Norway",
  "FI": "Finland",
  "CH": "Switzerland",
  "AT": "Austria",
  "BE": "Belgium",
  "DK": "Denmark",
  "IE": "Ireland",
  "PT": "Portugal",
  "GR": "Greece",
  "TR": "Turkey",
  "EG": "Egypt",
  "NG": "Nigeria",
  "KE": "Kenya",
  "AR": "Argentina",
  "CL": "Chile",
  "CO": "Colombia",
  "PE": "Peru",
  "VE": "Venezuela",
  "EC": "Ecuador",
  "BO": "Bolivia",
  "PY": "Paraguay",
  "UY": "Uruguay",
  "CR": "Costa Rica",
  "PA": "Panama",
  "PR": "Puerto Rico",
  "CU": "Cuba",
  "JM": "Jamaica",
  "HT": "Haiti",
  "DO": "Dominican Republic",
  "GT": "Guatemala",
  "HN": "Honduras",
  "SV": "El Salvador",
  "NI": "Nicaragua",
  "NZ": "New Zealand",
  "SG": "Singapore",
  "MY": "Malaysia",
  "ID": "Indonesia",
  "TH": "Thailand",
  "VN": "Vietnam",
  "PH": "Philippines",
  "PK": "Pakistan",
  "BD": "Bangladesh",
  "LK": "Sri Lanka",
  "NP": "Nepal",
  "MM": "Myanmar",
  "KH": "Cambodia",
  "LA": "Laos",
  "UA": "Ukraine",
  "RO": "Romania",
  "BG": "Bulgaria",
  "HU": "Hungary",
  "CZ": "Czech Republic",
  "SK": "Slovakia",
  "HR": "Croatia",
  "RS": "Serbia",
  "BA": "Bosnia and Herzegovina",
  "AL": "Albania",
  "MK": "North Macedonia",
  "ME": "Montenegro",
  "SI": "Slovenia",
  "LT": "Lithuania",
  "LV": "Latvia",
  "EE": "Estonia",
  "BY": "Belarus",
  "MD": "Moldova",
  "GE": "Georgia",
  "AM": "Armenia",
  "AZ": "Azerbaijan",
  "KZ": "Kazakhstan",
  "UZ": "Uzbekistan",
  "TM": "Turkmenistan",
  "TJ": "Tajikistan",
  "KG": "Kyrgyzstan",
  "AF": "Afghanistan",
  "IR": "Iran",
  "IQ": "Iraq",
  "SY": "Syria",
  "JO": "Jordan",
  "LB": "Lebanon",
  "IL": "Israel",
  "SA": "Saudi Arabia",
  "YE": "Yemen",
  "OM": "Oman",
  "AE": "United Arab Emirates",
  "QA": "Qatar",
  "KW": "Kuwait",
  "BH": "Bahrain",
  "MA": "Morocco",
  "DZ": "Algeria",
  "TN": "Tunisia",
  "LY": "Libya",
  "SD": "Sudan",
  "ET": "Ethiopia",
  "TZ": "Tanzania",
  "UG": "Uganda",
  "RW": "Rwanda",
  "BI": "Burundi",
  "CD": "Democratic Republic of the Congo",
  "GH": "Ghana",
  "CI": "Ivory Coast",
  "SN": "Senegal",
  "ML": "Mali",
  "BF": "Burkina Faso",
  "NE": "Niger",
  "TD": "Chad",
  "CM": "Cameroon",
  "SO": "Somalia",
  "ZW": "Zimbabwe",
  "ZM": "Zambia",
  "MW": "Malawi",
  "MZ": "Mozambique",
  "BW": "Botswana",
  "NA": "Namibia",
  "AO": "Angola",
  "MG": "Madagascar",
  "MN": "Mongolia",
  "KP": "North Korea",
  "TW": "Taiwan",
  "HK": "Hong Kong",
  "MO": "Macau",
  "BN": "Brunei",
  "TL": "Timor-Leste",
  "FJ": "Fiji",
  "PG": "Papua New Guinea",
};
</script>

<template>
  <UiCard class="px-6 py-5">
    <div class="mb-4 flex items-center justify-between gap-4">
      <h3 class="flex items-center gap-3 font-mono text-sm uppercase tracking-wider text-bright">
        <span class="h-4 w-1 bg-amber shadow-[0_0_10px_rgba(255,180,84,0.5)]" />
        visitor locations
      </h3>
      <div class="flex items-center gap-3">
        <p class="font-mono text-[10px] uppercase tracking-wider text-dim">
          {{ totalVisitors }} visitors · {{ stats.length }} regions
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 items-center gap-6 md:grid-cols-5">
      <!-- world map — landmasses tinted phosphor through a CSS mask -->
      <div class="world-grid relative mx-auto w-full max-w-[424px] overflow-hidden md:col-span-2">
        <div class="world-fill aspect-[1009.6727/665.96301] w-full" />
        <span
          v-for="marker in markers"
          :key="marker.key"
          class="absolute"
          :style="{ left: `${(marker.x / 1009.6727) * 100}%`, top: `${(marker.y / 665.96301) * 100}%` }"
        >
          <span
            v-if="marker.lead"
            class="absolute animate-ping rounded-full bg-amber/25"
            :style="{ width: `${marker.dot * 2}px`, height: `${marker.dot * 2}px`, margin: `-${marker.dot}px 0 0 -${marker.dot}px` }"
          />
          <span
            class="absolute rounded-full opacity-80"
            :class="marker.lead
              ? 'bg-amber/90 shadow-[0_0_5px_rgba(255,180,84,0.4)]'
              : 'bg-phosphor/70 shadow-[0_0_4px_rgba(74,222,128,0.3)]'"
            :style="{ width: `${marker.dot}px`, height: `${marker.dot}px`, margin: `-${marker.dot / 2}px 0 0 -${marker.dot / 2}px` }"
          />
        </span>
      </div>

      <!-- ranked country ledger — 6 fixed rows, skeleton when a slot is empty -->
      <div class="divide-y divide-line border border-line bg-abyss/40 md:col-span-3">
        <div
          v-for="(item, i) in chartData"
          :key="item ? item.name : `slot-${i}`"
          class="group px-3 py-2 transition-colors hover:bg-panel/70"
        >
          <template v-if="item">
            <div class="flex items-baseline justify-between gap-3 font-mono text-xs">
              <span class="flex min-w-0 items-baseline gap-2">
                <span
                  class="shrink-0 text-[10px]"
                  :class="i === 0 ? 'text-amber' : 'text-dim'"
                >{{ String(i + 1).padStart(2, "0") }}</span>
                <span class="truncate text-secondary transition-colors group-hover:text-bright">
                  {{ item.name }}
                </span>
              </span>
              <span class="shrink-0 tabular-nums text-dim">
                {{ item.count }}
                <span class="ml-1 text-[10px]" :class="i === 0 ? 'text-amber/80' : 'text-phosphor/70'">
                  {{ item.percentage }}%
                </span>
              </span>
            </div>
            <div class="mt-1.5 h-[3px] bg-line/70">
              <div
                class="h-full"
                :class="i === 0 ? 'bg-amber' : 'bg-phosphor/70'"
                :style="{ width: `${maxCount ? (item.count / maxCount) * 100 : 0}%` }"
              />
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-3 font-mono text-xs">
              <span class="flex items-center gap-2">
                <span class="text-[10px] text-dim/40">{{ String(i + 1).padStart(2, "0") }}</span>
                <span class="italic text-dim/50">// no data</span>
              </span>
              <span class="text-[10px] text-dim/40">—</span>
            </div>
            <div class="mt-1.5 h-[3px] bg-line/70" />
          </template>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
/* landmasses tinted phosphor — world.svg has no viewBox, its intrinsic
   1009.6727×665.96301 box matches the frame's aspect exactly */
.world-fill {
  background: linear-gradient(180deg, rgba(74, 222, 128, 0.22), rgba(74, 222, 128, 0.05));
  -webkit-mask: url("/world.svg") center / contain no-repeat;
  mask: url("/world.svg") center / contain no-repeat;
}

.world-grid {
  background-image:
    linear-gradient(rgba(74, 222, 128, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 222, 128, 0.035) 1px, transparent 1px);
  background-size: 44px 44px;
}
</style>
