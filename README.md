
# 📱 Doc2Sail

**Doc2Sail** is a modern Progressive Web App (PWA) for managing and sharing sailing regatta documents. It offers a simple, mobile-friendly, and secure interface for clubs and event organizers.

## ✨ Main Features

- 🔒 Magic link authentication (passwordless login)
- 📁 Document management (PDF, Word, Excel, images)
- 🔍 Instant search and filtering
- 🖥️ Two interfaces: public view and admin panel
- � Installable PWA (offline support, icon, notifications)
- 🏷️ Rich metadata (name, description, date, size)
- 🗑️ Upload, delete, and organize files

## 🛠️ Tech Stack

- **Backend**: Symfony 7, Doctrine ORM, SQLite
- **Frontend**: Tailwind CSS 4, DaisyUI, Stimulus, Turbo
- **Build**: Webpack Encore
- **Deployment**: Docker, Docker Compose

## � Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/doc2Sail.git
cd doc2Sail

# Install PHP dependencies
composer install

# Install JS dependencies
pnpm install

# Create the database and run migrations
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Build assets
pnpm run build
```

## 🏁 Running the App

```bash
# Start the Symfony server
symfony server:start

# Or with native PHP
php -S localhost:8000 -t public/
```

- Public access: http://localhost:8000/
- Admin access: http://localhost:8000/admin

## 📂 Project Structure

- `assets/`: JS, CSS, Stimulus controllers
- `public/`: static files, uploads, manifest, service worker
- `src/`: Symfony logic (controllers, entities, services)
- `templates/`: Twig views
- `var/`: SQLite database, cache, logs

## 🎨 Design & UX

- Responsive, mobile-first
- Light/dark themes
- Modern UI with DaisyUI

## 🔐 Permissions

```bash
chmod -R 777 var/
chmod -R 777 public/uploads/
```

## 📱 PWA Installation

1. Open the app in a compatible browser
2. Click “Install app” or add to home screen

## � Troubleshooting

- **Assets not built**: `pnpm run build`
- **Missing database**: `php bin/console doctrine:database:create && php bin/console doctrine:migrations:migrate`
- **Upload issues**: check permissions on `var/` and `public/uploads/`

## 📝 License

Proprietary – for club/association internal use.
