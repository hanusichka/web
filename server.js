
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Налаштування підключення до бази даних
const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'web', 
  password: '16092004', 
  port: 5432, 
});

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Обробка реєстрації
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length > 0) {
        return res.json({ success: false, message: 'Користувач з таким логіном вже існує!' });
      }
      await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
      res.json({ success: true, message: 'Реєстрація успішна!' });
    } catch (error) {
      console.error('Помилка під час реєстрації:', error);
      res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
  });
  
  // Обробка авторизації
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // отримую користувача з бази даних
        const userResult = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );
        
        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id; //  userId
            res.json({ success: true, message: 'Авторизація успішна!', userId });
        } else {
            res.json({ success: false, message: 'Невірний логін або пароль!' });
        }
    } catch (error) {
        console.error('Помилка під час авторизації:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

  app.post('/api/solve-gauss', async (req, res) => {
    const { matrix, b, userId } = req.body;
    try {
        const result = solveGauss(matrix, b);
        // Записуємо результат у базу даних
        const dbResult = await pool.query(
            'INSERT INTO history (user_id, matrix, b, result) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, JSON.stringify(matrix), JSON.stringify(b), JSON.stringify(result)]
        );

        if (dbResult.rowCount > 0) {
            res.json({ success: true, result, message: 'Результат успішно записано в базу даних' });
        } else {
            res.json({ success: false, message: 'Не вдалося записати результат в базу даних' });
        }
    } catch (error) {
        console.error('Помилка обчислення методом Гауса:', error);
        res.status(500).json({ success: false, message: 'Помилка обчислення' });
    }
});

  
  // Метод Гауса на сервері
function solveGauss(matrix, b) {
    const n = matrix.length;
    const matrix1 = matrix.map(row => [...row]);  
    const b1 = [...b];  
  
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(matrix1[k][i]) > Math.abs(matrix1[maxRow][i])) {
          maxRow = k;
        }
      }
  
      [matrix1[i], matrix1[maxRow]] = [matrix1[maxRow], matrix1[i]];
      [b1[i], b1[maxRow]] = [b1[maxRow], b1[i]];
  
      for (let k = i + 1; k < n; k++) {
        const factor = matrix1[k][i] / matrix1[i][i];
        for (let j = i; j < n; j++) {
          matrix1[k][j] -= factor * matrix1[i][j];
        }
        b1[k] -= factor * b1[i];
      }
    }
  
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = b1[i] / matrix1[i][i];
      for (let k = i - 1; k >= 0; k--) {
        b1[k] -= matrix1[k][i] * x[i];
      }
    }
  
    return x.map((val, index) => `x[${index + 1}] = ${val.toFixed(4)}`);
  }
  
// Обробка розв'язання СЛАР методом Гауса
app.post('/api/solve-gauss', async (req, res) => {
    const { matrix, b, userId } = req.body; 
    try {
        const result = solveGauss(matrix, b);
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Відсутній userId, обчислення не збережено' });
          }
          console.log(`userId = ${userId}`);
        await pool.query(
            'INSERT INTO history (user_id, matrix, b, result) VALUES ($1, $2, $3, $4)',
            [userId, JSON.stringify(matrix), JSON.stringify(b), JSON.stringify(result)]
        );
        res.json({ success: true, result });
    } catch (error) {
        console.error('Помилка обчислення методом Гауса:', error);
        res.status(500).json({ success: false, message: 'Помилка обчислення' });
    }
});

// Отримати історію обчислень для конкретного користувача
app.get('/api/history/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            'SELECT matrix, b, result FROM history WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, history: result.rows });
        } else {
            res.json({ success: false, message: 'Історія пуста' });
        }
    } catch (error) {
        console.error('Помилка при отриманні історії:', error);
        res.status(500).json({ success: false, message: 'Помилка при отриманні історії' });
    }
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});



//балансер nginx
// pico /opt/homebrew/etc/nginx/nginx.conf
// sudo nginx -t
// sudo nginx -s reload
// curl -I http://localhost
