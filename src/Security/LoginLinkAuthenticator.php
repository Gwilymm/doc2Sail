<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\SelfValidatingBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\UserBadge;
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandlerInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;

class LoginLinkAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private LoginLinkHandlerInterface $loginLinkHandler,
        private UserProviderInterface $userProvider
    ) {}

    public function supports(Request $request): ?bool
    {
        // Supporte la route de vérification du magic link
        return $request->attributes->get('_route') === 'app_login_check';
    }

    public function authenticate(Request $request): Passport
    {
        // Récupère l'utilisateur à partir du login link
        $user = $this->loginLinkHandler->consumeLoginLink($request);
        if (!$user) {
            throw new UserNotFoundException('Utilisateur non trouvé ou lien invalide.');
        }
        $passport = new Passport(
            new UserBadge($user->getUserIdentifier()),
            new SelfValidatingBadge()
        );

        // RGPD: Ajoute le badge remember-me UNIQUEMENT si consentement explicite
        $consented = (bool) ($request->getSession()->remove('auth.remember_me.requested') ?? false);
        if ($consented) {
            $passport->addBadge(new RememberMeBadge());
        }
        return $passport;
    }

    public function onAuthenticationSuccess(Request $request, $token, string $firewallName): ?\Symfony\Component\HttpFoundation\Response
    {
        // Redirige vers la page d'accueil après succès
        return null;
    }

    public function onAuthenticationFailure(Request $request, \Symfony\Component\Security\Core\Exception\AuthenticationException $exception): ?\Symfony\Component\HttpFoundation\Response
    {
        // Redirige vers la page de login en cas d'échec
        return null;
    }
}
