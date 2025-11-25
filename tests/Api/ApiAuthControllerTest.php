<?php

namespace App\Tests\Api;

use App\Api\ApiAuthController;
use App\Entity\MagicLink;
use App\Entity\User;
use App\Repository\MagicLinkRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;
use Symfony\Component\RateLimiter\Policy\SlidingWindowLimiter;
use Symfony\Component\RateLimiter\RateLimit;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class ApiAuthControllerTest extends TestCase
{
	private function createAcceptingRateLimiter(): RateLimiterFactoryInterface
	{
		$factory = $this->createMock(RateLimiterFactoryInterface::class);
		$limiter = new SlidingWindowLimiter('test', 100, new \DateInterval('PT1H'), new InMemoryStorage());
		$factory->method('create')->willReturn($limiter);
		return $factory;
	}

	private function createBlockingRateLimiter(): RateLimiterFactoryInterface
	{
		$factory = $this->createMock(RateLimiterFactoryInterface::class);
		$limiter = new SlidingWindowLimiter('test', 10, new \DateInterval('PT1H'), new InMemoryStorage());
		// Consommer tous les tokens pour simuler la limite atteinte
		for ($i = 0; $i < 10; $i++) {
			$limiter->consume(1);
		}
		$factory->method('create')->willReturn($limiter);
		return $factory;
	}
	private function createController(
		?EntityManagerInterface $em = null,
		?UserRepository $userRepo = null,
		?MagicLinkRepository $magicLinkRepo = null,
		?JWTTokenManagerInterface $jwtManager = null,
		?MailerInterface $mailer = null,
		?ParameterBagInterface $params = null,
		?CacheInterface $cache = null,
		?RateLimiterFactoryInterface $rateLimiter = null
	): ApiAuthController {
		$controller = new ApiAuthController(
			$em ?? $this->createMock(EntityManagerInterface::class),
			$userRepo ?? $this->createMock(UserRepository::class),
			$magicLinkRepo ?? $this->createMock(MagicLinkRepository::class),
			$jwtManager ?? $this->createMock(JWTTokenManagerInterface::class),
			$mailer ?? $this->createMock(MailerInterface::class),
			$params ?? $this->createMock(ParameterBagInterface::class),
			$cache ?? $this->createMock(CacheInterface::class),
			$rateLimiter ?? $this->createMock(RateLimiterFactoryInterface::class)
		);

		// Injecter un container avec Twig pour renderView()
		$twig = $this->createMock(\Twig\Environment::class);
		$twig->method('render')->willReturn('<html>Email content</html>');

		$container = $this->createMock(\Symfony\Component\DependencyInjection\ContainerInterface::class);
		$container->method('has')->willReturnCallback(function ($id) {
			return $id === 'twig';
		});
		$container->method('get')->willReturnCallback(function ($id) use ($twig) {
			return $id === 'twig' ? $twig : null;
		});
		$controller->setContainer($container);

		return $controller;
	}

	public function testRequestMagicLinkSuccess(): void
	{
		$email = 'test@example.com';
		$request = new Request([], [], [], [], [], [], json_encode(['email' => $email]));
		$request->setMethod('POST');

		$user = $this->createMock(User::class);
		$user->method('getId')->willReturn(1);

		$userRepo = $this->createMock(UserRepository::class);
		$userRepo->expects($this->once())
			->method('findOrCreateByEmail')
			->with($email, null)
			->willReturn($user);

		$magicLinkRepo = $this->createMock(MagicLinkRepository::class);
		$magicLinkRepo->expects($this->once())
			->method('invalidateUserActiveLinks')
			->with(1)
			->willReturn(0);

		$em = $this->createMock(EntityManagerInterface::class);
		$em->expects($this->once())->method('persist')->with($this->isInstanceOf(MagicLink::class));
		$em->expects($this->once())->method('flush');

		$mailer = $this->createMock(MailerInterface::class);
		$mailer->expects($this->once())->method('send');

		$params = $this->createMock(ParameterBagInterface::class);
		$params->method('get')->willReturnMap([
			['mailer_from', 'noreply@doc2sail.com'],
			['kernel.environment', 'test']
		]);

		$rateLimiter = $this->createAcceptingRateLimiter();

		$controller = $this->createController($em, $userRepo, $magicLinkRepo, null, $mailer, $params, null, $rateLimiter);

		$response = $controller->request($request);

		$this->assertInstanceOf(JsonResponse::class, $response);
		$this->assertEquals(200, $response->getStatusCode());

		$data = json_decode($response->getContent(), true);
		$this->assertTrue($data['success']);
		$this->assertArrayHasKey('expiresIn', $data);
	}

	public function testRequestMagicLinkWithInvalidEmail(): void
	{
		$request = new Request([], [], [], [], [], [], json_encode(['email' => 'invalid-email']));
		$request->setMethod('POST');

		$rateLimiter = $this->createAcceptingRateLimiter();

		$controller = $this->createController(rateLimiter: $rateLimiter);

		$response = $controller->request($request);

		$this->assertEquals(200, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertTrue($data['success']);
		// Message neutre pour éviter énumération
	}

	public function testRequestMagicLinkRateLimitExceeded(): void
	{
		$request = new Request([], [], [], [], [], [], json_encode(['email' => 'test@example.com']));
		$request->setMethod('POST');

		$rateLimiter = $this->createBlockingRateLimiter();

		$controller = $this->createController(rateLimiter: $rateLimiter);

		$response = $controller->request($request);

		$this->assertEquals(429, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertArrayHasKey('error', $data);
		$this->assertArrayHasKey('retryAfter', $data);
	}

	public function testVerifyMagicLinkSuccess(): void
	{
		$email = 'test@example.com';
		$code = 'ABC123';
		$emailHash = hash('sha256', $email);

		$request = new Request([], [], [], [], [], [], json_encode(['email' => $email, 'code' => $code]));
		$request->setMethod('POST');

		$user = $this->createMock(User::class);
		$user->method('getId')->willReturn(1);
		$user->method('getDisplayName')->willReturn('Test User');
		$user->method('getRoles')->willReturn(['ROLE_USER']);

		$magicLink = $this->createMock(MagicLink::class);
		$magicLink->method('isValid')->willReturn(true);
		$magicLink->method('getEmailHash')->willReturn($emailHash);
		$magicLink->method('getUser')->willReturn($user);
		$magicLink->expects($this->once())->method('incrementUseCount');

		$magicLinkRepo = $this->createMock(MagicLinkRepository::class);
		$magicLinkRepo->expects($this->once())
			->method('findByShortCode')
			->with($code)
			->willReturn($magicLink);

		$em = $this->createMock(EntityManagerInterface::class);
		$em->expects($this->once())->method('flush');

		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$jwtManager->expects($this->once())
			->method('create')
			->with($user)
			->willReturn('fake.jwt.token');

		$cache = $this->createMock(CacheInterface::class);
		$cache->method('get')->willReturn(0);
		$cache->method('delete')->willReturn(true);

		$rateLimiter = $this->createAcceptingRateLimiter();

		$controller = $this->createController($em, null, $magicLinkRepo, $jwtManager, null, null, $cache);

		$response = $controller->verify($request, $rateLimiter);

		$this->assertEquals(200, $response->getStatusCode());

		$data = json_decode($response->getContent(), true);
		$this->assertArrayHasKey('token', $data);
		$this->assertEquals('fake.jwt.token', $data['token']);
		$this->assertArrayHasKey('user', $data);
		$this->assertEquals(1, $data['user']['id']);
	}

	public function testVerifyMagicLinkWithMissingEmail(): void
	{
		$request = new Request([], [], [], [], [], [], json_encode(['code' => '123456']));
		$request->setMethod('POST');

		$rateLimiter = $this->createAcceptingRateLimiter();

		$controller = $this->createController();

		$response = $controller->verify($request, $rateLimiter);

		$this->assertEquals(400, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertStringContainsString('Email et code requis', $data['error']);
	}

	public function testVerifyMagicLinkWithInvalidCode(): void
	{
		$email = 'test@example.com';
		$code = 'INVALID';

		$request = new Request([], [], [], [], [], [], json_encode(['email' => $email, 'code' => $code]));
		$request->setMethod('POST');

		$magicLinkRepo = $this->createMock(MagicLinkRepository::class);
		$magicLinkRepo->expects($this->once())
			->method('findByShortCode')
			->with($code)
			->willReturn(null);

		$cache = $this->createMock(CacheInterface::class);
		$cache->method('get')->willReturn(5); // Simule des tentatives précédentes
		$cache->method('delete')->willReturn(true); // Allow delete calls

		$rateLimiter = $this->createAcceptingRateLimiter();

		$controller = $this->createController(cache: $cache, magicLinkRepo: $magicLinkRepo);

		$response = $controller->verify($request, $rateLimiter);

		$this->assertEquals(401, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertStringContainsString('Code invalide ou expiré', $data['error']);
	}

	public function testVerifyMagicLinkWithWrongEmail(): void
	{
		$email = 'attacker@evil.com';
		$correctEmail = 'victim@example.com';
		$code = 'ABC123';
		$correctEmailHash = hash('sha256', $correctEmail);

		$request = new Request([], [], [], [], [], [], json_encode(['email' => $email, 'code' => $code]));
		$request->setMethod('POST');

		$magicLink = $this->createMock(MagicLink::class);
		$magicLink->method('isValid')->willReturn(true);
		$magicLink->method('getEmailHash')->willReturn($correctEmailHash);

		$magicLinkRepo = $this->createMock(MagicLinkRepository::class);
		$magicLinkRepo->expects($this->once())
			->method('findByShortCode')
			->with($code)
			->willReturn($magicLink);

		$cache = $this->createMock(CacheInterface::class);
		$cache->method('get')->willReturn(3); // Quelques tentatives précédentes
		$cache->method('delete')->willReturn(true); // Allow delete calls

		$rateLimiter = $this->createAcceptingRateLimiter();

		$controller = $this->createController(cache: $cache, magicLinkRepo: $magicLinkRepo);

		$response = $controller->verify($request, $rateLimiter);

		$this->assertEquals(401, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertStringContainsString('Code invalide ou expiré', $data['error']);
	}

	public function testVerifyMagicLinkRateLimitExceeded(): void
	{
		$request = new Request([], [], [], [], [], [], json_encode(['email' => 'test@example.com', 'code' => 'ABC123']));
		$request->setMethod('POST');

		$rateLimiter = $this->createBlockingRateLimiter();

		$controller = $this->createController();

		$response = $controller->verify($request, $rateLimiter);

		$this->assertEquals(429, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertStringContainsString('Trop de tentatives', $data['error']);
	}

	public function testVerifyMagicLinkIpBlockedAfter10Failures(): void
	{
		$email = 'test@example.com';
		$code = 'ABC123';
		$emailHash = hash('sha256', $email); // Email CORRECT

		$request = new Request([], [], [], [], [], ['REMOTE_ADDR' => '192.168.1.1'], json_encode(['email' => $email, 'code' => $code]));
		$request->setMethod('POST');

		$user = $this->createMock(User::class);
		$user->method('getId')->willReturn(1);

		$magicLink = $this->createMock(MagicLink::class);
		$magicLink->method('isValid')->willReturn(true);
		$magicLink->method('getEmailHash')->willReturn($emailHash); // Email correspondant
		$magicLink->method('getUser')->willReturn($user);

		$magicLinkRepo = $this->createMock(MagicLinkRepository::class);
		$magicLinkRepo->method('findByShortCode')->willReturn($magicLink);

		// Simuler 10 échecs = IP bloquée
		$cache = $this->createMock(CacheInterface::class);
		$cache->method('get')->willReturn(10); // 10 tentatives échouées

		$em = $this->createMock(EntityManagerInterface::class);
		$em->expects($this->never())->method('flush'); // Ne devrait jamais réussir

		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$jwtManager->expects($this->never())->method('create'); // Ne devrait jamais créer de JWT

		$rateLimiter = $this->createAcceptingRateLimiter(); // Rate limit OK mais IP bloquée

		$controller = $this->createController($em, null, $magicLinkRepo, $jwtManager, null, null, $cache);

		$response = $controller->verify($request, $rateLimiter);

		$this->assertEquals(429, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertStringContainsString('bloqué', $data['error']);
	}
}
