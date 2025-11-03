<?php

namespace App\Tests\Controller;

use PHPUnit\Framework\TestCase;
use App\Controller\ContactController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email as MimeEmail;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Psr\Log\LoggerInterface;
use App\Entity\ContactMessage;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class ContactControllerTest extends TestCase
{
	public function testContactPostSuccess()
	{
		$payload = [
			'name' => 'Alice',
			'email' => 'alice@example.com',
			'subject' => 'Hello',
			'message' => 'This is a test message',
			'_csrf_token' => 'token',
		];

		$request = new Request([], [], [], [], [], [], json_encode($payload));
		$request->setMethod('POST');

		// CSRF manager mock: accept the token
		$csrf = $this->createMock(CsrfTokenManagerInterface::class);
		$csrf->method('isTokenValid')->willReturn(true);

		// Translator: return a predictable string for assertions
		$translator = $this->createMock(TranslatorInterface::class);
		$translator->method('trans')->willReturnCallback(function ($key) {
			// Return a string including the key so we can assert it's used
			return "translated:" . $key;
		});

		// Entity manager: expect persist and flush to be called once
		$em = $this->createMock(EntityManagerInterface::class);
		$em->expects($this->once())->method('persist')->with($this->isInstanceOf(ContactMessage::class));
		$em->expects($this->once())->method('flush');

		$doctrine = $this->createMock(ManagerRegistry::class);
		$doctrine->method('getManager')->willReturn($em);

		// Mailer: expect send called once with an Email instance
		$mailer = $this->createMock(MailerInterface::class);
		$mailer->expects($this->once())->method('send')->with($this->callback(function ($arg) {
			return $arg instanceof MimeEmail;
		}));

		// Logger: should not be called on success
		$logger = $this->createMock(LoggerInterface::class);
		$logger->expects($this->never())->method('error');

		$controller = new ContactController();

		$response = $controller->contact($request, $mailer, $doctrine, $csrf, $translator, $logger);

		$this->assertInstanceOf(JsonResponse::class, $response);
		$this->assertEquals(200, $response->getStatusCode());

		$data = json_decode($response->getContent(), true);
		$this->assertIsArray($data);
		$this->assertArrayHasKey('success', $data);
		$this->assertTrue($data['success']);
		$this->assertArrayHasKey('message', $data);
		$this->assertStringStartsWith('translated:base.contact.success', $data['message']);
	}

	public function testCsrfFailureReturnsBadRequest()
	{
		$payload = [
			'name' => 'Bob',
			'email' => 'bob@example.com',
			'subject' => 'Hi',
			'message' => 'Valid message',
			'_csrf_token' => 'bad',
		];

		$request = new Request([], [], [], [], [], [], json_encode($payload));
		$request->setMethod('POST');

		$csrf = $this->createMock(CsrfTokenManagerInterface::class);
		$csrf->method('isTokenValid')->willReturn(false);

		$translator = $this->createMock(TranslatorInterface::class);
		$translator->method('trans')->willReturnCallback(function ($key) {
			return "translated:" . $key;
		});

		// Other services shouldn't be invoked, but provide mocks
		$doctrine = $this->createMock(ManagerRegistry::class);
		$mailer = $this->createMock(MailerInterface::class);
		$logger = $this->createMock(LoggerInterface::class);

		$controller = new ContactController();

		$response = $controller->contact($request, $mailer, $doctrine, $csrf, $translator, $logger);

		$this->assertEquals(400, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertFalse($data['success']);
		$this->assertStringStartsWith('translated:base.contact.error_invalid_csrf', $data['error']);
	}

	public function testInvalidEmailReturnsBadRequest()
	{
		$payload = [
			'name' => 'Eve',
			'email' => 'not-an-email',
			'subject' => 'Hi',
			'message' => 'Valid message',
			'_csrf_token' => 'token',
		];

		$request = new Request([], [], [], [], [], [], json_encode($payload));
		$request->setMethod('POST');

		$csrf = $this->createMock(CsrfTokenManagerInterface::class);
		$csrf->method('isTokenValid')->willReturn(true);

		$translator = $this->createMock(TranslatorInterface::class);
		$translator->method('trans')->willReturnCallback(function ($key) {
			return "translated:" . $key;
		});

		$doctrine = $this->createMock(ManagerRegistry::class);
		$mailer = $this->createMock(MailerInterface::class);
		$logger = $this->createMock(LoggerInterface::class);

		$controller = new ContactController();

		$response = $controller->contact($request, $mailer, $doctrine, $csrf, $translator, $logger);

		$this->assertEquals(400, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertFalse($data['success']);
		$this->assertStringStartsWith('translated:base.contact.error_invalid_email', $data['error']);
	}

	public function testShortMessageReturnsBadRequest()
	{
		$payload = [
			'name' => 'Dan',
			'email' => 'dan@example.com',
			'subject' => 'Hi',
			'message' => 'a',
			'_csrf_token' => 'token',
		];

		$request = new Request([], [], [], [], [], [], json_encode($payload));
		$request->setMethod('POST');

		$csrf = $this->createMock(CsrfTokenManagerInterface::class);
		$csrf->method('isTokenValid')->willReturn(true);

		$translator = $this->createMock(TranslatorInterface::class);
		$translator->method('trans')->willReturnCallback(function ($key) {
			return "translated:" . $key;
		});

		$doctrine = $this->createMock(ManagerRegistry::class);
		$mailer = $this->createMock(MailerInterface::class);
		$logger = $this->createMock(LoggerInterface::class);

		$controller = new ContactController();

		$response = $controller->contact($request, $mailer, $doctrine, $csrf, $translator, $logger);

		$this->assertEquals(400, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertFalse($data['success']);
		$this->assertStringStartsWith('translated:base.contact.error_short_message', $data['error']);
	}

	public function testMailerFailureReturnsServerErrorAndLogs()
	{
		$payload = [
			'name' => 'Frank',
			'email' => 'frank@example.com',
			'subject' => 'Hi',
			'message' => 'This is long enough',
			'_csrf_token' => 'token',
		];

		$request = new Request([], [], [], [], [], [], json_encode($payload));
		$request->setMethod('POST');

		$csrf = $this->createMock(CsrfTokenManagerInterface::class);
		$csrf->method('isTokenValid')->willReturn(true);

		$translator = $this->createMock(TranslatorInterface::class);
		$translator->method('trans')->willReturnCallback(function ($key) {
			return "translated:" . $key;
		});

		// Entity manager: expect persist and flush
		$em = $this->createMock(EntityManagerInterface::class);
		$em->expects($this->once())->method('persist')->with($this->isInstanceOf(ContactMessage::class));
		$em->expects($this->once())->method('flush');

		$doctrine = $this->createMock(ManagerRegistry::class);
		$doctrine->method('getManager')->willReturn($em);

		// Mailer: throw TransportExceptionInterface
		$mailer = $this->createMock(MailerInterface::class);
		$transportEx = new class('boom') extends \RuntimeException implements TransportExceptionInterface {
			public function getDebug(): string
			{
				return '';
			}
			public function appendDebug(string $debug): void
			{ /* noop */
			}
		};
		$mailer->method('send')->will($this->throwException($transportEx));

		$logger = $this->createMock(LoggerInterface::class);
		$logger->expects($this->once())->method('error');

		$controller = new ContactController();

		$response = $controller->contact($request, $mailer, $doctrine, $csrf, $translator, $logger);

		$this->assertEquals(500, $response->getStatusCode());
		$data = json_decode($response->getContent(), true);
		$this->assertFalse($data['success']);
		$this->assertStringStartsWith('translated:base.contact.error_generic', $data['error']);
	}
}
