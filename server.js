const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Конфигурация - вебхук будет передаваться через переменную окружения или параметр запроса
const BITRIX24_WEBHOOK = process.env.BITRIX24_WEBHOOK || '';

/**
 * Получение компаний из Bitrix24 с пагинацией
 * Bitrix24 возвращает максимум 50 записей за раз, поэтому используем пагинацию
 */
async function fetchCompaniesFromBitrix24(webhook, limit = 10000) {
  const companies = [];
  let start = 0;
  const batchSize = 50; // Bitrix24 максимум возвращает 50 записей за раз
  
  try {
    while (companies.length < limit) {
      const url = `${webhook}/crm.company.list`;
      const params = {
        start: start,
        order: { ID: 'ASC' },
        select: ['ID', 'TITLE', 'COMPANY_TYPE', 'INDUSTRY', 'EMPLOYEES', 'REVENUE', 'CURRENCY_ID', 'PHONE', 'EMAIL', 'WEB', 'ADDRESS', 'DATE_CREATE']
      };

      const response = await axios.post(url, params);
      
      if (!response.data || !response.data.result) {
        console.error('Ошибка ответа от Bitrix24:', response.data);
        break;
      }

      const batch = response.data.result;
      
      if (!batch || batch.length === 0) {
        // Больше нет данных
        break;
      }

      companies.push(...batch);
      start += batchSize;

      // Если получили меньше batchSize, значит это последняя страница
      if (batch.length < batchSize) {
        break;
      }

      // Небольшая задержка чтобы не перегружать API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return companies.slice(0, limit); // Ограничиваем до запрошенного лимита
  } catch (error) {
    console.error('Ошибка при получении компаний:', error.message);
    if (error.response) {
      console.error('Детали ошибки:', error.response.data);
    }
    throw error;
  }
}

// API endpoint для получения компаний
app.post('/api/fetch-companies', async (req, res) => {
  try {
    const webhook = req.body.webhook || BITRIX24_WEBHOOK;
    
    if (!webhook) {
      return res.status(400).json({ 
        error: 'Вебхук не указан. Укажите webhook в теле запроса или установите переменную окружения BITRIX24_WEBHOOK' 
      });
    }

    console.log('Начинаем получение компаний из Bitrix24...');
    const companies = await fetchCompaniesFromBitrix24(webhook, 10000);
    
    console.log(`Получено компаний: ${companies.length}`);
    
    res.json({
      success: true,
      count: companies.length,
      companies: companies
    });
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'Неизвестная ошибка'
    });
  }
});

// GET endpoint для проверки статуса
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Сервер работает',
    webhook_configured: !!BITRIX24_WEBHOOK
  });
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Вебхук из переменной окружения: ${BITRIX24_WEBHOOK ? 'Настроен' : 'Не настроен'}`);
});

