import I18n from "i18n";
import React from "react";

type TranslationFunction = typeof I18n.__;

export default React.createContext<TranslationFunction | undefined>(undefined);
