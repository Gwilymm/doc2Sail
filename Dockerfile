FROM dunglas/frankenphp:1-php8.3

# Installer les extensions PHP nécessaires
RUN install-php-extensions \
	pdo_mysql \
	gd \
	intl \
	zip \
	opcache

# Installer Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /app

# Copier les fichiers du projet
COPY ./ .

ENV COMPOSER_ALLOW_SUPERUSER=1

# Désactiver le runtime FrankenPHP pour le dev (on utilisera le serveur PHP classique)
# ENV APP_RUNTIME=Runtime\\FrankenPhpSymfony\\Runtime
# ENV FRANKENPHP_CONFIG="worker ./public/index.php"

ENV SERVER_NAME=:80

RUN composer install --no-scripts

# Créer le dossier var avec les bonnes permissions
RUN mkdir -p var/cache var/log var/tmp && \
    chmod -R 777 var

# Exécuter les scripts Symfony après avoir tout installé
RUN php bin/console cache:clear --no-warmup && \
    php bin/console cache:warmup
