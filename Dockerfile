FROM dunglas/frankenphp:1-php8.3

# Préparer l'environnement pour apt non interactif
ENV DEBIAN_FRONTEND=noninteractive

# Mettre à jour les paquets et installer les dépendances système nécessaires
# Ces paquets fournissent les headers/libs que install-php-extensions recherche
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	build-essential \
	pkg-config \
	libicu-dev \
	libzip-dev \
	libmbedtls-dev \
	libpng-dev \
	libjpeg-dev \
	libfreetype6-dev \
	libxml2-dev \
	zlib1g-dev \
	&& rm -rf /var/lib/apt/lists/*

# Installer les extensions PHP nécessaires (install-php-extensions gère les modules PECL)
RUN install-php-extensions \
	pdo_mysql \
	pdo_sqlite \
	gd \
	intl \
	zip \
	opcache \
	xsl \
	gmp

# Installer Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /app

# Copier les fichiers du projet
COPY ./ .

ENV COMPOSER_ALLOW_SUPERUSER=1

# Désactiver le runtime FrankenPHP pour le dev (on utilisera le serveur PHP classique)
#ENV APP_RUNTIME=Runtime\\FrankenPhpSymfony\\Runtime
#ENV FRANKENPHP_CONFIG="worker ./public/index.php"

ENV SERVER_NAME=:80

RUN composer install --no-scripts


