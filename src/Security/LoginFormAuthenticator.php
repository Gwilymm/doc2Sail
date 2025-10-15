<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

class LoginFormAuthenticator extends AbstractAuthenticator implements AuthenticationEntryPointInterface
{
	public function __construct(
		private UrlGeneratorInterface $urlGenerator
	) {}

	public function supports(Request $request): ?bool
	{
		// This authenticator doesn't actually authenticate, it just redirects
		return false;
	}

	public function authenticate(Request $request): Passport
	{
		throw new \Exception('This should not be called');
	}

	public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
	{
		return null;
	}

	public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
	{
		return new RedirectResponse($this->urlGenerator->generate('app_login'));
	}

	/**
	 * Called when authentication is needed, but the user is not authenticated yet.
	 */
	public function start(Request $request, ?AuthenticationException $authException = null): Response
	{
		// Redirect to login page when authentication is required
		return new RedirectResponse($this->urlGenerator->generate('app_login'));
	}
}
