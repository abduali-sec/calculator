# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0.] - 2026-08-20
- Initial stable release.
- Features:
  - Multilingual GUI (English / Русский).
  - Basic arithmetic: addition, subtraction, multiplication, division, decimals.
  - Parentheses and exponentiation (^).
  - Scientific functions: sqrt, x², 1/x, %, sin, cos, tan, log (base10), ln, abs.
  - Memory functions: MC, MR, M+.
  - History panel stored in `localStorage` with clickable entries.
  - Keyboard support (digits, operators, Enter, Backspace, Escape).
  - Degrees / Radians toggle with persistence.
  - Accessibility improvements: focus styles, ARIA attributes, keyboard navigation.
  - Copy result to clipboard via click; toast feedback.

### Notes
- The evaluator maps functions to JavaScript `Math` and contains basic input sanitization. Avoid pasting untrusted code into the expression field.

---

# Изменения

Все важные изменения проекта фиксируются в этом файле.

## [1.0.0.] - 2026-08-20
- Первоначальный стабильный релиз.
- Возможности:
  - Графический интерфейс с поддержкой русского и английского языков.
  - Базовые операции: +, -, ×, ÷, дробные числа.
  - Скобки и возведение в степень (^).
  - Научные функции: sqrt, x², 1/x, %, sin, cos, tan, log (по основанию 10), ln, abs.
  - Память: MC, MR, M+.
  - Панель истории в `localStorage` с кликабельными записями.
  - Поддержка клавиатуры (цифры, операторы, Enter, Backspace, Escape).
  - Переключение градусов/радианов с сохранением.
  - Улучшения доступности: фокусные стили, ARIA, навигация с клавиатуры.
  - Копирование результата по клику; визуальное уведомление (toast).

Примечание: вычисления используют функции JavaScript `Math`; избегайте вставки непроверенного кода.
