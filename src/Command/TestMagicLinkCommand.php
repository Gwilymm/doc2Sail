<?php

namespace App\Command;

use App\Repository\UserRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Signature\SignatureHasher;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandler;
use Twig\Environment;

#[AsCommand(
	name: 'app:test-magic-link',
	description: 'Test l\'envoi d\'un Magic Link complet',
)]
class TestMagicLinkCommand extends Command
{
	private LoginLinkHandler $loginLinkHandler;
	public function __construct(
		private UserRepository $userRepository,
		private MailerInterface $mailer,
		private RouterInterface $router,
		#[Autowire(service: 'security.user.provider.concrete.app_user_provider')]
		private UserProviderInterface $userProvider,
		#[Autowire(service: 'security.authenticator.login_link_signature_hasher.main')]
		private SignatureHasher $signatureHasher,
		private Environment $twig,
		private string $mailerFrom
	) {
		parent::__construct();

		// Build a concrete, firewall-agnostic handler for CLI context
		$this->loginLinkHandler = new LoginLinkHandler(
			$this->router,
			$this->userProvider,
			$this->signatureHasher,
			[
				'check_route' => 'app_login_check',
				'signature_properties' => ['id'],
				'lifetime' => 900,
				'max_uses' => 3,
			]
		);
	}

	protected function configure(): void
	{
		$this
			->addArgument('email', InputArgument::REQUIRED, 'Adresse email de test')
			->setHelp('Cette commande génère un Magic Link et l\'envoie par email.');
	}

	protected function execute(InputInterface $input, OutputInterface $output): int
	{
		$io = new SymfonyStyle($input, $output);
		$email = $input->getArgument('email');

		$io->title('🪄 Test Magic Link - Doc2Sail');
		$io->text(sprintf('Test pour : <info>%s</info>', $email));

		// Trouver ou créer l'utilisateur
		$user = $this->userRepository->findOrCreateByEmail($email, 'Utilisateur Test');
		
		$io->section('1. Utilisateur');
		$io->table(
			['Propriété', 'Valeur'],
			[
				['ID', $user->getId()],
				['Email', $email], // Use the parameter since email is hashed in the entity
				['Nom', $user->getDisplayName()],
			]
		);

	// Générer le login link
	$io->section('2. Génération du Magic Link');
	$loginLinkDetails = $this->loginLinkHandler->createLoginLink($user);
	$loginUrl = $loginLinkDetails->getUrl();
		
		$io->text([
			sprintf('🔗 <comment>%s</comment>', $loginUrl),
			sprintf('⏱️  Expire dans : <info>15 minutes</info>'),
			sprintf('♻️  Utilisations max : <info>3</info>'),
		]);

		// Préparer l'email
		$io->section('3. Préparation de l\'email');
		$expiresAt = new \DateTimeImmutable('+15 minutes');
		
		$emailMessage = (new Email())
			->from($this->mailerFrom)
			->to($email)
			->subject('🔐 Votre lien de connexion Doc2Sail')
			->text(sprintf("Bonjour,\n\nCliquez sur ce lien pour vous connecter :\n%s\n\nCe lien expire le %s\n\nCordialement,\nDoc2Sail", 
				$loginUrl, 
				$expiresAt->format('d/m/Y à H:i:s')
			))
			->html($this->twig->render('auth/magic_link_email.html.twig', [
				'loginUrl' => $loginUrl,
				'expiresAt' => $expiresAt,
				'displayName' => $user->getDisplayName()
			]));

		$io->table(
			['Propriété', 'Valeur'],
			[
				['De', $this->mailerFrom],
				['À', $email],
				['Sujet', '🔐 Votre lien de connexion Doc2Sail'],
				['Expire le', $expiresAt->format('d/m/Y à H:i:s')],
			]
		);

		// Envoyer l'email
		$io->section('4. Envoi de l\'email');
		try {
			$io->text('Envoi en cours...');
			$this->mailer->send($emailMessage);
			$io->text('✓ Méthode send() exécutée sans exception');
			
			$io->success([
				'✅ Magic Link envoyé avec succès !',
				'',
				'📧 Vérifiez votre boîte mail',
				'',
				sprintf('🔗 Lien de test : %s', $loginUrl),
			]);

			return Command::SUCCESS;
		} catch (\Exception $e) {
			$io->error([
				'❌ Impossible d\'envoyer l\'email',
				'',
				sprintf('Erreur : %s', $e->getMessage()),
				sprintf('Trace : %s', $e->getTraceAsString()),
				'',
				'✅ Mais le Magic Link a été généré :',
				sprintf('🔗 %s', $loginUrl),
			]);

			return Command::FAILURE;
		}
	}
}
