<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandlerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\RateLimiter\RateLimiterFactory;


class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private MailerInterface $mailer,
        private ParameterBagInterface $params,
        #[Autowire(service: 'limiter.magic_link_request_by_email')]
    	   private RateLimiterFactory $magicLinkLimiter
    ) {}

    #[Route('/login', name: 'app_login')]
    public function login(
        LoginLinkHandlerInterface $loginLinkHandler,
        Request $request
    ): Response {
        // GET -> formulaire
        if (!$request->isMethod('POST')) {
            return $this->render('auth/login.html.twig');
        }

        // POST -> demande d'envoi du magic link

        // 1) Anti-abus: Rate-limit par couple (email|ip)
        $rawEmail = (string) $request->request->get('email', '');
        $email = trim(mb_strtolower($rawEmail));
        $key = sprintf('%s|%s', $email ?: 'empty', $request->getClientIp() ?? 'noip');

       $limiter = $this->magicLinkLimiter->create($key);
        $limit = $limiter->consume(1); // coûte 1 jeton

        if (!$limit->isAccepted()) {
            // Temps d'attente conseillé (arrondi)
            $retryAfter = $limit->getRetryAfter();
            $waitSec = max(1, $retryAfter?->getTimestamp() - time());
            $this->addFlash('error', sprintf('Trop de demandes. Réessayez dans ~%d secondes.', $waitSec));
            return $this->redirectToRoute('app_login');
        }

        // 2) Validation email (basique pour l’UX – on évite l’énumération)
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // On reste neutre : même message final que si succès pour éviter l'énumération.
            $this->addFlash('success', '📧 Si un compte existe, un lien a été envoyé. Vérifiez votre boîte mail.');
            return $this->redirectToRoute('app_login');
        }

        // 3) Consentement remember-me (checkbox NON pré-cochée côté Twig)
        //    On stocke le choix dans la session, qui sera lu dans le LoginLinkAuthenticator après le clic.
        $remember = (bool) $request->request->get('remember_me', false);
        $request->getSession()->set('auth.remember_me.requested', $remember);

        // (Optionnel) journaliser la preuve de consentement de manière minimale
        // $this->logger->info('remember_me_consent', [
        //     'email' => hash('sha256', $email), // minimisation
        //     'remember' => $remember,
        //     'ts' => time(),
        // ]);

        // 4) Trouver ou créer l'utilisateur (si tu veux éviter la création auto, change le repo)
        $displayName = trim((string) $request->request->get('display_name', ''));
        $user = $this->userRepository->findOrCreateByEmail($email, $displayName ?: null);

        // 5) Générer le login link selon la config security.yaml (lifetime/max_uses…)
        $loginLinkDetails = $loginLinkHandler->createLoginLink($user);
        $loginUrl = $loginLinkDetails->getUrl();
        $expiresAt = $loginLinkDetails->getExpiresAt(); // source de vérité

        // 6) Envoyer l’email (ou afficher le lien en dev)
        $emailMessage = (new Email())
            ->from($this->params->get('mailer_from'))
            ->to($email)
            ->subject('🔐 Votre lien de connexion Doc2Sail')
            ->html($this->renderView('auth/magic_link_email.html.twig', [
                'loginUrl'    => $loginUrl,
                'expiresAt'   => $expiresAt, // <-- on utilise la vraie expiration
                'displayName' => $user->getDisplayName(),
            ]));

        try {
            $this->mailer->send($emailMessage);
            // Message neutre (pas d’info de présence compte) — conforme anti-énumération
            $this->addFlash('success', '📧 Si un compte existe, un lien a été envoyé. Vérifiez votre boîte mail.');
        } catch (\Throwable $e) {
            // En dev, on peut exposer le lien pour tests
            $this->addFlash('info', sprintf(
                '⚠️ Email non configuré (dev). Utilisez ce lien : <a href="%s" class="link link-primary" rel="nofollow noopener">%s</a>',
                htmlspecialchars($loginUrl, ENT_QUOTES),
                htmlspecialchars($loginUrl, ENT_QUOTES)
            ));
        }

        return $this->redirectToRoute('app_login');
    }

    #[Route('/login_check', name: 'app_login_check')]
    public function check(): never
    {
        // Intercepté par Security (login_link)
        throw new \LogicException('This code should never be reached');
    }

    #[Route('/logout', name: 'app_logout')]
    public function logout(): never
    {
        // Intercepté par Security
        throw new \LogicException('This code should never be reached');
    }
}
