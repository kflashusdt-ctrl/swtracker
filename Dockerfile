FROM php:8.2-cli

# Install Node.js (for Vite) and Postgres extension (for Supabase)
RUN apt-get update && apt-get install -y libpq-dev nodejs npm \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /app

COPY . .

RUN npm install && npm run build:render

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "router.php"]