# Multilingual GUI Calculator

Version 1.1.0

This project is a standalone, browser-based calculator with a graphical interface and support for English and Russian languages. Recent updates add a local To-Do manager with recurrence rules (RRULE), Pomodoro timer and history (Chart.js), encrypted GitHub Gist sharing, and many UI/bug fixes.

Features
- Basic arithmetic: +, -, ×, ÷, decimal
- Parentheses and power (^)
- Scientific: sqrt, x², 1/x, %, sin, cos, tan, log (base10), ln, abs
- Memory: MC, MR, M+
- History (stored in localStorage)
- Language switching: English / Русский
- Degrees / Radians toggle
 - To-Do manager with RRULE recurrence support and templates
 - Pomodoro timer with sound, desktop notifications and history chart (Chart.js)
 - Import/Export tasks (JSON/CSV), local encrypted GitHub token for private Gist sharing
 - Graphical plotter, algebra and matrix tools, unit converter, and other calculator modes

How to use
1. Start a local HTTP server and open `index.html` in your browser, for example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```
2. Use the buttons or click to build expressions.
3. Press `=` to evaluate.
4. Toggle language via the selector in the header.

Notes
- The evaluator maps common math functions to JavaScript's `Math` methods and performs basic input sanitization. Do not paste untrusted code into the expression field.

License
Free to use and modify.

Русский

Этот проект — простой GUI-калькулятор в браузере с поддержкой русского и английского языков.

Как использовать
1. Откройте [calculator.html](calculator.html) в браузере.
2. Вводите выражение кнопками.
3. Нажмите `=` для вычисления.
