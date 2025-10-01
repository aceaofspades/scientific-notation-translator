# Scientific Notation Translator

Scientific Notation Translator lets you quickly switch between standard numbers and scientific notation using a hotkey (default: **Alt + T**).

## Features

- **Standalone numerals only** are translated (not part of identifiers like `v1`, `Hello_World_003`, etc.).
- **Selections:**  
  - If a selection contains standard numerals, they are converted to scientific notation.  
  - If no qualifying plain numbers are present but scientific notation numbers are, they are converted back to plain numbers.  
- **No selection:** Applies to the entire file.  
- **Thresholds:**  
  - By default, only numbers **> 999** or **< 0.01** are translated.  
  - Thresholds can be customized in settings.  
- **Always convert mode:** Option to translate *all* standalone numbers regardless of thresholds.  
- **Round-trip toggle:** Same command converts standard → sci, or sci → standard.  
- **Configurable precision:** Significant digits for scientific notation are configurable (default: 5, range 1–21).  
- **Clean formatting:** No unnecessary trailing zeros.
- **Formatting flexability:** Converting to scientific notation can be customized to use 'e' or 'E' (1e+4 vs 1E+4).

## Extension Settings

This extension contributes the following settings:

- `scientific-notation-translator.significantDigits`  
  *Integer, default: 5* — Number of significant digits in scientific notation.
  - Note that granularity will be lost past this digit when translated (IE: 123456789 -> 1.2346e+8 -> 123460000).

- `scientific-notation-translator.lowerThreshold`  
  *Number, default: 0.01* — Numbers with absolute value less than this threshold convert to scientific notation.

- `scientific-notation-translator.upperThreshold`  
  *Number, default: 999* — Numbers with absolute value greater than this threshold convert to scientific notation.

- `scientific-notation-translator.alwaysConvertAllNumbers`  
  *Boolean, default: false* — If true, all standalone numbers convert regardless of thresholds.

- `scientific-notation-translator.capitalE`  
  *Boolean, default: false* — If true, 'E' will be used in scientific notation instead of 'e'.

## Known Issues

- None reported yet. Please open issues on the repository if you encounter unexpected behavior.

## Release Notes

### 1.0.0
- Hello World!
