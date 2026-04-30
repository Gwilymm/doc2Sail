FROM dunglas/frankenphp:1-php8.4-alpine AS composer-builder

WORKDIR /app

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

RUN install-php-extensions \
    pdo_sqlite \
    intl \
    zip \
    xsl \
    gmp

COPY composer.json composer.lock symfony.lock ./

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN composer install \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

COPY . .

RUN composer dump-autoload

FROM node:22-alpine AS assets-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

COPY package.json pnpm-lock.yaml ./
COPY --from=composer-builder /app/vendor ./vendor

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM dunglas/frankenphp:1-php8.4-alpine

ENV APP_ENV=dev \
    COMPOSER_ALLOW_SUPERUSER=1 \
    SERVER_NAME=:80

WORKDIR /app

RUN install-php-extensions \
    pdo_sqlite \
    opcache \
    intl \
    zip \
    gd \
    xsl \
    gmp \
    apcu

COPY --from=composer-builder /app/vendor ./vendor
COPY . .
COPY --from=assets-builder /app/public/build ./public/build

RUN mkdir -p var/cache var/log var/tmp public/uploads && \
    chown -R www-data:www-data var public/uploads && \
    chmod -R 775 var public/uploads && \
    echo "upload_max_filesize=50M" > /usr/local/etc/php/conf.d/99-upload-size.ini && \
    echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/99-upload-size.ini

EXPOSE 80
