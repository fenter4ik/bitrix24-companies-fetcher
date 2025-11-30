// Пример конфигурационного файла
// Скопируйте этот файл в config.js и укажите ваш вебхук

module.exports = {
  // Вебхук Bitrix24
  // Формат: https://ваш-портал.bitrix24.ru/rest/1/ваш-код/
  BITRIX24_WEBHOOK: 'https://b24-ugt0oo.bitrix24.by/rest/1/o8c4pqguii2x9czx/',
  
  // Порт сервера
  PORT: 3000,
  
  // Максимальное количество компаний для получения
  MAX_COMPANIES: 10000,
  
  // Размер батча для пагинации (максимум 50 для Bitrix24)
  BATCH_SIZE: 50,
  
  // Задержка между запросами (мс)
  REQUEST_DELAY: 100
};

