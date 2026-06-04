import translations from "./translations.ts";

type Locale = "en" | "zh-CN";

let currentLocale: Locale = "en";

function detectSystemLocale(): Locale {
	const lang = process.env.LANG ?? process.env.LC_ALL ?? process.env.LC_MESSAGES ?? process.env.LANGUAGE ?? "";
	const lower = lang.toLowerCase();
	if (lower.startsWith("zh") && (lower.includes("cn") || lower.includes("hans") || lower.includes("zh-cn"))) {
		return "zh-CN";
	}
	if (lower.startsWith("zh")) {
		return "zh-CN";
	}
	return "en";
}

export function initI18n(locale?: Locale): void {
	currentLocale = locale ?? detectSystemLocale();
}

export function setLanguage(locale: Locale): void {
	currentLocale = locale;
}

export function getLanguage(): Locale {
	return currentLocale;
}

export function t(key: string, params?: Record<string, string>): string {
	const localeData = translations[currentLocale] as Record<string, string> | undefined;
	let value: string | undefined;
	if (localeData && key in localeData) {
		value = localeData[key];
	}
	if (value === undefined) {
		const enTranslations = translations.en as Record<string, string> | undefined;
		value = enTranslations?.[key];
	}
	if (value === undefined) {
		value = key;
	}
	if (params) {
		for (const paramKey of Object.keys(params)) {
			value = value.replaceAll(`{${paramKey}}`, params[paramKey]!);
		}
	}
	return value;
}
