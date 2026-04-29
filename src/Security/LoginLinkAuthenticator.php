<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandlerInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

class LoginLinkAuthenticator extends AbstractAuthenticator implements AuthenticationEntryPointInterface
{
    public function __construct(
        private LoginLinkHandlerInterface $loginLinkHandler,
        private UrlGeneratorInterface $urlGenerator
    ) {}

    public function supports(Request $request): ?bool
    {
        // Supporte la route de "vérification" du magic link
        return $request->attributes->get('_route') === 'app_login_check';
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        // Récupère / Consomme l'utilisateur depuis le lien de connexion
        $user = $this->loginLinkHandler->consumeLoginLink($request);

        // Construction du passport sans mot de passe (SelfValidating)
        $passport = new SelfValidatingPassport(
            new UserBadge(
                $user->getUserIdentifier(),
                fn () => $user
            )
        );

        // RGPD — Ajout remember_me UNIQUEMENT si consentement (checkbox)
        $consented = (bool) ($request->getSession()->remove('auth.remember_me.requested') ?? false);
        if ($consented) {
            $passport->addBadge(new RememberMeBadge());
        }

        return $passport;
    }

    public function onAuthenticationSuccess(Request $request, $token, string $firewallName): ?RedirectResponse
    {
        // ✅ Redirection après connexion réussie
        return new RedirectResponse($this->urlGenerator->generate('app_home'));
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?RedirectResponse
    {
        // ❌ En cas d’échec (lien invalide / expiré)
        $request->getSession()->getFlashBag()->add('error', 'Lien expiré ou invalide. Veuillez redemander un lien.');
        return new RedirectResponse($this->urlGenerator->generate('app_login'));
    }
    public function start(Request $request, ?AuthenticationException $authException = null): RedirectResponse
{
    return new RedirectResponse($this->urlGenerator->generate('app_login'));
}

}
