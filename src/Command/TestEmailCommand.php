<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[AsCommand(
	name: 'app:test-email',
	description: 'Test l\'envoi d\'email avec la configuration actuelle',
)]
class TestEmailCommand extends Command
{
	public function __construct(
		private MailerInterface $mailer
	) {
		parent::__construct();
	}

	protected function configure(): void
	{
		$this
			->addArgument('email', InputArgument::REQUIRED, 'Adresse email de destination')
			->setHelp('Cette commande envoie un email de test pour vérifier la configuration du mailer.');
	}

	protected function execute(InputInterface $input, OutputInterface $output): int
	{
	$io = new SymfonyStyle($input, $output);
	$email = $input->getArgument('email');

	$io->title('🧪 Test d\'envoi d\'email - Doc2Sail');
	$io->text(sprintf('Envoi d\'un email de test à : <info>%s</info>', $email));

	$message = (new Email())
		->from($_ENV['MAILER_FROM'] ?? 'contact@doc2sail.com')
		->to($email)
		->subject('🧪 Email de test - Doc2Sail')
		->html($this->getTestEmailHtml());		try {
			$this->mailer->send($message);

			$io->success([
				sprintf('✅ Email envoyé avec succès à %s', $email),
				'',
				'Si vous utilisez MailHog, consultez : http://localhost:8025',
				'Si vous utilisez Mailtrap, consultez votre inbox sur mailtrap.io',
			]);

			return Command::SUCCESS;
		} catch (\Exception $e) {
			$io->error([
				'Impossible d\'envoyer l\'email',
				'',
				sprintf('Erreur : %s', $e->getMessage()),
				'',
				'Vérifiez votre configuration MAILER_DSN dans .env.local',
				'Consultez EMAIL_CONFIG.md pour les instructions',
			]);

			return Command::FAILURE;
		}
	}

	private function getTestEmailHtml(): string
	{
		return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email de test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        h1 {
            color: #0284c7;
            margin: 0;
        }
        .success {
            background: #dcfce7;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .info {
            background: #e0f2fe;
            border-left: 4px solid #0284c7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://doc2sail.com/icon-192.png" alt="Doc2Sail" style="width: 80px; height: 80px;">
            </div>
            <h1>Doc2Sail 25</h1>
        </div>

        <h2>🧪 Email de test</h2>
        
        <div class="success">
            <strong>✅ Succès !</strong><br>
            Si vous recevez cet email, votre configuration de messagerie fonctionne correctement.
        </div>

        <div class="info">
            <strong>📋 Informations :</strong><br>
            • Cet email a été envoyé depuis la commande <code>app:test-email</code><br>
            • Date : {$this->getCurrentDateTime()}<br>
            • Application : Doc2Sail<br>
            • Environnement : Développement
        </div>

        <p>Vous pouvez maintenant utiliser le système de Magic Link pour vous connecter !</p>

        <div class="footer">
            <p>Doc2Sail - Gestion documentaire pour régates de voile</p>
            <p>🔒 Conforme RGPD - Email crypté Argon2id</p>
        </div>
    </div>
</body>
</html>
HTML;
	}

	private function getCurrentDateTime(): string
	{
		return (new \DateTime())->format('d/m/Y à H:i:s');
	}
}
