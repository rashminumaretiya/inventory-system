import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locals/en.json";
import gu from "./locals/gu.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: ["en", "gu"],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
      },
      gu: {
        translation: gu,
      },
    },
  });

export default i18n;
