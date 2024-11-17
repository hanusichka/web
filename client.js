// Функція для логіну
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();

        if (data.success) {
            const userId = data.userId; 
            console.log('User ID:', userId); 

            if (userId) {
                localStorage.setItem('userId', userId);
            }

            window.location.href = '/dashboard.html';
        } else {
            document.getElementById('message').textContent = data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Помилка сервера';
    }
}

  
  // Функція для реєстрації
  function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
  
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          window.location.href = '/dashboard.html';
        } else {
          document.getElementById('message').textContent = data.message;
        }
      })
      .catch((error) => console.error('Error:', error));
  }
  
  // Функція для розв'язання СЛАР методом Гауса
  function solveGauss() {
    const size = parseInt(document.getElementById('matrix-size').value);
    const matrix = [];
    const b = [];
  
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        const elementId = `a_${i}_${j}`;
        const value = parseFloat(document.getElementById(elementId).value);
        row.push(isNaN(value) ? 0 : value); // Перевірка на NaN
      }
      matrix.push(row);
  
      const bElementId = `b_${i}`;
      const bValue = parseFloat(document.getElementById(bElementId).value);
      b.push(isNaN(bValue) ? 0 : bValue);
    }
  
    // Відправлення запиту на сервер
    fetch('/api/solve-gauss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matrix, b }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          document.getElementById('result').textContent = data.result.join('\n');
        } else {
          document.getElementById('result').textContent = data.message || 'Помилка обчислення';
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        document.getElementById('result').textContent = 'Помилка сервера';
      });
  }
  
  // Функція для генерації полів вводу матриці
function generateMatrix() {
    const size = parseInt(document.getElementById('matrix-size').value);
    const matrixInputs = document.getElementById('matrix-inputs');
    matrixInputs.innerHTML = ''; 

    for (let i = 0; i < size; i++) {
        const row = document.createElement('div');
        row.className = 'matrix-row';

        for (let j = 0; j < size; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = `a[${i + 1}][${j + 1}]`;
            input.id = `a_${i}_${j}`; 
            row.appendChild(input);
        }

        // поле для вектора 
        const bInput = document.createElement('input');
        bInput.type = 'number';
        bInput.placeholder = `b[${i + 1}]`;
        bInput.id = `b_${i}`;  
        row.appendChild(bInput);

        matrixInputs.appendChild(row);
    }
}

// Функція для збору значень та відправки запиту на сервер
async function solveGauss() {
    const size = parseInt(document.getElementById('matrix-size').value);
    const matrix = [];
    const b = [];
    const userId = localStorage.getItem('userId'); // Отримуємо userId з локального сховища

    // Збираю значення матриці
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const value = parseFloat(document.getElementById(`a_${i}_${j}`).value);
            row.push(isNaN(value) ? 0 : value); 
        }
        matrix.push(row);

        const bValue = parseFloat(document.getElementById(`b_${i}`).value);
        b.push(isNaN(bValue) ? 0 : bValue); 
    }

    // Відправляю запит на сервер
    try {
        const response = await fetch('/api/solve-gauss', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ matrix, b, userId }), 
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById('result').innerText = result.result.join('\n');
            loadHistory();
        } else {
            document.getElementById('result').innerText = result.message || 'Помилка обчислення';
        }
    } catch (error) {
        console.error('Помилка запиту:', error);
        document.getElementById('result').innerText = 'Помилка під час обчислення';
    }
}

// Функція для завантаження історії
async function loadHistory() {
    const userId = localStorage.getItem('userId');
    try {
        const response = await fetch(`/api/history/${userId}`);
        const data = await response.json();

        if (data.success) {
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = ''; 
            data.history.forEach(entry => {
                const li = document.createElement('li');
                
                // перевіряєю чи є entry.result масивом
                const resultText = Array.isArray(entry.result) ? entry.result.join(', ') : entry.result;

                li.innerText = `Матриця: ${JSON.stringify(entry.matrix)}\nВектор b: ${JSON.stringify(entry.b)}\nРезультат: ${resultText}`;
                historyList.appendChild(li);
            });
        } else {
            console.error('Помилка завантаження історії');
        }
    } catch (error) {
        console.error('Помилка запиту історії:', error);
    }
}
