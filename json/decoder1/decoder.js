// decoder.js — финальная версия с рекурсивным декодированием строк внутри JSON
document.addEventListener('DOMContentLoaded', () => {
  const input     = document.getElementById('input');
  const output    = document.getElementById('output');
  const error     = document.getElementById('error');
  const copyBtn   = document.getElementById('copyBtn');
  const decodeBtn = document.getElementById('decodeBtn');
  const clearBtn  = document.getElementById('clearBtn');

  function showError(msg) {
    error.textContent = msg;
    error.style.color = '#dc2626';
  }

  function showSuccess(msg) {
    error.textContent = msg;
    error.style.color = '#059669';
  }

  function clearMessages() {
    error.textContent = '';
  }

  // Рекурсивная функция: снимаем лишний escape со всех строковых значений
  function deepDecodeStrings(obj) {
    if (typeof obj === 'string') {
      // Снимаем двойное экранирование: "\\u041f..." → "\u041f..." → "П..."
      try {
        return JSON.parse('"' + obj + '"');
      } catch (e) {
        return obj; // если не получилось — оставляем как есть
      }
    }
    if (Array.isArray(obj)) {
      return obj.map(deepDecodeStrings);
    }
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, deepDecodeStrings(v)])
      );
    }
    return obj;
  }

  function decode() {
    let raw = input.value.trim();
    clearMessages();
    copyBtn.style.display = 'none';

    if (!raw) {
      output.textContent = 'Вставьте строку из Redis';
      return;
    }

    // 1. Убираем внешние кавычки от redis-cli
    let text = raw;
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }

    // 2. Убираем экранирование кавычек внутри (\" → ")
    text = text.replace(/\\"/g, '"');

    // 3. Опционально: фикс двойных слешей для geometry (можно включить, если нужно)
    // text = text.replace(/\\\\/g, '\\');

    // 4. Первый парс — получаем объект
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      showError('JSON.parse провалился после очистки \\":\n' + e.message);
      output.textContent = text.substring(0, 800) + '...';
      return;
    }

    // 5. Рекурсивно декодируем все строки внутри объекта
    const decodedData = deepDecodeStrings(data);

    // 6. Выводим результат
    output.textContent = JSON.stringify(decodedData, null, 2);
    copyBtn.style.display = 'block';

    showSuccess('Успешно! Кириллица декодирована (Поступило, Душанбе, Миҷгона и т.д.)');
  }

  function copyResult() {
    navigator.clipboard.writeText(output.textContent)
      .then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Скопировано ✓';
        setTimeout(() => copyBtn.textContent = orig, 1600);
      })
      .catch(() => showError('Не удалось скопировать'));
  }

  function clearAll() {
    input.value = '';
    output.textContent = 'Ожидаю данные...';
    clearMessages();
    copyBtn.style.display = 'none';
  }

  decodeBtn.addEventListener('click', decode);
  clearBtn.addEventListener('click', clearAll);
  copyBtn.addEventListener('click', copyResult);

  input.addEventListener('paste', () => setTimeout(decode, 80));

  input.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      decode();
    }
  });
});
